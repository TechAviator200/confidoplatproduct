// Riverbend Rule 8: do not book a patient who has a "Discharged from Practice" flag on
// their chart.
//
// See DECISIONS.md D6: discharge blocks new bookings and reschedules (a reschedule is
// functionally a re-booking), but not cancellations or FAQ requests.
//
// This is the final gate in the validator pipeline — it composes the upstream results
// from validateAge, validateInsurance, and validateProviderContinuity for book/reschedule
// actions, and is the single place the calling tool contract checks before mutating an
// appointment.
import type { AgeValidationResult } from "./validateAge";
import type { InsuranceValidationResult } from "./validateInsurance";
import type { ProviderContinuityResult } from "./validateProviderContinuity";

export type BookingAction = "book" | "reschedule" | "cancel" | "confirm";

export interface BookingUpstreamResults {
  age: AgeValidationResult;
  insurance: InsuranceValidationResult;
  providerContinuity: ProviderContinuityResult;
}

export interface BookingValidationInput {
  discharged: boolean;
  action: BookingAction;
  /** Required for "book" / "reschedule"; not applicable to "cancel" / "confirm". */
  upstream: BookingUpstreamResults | null;
}

export interface BookingValidationResult {
  valid: boolean;
  reason?: string;
  escalateToFrontDesk?: boolean;
}

export function validateBooking(input: BookingValidationInput): BookingValidationResult {
  if (input.discharged && (input.action === "book" || input.action === "reschedule")) {
    return {
      valid: false,
      reason:
        'Riverbend Rule 8: patient has a "Discharged from Practice" flag; new bookings and reschedules are blocked.',
    };
  }

  if (input.action === "cancel" || input.action === "confirm") {
    return { valid: true };
  }

  if (!input.upstream) {
    throw new Error(
      "validateBooking: upstream validation results are required for book/reschedule actions"
    );
  }

  const { age, insurance, providerContinuity } = input.upstream;

  if (!age.valid) {
    return { valid: false, reason: age.reason };
  }
  if (!insurance.valid) {
    return { valid: false, reason: insurance.reason };
  }
  if (!providerContinuity.valid) {
    return {
      valid: false,
      reason: providerContinuity.reason,
      escalateToFrontDesk: providerContinuity.escalateToFrontDesk,
    };
  }

  return { valid: true };
}
