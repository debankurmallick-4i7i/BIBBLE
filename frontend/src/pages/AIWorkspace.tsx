
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  ChevronDown,
  FileText,
  Folder,
  Languages,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Settings,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import type { Project } from "../services/api";
import "./AIWorkspace.css";

interface AIWorkspaceProps {
  onBackToDashboard?: () => void;
  onBackToProjects?: () => void;
  initialPrompt?: string;
  project?: Project | null;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const tools = [
  {
    name: "Refine writing",
    description: "Improve clarity and flow",
    icon: WandSparkles,
  },
  {
    name: "Rewrite",
    description: "Explore another expression",
    icon: PenLine,
  },
  {
    name: "Translate",
    description: "Move between languages",
    icon: Languages,
  },
  {
    name: "Explain metaphors",
    description: "Discover deeper meanings",
    icon: BookOpen,
  },
];

export default function AIWorkspace({
  onBackToDashboard,
  onBackToProjects,
  initialPrompt = "",
  project = null,
}: AIWorkspaceProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const isProjectWorkspace = Boolean(project);

  const handleBack = () => {
    if (isProjectWorkspace && onBackToProjects) {
      onBackToProjects();
    } else {
      onBackToDashboard?.();
    }
  };

  const handleSend = () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        role: "user",
        content: trimmedPrompt,
      },
    ]);

    setPrompt("");
  };

  const handleNewConversation = () => {
    setMessages([]);
    setPrompt("");
    setMobileMenuOpen(false);
  };

  const handleToolClick = (toolName: string) => {
    setPrompt((current) =>
      current
        ? `${toolName}: ${current}`
        : `${toolName} the selected writing.`
    );

    setShowTools(false);
  };

  return (
    <div className="workspace-page">
      {mobileMenuOpen && (
        <div
          className="workspace-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`workspace-sidebar ${
          mobileMenuOpen ? "workspace-sidebar-open" : ""
        }`}
      >
        <div className="workspace-brand">
          <div className="workspace-brand-icon">
            <FeatherIcon />
          </div>

          <span>bibble</span>

          <button
            className="workspace-close-menu"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <button
          className="workspace-new-chat"
          onClick={handleNewConversation}
        >
          <Plus size={17} />
          <span>New conversation</span>
        </button>

        <div className="workspace-nav-label">MENU</div>

        <nav className="workspace-nav">
          <button onClick={handleBack}>
            <ArrowLeft size={18} />
            <span>
              {isProjectWorkspace ? "My Projects" : "Dashboard"}
            </span>
          </button>

          {!isProjectWorkspace && (
            <button>
              <Folder size={18} />
              <span>My Projects</span>
            </button>
          )}

          <button className="workspace-nav-active">
            <Sparkles size={18} />
            <span>AI Companion</span>
          </button>

          <button>
            <FileText size={18} />
            <span>Templates</span>
          </button>
        </nav>

        <div className="workspace-recent-heading">
          <span>RECENT CHATS</span>
          <MoreHorizontal size={17} />
        </div>

        <div className="workspace-recent-list">
          {messages.length === 0 ? (
            <div className="workspace-no-chats">
              <MessageCircle size={17} />
              <span>No conversations yet</span>
            </div>
          ) : (
            messages
              .filter((message) => message.role === "user")
              .slice(-5)
              .reverse()
              .map((message) => (
                <div className="workspace-no-chats" key={message.id}>
                  <MessageCircle size={17} />
                  <span>{message.content}</span>
                </div>
              ))
          )}
        </div>

        <div className="workspace-sidebar-bottom">
          <button>
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <div className="workspace-profile">
            <div className="workspace-avatar">C</div>

            <div className="workspace-profile-info">
              <strong>Creator</strong>
              <span>Free plan</span>
            </div>

            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar-left">
            <button
              className="workspace-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>

            <div className="workspace-breadcrumb">
              <span>Workspace</span>
              <span className="workspace-breadcrumb-divider">/</span>

              <strong>
                {project ? project.title : "AI Companion"}
              </strong>
            </div>
          </div>

          <div className="workspace-topbar-actions">
            <button aria-label="Search">
              <Search size={19} />
            </button>

            <button
              aria-label="New conversation"
              onClick={handleNewConversation}
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        <div className="workspace-conversation">
          {project && (
            <div className="project-workspace-context">
              <div>
                <span className="project-context-type">
                  {project.project_type}
                </span>

                <h2>{project.title}</h2>

                {project.description && (
                  <p>{project.description}</p>
                )}
              </div>

              <span className="project-detail-status">
                {project.status || "Active"}
              </span>
            </div>
          )}

          <div className="workspace-conversation-heading">
            <div className="workspace-ai-avatar">
              <Sparkles size={21} />
            </div>

            <div>
              <h2>Bibble AI</h2>
              <p>
                {project
                  ? `Your creative companion for ${project.title}`
                  : "Your creative companion"}
              </p>
            </div>

            <span className="workspace-model-status">
              <span />
              Ready to create
            </span>
          </div>

          <div className="workspace-message-list">
            {messages.length === 0 ? (
              <div className="workspace-empty-state">
                <div className="workspace-empty-icon">
                  <Sparkles size={27} />
                </div>

                <h2>
                  {project
                    ? "Let's bring this project to life."
                    : "Every idea has a beginning."}
                </h2>

                <p>
                  {project
                    ? "Develop your ideas, explore new directions, and build your project one thought at a time."
                    : "Share a thought, a feeling, or a half-written idea. Let's create something together."}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  className={`workspace-message workspace-message-${message.role}`}
                  key={message.id}
                >
                  {message.role === "assistant" && (
                    <div className="workspace-message-avatar">
                      <Sparkles size={16} />
                    </div>
                  )}

                  <div className="workspace-message-content">
                    {message.role === "assistant" && (
                      <div className="workspace-message-author">
                        Bibble AI
                      </div>
                    )}

                    <p>{message.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="workspace-composer-area">
            <div className="workspace-composer">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={
                  project
                    ? `Continue working on ${project.title}...`
                    : "Tell Bibble what's on your mind..."
                }
                rows={2}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />

              <div className="workspace-composer-footer">
                <div className="workspace-composer-hint">
                  <Sparkles size={14} />
                  <span>Let your imagination lead</span>
                </div>

                <button
                  className="workspace-send-button"
                  onClick={handleSend}
                  disabled={!prompt.trim()}
                  aria-label="Send message"
                >
                  <ArrowUp size={19} />
                </button>
              </div>
            </div>

            <p className="workspace-disclaimer">
              Your creativity comes first.
            </p>
          </div>
        </div>
      </main>

      <aside className="workspace-right-panel">
        <div className="workspace-right-heading">
          <h3>Creative tools</h3>

          <button
            onClick={() => setShowTools((current) => !current)}
            aria-label="Toggle creative tools"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        <div className="workspace-tool-list">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button
                className="workspace-tool"
                key={tool.name}
                onClick={() => handleToolClick(tool.name)}
              >
                <div className="workspace-tool-icon">
                  <Icon size={18} />
                </div>

                <div>
                  <strong>{tool.name}</strong>
                  <span>{tool.description}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="workspace-panel-divider" />

        <div className="workspace-project-heading">
          <h3>Project information</h3>
          <MoreHorizontal size={18} />
        </div>

        {project ? (
          <div className="workspace-project-details">
            <div className="workspace-project-icon">
              <BookOpen size={19} />
            </div>

            <strong>{project.title}</strong>

            <span className="project-context-type">
              {project.project_type}
            </span>

            <p>
              {project.description ||
                "No project description has been added yet."}
            </p>

            <div className="project-detail-status">
              Status: {project.status || "Active"}
            </div>
          </div>
        ) : (
          <div className="workspace-no-project">
            <div className="workspace-project-icon">
              <BookOpen size={19} />
            </div>

            <strong>No project selected</strong>

            <p>
              Start a creative project to see its details here.
            </p>
          </div>
        )}

        <div className="workspace-panel-tip">
          <Sparkles size={17} />

          <strong>A little inspiration</strong>

          <p>
            Don't worry about getting every word right. The best ideas often
            begin as imperfect thoughts.
          </p>
        </div>
      </aside>

      <div className="workspace-mobile-tools">
        <button onClick={() => setShowTools((current) => !current)}>
          <WandSparkles size={17} />
          Creative tools
          <ChevronDown size={15} />
        </button>

        {showTools && (
          <div className="workspace-mobile-tool-menu">
            {tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleToolClick(tool.name)}
              >
                {tool.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeatherIcon() {
  return <Sparkles size={22} />;
}
