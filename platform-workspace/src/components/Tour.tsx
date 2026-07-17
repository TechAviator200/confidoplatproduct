import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

const STEPS = [
  {
    title: 'Overview',
    path: '/overview',
    icon: 'dashboard',
    desc: 'Start here. See what was built for Riverbend, which workflows were verified, and what the platform team still needs to decide before generalizing anything.',
  },
  {
    title: 'Workflow Insights',
    path: '/insights',
    icon: 'lightbulb',
    desc: 'Three categories of logic emerged from building five workflows: recurring patterns worth platformizing, clinic configuration that varies, and Riverbend-specific exceptions to isolate.',
  },
  {
    title: 'Capability Evaluation',
    path: '/capabilities',
    icon: 'inventory_2',
    desc: 'Ten platform candidates identified from Riverbend. Click any row to see the evidence behind it and what must be validated before an extraction decision can be made.',
  },
  {
    title: 'Validation Plan',
    path: '/experiments',
    icon: 'science',
    desc: 'Six questions that must be answered from live call volume before any capability is extracted. None have started - Riverbend has not yet gone live.',
  },
  {
    title: 'Workflow Lifecycle',
    path: '/lifecycle',
    icon: 'account_tree',
    desc: 'Riverbend has completed Customer Request through Evidence Capture. Pattern Review and Platform Decision require at least one additional clinic for meaningful comparison.',
  },
  {
    title: 'Workflow Detail',
    path: '/workflow-detail',
    icon: 'description',
    desc: 'Select any of the five workflows to inspect which steps are reusable platform candidates vs. clinic-specific configuration or hard exceptions.',
  },
  {
    title: 'Platform Roadmap',
    path: '/roadmap',
    icon: 'event_note',
    desc: 'A working hypothesis grounded in Riverbend evidence. All 12 items are proposed. Click the edit icon on any card to update the name, description, or rationale.',
  },
]

interface TourProps {
  open: boolean
  onClose: () => void
}

export default function Tour({ open, onClose }: TourProps) {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  if (!open) return null

  const current = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  function goTo(s: number) {
    setStep(s)
    navigate(STEPS[s].path)
  }

  function handleClose() {
    setStep(0)
    onClose()
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-white rounded-xl border border-outline-variant shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="explore" className="text-primary text-[18px]" />
          <span className="text-body-sm font-semibold text-on-surface">Product tour</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-md text-on-surface-variant">{step + 1} / {STEPS.length}</span>
          <button
            onClick={handleClose}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container transition-colors"
          >
            <Icon name="close" className="text-on-surface-variant text-[14px]" />
          </button>
        </div>
      </div>

      {/* Step indicator dots */}
      <div className="flex gap-1 px-4 pt-3">
        {STEPS.map((s, i) => (
          <button
            key={s.path}
            onClick={() => goTo(i)}
            className={`flex-1 h-1 rounded-full transition-colors ${
              i === step ? 'bg-primary' : i < step ? 'bg-primary/30' : 'bg-outline-variant'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon name={current.icon} className="text-primary text-[18px]" />
          <h3 className="text-body-md font-semibold text-on-surface">{current.title}</h3>
        </div>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">{current.desc}</p>
      </div>

      {/* Navigation */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          disabled={isFirst}
          onClick={() => goTo(step - 1)}
          className="flex-1 py-2 text-body-sm font-medium rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {isLast ? (
          <button
            onClick={handleClose}
            className="flex-1 py-2 text-body-sm font-medium rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        ) : (
          <button
            onClick={() => goTo(step + 1)}
            className="flex-1 py-2 text-body-sm font-medium rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
