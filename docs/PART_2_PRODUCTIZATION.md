# Part 2: Productization

## Overview

Part 2 productizes the evidence captured in Part 1 (Riverbend Gastroenterology Retell agent) into a functional React application that supports platform-level product thinking: workflow insights, capability extraction, experiment design, and roadmap planning.

All content in this application is grounded exclusively in Part 1 evidence. Riverbend is the only concrete clinic. No other customers, metrics, or financials are invented.

---

## Running the App

```bash
cd platform-workspace
npm install
npm run dev
# → http://localhost:5173
```

Build check:
```bash
npm run build
```

---

## Architecture

```
platform-workspace/
├── index.html              # Tailwind CDN + full design token config (Material 3)
├── src/
│   ├── App.tsx             # BrowserRouter + 7 routes
│   ├── main.tsx            # React 18 entry point
│   ├── components/
│   │   └── AppShell.tsx    # Header + sidebar + mobile nav
│   ├── data/
│   │   └── mockData.ts     # ALL typed content — single source of truth
│   └── pages/
│       ├── Overview.tsx         # /overview
│       ├── Insights.tsx         # /insights
│       ├── Capabilities.tsx     # /capabilities
│       ├── Experiments.tsx      # /experiments
│       ├── Lifecycle.tsx        # /lifecycle
│       ├── WorkflowDetail.tsx   # /workflow-detail
│       └── Roadmap.tsx          # /roadmap
```

**Stack**: Vite 5 + React 18 + React Router 6 + TypeScript (strict). Tailwind via CDN with the same Material Design 3 token configuration used in the Stitch design prototypes.

---

## Design System

Token configuration (matches the Stitch design prototypes):
- Tailwind CDN with `plugins=forms,container-queries`
- Material Design 3-inspired color tokens (primary, secondary, surface, error containers)
- Inter + JetBrains Mono fonts
- Material Symbols Outlined icon font
- Custom spacing tokens: `panel-padding`, `margin-page`, `gutter`

---

## Content Sourcing

Every data point in `mockData.ts` traces to a Part 1 artifact:

| Data                          | Source                                              |
|-------------------------------|-----------------------------------------------------|
| Clinic name, locations        | source-materials/Clinic-Pack PDF                    |
| Scheduling rules (Rules 1–9)  | source-materials/Clinic-Pack PDF                    |
| Decisions (D1–D12)            | DECISIONS.md                                        |
| Test cases (TC-R02 etc.)      | retell/TEST_CALL_SCRIPT.md                          |
| Validator functions           | tools/validators/ (Part 1 code)                     |
| Tool contracts                | tools/contracts/ (Part 1 code)                      |
| Agent / LLM IDs               | retell/ config files                                |
| Architecture patterns         | docs/ARCHITECTURE.md                                |
| Experiment design             | Part 2 requirements                                 |

---

## Seven Screens

### 1. Overview (`/overview`)
- Clinic: Riverbend Gastroenterology (2 locations)
- 11 implemented + verified workflows
- 10 capability candidates (all labeled "Proposed")
- 3 explicit Riverbend-specific exceptions
- 4 open platform decisions
- Validation status: 38/38 unit tests pass, 12 simulation scenarios run (11 pass)

### 2. Workflow Insights (`/insights`)
- Three classification sections: Reusable capability candidates / Clinical configuration / Customer-specific exceptions
- Each item shown as an editable row: name | workflow subclass (dropdown) | remove control
- Inline add-row form with predefined suggestions and free-text entry; subclass selection required before adding
- Customer-specific exceptions support an "advance to evaluation" toggle ("Selected for platform evaluation")
- Platform signal summary box below the classification sections

### 3. Capability Inventory (`/capabilities`)
- 10 capability candidates, all labeled "Candidate — requires validation"
- Filterable by category
- Expandable rows with evidence source files, config needs, validation requirements
- No capability has been extracted as a platform primitive

### 4. Validation Plan (`/experiments`)
- 6 proposed experiments, none started
- Clear "No live data" warning
- Each experiment has: hypothesis, metric, proposed threshold, validation scope, decision rule
- Honest summary: 0 running, 38/38 unit tests, 12 simulation scenarios (11 pass)

### 5. Workflow Lifecycle (`/lifecycle`)
- 15-stage FDE → Platform operating model
- Timeline visualization with per-stage status (Done / In Progress / Not Started)
- Riverbend is at "Evidence Capture" stage — everything after is proposed
- Each stage has owner, description, and Riverbend-specific example

### 6. Workflow Detail (`/workflow-detail`)
- Workflow selector (all 5 workflows)
- Booking workflow deep-dive: three-layer architecture (Prompt / Tools / KB)
- Validator pipeline table (5 validators, rules, results)
- Capability cross-reference with cap IDs

### 7. Platform Roadmap (`/roadmap`)
- 19 proposed items, zero committed
- Three horizons: Now (6) / Next (7) / Later (6)
- Each item has rationale and business value grounded in Riverbend evidence
- "Later" items explicitly note why they are premature with one customer
- Items are editable (name, description, rationale, business value, horizon) via hover → edit modal

---

## Fabricated Content Removed

The original Stitch design prototypes (in `stitch-export/`) served as the visual reference for this application. They contained the following content that was identified as unsupported and excluded from the implementation:

| Fabricated item                               | Why excluded                                                |
|----------------------------------------------|--------------------------------------------------------------|
| "confido-east-01" infrastructure node         | No such node exists in evidence                              |
| "$12k/mo efficiency" ROI metric               | No financial data in Part 1                                  |
| "94% platform readiness"                      | No such measurement exists                                   |
| "14/8/22 Locations" count                     | Riverbend has 2 locations; others are invented               |
| "Sarah Chen", "Marcus Thorne" owners          | No named owners in source materials                         |
| "Auth0/Clinical SSO" integration              | Not implemented or discussed                                 |
| "facial recognition" identity hypothesis      | Wrong — Riverbend uses phone + DOB                          |
| "88.4%/14.2%/98.4%" live metrics              | No live calls have occurred                                  |
| "Intake Automation" workflow name             | Not a workflow in the implementation                         |
| "BR-041 age>65 Medicare bypass" rule          | Does not exist in clinic pack                                |
| "Promote to Prod" button                      | No production deployment in scope                            |
| "SSN + Date of Birth" identity method         | Wrong — should be phone + DOB                               |
| "Q1 Foundations ✓" with Completed status     | No platform capabilities have been completed                 |

---

## Product Thesis

**The FDE function is Confido's best source of platform insight.**

Every clinic engagement produces a decision log (DECISIONS.md), a source map (SOURCE_MAP.md), test evidence (TEST_CALL_SCRIPT.md), and a working implementation. The question for the platform team is: which parts of that implementation are worth generalizing, and what evidence threshold justifies the investment?

Riverbend shows:
1. A deterministic policy engine (5 validators) is a strong candidate for platform extraction — but only once a second clinic's rules are compared.
2. Identity verification (phone + DOB) is likely universal — but the pattern needs one more clinic to confirm.
3. Provider-specific exceptions (Crane/Mendez) are clearly clinic-specific — the right platform answer is an exception isolation pattern, not a new capability.
4. The FDE operating model (discovery → evidence → review → platform decision) is already working — it just needs to be codified before the next engagement.

The Part 2 workspace is designed to support that operating model by making the evidence visible, structured, and reviewable by platform stakeholders who were not present during the FDE engagement.
