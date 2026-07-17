import test from "node:test";
import assert from "node:assert/strict";
import { rescheduleAppointment } from "../../tools/contracts/rescheduleAppointment";
import { patients } from "../../clinic-config/patients";

const TODAY = new Date("2026-07-16");

test("TC-28 reschedule succeeds for a patient with an existing mock appointment", () => {
  const patient = patients.find((p) => p.phone === "555-0101")!; // Margaret Hill
  const result = rescheduleAppointment({
    patient,
    requestedProvider: null,
    hasPolicyNumberConfirmed: true,
    today: TODAY,
  });
  assert.equal(result.status, "booked");
});

test("TC-29 reschedule returns not_found for a patient without an existing appointment", () => {
  const patient = patients.find((p) => p.phone === "555-0102")!; // James Porter — no upcoming appointment
  const result = rescheduleAppointment({
    patient,
    requestedProvider: null,
    hasPolicyNumberConfirmed: true,
    today: TODAY,
  });
  assert.equal(result.status, "not_found");
});
