# Architecture — Riverbend Gastroenterology Voice Agent

Internal engineering documentation for the Part 1 implementation. Covers system
design, call flow, the rationale behind each layer boundary, and the prompt/tool/KB
split that determines how information is sourced at runtime.

---

## System overview

```
Caller (phone)
    │
    ▼
Retell Voice Agent  ←── System prompt (intent recognition, tone, guardrails)
    │                ←── Knowledge base (static clinic facts: hours, locations, parking)
    ▼
LLM (conversation + tool selection)
    │
    ▼  HTTP POST (JSON, args_at_root)
Express HTTP Adapter  ←── server/routes/*.ts — transport only, no rule logic
    │
    ▼
TypeScript business logic  ←── tools/contracts/*.ts → tools/validators/*.ts
    │                          Single source of truth for all Riverbend rules
    ▼
Structured JSON response
    │
    ▼
LLM (translate result into natural language)
    │
    ▼
Caller (spoken response)
```

---

## Why this architecture

### LLM handles conversation; validators handle rules

The fundamental design decision is that the LLM never asserts a scheduling outcome —
it only collects the inputs required for a tool call, then faithfully relays what the
tool returns. This isn't a prompt constraint; it's structural. The LLM has no other
source for eligibility information in the conversation, so it cannot fabricate one.

Every Riverbend rule with a pass/fail answer lives in `tools/validators/`:

```
classifyPatient → validateAge → validateInsurance → validateProviderContinuity → validateBooking
```

Each validator function owns one rule area and returns `pass | fail + reason`. The
pipeline is sequenced by `runSchedulingWorkflow` (orchestrator) or `bookAppointment`
(booking-specific). The LLM calls the tool, receives the outcome, and speaks it in
plain language. It never re-derives the outcome from its own reasoning.

This makes the agent's rule-following auditable: every scheduling decision can be
traced to a specific TypeScript function, a specific test case, and a specific rule
number in the Riverbend clinic pack — see `SOURCE_MAP.md`.

### HTTP adapter is intentionally thin

Retell's custom-function runtime requires a publicly reachable HTTP endpoint.
`server/` bridges this requirement without moving any logic — each route file does
three things only: parse the request body, call the existing contract function, return
its result as JSON. There is no business logic in `server/`. The data behind every
response is still the mock clinic data in `clinic-config/`.

The resulting layering:

| Layer | Owns | Does not own |
|---|---|---|
| `server/routes/` | HTTP transport: parse body, validate types, serialize response | Any Riverbend rule |
| `tools/contracts/` | Tool-level orchestration: identity gate, workflow sequencing | HTTP concerns |
| `tools/validators/` | Individual rule evaluation | Any other rule or workflow step |
| `clinic-config/` | Source data (patients, providers, appointments) | Logic |
| `retell/` | Agent configuration (prompt, KB, tool definitions) | Data or rule logic |

### No duplicated rules

Each Riverbend rule has exactly one implementation. Adding a new clinic or changing
a scheduling rule requires changing one file, not synchronizing changes across a
transport layer and a business logic layer. This is the practical reason for keeping
the adapter thin — it protects the single-source-of-truth property that makes the
validator pipeline independently testable.

---

## Call flow detail

### Booking (new or follow-up patient)

```
1. Retell collects phone + DOB
2. → POST /lookup-patient {phone, dob}
   ← {status: verified|not_found|dob_mismatch}
3. Retell collects insurance confirmation + provider preference
4. → POST /run-scheduling-workflow {phone, dob_confirmation, has_policy_number_confirmed,
                                    requested_provider, requested_day}
   ← {outcome: eligible, classification, routed_provider}
   ← {outcome: ineligible, reason}
   ← {outcome: transfer_required, reason}
5. If eligible:
   → POST /get-availability {provider, classification}
   ← {duration_minutes, slots[]}
   → POST /book-appointment {phone, dob_confirmation, has_policy_number_confirmed, ...}
   ← {status: booked, provider, durationMinutes, slot}
```

### Reschedule

```
1. Retell collects phone + DOB → /lookup-patient
2. → POST /get-existing-appointment {phone, dob_confirmation}
   ← {status: confirmed, provider, location, datetime}   (read-back before mutating)
   ← {status: not_found}                                 (no appointment to change)
3. Retell re-collects insurance confirmation + provider preference
4. → POST /reschedule-appointment {phone, dob_confirmation, has_policy_number_confirmed, ...}
   ← {status: booked, ...}   (full validator pipeline runs inside rescheduleAppointment)
```

### Cancel

```
1. Retell collects phone + DOB → /lookup-patient
2. → POST /get-existing-appointment {phone, dob_confirmation}  (confirm existence first)
3. Caller confirms intent
4. → POST /cancel-appointment {phone, dob_confirmation}
   ← {status: cancelled, appointmentId}
```

Cancel intentionally does not run the validator pipeline. Per D6, Rule 8 (discharge)
blocks booking and rescheduling, not cancellation — there is no policy reason to
prevent a discharged caller from cancelling an existing appointment.

### Confirmation

```
1. → POST /lookup-patient
2. → POST /confirm-appointment {phone, dob}  (read-only; no mutation)
   ← {status: confirmed, provider, location, datetime}
```

### Transfers

```
POST /transfer-front-desk {reason}    ← sourced from clinic-config/clinicInfo.ts
POST /transfer-nurse-line {reason}    ← same; avoids hardcoding numbers in the prompt
```

Transfer destinations are never spoken from the system prompt — they are always
resolved at call time from `transferCall()` / `clinic-config/clinicInfo.ts`. This
prevents a stale or incorrect number from being hallucinated into a call if the
configuration changes.

### Emergency

No tool call. The system prompt includes a scripted instruction: "If this is a
medical emergency, please hang up and dial 911 now." This is the only agent behavior
that doesn't delegate to a tool — it must be reachable instantly, from any point in
the conversation, with zero latency.

---

## Prompt / Tool / Knowledge base split

The question "what belongs where" is answered by one test: does the information vary
by who's asking, and does getting it wrong have a consequence?

| Source | Owns | Examples |
|---|---|---|
| **System prompt** | Conversation flow, intent recognition, tone, scripted guardrail text | 911 instruction, "no medical advice" rule, how to handle a second failed identity check |
| **Tool calls** | Anything with a correct/incorrect answer derived from data | Eligibility, routing, availability, appointment existence, transfer numbers |
| **Knowledge base** | Static, non-branching facts that don't vary by caller | Practice hours, addresses, parking — sourced from `clinic-config/clinicInfo.ts` |

Nothing that requires a rule evaluation lives in the prompt or KB. Nothing static
lives in a tool call. This is the property that makes the agent's rule-following
auditable and its static responses consistent across calls.

---

## Identity verification design

Per D1, phone number is an initial lookup key only. Date of birth must be confirmed
against the record before the agent discusses or mutates any appointment detail.

This resolves two concerns simultaneously:
1. **Patient privacy** — phone numbers are not reliable unique identifiers; DOB
   confirmation is a second factor before any patient data is spoken.
2. **Duplicate name disambiguation** — the sample data contains two patients named
   James Porter with different phone numbers; phone + DOB together uniquely identify
   any record in the sample set.

The `dob_mismatch` path deliberately does not reveal that a record exists for the
given phone number. After a second consecutive failure, the agent transfers rather
than allowing repeated guesses.

---

## Test coverage

The validator pipeline and tool contracts are covered by 38 automated unit tests
(`npm test`) and 11 HTTP endpoint tests (`npm run test:server`). Every test cites the
Riverbend rule number it exercises. See `tests/regression-scenarios.md` for the full
TC-01–TC-40 scenario scaffold and `SOURCE_MAP.md` for the rule → file → test trace.

The Retell agent is additionally verified end-to-end via the Retell playground
completion API — see `retell/TEST_CALL_SCRIPT.md` for the 24-scenario script and
pass/fail results for Tier 1 (TC-R02, TC-R04, TC-R06, TC-R09, TC-R13, TC-R21,
TC-R24) and Tier 2 (TC-R11, TC-R12, TC-R14, TC-R15).
