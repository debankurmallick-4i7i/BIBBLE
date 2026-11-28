import { useState, useEffect, useRef, type FormEvent } from 'react'

import {
  Feather,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  BookOpen,
  PenLine,
  X,
  UserRound,
  LogOut,
  Save,
} from 'lucide-react'

import {
  loginUser,
  registerUser,
  getMyProfile,
  updateMyProfile,
} from './services/api'

import type {
  Project,
  UserProfile,
} from './services/api'

import Dashboard from './pages/Dashboard'
import AIWorkspace from './pages/AIWorkspace'
import MyProjects from './pages/MyProjects'
import Templates from './pages/Templates'

import './App.css'


import BibbleMuse from './components/BibbleMuse'

import MiniMuse from './components/MiniMuse'

import LiveDateTime from './components/LiveDateTime'


type AppView =
  | 'dashboard'
  | 'workspace'
  | 'projects'
  | 'project-workspace'
  | 'templates'

const INACTIVITY_LIMIT = 36 * 60 * 60 * 1000

const LAST_ACTIVITY_KEY = 'bibble_last_activity'
const ACCESS_TOKEN_KEY = 'bibble_access_token'
const REFRESH_TOKEN_KEY = 'bibble_refresh_token'

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LAST_ACTIVITY_KEY)

  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

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

const [museMood, setMuseMood] = useState<
  | 'idle'
  | 'email'
  | 'password'
  | 'error'
  | 'success'
  | 'sneaking'
  | 'caught'
  | 'innocent'
  | 'suspicious'
>('idle')



  const [isAuthenticated, setIsAuthenticated] =
    useState(restoreSession)

  const [currentView, setCurrentView] =
    useState<AppView>('dashboard')

  const [initialPrompt, setInitialPrompt] = useState('')

  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null)

  // Real authenticated user profile.
  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [isProfileLoading, setIsProfileLoading] =
    useState(false)

  const [isProfileEditorOpen, setIsProfileEditorOpen] =
    useState(false)

  const [profileName, setProfileName] = useState('')
  const [profileNotice, setProfileNotice] = useState('')
  const [isSavingProfile, setIsSavingProfile] =
    useState(false)

  const isRegister = mode === 'register'

  // Bibble's password-reaction timer.
const innocentTimer = useRef<number | null>(null)

function clearInnocentTimer() {
  if (innocentTimer.current !== null) {
    window.clearTimeout(innocentTimer.current)
    innocentTimer.current = null
  }
}

// Reveal / hide password reactions.
function togglePasswordVisibility() {
  const revealing = !showPassword

  setShowPassword(revealing)
  clearInnocentTimer()

  if (revealing) {
    // Oh no, she got caught!
    setMuseMood('caught')

    innocentTimer.current = window.setTimeout(() => {
      setMuseMood('innocent')
      innocentTimer.current = null
    }, 1300)
  } else {
    // Password hidden again. Back to sneaking.
    setMuseMood('sneaking')
  }
}

// Clean up the timer if the component unmounts.
useEffect(() => {
  return () => clearInnocentTimer()
}, [])



  // Load the real profile whenever an authenticated session is available.
  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null)
      return
    }

    let cancelled = false

    async function loadProfile() {
      setIsProfileLoading(true)

      try {
        const userProfile = await getMyProfile()

        if (!cancelled) {
          setProfile(userProfile)
          setProfileName(userProfile.display_name)
        }
      } catch (error) {
        if (!cancelled) {
          clearSession()
          setIsAuthenticated(false)
          setProfile(null)
          setNotice(
            error instanceof Error
              ? error.message
              : 'Your session is invalid. Please log in again.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsProfileLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

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
        setProfile(null)
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
          password,
          name
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

        setCurrentView('dashboard')
        setInitialPrompt('')
        setSelectedProject(null)
        setNotice('')
        setIsAuthenticated(true)
      }
} catch (error) {
  setMuseMood(isRegister ? 'error' : 'suspicious')

  setNotice(
    error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.'
  )
}
    finally {
      setIsSubmitting(false)
    }
  }

function changeMode(
  nextMode: 'login' | 'register'
) {
  clearInnocentTimer()
  setMode(nextMode)
  setNotice('')
  setPassword('')
  setShowPassword(false)
  setMuseMood('idle')
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

  function returnToDashboard() {
    setCurrentView('dashboard')
    setInitialPrompt('')
    setSelectedProject(null)
  }

  function returnToProjects() {
    setCurrentView('projects')
    setInitialPrompt('')
  }

  // Open the Templates page.
  function openTemplates() {
    setCurrentView('templates')
    setInitialPrompt('')
    setSelectedProject(null)
  }

  // Open the profile editor.
  function openProfileEditor() {
    if (!profile) return

    setProfileName(profile.display_name)
    setProfileNotice('')
    setIsProfileEditorOpen(true)
  }

  // Save the edited name to Supabase Auth metadata.
  async function handleProfileUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const trimmedName = profileName.trim()

    if (!trimmedName) {
      setProfileNotice('Please enter a valid name.')
      return
    }

    setIsSavingProfile(true)
    setProfileNotice('')

    try {
      const updatedProfile = await updateMyProfile(trimmedName)

      setProfile(updatedProfile)
      setProfileName(updatedProfile.display_name)
      setProfileNotice('Your profile has been updated.')

      window.setTimeout(() => {
        setIsProfileEditorOpen(false)
        setProfileNotice('')
      }, 900)
    } catch (error) {
      setProfileNotice(
        error instanceof Error
          ? error.message
          : 'Could not update your profile.'
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Log out and clear local session data.
  function handleLogout() {
    clearSession()
    setIsAuthenticated(false)
    setProfile(null)
    setIsProfileEditorOpen(false)
    setSelectedProject(null)
    setInitialPrompt('')
    setCurrentView('dashboard')
    setEmail('')
    setPassword('')
    setName('')
    setNotice('You have been logged out.')
  }

  // Authenticated application.
  if (isAuthenticated) {
    if (isProfileLoading || !profile) {
      return (
        <main className="auth-page">
          <section className="form-panel">
            <div className="form-card">
              <div className="brand">
                <span className="brand-icon">
                  <Feather size={21} />
                </span>
                <span className="brand-name">Bibble</span>
              </div>
              <p>Loading your creative space...</p>
            </div>
          </section>
        </main>
      )
    }

    return (
      <>
       {currentView === 'project-workspace' && selectedProject ? (
 <AIWorkspace
  project={selectedProject}
  onBackToProjects={returnToProjects}
  onOpenProjects={() => setCurrentView('projects')}
  onOpenTemplates={openTemplates}
  userName={profile.display_name}
  userEmail={profile.email}
/>
       ) : currentView === 'workspace' ? (
 <AIWorkspace
  onBackToDashboard={returnToDashboard}
  initialPrompt={initialPrompt}
  onOpenProjects={() => setCurrentView('projects')}
  onOpenTemplates={openTemplates}
  userName={profile.display_name}
  userEmail={profile.email}
/>
        ) : currentView === 'projects' ? (
          <MyProjects
            onBackToDashboard={returnToDashboard}
            onOpenProject={openProject}
          />
        ) : currentView === 'templates' ? (
          <Templates
            onBackToDashboard={returnToDashboard}
            onOpenProjects={() => setCurrentView('projects')}
            onOpenCompanion={openCompanion}
            userName={profile.display_name}
            userEmail={profile.email}
          />
        ) : (
          <Dashboard
            onOpenCompanion={openCompanion}
            onOpenProjects={() => setCurrentView('projects')}
            onOpenTemplates={openTemplates}
            onOpenProject={openProject}
            userName={profile.display_name}
            userEmail={profile.email}
            onEditProfile={openProfileEditor}
            onLogout={handleLogout}
          />
        )}

        {isProfileEditorOpen && (
          <div
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsProfileEditorOpen(false)
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
              aria-labelledby="profile-editor-title"
              style={{
                width: '100%',
                maxWidth: 430,
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
                    YOUR ACCOUNT
                  </span>
                  <h2
                    id="profile-editor-title"
                    style={{ margin: '7px 0 0', fontSize: 24 }}
                  >
                    Edit profile
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProfileEditorOpen(false)}
                  aria-label="Close profile editor"
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

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  marginBottom: 22,
                  padding: 14,
                  borderRadius: 15,
                  background: '#F5E8E3',
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '50%',
                    background: '#BD4C6C',
                    color: 'white',
                  }}
                >
                  <UserRound size={21} />
                </span>

                <div style={{ minWidth: 0 }}>
                  <strong>{profile.display_name}</strong>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 13,
                      color: '#857780',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {profile.email}
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <label
                  htmlFor="profile-display-name"
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Display name
                </label>

                <input
                  id="profile-display-name"
                  type="text"
                  value={profileName}
                  onChange={(event) => {
                  setPassword(event.target.value)
                  setMuseMood(showPassword ? 'innocent' : 'sneaking')
                   }}
                  maxLength={80}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '13px 14px',
                    border: '1px solid #EEDBD3',
                    borderRadius: 12,
                    background: '#FFFCFA',
                    color: '#40333E',
                    fontSize: 15,
                    outlineColor: '#BD4C6C',
                  }}
                />

                <p
                  style={{
                    margin: '8px 0 18px',
                    fontSize: 12,
                    color: '#857780',
                  }}
                >
                  Your name is saved to your account.
                </p>

                {profileNotice && (
                  <p
                    role="status"
                    style={{
                      marginBottom: 14,
                      fontSize: 13,
                      color: profileNotice.includes('updated')
                        ? '#287A52'
                        : '#BD4C6C',
                    }}
                  >
                    {profileNotice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 9,
                    padding: '13px 16px',
                    border: 0,
                    borderRadius: 12,
                    background: '#BD4C6C',
                    color: 'white',
                    fontWeight: 600,
                    cursor: isSavingProfile ? 'wait' : 'pointer',
                    opacity: isSavingProfile ? 0.7 : 1,
                  }}
                >
                  <Save size={17} />
                  {isSavingProfile ? 'Saving...' : 'Save changes'}
                </button>
              </form>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 12,
                  padding: 12,
                  border: '1px solid #EEDBD3',
                  borderRadius: 12,
                  background: 'transparent',
                  color: '#BD4C6C',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <LogOut size={17} />
                Log out
              </button>
            </section>
          </div>
        )}
      </>
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
          <span className="brand-name">Bibble</span>
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
            <BibbleMuse mood={museMood} />


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

         <div className="welcome-footer">
  <span className="welcome-footer-text">
    Made for the curious, the dreamers and the storytellers.
  </span>

  <LiveDateTime />
</div>
        </aside>

        <section className="form-panel">
          <div className="form-card">
            <div className="mobile-brand">
              <span className="brand-icon">
                <Feather size={20} />
              </span>
              <span className="brand-name">Bibble</span>
            </div>
            <MiniMuse />
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
                    maxLength={80}
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
  onFocus={() => setMuseMood('email')}
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
                    onFocus={() => {
                     setMuseMood(showPassword ? 'innocent' : 'sneaking')
                      }}
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
                    onClick={togglePasswordVisibility}
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
                  changeMode(isRegister ? 'login' : 'register')
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
