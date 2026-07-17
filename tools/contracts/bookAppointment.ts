// Composes the deterministic validator pipeline (see DECISIONS.md D2) for a new
// booking or a reschedule:
//
//   classifyPatient -> validateAge -> validateInsurance -> validateProviderContinuity
//   -> validateBooking -> [book]
//
// Covers Riverbend Rules 1, 2, 3, 4, 5, 6, 7, 8.
import { classifyPatient } from "../validators/classifyPatient";
import { validateAge } from "../validators/validateAge";
import { validateInsurance } from "../validators/validateInsurance";
import { validateProviderContinuity } from "../validators/validateProviderContinuity";
import { validateBooking } from "../validators/validateBooking";
import { getAvailability, type AvailabilitySlot } from "./getAvailability";
import type { PatientRecord, ProviderId, Weekday } from "../../clinic-config/types";

export interface BookAppointmentInput {
  patient: PatientRecord;
  /** null = no preference; route to the patient's default provider. */
  requestedProvider: ProviderId | null;
  /** Only relevant when requestedProvider === "crane" (Rule 6). */
  requestedDay?: Weekday;
  /** Verbal confirmation the caller has their insurance card / policy number (Rule 3). */
  hasPolicyNumberConfirmed: boolean;
  today?: Date;
  action?: "book" | "reschedule";
  /**
   * The exact slot the caller confirmed, taken directly from a prior get_availability
   * response. When provided, this slot is used as-is and no second getAvailability
   * call is made. When absent, falls back to the soonest available slot (legacy path,
   * retained for test compatibility).
   */
  selectedSlot?: AvailabilitySlot;
}

export type BookAppointmentResult =
  | {
      status: "booked";
      provider: ProviderId;
      durationMinutes: 15 | 30;
      slot: AvailabilitySlot;
    }
  | { status: "blocked"; reason: string; escalateToFrontDesk?: boolean };

export function bookAppointment(input: BookAppointmentInput): BookAppointmentResult {
  const today = input.today ?? new Date();
  const action = input.action ?? "book";

  const classification = classifyPatient(input.patient.lastSeen, today);
  const age = validateAge(input.patient.dob, today);
  const insurance = validateInsurance({
    active: input.patient.insurance.active,
    hasPolicyNumberConfirmed: input.hasPolicyNumberConfirmed,
  });
  const providerContinuity = validateProviderContinuity({
    classification,
    assignedProvider: input.patient.assignedProvider,
    requestedProvider: input.requestedProvider,
    requestedDay: input.requestedDay,
  });

  const booking = validateBooking({
    discharged: input.patient.flags.includes("discharged"),
    action,
    upstream: { age, insurance, providerContinuity },
  });

  if (!booking.valid) {
    return {
      status: "blocked",
      reason: booking.reason ?? "Booking blocked.",
      escalateToFrontDesk: booking.escalateToFrontDesk,
    };
  }

  const routedProvider = providerContinuity.routedProvider;
  if (!routedProvider) {
    return { status: "blocked", reason: "No provider could be routed for this request." };
  }

  // Use the caller-confirmed slot when available; otherwise fall back to the first
  // slot from a fresh getAvailability call. The fallback exists only for unit tests
  // and local tooling — the Retell tool contract marks selected_slot as required so
  // the LLM path always provides it.
  const durationMinutes: 15 | 30 = classification === "new_patient" ? 30 : 15;
  let slot: AvailabilitySlot | undefined;
  if (input.selectedSlot) {
    slot = input.selectedSlot;
  } else {
    const availability = getAvailability({ provider: routedProvider, classification, today });
    slot = availability.slots[0];
  }

  if (!slot) {
    return { status: "blocked", reason: "No availability found in the search window." };
  }

  return {
    status: "booked",
    provider: routedProvider,
    durationMinutes,
    slot,
  };
}
