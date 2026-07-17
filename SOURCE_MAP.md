# Source Map

Every material requirement, traced from source to implementation to regression test.
Rule numbers refer to the Riverbend Gastroenterology Scheduling Rules PDF; D-numbers
refer to `DECISIONS.md`. The design principle at the bottom explains the rationale
behind what belongs in the prompt vs. a tool call vs. a knowledge base.

| Requirement | Source | Implementation | Test |
|---|---|---|---|
| New vs. Follow-Up classification | Rule 1 | `tools/validators/classifyPatient.ts` | TC-01, TC-02, TC-03 |
| New Patient visits are 30 min / Follow-Up 15 min | Rule 2 | `tools/contracts/getAvailability.ts` (duration parameter) | TC-04, TC-05 |
| Active insurance + policy number required | Rule 3, D4 | `tools/validators/validateInsurance.ts` | TC-06, TC-07, TC-08 |
| No patients under 18 | Rule 4, D5, D12 | `tools/validators/validateAge.ts` | TC-09, TC-10 |
| Own-provider continuity for Follow-Ups; office approval to switch | Rule 5, D8 | `tools/validators/validateProviderContinuity.ts` | TC-11, TC-12, TC-13 |
| Dr. Crane Thursdays-only / Sofia Mendez substitution | Rule 6, D7 | `tools/validators/validateProviderContinuity.ts` | TC-14, TC-15, TC-16 |
| Always offer soonest available appointment | Rule 7 | `tools/contracts/getAvailability.ts` (slot ordering) | TC-17 |
| Block "Discharged from Practice" on book/reschedule | Rule 8, D6 | `tools/validators/validateBooking.ts` | TC-18, TC-19 |
| Annual wellness / physical (TBD) | Rule 9, D12 | Prompt intent recognition → `tools/contracts/transferCall.ts` (front desk) | TC-20 (scaffold only) |
| Identity verification: phone lookup + DOB confirmation | D1 | `tools/contracts/lookupPatient.ts`; also reachable over HTTP via `server/routes/lookupPatientRoute.ts` | TC-21, TC-22, TC-23; `server/tests/lookupPatient.route.test.ts` |
| New-Patient status overrides stale provider assignment | D3 | `tools/validators/validateProviderContinuity.ts` (classification branch) | TC-13 |
| "Today" as an explicit parameter, not hardcoded | D10 | `tools/validators/classifyPatient.ts`, `tools/validators/validateAge.ts` (`today` param) | TC-01–TC-03, TC-09–TC-10 |
| Mock upcoming appointments for reschedule/cancel/confirm testing | D11 | `clinic-config/appointments.ts` | TC-28, TC-30, TC-32 |
| "Confirm" = read-back, no mutation | D9 | `tools/contracts/confirmAppointment.ts`; also reachable over HTTP via `server/routes/confirmAppointmentRoute.ts` | TC-32; `server/tests/confirmAppointment.route.test.ts` |
| Composed booking pipeline (end-to-end) | Rules 1, 3, 4, 5, 6, 8; D2 | `tools/contracts/bookAppointment.ts` | TC-24, TC-25, TC-26, TC-27 |
| Reschedule requires an existing appointment | D9 | `tools/contracts/rescheduleAppointment.ts` | TC-28, TC-29 |
| Cancel does not require passing validators (only existence check) | D6 | `tools/contracts/cancelAppointment.ts` | TC-30, TC-31 |
| Clinic FAQs (hours, locations, parking) | Sample data — "Clinic info (for FAQs)" | `tools/contracts/getClinicInfo.ts` (knowledge-base backed) | TC-39, TC-40 |
| Front desk transfer (person request, unhandled request, billing, annual physical) | Transfers & escalation section | Prompt intent recognition + `tools/contracts/transferCall.ts` | TC-33, TC-35 (scaffold), TC-36 (scaffold) |
| Nurse line transfer (urgent medical concern, no medical advice) | Transfers & escalation section | Prompt guardrail + `tools/contracts/transferCall.ts` | TC-34, TC-37 (scaffold) |
| Clear emergency → hang up, dial 911 | Transfers & escalation section | Prompt scripted instruction (no tool call) | TC-38 (scaffold only) |
| No matching patient | Failure cases | `tools/contracts/lookupPatient.ts` (`not_found` status) | TC-23 |
| No matching appointment | Failure cases | `tools/contracts/rescheduleAppointment.ts`, `cancelAppointment.ts` (`not_found` status) | TC-29, TC-31 |
| Unrecognized request | Failure cases | Prompt fallback intent → front desk | TC-36 (scaffold only) |
| Caller wants a human | Failure cases | Prompt intent recognition → front desk | TC-35 (scaffold only) |

## Design principle behind the prompt / tool / knowledge-base split

- **Prompt** owns conversation flow, intent recognition, tone, and *scripted* guardrail
  language (no medical advice, the 911 instruction). It never owns policy math — nothing
  in the prompt should need to "remember" a rule number.
- **Tool / validator functions** own anything with a correct/incorrect answer derived
  from data: dates, flags, eligibility, routing. These are pure, unit-testable functions
  independent of the LLM, which is what makes the agent's rule-following auditable — see
  `tests/regression-scenarios.md` for the full test-to-rule mapping.
- **Knowledge base** owns static, non-branching facts (hours, addresses, parking) that
  don't need a function call to resolve — `getClinicInfo()` exists mainly to keep the
  data source single (`clinic-config/`) rather than duplicated into the prompt text.

## Retell artifacts

Five artifacts in `retell/` translate the above into the live voice agent configuration:
`RIVERBEND_SYSTEM_PROMPT.md`, `RIVERBEND_KNOWLEDGE_BASE.md`, `TOOL_DEFINITIONS.json`,
`SETUP_GUIDE.md`, `TEST_CALL_SCRIPT.md` (plus `AGENT_BEHAVIOR.md`).

**Agent ID:** `agent_bcafdd7dd80967d3df25c80fdb`
**LLM ID:** `llm_c8482c0f2c9f484c4ab54d3a4f3b`

Simulation results are in `demo/screenshots.md` (12 scenarios, 11 pass, 1 simulator
edge case). The following scenarios that were previously "scaffold only" at the unit
level have been verified conversationally:

| Requirement | Unit-level status | Conversational verification |
|---|---|---|
| Front desk: person / unrecognized / billing | TC-35, TC-36, scaffold only | ✅ Transfer Test (screenshot 21) |
| Nurse line: urgent medical concern | TC-37, scaffold only | ✅ Nurse Line (screenshot 19) |
| Clear emergency → 911 | TC-38, scaffold only | ✅ Correct (simulator edge case; see `demo/verification.md`) |
| FAQ (hours, locations, parking) | TC-39, TC-40 | ✅ FAQ (screenshot 23) |

See `retell/TEST_CALL_SCRIPT.md` for the full scenario script.

## HTTP adapter status (`server/`)

`server/` exposes 10 tool routes over HTTP. The first seven were tunneled via ngrok
and verified end-to-end in the Retell playground as of 2026-07-16 (Entry 7); the
three Tier 2 routes were added and verified in Entry 8 (same session).

| Route | Contract | Verified by automated tests | Verified in Retell (Tier 1) |
|---|---|---|---|
| `POST /lookup-patient` | `tools/contracts/lookupPatient.ts` | `server/tests/lookupPatient.route.test.ts` (3 cases) | **Yes** — WF1, WF2, WF3, WF4a, WF4b |
| `POST /confirm-appointment` | `tools/contracts/confirmAppointment.ts` | `server/tests/confirmAppointment.route.test.ts` (2 cases) | **Yes** — WF1 (TC-R13) |
| `POST /run-scheduling-workflow` | `tools/contracts/runSchedulingWorkflow.ts` | No dedicated route test (orchestrator tested via unit layer) | **Yes** — WF2, WF3, WF4a, WF4b |
| `POST /get-availability` | `tools/contracts/getAvailability.ts` | No dedicated route test | **Yes** — WF2 |
| `POST /book-appointment` | `tools/contracts/bookAppointment.ts` (patient re-resolved from phone+dob) | No dedicated route test | **Yes** — WF2 |
| `POST /transfer-front-desk` | `tools/contracts/transferCall.ts` ("front_desk") | No dedicated route test | **Yes** — WF5a (TC-R24), WF4b |
| `POST /transfer-nurse-line` | `tools/contracts/transferCall.ts` ("nurse_line") | No dedicated route test | **Yes** — WF5b (TC-R21) |

**Tier 1 end-to-end results** (all five required workflows, verified via Retell
playground completion API, 2026-07-16):

| Workflow | Tool chain | Result |
|---|---|---|
| WF1 Appointment confirmation | `lookup_patient` → `confirm_appointment` | ✅ Pass (TC-R13) |
| WF2 Successful booking | `lookup_patient` → `run_scheduling_workflow` → `get_availability` → `book_appointment` | ✅ Pass (TC-R02) |
| WF3 Crane non-Thu → Mendez | `run_scheduling_workflow(null)` → `routed_provider: mendez` → `get_availability` | ✅ Pass (TC-R09 indirect) |
| WF4a Inactive insurance | `run_scheduling_workflow` → `ineligible, Rule 3` | ✅ Pass (TC-R04) |
| WF4b Under-18 | `run_scheduling_workflow` → `ineligible, Rule 4` → front desk | ✅ Pass (TC-R06) |
| WF5a Human escalation | `transfer_front_desk` → `(555) 010-2000` | ✅ Pass (TC-R24) |
| WF5b Medical escalation | `transfer_nurse_line` → `(555) 010-2911` | ✅ Pass (TC-R21) |

**Known limitation:** ngrok URL changes on every server restart. Retell LLM tool URLs
must be updated each session via direct `retell-sdk` calls. URL not committed.

**Tier 2 routes** verified 2026-07-16 (Entry 8):

| Route | Contract | Verified in Retell |
|---|---|---|
| `POST /get-existing-appointment` | `tools/contracts/confirmAppointment.ts` (read-only) | **Yes** — TC-R11, TC-R12, TC-R15 |
| `POST /reschedule-appointment` | `tools/contracts/rescheduleAppointment.ts` | **Yes** — TC-R11 |
| `POST /cancel-appointment` | `tools/contracts/cancelAppointment.ts` | **Yes** — TC-R12 |

## Known data-source inconsistency (not a rule, flagged for transparency)

The clinic pack's own intro warns its notes "don't fully agree with each other." One
concrete instance: Dr. Whitfield's "Works" days are listed as "Mon–Wed + Fri (AM)," but
his "Location" cell separately says "Maple Grove (Thu afternoons at Lakeside)" — Thursday
isn't in the Works list but is implied by the Location cell. `clinic-config/providers.ts`
documents this and treats the Location cell as authoritative (see the comment at the top
of that file) rather than silently dropping the Thursday/Lakeside slot.
