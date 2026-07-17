// Thin HTTP adapter for nurse-line transfers. Returns the static destination number
// and the caller-provided reason for logging. Same structure as transferFrontDeskRoute
// with a different target ("nurse_line"). See transferCall.ts for the number source.
import type { Request, Response } from "express";
import { transferCall } from "../../tools/contracts/transferCall";

export function transferNurseLineRoute(req: Request, res: Response): void {
  const { reason } = req.body ?? {};

  if (typeof reason !== "string") {
    res.status(400).json({ error: "reason is required string" });
    return;
  }

  const result = transferCall("nurse_line", reason);
  res.status(200).json(result);
}
