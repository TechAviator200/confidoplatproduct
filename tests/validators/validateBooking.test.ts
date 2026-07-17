import test from "node:test";
import assert from "node:assert/strict";
import { validateBooking } from "../../tools/validators/validateBooking";

test("TC-18 Riverbend Rule 8: discharged patient is blocked from booking", () => {
  const result = validateBooking({ discharged: true, action: "book", upstream: null });
  assert.equal(result.valid, false);
});

test("TC-19 D6: discharged patient is not blocked from cancelling", () => {
  const result = validateBooking({ discharged: true, action: "cancel", upstream: null });
  assert.equal(result.valid, true);
});
