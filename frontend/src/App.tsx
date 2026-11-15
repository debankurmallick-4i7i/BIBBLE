
import { useState, useEffect, type FormEvent } from 'react'

import {
  Feather,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  BookOpen,
  PenLine,
} from 'lucide-react'

import {
  loginUser,
  registerUser,
} from './services/api'

import type { Project } from './services/api'

import Dashboard from './pages/Dashboard'
import AIWorkspace from './pages/AIWorkspace'
import MyProjects from './pages/MyProjects'

import './App.css'

type AppView =
  | 'dashboard'
  | 'workspace'
  | 'projects'
  | 'project-workspace'

const INACTIVITY_LIMIT = 36 * 60 * 60 * 1000

const LAST_ACTIVITY_KEY = 'bibble_last_activity'
const ACCESS_TOKEN_KEY = 'bibble_access_token'
const REFRESH_TOKEN_KEY = 'bibble_refresh_token'

// Remove the local development session.
function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LAST_ACTIVITY_KEY)

  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

// Restore an existing session if it has not expired.
function restoreSession(): boolean {
  const token =
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY)

  if (!token) {
    clearSession()
    return false
  }

  const lastActivity = Number(
    localStorage.getItem(LAST_ACTIVITY_KEY) || 0
  )

  if (!lastActivity) {
    localStorage.setItem(
      LAST_ACTIVITY_KEY,
      String(Date.now())
    )
  } else if (
    Date.now() - lastActivity >= INACTIVITY_LIMIT
  ) {
    clearSession()
    return false
  }

  // Migrate older sessionStorage tokens.
  localStorage.setItem(ACCESS_TOKEN_KEY, token)

  const refreshToken =
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY)

  if (refreshToken) {
    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken
    )
  }

  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)

  return true
}

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isAuthenticated, setIsAuthenticated] =
    useState(restoreSession)

  const [currentView, setCurrentView] =
    useState<AppView>('dashboard')

  const [initialPrompt, setInitialPrompt] = useState('')

  // Store the currently selected project.
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null)

  const isRegister = mode === 'register'

  // Monitor activity and automatically log out after 36 hours.
  useEffect(() => {
    if (!isAuthenticated) return

    let lastSavedAt = 0

    const updateActivity = () => {
      const now = Date.now()

      if (now - lastSavedAt < 15000) return

      localStorage.setItem(
        LAST_ACTIVITY_KEY,
        String(now)
      )

      lastSavedAt = now
    }

    const checkInactivity = () => {
      const lastActivity = Number(
        localStorage.getItem(LAST_ACTIVITY_KEY) || 0
      )

      if (
        !lastActivity ||
        Date.now() - lastActivity >= INACTIVITY_LIMIT
      ) {
        clearSession()

        setIsAuthenticated(false)
        setCurrentView('dashboard')
        setInitialPrompt('')
        setSelectedProject(null)

        setNotice(
          'Your session expired due to inactivity. Please log in again.'
        )
      }
    }

    const activityEvents = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ]

    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity)
    })

    const inactivityTimer = window.setInterval(
      checkInactivity,
      60 * 1000
    )

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity)
      })

      window.clearInterval(inactivityTimer)
    }
  }, [isAuthenticated])

  // Login and registration.
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setNotice('')
    setIsSubmitting(true)

    try {
      if (isRegister) {
        const response = await registerUser(
          email,
          password
        )

        setNotice(response.message)
        setPassword('')
      } else {
        const response = await loginUser(
          email,
          password
        )

        if (!response.access_token) {
          throw new Error(
            'Login succeeded but no access token was received.'
          )
        }

        localStorage.setItem(
          ACCESS_TOKEN_KEY,
          response.access_token
        )

        if (response.refresh_token) {
          localStorage.setItem(
            REFRESH_TOKEN_KEY,
            response.refresh_token
          )
        }

        localStorage.setItem(
          LAST_ACTIVITY_KEY,
          String(Date.now())
        )

        setIsAuthenticated(true)
        setCurrentView('dashboard')
        setInitialPrompt('')
        setSelectedProject(null)
        setNotice('')
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function changeMode(
    nextMode: 'login' | 'register'
  ) {
    setMode(nextMode)
    setNotice('')
    setPassword('')
  }

  // Open the general AI Companion.
  function openCompanion(prompt = '') {
    setSelectedProject(null)
    setInitialPrompt(prompt)
    setCurrentView('workspace')
  }

  // Open a selected project.
  function openProject(project: Project) {
    setSelectedProject(project)
    setInitialPrompt('')
    setCurrentView('project-workspace')
  }

  // Return to the dashboard.
  function returnToDashboard() {
    setCurrentView('dashboard')
    setInitialPrompt('')
    setSelectedProject(null)
  }

  // Return from a project workspace to My Projects.
  function returnToProjects() {
    setCurrentView('projects')
    setInitialPrompt('')
  }

  // Authenticated application.
  if (isAuthenticated) {

    // Dedicated project workspace.
    if (
      currentView === 'project-workspace' &&
      selectedProject
    ) {
      return (
        <AIWorkspace
          project={selectedProject}
          onBackToProjects={returnToProjects}
        />
      )
    }

    // General AI Companion.
    if (currentView === 'workspace') {
      return (
        <AIWorkspace
          onBackToDashboard={returnToDashboard}
          initialPrompt={initialPrompt}
        />
      )
    }

    // My Projects page.
    if (currentView === 'projects') {
      return (
        <MyProjects
          onBackToDashboard={returnToDashboard}
          onOpenProject={openProject}
        />
      )
    }

    // Dashboard.
    return (
      <Dashboard
        onOpenCompanion={openCompanion}
        onOpenProjects={() => {
          setCurrentView('projects')
        }}
      />
    )
  }

  // Login and registration screen.
  return (
    <main className="auth-page">

      <header className="auth-header">
        <a
          href="/"
          className="brand"
          aria-label="Bibble home"
        >
          <span className="brand-icon">
            <Feather size={21} />
          </span>

          <span className="brand-name">
            Bibble
          </span>
        </a>

        <div className="header-caption">
          <span>ভাবো · লেখো · সাজাও</span>
          <span className="header-dot">✦</span>
          <span>Your creative companion</span>
        </div>
      </header>

      <section className="auth-layout">

        <aside className="welcome-panel">
          <div className="welcome-content">

            <span className="eyebrow">
              <Sparkles size={14} />
              A SPACE FOR YOUR IMAGINATION
            </span>

            <h1>
              Every idea
              <br />
              has a <span>story.</span>
            </h1>

            <p className="welcome-bengali">
              প্রতিটি ভাবনারই একটা গল্প আছে।
            </p>

            <p className="welcome-description">
              Find your words, explore your imagination, and create
              something that feels entirely yours.
            </p>

            <div className="feature-list">

              <div className="feature-item">
                <span className="feature-icon pink">
                  <PenLine size={19} />
                </span>

                <div>
                  <strong>Find your voice</strong>
                  <span>
                    Turn little thoughts into big ideas.
                  </span>
                </div>
              </div>

              <div className="feature-item">
                <span className="feature-icon lavender">
                  <BookOpen size={19} />
                </span>

                <div>
                  <strong>Build your stories</strong>
                  <span>
                    Keep every creative project together.
                  </span>
                </div>
              </div>

            </div>
          </div>

          <p className="welcome-footer">
            Made for the curious, the dreamers and the storytellers.
          </p>
        </aside>

        <section className="form-panel">
          <div className="form-card">

            <div className="mobile-brand">
              <span className="brand-icon">
                <Feather size={20} />
              </span>

              <span className="brand-name">
                Bibble
              </span>
            </div>

            <div className="form-heading">
              <span className="eyebrow">
                YOUR CREATIVE SPACE
              </span>

              <h2>
                {isRegister
                  ? 'Create your account'
                  : 'Welcome back'}
              </h2>

              <p>
                {isRegister
                  ? 'Your next great idea starts here.'
                  : 'Pick up where your imagination left off.'}
              </p>

              <p className="form-bengali">
                {isRegister
                  ? 'তোমার সৃজনশীল যাত্রা শুরু হোক।'
                  : 'আবার ফিরে আসার জন্য ধন্যবাদ।'}
              </p>
            </div>

            <div className="auth-tabs" role="tablist">

              <button
                type="button"
                role="tab"
                aria-selected={!isRegister}
                className={!isRegister ? 'active' : ''}
                onClick={() => changeMode('login')}
              >
                Log in
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                className={isRegister ? 'active' : ''}
                onClick={() => changeMode('register')}
              >
                Create account
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              {isRegister && (
                <div className="form-field">
                  <label htmlFor="name">
                    Your name
                  </label>

                  <input
                    id="name"
                    type="text"
                    placeholder="What should we call you?"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="form-field">
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-field">

                <div className="label-row">
                  <label htmlFor="password">
                    Password
                  </label>

                  {isRegister && (
                    <span className="field-hint">
                      At least 8 characters
                    </span>
                  )}
                </div>

                <div className="password-input">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete={
                      isRegister
                        ? 'new-password'
                        : 'current-password'
                    }
                    minLength={8}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isRegister && (
                <div className="form-extra">
                  <span className="remember-note">
                    Your ideas are yours. Always.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Please wait...'
                  : isRegister
                    ? 'Create my account'
                    : 'Log in to Bibble'}

                {!isSubmitting && (
                  <ArrowRight size={18} />
                )}
              </button>

              {notice && (
                <p className="form-notice" role="status">
                  {notice}
                </p>
              )}

            </form>

            <div className="form-divider">
              <span>OR</span>
            </div>

            <p className="switch-mode">
              {isRegister
                ? 'Already have an account?'
                : "Don't have an account yet?"}{' '}

              <button
                type="button"
                onClick={() =>
                  changeMode(
                    isRegister ? 'login' : 'register'
                  )
                }
              >
                {isRegister ? 'Log in' : 'Create one'}
              </button>
            </p>

            <p className="terms-note">
              By continuing, you agree to use Bibble responsibly and respect
              the creativity of others.
            </p>

          </div>
        </section>
      </section>

      <footer className="auth-bottom">
        <span>© 2026 Bibble</span>

        <span>
          Made with imagination <span className="heart">♥</span>
        </span>
      </footer>

    </main>
  )
}

export default App
