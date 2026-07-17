# Tasks — Phase 1 Build Sequence

Sequenced so each step is checkable before the next depends on it. Nothing here starts until `DECISIONS.md`'s **[PROPOSED — needs approval]** items are resolved.

## 1. Data layer
- [x] Encode the 12 patients, 6 providers/paired staff, 2 locations, clinic hours, and transfer numbers from the clinic pack as static mock data (no invented records)
- [x] Encode the 3 mock upcoming appointments per D11 (Margaret Hill, Sofia Delgado, George Adams)

## 2. Validator functions (D2)
- [x] `classify_patient(last_seen_date, today)` — rule 1
- [x] `validate_age(dob, today)` — rule 4
- [x] `validate_insurance(insurance_status, has_policy_number)` — rule 3
- [x] `validate_provider_continuity(classification, assigned_provider, requested_provider, requested_day)` — rules 5, 6
- [x] `validate_booking(discharged_flag, ...)` — rule 8, composes the above
- [x] Each function's comments cite its rule number (approved refinement 3)

## 3. Tool contracts
- [x] `lookup_patient(phone)` — initial lookup only, per D1
- [x] `get_availability(provider_or_none, date_range)` — respects working days/location, Crane/Thursday logic, rule 7 ordering
- [x] `book_appointment(...)`, `reschedule_appointment(...)`, `cancel_appointment(...)`, `confirm_appointment(...)` — call validators first
- [x] `get_clinic_info(topic)` — hours/locations/parking, knowledge-base backed
- [x] `transfer_call(target: front_desk | nurse_line, reason)`

## 4. Retell agent build
- [x] System prompt: identity verification flow (phone → DOB confirm, per D1), conversation structure, guardrail language (no medical advice, 911 instruction), fallback/transfer intent recognition
- [x] Wire tool calls per `SOURCE_MAP.md`
- [x] Load clinic FAQ knowledge base
- [x] HTTP adapter (`server/`) exposing all 10 tool contracts over HTTP
- [x] Retell agent + LLM + 11 tools configured (`agent_bcafdd7dd80967d3df25c80fdb`)

## 5. Test pass
- [x] Automated unit tests: 38/38 pass (`npm test`)
- [x] Server route tests: 11/11 pass (`npm run test:server`)
- [x] Tier 1 workflows verified in Retell playground: WF1–WF5 (TC-R02, TC-R04, TC-R06, TC-R09, TC-R13, TC-R21, TC-R24)
- [x] Tier 2 workflows verified in Retell playground: TC-R11, TC-R12, TC-R14, TC-R15
- [ ] Remaining TC-R01, TC-R03, TC-R05, TC-R07–TC-R08, TC-R10, TC-R16–TC-R23 (conversational — rules covered at unit level)

## 6. Write-ups
- [x] Architecture write-up (`docs/ARCHITECTURE.md`)
- [x] Iteration log (`docs/ITERATION_LOG.md` — 8 entries)
- [x] Security documentation (`docs/SECURITY.md`)

## Explicitly not in this sequence
See `OUT_OF_SCOPE.md`. Part 2 (productization document) is a separate deliverable, scoped after Part 1 is built.
