// See DECISIONS.md D6: Riverbend Rule 8 (discharge) blocks book/reschedule, not cancel —
// there's no policy reason to trap a discharged caller who just wants to cancel.
import { appointments } from "../../clinic-config/appointments";
import type { PatientRecord } from "../../clinic-config/types";

export type CancelAppointmentResult =
  | { status: "cancelled"; appointmentId: string }
  | { status: "not_found" };

export function cancelAppointment(patient: PatientRecord): CancelAppointmentResult {
  const existing = appointments.find((a) => a.patientPhone === patient.phone);
  if (!existing) {
    return { status: "not_found" };
  }
  return { status: "cancelled", appointmentId: existing.id };
}
