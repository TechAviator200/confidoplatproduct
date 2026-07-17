import { useState, useRef, useEffect } from 'react'
import { workflows, capabilities } from '../data/mockData'
import EditableNote from '../components/EditableNote'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkflowSubclass =
  | 'Appointment Booking'
  | 'Appointment Confirmation'
  | 'Appointment Rescheduling'
  | 'Appointment Cancellation'
  | 'Patient Verification'
  | 'Knowledge and FAQs'
  | 'Transfer and Escalation'
  | 'Policy Enforcement'
  | 'Provider Routing'
  | 'Workflow Operations'

const WORKFLOW_SUBCLASSES: WorkflowSubclass[] = [
  'Appointment Booking',
  'Appointment Confirmation',
  'Appointment Rescheduling',
  'Appointment Cancellation',
  'Patient Verification',
  'Knowledge and FAQs',
  'Transfer and Escalation',
  'Policy Enforcement',
  'Provider Routing',
  'Workflow Operations',
]

type InsightRow = {
  id: string
  name: string
  subclass: WorkflowSubclass
  advanced: boolean
}

// ── Derive patterns from workflow primitives ──────────────────────────────────

type PatternEntry = {
  step: string
  appearsIn: string[]
  note?: string
}

function derivePatterns() {
  const reusable  = new Map<string, PatternEntry>()
  const config    = new Map<string, PatternEntry>()
  const exception = new Map<string, PatternEntry>()

  for (const wf of workflows) {
    for (const p of wf.primitives) {
      const map = p.type === 'Reusable Capability' ? reusable
                : p.type === 'Clinic Config'        ? config
                :                                     exception
      const existing = map.get(p.step)
      if (existing) {
        existing.appearsIn.push(wf.name)
      } else {
        map.set(p.step, { step: p.step, appearsIn: [wf.name], note: p.note })
      }
    }
  }
  return {
    reusable:   Array.from(reusable.values()),
    config:     Array.from(config.values()),
    exceptions: Array.from(exception.values()),
  }
}

const { reusable, config, exceptions } = derivePatterns()
const ALL_CAPABILITY_NAMES = capabilities.map(c => c.name)

function mapToSubclass(wfName: string): WorkflowSubclass {
  const n = wfName.toLowerCase()
  if (n.includes('booking'))       return 'Appointment Booking'
  if (n.includes('confirmation'))  return 'Appointment Confirmation'
  if (n.includes('reschedul'))     return 'Appointment Rescheduling'
  if (n.includes('cancell'))       return 'Appointment Cancellation'
  if (n.includes('escalation') || n.includes('transfer')) return 'Transfer and Escalation'
  return 'Workflow Operations'
}

let _rowId = 0
function makeRowId() { return `row-${++_rowId}` }

function toRows(items: PatternEntry[]): InsightRow[] {
  return items.map(p => ({
    id: makeRowId(),
    name: p.step,
    subclass: mapToSubclass(p.appearsIn[0] ?? ''),
    advanced: false,
  }))
}

// ── SubclassDropdown ──────────────────────────────────────────────────────────

function SubclassDropdown({
  value,
  onChange,
}: {
  value: WorkflowSubclass
  onChange: (v: WorkflowSubclass) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-0.5 whitespace-nowrap"
      >
        {value}
        <Icon name="arrow_drop_down" className="text-[13px] -mr-0.5" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl border border-outline-variant shadow-xl z-30 py-1 overflow-hidden max-h-64 overflow-y-auto">
          {WORKFLOW_SUBCLASSES.map(opt => (
            <button
              key={opt}
              onClick={e => { e.stopPropagation(); onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-body-sm hover:bg-surface-container-low transition-colors flex items-center gap-2 ${
                opt === value ? 'font-semibold text-primary' : 'text-on-surface'
              }`}
            >
              {opt === value
                ? <Icon name="check" className="text-[14px] text-primary flex-shrink-0" />
                : <span className="w-[14px] flex-shrink-0" />}
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── AddRowForm ────────────────────────────────────────────────────────────────

function AddRowForm({
  predefinedOptions,
  onAdd,
  onCancel,
}: {
  predefinedOptions: string[]
  onAdd: (name: string, subclass: WorkflowSubclass) => void
  onCancel: () => void
}) {
  const [name, setName]             = useState('')
  const [subclass, setSubclass]     = useState<WorkflowSubclass | ''>('')
  const [showSuggest, setShowSuggest] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = predefinedOptions.filter(
    o => name.trim() === '' || o.toLowerCase().includes(name.toLowerCase())
  )
  const canAdd = name.trim().length > 0 && subclass !== ''

  return (
    <div className="mt-3 mb-2 border border-outline-variant rounded-xl bg-surface-container-low p-4 space-y-3">
      {/* Item name */}
      <div>
        <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
          Item
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setShowSuggest(true) }}
            onFocus={() => setShowSuggest(true)}
            placeholder="Select from list or enter custom..."
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
          />
          {showSuggest && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant shadow-xl z-40 max-h-40 overflow-y-auto">
              {filtered.map(opt => (
                <button
                  key={opt}
                  onMouseDown={e => { e.preventDefault(); setName(opt); setShowSuggest(false) }}
                  className="w-full text-left px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subclass */}
      <div>
        <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
          Workflow subclass <span className="text-error">*</span>
        </label>
        <select
          value={subclass}
          onChange={e => setSubclass(e.target.value as WorkflowSubclass)}
          className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">Select subclass...</option>
          {WORKFLOW_SUBCLASSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg border border-outline-variant text-body-sm text-on-surface hover:bg-surface-container transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => canAdd && onAdd(name.trim(), subclass as WorkflowSubclass)}
          disabled={!canAdd}
          className="flex-1 py-1.5 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  )
}

// ── RowSection ────────────────────────────────────────────────────────────────

function RowSection({
  title,
  icon,
  insight,
  initialRows,
  noteKey,
  notes,
  onNote,
  predefinedOptions,
  showAdvance,
  noteColor,
}: {
  title: string
  icon: string
  insight: string
  initialRows: InsightRow[]
  noteKey: string
  notes: Record<string, string>
  onNote: (k: string, v: string) => void
  predefinedOptions: string[]
  /** When true, rows show an advance-to-evaluation toggle (used for exceptions). */
  showAdvance?: boolean
  noteColor?: string
}) {
  const [rows, setRows]     = useState<InsightRow[]>(initialRows)
  const [showAdd, setShowAdd] = useState(false)

  function updateSubclass(id: string, sub: WorkflowSubclass) {
    setRows(rs => rs.map(r => r.id === id ? { ...r, subclass: sub } : r))
  }
  function toggleAdvanced(id: string) {
    setRows(rs => rs.map(r => r.id === id ? { ...r, advanced: !r.advanced } : r))
  }
  function removeRow(id: string) {
    setRows(rs => rs.filter(r => r.id !== id))
  }
  function addRow(name: string, subclass: WorkflowSubclass) {
    setRows(rs => [...rs, { id: makeRowId(), name, subclass, advanced: false }])
    setShowAdd(false)
  }

  const addOptions = predefinedOptions.filter(o => !rows.some(r => r.name === o))
  const advancedCount = rows.filter(r => r.advanced).length
  const noteClass = noteColor ?? 'text-on-surface-variant'

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-2 mb-1">
          <Icon name={icon} className="text-on-surface-variant text-[18px]" />
          <h2 className="text-body-lg font-semibold text-on-surface">{title}</h2>
          <span className="ml-1 text-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
            {rows.length}
          </span>
        </div>
        <p className={`text-body-sm ${noteClass}`}>{insight}</p>
      </div>

      {/* Rows */}
      <div className="px-5 py-2">
        {rows.length === 0 && !showAdd && (
          <p className="py-3 text-body-sm text-on-surface-variant italic">
            No items. Use "Add item" below to add one.
          </p>
        )}

        {rows.map(row => (
          <div
            key={row.id}
            className={`flex items-center gap-3 py-2.5 border-b border-outline-variant last:border-0 ${
              showAdvance && row.advanced ? 'bg-primary-container/5 -mx-5 px-5' : ''
            }`}
          >
            {/* Name + advanced label */}
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-on-surface truncate">{row.name}</p>
              {showAdvance && row.advanced && (
                <p className="text-[11px] text-primary mt-0.5 font-medium">
                  Selected for platform evaluation — requires cross-clinic validation
                </p>
              )}
            </div>

            {/* Subclass chip */}
            <SubclassDropdown value={row.subclass} onChange={v => updateSubclass(row.id, v)} />

            {/* Advance toggle (exceptions only) */}
            {showAdvance && (
              <button
                onClick={() => toggleAdvanced(row.id)}
                title={row.advanced ? 'Remove from evaluation' : 'Select for platform evaluation'}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                  row.advanced
                    ? 'text-primary'
                    : 'text-on-surface-variant opacity-40 hover:opacity-70'
                }`}
              >
                <Icon
                  name={row.advanced ? 'check_circle' : 'radio_button_unchecked'}
                  className="text-[17px]"
                />
              </button>
            )}

            {/* Remove */}
            <button
              onClick={() => removeRow(row.id)}
              title="Remove"
              className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant opacity-40 hover:opacity-80 hover:text-error transition-all flex-shrink-0"
            >
              <Icon name="close" className="text-[15px]" />
            </button>
          </div>
        ))}

        {/* Add control */}
        {showAdd ? (
          <AddRowForm
            predefinedOptions={addOptions}
            onAdd={addRow}
            onCancel={() => setShowAdd(false)}
          />
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="mt-2 mb-1 flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon name="add" className="text-[16px]" />
            Add item
          </button>
        )}
      </div>

      {/* Advance summary (exceptions only) */}
      {showAdvance && advancedCount > 0 && (
        <div className="px-5 pb-3 pt-1">
          <p className="text-body-sm text-primary font-medium">
            {advancedCount} item{advancedCount !== 1 ? 's' : ''} selected for platform evaluation
          </p>
        </div>
      )}

      <div className="px-5 pb-3">
        <EditableNote value={notes[noteKey] ?? ''} onChange={v => onNote(noteKey, v)} />
      </div>
    </div>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function Insights() {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const setNote = (k: string, v: string) => setNotes(n => ({ ...n, [k]: v }))

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-on-surface">Workflow Insights</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          What we learned from building five workflows for Riverbend Gastroenterology
        </p>
      </div>

      <p className="text-body-md text-on-surface leading-relaxed">
        Building the Riverbend implementation revealed three distinct categories of logic.
        Only the first category — <strong>recurring patterns</strong> — is a candidate for platform extraction.
        Each row shows the item name, its workflow subclass, and a remove action.
        Click the subclass to reclassify. Use "Add item" to add from the capability list or enter a custom entry.
      </p>

      <RowSection
        title="Reusable capability candidates"
        icon="repeat"
        insight={`${reusable.length} steps appeared across multiple workflows and were built once then reused. Each still requires cross-clinic validation before a platform decision.`}
        initialRows={toRows(reusable)}
        noteKey="reusable"
        notes={notes}
        onNote={setNote}
        predefinedOptions={ALL_CAPABILITY_NAMES}
      />

      <RowSection
        title="Clinical configuration"
        icon="tune"
        insight={`${config.length} rules are real and important, but vary by clinic. The right platform answer is configurable per-clinic parameters, not shared logic.`}
        initialRows={toRows(config)}
        noteKey="config"
        notes={notes}
        onNote={setNote}
        predefinedOptions={ALL_CAPABILITY_NAMES}
      />

      <RowSection
        title="Customer-specific exceptions"
        icon="warning"
        insight={`${exceptions.length} rules are Riverbend-specific with no obvious parallel elsewhere. Generalizing them would create platform complexity without platform value.`}
        initialRows={toRows(exceptions)}
        noteKey="exceptions"
        notes={notes}
        onNote={setNote}
        predefinedOptions={ALL_CAPABILITY_NAMES}
        showAdvance
        noteColor="text-on-surface-variant"
      />

      {/* Validation still required */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="pending" className="text-on-surface-variant text-[18px]" />
            <h2 className="text-body-lg font-semibold text-on-surface">Validation still required</h2>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Use this section to track capability candidates where the classification is unclear — add them here to flag for cross-clinic review.
          </p>
        </div>
        <ValidationSection
          noteKey="validation"
          notes={notes}
          onNote={setNote}
          allCapabilities={ALL_CAPABILITY_NAMES}
        />
      </div>

      {/* Platform signal */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
        <h2 className="text-body-lg font-semibold text-on-surface mb-3">Platform signal</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-headline-md font-bold text-primary">{reusable.length}</p>
            <p className="text-body-sm text-on-surface-variant mt-1">Candidate patterns from Riverbend</p>
          </div>
          <div>
            <p className="text-headline-md font-bold text-secondary">{config.length}</p>
            <p className="text-body-sm text-on-surface-variant mt-1">Clinical configuration items</p>
          </div>
          <div>
            <p className="text-headline-md font-bold text-on-surface-variant">{exceptions.length}</p>
            <p className="text-body-sm text-on-surface-variant mt-1">Customer-specific exceptions to isolate</p>
          </div>
        </div>
        <p className="text-body-sm text-on-surface-variant mt-4 italic">
          All figures from one clinic. No pattern has been validated across multiple implementations.
        </p>
        <EditableNote value={notes['signal'] ?? ''} onChange={v => setNote('signal', v)} />
      </div>
    </div>
  )
}

// ── ValidationSection (unchanged) ────────────────────────────────────────────

function ValidationSection({
  noteKey,
  notes,
  onNote,
  allCapabilities,
}: {
  noteKey: string
  notes: Record<string, string>
  onNote: (k: string, v: string) => void
  allCapabilities: string[]
}) {
  const [items, setItems]   = useState<string[]>([])
  const [dropOpen, setDropOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const dropOptions = allCapabilities.filter(c => !items.includes(c))

  return (
    <>
      <div className="px-5 py-4">
        {items.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant italic">
            No items yet. Use the "+" below to add capability candidates that need further review.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {items.map(item => (
              <div key={item} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-body-sm">
                {item}
                <button onClick={() => setItems(i => i.filter(x => x !== item))} className="hover:text-on-surface transition-colors">
                  <Icon name="close" className="text-[12px]" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative inline-block" ref={ref}>
          <button
            onClick={() => setDropOpen(o => !o)}
            className="px-3 py-1 rounded-full text-body-sm font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-1 mt-2"
          >
            <Icon name="add" className="text-[14px]" />
            Add for review
          </button>
          {dropOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl border border-outline-variant shadow-xl z-20 py-1 overflow-hidden max-h-48 overflow-y-auto">
              {dropOptions.length > 0
                ? dropOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setItems(i => [...i, opt]); setDropOpen(false) }}
                    className="w-full text-left px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    {opt}
                  </button>
                ))
                : <p className="px-4 py-3 text-body-sm text-on-surface-variant">All capabilities already added.</p>
              }
            </div>
          )}
        </div>
      </div>
      <div className="px-5 pb-3">
        <EditableNote value={notes[noteKey] ?? ''} onChange={v => onNote(noteKey, v)} />
      </div>
    </>
  )
}
