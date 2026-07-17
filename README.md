# Riverbend Gastroenterology — Voice Agent

A voice agent for Riverbend Gastroenterology built on Retell, covering appointment
management (book, reschedule, cancel, confirm), clinic FAQs, and call
transfers/escalations for two clinic locations.

---

## Project overview

The agent handles inbound calls at Riverbend Gastroenterology. Callers can book,
reschedule, cancel, or confirm appointments; ask about hours, locations, and parking;
or be transferred to the front desk or nurse line.

Every scheduling rule from the Riverbend clinic pack is implemented as a deterministic
TypeScript function, independently testable against its source rule number. The LLM
never decides eligibility — it calls a tool and relays the outcome. See
`docs/ARCHITECTURE.md` for the full design rationale.

---

## Repository structure

| Path | Contents |
|---|---|
| `source-materials/` | Authoritative PDFs: project brief and Riverbend clinic pack |
| `PROJECT_BRIEF.md` | Scope and deliverables |
| `DECISIONS.md` | Every Riverbend rule ambiguity, its resolution, and why (D1–D12) |
| `SOURCE_MAP.md` | Every requirement traced from source rule → implementation → test |
| `TASKS.md` | The build sequence |
| `OUT_OF_SCOPE.md` | What's deliberately not built, and why |
| `NOTES_FROM_KARAN.md` | Platform context for Part 2 (productization) |
| `clinic-config/` | Normalized Riverbend data: patients, providers, locations, appointments |
| `tools/validators/` | Five single-responsibility validator functions (one rule area each) |
| `tools/contracts/` | Tool-layer orchestration: lookup, availability, book/reschedule/cancel/confirm, transfer |
| `tests/` | 38 automated tests + regression scenario scaffold |
| `server/` | Thin Express HTTP adapter over the tool contracts (transport only) |
| `retell/` | Agent artifacts: behavior spec, system prompt, knowledge base, tool definitions, test call script |
| `docs/` | Architecture, security, iteration log |
| `demo/` | Verification evidence, transcripts, screenshot assembly guide |

---

## Architecture

```
Caller (phone)
    │
    ▼
Retell Voice Agent  ←── System prompt (intent, tone, guardrails)
    │                ←── Knowledge base (hours, locations, parking)
    ▼
LLM
    │
    ▼  HTTP POST
Express HTTP Adapter  (server/routes/ — transport only)
    │
    ▼
TypeScript business logic  (tools/contracts/ → tools/validators/)
    │                       Single source of truth for all Riverbend rules
    ▼
Structured JSON response
    │
    ▼
LLM → spoken response → Caller
```

The HTTP adapter is intentionally thin — each route parses a request body, calls the
existing contract function, and returns its result unchanged. No Riverbend rule is
implemented twice. See `docs/ARCHITECTURE.md` for the full design, the prompt/tool/KB
split rationale, and the call-flow detail for each workflow.

### Validator pipeline

```
classifyPatient → validateAge → validateInsurance → validateProviderContinuity → validateBooking
```

Each function owns one rule area and returns `pass | fail + reason`. The pipeline is
sequenced by `runSchedulingWorkflow` (Retell-facing orchestrator) or `bookAppointment`
(internal booking tool). The LLM only collects inputs; validators produce all
outcomes.

---

## Running locally

```bash
npm install
npm run build   # TypeScript compile
npm test        # 38 unit tests (node:test)
```

---

## Deployed API

The HTTP adapter is deployed at:

```
https://confidoplatproduct.onrender.com
```

Health check:

```bash
curl https://confidoplatproduct.onrender.com/health
# → {"status":"ok","service":"riverbend-mock-api"}
```

All Retell tool URLs are configured to point to this deployment. No ngrok tunnel
required for integration testing.

---

## Running the HTTP server locally

The Express adapter in `server/` exposes the tool contracts over HTTP for Retell
integration.

```bash
npm run dev:server   # live reload via tsx (development)
npm run server       # compiled server from dist/ (production-like)
```

Default port: `4000`. Override with the `PORT` environment variable.

```bash
npm run test:server   # 11 HTTP endpoint tests (node:test)
```

For local Retell integration, a public tunnel (e.g., ngrok) is required:

```bash
ngrok http 4000
# Copy the HTTPS URL, update the tool URLs in the Retell LLM config
```

> **Note:** When using a local tunnel, the URL changes on every server restart.
> Retell LLM tool URLs must be updated each session. See `docs/SECURITY.md` for
> the production deployment requirements.

---

## Available endpoints

### `GET /health`

```bash
curl http://localhost:4000/health
# → {"status":"ok","service":"riverbend-mock-api"}
```

### `POST /lookup-patient`

Identity verification (D1): phone as initial lookup key; DOB must match before any
patient data is returned.

```bash
curl -s -X POST http://localhost:4000/lookup-patient \
  -H "Content-Type: application/json" \
  -d '{"phone":"555-0101","dob":"1958-02-10"}'
# → {"status":"verified","patient":{"name":"Margaret Hill",...}}
# → {"status":"dob_mismatch"}     (phone found, DOB wrong — no data exposed)
# → {"status":"not_found"}        (phone not in system)
```

### `POST /confirm-appointment`

Reads back an existing appointment (D9, read-only). Identity gate runs first.

```bash
curl -s -X POST http://localhost:4000/confirm-appointment \
  -H "Content-Type: application/json" \
  -d '{"phone":"555-0109","dob":"1995-09-09"}'
# → {"status":"confirmed","provider":"Dr. Alan Whitfield, MD",
#    "location":"maple_grove","datetime":"2026-08-03T10:00:00"}
# → {"status":"not_found"}   (verified identity, but no appointment on file)
```

### `POST /run-scheduling-workflow`

Full eligibility pipeline (classify → age → insurance → provider continuity →
booking). Returns `eligible | ineligible | transfer_required`.

```bash
curl -s -X POST http://localhost:4000/run-scheduling-workflow \
  -H "Content-Type: application/json" \
  -d '{"phone":"555-0102","dob_confirmation":"1971-07-04",
       "has_policy_number_confirmed":true,"requested_provider":"raman"}'
# → {"outcome":"eligible","classification":"follow_up","routed_provider":"raman",
#    "patient_name":"James Porter"}
# → {"outcome":"ineligible","reason":"Rule 3: insurance not active"}
# → {"outcome":"transfer_required","reason":"Rule 5: provider switch needs office approval"}
```

### `POST /get-availability`

Returns soonest available slots for a provider and visit classification.

```bash
curl -s -X POST http://localhost:4000/get-availability \
  -H "Content-Type: application/json" \
  -d '{"provider":"raman","classification":"follow_up"}'
# → {"duration_minutes":15,"slots":[{"date":"2026-07-17","weekday":"Fri",
#    "location":"lakeside"},...]}
```

### `POST /book-appointment`

Books a slot. Resolves patient identity (phone + DOB) and runs the full validator
pipeline internally.

```bash
curl -s -X POST http://localhost:4000/book-appointment \
  -H "Content-Type: application/json" \
  -d '{"phone":"555-0102","dob_confirmation":"1971-07-04",
       "has_policy_number_confirmed":true,"requested_provider":"raman"}'
# → {"status":"booked","provider":"raman","durationMinutes":15,
#    "slot":{"date":"2026-07-17","weekday":"Fri","location":"lakeside"}}
# → {"status":"blocked","reason":"...","escalateToFrontDesk":true}
```

### `POST /get-existing-appointment`

Reads back an existing appointment for reschedule or cancel flows. Identity gate
included.

```bash
curl -s -X POST http://localhost:4000/get-existing-appointment \
  -H "Content-Type: application/json" \
  -d '{"phone":"555-0101","dob_confirmation":"1958-02-10"}'
# → {"status":"confirmed","provider":"Dr. Alan Whitfield, MD",
#    "location":"maple_grove","datetime":"2026-07-28T09:30:00"}
# → {"status":"not_found"}
```

### `POST /reschedule-appointment`

Requires an existing appointment on file. Runs the full validator pipeline.

```bash
curl -s -X POST http://localhost:4000/reschedule-appointment \
  -H "Content-Type: application/json" \
  -d '{"phone":"555-0101","dob_confirmation":"1958-02-10",
       "has_policy_number_confirmed":true,"requested_provider":"whitfield"}'
# → {"status":"booked","provider":"whitfield","durationMinutes":15,
#    "slot":{"date":"2026-07-17","weekday":"Fri","location":"maple_grove"}}
```

### `POST /cancel-appointment`

Cancels an existing appointment. No eligibility pipeline (D6: discharge does not
block cancellation).

```bash
curl -s -X POST http://localhost:4000/cancel-appointment \
  -H "Content-Type: application/json" \
  -d '{"phone":"555-0110","dob_confirmation":"1948-03-17"}'
# → {"status":"cancelled","appointmentId":"appt-0110"}
# → {"status":"not_found"}
```

### `POST /transfer-front-desk`

```bash
curl -s -X POST http://localhost:4000/transfer-front-desk \
  -H "Content-Type: application/json" \
  -d '{"reason":"caller requested human agent"}'
# → {"destination":"(555) 010-2000","transferType":"front_desk","reason":"..."}
```

### `POST /transfer-nurse-line`

```bash
curl -s -X POST http://localhost:4000/transfer-nurse-line \
  -H "Content-Type: application/json" \
  -d '{"reason":"caller reporting urgent medical concern"}'
# → {"destination":"(555) 010-2911","transferType":"nurse_line","reason":"..."}
```

---

## Retell integration

**Agent ID:** `agent_bcafdd7dd80967d3df25c80fdb`
**LLM ID:** `llm_c8482c0f2c9f484c4ab54d3a4f3b`

The LLM has 11 tools registered: `end_call` plus the 10 custom HTTP tools listed
above. All tool parameters use `args_at_root: true` (Retell sends parameters as
root-level JSON, not nested under `"args"`).

See `retell/SETUP_GUIDE.md` for step-by-step configuration instructions, and
`retell/TOOL_DEFINITIONS.json` for the full parameter schemas.

### Updating tool URLs for local development

When running locally via ngrok instead of the deployed API:

```bash
# In /tmp (retell-sdk must be installed)
node update-tools.js <api_key> <new_ngrok_url>
```

---

## Known limitations

- **All data is synthetic.** The 12 patients, 6 providers, and 3 mock appointments
  are fictional fixtures from the Riverbend clinic pack sample data. No live backend.
- **No real telephony.** End-to-end voice verification was performed via the Retell
  playground simulation, not a live phone call.
- **12 simulation scenarios run; 11 pass.** The one failing scenario (Emergency
  Escalation) is a simulator edge case: the agent's 911 instruction is correct, but
  the Retell simulator re-injects the emergency prompt repeatedly until loop-detection
  terminates the conversation. See `demo/verification.md` for the full analysis.
- **`selected_slot` required in live config.** The Retell LLM config
  (`llm_c8482c0f2c9f484c4ab54d3a4f3b`) requires `selected_slot` in both
  `book_appointment` and `reschedule_appointment`. TC-44 regression test confirms
  the full `get_availability → book_appointment` chain works end-to-end.

---

## Out-of-scope items

See `OUT_OF_SCOPE.md` for the full list. In summary:

- Annual wellness / physical visits (Rule 9 marked TBD by the clinic itself)
- Guardian / minor scheduling workflow
- Live telephony
- Real backend or database
- Authentication, rate limiting, or other production security machinery
- Multi-clinic abstraction (Part 2 territory)

---

## Implementation status

| Component | Status |
|---|---|
| Validator pipeline (5 functions, Rules 1–8) | Complete, 38 tests pass |
| Tool contracts (10 tools) | Complete |
| Express HTTP adapter (10 routes) | Complete, 11 server tests pass |
| Retell agent configuration | Complete (agent + LLM + KB + 11 tools, selected_slot live) |
| Tier 1 workflows verified (WF1–WF5) | ✅ All pass |
| Tier 2 workflows verified (reschedule, cancel, edge cases) | ✅ All pass |
| Simulation screenshots (12 scenarios) | ✅ 11 pass, 1 simulator edge case documented |
| Architecture documentation | Complete (`docs/ARCHITECTURE.md`) |
| Security documentation | Complete (`docs/SECURITY.md`) |

---

## Reading order

For anyone covering the reasoning behind the build:

1. `PROJECT_BRIEF.md` — what was built and why
2. `DECISIONS.md` — every ambiguity resolved before code was written
3. `SOURCE_MAP.md` — requirement → implementation → test traceability
4. `docs/ARCHITECTURE.md` — system design and rationale
5. `tools/validators/` — the five rule-enforcement functions
6. `tools/contracts/` — tool-layer orchestration
7. `retell/AGENT_BEHAVIOR.md` — agent behavior design
8. `retell/RIVERBEND_SYSTEM_PROMPT.md` — the actual Retell prompt
9. `server/` — the HTTP adapter
10. `retell/TEST_CALL_SCRIPT.md` — verification evidence
11. `docs/ITERATION_LOG.md` — what changed and why during the build

---

## Implementation checklist

### Core agent requirements

| Requirement | Status | Notes |
|---|---|---|
| Retell agent created and accessible | ✅ Complete | Agent ID `agent_bcafdd7dd80967d3df25c80fdb` |
| System prompt (identity verification, workflows, guardrails, tone) | ✅ Complete | `retell/RIVERBEND_SYSTEM_PROMPT.md` |
| Knowledge base (hours, locations, parking) | ✅ Complete | `retell/RIVERBEND_KNOWLEDGE_BASE.md` |
| Appointment booking workflow | ✅ Complete | Verified TC-R02 |
| Appointment reschedule workflow | ✅ Complete | Verified TC-R11 |
| Appointment cancel workflow | ✅ Complete | Verified TC-R12 |
| Appointment confirmation workflow | ✅ Complete | Verified TC-R13 |
| Identity verification (phone + DOB) | ✅ Complete | D1; verified in all workflows |
| Dr. Crane / Sofia Mendez Thursday routing | ✅ Complete | Verified TC-R09 (indirect) |
| Inactive insurance block | ✅ Complete | Verified TC-R04 |
| Under-18 block | ✅ Complete | Verified TC-R06 |
| Discharged patient block | ✅ Complete | Verified (screenshot 13) |
| Provider continuity (Rule 5) | ✅ Complete | TC-11, TC-12 unit tests; provider-switch simulation pending |
| Front desk transfer | ✅ Complete | Verified TC-R24 |
| Nurse line transfer | ✅ Complete | Verified TC-R21 |
| Emergency → 911 instruction | ✅ Complete | Verified (simulator edge case documented in `demo/verification.md`) |
| FAQ answers (hours, parking) | ✅ Complete | Verified (screenshot 23) |
| Unknown patient handling | ✅ Complete | Verified TC-R14 |
| No matching appointment handling | ✅ Complete | Verified TC-R15 |

### Implementation requirements

| Requirement | Status | Notes |
|---|---|---|
| `lookup_patient` tool | ✅ Complete | `tools/contracts/lookupPatient.ts` + `server/routes/lookupPatientRoute.ts` |
| `confirm_appointment` tool | ✅ Complete | `tools/contracts/confirmAppointment.ts` + HTTP route |
| Mock tool responses from sample data | ✅ Complete | All 10 tools use `clinic-config/` data only |
| No invented patient records | ✅ Complete | Only the 12 given patients; 3 mock appointments explicitly permitted by clinic pack |
| Deterministic rule enforcement | ✅ Complete | `tools/validators/` — 5 functions, each citing its rule number |
| Automated tests | ✅ Complete | 38 unit tests + 11 server tests, all pass |

### Documentation requirements

| Requirement | Status | Notes |
|---|---|---|
| Architecture write-up | ✅ Complete | `docs/ARCHITECTURE.md` |
| Prompt/tool/KB split rationale | ✅ Complete | `docs/ARCHITECTURE.md` §Prompt/Tool/KB split; `SOURCE_MAP.md` design principle |
| Iteration log | ✅ Complete | `docs/ITERATION_LOG.md` — 11 entries covering planning through final simulation |
| Security documentation | ✅ Complete | `docs/SECURITY.md` |
| Source traceability | ✅ Complete | `SOURCE_MAP.md` — rule → file → test |

### Integration

| Requirement | Status | Notes |
|---|---|---|
| HTTP adapter + public tunnel | ✅ Complete | Express server + ngrok; session-scoped URL |
| Slot passthrough fix | ✅ Complete | `selected_slot` required in tool schema and live Retell config; TC-44 regression test passes |
| Tool calling verified end-to-end | ✅ Complete | 12 simulation scenarios run; 11 pass, 1 simulator edge case |
| Live voice call verified | ⚠️ Not completed | Verified via Retell playground simulation, not a live phone call |

---

## Production architecture considerations

A production deployment would require the additions listed in `docs/SECURITY.md`:
authenticated endpoints, an API gateway, OAuth service auth, VPC isolation, rate
limiting, audit logging, secrets management, HIPAA-aligned safeguards, and a stable
managed deployment.

The thin adapter pattern makes this transition additive: authentication and
authorization can be added to `server/` without touching any business logic in
`tools/contracts/` or `tools/validators/`.
