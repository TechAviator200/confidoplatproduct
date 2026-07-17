import { useState, useRef } from 'react'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

interface Doc {
  id: string
  name: string
  type: string
  size: string
  date: string
}

// Pre-seeded with Part 1 artifacts already in the workspace
const SEEDED_DOCS: Doc[] = [
  { id: 'seed-1', name: 'RIVERBEND_CLINIC_PACK.pdf', type: 'PDF',   size: '2.4 MB', date: 'Jul 14, 2026' },
  { id: 'seed-2', name: 'DECISIONS.md',              type: 'MD',    size: '18 KB',  date: 'Jul 15, 2026' },
  { id: 'seed-3', name: 'SOURCE_MAP.md',             type: 'MD',    size: '12 KB',  date: 'Jul 15, 2026' },
  { id: 'seed-4', name: 'TEST_CALL_SCRIPT.md',       type: 'MD',    size: '8 KB',   date: 'Jul 15, 2026' },
]

const TYPE_ICONS: Record<string, string> = {
  PDF: 'picture_as_pdf',
  MD:  'description',
  DOCX: 'article',
  TXT: 'text_snippet',
}

export default function DocImportModal({ onClose }: { onClose: () => void }) {
  const [docs, setDocs] = useState<Doc[]>(SEEDED_DOCS)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newDocs: Doc[] = Array.from(files).map(f => ({
      id: `import-${Date.now()}-${f.name}`,
      name: f.name,
      type: f.name.split('.').pop()?.toUpperCase() ?? 'FILE',
      size: f.size > 1024 * 1024
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(f.size / 1024)} KB`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }))
    setImporting(true)
    setTimeout(() => {
      setDocs(prev => [...prev, ...newDocs])
      setImporting(false)
    }, 800)
  }

  function removeDoc(id: string) {
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-inverse-surface/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl border border-outline-variant shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h2 className="text-headline-md text-on-surface">Document Library</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Workspace: Riverbend Gastroenterology
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center transition-colors"
          >
            <Icon name="close" className="text-on-surface-variant" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          className={`mx-6 mt-5 border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            dragging
              ? 'border-primary bg-primary-container/10'
              : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container-low'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        >
          <Icon name="upload_file" className="text-on-surface-variant text-[36px] mb-2" />
          <p className="text-body-md font-medium text-on-surface">
            {importing ? 'Importing...' : 'Drop files here'}
          </p>
          <p className="text-body-sm text-on-surface-variant mt-1 mb-3">
            PDF, Markdown, DOCX, or plain text
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.md,.docx,.txt"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-outline-variant text-on-surface text-body-sm font-medium rounded-lg hover:bg-surface-container transition-colors"
          >
            Browse files
          </button>
        </div>

        {/* Doc list */}
        <div className="mx-6 mt-4 mb-6">
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
            Documents ({docs.length})
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {docs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container-low group transition-colors"
              >
                <Icon
                  name={TYPE_ICONS[doc.type] ?? 'description'}
                  className="text-on-surface-variant text-[18px] flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-on-surface truncate">{doc.name}</p>
                  <p className="text-[11px] text-on-surface-variant">{doc.size} · {doc.date}</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                  {doc.type}
                </span>
                {!doc.id.startsWith('seed') && (
                  <button
                    onClick={() => removeDoc(doc.id)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center hover:bg-error-container transition-all"
                  >
                    <Icon name="close" className="text-on-surface-variant text-[14px]" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
