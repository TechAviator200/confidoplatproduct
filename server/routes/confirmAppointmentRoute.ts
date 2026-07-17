// Thin HTTP adapter composing two existing functions — lookupPatient (identity gate,
// D1) and confirmAppointment (read-only appointment lookup, D9). Neither is
// reimplemented here; this file only sequences the two calls and passes their
// results straight through.
import type { Request, Response } from "express";
import { lookupPatient } from "../../tools/contracts/lookupPatient";
import { confirmAppointment } from "../../tools/contracts/confirmAppointment";

export function confirmAppointmentRoute(req: Request, res: Response): void {
  const { phone, dob } = req.body ?? {};

  if (typeof phone !== "string" || typeof dob !== "string") {
    res.status(400).json({ error: "phone and dob are required strings" });
    return;
  }

  const lookup = lookupPatient({ phone, dobConfirmation: dob });

  // D1: do not expose appointment details unless phone and DOB match.
  if (lookup.status !== "verified") {
    res.status(200).json({ status: lookup.status });
    return;
  }

  const result = confirmAppointment(lookup.patient);
  res.status(200).json(result);
}
