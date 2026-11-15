
const API_BASE_URL = "http://localhost:8000";

// Common API response structure
interface ApiResponse {
  status: string;
  message: string;
  user_id?: string | null;
  access_token?: string;
  refresh_token?: string;
}

// Project structure returned by the backend
export interface Project {
  id: string;
  user_id?: string;
  title: string;
  project_type: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectData {
  title: string;
  project_type: string;
  description?: string;
}

export interface UpdateProjectData {
  title?: string;
  project_type?: string;
  description?: string;
  status?: string;
}
interface ProjectsResponse {
  status: string;
  total_projects: number;
  projects: Project[];
}

interface SingleProjectResponse {
  status: string;
  message?: string;
  project: Project;
}

// Convert backend errors into readable messages
function getErrorMessage(data: any): string {
  const detail = data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;

        const location = Array.isArray(item.loc)
          ? item.loc.join(" → ")
          : "";

        return location
          ? `${location}: ${item.msg || "Invalid value"}`
          : item.msg || JSON.stringify(item);
      })
      .join("; ");
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  return "Something went wrong. Please try again.";
}

// Common API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("bibble_access_token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const responseText = await response.text();
  let data: any = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { detail: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data as T;
}

// Register a new user
export async function registerUser(
  email: string,
  password: string
): Promise<ApiResponse> {
  return apiRequest<ApiResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Login an existing user
export async function loginUser(
  email: string,
  password: string
): Promise<ApiResponse> {
  return apiRequest<ApiResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Fetch all projects belonging to the logged-in user
export async function getProjects(): Promise<Project[]> {
  const response = await apiRequest<ProjectsResponse>("/api/projects");
  return response.projects;
}

// Create a new project
export async function createProject(
  project: CreateProjectData
): Promise<Project> {
  const response = await apiRequest<SingleProjectResponse>("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      title: project.title,
      project_type: project.project_type,
      description: project.description || "",
    }),
  });

  return response.project;
}

// Fetch one project by ID
export async function getProject(
  projectId: string
): Promise<Project> {
  const response = await apiRequest<SingleProjectResponse>(
    `/api/projects/${projectId}`
  );

  return response.project;
}

// Update a project
export async function updateProject(
  projectId: string,
  updates: UpdateProjectData
): Promise<Project> {
  const response = await apiRequest<SingleProjectResponse>(
    `/api/projects/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );

  return response.project;
}

// Delete a project
export async function deleteProject(
  projectId: string
): Promise<void> {
  await apiRequest<void>(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}
