import test from "node:test";
import assert from "node:assert/strict";
import { getAvailability } from "../../tools/contracts/getAvailability";

const TODAY = new Date("2026-07-16"); // Thursday

test("TC-04 Riverbend Rule 2: New Patient visits are 30 minutes", () => {
  const result = getAvailability({ provider: "whitfield", classification: "new_patient", today: TODAY });
  assert.equal(result.durationMinutes, 30);
});

test("TC-05 Riverbend Rule 2: Follow-Up visits are 15 minutes", () => {
  const result = getAvailability({ provider: "whitfield", classification: "follow_up", today: TODAY });
  assert.equal(result.durationMinutes, 15);
});

test("TC-17 Riverbend Rule 7: slots are returned soonest-first", () => {
  const result = getAvailability({ provider: "brooks", classification: "follow_up", today: TODAY });
  const dates = result.slots.map((s) => s.date);
  const sorted = [...dates].sort();
  assert.deepEqual(dates, sorted);
  assert.ok(result.slots.length > 0);
});

test("TC-43 slot self-containment: every slot includes provider and time so LLM can copy it verbatim into book_appointment", () => {
  // Regression: prior to Bug #2 fix, slots were { date, weekday, location } only.
  // The LLM would send requested_provider separately and omit selected_slot entirely.
  // Now each slot carries provider and time so the object is self-contained.
  const result = getAvailability({ provider: "raman", classification: "follow_up", today: TODAY });
  assert.ok(result.slots.length > 0, "must return at least one slot");
  for (const slot of result.slots) {
    assert.equal(slot.provider, "raman", "slot.provider must match the requested provider");
    assert.equal(typeof slot.time, "string", "slot.time must be a string");
    assert.match(slot.time, /^\d{2}:\d{2}$/, "slot.time must be HH:MM format");
  }
});
