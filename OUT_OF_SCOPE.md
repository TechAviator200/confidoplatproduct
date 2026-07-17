# Out of Scope — Phase 1

Explicit exclusions, each tied to why.

## 1. Annual wellness / physical visits
The clinic pack marks this **[TBD — let's discuss]** (rule 9) — the practice itself hasn't decided which providers do these or how they're scheduled. Building scheduling logic for this would mean inventing clinic policy. Handling: agent recognizes the request and transfers to the front desk, per the clinic pack's own example of what routes to front desk ("billing, the 'annual physical' case above, or an unrecognized request").

## 2. Live telephony
Live telephony is a nice-to-have, not required. A hosted HTTP adapter (`server/`) was
built and the agent was verified end-to-end via the Retell playground completion API.
An actual live phone call was not made or required. The Retell agent is configured and
reachable at Agent ID `agent_bcafdd7dd80967d3df25c80fdb`.

## 3. A real backend or database
Mock/canned tool responses from the given sample data are sufficient and are what's asked for.

## 4. Multi-clinic platform abstraction
A generalized config schema, rules DSL, or multi-tenant structure for supporting clinics beyond Riverbend is Part 2's conceptual territory (productizing agent-building), not a Part 1 build task. Per approved refinement, **Riverbend remains the only concrete clinic implementation** in Part 1.

## 5. Additional patients, providers, insurance payers, or locations
Only the 12 patients, 6 providers/paired staff, and 2 locations given in the clinic pack are used. No synthetic records.

## 6. Auth, security, or compliance machinery
Not implemented in this build. All data is synthetic; the security posture is
documented in `docs/SECURITY.md` along with what production would require.

## 7. Achieved metrics or customer evidence
No claims about performance, adoption, or outcomes are made anywhere in these documents unless sourced from the clinic pack or source materials. (Karan's notes contain real Confido context but no achieved metrics for this build — see `NOTES_FROM_KARAN.md`.)

## 8. Calls-on-behalf-of-a-minor workflow
The clinic pack states patients under 18 aren't seen (rule 4) but doesn't define a guardian-intake or referral process. Not inventing one — the agent declines and routes to front desk (see `DECISIONS.md`).
