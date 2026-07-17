import { useState } from 'react'
import { lifecycleSteps } from '../data/mockData'
import EditableNote from '../components/EditableNote'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

// Stages completed at Riverbend (based on DECISIONS.md + TEST_CALL_SCRIPT.md evidence)
const RIVERBEND_COMPLETE = new Set([
  'Customer Need',
  'FDE Discovery',
  'Workflow Prototype',
  'Customer Validation',
  'Evidence Capture',
])

const RIVERBEND_PARTIAL = new Set([
  'Pattern Review',
  'Platform Product Assessment',
  'Capability Classification',
])

function stepStatus(stage: string): 'complete' | 'partial' | 'future' {
  if (RIVERBEND_COMPLETE.has(stage)) return 'complete'
  if (RIVERBEND_PARTIAL.has(stage)) return 'partial'
  return 'future'
}

const STATUS_STYLES = {
  complete: {
    dot: 'bg-primary border-primary',
    icon: 'text-primary',
    card: 'border-outline-variant',
    badge: 'bg-primary-container text-on-primary-container',
    badgeLabel: 'Done',
  },
  partial: {
    dot: 'bg-secondary-container border-secondary',
    icon: 'text-secondary',
    card: 'border-outline-variant',
    badge: 'bg-secondary-container text-on-secondary-container',
    badgeLabel: 'In Progress',
  },
  future: {
    dot: 'bg-surface-container border-outline',
    icon: 'text-outline',
    card: 'border-outline-variant opacity-60',
    badge: 'bg-surface-container text-on-surface-variant',
    badgeLabel: 'Not Started',
  },
}

export default function Lifecycle() {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const setNote = (k: string, v: string) => setNotes(n => ({ ...n, [k]: v }))

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-on-surface">Workflow Lifecycle</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          FDE → Platform operating model - illustrated with Riverbend Gastroenterology
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-secondary-container rounded-xl p-4 flex items-start gap-3">
        <Icon name="info" className="text-on-secondary-container mt-0.5 text-[18px]" />
        <p className="text-body-sm text-on-secondary-container">
          Stages after "Evidence Capture" are <strong>Proposed - not yet conducted</strong>.
          Pattern Review and Platform Decision require at least one additional clinic implementation for meaningful comparison.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {lifecycleSteps.map((step, i) => {
          const status = stepStatus(step.stage)
          const styles = STATUS_STYLES[status]
          const isLast = i === lifecycleSteps.length - 1

          return (
            <div key={step.stage} className="flex gap-4">
              {/* Timeline column */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${styles.dot}`}>
                  <Icon name={step.icon} className={`text-[14px] ${styles.icon}`} />
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 my-1 ${
                    status === 'complete' ? 'bg-primary' : 'bg-outline-variant'
                  }`} style={{ minHeight: '1.5rem' }} />
                )}
              </div>

              {/* Card */}
              <div className={`flex-1 bg-white rounded-xl border shadow-sm p-4 mb-3 ${styles.card}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-body-sm text-on-surface-variant font-mono">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-body-lg font-semibold text-on-surface">{step.stage}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${styles.badge}`}>
                      {styles.badgeLabel}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">{step.owner}</span>
                  </div>
                </div>

                <p className="text-body-sm text-on-surface-variant mb-2">{step.description}</p>

                <div className="bg-surface-container rounded-lg px-3 py-2">
                  <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                    Riverbend Example
                  </p>
                  <p className="text-body-sm text-on-surface">{step.riverbendExample}</p>
                </div>

                {step.notes && (
                  <p className="text-body-sm text-on-surface-variant italic mt-2">
                    <Icon name="info" className="text-[14px] mr-1" />
                    {step.notes}
                  </p>
                )}

                <div className="mt-2">
                  <EditableNote
                    value={notes[step.stage] ?? ''}
                    onChange={v => setNote(step.stage, v)}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
