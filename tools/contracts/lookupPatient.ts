// See DECISIONS.md D1: caller ID / phone number is an initial lookup only. Date of
// birth must be confirmed before the agent discusses or mutates any appointment detail.
import { patients } from "../../clinic-config/patients";
import type { PatientRecord } from "../../clinic-config/types";

export interface LookupPatientInput {
  phone: string;
  /** Caller-stated date of birth, ISO YYYY-MM-DD. */
  dobConfirmation: string;
}

export type LookupPatientResult =
  | { status: "verified"; patient: PatientRecord }
  | { status: "not_found" }
  | { status: "dob_mismatch" };

export function lookupPatient(input: LookupPatientInput): LookupPatientResult {
  const candidate = patients.find((p) => p.phone === input.phone);
  if (!candidate) {
    return { status: "not_found" };
  }
  if (candidate.dob !== input.dobConfirmation) {
    return { status: "dob_mismatch" };
  }
  return { status: "verified", patient: candidate };
}
