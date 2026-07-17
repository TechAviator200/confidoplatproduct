import { useState, useRef, useEffect } from 'react'
import { capabilities, type Capability } from '../data/mockData'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

const CATEGORY_OPTIONS = [
  'Identity and access',
  'Scheduling',
  'Knowledge retrieval',
  'Policy enforcement',
  'Provider routing',
  'Escalation',
  'Workflow operations',
  'Evidence and evaluation',
]

const REUSE_OPTIONS = ['High', 'Medium', 'Low', 'Requires validation']

const RECOMMENDATION_OPTIONS = [
  'Needs more evidence',
  'Platform candidate',
  'Clinic configuration',
  'Explicit exception',
  'Keep FDE-owned',
]

const REUSE_PILL: Record<string, string> = {
  'High':                 'bg-primary-container text-on-primary-container',
  'Medium':               'bg-secondary-container text-on-secondary-container',
  'Low':                  'bg-surface-container text-on-surface-variant',
  'Requires validation':  'bg-surface-container text-on-surface-variant border border-outline-variant',
}

const REC_PILL: Record<string, string> = {
  'Needs more evidence':  'bg-surface-container text-on-surface-variant border border-outline-variant',
  'Platform candidate':   'bg-primary text-on-primary',
  'Clinic configuration': 'bg-secondary-container text-on-secondary-container',
  'Explicit exception':   'bg-error-container text-on-error-container',
  'Keep FDE-owned':       'bg-surface-container-high text-on-surface-variant',
}

function DropdownPill({
  value,
  options,
  colorMap,
  defaultClass,
  onChange,
}: {
  value: string
  options: string[]
  colorMap?: Record<string, string>
  defaultClass?: string
  onChange: (v: string) => void
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

  const cls = (colorMap?.[value]) ?? (defaultClass ?? 'bg-surface-container text-on-surface-variant')

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity whitespace-nowrap flex items-center gap-0.5 ${cls}`}
      >
        {value || 'Unset'}
        <Icon name="arrow_drop_down" className="text-[14px] -mr-0.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl border border-outline-variant shadow-xl z-30 py-1 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              onClick={e => { e.stopPropagation(); onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-body-sm hover:bg-surface-container-low transition-colors flex items-center gap-2 ${
                opt === value ? 'font-semibold text-primary' : 'text-on-surface'
              }`}
            >
              {opt === value && <Icon name="check" className="text-[14px] text-primary flex-shrink-0" />}
              {opt !== value && <span className="w-[14px] flex-shrink-0" />}
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type CapState = {
  category: string
  reuse: string
  recommendation: string
  clinicNote: string
}

function AddCapabilityModal({
  onSave,
  onCancel,
}: {
  onSave: (cap: Capability & { recommendation: string; clinicNote: string }) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    category: CATEGORY_OPTIONS[0],
    reuse: REUSE_OPTIONS[0],
    recommendation: RECOMMENDATION_OPTIONS[0],
    riverbendEvidence: '',
    validationRequired: '',
    clinicNote: '',
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const valid = form.name.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl border border-outline-variant shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-headline-md font-semibold text-on-surface">Add capability</h2>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center">
            <Icon name="close" className="text-on-surface-variant" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Name *</label>
            <input type="text" value={form.name} onChange={set('name')}
              placeholder="Capability name"
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Category', key: 'category', options: CATEGORY_OPTIONS },
              { label: 'Reuse potential', key: 'reuse', options: REUSE_OPTIONS },
              { label: 'Recommendation', key: 'recommendation', options: RECOMMENDATION_OPTIONS },
            ].map(({ label, key, options }) => (
              <div key={key}>
                <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">{label}</label>
                <select value={(form as Record<string, string>)[key]} onChange={set(key)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors">
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Evidence from Riverbend</label>
            <textarea rows={2} value={form.riverbendEvidence} onChange={set('riverbendEvidence')}
              placeholder="What did we observe at Riverbend?"
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">What we need to validate</label>
            <textarea rows={2} value={form.validationRequired} onChange={set('validationRequired')}
              placeholder="What evidence is required before this becomes a platform capability?"
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Clinic notes</label>
            <textarea rows={2} value={form.clinicNote} onChange={set('clinicNote')}
              placeholder="How does this vary by clinic?"
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white px-6 pb-5 pt-2 border-t border-outline-variant flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-outline-variant text-body-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button onClick={() => valid && onSave({
            id: 'cap-' + Date.now(),
            name: form.name,
            category: form.category,
            reusePotential: form.reuse as 'High' | 'Medium' | 'Low',
            riverbendEvidence: form.riverbendEvidence,
            riverbendFile: '',
            configNeeds: '',
            exceptionRisk: 'Low',
            readiness: 'Not yet evaluated',
            validationRequired: form.validationRequired,
            recommendation: form.recommendation,
            clinicNote: form.clinicNote,
          })}
            disabled={!valid}
            className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
            Add capability
          </button>
        </div>
      </div>
    </div>
  )
}

function CapabilityRow({
  cap,
  state,
  onState,
  expanded,
  onToggle,
}: {
  cap: Capability
  state: CapState
  onState: (update: Partial<CapState>) => void
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className="border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Icon name={expanded ? 'expand_less' : 'expand_more'} className="text-on-surface-variant text-[16px]" />
            <span className="font-medium text-on-surface text-body-sm">{cap.name}</span>
          </div>
        </td>
        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
          <DropdownPill
            value={state.category}
            options={CATEGORY_OPTIONS}
            onChange={v => onState({ category: v })}
          />
        </td>
        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
          <DropdownPill
            value={state.reuse}
            options={REUSE_OPTIONS}
            colorMap={REUSE_PILL}
            onChange={v => onState({ reuse: v })}
          />
        </td>
        <td className="py-3 px-4 hidden md:table-cell" onClick={e => e.stopPropagation()}>
          <DropdownPill
            value={state.recommendation}
            options={RECOMMENDATION_OPTIONS}
            colorMap={REC_PILL}
            onChange={v => onState({ recommendation: v })}
          />
        </td>
      </tr>
      {expanded && (
        <tr className="bg-surface-container-low border-b border-outline-variant">
          <td colSpan={4} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-sm mb-4">
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Evidence from Riverbend</p>
                <p className="text-on-surface">{cap.riverbendEvidence || 'Not yet documented.'}</p>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">What we need to validate</p>
                <p className="text-on-surface italic">{cap.validationRequired || 'Not yet defined.'}</p>
              </div>
            </div>
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Clinic notes</p>
              <textarea
                value={state.clinicNote}
                onChange={e => { e.stopPropagation(); onState({ clinicNote: e.target.value }) }}
                onClick={e => e.stopPropagation()}
                placeholder="How does this vary by clinic? Add open questions or evaluation context..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Capabilities() {
  const [capList, setCapList] = useState<(Capability & { recommendation?: string; clinicNote?: string })[]>(capabilities)
  const [states, setStates] = useState<Record<string, CapState>>(() =>
    Object.fromEntries(capabilities.map(c => [c.id, {
      category: c.category,
      reuse: c.reusePotential,
      recommendation: 'Needs more evidence',
      clinicNote: '',
    }]))
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  function updateState(id: string, update: Partial<CapState>) {
    setStates(s => ({ ...s, [id]: { ...s[id], ...update } }))
  }

  function addCapability(cap: Capability & { recommendation: string; clinicNote: string }) {
    setCapList(list => [...list, cap])
    setStates(s => ({ ...s, [cap.id]: {
      category: cap.category,
      reuse: cap.reusePotential,
      recommendation: cap.recommendation,
      clinicNote: cap.clinicNote,
    }}))
    setShowAdd(false)
  }

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Capability Evaluation</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            {capList.length} candidates identified from Riverbend - each requires cross-clinic validation before a platform decision.
            Click any pill to change its value. Expand a row to add clinic notes.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Icon name="add" className="text-[16px]" />
          Add capability
        </button>
      </div>

      <div className="bg-secondary-container/30 rounded-xl border border-outline-variant px-4 py-3">
        <p className="text-body-sm text-on-surface">
          These are candidates identified from the Riverbend implementation, not claims about Confido's current platform inventory.
          No capability has been approved for productization yet.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="text-left px-4 py-3 text-label-md text-on-surface-variant uppercase tracking-wider font-medium">Capability</th>
                <th className="text-left px-4 py-3 text-label-md text-on-surface-variant uppercase tracking-wider font-medium">Category</th>
                <th className="text-left px-4 py-3 text-label-md text-on-surface-variant uppercase tracking-wider font-medium">Reuse Potential</th>
                <th className="text-left px-4 py-3 text-label-md text-on-surface-variant uppercase tracking-wider font-medium hidden md:table-cell">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {capList.map(cap => (
                <CapabilityRow
                  key={cap.id}
                  cap={cap}
                  state={states[cap.id] ?? { category: cap.category, reuse: cap.reusePotential, recommendation: 'Needs more evidence', clinicNote: '' }}
                  onState={update => updateState(cap.id, update)}
                  expanded={expandedId === cap.id}
                  onToggle={() => setExpandedId(expandedId === cap.id ? null : cap.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-body-sm text-on-surface-variant">
        Expand any row to view Riverbend evidence, validation requirements, and add clinic-specific notes.
      </p>

      {showAdd && (
        <AddCapabilityModal onSave={addCapability} onCancel={() => setShowAdd(false)} />
      )}
    </div>
  )
}
