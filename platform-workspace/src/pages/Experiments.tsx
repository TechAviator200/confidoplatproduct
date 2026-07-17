import { useState } from 'react'
import { experiments, workflows, type Experiment } from '../data/mockData'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

function makeId() {
  return 'EXP-' + String(Math.floor(Math.random() * 9000) + 1000)
}

const WORKFLOW_OPTIONS = ['All workflows', ...workflows.map(w => w.name)]

type ExperimentFormData = {
  id: string
  name: string
  targetWorkflow: string
  hypothesis: string
  metric: string
  proposedThreshold: string
  validationScope: string
  decisionRule: string
  notes: string
}

function blankForm(): ExperimentFormData {
  return {
    id: makeId(),
    name: '',
    targetWorkflow: WORKFLOW_OPTIONS[0],
    hypothesis: '',
    metric: '',
    proposedThreshold: '',
    validationScope: '',
    decisionRule: '',
    notes: '',
  }
}

function ExperimentModal({
  initial,
  onSave,
  onCancel,
  isNew,
}: {
  initial: ExperimentFormData
  onSave: (data: ExperimentFormData) => void
  onCancel: () => void
  isNew: boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof ExperimentFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const valid = form.name.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl border border-outline-variant shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-headline-md font-semibold text-on-surface">
            {isNew ? 'New experiment' : 'Edit experiment'}
          </h2>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center">
            <Icon name="close" className="text-on-surface-variant" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Experiment name *</label>
              <input type="text" value={form.name} onChange={set('name')}
                placeholder="e.g. Identity Verification Completion Rate"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Workflow</label>
              <select value={form.targetWorkflow} onChange={set('targetWorkflow')}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors">
                {WORKFLOW_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Metric</label>
              <input type="text" value={form.metric} onChange={set('metric')}
                placeholder="e.g. Verification completion rate"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Hypothesis</label>
            <textarea rows={2} value={form.hypothesis} onChange={set('hypothesis')}
              placeholder="What do we expect to observe, and why?"
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Success threshold</label>
              <input type="text" value={form.proposedThreshold} onChange={set('proposedThreshold')}
                placeholder="e.g. >90% completion"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Validation scope</label>
              <input type="text" value={form.validationScope} onChange={set('validationScope')}
                placeholder="e.g. Riverbend - first 50 live calls"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">What we'll do with the result</label>
            <textarea rows={2} value={form.decisionRule} onChange={set('decisionRule')}
              placeholder="If threshold met, promote. If not, investigate..."
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={set('notes')}
              placeholder="Additional context, dependencies, or open questions..."
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 pb-5 pt-2 border-t border-outline-variant flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-outline-variant text-body-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button onClick={() => valid && onSave(form)} disabled={!valid}
            className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
            {isNew ? 'Add experiment' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ExperimentCard({
  exp,
  notes,
  onNote,
  onEdit,
}: {
  exp: Experiment & { notes?: string }
  notes: string
  onNote: (v: string) => void
  onEdit: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(notes)

  function saveNote() { onNote(draft); setEditing(false) }

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-label-md font-semibold text-on-surface-variant">{exp.id}</span>
            <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Proposed
            </span>
          </div>
          <button onClick={onEdit}
            className="flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-container">
            <Icon name="edit" className="text-[15px]" />
            Edit
          </button>
        </div>
        <h3 className="text-body-lg font-semibold text-on-surface">{exp.name}</h3>
        <p className="text-body-sm text-on-surface-variant mt-0.5">{exp.targetWorkflow}</p>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">What we're testing</p>
          <p className="text-body-sm text-on-surface">{exp.hypothesis}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Metric</p>
            <p className="text-body-sm text-on-surface">{exp.metric}</p>
          </div>
          <div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Success threshold</p>
            <p className="text-body-sm font-semibold text-on-surface">{exp.proposedThreshold}</p>
          </div>
          <div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Where we'll measure</p>
            <p className="text-body-sm text-on-surface">{exp.validationScope}</p>
          </div>
        </div>

        <div className="border-t border-outline-variant pt-3">
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">What we'll do with the result</p>
          <p className="text-body-sm text-on-surface">{exp.decisionRule}</p>
        </div>

        {/* Notes */}
        <div className="border-t border-outline-variant pt-3">
          {editing ? (
            <>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={saveNote}
                onKeyDown={e => { if (e.key === 'Escape') saveNote() }}
                autoFocus
                rows={2}
                placeholder="Add team notes..."
                className="w-full px-3 py-2 rounded-lg border border-primary bg-surface-container-low text-body-sm text-on-surface focus:outline-none resize-none"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">Esc to save</p>
            </>
          ) : notes ? (
            <div onClick={() => { setDraft(notes); setEditing(true) }}
              className="flex items-start gap-2 cursor-text hover:bg-surface-container-low rounded-lg px-2 py-1.5 -mx-2">
              <Icon name="sticky_note_2" className="text-[14px] text-outline mt-0.5 flex-shrink-0" />
              <p className="text-body-sm text-on-surface-variant flex-1">{notes}</p>
              <Icon name="edit" className="text-[14px] text-outline opacity-0 group-hover:opacity-100 flex-shrink-0" />
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-on-surface-variant opacity-40 hover:opacity-70 transition-opacity">
              <Icon name="add" className="text-[14px]" />
              <span className="text-body-sm italic">Add a team note...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Experiments() {
  const [items, setItems] = useState<(Experiment & { notes?: string })[]>(experiments)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  function handleCreate(data: ExperimentFormData) {
    const newExp: Experiment & { notes?: string } = {
      id: data.id,
      name: data.name,
      targetWorkflow: data.targetWorkflow,
      hypothesis: data.hypothesis || 'To be defined.',
      metric: data.metric || 'To be defined.',
      proposedThreshold: data.proposedThreshold || 'To be defined.',
      validationScope: data.validationScope || 'To be defined.',
      decisionRule: data.decisionRule || 'To be defined.',
      status: 'Proposed',
    }
    setItems(prev => [...prev, newExp])
    if (data.notes) setNotes(n => ({ ...n, [data.id]: data.notes }))
    setShowModal(false)
  }

  function handleUpdate(data: ExperimentFormData) {
    setItems(prev => prev.map(e =>
      e.id === data.id ? {
        ...e,
        name: data.name,
        targetWorkflow: data.targetWorkflow,
        hypothesis: data.hypothesis,
        metric: data.metric,
        proposedThreshold: data.proposedThreshold,
        validationScope: data.validationScope,
        decisionRule: data.decisionRule,
      } : e
    ))
    if (data.notes) setNotes(n => ({ ...n, [data.id]: data.notes }))
    setEditing(null)
  }

  const editingExp = items.find(e => e.id === editing)

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Validation Plan</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Before extracting any capability from Riverbend, these questions need answers from live call volume.
            All experiments are proposed - none have started.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Icon name="add" className="text-[16px]" />
          New experiment
        </button>
      </div>

      {items.map(exp => (
        <ExperimentCard
          key={exp.id}
          exp={exp}
          notes={notes[exp.id] ?? ''}
          onNote={v => setNotes(n => ({ ...n, [exp.id]: v }))}
          onEdit={() => setEditing(exp.id)}
        />
      ))}

      {showModal && (
        <ExperimentModal
          initial={blankForm()}
          onSave={handleCreate}
          onCancel={() => setShowModal(false)}
          isNew
        />
      )}

      {editing && editingExp && (
        <ExperimentModal
          initial={{
            id: editingExp.id,
            name: editingExp.name,
            targetWorkflow: editingExp.targetWorkflow,
            hypothesis: editingExp.hypothesis,
            metric: editingExp.metric,
            proposedThreshold: editingExp.proposedThreshold,
            validationScope: editingExp.validationScope,
            decisionRule: editingExp.decisionRule,
            notes: notes[editingExp.id] ?? '',
          }}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
          isNew={false}
        />
      )}
    </div>
  )
}
