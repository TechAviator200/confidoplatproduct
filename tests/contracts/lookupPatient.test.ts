import test from "node:test";
import assert from "node:assert/strict";
import { lookupPatient } from "../../tools/contracts/lookupPatient";

test("TC-21 D1: correct phone + correct DOB confirmation returns the verified patient", () => {
  const result = lookupPatient({ phone: "555-0101", dobConfirmation: "1958-02-10" }); // Margaret Hill
  assert.equal(result.status, "verified");
});

test("TC-22 D1: correct phone but mismatched DOB does not expose the record", () => {
  const result = lookupPatient({ phone: "555-0101", dobConfirmation: "1999-01-01" });
  assert.equal(result.status, "dob_mismatch");
});

test("TC-23 unlisted phone number returns not_found", () => {
  const result = lookupPatient({ phone: "555-9999", dobConfirmation: "1958-02-10" });
  assert.equal(result.status, "not_found");
});
