
import { useState } from 'react'
import {
  Feather,
  LayoutDashboard,
  Folder,
  Sparkles,
  Layers,
  Compass,
  Settings,
  CircleHelp,
  Search,
  Bell,
  Plus,
  BookOpen,
  Music2,
  Clapperboard,
  Clock3,
  ArrowRight,
  MoreHorizontal,
  MessageCircle,
  Menu,
  X,
} from 'lucide-react'

import './Dashboard.css'

const categories = [
  {
    title: 'Stories',
    description: 'Fiction, short stories and narratives',
    icon: BookOpen,
    className: 'stories',
    prompt: 'Help me develop a story idea.',
  },
  {
    title: 'Poetry',
    description: 'Poems, verses and emotions',
    icon: Feather,
    className: 'poetry',
    prompt: 'Help me write a poem.',
  },
  {
    title: 'Songs',
    description: 'Lyrics, compositions and musical ideas',
    icon: Music2,
    className: 'songs',
    prompt: 'Help me write song lyrics.',
  },
  {
    title: 'Screenplays',
    description: 'Scenes, scripts and dialogues',
    icon: Clapperboard,
    className: 'screenplays',
    prompt: 'Help me develop a screenplay.',
  },
]

type DashboardProps = {
  onOpenCompanion?: (prompt?: string) => void
  onOpenProjects?: () => void
}

function Dashboard({
  onOpenCompanion,
  onOpenProjects,
}: DashboardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [prompt, setPrompt] = useState('')

  function openAI(initialPrompt?: string) {
    setMenuOpen(false)
    onOpenCompanion?.(initialPrompt)
  }

  function submitPrompt() {
    const trimmedPrompt = prompt.trim()

    if (!trimmedPrompt) {
      openAI()
      return
    }

    openAI(trimmedPrompt)
    setPrompt('')
  }

  return (
    <div className="dashboard-page">

      {/* Mobile menu overlay */}
      {menuOpen && (
        <button
          className="dashboard-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${menuOpen ? 'mobile-open' : ''}`}>

        <div className="dashboard-logo">
          <span className="logo-symbol">
            <Feather size={27} />
          </span>

          <span className="logo-text">
            <strong>Bibble</strong>
            <small>AI Creative Studio</small>
          </span>

          <button
            className="mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-group">
          <span className="sidebar-heading">WORKSPACE</span>

          <button className="sidebar-item active">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>

          <button
            className="sidebar-item"
            onClick={() => {
              setMenuOpen(false)
              onOpenProjects?.()
            }}
          >
            <Folder size={19} />
            <span>My Projects</span>
          </button>

          <button
            className="sidebar-item"
            onClick={() => openAI()}
          >
            <Sparkles size={19} />
            <span>AI Companion</span>
          </button>

          <button className="sidebar-item">
            <Layers size={19} />
            <span>Templates</span>
          </button>

          <button className="sidebar-item">
            <Compass size={19} />
            <span>Explore</span>
          </button>
        </div>

        <div className="sidebar-group sidebar-preferences">
          <span className="sidebar-heading">PREFERENCES</span>

          <button className="sidebar-item">
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <button className="sidebar-item">
            <CircleHelp size={19} />
            <span>Help & Support</span>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">C</div>

          <div className="user-details">
            <strong>Creator</strong>
            <span>Free Workspace</span>
          </div>

          <MoreHorizontal size={19} />
        </div>

      </aside>

      {/* Main content */}
      <main className="dashboard-main">

        {/* Top navigation */}
        <header className="dashboard-topbar">

          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <span className="breadcrumb">
              <LayoutDashboard size={19} />
              <span>/</span>
              Dashboard
            </span>
          </div>

          <div className="topbar-right">

            <label className="dashboard-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search your projects..."
                aria-label="Search your projects"
              />
            </label>

            <button
              className="topbar-icon"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            <button className="topbar-avatar" aria-label="Profile">
              C
            </button>

          </div>
        </header>

        <div className="dashboard-content">

          {/* Welcome banner */}
          <section className="dashboard-hero">

            <div className="hero-content">
              <span className="hero-eyebrow">
                GOOD EVENING, CREATOR ✦
              </span>

              <h1>Every idea has a story.</h1>

              <p>
                Every great story begins with a little idea.
              </p>

              <button
                className="hero-create-button"
                onClick={() => openAI()}
              >
                <Plus size={20} />
                Create new project
              </button>
            </div>

            <div className="hero-decoration" aria-hidden="true">
              <div className="hero-wave hero-wave-one" />
              <div className="hero-wave hero-wave-two" />
              <div className="hero-wave hero-wave-three" />
            </div>

          </section>

          {/* Creative categories */}
          <section className="dashboard-section">

            <div className="section-title-row">
              <div className="section-title">
                <Sparkles size={25} />
                <div>
                  <h2>Create with AI</h2>
                  <p>
                    Start a new creative project with your AI writing companion.
                  </p>
                </div>
              </div>
            </div>

            <div className="category-grid">

              {categories.map((category) => {
                const Icon = category.icon

                return (
                  <button
                    className={`category-card ${category.className}`}
                    key={category.title}
                    onClick={() => openAI(category.prompt)}
                  >
                    <Icon size={31} strokeWidth={1.7} />

                    <h3>{category.title}</h3>

                    <p>{category.description}</p>

                    <span className="category-arrow">
                      <ArrowRight size={19} />
                    </span>
                  </button>
                )
              })}

            </div>
          </section>

          {/* Recent projects and AI companion */}
          <div className="dashboard-lower-grid">

            <section className="recent-projects">

              <div className="lower-section-heading">
                <div>
                  <h2>
                    <Clock3 size={23} />
                    Recent projects
                  </h2>

                  <p>Pick up where you left off.</p>
                </div>
              </div>

              {/* First-time empty state */}
              <div className="dashboard-empty-projects">
                <div className="empty-project-icon">
                  <Folder size={27} />
                </div>

                <h3>Your creative journey starts here.</h3>

                <p>
                  Your projects will appear here once you create your first one.
                  Every great idea deserves a place to grow.
                </p>

                <button
                  className="empty-project-button"
                  onClick={() => openAI()}
                >
                  <Plus size={17} />
                  Create your first project
                </button>
              </div>

            </section>

            {/* AI companion */}
            <section className="ai-companion-card">

              <div className="ai-card-heading">
                <span className="ai-card-icon">
                  <Sparkles size={26} />
                </span>

                <div>
                  <h2>Bibble AI</h2>
                  <span>Your Creative Companion</span>
                </div>
              </div>

              <p className="ai-card-description">
                Get ideas, outlines, rewrites and feedback
                for your stories, poems, songs and scripts.
              </p>

              <form
                className="ai-prompt-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  submitPrompt()
                }}
              >
                <MessageCircle size={20} />

                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ask Bibble anything..."
                  aria-label="Ask Bibble anything"
                />

                <button type="submit" aria-label="Send prompt">
                  <ArrowRight size={21} />
                </button>
              </form>

            </section>

          </div>

          <footer className="dashboard-footer">
            Made for the curious, the dreamers and the storytellers.
          </footer>

        </div>
      </main>
    </div>
  )
}

export default Dashboard
