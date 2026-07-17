/**
 * Local mock data for Confido Platform Workspace - Part 2.
 *
 * Source of truth for all content:
 *   - source-materials/Clinic-Pack PDF (Riverbend rules)
 *   - source-materials/Take-Home-Assignment PDF
 *   - DECISIONS.md (D1–D12)
 *   - SOURCE_MAP.md
 *   - docs/ARCHITECTURE.md
 *   - retell/TEST_CALL_SCRIPT.md
 *
 * Riverbend Gastroenterology is the ONLY concrete clinic implementation.
 * All future-state items are labeled "Proposed", "Candidate", or "Illustrative".
 * No invented Confido customers, metrics, financials, or internal tooling.
 */

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type ReadinessLabel =
  | 'Candidate: needs validation'
  | 'Proposed'
  | 'Illustrative'
  | 'Not yet evaluated'

export type PrimitiveType = 'Reusable Capability' | 'Clinic Config' | 'Clinic Exception'

export type ExperimentStatus =
  | 'Proposed'
  | 'Pending baseline'

export type LifecycleStage =
  | 'Customer Need'
  | 'FDE Discovery'
  | 'Workflow Prototype'
  | 'Customer Validation'
  | 'Evidence Capture'
  | 'Pattern Review'
  | 'Platform Product Assessment'
  | 'Capability Classification'
  | 'PRD Creation'
  | 'Stakeholder Review and Sign-off'
  | 'Engineering Prioritization'
  | 'Platform Implementation'
  | 'Release'
  | 'Customer Configuration'
  | 'Adoption Monitoring'
  | 'Outcome Measurement'
  | 'Iteration'

// ─── OVERVIEW ───────────────────────────────────────────────────────────────

export const overview = {
  clinic: 'Riverbend Gastroenterology',
  clinicNote: 'Single clinic - two locations (Maple Grove, Lakeside)',
  agent: 'Retell voice agent (Part 1)',
  agentId: 'agent_bcafdd7dd80967d3df25c80fdb',
  workflowsImplemented: [
    'Appointment confirmation verified',
    'New-patient and follow-up booking verified',
    'Rescheduling verified',
    'Cancellation verified',
    'Provider routing (Crane/Mendez Thursday) verified',
    'Inactive insurance correctly prevented booking',
    'Under-18 booking correctly blocked',
    'Unknown patient handled without data exposure',
    'No appointment on file handled correctly',
    'Human escalation correctly routed to front desk',
    'Medical emergency escalation verified',
  ],
  capabilityCandidates: [
    'Identity verification (phone + DOB)',
    'Appointment retrieval',
    'Scheduling orchestration',
    'Availability lookup',
    'Mutation confirmation',
    'Knowledge retrieval (FAQs)',
    'Deterministic policy engine',
    'Provider routing',
    'Escalation routing',
    'Transfer resolution',
  ],
  explicitExceptions: [
    'Dr. Crane is available Thursdays only - a clinic-specific scheduling constraint',
    'Sofia Mendez substitutes when Dr. Crane is unavailable - a clinic-specific provider pairing',
    'Annual physical requests routed to front desk - clinic policy not defined, cannot be automated',
  ],
  validationStatus: '12 simulation scenarios run (11 pass). 38/38 unit tests pass.',
  platformDecisionsNeeded: [
    'Which capabilities are ready to extract as platform primitives?',
    'What is the minimum configuration schema for a second clinic?',
    'How should provider-specific exceptions (Crane rule) be modeled?',
    'What experiment baselines should be established at Riverbend before generalization?',
  ],
}

// ─── WORKFLOWS ───────────────────────────────────────────────────────────────

export interface WorkflowPrimitive {
  step: string
  type: PrimitiveType
  riverbendImpl: string
  note?: string
}

export interface WorkflowDecomposition {
  id: string
  name: string
  primitives: WorkflowPrimitive[]
  riverbendRules?: string
}

export const workflows: WorkflowDecomposition[] = [
  {
    id: 'confirmation',
    name: 'Appointment Confirmation',
    riverbendRules: 'D1, D9',
    primitives: [
      { step: 'Identity verification', type: 'Reusable Capability', riverbendImpl: 'lookupPatient(phone + DOB)', note: 'Phone is initial key; DOB required before data is disclosed (D1)' },
      { step: 'Appointment retrieval', type: 'Reusable Capability', riverbendImpl: 'confirmAppointment() - read-only' },
      { step: 'Read-back confirmation', type: 'Reusable Capability', riverbendImpl: 'LLM relays tool result verbatim', note: 'No mutation in confirm flow (D9)' },
    ],
  },
  {
    id: 'booking',
    name: 'Appointment Booking',
    riverbendRules: 'Rules 1–8, D1–D12',
    primitives: [
      { step: 'Identity verification', type: 'Reusable Capability', riverbendImpl: 'lookupPatient(phone + DOB)' },
      { step: 'Patient classification', type: 'Reusable Capability', riverbendImpl: 'classifyPatient(lastSeen, today) → New | Follow-Up (Rule 1)' },
      { step: 'Insurance validation', type: 'Reusable Capability', riverbendImpl: 'validateInsurance(active, hasPolicyNumber) (Rule 3, D4)' },
      { step: 'Provider continuity', type: 'Reusable Capability', riverbendImpl: 'validateProviderContinuity(classification, assigned, requested) (Rule 5)' },
      { step: 'Provider routing - Crane/Mendez', type: 'Clinic Exception', riverbendImpl: 'validateProviderContinuity - Crane Thursdays-only; default → Mendez (Rule 6, D7)' },
      { step: 'Availability lookup', type: 'Reusable Capability', riverbendImpl: 'getAvailability(provider, classification) - soonest-first (Rule 7)' },
      { step: 'Mutation confirmation', type: 'Reusable Capability', riverbendImpl: 'bookAppointment() - read-back before commit' },
      { step: 'Visit duration', type: 'Clinic Config', riverbendImpl: 'New Patient 30 min / Follow-Up 15 min (Rule 2)' },
      { step: 'Under-18 block', type: 'Clinic Config', riverbendImpl: 'validateAge(dob, today) (Rule 4, D5)' },
      { step: 'Discharge block', type: 'Clinic Config', riverbendImpl: 'validateBooking(discharged) (Rule 8, D6)' },
    ],
  },
  {
    id: 'reschedule',
    name: 'Rescheduling',
    riverbendRules: 'D1, D6, D9',
    primitives: [
      { step: 'Identity verification', type: 'Reusable Capability', riverbendImpl: 'lookupPatient(phone + DOB)' },
      { step: 'Appointment retrieval', type: 'Reusable Capability', riverbendImpl: 'getExistingAppointment() - confirm exists before collecting new preferences' },
      { step: 'Scheduling orchestration', type: 'Reusable Capability', riverbendImpl: 'rescheduleAppointment() - full validator pipeline' },
      { step: 'Availability lookup', type: 'Reusable Capability', riverbendImpl: 'getAvailability()' },
      { step: 'Mutation confirmation', type: 'Reusable Capability', riverbendImpl: 'Read-back new slot before commit' },
    ],
  },
  {
    id: 'cancellation',
    name: 'Cancellation',
    riverbendRules: 'D1, D6',
    primitives: [
      { step: 'Identity verification', type: 'Reusable Capability', riverbendImpl: 'lookupPatient(phone + DOB)' },
      { step: 'Appointment retrieval', type: 'Reusable Capability', riverbendImpl: 'getExistingAppointment() - confirm exists before acting' },
      { step: 'Mutation confirmation', type: 'Reusable Capability', riverbendImpl: 'cancelAppointment() - no eligibility pipeline; discharge allowed (D6)' },
    ],
  },
  {
    id: 'escalation',
    name: 'Transfer and Escalation',
    riverbendRules: 'Rule 9, D8, D12',
    primitives: [
      { step: 'Intent recognition', type: 'Reusable Capability', riverbendImpl: 'Prompt-level - "front desk", "human", billing, unrecognized' },
      { step: 'Safety classification', type: 'Reusable Capability', riverbendImpl: 'Prompt-level - urgent medical vs. administrative' },
      { step: 'Transfer routing', type: 'Reusable Capability', riverbendImpl: 'transferCall(front_desk | nurse_line) - number from clinicInfo.ts, never from prompt' },
      { step: 'Emergency instruction', type: 'Reusable Capability', riverbendImpl: 'Prompt-scripted 911 instruction - no tool call (fastest path)' },
      { step: 'Annual physical routing', type: 'Clinic Config', riverbendImpl: '→ front desk (Rule 9 undefined by clinic, D12 escalate-over-invent)' },
    ],
  },
]

// ─── CAPABILITY INVENTORY ────────────────────────────────────────────────────

export interface Capability {
  id: string
  name: string
  category: string
  riverbendEvidence: string
  riverbendFile: string
  reusePotential: 'High' | 'Medium' | 'Low'
  configNeeds: string
  exceptionRisk: 'Low' | 'Medium' | 'High'
  readiness: ReadinessLabel
  validationRequired: string
}

export const capabilities: Capability[] = [
  {
    id: 'cap-01',
    name: 'Identity Verification',
    category: 'Identity and access',
    riverbendEvidence: 'Phone + date of birth identity gate, used across all five workflows. No caller data disclosed until both are matched.',
    riverbendFile: 'tools/contracts/lookupPatient.ts',
    reusePotential: 'High',
    configNeeds: 'Identity field combination (phone+DOB at Riverbend; could be MRN+DOB elsewhere)',
    exceptionRisk: 'Low',
    readiness: 'Candidate: needs validation',
    validationRequired: 'Verify the phone+DOB pattern holds for at least one additional clinic before abstracting',
  },
  {
    id: 'cap-02',
    name: 'Appointment Retrieval',
    category: 'Scheduling',
    riverbendEvidence: 'Appointment lookup and read-back used in confirmation, rescheduling, and cancellation flows. Read-only before any mutation.',
    riverbendFile: 'tools/contracts/confirmAppointment.ts',
    reusePotential: 'High',
    configNeeds: 'Data source (mock at Riverbend; EHR adapter required for production)',
    exceptionRisk: 'Low',
    readiness: 'Candidate: needs validation',
    validationRequired: 'EHR integration pattern must be defined before this becomes cross-clinic',
  },
  {
    id: 'cap-03',
    name: 'Scheduling Orchestration',
    category: 'Scheduling',
    riverbendEvidence: 'Full booking validator pipeline covering new-patient classification, insurance, age, and provider continuity rules.',
    riverbendFile: 'tools/contracts/runSchedulingWorkflow.ts',
    reusePotential: 'High',
    configNeeds: 'Validator pipeline composition; clinic-specific rules as configuration',
    exceptionRisk: 'Medium',
    readiness: 'Candidate: needs validation',
    validationRequired: 'Which validators are universal vs. clinic-specific requires cross-clinic data',
  },
  {
    id: 'cap-04',
    name: 'Policy Engine',
    category: 'Policy enforcement',
    riverbendEvidence: 'Five deterministic validators: patient classification, age check, insurance validation, provider continuity, and booking eligibility.',
    riverbendFile: 'tools/validators/',
    reusePotential: 'High',
    configNeeds: 'Per-clinic rule parameters (age threshold, insurance requirements, discharge rules)',
    exceptionRisk: 'Medium',
    readiness: 'Candidate: needs validation',
    validationRequired: 'Pattern must hold for a second clinic with a different rule set',
  },
  {
    id: 'cap-05',
    name: 'Availability Lookup',
    category: 'Scheduling',
    riverbendEvidence: 'Provider availability lookup returning the soonest available slot. Respects provider, visit classification, and location.',
    riverbendFile: 'tools/contracts/getAvailability.ts',
    reusePotential: 'Medium',
    configNeeds: 'Provider schedules, working days, location mapping',
    exceptionRisk: 'Medium',
    readiness: 'Candidate: needs validation',
    validationRequired: 'Provider schedule data models vary significantly by clinic',
  },
  {
    id: 'cap-06',
    name: 'Mutation Confirmation',
    category: 'Workflow operations',
    riverbendEvidence: 'Book, cancel, and reschedule flows all use a read-back step before committing the change. Reduces caller error.',
    riverbendFile: 'tools/contracts/bookAppointment.ts',
    reusePotential: 'High',
    configNeeds: 'Confirmation message template, slot structure',
    exceptionRisk: 'Low',
    readiness: 'Candidate: needs validation',
    validationRequired: 'Verify confirmation flow pattern is consistent with other Confido voice agents',
  },
  {
    id: 'cap-07',
    name: 'Knowledge Retrieval',
    category: 'Knowledge retrieval',
    riverbendEvidence: 'Clinic FAQ responses verified for hours, locations, and parking across sampled calls. No hallucinated facts observed.',
    riverbendFile: 'tools/contracts/getClinicInfo.ts',
    reusePotential: 'High',
    configNeeds: 'Per-clinic FAQ content (hours, locations, parking, policies)',
    exceptionRisk: 'Low',
    readiness: 'Candidate: needs validation',
    validationRequired: 'Knowledge base structure and update cadence should be standardized across clinics',
  },
  {
    id: 'cap-08',
    name: 'Provider Continuity',
    category: 'Provider routing',
    riverbendEvidence: 'Follow-up patients must see their existing provider. Enforced as a hard rule for Riverbend scheduling.',
    riverbendFile: 'tools/validators/validateProviderContinuity.ts',
    reusePotential: 'Medium',
    configNeeds: 'Continuity policy (strict vs. flexible), provider pairing rules',
    exceptionRisk: 'High',
    readiness: 'Candidate: needs validation',
    validationRequired: 'Provider continuity rules vary widely across clinics - high exception risk',
  },
  {
    id: 'cap-09',
    name: 'Provider Routing',
    category: 'Provider routing',
    riverbendEvidence: 'Dr. Crane Thursdays-only constraint with Mendez substitution - a Riverbend-specific routing exception.',
    riverbendFile: 'tools/validators/validateProviderContinuity.ts',
    reusePotential: 'Low',
    configNeeds: 'Provider substitution rules, availability schedules',
    exceptionRisk: 'High',
    readiness: 'Not yet evaluated',
    validationRequired: 'Crane/Mendez pattern is likely Riverbend-specific. Needs cross-clinic data before any generalization.',
  },
  {
    id: 'cap-10',
    name: 'Escalation Routing',
    category: 'Escalation',
    riverbendEvidence: 'Transfer to front desk or nurse line verified in human and medical escalation scenarios.',
    riverbendFile: 'tools/contracts/transferCall.ts',
    reusePotential: 'High',
    configNeeds: 'Transfer destinations, escalation trigger definitions',
    exceptionRisk: 'Low',
    readiness: 'Candidate: needs validation',
    validationRequired: 'Transfer destinations and triggers should be defined in a clinic configuration schema',
  },
]

// ─── EXPERIMENTS ─────────────────────────────────────────────────────────────

export interface Experiment {
  id: string
  name: string
  hypothesis: string
  targetWorkflow: string
  metric: string
  proposedThreshold: string
  validationScope: string
  decisionRule: string
  status: ExperimentStatus
}

export const experiments: Experiment[] = [
  {
    id: 'EXP-01',
    name: 'Identity Verification Completion',
    hypothesis: 'Phone + DOB identity gate completes successfully without caller drop-off in >90% of calls.',
    targetWorkflow: 'All workflows (identity gate is universal)',
    metric: 'Verification completion rate (verified / (verified + not_found + dob_mismatch + drop-off))',
    proposedThreshold: '>90% completion',
    validationScope: 'Riverbend - first 50 live calls',
    decisionRule: 'If <90%: investigate whether callers lack DOB, misstate it, or drop; adjust prompt or retry logic.',
    status: 'Proposed',
  },
  {
    id: 'EXP-02',
    name: 'Tool-Call Success Rate',
    hypothesis: 'All 10 custom tools fire correctly on first attempt in >95% of relevant interactions.',
    targetWorkflow: 'All workflows',
    metric: 'Tool call success rate per tool (successful responses / total invocations)',
    proposedThreshold: '>95% per tool',
    validationScope: 'Riverbend - monitor over 100 live interactions',
    decisionRule: 'If any tool <95%: investigate prompt clarity, parameter extraction, or tool definition.',
    status: 'Proposed',
  },
  {
    id: 'EXP-03',
    name: 'Booking Completion Rate',
    hypothesis: 'Callers who express booking intent complete a booking in >70% of cases.',
    targetWorkflow: 'Appointment Booking',
    metric: 'Booking completion rate (booked / (booked + blocked + abandoned))',
    proposedThreshold: '>70% intent-to-completion',
    validationScope: 'Riverbend - first 50 booking-intent calls',
    decisionRule: 'If <70%: separate blocked (legitimate rule) from abandoned (confusion/friction). Address friction only.',
    status: 'Proposed',
  },
  {
    id: 'EXP-04',
    name: 'Human Escalation Accuracy',
    hypothesis: 'Front-desk transfers contain only calls that legitimately require human handling (no false positives).',
    targetWorkflow: 'Transfer and Escalation',
    metric: 'Escalation accuracy (appropriate transfers / total transfers)',
    proposedThreshold: '>85% appropriate',
    validationScope: 'Riverbend - FDE review of first 30 escalated calls',
    decisionRule: 'If <85%: review escalation trigger definitions in system prompt.',
    status: 'Proposed',
  },
  {
    id: 'EXP-05',
    name: 'Knowledge-Base Answer Accuracy',
    hypothesis: 'FAQ answers (hours, locations, parking) are accurate and answered without tool calls in >95% of FAQ-intent calls.',
    targetWorkflow: 'Knowledge base queries',
    metric: 'KB accuracy rate (correct answers / FAQ intent calls)',
    proposedThreshold: '>95% accuracy, 0 hallucinated facts',
    validationScope: 'Riverbend - manual review of 20 FAQ calls',
    decisionRule: 'If any hallucinated facts: tighten system prompt guardrails. If KB misses: update content.',
    status: 'Proposed',
  },
  {
    id: 'EXP-06',
    name: 'FDE Workflow-to-Review Turnaround',
    hypothesis: 'The workflow analysis and evidence-capture process (as practiced on Riverbend) can produce a platform-reviewable pattern within 2 weeks of a new clinic implementation.',
    targetWorkflow: 'Workflow lifecycle (proposed operating model)',
    metric: 'Days from first live call to pattern review submission',
    proposedThreshold: '<14 days',
    validationScope: 'Proposed baseline from Riverbend - requires next clinic implementation to measure',
    decisionRule: 'If >14 days: identify where the lifecycle stalls (evidence capture, tooling, review bandwidth).',
    status: 'Proposed',
  },
]

// ─── WORKFLOW LIFECYCLE ───────────────────────────────────────────────────────

export interface LifecycleStep {
  stage: LifecycleStage
  icon: string
  description: string
  riverbendExample: string
  owner: string
  notes?: string
}

export const lifecycleSteps: LifecycleStep[] = [
  {
    stage: 'Customer Need',
    icon: 'contact_support',
    description: 'Clinic identifies a pain point or operational friction that warrants automation.',
    riverbendExample: 'Riverbend inbound scheduling calls require manual front-desk handling. High call volume, repetitive queries.',
    owner: 'FDE / Customer Success',
  },
  {
    stage: 'FDE Discovery',
    icon: 'person_search',
    description: 'FDE scopes the problem, documents clinic-specific rules, and surfaces all ambiguities before writing code.',
    riverbendExample: 'Read Riverbend clinic pack; documented 12 scheduling rules; surfaced 10 ambiguities before writing any code.',
    owner: 'FDE',
  },
  {
    stage: 'Workflow Prototype',
    icon: 'design_services',
    description: 'Low-fidelity implementation to validate the solution shape. Deterministic core first, LLM layer second.',
    riverbendExample: 'Five-function deterministic pipeline + mock tool contracts + 38 unit tests (Part 1, Phase 1).',
    owner: 'FDE',
  },
  {
    stage: 'Customer Validation',
    icon: 'verified',
    description: 'Pilot with real or simulated call volume; caller outcomes observed and documented.',
    riverbendExample: '12 simulation scenarios run via Retell playground (11 pass). Live agent not yet deployed.',
    owner: 'FDE + Customer',
    notes: 'Riverbend is at late prototype / early validation stage.',
  },
  {
    stage: 'Evidence Capture',
    icon: 'analytics',
    description: 'Structured documentation of what worked, what failed, and what is rule-bound vs. configurable.',
    riverbendExample: 'SOURCE_MAP.md, DECISIONS.md, TEST_CALL_SCRIPT.md, ITERATION_LOG.md - full traceability from clinic rule to test case.',
    owner: 'FDE',
  },
  {
    stage: 'Pattern Review',
    icon: 'schema',
    description: 'Platform Product reviews FDE evidence for cross-clinic generalizability. Identifies recurring patterns vs. clinic-specific rules.',
    riverbendExample: 'Proposed - not yet conducted. 10 capability candidates, 5 clinic-config items, 3 explicit exceptions identified.',
    owner: 'Platform Product',
    notes: 'Requires at least one additional clinic for meaningful comparison.',
  },
  {
    stage: 'Platform Product Assessment',
    icon: 'rate_review',
    description: 'Platform PM evaluates each pattern: reuse potential, exception risk, configuration surface, and cross-clinic evidence. Makes an explicit Promote / Defer / Exception recommendation.',
    riverbendExample: 'Proposed - capability evaluation in progress (Capabilities tab). No extraction decisions made yet.',
    owner: 'Platform Product',
    notes: 'This is the core Platform PM judgment stage. A recommendation must be documented before engineering begins.',
  },
  {
    stage: 'Capability Classification',
    icon: 'account_tree',
    description: 'Each workflow step is classified as: Reusable Capability / Clinical Configuration / Customer-Specific Exception. Exceptions are isolated and documented, not generalized.',
    riverbendExample: 'Proposed: Identity Verification and Scheduling Orchestration as platform candidates. Crane/Mendez Thursday rule as customer-specific exception.',
    owner: 'Platform Product',
  },
  {
    stage: 'PRD Creation',
    icon: 'description',
    description: 'Platform PM authors product requirements for each approved capability: interface contract, configuration schema, and success criteria.',
    riverbendExample: 'Not yet started. Requires Platform Product Assessment and Capability Classification to complete first.',
    owner: 'Platform Product',
  },
  {
    stage: 'Stakeholder Review and Sign-off',
    icon: 'groups',
    description: 'Platform Engineering, FDE, and stakeholders review the PRD. Align on scope, feasibility, and configuration surface before engineering begins.',
    riverbendExample: 'Not yet started.',
    owner: 'Platform Product + Platform Engineering + FDE',
  },
  {
    stage: 'Engineering Prioritization',
    icon: 'low_priority',
    description: 'Platform Engineering sizes and schedules approved capabilities against the platform roadmap.',
    riverbendExample: 'Not yet started.',
    owner: 'Platform Engineering',
  },
  {
    stage: 'Platform Implementation',
    icon: 'engineering',
    description: 'Build the capability as a shared, configurable platform component with an FDE-facing configuration schema.',
    riverbendExample: 'Not yet started.',
    owner: 'Platform Engineering',
  },
  {
    stage: 'Release',
    icon: 'rocket_launch',
    description: 'General availability of the capability. FDE documentation and configuration guide published.',
    riverbendExample: 'Future state.',
    owner: 'Platform Engineering + FDE',
  },
  {
    stage: 'Customer Configuration',
    icon: 'settings_input_component',
    description: 'FDE configures the platform capability for a new or existing clinic using the published configuration schema.',
    riverbendExample: 'Future state - clinic configuration schema not yet defined.',
    owner: 'FDE',
  },
  {
    stage: 'Adoption Monitoring',
    icon: 'group_add',
    description: 'Track clinic adoption of the capability. Identify configuration gaps, FDE friction, and customer-reported issues.',
    riverbendExample: 'Future state.',
    owner: 'Platform Product + FDE',
  },
  {
    stage: 'Outcome Measurement',
    icon: 'insights',
    description: 'Measure capability performance against experiment thresholds. Compare results across clinic implementations.',
    riverbendExample: 'Six experiments proposed (EXP-01 through EXP-06). All proposed - none have started.',
    owner: 'Platform Product + FDE',
  },
  {
    stage: 'Iteration',
    icon: 'cached',
    description: 'Improve the capability based on real usage data. Feed learnings back into Pattern Review for the next clinic.',
    riverbendExample: 'Continuous - iteration log already in use during the Riverbend build.',
    owner: 'FDE + Platform Product',
  },
]

// ─── PLATFORM ROADMAP ────────────────────────────────────────────────────────

export interface RoadmapItem {
  id: string
  name: string
  icon: string
  description: string
  rationale: string
  businessValue: string
  status: 'Now' | 'Next' | 'Later'
  label: 'Proposed'
}

export const ROADMAP_INTRO = 'This proposed roadmap focuses on reducing the path from validated FDE workflow to shared platform capability. It begins with evidence capture and reusable standards, then introduces configurable components and exception handling, and only later adds cross-clinic analytics and portfolio signals.'

export const roadmapItems: RoadmapItem[] = [
  // NOW — Field-enabling standards and internal infrastructure
  {
    id: 'rm-n-01',
    name: 'Identity Verification Standard',
    icon: 'fingerprint',
    description: 'Define phone + date-of-birth as the standard identity gate pattern for Confido voice agents.',
    rationale: 'Used across all five Riverbend workflows. Consistent across confirmation, booking, rescheduling, cancellation, and escalation. Low exception risk.',
    businessValue: 'Reduces implementation variance and privacy risk across every customer deployment. A standard gate prevents data exposure bugs from being re-introduced with each new FDE.',
    status: 'Now',
    label: 'Proposed',
  },
  {
    id: 'rm-n-02',
    name: 'Appointment Retrieval Standard',
    icon: 'calendar_today',
    description: 'Standardize the appointment lookup then read-back pattern for both read-only and mutating operations.',
    rationale: 'Three separate Riverbend tool contracts share the same lookup-then-confirm shape. Standardizing reduces implementation variance across FDEs.',
    businessValue: 'Removes repeated design work for a pattern every scheduling workflow needs. FDEs start from a tested contract, not a blank file.',
    status: 'Now',
    label: 'Proposed',
  },
  {
    id: 'rm-n-03',
    name: 'Prompt / Tool / Knowledge-Base Design Standard',
    icon: 'menu_book',
    description: 'Document the three-layer architecture (LLM prompt / tool contracts / knowledge base) as the Confido FDE design standard.',
    rationale: 'Riverbend proved the pattern works. Without a standard, each FDE rebuilds it from scratch. Codifying it before the next clinic reduces ramp time.',
    businessValue: 'Reduces FDE ramp time and architectural drift. New implementations follow a tested structure rather than rediscovering it from scratch.',
    status: 'Now',
    label: 'Proposed',
  },
  {
    id: 'rm-n-04',
    name: 'Workflow Evidence Capture',
    icon: 'analytics',
    description: 'Make decision logs, source maps, and test call scripts required FDE artifacts for every new clinic implementation.',
    rationale: 'These artifacts were created during Riverbend and produced a reviewable evidence record. Without standardization, pattern review will be inconsistent.',
    businessValue: 'Shortens the time from customer validation to platform review by giving Product the structured evidence it needs to make a capability decision.',
    status: 'Now',
    label: 'Proposed',
  },
  {
    id: 'rm-n-05',
    name: 'Capability Registry',
    icon: 'inventory_2',
    description: 'A lightweight registry of capability candidates, their classification status, and the evidence required before productization.',
    rationale: 'Ten candidates were identified from one clinic. Without a registry, there is no shared view of what has been evaluated, deferred, or approved.',
    businessValue: 'Prevents repeated FDE work on the same patterns and creates a shared view of what has been evaluated, deferred, or approved across implementations.',
    status: 'Now',
    label: 'Proposed',
  },
  {
    id: 'rm-n-06',
    name: 'Regression Test Template',
    icon: 'rule',
    description: 'Reusable test scaffolding for validating a new clinic against shared capability contracts.',
    rationale: 'Riverbend has 38 unit tests covering the deterministic pipeline. Templates let the next FDE start from a baseline rather than zero.',
    businessValue: 'Reduces launch risk when adapting a validated workflow to a new clinic. New FDEs start with a verified baseline rather than building test coverage from zero.',
    status: 'Now',
    label: 'Proposed',
  },
  // NEXT — Convert validated patterns into configurable platform components
  {
    id: 'rm-nx-01',
    name: 'Scheduling Orchestration',
    icon: 'account_tree',
    description: 'Extract the deterministic validator pipeline as a configurable scheduling engine with per-clinic rule composition.',
    rationale: 'Core platform value. Requires a second clinic to validate which validators are universal and which are Riverbend-specific.',
    businessValue: 'The highest-reuse pattern from Riverbend — booking logic every scheduling clinic needs. Extracting it removes duplicated pipeline work from every future implementation.',
    status: 'Next',
    label: 'Proposed',
  },
  {
    id: 'rm-nx-02',
    name: 'Clinical Configuration',
    icon: 'settings_input_component',
    description: 'Define the minimum configuration surface for a new clinic: providers, hours, scheduling rules, location, and transfer destinations.',
    rationale: 'Without a defined configuration layer, FDEs hard-code clinic rules into the agent. Explicit configuration is the prerequisite for any platform capability to be reused across clinics.',
    businessValue: 'Makes it possible to add a new clinic without modifying shared platform logic. Defines which rules are configurable versus which require a code change.',
    status: 'Next',
    label: 'Proposed',
  },
  {
    id: 'rm-nx-03',
    name: 'Provider Continuity Configuration',
    icon: 'person_pin',
    description: 'Standard model for expressing provider continuity policies as clinic configuration, not code.',
    rationale: 'The own-provider follow-up rule at Riverbend is common in spirit but varies in implementation. Needs cross-clinic data to define the right configuration surface.',
    businessValue: 'Follow-up patients seeing their assigned provider is common across clinic types. A configurable model prevents this from being re-implemented as custom code for every new practice.',
    status: 'Next',
    label: 'Proposed',
  },
  {
    id: 'rm-nx-04',
    name: 'Routing and Escalation Configuration',
    icon: 'call_split',
    description: 'Standard configuration approach for transfer destinations, escalation triggers, and safety routing.',
    rationale: 'Transfer numbers and escalation conditions are clinic-specific. A configuration layer prevents hard-coded routing in each FDE implementation.',
    businessValue: 'Prevents stale or wrong transfer numbers from being embedded in agent prompts. Reduces the risk of a misconfigured escalation path reaching a patient.',
    status: 'Next',
    label: 'Proposed',
  },
  {
    id: 'rm-nx-05',
    name: 'Exception Registry',
    icon: 'priority_high',
    description: 'Standard approach for documenting and isolating customer-specific exceptions so they cannot propagate into shared platform logic.',
    rationale: 'The Crane/Mendez Thursday rule is the clearest example. Exceptions should be first-class documented artifacts, not buried in shared code.',
    businessValue: 'Undocumented exceptions accumulate into platform complexity. A registry makes exceptions visible and prevents them from being silently generalized into logic that breaks other clinics.',
    status: 'Next',
    label: 'Proposed',
  },
  {
    id: 'rm-nx-06',
    name: 'PRD Generation Support',
    icon: 'description',
    description: 'Templates and tooling to accelerate Platform PM authoring of PRDs for extracted capabilities.',
    rationale: 'PRD Creation is a required lifecycle stage with no standardized format. Supporting tooling reduces cycle time from Pattern Review to engineering handoff.',
    businessValue: 'Platform PM authoring is a bottleneck in the capability lifecycle. Reducing the time from Pattern Review to engineering handoff speeds up how quickly validated workflows become platform capabilities.',
    status: 'Next',
    label: 'Proposed',
  },
  {
    id: 'rm-nx-07',
    name: 'Platform Review Workflow',
    icon: 'rate_review',
    description: 'A structured process for FDE evidence to move from submission through Platform Product review to a capability decision.',
    rationale: 'The current review process is informal. Without a defined workflow, review is ad hoc and decisions are not traceable.',
    businessValue: 'Without a defined review process, FDE evidence sits without a decision. A structured workflow creates accountability and a traceable path from field observation to platform commitment.',
    status: 'Next',
    label: 'Proposed',
  },
  // LATER — Improve cross-customer learning and platform scale
  {
    id: 'rm-l-01',
    name: 'Cross-Customer Pattern Detection',
    icon: 'schema',
    description: 'Tooling to identify which workflow rules repeat across multiple customer implementations.',
    rationale: 'Not meaningful with one customer. Requires evidence from three or more implementations to produce a signal worth acting on.',
    businessValue: 'Once multiple customers are implemented, shared patterns become visible. Tooling to surface them reduces the review burden and accelerates the path from field evidence to platform capability.',
    status: 'Later',
    label: 'Proposed',
  },
  {
    id: 'rm-l-02',
    name: 'Workflow Analytics',
    icon: 'bar_chart',
    description: 'Dashboard tracking experiment outcomes, capability adoption, and FDE implementation velocity across customers.',
    rationale: 'Requires live call volume and at least two customer implementations. All six Riverbend experiments are currently proposed, not running.',
    businessValue: 'Experiment outcomes and capability adoption data give Product the signal needed to prioritize the platform roadmap. Not meaningful before live call volume exists at multiple customers.',
    status: 'Later',
    label: 'Proposed',
  },
  {
    id: 'rm-l-03',
    name: 'Experiment Framework',
    icon: 'science',
    description: 'Tooling for Platform PMs and FDEs to define, track, and evaluate structured experiments against live call volume.',
    rationale: 'Six experiments are proposed for Riverbend but have no tooling to run them. The framework is only valuable after live call volume exists.',
    businessValue: 'Platform decisions without measurement are guesses. A framework for structured experiments turns capability evaluations into evidence-backed decisions.',
    status: 'Later',
    label: 'Proposed',
  },
  {
    id: 'rm-l-04',
    name: 'Platform Adoption Monitoring',
    icon: 'monitor_heart',
    description: 'Monitoring of capability performance after platform release — call success rates, FDE configuration time, and incident tracking.',
    rationale: 'Requires at least one platform capability in production. No capabilities have been released yet.',
    businessValue: 'After a capability ships, Adoption Monitoring answers whether customers are using it and whether it is performing as designed — closing the loop from build to customer outcome.',
    status: 'Later',
    label: 'Proposed',
  },
  {
    id: 'rm-l-05',
    name: 'Product Prioritization Signals',
    icon: 'leaderboard',
    description: 'Structured inputs for prioritizing platform capabilities against each other based on FDE demand, exception frequency, and strategic fit.',
    rationale: 'Only meaningful once multiple capabilities are under evaluation. Premature with a single customer data point.',
    businessValue: 'As the capability portfolio grows, Product needs structured inputs to sequence work against customer demand and strategic fit rather than intuition.',
    status: 'Later',
    label: 'Proposed',
  },
  {
    id: 'rm-l-06',
    name: 'Business-Impact and Market-Opportunity Inputs',
    icon: 'trending_up',
    description: 'Market sizing, TAM analysis, and ROI modeling to support capability investment decisions.',
    rationale: 'Valuable after capabilities are approved for productization and cross-customer evidence exists. Premature at the FDE-to-platform evaluation stage.',
    businessValue: 'Supports investment decisions once capabilities have cross-customer evidence and are approved for productization. Not applicable before that threshold.',
    status: 'Later',
    label: 'Proposed',
  },
]
