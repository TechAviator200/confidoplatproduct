import test from "node:test";
import assert from "node:assert/strict";
import { cancelAppointment } from "../../tools/contracts/cancelAppointment";
import { patients } from "../../clinic-config/patients";

test("TC-30 cancel succeeds for a patient with an existing mock appointment", () => {
  const patient = patients.find((p) => p.phone === "555-0110")!; // George Adams
  const result = cancelAppointment(patient);
  assert.equal(result.status, "cancelled");
});

test("TC-31 cancel returns not_found when there is no appointment on file", () => {
  const patient = patients.find((p) => p.phone === "555-0107")!; // Harold Stevens
  const result = cancelAppointment(patient);
  assert.equal(result.status, "not_found");
});
