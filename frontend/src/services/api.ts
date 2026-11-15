
const API_BASE_URL = "http://localhost:8000";

// ==============================
// COMMON RESPONSE TYPES
// ==============================

interface ApiResponse {
  status: string;
  message: string;
  user_id?: string | null;
}

export interface AuthResponse extends ApiResponse {
  access_token?: string;
  refresh_token?: string;
  display_name?: string | null;
}

export interface UserProfile {
  status: string;
  user_id: string;
  email: string;
  display_name: string;
}

// ==============================
// PROJECT TYPES
// ==============================

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

// ==============================
// CONVERSATION TYPES
// ==============================

export interface Conversation {
  id: string;
  user_id?: string;
  project_id: string | null;
  title: string;
  language: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationData {
  title?: string;
  project_id?: string | null;
  language?: string;
  mood?: string | null;
}

interface ConversationsResponse {
  status: string;
  total_conversations: number;
  conversations: Conversation[];
}

interface SingleConversationResponse {
  status: string;
  message?: string;
  conversation: Conversation;
}

// ==============================
// MESSAGE TYPES
// ==============================

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id?: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateMessageData {
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}

interface MessagesResponse {
  status: string;
  total_messages: number;
  messages: ChatMessage[];
}

interface SingleMessageResponse {
  status: string;
  message?: string;
  saved_message: ChatMessage;
  conversation_id: string;
}

// ==============================
// CREATIVE DOCUMENT TYPES
// ==============================

export type DocumentType =
  | "story"
  | "poem"
  | "song"
  | "screenplay"
  | "notes"
  | "other";

export interface CreativeDocument {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  content: string;
  document_type: DocumentType;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentData {
  title?: string;
  content?: string;
  document_type?: DocumentType;
  project_id?: string | null;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
  document_type?: DocumentType;
  project_id?: string | null;
}

interface DocumentsResponse {
  status: string;
  total_documents: number;
  documents: CreativeDocument[];
}

interface SingleDocumentResponse {
  status: string;
  message?: string;
  document: CreativeDocument;
}

// ==============================
// ERROR HANDLING
// ==============================

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

// ==============================
// COMMON API REQUEST HANDLER
// ==============================

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

// ==============================
// AUTHENTICATION
// ==============================

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: name.trim(),
      email,
      password,
    }),
  });
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMyProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>("/api/auth/me");
}

export async function updateMyProfile(
  displayName: string
): Promise<UserProfile> {
  return apiRequest<UserProfile>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify({
      display_name: displayName.trim(),
    }),
  });
}

// ==============================
// PROJECT MANAGEMENT
// ==============================

export async function getProjects(): Promise<Project[]> {
  const response = await apiRequest<ProjectsResponse>("/api/projects");
  return response.projects;
}

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

export async function getProject(
  projectId: string
): Promise<Project> {
  const response = await apiRequest<SingleProjectResponse>(
    `/api/projects/${projectId}`
  );

  return response.project;
}

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

export async function deleteProject(
  projectId: string
): Promise<void> {
  await apiRequest<void>(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}

// ==============================
// CONVERSATION MANAGEMENT
// ==============================

export async function createConversation(
  conversation: CreateConversationData = {}
): Promise<Conversation> {
  const response = await apiRequest<SingleConversationResponse>(
    "/api/conversations",
    {
      method: "POST",
      body: JSON.stringify({
        title: conversation.title || "New conversation",
        project_id: conversation.project_id ?? null,
        language: conversation.language || "auto",
        mood: conversation.mood ?? null,
      }),
    }
  );

  return response.conversation;
}

export async function getConversations(
  projectId?: string | null
): Promise<Conversation[]> {
  const query = projectId
    ? `?project_id=${encodeURIComponent(projectId)}`
    : "";

  const response = await apiRequest<ConversationsResponse>(
    `/api/conversations${query}`
  );

  return response.conversations;
}

export async function getConversation(
  conversationId: string
): Promise<Conversation> {
  const response = await apiRequest<SingleConversationResponse>(
    `/api/conversations/${conversationId}`
  );

  return response.conversation;
}

// ==============================
// MESSAGE MANAGEMENT
// ==============================

export async function getMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  const response = await apiRequest<MessagesResponse>(
    `/api/conversations/${conversationId}/messages`
  );

  return response.messages;
}

export async function sendMessage(
  conversationId: string,
  message: CreateMessageData
): Promise<ChatMessage> {
  const response = await apiRequest<SingleMessageResponse>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
      }),
    }
  );

  return response.saved_message;
}



// ==============================
// AI RESPONSE GENERATION
// ==============================

export async function generateAIResponse(
  conversationId: string,
  prompt: string,
  action: string = "chat",
  onDelta: (text: string) => void
): Promise<ChatMessage> {
  const token = localStorage.getItem("bibble_access_token");

  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationId}/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ prompt, action }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: any = {};

    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { detail: errorText };
    }

    throw new Error(getErrorMessage(errorData));
  }

  if (!response.body) {
    throw new Error("The server did not provide a response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let savedMessage: ChatMessage | null = null;

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const dataLine = event
          .split("\n")
          .find((line) => line.startsWith("data: "));

        if (!dataLine) continue;

        const eventData = JSON.parse(dataLine.slice(6));

        if (eventData.type === "delta") {
          onDelta(eventData.text);
        }

        if (eventData.type === "complete") {
          savedMessage = eventData.saved_message;
        }

        if (eventData.type === "error") {
          throw new Error(eventData.message);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!savedMessage) {
    throw new Error("The AI response ended before it was saved.");
  }

  return savedMessage;
}



// ==============================
// CREATIVE DOCUMENT MANAGEMENT
// ==============================

// Fetch all documents, optionally filtered by project.
export async function getDocuments(
  projectId?: string | null
): Promise<CreativeDocument[]> {
  const query = projectId
    ? `?project_id=${encodeURIComponent(projectId)}`
    : "";

  const response = await apiRequest<DocumentsResponse>(
    `/api/documents${query}`
  );

  return response.documents;
}

// Fetch one document by ID.
export async function getDocument(
  documentId: string
): Promise<CreativeDocument> {
  const response = await apiRequest<SingleDocumentResponse>(
    `/api/documents/${documentId}`
  );

  return response.document;
}

// Create and save a new document.
export async function createDocument(
  document: CreateDocumentData = {}
): Promise<CreativeDocument> {
  const response = await apiRequest<SingleDocumentResponse>(
    "/api/documents",
    {
      method: "POST",
      body: JSON.stringify({
        title: document.title || "Untitled document",
        content: document.content || "",
        document_type: document.document_type || "other",
        project_id: document.project_id ?? null,
      }),
    }
  );

  return response.document;
}

// Update an existing document.
export async function updateDocument(
  documentId: string,
  updates: UpdateDocumentData
): Promise<CreativeDocument> {
  const response = await apiRequest<SingleDocumentResponse>(
    `/api/documents/${documentId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );

  return response.document;
}

// Delete a document.
export async function deleteDocument(
  documentId: string
): Promise<void> {
  await apiRequest<void>(`/api/documents/${documentId}`, {
    method: "DELETE",
  });
}
