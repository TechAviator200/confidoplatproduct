# stitch-export/ — Design Prototypes (Reference Only)

These are the original Stitch-generated design prototypes that served as the visual
reference for the Part 2 React application. They are **design artifacts**, not
implementation artifacts.

## What these are

| Folder | Stitch screen title | Corresponding implementation |
|---|---|---|
| `executive-overview/` | Executive Overview | `/overview` (Overview.tsx) |
| `workflow-decomposition/` | Workflow Decomposition | `/insights` (Insights.tsx) — redesigned |
| `capability-inventory/` | Capability Inventory | `/capabilities` (Capabilities.tsx) |
| `experiment-dashboard/` | Experiment Dashboard | `/experiments` (Experiments.tsx) — retitled "Validation Plan" |
| `workflow-detail/` | Workflow Detail | `/workflow-detail` (WorkflowDetail.tsx) |
| `workflow-lifecycle/` | Workflow Lifecycle | `/lifecycle` (Lifecycle.tsx) |
| `platform-roadmap/` | Platform Roadmap | `/roadmap` (Roadmap.tsx) |

## Important notes

- Screen names in `meta.json` reflect the original Stitch project names, which diverge
  from the final implementation screen names in several places (see table above).
- Several Stitch screens contained fabricated content (invented metrics, fictional
  owners, unsupported rules) that was identified and excluded from the implementation.
  See `docs/PART_2_PRODUCTIZATION.md` → "Fabricated Content Removed" for the full list.
- The Workflow Insights screen (`/insights`) was substantially redesigned from the
  "Workflow Decomposition" prototype: it uses a row-based classification UI rather
  than expandable workflow-primitive cards.
- The token configuration (colors, fonts, spacing) was preserved from the prototypes;
  the content and interaction patterns were independently implemented.
- The file `stitch_confido_product_forge.zip` at the repository root is the original
  Stitch export archive — the same design reference material, packaged as a ZIP. It is
  also reference-only and is not part of the evaluated submission.
