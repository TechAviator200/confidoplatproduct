// Shared types for the Riverbend Gastroenterology mock clinic data.
// Source: source-materials/Clinic-Pack (1) (1).pdf

export type InsurancePayer =
  | "Aetna"
  | "BlueCross"
  | "UnitedHealthcare"
  | "Cigna"
  | "Medicare";

export interface Insurance {
  payer: InsurancePayer;
  active: boolean;
}

export type ProviderRole = "MD" | "NP" | "PA";

export type ProviderId = "whitfield" | "brooks" | "raman" | "ellis" | "crane" | "mendez";

export type LocationId = "maple_grove" | "lakeside";

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export interface Provider {
  id: ProviderId;
  name: string;
  role: ProviderRole;
  pairedWith: ProviderId;
  workDays: Weekday[];
  primaryLocation: LocationId;
  /** Extra location/day combination, e.g. Dr. Whitfield's Thursday afternoons at Lakeside. */
  secondaryLocation?: { location: LocationId; days: Weekday[] };
  /** Free-text schedule caveat that doesn't fit the structured fields (e.g. "Fri AM only"). */
  scheduleNote?: string;
}

export interface Location {
  id: LocationId;
  name: string;
  address: string;
  parking: string;
}

export interface ClinicInfo {
  practiceName: string;
  specialty: string;
  hours: string;
  lunchClosure: string;
}

export interface TransferTargets {
  frontDesk: string;
  nurseLine: string;
}

export type PatientFlag = "discharged";

export interface PatientRecord {
  phone: string;
  name: string;
  dob: string; // ISO YYYY-MM-DD
  insurance: Insurance;
  /** ISO date of last visit, or null if the patient has never been seen. */
  lastSeen: string | null;
  assignedProvider: ProviderId | null;
  flags: PatientFlag[];
}

export type PatientClassification = "new_patient" | "follow_up";

export type VisitType = PatientClassification;

export interface Appointment {
  id: string;
  patientPhone: string;
  provider: ProviderId;
  location: LocationId;
  datetime: string; // ISO datetime
  visitType: VisitType;
}
