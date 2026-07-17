// Source: source-materials/Clinic-Pack (1) (1).pdf — "Transfers & escalation"
import { transferTargets } from "../../clinic-config/clinicInfo";

export type TransferTarget = "front_desk" | "nurse_line";

export interface TransferCallResult {
  target: TransferTarget;
  number: string;
  reason: string;
}

export function transferCall(target: TransferTarget, reason: string): TransferCallResult {
  const number = target === "front_desk" ? transferTargets.frontDesk : transferTargets.nurseLine;
  return { target, number, reason };
}
