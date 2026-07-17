import { useState, useRef, useEffect } from 'react'
import { workflows, capabilities, type WorkflowDecomposition, type PrimitiveType } from '../data/mockData'
import EditableNote from '../components/EditableNote'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

const CLASSIFICATION_OPTIONS = [
  'Reusable capability',
  'Clinical configuration',
  'Customer-specific exception',
  'Requires validation',
] as const

type Classification = typeof CLASSIFICATION_OPTIONS[number]

const CLASSIFICATION_PILL: Record<Classification, string> = {
  'Reusable capability':          'bg-primary-container text-on-primary-container',
  'Clinical configuration':       'bg-secondary-container text-on-secondary-container',
  'Customer-specific exception':  'bg-error-container text-on-error-container',
  'Requires validation':          'bg-surface-container text-on-surface-variant border border-outline-variant',
}

function toClassification(type: PrimitiveType): Classification {
  if (type === 'Reusable Capability') return 'Reusable capability'
  if (type === 'Clinic Config')       return 'Clinical configuration'
  return 'Customer-specific exception'
}

function ClassificationDropdown({
  value,
  onChange,
}: {
  value: Classification
  onChange: (v: Classification) => void
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
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity flex items-center gap-0.5 whitespace-nowrap ${CLASSIFICATION_PILL[value]}`}
      >
        {value}
        <Icon name="arrow_drop_down" className="text-[13px] -mr-0.5" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-xl border border-outline-variant shadow-xl z-30 py-1 overflow-hidden">
          {CLASSIFICATION_OPTIONS.map(opt => (
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

const BOOKING_WORKFLOW = workflows.find(w => w.id === 'booking')!
const ALL_CAPABILITY_NAMES = capabilities.map(c => c.name)

export default function WorkflowDetail() {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowDecomposition>(BOOKING_WORKFLOW)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const setNote = (k: string, v: string) => setNotes(n => ({ ...n, [k]: v }))

  // Per-workflow per-step classification overrides
  const [classifs, setClassifs] = useState<Record<string, Record<number, Classification>>>({})
  // Per-workflow added candidate pills
  const [added, setAdded] = useState<Record<string, string[]>>({})
  const [selected, setSelected] = useState<Record<string, Set<string>>>({})
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const wfId = activeWorkflow.id

  function getClassif(idx: number): Classification {
    return classifs[wfId]?.[idx] ?? toClassification(activeWorkflow.primitives[idx].type)
  }

  function setClassif(idx: number, val: Classification) {
    setClassifs(c => ({
      ...c,
      [wfId]: { ...(c[wfId] ?? {}), [idx]: val },
    }))
  }

  function toggleSelected(step: string) {
    setSelected(s => {
      const wfSet = new Set(s[wfId] ?? [])
      if (wfSet.has(step)) wfSet.delete(step); else wfSet.add(step)
      return { ...s, [wfId]: wfSet }
    })
  }

  function addCandidate(step: string) {
    setAdded(a => ({ ...a, [wfId]: [...(a[wfId] ?? []), step] }))
    setSelected(s => {
      const wfSet = new Set(s[wfId] ?? [])
      wfSet.add(step)
      return { ...s, [wfId]: wfSet }
    })
    setDropOpen(false)
  }

  const currentSelected = selected[wfId] ?? new Set<string>()
  const currentAdded = added[wfId] ?? []

  const reusableSteps = activeWorkflow.primitives
    .filter((_p, i) => getClassif(i) === 'Reusable capability')
    .map(p => p.step)

  const allPills = [
    ...reusableSteps,
    ...currentAdded.filter(s => !reusableSteps.includes(s)),
  ]

  const dropOptions = ALL_CAPABILITY_NAMES.filter(
    s => !allPills.some(p => p.toLowerCase().includes(s.split(' ')[0].toLowerCase()))
  )

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-on-surface">Workflow Detail</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Riverbend Gastroenterology - classify each workflow step to identify platform candidates
        </p>
      </div>

      {/* Workflow selector */}
      <div className="flex flex-wrap gap-2">
        {workflows.map(wf => (
          <button
            key={wf.id}
            onClick={() => { setActiveWorkflow(wf); setDropOpen(false) }}
            className={`px-3 py-1.5 rounded-full text-body-sm font-medium transition-colors ${
              activeWorkflow.id === wf.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {wf.name}
          </button>
        ))}
      </div>

      {/* Step-by-step breakdown with classification */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="text-headline-md font-semibold text-on-surface">{activeWorkflow.name}</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-secondary-container text-on-secondary-container flex-shrink-0">
            Implemented
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Click any classification pill to reclassify a step. Changes are local to this session.
        </p>

        <div className="space-y-1">
          {activeWorkflow.primitives.map((p, i) => {
            const classif = getClassif(i)
            return (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-outline-variant last:border-0 text-body-sm">
                <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <span className="font-medium text-on-surface">{p.step}</span>
                  {p.note && (
                    <p className="text-on-surface-variant mt-0.5 text-[12px]">{p.note}</p>
                  )}
                </div>
                <ClassificationDropdown
                  value={classif}
                  onChange={val => setClassif(i, val)}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-4">
          <EditableNote value={notes[wfId] ?? ''} onChange={v => setNote(wfId, v)} />
        </div>
      </div>

      {/* Platform candidates panel */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
        <h2 className="text-body-lg font-semibold text-on-surface mb-1">
          Platform candidates in this workflow
        </h2>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Steps classified as "Reusable capability" appear below as pills. Blue = selected for evaluation.
          Use "+ Evaluate another" to add additional candidates.
        </p>

        {allPills.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant italic">
            No steps are currently classified as "Reusable capability" for this workflow. Reclassify a step above to add it here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            {allPills.map(step => {
              const isSelected = currentSelected.has(step)
              const cap = capabilities.find(c =>
                c.name.toLowerCase().includes(step.split(' ')[0].toLowerCase())
              )
              return (
                <button
                  key={step}
                  onClick={() => toggleSelected(step)}
                  className={`px-3 py-1.5 rounded-full text-body-sm font-medium flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <Icon name="inventory_2" className="text-[13px]" />
                  {step}
                  {cap && <span className="text-[10px] opacity-60 ml-0.5">{cap.id}</span>}
                </button>
              )
            })}

            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(o => !o)}
                className="px-3 py-1.5 rounded-full text-body-sm font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-1"
              >
                <Icon name="add" className="text-[14px]" />
                Evaluate another
              </button>
              {dropOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl border border-outline-variant shadow-xl z-20 py-1 overflow-hidden max-h-56 overflow-y-auto">
                  {dropOptions.length > 0
                    ? dropOptions.map(opt => (
                      <button
                        key={opt}
                        onClick={() => addCandidate(opt)}
                        className="w-full text-left px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        {opt}
                      </button>
                    ))
                    : <p className="px-4 py-3 text-body-sm text-on-surface-variant">All candidates already listed.</p>
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {currentSelected.size > 0 && (
          <p className="mt-3 text-body-sm text-primary font-medium">
            {currentSelected.size} candidate{currentSelected.size !== 1 ? 's' : ''} selected for platform evaluation
          </p>
        )}
      </div>
    </div>
  )
}
