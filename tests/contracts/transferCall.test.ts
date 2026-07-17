import test from "node:test";
import assert from "node:assert/strict";
import { transferCall } from "../../tools/contracts/transferCall";

test("TC-33 front desk transfer resolves the correct number", () => {
  const result = transferCall("front_desk", "caller asked for a person");
  assert.equal(result.number, "(555) 010-2000");
});

test("TC-34 nurse line transfer resolves the correct number", () => {
  const result = transferCall("nurse_line", "urgent medical concern");
  assert.equal(result.number, "(555) 010-2911");
});
