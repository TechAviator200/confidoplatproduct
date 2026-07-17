// Riverbend Rule 3: the patient must have active insurance and have their insurance
// card / policy number with them when the appointment is made. If the insurance isn't
// active, or they don't have the policy number, the appointment can't be made.
//
// See DECISIONS.md D4: this is treated as two independent gates — `active` is a
// system-checkable fact from the patient record; `hasPolicyNumberConfirmed` is a
// verbal confirmation the agent must ask for, since a phone call can't verify a
// physical card.
export interface InsuranceValidationInput {
  active: boolean;
  hasPolicyNumberConfirmed: boolean;
}

export interface InsuranceValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateInsurance(
  input: InsuranceValidationInput
): InsuranceValidationResult {
  if (!input.active) {
    return {
      valid: false,
      reason: "Riverbend Rule 3: insurance on file is not active.",
    };
  }

  if (!input.hasPolicyNumberConfirmed) {
    return {
      valid: false,
      reason:
        "Riverbend Rule 3: caller could not confirm they have their insurance card / policy number.",
    };
  }

  return { valid: true };
}
