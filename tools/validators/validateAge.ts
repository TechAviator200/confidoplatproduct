// Riverbend Rule 4: We do not see patients under 18.
export interface AgeValidationResult {
  valid: boolean;
  age: number;
  reason?: string;
}

/**
 * @param dob ISO date of birth.
 * @param today Defaults to the real current date; pass explicitly for reproducible tests.
 */
export function validateAge(dob: string, today: Date = new Date()): AgeValidationResult {
  const birth = new Date(dob);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  if (age < 18) {
    return {
      valid: false,
      age,
      reason: "Riverbend Rule 4: patients under 18 are not seen by this practice.",
    };
  }

  return { valid: true, age };
}
