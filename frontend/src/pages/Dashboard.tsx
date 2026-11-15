
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

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
  MessageCircle,
  Menu,
  X,
  LogOut,
  UserRound,
  LoaderCircle,
} from 'lucide-react'

import { createProject, getProjects } from '../services/api'
import type { Project } from '../services/api'

import './Dashboard.css'

const categories = [
  {
    title: 'Stories',
    description: 'Fiction, short stories and narratives',
    icon: BookOpen,
    className: 'stories',
    projectType: 'story',
  },
  {
    title: 'Poetry',
    description: 'Poems, verses and emotions',
    icon: Feather,
    className: 'poetry',
    projectType: 'poem',
  },
  {
    title: 'Songs',
    description: 'Lyrics, compositions and musical ideas',
    icon: Music2,
    className: 'songs',
    projectType: 'song',
  },
  {
    title: 'Screenplays',
    description: 'Scenes, scripts and dialogues',
    icon: Clapperboard,
    className: 'screenplays',
    projectType: 'screenplay',
  },
]

type DashboardProps = {
  onOpenCompanion?: (prompt?: string) => void
  onOpenProjects?: () => void
  onOpenTemplates?: () => void
  onOpenProject?: (project: Project) => void
  userName: string
  userEmail: string
  onEditProfile: () => void
  onLogout: () => void
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'GOOD MORNING'
  if (hour >= 12 && hour < 17) return 'GOOD AFTERNOON'
  if (hour >= 17 && hour < 21) return 'GOOD EVENING'

  return 'GOOD NIGHT'
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return '?'

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function formatDate(date?: string) {
  if (!date) return 'Recently created'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) {
    return 'Recently created'
  }

  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function Dashboard({
  onOpenCompanion,
  onOpenProjects,
  onOpenTemplates,
  onOpenProject,
  userName,
  userEmail,
  onEditProfile,
  onLogout,
}: DashboardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [prompt, setPrompt] = useState('')

  // Project search state
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectError, setProjectError] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectType, setNewProjectType] = useState('story')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [greeting, setGreeting] = useState(getGreeting)

  const initials = getInitials(userName)

  useEffect(() => {
    const updateGreeting = () => setGreeting(getGreeting())
    const timer = window.setInterval(updateGreeting, 60 * 1000)

    return () => window.clearInterval(timer)
  }, [])

  // Load the user's actual saved projects.
  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      setIsLoadingProjects(true)
      setProjectError('')

      try {
        const result = await getProjects()

        if (!cancelled) {
          setProjects(result)
        }
      } catch (error) {
        if (!cancelled) {
          setProjectError(
            error instanceof Error
              ? error.message
              : 'Could not load your projects.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProjects(false)
        }
      }
    }

    loadProjects()

    return () => {
      cancelled = true
    }
  }, [])

  // Close search results when the user clicks outside the search area.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  // Search title, project type and description.
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return projects

    return projects.filter((project) => {
      const searchableText = [
        project.title,
        project.project_type,
        project.description || '',
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [projects, search])

  const hasSearchQuery = search.trim().length > 0

  function openProject(project: Project) {
    setSearchOpen(false)
    setSearch('')
    setMenuOpen(false)
    onOpenProject?.(project)
  }

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === 'Escape') {
      setSearchOpen(false)
      return
    }

    if (event.key === 'Enter' && filteredProjects.length > 0) {
      event.preventDefault()
      openProject(filteredProjects[0])
    }
  }

  function openAI(initialPrompt?: string) {
    setMenuOpen(false)
    onOpenCompanion?.(initialPrompt)
  }

  function openCreateProject(projectType = 'story') {
    setMenuOpen(false)
    setNewProjectType(projectType)
    setNewProjectTitle('')
    setNewProjectDescription('')
    setCreateError('')
    setIsCreateOpen(true)
  }

  function closeCreateProject() {
    if (isCreating) return

    setIsCreateOpen(false)
    setCreateError('')
  }

  async function handleCreateProject(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const title = newProjectTitle.trim()

    if (!title) {
      setCreateError('Please enter a project title.')
      return
    }

    setIsCreating(true)
    setCreateError('')

    try {
      const createdProject = await createProject({
        title,
        project_type: newProjectType,
        description: newProjectDescription.trim(),
      })

      setProjects((current) => [createdProject, ...current])

      setIsCreateOpen(false)
      setNewProjectTitle('')
      setNewProjectDescription('')

      if (onOpenProject) {
        onOpenProject(createdProject)
      } else {
        onOpenProjects?.()
      }
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : 'Could not create your project.'
      )
    } finally {
      setIsCreating(false)
    }
  }

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedPrompt = prompt.trim()

    if (!trimmedPrompt) {
      openAI()
      return
    }

    openAI(trimmedPrompt)
    setPrompt('')
  }

  function openProfile() {
    setAccountMenuOpen(false)
    onEditProfile()
  }

  function logout() {
    setAccountMenuOpen(false)
    onLogout()
  }

  return (
    <div className="dashboard-page">

      {/* Mobile navigation overlay */}
      {menuOpen && (
        <button
          className="dashboard-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${menuOpen ? 'mobile-open' : ''}`}
      >
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

          <button
            className="sidebar-item"
            onClick={() => {
              setMenuOpen(false)
              onOpenTemplates?.()
            }}
          >
            <Layers size={19} />
            <span>Templates</span>
          </button>
        </div>

        <div className="sidebar-group sidebar-preferences">
          <span className="sidebar-heading">PREFERENCES</span>

          <button
            className="sidebar-item"
            disabled
            title="Settings are not available yet."
            style={{ opacity: 0.55, cursor: 'not-allowed' }}
          >
            <Settings size={19} />
            <span>Settings</span>
            <small style={{ marginLeft: 'auto', fontSize: 10 }}>SOON</small>
          </button>

          <button
            className="sidebar-item"
            disabled
            title="Help and support are not available yet."
            style={{ opacity: 0.55, cursor: 'not-allowed' }}
          >
            <CircleHelp size={19} />
            <span>Help & Support</span>
            <small style={{ marginLeft: 'auto', fontSize: 10 }}>SOON</small>
          </button>
        </div>

        <button
          type="button"
          className="sidebar-user"
          onClick={openProfile}
          title="Edit your profile"
          style={{
            width: '100%',
            textAlign: 'left',
            border: 0,
            cursor: 'pointer',
          }}
        >
          <div className="user-avatar">{initials}</div>

          <div className="user-details">
            <strong>{userName}</strong>
            <span>{userEmail}</span>
          </div>

          <UserRound size={19} />
        </button>
      </aside>

      {/* Main dashboard */}
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

            {/* Functional project search */}
            <div
              ref={searchContainerRef}
              style={{
                position: 'relative',
                width: 'min(100%, 440px)',
                flex: '1 1 300px',
              }}
            >
              <label
                className="dashboard-search"
                style={{ width: '100%' }}
              >
                <Search size={18} />

                <input
                  type="search"
                  placeholder="Search your projects..."
                  aria-label="Search your projects"
                  aria-expanded={searchOpen && hasSearchQuery}
                  aria-controls="project-search-results"
                  value={search}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setSearchOpen(true)
                  }}
                  onKeyDown={handleSearchKeyDown}
                />

                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearch('')
                      setSearchOpen(false)
                    }}
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      border: 0,
                      background: 'transparent',
                      color: '#857780',
                      cursor: 'pointer',
                      padding: 5,
                    }}
                  >
                    <X size={17} />
                  </button>
                )}
              </label>

              {searchOpen && hasSearchQuery && (
                <div
                  id="project-search-results"
                  role="listbox"
                  aria-label="Project search results"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    maxHeight: 360,
                    overflowY: 'auto',
                    padding: 9,
                    border: '1px solid #EEDBD3',
                    borderRadius: 15,
                    background: '#FFFCFA',
                    boxShadow: '0 15px 40px rgba(64, 51, 62, 0.14)',
                    color: '#40333E',
                  }}
                >
                  <div
                    style={{
                      padding: '7px 9px 10px',
                      color: '#857780',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                    }}
                  >
                    {isLoadingProjects
                      ? 'Searching projects...'
                      : `${filteredProjects.length} ${
                          filteredProjects.length === 1 ? 'result' : 'results'
                        }`}
                  </div>

                  {isLoadingProjects ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        padding: 13,
                        color: '#857780',
                        fontSize: 13,
                      }}
                    >
                      <LoaderCircle size={17} />
                      Loading your projects...
                    </div>
                  ) : projectError ? (
                    <p
                      role="alert"
                      style={{
                        margin: 0,
                        padding: 13,
                        color: '#BD4C6C',
                        fontSize: 13,
                      }}
                    >
                      {projectError}
                    </p>
                  ) : filteredProjects.length > 0 ? (
                    filteredProjects.slice(0, 8).map((project) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected="false"
                        key={project.id}
                        onClick={() => openProject(project)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          padding: '12px 10px',
                          border: 0,
                          borderRadius: 11,
                          background: 'transparent',
                          color: '#40333E',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.background = '#F5E8E3'
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <span
                          style={{
                            width: 37,
                            height: 37,
                            flexShrink: 0,
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: 10,
                            background: '#F5E8E3',
                            color: '#BD4C6C',
                          }}
                        >
                          <Folder size={18} />
                        </span>

                        <span style={{ minWidth: 0, flex: 1 }}>
                          <strong
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: 13,
                            }}
                          >
                            {project.title}
                          </strong>

                          <small
                            style={{
                              display: 'block',
                              marginTop: 4,
                              color: '#857780',
                              fontSize: 11,
                            }}
                          >
                            {project.project_type} ·{' '}
                            {formatDate(project.updated_at || project.created_at)}
                          </small>
                        </span>

                        <ArrowRight size={16} color="#BD4C6C" />
                      </button>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: '17px 12px',
                        textAlign: 'center',
                      }}
                    >
                      <Folder
                        size={25}
                        color="#BD4C6C"
                        style={{ marginBottom: 8 }}
                      />

                      <strong
                        style={{
                          display: 'block',
                          fontSize: 13,
                        }}
                      >
                        No matching projects
                      </strong>

                      <p
                        style={{
                          margin: '6px 0 0',
                          color: '#857780',
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        Try a different title, project type or keyword.
                      </p>
                    </div>
                  )}

                  {!isLoadingProjects &&
                    !projectError &&
                    filteredProjects.length > 8 && (
                      <p
                        style={{
                          margin: '8px 5px 3px',
                          color: '#857780',
                          fontSize: 11,
                          textAlign: 'center',
                        }}
                      >
                        Showing the first 8 results. Refine your search to find
                        another project.
                      </p>
                    )}
                </div>
              )}
            </div>

            {/* Notifications: currently an honest empty state */}
            <div style={{ position: 'relative' }}>
              <button
                className="topbar-icon"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((open) => !open)
                  setAccountMenuOpen(false)
                }}
              >
                <Bell size={20} />
              </button>

              {notificationsOpen && (
                <div
                  role="status"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    zIndex: 20,
                    width: 260,
                    padding: 18,
                    border: '1px solid #EEDBD3',
                    borderRadius: 15,
                    background: '#FFFCFA',
                    boxShadow: '0 12px 35px rgba(64, 51, 62, 0.12)',
                    color: '#40333E',
                  }}
                >
                  <strong>Notifications</strong>
                  <p
                    style={{
                      margin: '9px 0 0',
                      color: '#857780',
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    Notifications are not available yet. We'll show updates
                    here when the notification feature is implemented.
                  </p>
                </div>
              )}
            </div>

            {/* Account menu */}
            <div style={{ position: 'relative' }}>
              <button
                className="topbar-avatar"
                aria-label="Open account menu"
                aria-expanded={accountMenuOpen}
                onClick={() => {
                  setAccountMenuOpen((open) => !open)
                  setNotificationsOpen(false)
                }}
              >
                {initials}
              </button>

              {accountMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    zIndex: 20,
                    width: 220,
                    padding: 10,
                    border: '1px solid #EEDBD3',
                    borderRadius: 15,
                    background: '#FFFCFA',
                    boxShadow: '0 12px 35px rgba(64, 51, 62, 0.12)',
                    color: '#40333E',
                  }}
                >
                  <div
                    style={{
                      padding: '9px 10px 13px',
                      borderBottom: '1px solid #EEDBD3',
                      marginBottom: 7,
                    }}
                  >
                    <strong>{userName}</strong>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 12,
                        color: '#857780',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {userEmail}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openProfile}
                    style={menuButtonStyle}
                  >
                    <UserRound size={16} />
                    Edit profile
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    style={{
                      ...menuButtonStyle,
                      color: '#BD4C6C',
                    }}
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">

          {/* Welcome banner */}
          <section className="dashboard-hero">
            <div className="hero-content">
              <span className="hero-eyebrow">
                {greeting}, {userName.toUpperCase()} ✦
              </span>

              <h1>Every idea has a story.</h1>

              <p>Every great story begins with a little idea.</p>

              <button
                className="hero-create-button"
                onClick={() => openCreateProject()}
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
                    onClick={() => openCreateProject(category.projectType)}
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

                {projects.length > 0 && (
                  <button
                    type="button"
                    onClick={onOpenProjects}
                    style={{
                      border: 0,
                      background: 'transparent',
                      color: '#BD4C6C',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    View all
                  </button>
                )}
              </div>

              {isLoadingProjects ? (
                <div className="dashboard-empty-projects">
                  <LoaderCircle
                    size={25}
                    style={{ animation: 'bibble-spin 1s linear infinite' }}
                  />
                  <p>Loading your projects...</p>
                </div>
              ) : projectError ? (
                <div className="dashboard-empty-projects">
                  <p>{projectError}</p>
                  <button
                    className="empty-project-button"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </button>
                </div>
              ) : filteredProjects.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gap: 11,
                    marginTop: 18,
                  }}
                >
                  {filteredProjects.slice(0, 4).map((project) => (
                    <button
                      type="button"
                      key={project.id}
                      onClick={() => openProject(project)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 13,
                        padding: 14,
                        border: '1px solid #EEDBD3',
                        borderRadius: 14,
                        background: '#FFFCFA',
                        color: '#40333E',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: 42,
                          height: 42,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          borderRadius: 12,
                          background: '#F5E8E3',
                          color: '#BD4C6C',
                        }}
                      >
                        <Folder size={20} />
                      </span>

                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong
                          style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {project.title}
                        </strong>

                        <small
                          style={{
                            display: 'block',
                            marginTop: 4,
                            color: '#857780',
                          }}
                        >
                          {project.project_type} ·{' '}
                          {formatDate(project.updated_at || project.created_at)}
                        </small>
                      </span>

                      <ArrowRight size={18} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-projects">
                  <div className="empty-project-icon">
                    <Folder size={27} />
                  </div>

                  <h3>
                    {hasSearchQuery
                      ? 'No matching projects found.'
                      : 'Your creative journey starts here.'}
                  </h3>

                  <p>
                    {hasSearchQuery
                      ? 'Try another search term.'
                      : 'Your projects will appear here once you create your first one. Every great idea deserves a place to grow.'}
                  </p>

                  {!hasSearchQuery && (
                    <button
                      className="empty-project-button"
                      onClick={() => openCreateProject()}
                    >
                      <Plus size={17} />
                      Create your first project
                    </button>
                  )}
                </div>
              )}
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
                Get ideas, outlines, rewrites and feedback for your stories,
                poems, songs and scripts.
              </p>

              <form className="ai-prompt-form" onSubmit={submitPrompt}>
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

      {/* Create project modal */}
      {isCreateOpen && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateProject()
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(45, 32, 39, 0.42)',
            backdropFilter: 'blur(5px)',
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            style={{
              width: '100%',
              maxWidth: 480,
              padding: 28,
              borderRadius: 22,
              background: '#FFFCFA',
              color: '#40333E',
              boxShadow: '0 20px 70px rgba(45, 32, 39, 0.18)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 22,
              }}
            >
                <div>
                  <span
                    style={{
                      color: '#BD4C6C',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                    }}
                  >
                    START SOMETHING NEW
                  </span>

                  <h2
                    id="create-project-title"
                    style={{ margin: '7px 0 0', fontSize: 24 }}
                  >
                    Create a project
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeCreateProject}
                  disabled={isCreating}
                  aria-label="Close project creation"
                  style={{
                    border: 0,
                    background: '#F5E8E3',
                    borderRadius: 12,
                    padding: 9,
                    cursor: 'pointer',
                  }}
                >
                  <X size={19} />
                </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <label style={formLabelStyle} htmlFor="new-project-title">
                Project title
              </label>

              <input
                id="new-project-title"
                value={newProjectTitle}
                onChange={(event) => setNewProjectTitle(event.target.value)}
                placeholder="Give your idea a name..."
                maxLength={120}
                required
                autoFocus
                style={formInputStyle}
              />

              <label style={formLabelStyle} htmlFor="new-project-type">
                Project type
              </label>

              <select
                id="new-project-type"
                value={newProjectType}
                onChange={(event) => setNewProjectType(event.target.value)}
                style={formInputStyle}
              >
                <option value="story">Story</option>
                <option value="poem">Poetry</option>
                <option value="song">Song</option>
                <option value="screenplay">Screenplay</option>
                <option value="other">Other</option>
              </select>

              <label
                style={formLabelStyle}
                htmlFor="new-project-description"
              >
                Description{' '}
                <span style={{ color: '#857780', fontWeight: 400 }}>
                  (optional)
                </span>
              </label>

              <textarea
                id="new-project-description"
                value={newProjectDescription}
                onChange={(event) =>
                  setNewProjectDescription(event.target.value)
                }
                placeholder="What is this project about?"
                rows={3}
                maxLength={1000}
                style={{
                  ...formInputStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />

              {createError && (
                <p
                  role="alert"
                  style={{
                    color: '#BD4C6C',
                    fontSize: 13,
                    margin: '12px 0',
                  }}
                >
                  {createError}
                </p>
              )}

              <button
                type="submit"
                disabled={isCreating}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                  marginTop: 18,
                  padding: '14px 16px',
                  border: 0,
                  borderRadius: 12,
                  background: '#BD4C6C',
                  color: 'white',
                  fontWeight: 600,
                  cursor: isCreating ? 'wait' : 'pointer',
                  opacity: isCreating ? 0.7 : 1,
                }}
              >
                {isCreating ? (
                  <>
                    <LoaderCircle size={18} />
                    Creating project...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create project
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

const menuButtonStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '11px 10px',
  border: 0,
  borderRadius: 9,
  background: 'transparent',
  color: '#40333E',
  textAlign: 'left' as const,
  cursor: 'pointer',
  fontSize: 13,
}

const formLabelStyle = {
  display: 'block',
  marginBottom: 8,
  marginTop: 16,
  fontSize: 14,
  fontWeight: 600,
}

const formInputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '13px 14px',
  border: '1px solid #EEDBD3',
  borderRadius: 12,
  background: '#FFFCFA',
  color: '#40333E',
  fontSize: 14,
  outlineColor: '#BD4C6C',
}

export default Dashboard
