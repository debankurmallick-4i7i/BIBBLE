
import { useEffect, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import {
  ArrowLeft,
  FolderOpen,
  Plus,
  Trash2,
  RefreshCw,
  Pencil,
  BookOpen,
  Music2,
  Clapperboard,
  FileText,
  X,
} from "lucide-react";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/api";

import type { Project } from "../services/api";

import "./MyProjects.css";

interface MyProjectsProps {
  onBackToDashboard: () => void;
  onOpenProject?: (project: Project) => void;
}

const projectTypes = [
  { value: "story", label: "Story", icon: BookOpen },
  { value: "poem", label: "Poetry", icon: FileText },
  { value: "song", label: "Song", icon: Music2 },
  { value: "screenplay", label: "Screenplay", icon: Clapperboard },
  { value: "other", label: "Other", icon: FolderOpen },
];

function getProjectIcon(type: string) {
  const projectType = projectTypes.find(
    (item) => item.value === type?.toLowerCase()
  );

  return projectType?.icon || FolderOpen;
}

function formatDate(date?: string) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyProjects({
  onBackToDashboard,
  onOpenProject,
}: MyProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("story");

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("story");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadProjects() {
    try {
      setError("");
      setLoading(true);

      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load your projects."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function handleCreateProject(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Please enter a project title.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      await createProject({
        title: trimmedTitle,
        project_type: type,
        description: "",
      });

      setTitle("");
      setType("story");
      setShowCreateForm(false);

      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create your project."
      );
    } finally {
      setCreating(false);
    }
  }

  function openEditForm(project: Project) {
    setEditingProject(project);
    setEditTitle(project.title);
    setEditType(project.project_type);
    setEditDescription(project.description || "");
    setEditStatus(project.status || "active");

    setShowCreateForm(false);
    setError("");
  }

  async function handleUpdateProject(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingProject) return;

    const trimmedTitle = editTitle.trim();

    if (!trimmedTitle) {
      setError("Project title cannot be empty.");
      return;
    }

    try {
      setSavingEdit(true);
      setError("");

      const updatedProject = await updateProject(editingProject.id, {
        title: trimmedTitle,
        project_type: editType,
        description: editDescription,
        status: editStatus,
      });

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === editingProject.id
            ? updatedProject
            : project
        )
      );

      setEditingProject(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update your project."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(projectId);
      setError("");

      await deleteProject(projectId);

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== projectId
        )
      );

      if (editingProject?.id === projectId) {
        setEditingProject(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete your project."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function openProject(project: Project) {
    onOpenProject?.(project);
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLElement>,
    project: Project
  ) {
    if (
      event.target !== event.currentTarget ||
      !onOpenProject
    ) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProject(project);
    }
  }

  return (
    <div className="my-projects-page">
      <header className="projects-topbar">
        <button
          className="projects-back-button"
          onClick={onBackToDashboard}
          type="button"
        >
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </button>

        <div className="projects-brand">
          <span className="projects-brand-mark">b.</span>
          <span>BIBBLE</span>
        </div>

        <div className="projects-topbar-label">
          MY CREATIVE SPACE
        </div>
      </header>

      <main className="projects-main">
        <section className="projects-heading">
          <div>
            <p className="projects-eyebrow">
              YOUR CREATIVE WORLD ✦
            </p>

            <h1>My Projects</h1>

            <p className="projects-subtitle">
              Every idea deserves a place to grow. Pick up where
              you left off or start something new.
            </p>
          </div>

          <button
            className="projects-create-button"
            type="button"
            onClick={() => {
              setError("");
              setEditingProject(null);
              setShowCreateForm(true);
            }}
          >
            <Plus size={17} />
            Create project
          </button>
        </section>

        {error && (
          <div className="projects-error" role="alert">
            <span>{error}</span>

            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {showCreateForm && (
          <section className="project-create-panel">
            <div className="project-create-heading">
              <div>
                <h2>Start something wonderful.</h2>
                <p>
                  Give your new creative project a name and a direction.
                </p>
              </div>

              <button
                type="button"
                className="project-close-button"
                onClick={() => setShowCreateForm(false)}
                aria-label="Close create project form"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <label htmlFor="project-title">Project title</label>

              <input
                id="project-title"
                type="text"
                placeholder="e.g. The City of Forgotten Dreams"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
                required
              />

              <label htmlFor="project-type">Project type</label>

              <select
                id="project-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                {projectTypes.map((projectType) => (
                  <option
                    key={projectType.value}
                    value={projectType.value}
                  >
                    {projectType.label}
                  </option>
                ))}
              </select>

              <div className="project-form-actions">
                <button
                  type="button"
                  className="project-cancel-button"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="projects-create-button"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create project"}
                </button>
              </div>
            </form>
          </section>
        )}

        {editingProject && (
          <section className="project-create-panel">
            <div className="project-create-heading">
              <div>
                <h2>Edit your project.</h2>
                <p>
                  Make changes to your creative workspace.
                </p>
              </div>

              <button
                type="button"
                className="project-close-button"
                onClick={() => setEditingProject(null)}
                aria-label="Close edit form"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleUpdateProject}>
              <label htmlFor="edit-project-title">
                Project title
              </label>

              <input
                id="edit-project-title"
                type="text"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                maxLength={100}
                required
              />

              <label htmlFor="edit-project-type">
                Project type
              </label>

              <select
                id="edit-project-type"
                value={editType}
                onChange={(event) => setEditType(event.target.value)}
              >
                {projectTypes.map((projectType) => (
                  <option
                    key={projectType.value}
                    value={projectType.value}
                  >
                    {projectType.label}
                  </option>
                ))}
              </select>

              <label htmlFor="edit-project-description">
                Description
              </label>

              <textarea
                id="edit-project-description"
                value={editDescription}
                onChange={(event) =>
                  setEditDescription(event.target.value)
                }
                placeholder="What is this project about?"
                rows={4}
              />

              <label htmlFor="edit-project-status">
                Project status
              </label>

              <select
                id="edit-project-status"
                value={editStatus}
                onChange={(event) => setEditStatus(event.target.value)}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="completed">Completed</option>
              </select>

              <div className="project-form-actions">
                <button
                  type="button"
                  className="project-cancel-button"
                  onClick={() => setEditingProject(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="projects-create-button"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="projects-list-section">
          <div className="projects-list-heading">
            <div>
              <h2>Your workspace</h2>

              <p>
                {loading
                  ? "Loading your projects..."
                  : `${projects.length} ${
                      projects.length === 1
                        ? "project"
                        : "projects"
                    }`}
              </p>
            </div>

            <button
              type="button"
              className="projects-refresh-button"
              onClick={() => void loadProjects()}
              disabled={loading}
              aria-label="Refresh projects"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="projects-loading">
              <div className="projects-spinner" />
              <p>Gathering your creative projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="projects-empty-state">
              <div className="projects-empty-icon">
                <FolderOpen size={27} />
              </div>

              <h3>Your creative journey starts here.</h3>

              <p>
                You haven't created any projects yet. Give your
                first idea a home and let Bibble help you develop it.
              </p>

              <button
                type="button"
                className="projects-create-button"
                onClick={() => {
                  setError("");
                  setShowCreateForm(true);
                }}
              >
                <Plus size={17} />
                Create your first project
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => {
                const ProjectIcon = getProjectIcon(
                  project.project_type
                );

                return (
                  <article
                    className={`project-card ${
                      onOpenProject ? "project-card-clickable" : ""
                    }`}
                    key={project.id}
                    onClick={() => openProject(project)}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, project)
                    }
                    role={onOpenProject ? "button" : undefined}
                    tabIndex={onOpenProject ? 0 : undefined}
                    aria-label={
                      onOpenProject
                        ? `Open project ${project.title}`
                        : undefined
                    }
                  >
                    <div className="project-card-top">
                      <div className="project-card-icon">
                        <ProjectIcon size={21} />
                      </div>

                      <div className="project-card-actions">
                        <button
                          type="button"
                          className="project-delete-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditForm(project);
                          }}
                          aria-label={`Edit ${project.title}`}
                          title="Edit project"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="project-delete-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteProject(project.id);
                          }}
                          disabled={deletingId === project.id}
                          aria-label={`Delete ${project.title}`}
                          title="Delete project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="project-card-content">
                      <h3>{project.title}</h3>

                      <p className="project-card-type">
                        {project.project_type.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div className="project-card-footer">
                      <span className="project-status">
                        <span className="project-status-dot" />
                        {project.status || "active"}
                      </span>

                      <span className="project-date">
                        {formatDate(project.created_at)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
