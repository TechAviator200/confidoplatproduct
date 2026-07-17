import test from "node:test";
import assert from "node:assert/strict";
import { bookAppointment } from "../../tools/contracts/bookAppointment";
import { patients } from "../../clinic-config/patients";
import type { PatientRecord } from "../../clinic-config/types";

const TODAY = new Date("2026-07-16");

function findPatient(phone: string): PatientRecord {
  const patient = patients.find((p) => p.phone === phone);
  if (!patient) throw new Error(`fixture missing patient ${phone}`);
  return patient;
}

test("TC-24 Riverbend Rule 4 (composed): booking is blocked for a patient under 18", () => {
  const result = bookAppointment({
    patient: findPatient("555-0105"), // Robert Kim
    requestedProvider: null,
    hasPolicyNumberConfirmed: true,
    today: TODAY,
  });
  assert.equal(result.status, "blocked");
});

test("TC-25 Riverbend Rule 3 (composed): booking is blocked for inactive insurance", () => {
  const result = bookAppointment({
    patient: findPatient("555-0106"), // Dana Whitmore
    requestedProvider: null,
    hasPolicyNumberConfirmed: true,
    today: TODAY,
  });
  assert.equal(result.status, "blocked");
});

test("TC-26 Riverbend Rule 8 (composed): booking is blocked for a discharged patient", () => {
  const result = bookAppointment({
    patient: findPatient("555-0108"), // Patricia Nguyen
    requestedProvider: null,
    hasPolicyNumberConfirmed: true,
    today: TODAY,
  });
  assert.equal(result.status, "blocked");
});

test("TC-27 Riverbend Rules 5 & 7 (composed): eligible Follow-Up patient books with their own provider, soonest slot", () => {
  const result = bookAppointment({
    patient: findPatient("555-0102"), // James Porter — Dr. Raman, BlueCross active
    requestedProvider: null,
    hasPolicyNumberConfirmed: true,
    today: TODAY,
  });
  assert.equal(result.status, "booked");
  if (result.status === "booked") {
    assert.equal(result.provider, "raman");
    assert.equal(result.durationMinutes, 15);
  }
});

test("TC-41 slot passthrough: selectedSlot is used as-is, not replaced by the fallback soonest slot", () => {
  // Dr. Raman works Mon/Wed/Thu/Fri. With today=2026-07-16 (Thu), slots are:
  //   slots[0]: 2026-07-17 Fri  ← fallback path would book this
  //   slots[1]: 2026-07-20 Mon
  //   slots[2]: 2026-07-22 Wed  ← caller-confirmed slot
  //
  // This test verifies that when the caller confirms a non-first slot, the contract
  // commits that exact slot instead of defaulting to slots[0]. It would fail if
  // the selectedSlot branch were removed or if the contract ignored selectedSlot.
  const callerConfirmedSlot = { date: "2026-07-22", weekday: "Wed" as const, time: "09:00", provider: "raman" as const, location: "lakeside" as const };
  const result = bookAppointment({
    patient: findPatient("555-0102"), // James Porter — Follow-Up, Raman, active insurance
    requestedProvider: null,
    hasPolicyNumberConfirmed: true,
    today: TODAY,
    selectedSlot: callerConfirmedSlot,
  });
  assert.equal(result.status, "booked");
  if (result.status === "booked") {
    assert.equal(result.slot.date, "2026-07-22", "must book the caller-confirmed slot, not slots[0]");
    assert.equal(result.slot.weekday, "Wed");
    assert.equal(result.slot.location, "lakeside");
  }
});

test("TC-42 slot passthrough: selectedSlot takes precedence even when it differs from slots[0]", () => {
  // Explicit negative: if the fallback were used, slots[0] = 2026-07-17. This test
  // would produce a passing 2026-07-17 result before the selectedSlot fix was applied.
  const callerConfirmedSlot = { date: "2026-07-20", weekday: "Mon" as const, time: "09:00", provider: "raman" as const, location: "lakeside" as const };
  const result = bookAppointment({
    patient: findPatient("555-0102"),
    requestedProvider: null,
    hasPolicyNumberConfirmed: true,
    today: TODAY,
    selectedSlot: callerConfirmedSlot,
  });
  assert.equal(result.status, "booked");
  if (result.status === "booked") {
    assert.notEqual(result.slot.date, "2026-07-17", "must not book the fallback soonest slot");
    assert.equal(result.slot.date, "2026-07-20");
  }
});
