// See DECISIONS.md D9: "confirm" is a read-back of an existing appointment. It never
// mutates anything.
import { appointments } from "../../clinic-config/appointments";
import { providers } from "../../clinic-config/providers";
import type { PatientRecord } from "../../clinic-config/types";

export type ConfirmAppointmentResult =
  | { status: "confirmed"; provider: string; location: string; datetime: string }
  | { status: "not_found" };

export function confirmAppointment(patient: PatientRecord): ConfirmAppointmentResult {
  const existing = appointments.find((a) => a.patientPhone === patient.phone);
  if (!existing) {
    return { status: "not_found" };
  }

  const provider = providers.find((p) => p.id === existing.provider);
  return {
    status: "confirmed",
    provider: provider ? provider.name : existing.provider,
    location: existing.location,
    datetime: existing.datetime,
  };
}
