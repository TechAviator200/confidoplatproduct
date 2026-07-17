import { type ReactNode, useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DocImportModal from './DocImportModal'
import Tour from './Tour'

interface NavItem {
  path: string
  icon: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/overview',        icon: 'dashboard',    label: 'Overview'     },
  { path: '/insights',        icon: 'lightbulb',    label: 'Insights'     },
  { path: '/capabilities',    icon: 'inventory_2',  label: 'Capabilities' },
  { path: '/experiments',     icon: 'science',      label: 'Experiments'  },
  { path: '/lifecycle',       icon: 'account_tree', label: 'Lifecycle'    },
  { path: '/roadmap',         icon: 'event_note',   label: 'Roadmap'      },
  { path: '/workflow-detail', icon: 'description',  label: 'Detail'       },
]

const WORKSPACES = [
  { id: 'riverbend', name: 'Riverbend Gastroenterology', subtitle: 'Two locations · Demo' },
]

// Icon with optional filled variant (matches Stitch active nav style)
function Icon({ name, filled = false, className = '' }: { name: string; filled?: boolean; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
    >
      {name}
    </span>
  )
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])
}

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()

  const [showImport, setShowImport]   = useState(false)
  const [showTour, setShowTour]       = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [userOpen, setUserOpen]       = useState(false)

  const accountRef = useRef<HTMLDivElement>(null)
  const userRef    = useRef<HTMLDivElement>(null)

  useOutsideClick(accountRef, () => setAccountOpen(false))
  useOutsideClick(userRef,    () => setUserOpen(false))

  function closeAll() { setAccountOpen(false); setUserOpen(false) }

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Top header ────────────────────────────────────── */}
      <header className="bg-primary flex justify-between items-center w-full px-panel-padding h-16 sticky top-0 z-50 shadow-sm">

        {/* Left: logo + account switcher */}
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-primary cursor-pointer md:hidden">menu</span>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-body-lg text-on-primary hidden sm:block tracking-tight">Confido Platform Workspace</span>
            <span className="font-bold text-body-lg text-on-primary sm:hidden">CPW</span>
          </div>

          {/* Account switcher */}
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => { setAccountOpen(o => !o); setUserOpen(false) }}
              className="hidden md:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/20 transition-colors text-body-sm font-medium text-on-primary"
            >
              <Icon name="medical_services" filled className="text-on-primary text-[16px]" />
              <span>Riverbend Gastroenterology</span>
              <Icon name={accountOpen ? 'expand_less' : 'expand_more'} className="text-on-primary/70 text-[16px]" />
            </button>

            {accountOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl border border-outline-variant shadow-xl z-50 py-1 overflow-hidden">
                <p className="px-3 pt-2 pb-1 text-label-md text-on-surface-variant uppercase tracking-wider">Workspaces</p>
                {WORKSPACES.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => setAccountOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container-low text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
                      <Icon name="medical_services" filled className="text-on-primary-container text-[14px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-on-surface truncate">{ws.name}</p>
                      <p className="text-[11px] text-on-surface-variant">{ws.subtitle}</p>
                    </div>
                    <Icon name="check" className="text-primary text-[16px]" />
                  </button>
                ))}
                <div className="border-t border-outline-variant mt-1">
                  <button
                    disabled
                    className="w-full flex items-center gap-3 px-3 py-2.5 opacity-40 cursor-not-allowed text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                      <Icon name="add" className="text-on-surface-variant text-[14px]" />
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-on-surface">Add clinic workspace</p>
                      <p className="text-[11px] text-on-surface-variant">Contact your Confido rep</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Import */}
          <button
            onClick={() => { setShowImport(true); closeAll() }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-body-sm font-medium text-on-primary hover:bg-white/10 transition-colors"
          >
            <Icon name="upload_file" className="text-on-primary/80 text-[16px]" />
            Import
          </button>

          {/* Tour */}
          <button
            onClick={() => { setShowTour(t => !t); closeAll() }}
            title="Product tour"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-on-primary ${
              showTour ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <Icon name="explore" className="text-[18px]" />
          </button>

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setUserOpen(o => !o); setAccountOpen(false) }}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <Icon name="account_circle" filled className="text-on-primary text-[18px]" />
            </button>
            {userOpen && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl border border-outline-variant shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-outline-variant">
                  <p className="text-body-sm font-semibold text-on-surface">Demo User</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Platform PM · Demo workspace</p>
                </div>
                <div className="py-1">
                  {[
                    { icon: 'settings',     label: 'Settings' },
                    { icon: 'help_outline', label: 'Documentation' },
                  ].map(item => (
                    <button key={item.label} disabled className="w-full flex items-center gap-3 px-4 py-2.5 text-left opacity-40 cursor-not-allowed">
                      <Icon name={item.icon} className="text-on-surface-variant text-[16px]" />
                      <span className="text-body-sm text-on-surface">{item.label}</span>
                    </button>
                  ))}
                  <div className="border-t border-outline-variant my-1" />
                  <button disabled className="w-full flex items-center gap-3 px-4 py-2.5 text-left opacity-40 cursor-not-allowed">
                    <Icon name="logout" className="text-on-surface-variant text-[16px]" />
                    <span className="text-body-sm text-on-surface">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ─────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col h-full w-64 bg-surface border-r border-outline-variant p-4 gap-2 sticky top-16 self-start max-h-[calc(100vh-4rem)] overflow-y-auto">

          {/* Workspace card - matches Stitch sidebar top */}
          <div className="flex items-center gap-3 p-2 mb-2 bg-surface-container-low rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
              <Icon name="hub" filled className="text-on-primary-container text-[18px]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label-md font-bold text-on-surface">Platform Workspace</p>
              <p className="text-[11px] text-on-surface-variant truncate">Confido Platform Workspace</p>
            </div>
            <span className="text-[10px] text-outline font-mono flex-shrink-0">v0.1</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-all ${
                    isActive
                      ? 'bg-secondary-container text-on-secondary-container font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} filled={isActive} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar footer - validation status widget (grounded data, matches Stitch visual) */}
          <div className="mt-auto pt-4 border-t border-outline-variant">
            <div className="p-3 bg-primary-container/10 rounded-lg">
              <p className="text-label-md text-primary font-bold mb-1">Validation Status</p>
              <div className="w-full bg-outline-variant h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${(11/12)*100}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-on-surface-variant">12 simulation scenarios (11 pass)</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 lg:hidden bg-white border-t border-outline-variant shadow-lg rounded-t-xl">
        {NAV_ITEMS.slice(0, 5).map(item => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <Icon name={item.icon} filled={isActive} className={isActive ? 'text-primary' : ''} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Overlays */}
      {showImport && <DocImportModal onClose={() => setShowImport(false)} />}
      <Tour open={showTour} onClose={() => setShowTour(false)} />
    </div>
  )
}
