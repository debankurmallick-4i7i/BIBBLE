import {
  BookOpen,
  Feather,
  Music2,
  Clapperboard,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

import WorkspaceSidebar from '../components/WorkspaceSidebar'
import './Templates.css'

type Props = {
  onBackToDashboard: () => void
  onOpenProjects: () => void
  onOpenCompanion: (prompt?: string) => void
  userName: string
  userEmail: string
}

const templates = [
  {
    type: 'story',
    title: 'Short Story Blueprint',
    category: 'STORY',
    description:
      'Build a compelling story with a hook, characters, conflict and a satisfying ending.',
    icon: BookOpen,
    prompt:
      'Help me create a short story. Guide me through premise, characters, conflict, plot beats and ending. Ask me questions before drafting.',
  },
  {
    type: 'poem',
    title: 'Poetry Starter',
    category: 'POETRY',
    description:
      'Turn a feeling, image or memory into a poem with a clear emotional direction.',
    icon: Feather,
    prompt:
      'Help me develop a poem from an emotion or image. Explore tone, imagery, rhythm and possible forms with me.',
  },
  {
    type: 'song',
    title: 'Songwriting Canvas',
    category: 'SONG',
    description:
      'Shape a song idea into verses, chorus, bridge and a memorable central hook.',
    icon: Music2,
    prompt:
      'Help me write an original song. Start with theme, mood and point of view, then help structure verses, chorus and bridge.',
  },
  {
    type: 'screenplay',
    title: 'Screenplay Scene Builder',
    category: 'SCREENPLAY',
    description:
      'Develop a cinematic scene with setting, action, character intention and dialogue.',
    icon: Clapperboard,
    prompt:
      'Help me develop a screenplay. Begin with premise, genre, characters and scene objective, then help format scenes and dialogue.',
  },
]

export default function Templates({
  onBackToDashboard,
  onOpenProjects,
  onOpenCompanion,
  userName,
  userEmail,
}: Props) {
  return (
    <div className="bibble-shell">
      <WorkspaceSidebar
        active="templates"
        userName={userName}
        userEmail={userEmail}
        onDashboard={onBackToDashboard}
        onProjects={onOpenProjects}
        onTemplates={() => {}}
        onCompanion={() => onOpenCompanion()}
      />

      <main className="bibble-template-main">
        <header className="bibble-template-header">
          <div>
            <span className="bibble-template-eyebrow">
              A LITTLE STRUCTURE, A LOT OF IMAGINATION
            </span>

            <h1>Creative templates</h1>

            <p>
              Choose a starting point. Your ideas and your voice stay in charge.
            </p>
          </div>
        </header>

        <section className="bibble-template-grid">
          {templates.map((item) => {
            const Icon = item.icon

            return (
              <article
                className="bibble-template-card"
                key={item.type}
              >
                <span
                  className={`bibble-template-icon ${item.type}`}
                >
                  <Icon size={25} />
                </span>

                <span className="bibble-template-category">
                  {item.category}
                </span>

                <h2>{item.title}</h2>

                <p>{item.description}</p>

                <button
                  onClick={() => onOpenCompanion(item.prompt)}
                >
                  Use this template
                  <ArrowRight size={17} />
                </button>
              </article>
            )
          })}
        </section>

        <div className="bibble-template-note">
          <Sparkles size={18} />
          Templates are starting points. Bibble will help you shape them into something that feels like yours.
        </div>
      </main>
    </div>
  )
}