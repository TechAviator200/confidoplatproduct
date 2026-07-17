// Thin HTTP adapter over getAvailability. No identity verification required — the
// agent only reaches this step after run_scheduling_workflow confirms eligibility.
import type { Request, Response } from "express";
import { getAvailability } from "../../tools/contracts/getAvailability";
import type { PatientClassification, ProviderId } from "../../clinic-config/types";

const VALID_PROVIDERS = new Set(["whitfield", "brooks", "raman", "ellis", "crane", "mendez"]);
const VALID_CLASSIFICATIONS = new Set(["new_patient", "follow_up"]);

export function getAvailabilityRoute(req: Request, res: Response): void {
  const { provider, classification, days_to_search, max_slots } = req.body ?? {};

  if (typeof provider !== "string" || !VALID_PROVIDERS.has(provider)) {
    res.status(400).json({ error: "provider must be a valid provider id" });
    return;
  }
  if (typeof classification !== "string" || !VALID_CLASSIFICATIONS.has(classification)) {
    res.status(400).json({ error: "classification must be new_patient or follow_up" });
    return;
  }

  const result = getAvailability({
    provider: provider as ProviderId,
    classification: classification as PatientClassification,
    daysToSearch: typeof days_to_search === "number" ? days_to_search : undefined,
    maxSlots: typeof max_slots === "number" ? max_slots : undefined,
  });

  res.status(200).json({
    duration_minutes: result.durationMinutes,
    slots: result.slots,
  });
}
