import test from "node:test";
import assert from "node:assert/strict";
import { getClinicInfo } from "../../tools/contracts/getClinicInfo";

test("TC-39 clinic hours FAQ", () => {
  const result = getClinicInfo("hours");
  if (result.topic !== "hours") throw new Error("unexpected topic");
  assert.match(result.hours, /9:00 AM/);
  assert.match(result.lunchClosure, /12–1|12-1/);
});

test("TC-40 parking FAQ covers both locations", () => {
  const result = getClinicInfo("parking");
  if (result.topic !== "parking") throw new Error("unexpected topic");
  assert.equal(result.locations.length, 2);
  assert.ok(result.locations.some((l) => l.name === "Maple Grove"));
  assert.ok(result.locations.some((l) => l.name === "Lakeside"));
});
