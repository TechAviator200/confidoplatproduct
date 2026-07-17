// Thin HTTP adapter for cancellation. Resolves patient via phone + DOB (D1),
// then delegates to cancelAppointment. Per D6, discharge does NOT block cancel —
// the validator pipeline is not run here. Only existence check matters.
import type { Request, Response } from "express";
import { lookupPatient } from "../../tools/contracts/lookupPatient";
import { cancelAppointment } from "../../tools/contracts/cancelAppointment";

export function cancelAppointmentRoute(req: Request, res: Response): void {
  const { phone, dob_confirmation } = req.body ?? {};

  if (typeof phone !== "string" || typeof dob_confirmation !== "string") {
    res.status(400).json({ error: "phone and dob_confirmation are required strings" });
    return;
  }

  const lookup = lookupPatient({ phone, dobConfirmation: dob_confirmation });
  if (lookup.status !== "verified") {
    res.status(200).json({ status: lookup.status });
    return;
  }

  const result = cancelAppointment(lookup.patient);
  res.status(200).json(result);
}
