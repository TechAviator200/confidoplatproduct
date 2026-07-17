// Thin HTTP adapter over runSchedulingWorkflow. Accepts raw Retell-tool parameters
// (phone, dob_confirmation, etc.) and delegates all business logic to the existing
// orchestrator in tools/contracts/runSchedulingWorkflow.ts — nothing is reimplemented
// here. The "routedProvider" field is renamed to "routed_provider" in the response
// for snake_case consistency with other tool responses.
import type { Request, Response } from "express";
import { runSchedulingWorkflow } from "../../tools/contracts/runSchedulingWorkflow";
import type { ProviderId, Weekday } from "../../clinic-config/types";

const VALID_PROVIDERS = new Set(["whitfield", "brooks", "raman", "ellis", "crane", "mendez"]);
const VALID_DAYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);

export function runSchedulingWorkflowRoute(req: Request, res: Response): void {
  const { phone, dob_confirmation, has_policy_number_confirmed, requested_provider, requested_day } =
    req.body ?? {};

  if (typeof phone !== "string" || typeof dob_confirmation !== "string") {
    res.status(400).json({ error: "phone and dob_confirmation are required strings" });
    return;
  }
  if (typeof has_policy_number_confirmed !== "boolean") {
    res.status(400).json({ error: "has_policy_number_confirmed is required boolean" });
    return;
  }
  if (requested_provider !== undefined && requested_provider !== null && !VALID_PROVIDERS.has(requested_provider)) {
    res.status(400).json({ error: "requested_provider must be a valid provider id or null" });
    return;
  }
  if (requested_day !== undefined && !VALID_DAYS.has(requested_day)) {
    res.status(400).json({ error: "requested_day must be Mon|Tue|Wed|Thu|Fri" });
    return;
  }

  const result = runSchedulingWorkflow({
    phone,
    dobConfirmation: dob_confirmation,
    hasPolicyNumberConfirmed: has_policy_number_confirmed,
    requestedProvider: (requested_provider as ProviderId | null) ?? null,
    requestedDay: requested_day as Weekday | undefined,
  });

  // Flatten the result for Retell — keep snake_case throughout; strip the full
  // PatientRecord from the response (only the name is needed by the agent).
  if (result.outcome === "eligible") {
    res.status(200).json({
      outcome: "eligible",
      classification: result.classification,
      routed_provider: result.routedProvider,
      patient_name: result.patient.name,
    });
  } else {
    res.status(200).json({ outcome: result.outcome, reason: result.reason });
  }
}
