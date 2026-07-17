import test from "node:test";
import assert from "node:assert/strict";
import { validateProviderContinuity } from "../../tools/validators/validateProviderContinuity";

test("TC-11 Riverbend Rule 5: Follow-Up patient requesting own assigned provider passes", () => {
  const result = validateProviderContinuity({
    classification: "follow_up",
    assignedProvider: "whitfield",
    requestedProvider: "whitfield",
  });
  assert.equal(result.valid, true);
  assert.equal(result.routedProvider, "whitfield");
});

test("TC-12 Riverbend Rule 5: Follow-Up patient requesting a different provider escalates to front desk", () => {
  const result = validateProviderContinuity({
    classification: "follow_up",
    assignedProvider: "whitfield",
    requestedProvider: "raman",
  });
  assert.equal(result.valid, false);
  assert.equal(result.escalateToFrontDesk, true);
});

test("TC-13 D3: New-classified patient has no continuity obligation despite a stale assigned provider", () => {
  const result = validateProviderContinuity({
    classification: "new_patient",
    assignedProvider: "whitfield", // e.g. Elena Vasquez's stale assignment
    requestedProvider: "raman",
  });
  assert.equal(result.valid, true);
  assert.equal(result.routedProvider, "raman");
});

test("TC-14 Riverbend Rule 6 / D7: Crane-assigned patient with no preference defaults to Sofia Mendez on a non-Thursday", () => {
  const result = validateProviderContinuity({
    classification: "follow_up",
    assignedProvider: "crane",
    requestedProvider: null,
  });
  assert.equal(result.valid, true);
  assert.equal(result.routedProvider, "mendez");
});

test("TC-15 Riverbend Rule 6: insisting on Dr. Crane himself on a non-Thursday is blocked", () => {
  const result = validateProviderContinuity({
    classification: "follow_up",
    assignedProvider: "crane",
    requestedProvider: "crane",
    requestedDay: "Mon",
  });
  assert.equal(result.valid, false);
});

test("TC-16 Riverbend Rule 6: Dr. Crane himself is bookable on a Thursday", () => {
  const result = validateProviderContinuity({
    classification: "follow_up",
    assignedProvider: "crane",
    requestedProvider: "crane",
    requestedDay: "Thu",
  });
  assert.equal(result.valid, true);
  assert.equal(result.routedProvider, "crane");
});
