// Reschedule = cancel-and-rebook against the same validator pipeline as booking, but
// requires an existing mock appointment on file first.
import { appointments } from "../../clinic-config/appointments";
import { bookAppointment, type BookAppointmentInput, type BookAppointmentResult } from "./bookAppointment";

export type RescheduleAppointmentResult = BookAppointmentResult | { status: "not_found" };

export function rescheduleAppointment(
  input: Omit<BookAppointmentInput, "action">
): RescheduleAppointmentResult {
  const existing = appointments.find((a) => a.patientPhone === input.patient.phone);
  if (!existing) {
    return { status: "not_found" };
  }

  return bookAppointment({ ...input, action: "reschedule" });
}
