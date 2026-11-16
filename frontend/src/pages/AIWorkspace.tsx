
import { useEffect, useRef, useState } from "react";
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
  Save,
  Clock3,
  FilePlus2,
  BookMarked,
} from "lucide-react";

import type {
  Project,
  Conversation,
  ChatMessage as SavedChatMessage,
  CreativeDocument,
  DocumentType,
} from "../services/api";

import {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  generateAIResponse,
  getDocuments,
  createDocument,
  updateDocument,
} from "../services/api";

import "./AIWorkspace.css";

interface AIWorkspaceProps {
  onBackToDashboard?: () => void;
  onBackToProjects?: () => void;
  onOpenProjects?: () => void;
  onOpenTemplates?: () => void;
  initialPrompt?: string;
  project?: Project | null;
  userName?: string;
  userEmail?: string;
}

type WorkspaceMode = "chat" | "writing";

type SaveStatus = "saved" | "saving" | "error" | "unsaved";

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

const documentTypes: {
  label: string;
  value: DocumentType;
}[] = [
  { label: "Story", value: "story" },
  { label: "Poem", value: "poem" },
  { label: "Song", value: "song" },
  { label: "Screenplay", value: "screenplay" },
  { label: "Notes", value: "notes" },
  { label: "Other", value: "other" },
];

function getDocumentType(projectType?: string): DocumentType {
  const value = (projectType || "").toLowerCase();

  if (value.includes("poem")) return "poem";
  if (value.includes("song") || value.includes("music")) return "song";
  if (value.includes("screen")) return "screenplay";
  if (value.includes("story")) return "story";

  return "other";
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export default function AIWorkspace({
  onBackToDashboard,
  onBackToProjects,
  onOpenProjects,
  onOpenTemplates,
  initialPrompt = "",
  project = null,
    userName = "Creator",
  userEmail = "",
}: AIWorkspaceProps) {
  const [prompt, setPrompt] = useState(initialPrompt);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const [mode, setMode] = useState<WorkspaceMode>("chat");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<SavedChatMessage[]>([]);

  const [streamingText, setStreamingText] = useState("");
const [generationStatus, setGenerationStatus] = useState<
  "thinking" | "creating" | null
>(null);

  const [isLoadingConversations, setIsLoadingConversations] =
    useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [documents, setDocuments] = useState<CreativeDocument[]>([]);
  const [activeDocument, setActiveDocument] =
    useState<CreativeDocument | null>(null);

  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");

  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState("");

  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const editVersionRef = useRef(0);
  const activeDocumentIdRef = useRef<string | null>(null);

  const isProjectWorkspace = Boolean(project);

  // Keep the active document identity available to asynchronous saves.
  useEffect(() => {
    activeDocumentIdRef.current = activeDocument?.id ?? null;
  }, [activeDocument?.id]);

  // Load conversations.
  useEffect(() => {
    let isMounted = true;

    async function loadConversations() {
      setIsLoadingConversations(true);

      try {
        const result = await getConversations(project?.id ?? null);

        if (isMounted) {
          setConversations(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load conversations."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingConversations(false);
        }
      }
    }

    loadConversations();

    return () => {
      isMounted = false;
    };
  }, [project?.id]);

  // Load saved creative documents.
  useEffect(() => {
    let isMounted = true;

    async function loadDocuments() {
      setIsLoadingDocuments(true);

      try {
        const result = await getDocuments(project?.id ?? null);

        if (isMounted) {
          setDocuments(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your documents."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingDocuments(false);
        }
      }
    }

    loadDocuments();

    return () => {
      isMounted = false;
    };
  }, [project?.id]);

  const handleBack = () => {
    if (isProjectWorkspace && onBackToProjects) {
      onBackToProjects();
    } else {
      onBackToDashboard?.();
    }
  };

  // Open a saved conversation.
  const handleOpenConversation = async (
    conversation: Conversation
  ) => {
    if (isSending) return;

    setMode("chat");
    setActiveConversation(conversation);
    setMessages([]);
    setPrompt("");
    setError("");
    setMobileMenuOpen(false);
    setIsLoadingMessages(true);

    try {
      const savedMessages = await getMessages(conversation.id);
      setMessages(savedMessages);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this conversation."
      );
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewConversation = () => {
    if (isSending) return;

    setMode("chat");
    setActiveConversation(null);
    setMessages([]);
    setPrompt("");
    setError("");
    setMobileMenuOpen(false);
  };

  // Save a chat message.
// Save the user message and generate an AI response.

const handleSend = async () => {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt || isSending) return;

  setIsSending(true);
  setError("");
  setStreamingText("");
  setGenerationStatus(null);

  let assistantMessageStarted = false;

  try {
    let conversation = activeConversation;

    if (!conversation) {
      conversation = await createConversation({
        title: trimmedPrompt.slice(0, 60),
        project_id: project?.id ?? null,
        language: "auto",
        mood: null,
      });

      setActiveConversation(conversation);

      setConversations((current) => [
        conversation!,
        ...current.filter((item) => item.id !== conversation!.id),
      ]);
    }

    const savedMessage = await sendMessage(conversation.id, {
      role: "user",
      content: trimmedPrompt,
      metadata: {},
    });

    setMessages((current) => [...current, savedMessage]);
    setPrompt("");

    setGenerationStatus("thinking");

    const completedMessage = await generateAIResponse(
      conversation.id,
      trimmedPrompt,
      "chat",
      (chunk) => {
        assistantMessageStarted = true;
        setGenerationStatus("creating");
        setStreamingText((current) => current + chunk);
      }
    );

    setMessages((current) => [...current, completedMessage]);
    setStreamingText("");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to generate an AI response."
    );

    if (assistantMessageStarted) {
      setError(
        "The response was interrupted. Please check your conversation before retrying."
      );
    }
  } finally {
    setStreamingText("");
    setGenerationStatus(null);
    setIsSending(false);
  }
};


  // Create a real document in the database.
  const handleCreateDocument = async () => {
    if (isCreatingDocument) return;

    setIsCreatingDocument(true);
    setError("");

    try {
      const newDocument = await createDocument({
        title: "Untitled document",
        content: "",
        document_type: getDocumentType(project?.project_type),
        project_id: project?.id ?? null,
      });

      setDocuments((current) => [newDocument, ...current]);

      setActiveDocument(newDocument);
      setDocumentTitle(newDocument.title);
      setDocumentContent(newDocument.content);
      setSaveStatus("saved");
      editVersionRef.current += 1;

      setMode("writing");
      setMobileMenuOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your document."
      );
    } finally {
      setIsCreatingDocument(false);
    }
  };

  // Open an existing document.
  const handleOpenDocument = (document: CreativeDocument) => {
    setActiveDocument(document);
    setDocumentTitle(document.title);
    setDocumentContent(document.content);
    setSaveStatus("saved");
    setError("");
    editVersionRef.current += 1;
    setMode("writing");
    setMobileMenuOpen(false);
  };

  // Auto-save title and content after the user pauses typing.
  useEffect(() => {
    if (!activeDocument) return;

    const documentId = activeDocument.id;
    const version = editVersionRef.current;

    if (
      documentTitle === activeDocument.title &&
      documentContent === activeDocument.content
    ) {
      return;
    }

    setSaveStatus("unsaved");

    const timer = window.setTimeout(() => {
      setSaveStatus("saving");

      const saveOperation = async () => {
        try {
          const updated = await updateDocument(documentId, {
            title: documentTitle.trim() || "Untitled document",
            content: documentContent,
          });

          // Never let an old save overwrite a newer edit or document.
          if (
            activeDocumentIdRef.current === documentId &&
            editVersionRef.current === version
          ) {
            setActiveDocument(updated);
            setDocumentTitle(updated.title);
            setDocuments((current) =>
              current.map((item) =>
                item.id === updated.id ? updated : item
              )
            );
            setSaveStatus("saved");
          }
        } catch {
          if (
            activeDocumentIdRef.current === documentId &&
            editVersionRef.current === version
          ) {
            setSaveStatus("error");
          }
        }
      };

      saveQueueRef.current = saveQueueRef.current.then(
        saveOperation,
        saveOperation
      );
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeDocument, documentTitle, documentContent]);

  const handleTitleChange = (value: string) => {
    editVersionRef.current += 1;
    setDocumentTitle(value);
  };

  const handleContentChange = (value: string) => {
    editVersionRef.current += 1;
    setDocumentContent(value);
  };

  const handleToolClick = (toolName: string) => {
    setPrompt((current) =>
      current
        ? `${toolName}: ${current}`
        : `${toolName} the selected writing.`
    );

    setMode("chat");
    setShowTools(false);
  };

  const documentCountLabel = isLoadingDocuments
    ? "Loading..."
    : `${documents.length} document${documents.length === 1 ? "" : "s"}`;

  const saveLabel = {
    saved: "All changes saved",
    saving: "Saving changes...",
    error: "Save failed — your edits are still here",
    unsaved: "Unsaved changes",
  }[saveStatus];

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
            <Sparkles size={22} />
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

        <button
          className="workspace-new-chat"
          onClick={handleCreateDocument}
          disabled={isCreatingDocument}
          style={{ marginTop: 8, background: "#F3E6ED", color: "#99415F" }}
        >
          <FilePlus2 size={17} />
          <span>
            {isCreatingDocument ? "Creating..." : "New document"}
          </span>
        </button>

        <div className="workspace-nav-label">MENU</div>

        <nav className="workspace-nav">
          <button onClick={handleBack}>
            <ArrowLeft size={18} />
            <span>
              {isProjectWorkspace ? "My Projects" : "Dashboard"}
            </span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (isProjectWorkspace) {
                onBackToProjects?.();
              } else {
                onOpenProjects?.();
              }
            }}
          >
            <Folder size={18} />
            <span>My Projects</span>
          </button>

          <button
            className={mode === "chat" ? "workspace-nav-active" : ""}
            onClick={() => setMode("chat")}
          >
            <Sparkles size={18} />
            <span>AI Companion</span>
          </button>

          <button
            className={mode === "writing" ? "workspace-nav-active" : ""}
            onClick={() => setMode("writing")}
          >
            <PenLine size={18} />
            <span>Writing Studio</span>
          </button>
                    <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenTemplates?.();
            }}
          >
            <FileText size={18} />
            <span>Templates</span>
          </button>

        </nav>

        <div className="workspace-recent-heading">
          <span>MY DOCUMENTS</span>
          <span style={{ fontSize: 11 }}>{documents.length}</span>
        </div>

        <div className="workspace-recent-list">
          {isLoadingDocuments ? (
            <div className="workspace-no-chats">
              <FileText size={17} />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="workspace-no-chats">
              <FileText size={17} />
              <span>No documents yet</span>
            </div>
          ) : (
            documents.map((document) => (
              <button
                key={document.id}
                className={`workspace-no-chats ${
                  activeDocument?.id === document.id && mode === "writing"
                    ? "workspace-nav-active"
                    : ""
                }`}
                onClick={() => handleOpenDocument(document)}
                title={document.title}
              >
                <FileText size={17} />
                <span>{document.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="workspace-recent-heading">
          <span>RECENT CHATS</span>
          <MoreHorizontal size={17} />
        </div>

        <div className="workspace-recent-list">
          {isLoadingConversations ? (
            <div className="workspace-no-chats">
              <MessageCircle size={17} />
              <span>Loading conversations...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="workspace-no-chats">
              <MessageCircle size={17} />
              <span>No conversations yet</span>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                className={`workspace-no-chats ${
                  activeConversation?.id === conversation.id && mode === "chat"
                    ? "workspace-nav-active"
                    : ""
                }`}
                key={conversation.id}
                onClick={() => handleOpenConversation(conversation)}
                title={conversation.title}
                disabled={isSending}
              >
                <MessageCircle size={17} />
                <span>{conversation.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="workspace-sidebar-bottom">
          <button>
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <div className="workspace-profile">
 <div className="workspace-avatar">
  {userName.trim().charAt(0).toUpperCase()}
</div>

<div className="workspace-profile-info">
  <strong>{userName}</strong>
  <span>{userEmail || "Bibble workspace"}</span>
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
                {mode === "writing"
                  ? "Writing Studio"
                  : project?.title || "AI Companion"}
              </strong>
            </div>
          </div>

          <div className="workspace-topbar-actions">
            <button aria-label="Search">
              <Search size={19} />
            </button>

            <button
              aria-label="New document"
              onClick={handleCreateDocument}
              disabled={isCreatingDocument}
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        {mode === "writing" ? (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: 0,
              padding: "26px clamp(16px, 4vw, 48px)",
              background: "#FFFCFA",
              overflowY: "auto",
            }}
          >
            {!activeDocument ? (
              <div
                style={{
                  margin: "auto",
                  textAlign: "center",
                  maxWidth: 430,
                  padding: 24,
                }}
              >
                <div className="workspace-empty-icon">
                  <BookMarked size={27} />
                </div>

                <h2>Your Writing Studio</h2>

                <p>
                  A quiet space for your stories, poems, songs and
                  unfinished ideas.
                </p>

                <button
                  className="workspace-new-chat"
                  style={{
                    display: "inline-flex",
                    marginTop: 20,
                    width: "auto",
                    padding: "12px 20px",
                  }}
                  onClick={handleCreateDocument}
                  disabled={isCreatingDocument}
                >
                  <Plus size={17} />
                  {isCreatingDocument ? "Creating..." : "Create document"}
                </button>

                <p style={{ fontSize: 12, color: "#857780", marginTop: 18 }}>
                  {documentCountLabel}
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 28,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#BD4C6C",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        marginBottom: 7,
                      }}
                    >
                      WRITING STUDIO
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#857780",
                        fontSize: 12,
                      }}
                    >
                      <Clock3 size={14} />
                      Last updated {formatDate(activeDocument.updated_at)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      color:
                        saveStatus === "error"
                          ? "#B33C50"
                          : saveStatus === "saved"
                            ? "#54836B"
                            : "#857780",
                    }}
                    role="status"
                    aria-live="polite"
                  >
                    {saveStatus === "saved" ? (
                      <Save size={15} />
                    ) : (
                      <Clock3 size={15} />
                    )}
                    {saveLabel}
                  </div>
                </div>

                <input
                  value={documentTitle}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="Untitled document"
                  aria-label="Document title"
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#40333E",
                    fontFamily: "inherit",
                    fontSize: "clamp(25px, 4vw, 36px)",
                    fontWeight: 700,
                    padding: "8px 0 18px",
                    borderBottom: "1px solid #EEDBD3",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    padding: "15px 0",
                    borderBottom: "1px solid #EEDBD3",
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      color: "#857780",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FileText size={15} />
                    Document type

                    <select
                      value={activeDocument.document_type}
                      onChange={(event) => {
                        const value = event.target.value as DocumentType;

                        editVersionRef.current += 1;

                        setActiveDocument((current) =>
                          current
                            ? { ...current, document_type: value }
                            : current
                        );

                        setDocuments((current) =>
                          current.map((item) =>
                            item.id === activeDocument.id
                              ? { ...item, document_type: value }
                              : item
                          )
                        );

                        updateDocument(activeDocument.id, {
                          document_type: value,
                        }).catch(() => setSaveStatus("error"));
                      }}
                      style={{
                        border: "1px solid #EEDBD3",
                        background: "#FFFCFA",
                        borderRadius: 8,
                        padding: "7px 10px",
                        color: "#40333E",
                      }}
                    >
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <span
                    style={{
                      fontSize: 11,
                      color: "#A0929A",
                    }}
                  >
                    Your document is private to your account.
                  </span>
                </div>

                <textarea
                  value={documentContent}
                  onChange={(event) =>
                    handleContentChange(event.target.value)
                  }
                  placeholder="Every great piece of writing begins somewhere...

Start writing here. Don't worry about making it perfect. Let the ideas flow."
                  aria-label="Document content"
                  spellCheck
                  style={{
                    flex: 1,
                    width: "100%",
                    minHeight: 420,
                    resize: "vertical",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#40333E",
                    fontFamily:
                      "'Noto Serif Bengali', Georgia, serif",
                    fontSize: 16,
                    lineHeight: 1.95,
                    padding: "28px 2px",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    paddingTop: 12,
                    borderTop: "1px solid #EEDBD3",
                    color: "#A0929A",
                    fontSize: 11,
                  }}
                >
                  <span>
                    {documentContent.trim()
                      ? documentContent.trim().split(/\s+/).length
                      : 0}{" "}
                    words
                  </span>

                  <span>Changes save automatically</span>
                </div>
              </>
            )}
          </section>
        ) : (
          <div className="workspace-conversation">
            {project && (
              <div className="project-workspace-context">
                <div>
                  <span className="project-context-type">
                    {project.project_type}
                  </span>

                  <h2>{project.title}</h2>

                  {project.description && <p>{project.description}</p>}
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
  {isLoadingMessages ? (
    <div className="workspace-empty-state">
      <div className="workspace-empty-icon">
        <Sparkles size={27} />
      </div>
      <h2>Opening your conversation...</h2>
      <p>Retrieving your saved messages.</p>
    </div>
  ) : messages.length === 0 && !streamingText && !generationStatus ? (
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
    <>
      {messages.map((message) => (
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
      ))}

      {generationStatus && (
        <div
          className="workspace-message workspace-message-assistant"
          role="status"
          aria-live="polite"
        >
          <div className="workspace-message-avatar">
            <Sparkles size={16} />
          </div>

          <div className="workspace-message-content">
            <div className="workspace-generation-indicator">
              <span className="workspace-generation-text">
                {generationStatus === "thinking"
                  ? "Bibble is thinking"
                  : "Bibble is creating"}
              </span>

              <span
                className="workspace-generation-dots"
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        </div>
      )}

      {streamingText && (
        <div className="workspace-message workspace-message-assistant">
          <div className="workspace-message-avatar">
            <Sparkles size={16} />
          </div>

          <div className="workspace-message-content">
            <div className="workspace-message-author">
              Bibble AI
            </div>

            <p>{streamingText}</p>
          </div>
        </div>
      )}
    </>
  )}
</div>



            <div className="workspace-composer-area">
              {error && (
                <div
                  role="alert"
                  style={{
                    marginBottom: 10,
                    padding: "10px 13px",
                    borderRadius: 10,
                    color: "#a83d5d",
                    background: "#f9e7e8",
                    fontSize: 12,
                  }}
                >
                  {error}
                </div>
              )}

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
                  disabled={isSending || isLoadingMessages}
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
                    <span>
                      {isSending
                        ? "Saving your message..."
                        : "Let your imagination lead"}
                    </span>
                  </div>

                  <button
                    className="workspace-send-button"
                    onClick={handleSend}
                    disabled={
                      !prompt.trim() || isSending || isLoadingMessages
                    }
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
        )}
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
          <h3>
            {mode === "writing" ? "Document information" : "Project information"}
          </h3>
          <MoreHorizontal size={18} />
        </div>

        {mode === "writing" && activeDocument ? (
          <div className="workspace-project-details">
            <div className="workspace-project-icon">
              <FileText size={19} />
            </div>

            <strong>{documentTitle || "Untitled document"}</strong>

            <span className="project-context-type">
              {activeDocument.document_type}
            </span>

            <p>
              {documentContent.trim()
                ? `${documentContent.trim().split(/\s+/).length} words written`
                : "Your document is ready for your ideas."}
            </p>

            <div className="project-detail-status">
              {saveLabel}
            </div>
          </div>
        ) : project ? (
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

        <div className="workspace-panel-divider" />

        <div className="workspace-panel-tip">
          <Sparkles size={17} />

          <strong>A little inspiration</strong>

          <p>
            Don't worry about getting every word right. The best ideas
            often begin as imperfect thoughts.
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
