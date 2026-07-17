// Thin HTTP adapter for front-desk transfers. Returns the static destination number
// and the caller-provided reason for logging. The actual phone number is sourced
// from clinic-config/clinicInfo.ts via transferCall — never hardcoded in this file.
import type { Request, Response } from "express";
import { transferCall } from "../../tools/contracts/transferCall";

export function transferFrontDeskRoute(req: Request, res: Response): void {
  const { reason } = req.body ?? {};

  if (typeof reason !== "string") {
    res.status(400).json({ error: "reason is required string" });
    return;
  }

  const result = transferCall("front_desk", reason);
  res.status(200).json(result);
}
