// Thin HTTP adapter over the existing lookupPatient business logic. No identity
// verification logic is duplicated here — see tools/contracts/lookupPatient.ts,
// which owns the actual phone-lookup + DOB-confirmation rule (D1).
import type { Request, Response } from "express";
import { lookupPatient } from "../../tools/contracts/lookupPatient";

export function lookupPatientRoute(req: Request, res: Response): void {
  const { phone, dob } = req.body ?? {};

  if (typeof phone !== "string" || typeof dob !== "string") {
    res.status(400).json({ error: "phone and dob are required strings" });
    return;
  }

  const result = lookupPatient({ phone, dobConfirmation: dob });
  res.status(200).json(result);
}
