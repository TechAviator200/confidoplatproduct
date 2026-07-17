import { useState } from 'react'
import { overview } from '../data/mockData'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

type Item = { id: string; label: string; checked: boolean }

function makeId() {
  return Math.random().toString(36).slice(2, 9)
}

function AddItemRow({ placeholder, onAdd }: { placeholder: string; onAdd: (label: string) => void }) {
  const [value, setValue] = useState('')
  function submit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }
  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-outline-variant">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
      />
      <button
        onClick={submit}
        disabled={!value.trim()}
        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30"
      >
        Add
      </button>
    </div>
  )
}

export default function Overview() {
  // Merge workflowsImplemented (checked) and capabilityCandidates (unchecked) into one list
  const [workItems, setWorkItems] = useState<Item[]>(() => [
    ...overview.workflowsImplemented.map(label => ({ id: makeId(), label, checked: true })),
    ...overview.capabilityCandidates.map(label => ({ id: makeId(), label, checked: false })),
  ])

  const [exceptions, setExceptions] = useState<string[]>(overview.explicitExceptions)
  const [questions, setQuestions] = useState<string[]>(overview.platformDecisionsNeeded)

  function toggle(id: string) {
    setWorkItems(items => items.map(it => it.id === id ? { ...it, checked: !it.checked } : it))
  }

  function addWorkItem(label: string, checked: boolean) {
    setWorkItems(items => [...items, { id: makeId(), label, checked }])
  }

  const built = workItems.filter(it => it.checked)
  const candidates = workItems.filter(it => !it.checked)

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-on-surface">Riverbend: Platform Readiness</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          {overview.clinic} · {overview.clinicNote}
        </p>
        <p className="text-body-sm text-on-surface-variant mt-1">
          {overview.validationStatus}
        </p>
      </div>

      <div className="bg-secondary-container/30 rounded-xl border border-outline-variant px-4 py-3">
        <p className="text-body-sm text-on-surface">
          These are candidates identified from the Riverbend implementation, not claims about Confido's current platform inventory.
          Check a platform opportunity below to move it into the "What was built" list. Uncheck a built item to return it to candidates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What was built */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-headline-md font-semibold text-on-surface">What was built</h2>
            <span className="text-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              {built.length}
            </span>
          </div>
          <ul className="space-y-2">
            {built.map(item => (
              <li key={item.id} className="flex items-start gap-2.5">
                <button
                  onClick={() => toggle(item.id)}
                  className="flex-shrink-0 mt-0.5 text-primary hover:text-secondary transition-colors"
                  title="Uncheck to return to candidates"
                >
                  <Icon name="check_box" className="text-[18px]" />
                </button>
                <span className="text-body-sm text-on-surface leading-snug">{item.label}</span>
              </li>
            ))}
          </ul>
          <AddItemRow placeholder="Add a built workflow or feature..." onAdd={label => addWorkItem(label, true)} />
        </div>

        {/* Platform opportunities */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow p-5">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-headline-md font-semibold text-on-surface">Platform opportunities identified</h2>
            <span className="text-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              {candidates.length}
            </span>
          </div>
          <p className="text-body-sm text-on-surface-variant mb-3">
            Proposed candidates. Each requires cross-clinic validation before any extraction decision. Check an item to mark it as built.
          </p>
          <ul className="space-y-2">
            {candidates.map(item => (
              <li key={item.id} className="flex items-start gap-2.5">
                <button
                  onClick={() => toggle(item.id)}
                  className="flex-shrink-0 mt-0.5 text-outline hover:text-primary transition-colors"
                  title="Check to mark as built"
                >
                  <Icon name="check_box_outline_blank" className="text-[18px]" />
                </button>
                <span className="text-body-sm text-on-surface leading-snug">{item.label}</span>
              </li>
            ))}
          </ul>
          <AddItemRow placeholder="Add a capability candidate..." onAdd={label => addWorkItem(label, false)} />
        </div>
      </div>

      {/* Customer-specific rules */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow p-5">
        <h2 className="text-headline-md font-semibold text-on-surface mb-2">Customer-specific rules</h2>
        <p className="text-body-sm text-on-surface-variant mb-3">
          These rules are explicit to Riverbend's business. They should be isolated as clinic configuration, not abstracted into shared platform logic.
        </p>
        <ul className="space-y-2 mb-2">
          {exceptions.map((e, i) => (
            <li key={i} className="flex items-start gap-2.5 text-body-sm text-on-surface">
              <span className="flex-shrink-0 mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-error-container text-on-error-container whitespace-nowrap">
                Customer-specific
              </span>
              <span className="leading-snug">{e}</span>
            </li>
          ))}
        </ul>
        <AddItemRow
          placeholder="Add a customer-specific rule..."
          onAdd={label => setExceptions(ex => [...ex, label])}
        />
      </div>

      {/* Open questions */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow p-5">
        <h2 className="text-headline-md font-semibold text-on-surface mb-2">Open questions for platform review</h2>
        <p className="text-body-sm text-on-surface-variant mb-3">
          These decisions cannot be made from one clinic. They require at least one additional implementation to compare against.
        </p>
        <ul className="space-y-2 mb-2">
          {questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2.5 text-body-sm text-on-surface">
              <Icon name="help_outline" className="text-secondary text-[16px] mt-0.5 flex-shrink-0" />
              <span className="leading-snug">{q}</span>
            </li>
          ))}
        </ul>
        <AddItemRow
          placeholder="Add an open question..."
          onAdd={label => setQuestions(qs => [...qs, label])}
        />
      </div>
    </div>
  )
}
