# Project Brief — Riverbend Gastroenterology Voice Agent

## Source of truth

This brief is derived solely from:
- `source-materials/Take-Home-Assignment (1) (1).pdf` — the project brief PDF
- `source-materials/Clinic-Pack (1) (1).pdf` — Riverbend's scheduling rules and sample data

The PDFs remain authoritative. Where this brief interprets or fills a gap, it is marked **[ASSUMPTION]** or **[PROPOSED DECISION]** — see `DECISIONS.md` for the resolved list.

## What we're building

A voice agent for Riverbend Gastroenterology (single clinic, two locations: Maple Grove, Lakeside) that handles inbound calls for:

1. **Appointment management** — book (new and existing patients), reschedule, cancel, confirm
2. **Clinic FAQs** — hours, locations, parking
3. **Transfers** — front desk (person requests, unhandled requests), nurse line / medical professional (urgent medical concerns), with an explicit hang-up-and-dial-911 instruction for clear emergencies
4. **Graceful failure handling** — no matching patient, no matching appointment, unrecognized request, caller asking for a human

Tool calls return **mock data from the given sample set only** — no live backend, no real telephony required. A hosted stub + tunnel (ngrok) is a nice-to-have, not required. Retell is the preferred build platform.

## What "done" looks like (Part 1 deliverables)

1. **The agent** — a Retell workspace/agent that can be opened and viewed
2. **Architecture write-up** — structure, guardrails, and the principled reasoning behind what lives in the prompt vs. a tool call vs. a knowledge base
3. **Iteration log** — high-level record of what changed and why during the build

## What's explicitly out of scope for Part 1

See `OUT_OF_SCOPE.md`. In brief: annual wellness/physical visits (rule 9 is marked TBD by the clinic itself), live telephony, a real backend, and any multi-clinic platform abstraction — that abstraction is the subject of Part 2, not something to half-build here.

## Part 2 (separate deliverable, not covered by this brief)

A short productization document: where an agentic/AI-driven solve fits (and doesn't) in building and iterating these agents across many clinics; experiments with metrics and sequencing; prioritization. Scoped and written after Part 1, since Part 2 reasons from the evidence produced in Part 1.

## Guiding constraint

Do not invent patient records, clinic rules, Confido customer data, achieved metrics, or product behavior beyond what the two PDFs state or what they explicitly delegate to us to decide (e.g., the shape of the three "has an upcoming appointment" records, which the clinic pack says we get to define).
