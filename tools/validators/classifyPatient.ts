// Riverbend Rule 1: Follow-Up patients are patients who have been seen within the last
// 3 years. New Patients are patients who are either new to the practice OR have not
// been seen in more than 3 years.
import type { PatientClassification } from "../../clinic-config/types";

/**
 * @param lastSeen ISO date of the patient's last visit, or null if never seen.
 * @param today Defaults to the real current date; pass explicitly for reproducible tests.
 */
export function classifyPatient(
  lastSeen: string | null,
  today: Date = new Date()
): PatientClassification {
  if (lastSeen === null) {
    return "new_patient";
  }

  const cutoff = new Date(today);
  cutoff.setFullYear(cutoff.getFullYear() - 3);

  const lastSeenDate = new Date(lastSeen);
  return lastSeenDate < cutoff ? "new_patient" : "follow_up";
}
