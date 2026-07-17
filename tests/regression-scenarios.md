# Regression Test Scaffolding — Riverbend Voice Agent

Every material Riverbend rule and edge case, with its expected behavior, the
validator/tool that owns it, and the automated test (where Phase 1 code exists to test).
Rows marked **SCAFFOLD ONLY** describe agent/prompt-level behavior (intent recognition,
spoken guardrail language) that has no pure function to unit test yet — those get exercised
once the Retell agent is built, and are recorded here so they aren't forgotten.

TC IDs are referenced from `SOURCE_MAP.md` and from the test file that implements them.

## Rule 1 — New vs. Follow-Up classification

| TC | Scenario | Expected behavior | Validator | Test file |
|---|---|---|---|---|
| TC-01 | Margaret Hill (555-0101), last seen 2025-09-12 | Classifies as Follow-Up | `classifyPatient()` | `tests/validators/classifyPatient.test.ts` |
| TC-02 | Elena Vasquez (555-0104), last seen 2019-04-10 — D3 | Reclassifies as New Patient despite stale assigned provider | `classifyPatient()` | `tests/validators/classifyPatient.test.ts` |
| TC-03 | Robert Kim (555-0105), never seen | Classifies as New Patient | `classifyPatient()` | `tests/validators/classifyPatient.test.ts` |

## Rule 2 — Visit duration

| TC | Scenario | Expected behavior | Validator | Test file |
|---|---|---|---|---|
| TC-04 | New Patient visit requested | Duration = 30 minutes | `getAvailability()` | `tests/contracts/getAvailability.test.ts` |
| TC-05 | Follow-Up visit requested | Duration = 15 minutes | `getAvailability()` | `tests/contracts/getAvailability.test.ts` |

## Rule 3 — Active insurance + policy number

| TC | Scenario | Expected behavior | Validator | Test file |
|---|---|---|---|---|
| TC-06 | Active insurance, policy number confirmed | Passes | `validateInsurance()` | `tests/validators/validateInsurance.test.ts` |
| TC-07 | Dana Whitmore (555-0106), Cigna inactive | Blocked | `validateInsurance()` | `tests/validators/validateInsurance.test.ts` |
| TC-08 | Active insurance, caller cannot confirm policy number — D4 | Blocked | `validateInsurance()` | `tests/validators/validateInsurance.test.ts` |

## Rule 4 — No patients under 18

| TC | Scenario | Expected behavior | Validator | Test file |
|---|---|---|---|---|
| TC-09 | Robert Kim (555-0105), DOB 2010-08-15 | Blocked | `validateAge()` | `tests/validators/validateAge.test.ts` |
| TC-10 | Adult patient | Passes | `validateAge()` | `tests/validators/validateAge.test.ts` |

## Rule 5 — Own-provider continuity for Follow-Ups

| TC | Scenario | Expected behavior | Validator | Test file |
|---|---|---|---|---|
| TC-11 | Follow-Up patient requests own assigned provider | Passes, routed to that provider | `validateProviderContinuity()` | `tests/validators/validateProviderContinuity.test.ts` |
| TC-12 | Follow-Up patient requests a genuinely different provider | Blocked, escalate to front desk (D8) | `validateProviderContinuity()` | `tests/validators/validateProviderContinuity.test.ts` |
| TC-13 | New-classified patient (stale assigned provider) requests any provider — D3 | Passes, no continuity obligation | `validateProviderContinuity()` | `tests/validators/validateProviderContinuity.test.ts` |

## Rule 6 — Dr. Crane Thursdays-only / Sofia Mendez substitution

| TC | Scenario | Expected behavior | Validator | Test file |
|---|---|---|---|---|
| TC-14 | Crane-assigned patient, no preference stated, non-Thursday — D7 | Routed to Sofia Mendez, NP | `validateProviderContinuity()` | `tests/validators/validateProviderContinuity.test.ts` |
| TC-15 | Crane-assigned patient insists on Dr. Crane himself, non-Thursday | Blocked | `validateProviderContinuity()` | `tests/validators/validateProviderContinuity.test.ts` |
| TC-16 | Crane-assigned patient insists on Dr. Crane himself, Thursday | Passes, routed to Crane | `validateProviderContinuity()` | `tests/validators/validateProviderContinuity.test.ts` |

## Rule 7 — Always offer soonest available appointment

| TC | Scenario | Expected behavior | Validator | Test file |
|---|---|---|---|---|
| TC-17 | Availability query for any provider | Slots returned soonest-first | `getAvailability()` | `tests/contracts/getAvailability.test.ts` |

## Rule 8 — Discharged from Practice

| TC | Scenario | Expected behavior | Validator | Test file |
|---|---|---|---|---|
| TC-18 | Patricia Nguyen (555-0108), discharged, attempts booking | Blocked | `validateBooking()` | `tests/validators/validateBooking.test.ts` |
| TC-19 | Patricia Nguyen (555-0108), discharged, attempts cancel — D6 | Allowed | `validateBooking()` | `tests/validators/validateBooking.test.ts` |

## Rule 9 — Annual wellness / physical (TBD)

| TC | Scenario | Expected behavior | Owner | Status |
|---|---|---|---|---|
| TC-20 | Caller asks to book an annual physical | No scheduling attempted; transfer to front desk | Prompt intent recognition + `transferCall()` | **SCAFFOLD ONLY** — Retell phase |

## D1 — Identity verification (phone lookup + DOB confirmation)

| TC | Scenario | Expected behavior | Validator | Test file |
|---|---|---|---|---|
| TC-21 | Correct phone, correct DOB confirmation | Returns verified patient record | `lookupPatient()` | `tests/contracts/lookupPatient.test.ts` |
| TC-22 | Correct phone, mismatched DOB | Record not exposed | `lookupPatient()` | `tests/contracts/lookupPatient.test.ts` |
| TC-23 | Unlisted phone number | Not found | `lookupPatient()` | `tests/contracts/lookupPatient.test.ts` |

## Composed booking pipeline (end-to-end validator chain)

| TC | Scenario | Expected behavior | Tool | Test file |
|---|---|---|---|---|
| TC-24 | Robert Kim (555-0105) attempts booking | Blocked at age check | `bookAppointment()` | `tests/contracts/bookAppointment.test.ts` |
| TC-25 | Dana Whitmore (555-0106) attempts booking | Blocked at insurance check | `bookAppointment()` | `tests/contracts/bookAppointment.test.ts` |
| TC-26 | Patricia Nguyen (555-0108) attempts booking | Blocked at discharge check | `bookAppointment()` | `tests/contracts/bookAppointment.test.ts` |
| TC-27 | James Porter (555-0102), eligible Follow-Up | Booked with own provider (Dr. Raman), 15-minute slot | `bookAppointment()` | `tests/contracts/bookAppointment.test.ts` |

## Reschedule / cancel / confirm (D9, using the three mock upcoming appointments — D11)

| TC | Scenario | Expected behavior | Tool | Test file |
|---|---|---|---|---|
| TC-28 | Margaret Hill (555-0101) reschedules her existing appointment | Succeeds | `rescheduleAppointment()` | `tests/contracts/rescheduleAppointment.test.ts` |
| TC-29 | James Porter (555-0102), no existing appointment, attempts reschedule | Not found | `rescheduleAppointment()` | `tests/contracts/rescheduleAppointment.test.ts` |
| TC-30 | George Adams (555-0110) cancels his existing appointment | Succeeds | `cancelAppointment()` | `tests/contracts/cancelAppointment.test.ts` |
| TC-31 | Harold Stevens (555-0107), no existing appointment, attempts cancel | Not found | `cancelAppointment()` | `tests/contracts/cancelAppointment.test.ts` |
| TC-32 | Sofia Delgado (555-0109) asks to confirm her appointment | Reads back details, no mutation | `confirmAppointment()` | `tests/contracts/confirmAppointment.test.ts` |

## Transfers & escalation

| TC | Scenario | Expected behavior | Owner | Test file / Status |
|---|---|---|---|---|
| TC-33 | Transfer requested to front desk | Resolves (555) 010-2000 | `transferCall()` | `tests/contracts/transferCall.test.ts` |
| TC-34 | Transfer requested to nurse line | Resolves (555) 010-2911 | `transferCall()` | `tests/contracts/transferCall.test.ts` |
| TC-35 | Caller explicitly asks for a person | Transfer to front desk | Prompt intent recognition | **SCAFFOLD ONLY** — Retell phase |
| TC-36 | Unrecognized request | Transfer to front desk | Prompt fallback intent | **SCAFFOLD ONLY** — Retell phase |
| TC-37 | Urgent medical concern | No medical advice given; transfer to nurse line | Prompt guardrail + `transferCall()` | **SCAFFOLD ONLY** — Retell phase |
| TC-38 | Clear emergency | Agent instructs caller to hang up and dial 911 (no transfer) | Prompt scripted instruction | **SCAFFOLD ONLY** — Retell phase |

## Clinic FAQs

| TC | Scenario | Expected behavior | Tool | Test file |
|---|---|---|---|---|
| TC-39 | Caller asks for hours | Returns Mon–Fri 9–5, closed 12–1 | `getClinicInfo("hours")` | `tests/contracts/getClinicInfo.test.ts` |
| TC-40 | Caller asks about parking at either location | Returns both Maple Grove (street meter) and Lakeside (free lot) | `getClinicInfo("parking")` | `tests/contracts/getClinicInfo.test.ts` |

## Edge cases — cross-reference

- "No matching patient" → covered by TC-23.
- "No matching appointment" (reschedule/cancel/confirm on a patient with none on file) → covered by TC-29, TC-31.
- "Unrecognized request" → TC-36 (scaffold only).
- "Caller who wants a human" → TC-35 (scaffold only).
