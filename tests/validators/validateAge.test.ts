import test from "node:test";
import assert from "node:assert/strict";
import { validateAge } from "../../tools/validators/validateAge";

const TODAY = new Date("2026-07-16");

test("TC-09 Riverbend Rule 4: patient under 18 is blocked", () => {
  const result = validateAge("2010-08-15", TODAY); // Robert Kim
  assert.equal(result.valid, false);
  assert.equal(result.age, 15);
});

test("TC-10 Riverbend Rule 4: adult patient passes", () => {
  const result = validateAge("1958-02-10", TODAY); // Margaret Hill
  assert.equal(result.valid, true);
});
