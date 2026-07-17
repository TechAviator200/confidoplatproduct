// Clinic FAQs are static, non-branching facts — a knowledge-base concern, not a rule to
// validate. See SOURCE_MAP.md for the prompt-vs-tool-vs-KB reasoning.
import { clinicInfo } from "../../clinic-config/clinicInfo";
import { locations } from "../../clinic-config/locations";

export type ClinicInfoTopic = "hours" | "locations" | "parking";

export type ClinicInfoResult =
  | { topic: "hours"; hours: string; lunchClosure: string }
  | { topic: "locations"; locations: { name: string; address: string }[] }
  | { topic: "parking"; locations: { name: string; parking: string }[] };

export function getClinicInfo(topic: ClinicInfoTopic): ClinicInfoResult {
  switch (topic) {
    case "hours":
      return { topic, hours: clinicInfo.hours, lunchClosure: clinicInfo.lunchClosure };
    case "locations":
      return {
        topic,
        locations: locations.map((l) => ({ name: l.name, address: l.address })),
      };
    case "parking":
      return {
        topic,
        locations: locations.map((l) => ({ name: l.name, parking: l.parking })),
      };
  }
}
