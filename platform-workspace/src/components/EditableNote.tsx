import { useState, useRef, useEffect } from 'react'

interface EditableNoteProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

/**
 * Click-to-edit note field. Shows a muted "Add note" prompt when empty.
 * Saves on blur, Cmd/Ctrl+Enter, or Escape.
 * Drop this at the bottom of any card or section for team annotations.
 */
export default function EditableNote({
  value,
  onChange,
  placeholder = 'Add a team note...',
}: EditableNoteProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [editing])

  function open() {
    setDraft(value)
    setEditing(true)
  }

  function save() {
    onChange(draft)
    setEditing(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') save()
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  return (
    <div className="mt-3 pt-3 border-t border-outline-variant">
      {editing ? (
        <>
          <textarea
            ref={ref}
            value={draft}
            onChange={autoResize}
            onBlur={save}
            onKeyDown={handleKey}
            placeholder={placeholder}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-primary bg-surface-container-low text-body-sm text-on-surface focus:outline-none resize-none"
          />
          <p className="text-[11px] text-on-surface-variant mt-1">
            Cmd+Enter to save · Esc to close
          </p>
        </>
      ) : value ? (
        <div
          onClick={open}
          className="group flex items-start gap-2 cursor-text hover:bg-surface-container-low rounded-lg px-2 py-1.5 -mx-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px] text-outline mt-0.5 flex-shrink-0">
            sticky_note_2
          </span>
          <p className="flex-1 text-body-sm text-on-surface-variant">{value}</p>
          <span className="material-symbols-outlined text-[14px] text-outline opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
            edit
          </span>
        </div>
      ) : (
        <button
          onClick={open}
          className="flex items-center gap-1.5 text-on-surface-variant opacity-40 hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          <span className="text-body-sm italic">{placeholder}</span>
        </button>
      )}
    </div>
  )
}
