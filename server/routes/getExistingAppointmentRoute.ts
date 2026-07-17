// Thin HTTP adapter for reading an existing appointment back to the caller.
// Used in reschedule and cancel flows so the agent can confirm what's on file
// before mutating it. Resolves identity via phone + DOB (D1), then delegates to
// confirmAppointment (read-only, D9). No mutation.
import type { Request, Response } from "express";
import { lookupPatient } from "../../tools/contracts/lookupPatient";
import { confirmAppointment } from "../../tools/contracts/confirmAppointment";

export function getExistingAppointmentRoute(req: Request, res: Response): void {
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

  const result = confirmAppointment(lookup.patient);
  res.status(200).json(result);
}
