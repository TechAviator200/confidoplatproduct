import test from "node:test";
import assert from "node:assert/strict";
import { validateInsurance } from "../../tools/validators/validateInsurance";

test("TC-06 Riverbend Rule 3: active insurance + confirmed policy number passes", () => {
  const result = validateInsurance({ active: true, hasPolicyNumberConfirmed: true });
  assert.equal(result.valid, true);
});

test("TC-07 Riverbend Rule 3: inactive insurance is blocked", () => {
  const result = validateInsurance({ active: false, hasPolicyNumberConfirmed: true }); // Dana Whitmore
  assert.equal(result.valid, false);
});

test("TC-08 Riverbend Rule 3 / D4: active insurance but unconfirmed policy number is blocked", () => {
  const result = validateInsurance({ active: true, hasPolicyNumberConfirmed: false });
  assert.equal(result.valid, false);
});
