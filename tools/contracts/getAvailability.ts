// Riverbend Rule 2: New Patient visits are 30 minutes. Follow-Up visits are 15 minutes.
// Riverbend Rule 7: always offer the patient the soonest available appointment.
//
// This is a mock slot generator, not a real scheduling engine: it walks forward from
// `today` and returns the provider's next working days as candidate slots, in soonest-
// first order, satisfying Rule 7 without needing a real calendar backend (none is
// required — see PROJECT_BRIEF.md).
import { providers } from "../../clinic-config/providers";
import type { LocationId, PatientClassification, ProviderId, Weekday } from "../../clinic-config/types";

const WEEKDAY_BY_JS_DAY: (Weekday | null)[] = [
  null, // Sunday
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  null, // Saturday
];

export interface AvailabilityInput {
  provider: ProviderId;
  classification: PatientClassification;
  today?: Date;
  /** How many calendar days forward to search. Defaults to 21. */
  daysToSearch?: number;
  /** How many slots to return. Defaults to 3. */
  maxSlots?: number;
}

export interface AvailabilitySlot {
  date: string;     // ISO date (YYYY-MM-DD)
  weekday: Weekday;
  time: string;     // 24-hour HH:MM (mock value — real scheduling would derive this from a calendar)
  provider: ProviderId;
  location: LocationId;
}

export interface AvailabilityResult {
  durationMinutes: 15 | 30;
  slots: AvailabilitySlot[]; // sorted soonest-first
}

export function getAvailability(input: AvailabilityInput): AvailabilityResult {
  const provider = providers.find((p) => p.id === input.provider);
  if (!provider) {
    throw new Error(`getAvailability: unknown provider "${input.provider}"`);
  }

  const durationMinutes = input.classification === "new_patient" ? 30 : 15;
  const today = input.today ?? new Date();
  const daysToSearch = input.daysToSearch ?? 21;
  const maxSlots = input.maxSlots ?? 3;

  const slots: AvailabilitySlot[] = [];
  for (let offset = 1; offset <= daysToSearch && slots.length < maxSlots; offset += 1) {
    const candidate = new Date(today);
    candidate.setDate(candidate.getDate() + offset);

    const weekday = WEEKDAY_BY_JS_DAY[candidate.getDay()];
    if (!weekday || !provider.workDays.includes(weekday)) {
      continue;
    }

    const location =
      provider.secondaryLocation && provider.secondaryLocation.days.includes(weekday)
        ? provider.secondaryLocation.location
        : provider.primaryLocation;

    slots.push({ date: candidate.toISOString().slice(0, 10), weekday, time: "09:00", provider: input.provider, location });
  }

  return { durationMinutes, slots };
}
