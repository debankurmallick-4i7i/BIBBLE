import { useState } from 'react'
import {
  Feather,
  LayoutDashboard,
  Folder,
  Sparkles,
  Layers,
  Settings,
  CircleHelp,
  Menu,
  X,
  UserRound,
} from 'lucide-react'

import './WorkspaceSidebar.css'

type Props = {
  active: 'projects' | 'templates'
  userName?: string
  userEmail?: string
  onDashboard: () => void
  onProjects: () => void
  onTemplates: () => void
  onCompanion: () => void
}

export default function WorkspaceSidebar({
  active,
  userName = 'Creator',
  userEmail = '',
  onDashboard,
  onProjects,
  onTemplates,
  onCompanion,
}: Props) {
  const [open, setOpen] = useState(false)

  function navigate(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <>
      {open && (
        <button
          className="bibble-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <button
        className="bibble-mobile-menu"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu size={22} />
      </button>

      <aside
        className={`bibble-workspace-sidebar ${
          open ? 'is-open' : ''
        }`}
      >
        <div className="bibble-side-brand">
          <span className="bibble-side-mark">
            <Feather size={25} />
          </span>

          <span>
            <strong>Bibble</strong>
            <small>AI Creative Studio</small>
          </span>

          <button
            className="bibble-side-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bibble-side-group">
          <span className="bibble-side-label">
            WORKSPACE
          </span>

          <button
            className="bibble-side-item"
            onClick={() => navigate(onDashboard)}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>

          <button
            className={`bibble-side-item ${
              active === 'projects' ? 'active' : ''
            }`}
            onClick={() => navigate(onProjects)}
          >
            <Folder size={19} />
            <span>My Projects</span>
          </button>

          <button
            className="bibble-side-item"
            onClick={() => navigate(onCompanion)}
          >
            <Sparkles size={19} />
            <span>AI Companion</span>
          </button>

          <button
            className={`bibble-side-item ${
              active === 'templates' ? 'active' : ''
            }`}
            onClick={() => navigate(onTemplates)}
          >
            <Layers size={19} />
            <span>Templates</span>
          </button>
        </div>

        <div className="bibble-side-group bibble-side-preferences">
          <span className="bibble-side-label">
            PREFERENCES
          </span>

          <button
            className="bibble-side-item muted"
            disabled
          >
            <Settings size={19} />
            <span>Settings</span>
            <small>SOON</small>
          </button>

          <button
            className="bibble-side-item muted"
            disabled
          >
            <CircleHelp size={19} />
            <span>Help & Support</span>
            <small>SOON</small>
          </button>
        </div>

        <div className="bibble-side-user">
          <span className="bibble-side-avatar">
            <UserRound size={18} />
          </span>

          <span>
            <strong>{userName}</strong>
            <small>{userEmail}</small>
          </span>
        </div>
      </aside>
    </>
  )
}