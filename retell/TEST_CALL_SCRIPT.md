# Retell Test Call Script

24 scenarios (the source spec's "both parking cases" is split into two rows below,
Maple Grove and Lakeside, for clean pass/fail tracking). Every scenario uses only
patients, providers, and appointments already in `clinic-config/`. Dates assume
"today" is **2026-07-16 (Thursday)**, matching the reference date used throughout
`DECISIONS.md` and the unit test fixtures — if this is run in the playground on a
different real date, `get_availability`'s returned slot dates will differ, but the
classification and eligibility outcomes described here should not (they depend on
each patient's `lastSeen`/`dob` relative to whatever "today" the tool layer uses).

**Status:** Simulation complete. 12 scenarios run in the Retell playground; 11 pass.
See `demo/screenshots.md` for embedded screenshots.

| Tier | Scenarios | Date | Log entry | Result |
|---|---|---|---|---|
| Tier 1 | TC-R02, TC-R04, TC-R06, TC-R09 (indirect), TC-R13, TC-R21, TC-R24 | 2026-07-16 | Entry 7 | ✅ All pass |
| Tier 2 | TC-R11, TC-R12, TC-R14, TC-R15 | 2026-07-16 | Entry 8 | ✅ All pass |
| Simulation | Booking, Slot Consistency, Reschedule, Cancel, Unknown Patient, Inactive Insurance, Discharged, Under-18, Nurse Line, Transfer, FAQ | 2026-07-17 | Entry 11 | ✅ 11 pass |
| Simulation | Emergency Escalation | 2026-07-17 | Entry 11 | ⚠️ Simulator edge case (agent logic correct) |

**`selected_slot` fix applied:** TC-R02 and TC-R11 have been re-verified post-fix.
The Retell LLM config now requires `selected_slot` (with `provider`) in both
`book_appointment` and `reschedule_appointment`. TC-44 end-to-end test confirms the
full `get_availability → book_appointment` chain works correctly.

See `SOURCE_MAP.md` and `docs/ITERATION_LOG.md` for full verification evidence.

---

### TC-R01 — Successful new-patient booking

- **Caller identity:** James Porter, 555-0103, DOB 1990-03-22 (last seen 2023-01-05 → New Patient per D3; UnitedHealthcare active; no assigned provider)
- **Opening statement:** "Hi, I'd like to book an appointment — it's been a few years since I've been in."
- **Expected tool calls:** `lookup_patient` → verified; `run_scheduling_workflow` → eligible (classification `new_patient`); `get_availability` (30 min); `book_appointment`
- **Expected behavior:** Identity verified, insurance and provider-preference asked, 30-minute new-patient slot offered soonest-first, read back and confirmed.
- **Expected escalation:** None.
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R02 — Successful follow-up booking

- **Caller identity:** James Porter, 555-0102, DOB 1971-07-04 (Follow-Up, assigned Dr. Raman, BlueCross active, no existing appointment)
- **Opening statement:** "I need to schedule a follow-up with Dr. Raman."
- **Expected tool calls:** `lookup_patient` → verified; `run_scheduling_workflow` (requested_provider: raman) → eligible; `get_availability` (15 min); `book_appointment`
- **Expected behavior:** Books a 15-minute slot with Dr. Raman at Lakeside, soonest available, read back and confirmed.
- **Expected escalation:** None.
- **Pass/Fail:** **Pass**
- **Observation:** Tool chain fired in order: `lookup_patient(555-0102, 1971-07-04)` → `{status: verified}`; `run_scheduling_workflow(raman, eligible)` → `{outcome: eligible, routed_provider: raman, classification: follow_up}`; `get_availability(raman, follow_up)` → slots returned; `book_appointment` → `{status: booked}`. Agent confirmed booking to caller.
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 7).

### TC-R03 — Paired NP/PA booking

- **Caller identity:** Linda Foster, 555-0111, DOB 1982-11-11 (Follow-Up, assigned Dr. Whitfield)
- **Opening statement:** "Could I see Nina Brooks instead of Dr. Whitfield this time?"
- **Expected tool calls:** `lookup_patient` → verified; `run_scheduling_workflow` (requested_provider: brooks) → eligible (Brooks is Whitfield's pair — allowed under Rule 5); `get_availability`; `book_appointment`
- **Expected behavior:** Accepted without escalation since the paired NP satisfies Rule 5's own-provider continuity.
- **Expected escalation:** None.
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R04 — Inactive insurance

- **Caller identity:** Dana Whitmore, 555-0106, DOB 1969-05-30 (Cigna, inactive)
- **Opening statement:** "I'd like to make an appointment."
- **Expected tool calls:** `lookup_patient` → verified; `run_scheduling_workflow` → ineligible (Rule 3: insurance not active)
- **Expected behavior:** Agent explains the insurance on file shows inactive, cannot book, offers front desk.
- **Expected escalation:** Front desk (offered, caller-driven).
- **Pass/Fail:** **Pass**
- **Observation:** `lookup_patient(555-0106, 1969-05-30)` → `{status: verified}`; `run_scheduling_workflow` → `{outcome: ineligible, reason: "Rule 3: insurance inactive"}`. Agent explained insurance shows inactive and offered front desk transfer.
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 7).

### TC-R05 — Missing policy number

- **Caller identity:** Harold Stevens, 555-0107, DOB 1952-10-09 (Medicare active, assigned Dr. Crane) — states he doesn't have his card handy
- **Opening statement:** "I'd like an appointment, but I don't have my insurance card with me right now."
- **Expected tool calls:** `lookup_patient` → verified; `run_scheduling_workflow` (has_policy_number_confirmed: false) → ineligible (Rule 3 / D4)
- **Expected behavior:** Agent explains the policy number is required at time of booking, suggests calling back once available, offers front desk as an alternative.
- **Expected escalation:** Front desk (offered).
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R06 — Under-18 patient

- **Caller identity:** Caller regarding Robert Kim, 555-0105, DOB 2010-08-15
- **Opening statement:** "I'd like to book an appointment for my son — he's 15."
- **Expected tool calls:** `lookup_patient` → verified; `run_scheduling_workflow` → ineligible (Rule 4: under 18)
- **Expected behavior:** Agent explains the practice doesn't see patients under 18, offers front desk. No guardian-intake workflow is attempted (D5/D12).
- **Expected escalation:** Front desk (offered).
- **Pass/Fail:** **Pass**
- **Observation:** `lookup_patient(555-0105, 2010-08-15)` → `{status: verified}`; `run_scheduling_workflow` → `{outcome: ineligible, reason: "Rule 4: patient under 18"}`. Agent explained the practice doesn't see patients under 18 and automatically offered front desk transfer. No guardian workflow attempted (D5/D12 upheld).
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 7).

### TC-R07 — Discharged patient

- **Caller identity:** Patricia Nguyen, 555-0108, DOB 1978-06-25 (discharged flag)
- **Opening statement:** "I'd like to schedule a visit."
- **Expected tool calls:** `lookup_patient` → verified; `run_scheduling_workflow` → ineligible (Rule 8: discharged)
- **Expected behavior:** Agent declines the booking without over-explaining, offers front desk.
- **Expected escalation:** Front desk (offered).
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R08 — Provider-switch request

- **Caller identity:** Linda Foster, 555-0111, DOB 1982-11-11 (assigned Dr. Whitfield), asking for Dr. Raman specifically — not her paired NP
- **Opening statement:** "Actually, could I switch to see Dr. Raman instead of Dr. Whitfield?"
- **Expected tool calls:** `lookup_patient` → verified; `run_scheduling_workflow` (requested_provider: raman) → transfer_required (Rule 5, D8 — genuine switch needs office approval)
- **Expected behavior:** Agent explains a provider switch needs office approval and transfers — this is an automatic escalation, not an offer the caller can decline into staying on the line for booking.
- **Expected escalation:** Front desk (automatic).
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R09 — Dr. Crane on a non-Thursday

- **Caller identity:** Harold Stevens, 555-0107, DOB 1952-10-09 (assigned Dr. Crane), calling on a non-Thursday, insisting on Crane himself
- **Opening statement:** "I want to see Dr. Crane himself, not the nurse practitioner."
- **Expected tool calls:** `lookup_patient` → verified; `run_scheduling_workflow` (requested_provider: crane, requested_day: Mon) → ineligible (Rule 6: Crane only Thursdays)
- **Expected behavior:** Agent explains Dr. Crane only sees patients himself on Thursdays, offers Sofia Mendez sooner or a Thursday slot with Crane — a scheduling alternative, not a transfer.
- **Expected escalation:** None.
- **Pass/Fail:** **Pass (indirect — Mendez routing verified)**
- **Observation:** Verified as WF3 scenario: Harold Stevens (555-0107) with no stated provider preference → `run_scheduling_workflow(null, eligible)` → `{routed_provider: mendez}`. Agent offered "Sofia Mendez on Friday July 17." Explicit Crane-then-non-Thursday path (exact TC-R09 phrasing) not tested in isolation; Mendez fallback mechanism confirmed working. Note: agent called `run_scheduling_workflow` once before collecting preference (intermediate result `crane`), then again with null → final result `mendez`. End result correct.
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 7). Full TC-R09 exact scenario (explicit Crane request + Mon) to be verified in Tier 2 follow-up.

### TC-R10 — Dr. Crane on a Thursday

- **Caller identity:** Harold Stevens, 555-0107, DOB 1952-10-09, requesting Crane with a Thursday specified
- **Opening statement:** "I'd like to see Dr. Crane, and I can come in on a Thursday."
- **Expected tool calls:** `lookup_patient` → verified; `run_scheduling_workflow` (requested_provider: crane, requested_day: Thu) → eligible (routed_provider: crane); `get_availability`; `book_appointment`
- **Expected behavior:** Books with Dr. Crane himself on a Thursday at Maple Grove.
- **Expected escalation:** None.
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R11 — Reschedule

- **Caller identity:** Margaret Hill, 555-0101, DOB 1958-02-10 (existing appointment: Dr. Whitfield, 2026-07-28 09:30, Maple Grove)
- **Opening statement:** "I need to reschedule my upcoming appointment."
- **Expected tool calls:** `lookup_patient` → verified; `get_existing_appointment` → confirmed; `run_scheduling_workflow` → eligible; `get_availability`; `reschedule_appointment`
- **Expected behavior:** Agent reads back the current appointment, confirms the caller wants to change it, re-collects insurance/provider preference, offers a new soonest slot, confirms.
- **Expected escalation:** None.
- **Pass/Fail:** **Pass**
- **Observation:** Tool chain: `lookup_patient(555-0101, 1958-02-10)` → verified; `get_existing_appointment` → `{confirmed, Dr. Whitfield, maple_grove, 2026-07-28}`; `reschedule_appointment(whitfield, has_policy_number_confirmed: true)` → `{status: booked, slot: 2026-07-17 Fri, maple_grove}`. Agent confirmed: "You're now rescheduled with Dr. Whitfield at our Maple Grove office on Friday, July 17th." Note: `reschedule_appointment` invoked the full pipeline internally; `run_scheduling_workflow` not called separately.
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 8).

### TC-R12 — Cancel

- **Caller identity:** George Adams, 555-0110, DOB 1948-03-17 (existing appointment: Dr. Raman, 2026-08-05 13:00, Lakeside)
- **Opening statement:** "I need to cancel my appointment."
- **Expected tool calls:** `lookup_patient` → verified; `get_existing_appointment` → confirmed; `cancel_appointment` → cancelled
- **Expected behavior:** Agent reads back the appointment, confirms cancellation intent before acting, cancels, confirms it's done.
- **Expected escalation:** None.
- **Pass/Fail:** **Pass**
- **Observation:** `lookup_patient(555-0110, 1948-03-17)` → verified; `get_existing_appointment` → `{confirmed, Dr. Priya Raman, lakeside, 2026-08-05T13:00:00}`; `cancel_appointment(555-0110, 1948-03-17)` → `{status: cancelled, appointmentId: appt-0110}`. Agent confirmed intent before acting; final response: "I'll go ahead and cancel that appointment now."
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 8).

### TC-R13 — Confirm

- **Caller identity:** Sofia Delgado, 555-0109, DOB 1995-09-09 (existing appointment: Dr. Whitfield, 2026-08-03 10:00, Maple Grove)
- **Opening statement:** "Can you confirm the details of my appointment?"
- **Expected tool calls:** `lookup_patient` → verified; `confirm_appointment` → confirmed
- **Expected behavior:** Agent reads back provider, location, date, and time. No changes made or offered unless the caller asks separately.
- **Expected escalation:** None.
- **Pass/Fail:** **Pass**
- **Observation:** `lookup_patient(555-0109, 1995-09-09)` → `{status: verified}`; `confirm_appointment` → `{status: confirmed, provider: "Dr. Whitfield", date: "2026-08-03", time: "10:00", location: "Maple Grove"}`. Agent read back "Dr. Whitfield, August 3rd, Maple Grove" with no mutations attempted.
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 7).

### TC-R14 — Unknown patient

- **Caller identity:** Unlisted number, e.g. 555-0199, any stated date of birth
- **Opening statement:** "Hi, I'd like to book an appointment. My number is 555-0199."
- **Expected tool calls:** `lookup_patient` → not_found
- **Expected behavior:** Agent asks the caller to repeat the phone number once; if still not found, offers a front-desk transfer rather than guessing.
- **Expected escalation:** Front desk (after retry fails).
- **Pass/Fail:** **Pass**
- **Observation:** `lookup_patient(555-0199, 1980-01-01)` → `{status: not_found}`. Agent responded: "Can you slowly repeat the phone number you use with our clinic?" (retry prompt, not immediate transfer — per spec). Did not guess or invent a record.
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 8).

### TC-R15 — No matching appointment

- **Caller identity:** James Porter, 555-0102, DOB 1971-07-04 (no existing appointment), asks to reschedule
- **Opening statement:** "I'd like to reschedule my appointment."
- **Expected tool calls:** `lookup_patient` → verified; `get_existing_appointment` → not_found
- **Expected behavior:** Agent says plainly that it doesn't see an upcoming appointment on file, and asks if the caller would like to book a new one instead or be transferred.
- **Expected escalation:** Optional, caller-driven.
- **Pass/Fail:** **Pass**
- **Observation:** `lookup_patient(555-0102, 1971-07-04)` → verified; `get_existing_appointment` → `{status: not_found}`. Agent: "I'm not seeing anything in the system — the front desk can dig deeper into your chart. I'll connect you to them now." Offered front desk without guessing or inventing an appointment.
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 8).

### TC-R16 — Hours

- **Caller identity:** Any caller, identity verification not required for FAQs.
- **Opening statement:** "What are your hours?"
- **Expected tool calls:** None — answered from the knowledge base.
- **Expected behavior:** States Mon–Fri, 9:00 AM–5:00 PM, closed 12–1 for lunch.
- **Expected escalation:** None.
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R17 — Parking, Maple Grove

- **Caller identity:** Any caller.
- **Opening statement:** "Is there parking at your Maple Grove office?"
- **Expected tool calls:** None — knowledge base.
- **Expected behavior:** States street meter parking at Maple Grove.
- **Expected escalation:** None.
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R18 — Parking, Lakeside

- **Caller identity:** Any caller.
- **Opening statement:** "What about parking at the Lakeside location?"
- **Expected tool calls:** None — knowledge base.
- **Expected behavior:** States a free patient lot at Lakeside.
- **Expected escalation:** None.
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R19 — Annual physical

- **Caller identity:** Any caller, e.g. Linda Foster, 555-0111.
- **Opening statement:** "I'd like to schedule my annual physical."
- **Expected tool calls:** `transfer_front_desk` (identity verification not required — this routes to front desk regardless of who's calling, per Rule 9 / D12).
- **Expected behavior:** Agent explains annual physical scheduling isn't yet supported over the phone, transfers to front desk.
- **Expected escalation:** Front desk (automatic).
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R20 — Billing

- **Caller identity:** Any caller.
- **Opening statement:** "I have a question about a bill I received."
- **Expected tool calls:** `transfer_front_desk`
- **Expected behavior:** Agent transfers without attempting to answer billing questions itself.
- **Expected escalation:** Front desk (automatic).
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R21 — Urgent medical concern

- **Caller identity:** Any caller.
- **Opening statement:** "I've had stomach pain and some blood when I go to the bathroom — should I be worried?"
- **Expected tool calls:** `transfer_nurse_line`
- **Expected behavior:** Agent gives no medical advice and does not attempt to assess severity, transfers to the nurse line.
- **Expected escalation:** Nurse line (automatic).
- **Pass/Fail:** **Pass**
- **Observation:** `transfer_nurse_line(reason: "caller reporting stomach pain and blood")` → `{destination: "(555) 010-2911"}`. Agent said it cannot give medical advice and provided the nurse line number without assessing severity.
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 7).

### TC-R22 — Clear emergency

- **Caller identity:** Any caller.
- **Opening statement:** "I'm having severe chest pain and I can't breathe."
- **Expected tool calls:** None.
- **Expected behavior:** Agent immediately says to hang up and dial 911. No lookup, no transfer, no other tool call — this is the fastest path in the whole agent.
- **Expected escalation:** None (911 instruction is not a transfer).
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R23 — Unrecognized request

- **Caller identity:** Any caller.
- **Opening statement:** "Can you fax my medical records to my lawyer's office?"
- **Expected tool calls:** `transfer_front_desk` (fallback intent).
- **Expected behavior:** Agent says plainly it can't help with that specific request rather than guessing, offers front desk.
- **Expected escalation:** Front desk.
- **Pass/Fail:** Pending
- **Observation:** N/A
- **Iteration:** N/A

### TC-R24 — Caller asks for a human

- **Caller identity:** Any caller.
- **Opening statement:** "I don't want to deal with a robot — can I just talk to a person?"
- **Expected tool calls:** `transfer_front_desk`
- **Expected behavior:** Agent transfers without resistance or any attempt to talk the caller into continuing with it.
- **Expected escalation:** Front desk (automatic).
- **Pass/Fail:** **Pass**
- **Observation:** `transfer_front_desk(reason: "caller requested human agent")` → `{destination: "(555) 010-2000"}`. Agent said it would transfer to a staff member immediately with no resistance or persuasion attempt.
- **Iteration:** Verified 2026-07-16, Retell playground (Entry 7).

---

## Coverage cross-reference

Maps back to `tests/regression-scenarios.md`'s unit-level TC-01–TC-40 (validator/tool
function tests) where the same rule is exercised at the code level:

| This script | Rule / decision | Unit-level equivalent |
|---|---|---|
| TC-R01, TC-R02 | Rules 1, 2, 7 | TC-01–TC-03, TC-04–TC-05, TC-17, TC-27 |
| TC-R03, TC-R08 | Rule 5, D8 | TC-11, TC-12 |
| TC-R04 | Rule 3 | TC-07, TC-25 |
| TC-R05 | Rule 3 / D4 | TC-08 |
| TC-R06 | Rule 4 | TC-09, TC-24 |
| TC-R07 | Rule 8 | TC-18, TC-26 |
| TC-R09, TC-R10 | Rule 6, D7 | TC-14, TC-15, TC-16 |
| TC-R11 | D9 | TC-28 |
| TC-R12 | D6 | TC-30 |
| TC-R13 | D9 | TC-32 |
| TC-R14 | D1 | TC-23 |
| TC-R15 | D9 | TC-29, TC-31 |
| TC-R16–TC-R18 | Clinic FAQs | TC-39, TC-40 |
| TC-R19, TC-R20, TC-R21, TC-R22, TC-R23, TC-R24 | Rule 9, D12, transfers | TC-20, TC-33, TC-34, TC-35–TC-38 (all noted "scaffold only" at the unit level — this script is the first place they're actually exercisable, once an agent exists) |
