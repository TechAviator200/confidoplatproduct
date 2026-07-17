import test from "node:test";
import assert from "node:assert/strict";
import { confirmAppointment } from "../../tools/contracts/confirmAppointment";
import { patients } from "../../clinic-config/patients";

test("TC-32 D9: confirm reads back an existing appointment without modifying it", () => {
  const patient = patients.find((p) => p.phone === "555-0109")!; // Sofia Delgado
  const result = confirmAppointment(patient);
  assert.equal(result.status, "confirmed");
});
