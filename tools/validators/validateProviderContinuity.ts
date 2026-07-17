// Riverbend Rule 5: patients see their own provider for follow-ups (that provider, or
// the provider's paired NP/PA). If a patient wants to switch to a different provider,
// that needs approval from the office first — don't just move them.
//
// Riverbend Rule 6: Dr. Crane only sees office patients on Thursdays. On any other day,
// his office patients are seen by his NP, Sofia Mendez. If a patient really insists on
// seeing Dr. Crane himself, they can only be booked on a Thursday.
//
// See DECISIONS.md D3: New-classified patients (per classifyPatient) carry no
// continuity obligation, even if a stale `assignedProvider` is still on file.
// See DECISIONS.md D7: the Crane/Mendez substitution is surfaced, not withheld.
import type { PatientClassification, ProviderId, Weekday } from "../../clinic-config/types";

const PAIRED_WITH: Record<ProviderId, ProviderId> = {
  whitfield: "brooks",
  brooks: "whitfield",
  raman: "ellis",
  ellis: "raman",
  crane: "mendez",
  mendez: "crane",
};

export interface ProviderContinuityInput {
  classification: PatientClassification;
  assignedProvider: ProviderId | null;
  /** null = caller has no provider preference; route to the default. */
  requestedProvider: ProviderId | null;
  /** Only relevant when requestedProvider === "crane" (Rule 6). */
  requestedDay?: Weekday;
}

export interface ProviderContinuityResult {
  valid: boolean;
  routedProvider: ProviderId | null;
  reason?: string;
  /** True when the correct next step is a front-desk transfer, not a retry. */
  escalateToFrontDesk?: boolean;
}

export function validateProviderContinuity(
  input: ProviderContinuityInput
): ProviderContinuityResult {
  const { classification, assignedProvider, requestedProvider, requestedDay } = input;

  // D3: New Patients (including those reclassified from stale Follow-Up records) have
  // no provider-continuity obligation under Rule 5, since Rule 5 is scoped to follow-ups.
  if (classification === "new_patient") {
    return { valid: true, routedProvider: requestedProvider };
  }

  // A Follow-Up patient with no provider on file has nothing to enforce continuity against.
  if (!assignedProvider) {
    return { valid: true, routedProvider: requestedProvider };
  }

  const ownProviderSet = new Set<ProviderId>([assignedProvider, PAIRED_WITH[assignedProvider]]);
  const wantsOwnProvider = requestedProvider === null || ownProviderSet.has(requestedProvider);

  if (!wantsOwnProvider) {
    return {
      valid: false,
      routedProvider: null,
      reason:
        "Riverbend Rule 5: switching to a different provider requires office approval first.",
      escalateToFrontDesk: true,
    };
  }

  if (assignedProvider === "crane") {
    // Only an explicit request for Dr. Crane himself triggers the Thursday gate.
    // No preference (requestedProvider === null) defaults to the Rule 6 substitution,
    // not to Crane — routing "no preference" to Crane would silently reintroduce the
    // Thursday restriction for callers who never asked for him specifically.
    const explicitlyWantsCraneHimself = requestedProvider === "crane";

    if (explicitlyWantsCraneHimself) {
      if (requestedDay === "Thu") {
        return { valid: true, routedProvider: "crane" };
      }
      return {
        valid: false,
        routedProvider: null,
        reason:
          "Riverbend Rule 6: Dr. Crane only sees office patients on Thursdays; Sofia Mendez, NP is available on other days.",
      };
    }

    return { valid: true, routedProvider: "mendez" };
  }

  const effectiveProvider = requestedProvider ?? assignedProvider;
  return { valid: true, routedProvider: effectiveProvider };
}
