import { useState } from 'react'
import { roadmapItems, ROADMAP_INTRO, type RoadmapItem } from '../data/mockData'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

const HORIZON_CONFIG = {
  Now: {
    label: 'Now',
    description: 'Field-enabling standards and internal enablement infrastructure — shared scaffolding that both deployment teams and the platform itself depend on',
    icon: 'play_circle',
    color: 'text-primary',
    bg: 'bg-primary-container',
    text: 'text-on-primary-container',
    border: 'border-primary/30',
  },
  Next: {
    label: 'Next',
    description: 'Convert validated patterns into configurable platform components',
    icon: 'pending',
    color: 'text-secondary',
    bg: 'bg-secondary-container',
    text: 'text-on-secondary-container',
    border: 'border-outline-variant',
  },
  Later: {
    label: 'Later',
    description: 'Improve cross-customer learning and platform scale',
    icon: 'schedule',
    color: 'text-on-surface-variant',
    bg: 'bg-surface-container',
    text: 'text-on-surface-variant',
    border: 'border-outline-variant',
  },
} as const

interface EditState {
  id: string
  name: string
  description: string
  rationale: string
  businessValue: string
  status: 'Now' | 'Next' | 'Later'
}

function EditModal({
  item,
  onSave,
  onCancel,
}: {
  item: EditState
  onSave: (updated: EditState) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(item)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl border border-outline-variant shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-headline-md text-on-surface">Edit roadmap item</h2>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center">
            <Icon name="close" className="text-on-surface-variant" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Name</label>
            <input type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Description</label>
            <textarea rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Rationale</label>
            <textarea rows={3} value={form.rationale}
              onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Business value</label>
            <textarea rows={2} value={form.businessValue}
              onChange={e => setForm(f => ({ ...f, businessValue: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Horizon</label>
            <div className="flex gap-2">
              {(['Now', 'Next', 'Later'] as const).map(h => (
                <button key={h}
                  onClick={() => setForm(f => ({ ...f, status: h }))}
                  className={`flex-1 py-2 rounded-lg text-body-sm font-medium border transition-colors ${
                    form.status === h
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-outline-variant text-body-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(form)}
            className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:opacity-90 transition-opacity">
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

function RoadmapCard({ item, onEdit }: { item: RoadmapItem; onEdit: (item: RoadmapItem) => void }) {
  const hz = HORIZON_CONFIG[item.status]
  return (
    <div className={`bg-white rounded-xl border ${hz.border} shadow-sm p-4 group`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${hz.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon name={item.icon} className={`${hz.text} text-[16px]`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-body-md font-semibold text-on-surface">{item.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${hz.bg} ${hz.text}`}>
                Proposed
              </span>
            </div>
            <button
              onClick={() => onEdit(item)}
              title="Edit"
              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container transition-all flex-shrink-0"
            >
              <Icon name="edit" className="text-on-surface-variant text-[15px]" />
            </button>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1">{item.description}</p>
          <p className="text-body-sm text-on-surface mt-2">
            <span className="font-medium">Rationale: </span>{item.rationale}
          </p>
          <p className="text-body-sm text-on-surface-variant mt-1">
            <span className="font-medium text-on-surface">Business value: </span>{item.businessValue}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Roadmap() {
  const [items, setItems]     = useState<RoadmapItem[]>(roadmapItems)
  const [editing, setEditing] = useState<EditState | null>(null)

  function handleEdit(item: RoadmapItem) {
    setEditing({ id: item.id, name: item.name, description: item.description, rationale: item.rationale, businessValue: item.businessValue, status: item.status })
  }

  function handleSave(updated: EditState) {
    setItems(prev => prev.map(i =>
      i.id === updated.id
        ? { ...i, name: updated.name, description: updated.description, rationale: updated.rationale, businessValue: updated.businessValue, status: updated.status }
        : i
    ))
    setEditing(null)
  }

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-on-surface">Platform Roadmap</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Proposed - grounded in Riverbend evidence only. All items require product review before commitment.
        </p>
      </div>

      {/* Intro */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
        <p className="text-body-md text-on-surface leading-relaxed">{ROADMAP_INTRO}</p>
        <p className="text-body-sm text-on-surface-variant mt-3 italic">
          No items are committed, scheduled, or assigned. Hover any card and click the edit icon to update name, description, rationale, or horizon.
        </p>
      </div>

      {/* Three horizons */}
      {(['Now', 'Next', 'Later'] as const).map(horizon => {
        const hz = HORIZON_CONFIG[horizon]
        const horizonItems = items.filter(r => r.status === horizon)
        return (
          <div key={horizon}>
            <div className="flex items-center gap-2 mb-1">
              <Icon name={hz.icon} className={`${hz.color} text-[20px]`} />
              <h2 className="text-headline-md font-semibold text-on-surface">{hz.label}</h2>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${hz.bg} ${hz.text}`}>
                {horizonItems.length} items
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-4">{hz.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {horizonItems.map(item => (
                <RoadmapCard key={item.id} item={item} onEdit={handleEdit} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Deferred capabilities note */}
      <div className="bg-surface-container rounded-xl p-5 border border-outline-variant">
        <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Intentionally deferred</p>
        <p className="text-body-sm text-on-surface">
          Future product planning capabilities - market sizing, business prioritization, portfolio analysis, and revenue modeling - are not included in this roadmap.
          This workspace focuses on evaluating validated workflows and deciding what becomes a platform capability.
          Those planning inputs belong in a separate system, after capabilities have been approved for productization and cross-clinic evidence exists.
        </p>
      </div>

      {editing && (
        <EditModal item={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  )
}
