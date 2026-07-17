// Mock upcoming appointments — see DECISIONS.md D11.
//
// The clinic pack explicitly delegates this: "Phone numbers with 'has an upcoming
// appointment' are the ones to use for reschedule/cancel testing... You decide what
// the existing appointment looks like." This is the one place in clinic-config where
// data is authored rather than transcribed, and it is limited to exactly the three
// patients the source data flags: Margaret Hill (555-0101), Sofia Delgado (555-0109),
// George Adams (555-0110). Each is given their assigned provider, that provider's
// working location, and a date/time consistent with the provider's working days
// (verified against a real calendar so the fixture is internally plausible).
import type { Appointment } from "./types";

export const appointments: Appointment[] = [
  {
    id: "appt-0101",
    patientPhone: "555-0101", // Margaret Hill — Follow-Up (last seen 2025-09-12)
    provider: "whitfield",
    location: "maple_grove",
    datetime: "2026-07-28T09:30:00", // Tuesday — within Whitfield's Mon-Wed working days
    visitType: "follow_up",
  },
  {
    id: "appt-0109",
    patientPhone: "555-0109", // Sofia Delgado — Follow-Up (last seen 2026-05-01)
    provider: "whitfield",
    location: "maple_grove",
    datetime: "2026-08-03T10:00:00", // Monday — within Whitfield's working days
    visitType: "follow_up",
  },
  {
    id: "appt-0110",
    patientPhone: "555-0110", // George Adams — Follow-Up (last seen 2024-08-08)
    provider: "raman",
    location: "lakeside",
    datetime: "2026-08-05T13:00:00", // Wednesday — within Raman's Mon/Wed-Fri working days
    visitType: "follow_up",
  },
];
