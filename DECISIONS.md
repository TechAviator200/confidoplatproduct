# Decisions — Riverbend Voice Agent

Each entry: the ambiguity and its resolution. D1–D12 are approved. Rule numbers refer to the numbered list in the Riverbend Gastroenterology Scheduling Rules PDF.

---

### D1. Identity verification: phone lookup + DOB confirmation
**Approved.** Caller ID / spoken phone number is used only as an *initial* lookup key to retrieve a candidate patient record. Before discussing or modifying any appointment detail, the agent must confirm the patient's date of birth against the record. This also resolves the duplicate-name case in the sample data (two patients named James Porter, 555-0102 and 555-0103, distinguished by phone *and* DOB).
- Implemented by `classify_patient()` input validation, not a separate tool — DOB confirmation gates entry into any booking/reschedule/cancel/confirm flow.

### D2. Validation logic: five small deterministic functions, not one eligibility monolith
**Approved.** Replaces the single `check_booking_eligibility()` originally proposed. Each function owns one rule area and returns pass/fail + reason:
- `classify_patient(last_seen_date, today)` → New vs. Follow-Up (rule 1)
- `validate_age(dob, today)` → blocks under-18 (rule 4)
- `validate_insurance(insurance_status, has_policy_number)` → blocks inactive insurance or missing policy number (rule 3)
- `validate_provider_continuity(patient_classification, assigned_provider, requested_provider)` → enforces own-provider-for-follow-ups and the office-approval requirement to switch (rule 5), plus the Crane/Thursday substitution (rule 6)
- `validate_booking(discharged_flag, ...)` → discharge block (rule 8), and composes the above for a final go/no-go

Rule 2 (visit duration) and rule 7 (soonest appointment) are parameters to the availability tool, not conditionals — no validator needed.

### D3. New-Patient status overrides stale provider assignment
**Approved.** Elena Vasquez (last seen 2019-04-10) and Thomas Wright (last seen 2022-12-01) both carry an "assigned provider" in the sample data, but under rule 1's 3-year lookback they now classify as **New Patients**, not Follow-Up. Rule 5 ("patients see their own provider for follow-ups") is scoped to Follow-Ups.
- **Resolution:** `classify_patient()` runs first and takes precedence. If the result is New Patient, `validate_provider_continuity()` is not invoked — the patient is offered soonest availability across any provider (rule 7), with no continuity obligation. The prior "assigned provider" field is informational only for New-classified patients.

### D4. Insurance check is two independent gates
**Approved.** Rule 3 conflates a system-checkable fact (insurance active/inactive, present in sample data) with a claim the agent cannot verify remotely (caller physically has the card/policy number).
- **Resolution:** `validate_insurance()` checks the active flag from the patient record and fails immediately if inactive (e.g., Dana Whitmore, 555-0106, Cigna inactive) — no need to ask further. Separately, the agent verbally asks the caller to confirm they have their policy number ready; a "no" also fails the check. Both must pass.

### D5. Under-18 calls are declined regardless of caller
**Approved (refined).** Rule 4 blocks patients under 18 (Robert Kim, 555-0105, DOB 2010-08-15, is the only such record) but doesn't address a parent/guardian calling on the minor's behalf.
- **Resolution:** The clinic pack does not define pediatric or guardian scheduling. Rather than inventing workflow behavior, `validate_age()` blocks booking for any patient record that fails the age check, regardless of who is speaking on the call, and the agent transfers callers regarding patients under 18 to the front desk for manual assistance. No guardian-intake workflow is built (see `OUT_OF_SCOPE.md` #8) — this is an application of D12.

### D6. Discharged flag blocks book/reschedule, not cancel or FAQs
**Approved.** Rule 8 only says "do not book." Patricia Nguyen (555-0108) is the sole discharged record.
- **Resolution:** `validate_booking()` blocks new bookings and reschedules (a reschedule is functionally a re-booking) for discharged patients. Canceling an existing appointment, or answering FAQs, is not gated by the discharge flag — there's no policy reason to trap a discharged caller who just wants to cancel or ask about hours.

### D7. Crane/Mendez routing is offered proactively, not withheld until insisted upon
**Approved.** Rule 6: Dr. Crane only sees office patients Thursdays; other days his patients see Sofia Mendez, NP; a patient can only get Crane himself by booking Thursday.
- **Resolution:** When a Crane-assigned Follow-Up patient calls on a non-Thursday, the agent leads with the soonest available slot — which may be with Sofia Mendez — while making clear Dr. Crane himself is only bookable Thursdays. The caller isn't required to already know the rule to get an accurate answer. This satisfies rule 7 (soonest appointment) without hiding the Crane-specific constraint.

### D8. Provider-switch requests are transferred, never self-approved
**Approved.** Rule 5: switching to a different provider "needs approval from the office first — don't just move them over."
- **Resolution:** If a caller asks to change providers (not the Crane/Mendez substitution, which is a defined rule, but a genuine switch — e.g., a Whitfield patient asking for Dr. Raman), the agent does not attempt this via any validator or tool. It explains office approval is required and transfers to front desk.

### D9. "Confirm" means read-back of an existing appointment, no modification
**Approved.** The project scope includes "confirm" alongside book/reschedule/cancel; the clinic pack never defines it.
- **Resolution:** Confirm = caller asks to verify date/time/provider/location of an upcoming appointment; agent looks it up and reads it back. No changes are made in a confirm flow.

### D10. "Today" is a parameter, not a hardcoded date
**Approved.** Rules 1 and 4 both require a current date to compute (3-year lookback; age from DOB). The source materials don't fix one.
- **Resolution:** `classify_patient()` and `validate_age()` both take `today` as an explicit parameter (defaulting to actual current date at runtime), so the logic is correct whenever the agent is run or demoed, and so test cases can pin a fixed `today` for reproducibility.

### D11. Mock shape for the three "has an upcoming appointment" patients
**Approved.** The clinic pack explicitly delegates this: "You decide what the existing appointment looks like." This is permitted invention, not a violation of the no-invented-data constraint, since the source authorizes it.
- **Resolution:** Each of Margaret Hill (555-0101), Sofia Delgado (555-0109), and George Adams (555-0110) gets one mock upcoming appointment: their assigned provider, that provider's location, a near-future date/time consistent with the provider's working days, and visit_type = Follow-Up (all three have been seen within 3 years). No other patients get invented appointments.

### D12. Undefined operational behavior defaults to safe escalation, not invented logic
**Approved.** General principle, added alongside the D5 refinement, that governs how every other ambiguity in this document was resolved.
- **Resolution:** Whenever the clinic pack or project scope leaves operational behavior undefined, the agent favors safe escalation (transfer to front desk or nurse line) over inventing workflow logic to fill the gap. Unsupported healthcare workflow behavior is not invented; assumptions are documented rather than silently implemented. This is why rule 9 (annual physicals) routes to front desk instead of getting a scheduling flow, and why D5 (under-18 calls) declines and escalates rather than building a guardian-intake process.

---

## Approved refinements from this round (recorded for traceability)

1. Phone/caller ID is initial lookup only; DOB confirmation required before discussing/modifying appointment details (D1).
2. Validation logic split into five small deterministic functions instead of one eligibility function (D2).
3. Code comments and documentation reference the applicable Riverbend rule number.
4. Riverbend remains the only concrete clinic implementation in Phase 1.
5. No additional patients, providers, metrics, customer evidence, or unsupported workflows are introduced.
