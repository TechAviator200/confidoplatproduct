import test from "node:test";
import assert from "node:assert/strict";
import { classifyPatient } from "../../tools/validators/classifyPatient";

const TODAY = new Date("2026-07-16");

test("TC-01 Riverbend Rule 1: patient seen within 3 years classifies as Follow-Up", () => {
  assert.equal(classifyPatient("2025-09-12", TODAY), "follow_up"); // Margaret Hill
});

test("TC-02 Riverbend Rule 1 / D3: patient not seen in over 3 years reclassifies as New Patient", () => {
  assert.equal(classifyPatient("2019-04-10", TODAY), "new_patient"); // Elena Vasquez
});

test("TC-03 Riverbend Rule 1: never-seen patient classifies as New Patient", () => {
  assert.equal(classifyPatient(null, TODAY), "new_patient"); // Robert Kim
});
