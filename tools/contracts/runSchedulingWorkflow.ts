// Orchestrates identity verification and the deterministic eligibility pipeline for a
// scheduling (booking) intent. This function does not implement any rule itself — it
// only sequences existing validators and stops at the first failure. See
// retell/AGENT_BEHAVIOR.md "Scheduling workflow" and "Tool calling strategy" for how
// this is meant to be used in conversation, and SOURCE_MAP.md for the rule-to-file
// trace of everything coordinated here.
//
// Pipeline (Riverbend Rules 1, 3, 4, 5, 6, 8; identity gate per D1):
//   lookupPatient -> classifyPatient -> validateAge -> validateInsurance
//   -> validateProviderContinuity -> validateBooking
//
// This function determines eligibility only. It does not search for availability or
// commit a booking — see bookAppointment.ts / rescheduleAppointment.ts for that.
import { lookupPatient } from "./lookupPatient";
import { classifyPatient } from "../validators/classifyPatient";
import { validateAge } from "../validators/validateAge";
import { validateInsurance } from "../validators/validateInsurance";
import { validateProviderContinuity } from "../validators/validateProviderContinuity";
import { validateBooking } from "../validators/validateBooking";
import type {
  PatientClassification,
  PatientRecord,
  ProviderId,
  Weekday,
} from "../../clinic-config/types";

export interface SchedulingIntent {
  phone: string;
  /** Caller-stated date of birth, ISO YYYY-MM-DD. Required before anything is exposed (D1). */
  dobConfirmation: string;
  /** null = no preference stated by the caller. */
  requestedProvider: ProviderId | null;
  /** Only relevant when requestedProvider === "crane" (Rule 6). */
  requestedDay?: Weekday;
  /** Verbal confirmation the caller has their insurance card / policy number (Rule 3). */
  hasPolicyNumberConfirmed: boolean;
  today?: Date;
}

export type SchedulingWorkflowResult =
  | {
      outcome: "eligible";
      patient: PatientRecord;
      classification: PatientClassification;
      /** null = no provider preference; any provider working the soonest slot is fine. */
      routedProvider: ProviderId | null;
    }
  | { outcome: "transfer_required"; reason: string }
  | { outcome: "ineligible"; reason: string };

export function runSchedulingWorkflow(intent: SchedulingIntent): SchedulingWorkflowResult {
  const today = intent.today ?? new Date();

  // D1: phone is an initial lookup only; DOB must be confirmed before any appointment
  // detail is exposed or acted on.
  const lookup = lookupPatient({ phone: intent.phone, dobConfirmation: intent.dobConfirmation });
  if (lookup.status === "not_found") {
    return { outcome: "ineligible", reason: "No matching patient record was found." };
  }
  if (lookup.status === "dob_mismatch") {
    return { outcome: "ineligible", reason: "Date of birth did not match the record on file." };
  }
  const patient = lookup.patient;

  // Riverbend Rule 1 — feeds validateProviderContinuity below; not itself a pass/fail gate.
  const classification = classifyPatient(patient.lastSeen, today);

  // Riverbend Rule 4 — stop immediately on failure.
  const age = validateAge(patient.dob, today);
  if (!age.valid) {
    return { outcome: "ineligible", reason: age.reason ?? "Age validation failed." };
  }

  // Riverbend Rule 3, D4 — stop immediately on failure.
  const insurance = validateInsurance({
    active: patient.insurance.active,
    hasPolicyNumberConfirmed: intent.hasPolicyNumberConfirmed,
  });
  if (!insurance.valid) {
    return { outcome: "ineligible", reason: insurance.reason ?? "Insurance validation failed." };
  }

  // Riverbend Rules 5, 6 — stop immediately on failure.
  const providerContinuity = validateProviderContinuity({
    classification,
    assignedProvider: patient.assignedProvider,
    requestedProvider: intent.requestedProvider,
    requestedDay: intent.requestedDay,
  });
  if (!providerContinuity.valid) {
    return {
      outcome: providerContinuity.escalateToFrontDesk ? "transfer_required" : "ineligible",
      reason: providerContinuity.reason ?? "Provider continuity validation failed.",
    };
  }

  // Riverbend Rule 8 — final gate, composes the upstream results above.
  const booking = validateBooking({
    discharged: patient.flags.includes("discharged"),
    action: "book",
    upstream: { age, insurance, providerContinuity },
  });
  if (!booking.valid) {
    return {
      outcome: booking.escalateToFrontDesk ? "transfer_required" : "ineligible",
      reason: booking.reason ?? "Booking validation failed.",
    };
  }

  return {
    outcome: "eligible",
    patient,
    classification,
    routedProvider: providerContinuity.routedProvider,
  };
}
