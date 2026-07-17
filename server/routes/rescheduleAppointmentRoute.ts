// Thin HTTP adapter for rescheduling. Resolves patient via phone + DOB (D1),
// then delegates to rescheduleAppointment which requires an existing appointment
// on file and runs the full validator pipeline. No rule logic in this file.
import type { Request, Response } from "express";
import { lookupPatient } from "../../tools/contracts/lookupPatient";
import { rescheduleAppointment } from "../../tools/contracts/rescheduleAppointment";
import type { AvailabilitySlot } from "../../tools/contracts/getAvailability";
import type { ProviderId, Weekday } from "../../clinic-config/types";

const VALID_PROVIDERS = new Set(["whitfield", "brooks", "raman", "ellis", "crane", "mendez"]);
const VALID_DAYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);

export function rescheduleAppointmentRoute(req: Request, res: Response): void {
  const { phone, dob_confirmation, has_policy_number_confirmed, requested_provider, requested_day, selected_slot } =
    req.body ?? {};

  if (typeof phone !== "string" || typeof dob_confirmation !== "string") {
    res.status(400).json({ error: "phone and dob_confirmation are required strings" });
    return;
  }
  if (typeof has_policy_number_confirmed !== "boolean") {
    res.status(400).json({ error: "has_policy_number_confirmed is required boolean" });
    return;
  }
  if (requested_provider !== undefined && requested_provider !== null && !VALID_PROVIDERS.has(requested_provider)) {
    res.status(400).json({ error: "requested_provider must be a valid provider id or null" });
    return;
  }
  if (requested_day !== undefined && requested_day !== null && !VALID_DAYS.has(requested_day)) {
    res.status(400).json({ error: "requested_day must be Mon|Tue|Wed|Thu|Fri" });
    return;
  }

  // selected_slot is required — same enforcement as book_appointment. Absent or
  // invalid selected_slot must be rejected to prevent silently booking the wrong slot.
  if (
    selected_slot === undefined ||
    selected_slot === null ||
    typeof selected_slot !== "object" ||
    typeof selected_slot.date !== "string" ||
    typeof selected_slot.weekday !== "string" ||
    typeof selected_slot.provider !== "string" ||
    typeof selected_slot.location !== "string"
  ) {
    res.status(400).json({ error: "selected_slot is required: must be an object with string fields date, weekday, provider, location" });
    return;
  }
  const parsedSlot = selected_slot as AvailabilitySlot;

  const lookup = lookupPatient({ phone, dobConfirmation: dob_confirmation });
  if (lookup.status !== "verified") {
    res.status(200).json({ status: lookup.status });
    return;
  }

  const result = rescheduleAppointment({
    patient: lookup.patient,
    requestedProvider: (requested_provider as ProviderId | null) ?? null,
    requestedDay: requested_day as Weekday | undefined,
    hasPolicyNumberConfirmed: has_policy_number_confirmed,
    selectedSlot: parsedSlot,
  });

  res.status(200).json(result);
}
