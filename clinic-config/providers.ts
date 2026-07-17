// Source: source-materials/Clinic-Pack (1) (1).pdf — "The practice" / "Providers & availability"
//
// Data-consistency note (assumption, not a numbered rule): the source table lists
// Dr. Whitfield's "Works" days as "Mon–Wed + Fri (AM)" but his "Location" cell separately
// says "Maple Grove (Thu afternoons at Lakeside)" — Thursday isn't in the Works list but
// is implied by the Location cell. The clinic pack's own intro warns the notes "don't
// fully agree with each other." We treat the Location cell as authoritative for Thursday
// availability, since dropping a stated Lakeside slot seems more likely to under-serve a
// real caller than treating it as intentional. This is written down here for visibility,
// not silently resolved.
import type { Provider } from "./types";

export const providers: Provider[] = [
  {
    id: "whitfield",
    name: "Dr. Alan Whitfield, MD",
    role: "MD",
    pairedWith: "brooks",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    primaryLocation: "maple_grove",
    secondaryLocation: { location: "lakeside", days: ["Thu"] },
    scheduleNote: "Fri AM only at Maple Grove; Thu afternoons at Lakeside.",
  },
  {
    id: "brooks",
    name: "Nina Brooks, NP",
    role: "NP",
    pairedWith: "whitfield",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    primaryLocation: "maple_grove",
  },
  {
    id: "raman",
    name: "Dr. Priya Raman, MD",
    role: "MD",
    pairedWith: "ellis",
    workDays: ["Mon", "Wed", "Thu", "Fri"],
    primaryLocation: "lakeside",
  },
  {
    id: "ellis",
    name: "Marco Ellis, PA",
    role: "PA",
    pairedWith: "raman",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    primaryLocation: "lakeside",
  },
  {
    id: "crane",
    // Riverbend Rule 6: Dr. Crane only sees office patients on Thursdays.
    name: "Dr. Theodore Crane, MD",
    role: "MD",
    pairedWith: "mendez",
    workDays: ["Thu"],
    primaryLocation: "maple_grove",
  },
  {
    id: "mendez",
    // Riverbend Rule 6: on non-Thursdays, Dr. Crane's office patients are seen by Sofia Mendez, NP.
    name: "Sofia Mendez, NP",
    role: "NP",
    pairedWith: "crane",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    primaryLocation: "maple_grove",
  },
];
