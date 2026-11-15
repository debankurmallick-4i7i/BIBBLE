import json
import os
from datetime import datetime, timezone
from typing import Any, Literal

import httpx
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, EmailStr, Field

from supabase import create_client, Client

from app.ai_service import stream_gemini_response


# ==========================================
# 1. ENVIRONMENT CONFIGURATION
# ==========================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Supabase credentials are missing. Check your .env file."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ==========================================
# 2. AUTHENTICATION CONFIGURATION
# ==========================================

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        response = supabase.auth.get_user(credentials.credentials)

        if not response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session."
            )

        return response.user

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session."
        )


def get_user_supabase(
    credentials: HTTPAuthorizationCredentials
) -> Client:
    """Create a Supabase client using the authenticated user's token."""

    user_supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    user_supabase.postgrest.auth(credentials.credentials)

    return user_supabase


def get_display_name(user) -> str:
    """Return the user's saved name, with a sensible email fallback."""

    metadata = getattr(user, "user_metadata", None) or {}

    name = (
        metadata.get("full_name")
        or metadata.get("name")
        or ""
    )

    if name and name.strip():
        return name.strip()

    email = getattr(user, "email", None) or ""

    if email and "@" in email:
        return email.split("@")[0]

    return "Creator"


def get_owned_conversation(
    user_supabase: Client,
    conversation_id: str,
    user_id: str
):
    """Retrieve a conversation belonging to the authenticated user."""

    response = (
        user_supabase.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    return response.data[0]


# ==========================================
# 3. REQUEST MODELS
# ==========================================

class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)


class ProjectCreateRequest(BaseModel):
    title: str
    project_type: str
    description: str = ""


class ProjectUpdateRequest(BaseModel):
    title: str | None = None
    project_type: str | None = None
    description: str | None = None
    status: str | None = None


class ConversationCreateRequest(BaseModel):
    title: str = "New conversation"
    project_id: str | None = None
    language: str = "auto"
    mood: str | None = None


class MessageCreateRequest(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class GenerateResponseRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=12000)
    action: str = "chat"


# ==========================================
# 4. FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="BIBBLE API",
    description="AI Creative Companion and Story Development Studio",
    version="1.2.0"
)


# ==========================================
# 5. CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 6. HOME AND HEALTH ENDPOINTS
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Welcome to BIBBLE!",
        "status": "Backend is running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "application": "BIBBLE",
        "version": "1.2.0"
    }


# ==========================================
# 7. DATABASE CONNECTION TEST
# ==========================================

@app.get("/api/test-database")
def test_database():
    try:
        supabase.table("projects").select("id").limit(1).execute()

        return {
            "status": "success",
            "message": "BIBBLE connected to Supabase database!"
        }

    except Exception as error:
        print("Database test failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Database connection test failed."
        )


# ==========================================
# 8. USER REGISTRATION
# ==========================================

@app.post("/api/auth/register")
def register_user(user: RegisterRequest):
    name = user.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Your name cannot be empty."
        )

    try:
        response = supabase.auth.sign_up({
            "email": str(user.email),
            "password": user.password,
            "options": {
                "data": {
                    "full_name": name
                }
            }
        })

        return {
            "status": "success",
            "message": (
                "Registration request received. "
                "Check your email for verification."
            ),
            "user_id": response.user.id if response.user else None,
            "display_name": name
        }

    except Exception as error:
        print("Registration failed:", repr(error))

        raise HTTPException(
            status_code=400,
            detail=(
                "Registration failed. "
                "Check your details or try another email."
            )
        )


# ==========================================
# 9. USER LOGIN
# ==========================================

@app.post("/api/auth/login")
def login_user(user: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": str(user.email),
            "password": user.password
        })

        if not response.session:
            raise HTTPException(
                status_code=401,
                detail="Login did not create a session."
            )

        return {
            "status": "success",
            "message": "Login successful!",
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user_id": response.user.id if response.user else None,
            "display_name": (
                get_display_name(response.user)
                if response.user else None
            )
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Login failed:", repr(error))

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )


# ==========================================
# 10. GET AUTHENTICATED USER PROFILE
# ==========================================

@app.get("/api/auth/me")
def get_my_profile(current_user=Depends(get_current_user)):
    return {
        "status": "success",
        "user_id": str(current_user.id),
        "email": current_user.email,
        "display_name": get_display_name(current_user)
    }


# ==========================================
# 11. UPDATE AUTHENTICATED USER PROFILE
# ==========================================

@app.patch("/api/auth/me")
def update_my_profile(
    profile: ProfileUpdateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    display_name = profile.display_name.strip()

    if not display_name:
        raise HTTPException(
            status_code=400,
            detail="Display name cannot be empty."
        )

    try:
        # Update the authenticated user's Supabase Auth metadata.
        # The user's access token is used, not a service-role key.

        response = httpx.put(
            f"{SUPABASE_URL.rstrip('/')}/auth/v1/user",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": (
                    f"Bearer {credentials.credentials}"
                ),
                "Content-Type": "application/json"
            },
            json={
                "data": {
                    "full_name": display_name
                }
            },
            timeout=15.0
        )

        if response.status_code >= 400:
            print(
                "Profile update failed:",
                response.status_code,
                response.text
            )

            raise HTTPException(
                status_code=400,
                detail="Could not update your profile."
            )

        updated_user = response.json()

        return {
            "status": "success",
            "message": "Profile updated successfully.",
            "user_id": updated_user.get(
                "id", str(current_user.id)
            ),
            "email": updated_user.get(
                "email", current_user.email
            ),
            "display_name": display_name
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Profile update failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not update your profile."
        )


# ==========================================
# 12. CREATE A NEW PROJECT
# ==========================================

@app.post("/api/projects")
def create_project(
    project: ProjectCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    allowed_types = [
        "poem", "song", "story", "screenplay", "other"
    ]

    if project.project_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid project type."
        )

    if not project.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Project title cannot be empty."
        )

    try:
        user_supabase = get_user_supabase(credentials)

        response = user_supabase.table("projects").insert({
            "user_id": str(current_user.id),
            "title": project.title.strip(),
            "project_type": project.project_type,
            "description": project.description
        }).execute()

        return {
            "status": "success",
            "message": "Project created successfully!",
            "project": response.data[0]
        }

    except Exception as error:
        print("Project creation failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not create project. Check the server logs."
        )


# ==========================================
# 13. GET ALL USER PROJECTS
# ==========================================

@app.get("/api/projects")
def get_projects(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)

        response = (
            user_supabase.table("projects")
            .select("*")
            .eq("user_id", str(current_user.id))
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "status": "success",
            "total_projects": len(response.data),
            "projects": response.data
        }

    except Exception as error:
        print("Project retrieval failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve projects."
        )


# ==========================================
# 14. GET ONE SPECIFIC PROJECT
# ==========================================

@app.get("/api/projects/{project_id}")
def get_project(
    project_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)

        response = (
            user_supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", str(current_user.id))
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Project not found."
            )

        return {
            "status": "success",
            "project": response.data[0]
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Project retrieval failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve project."
        )


# ==========================================
# 15. UPDATE AN EXISTING PROJECT
# ==========================================

@app.patch("/api/projects/{project_id}")
def update_project(
    project_id: str,
    project_data: ProjectUpdateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        update_data = project_data.model_dump(
            exclude_unset=True,
            exclude_none=True
        )

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="Please provide at least one field to update."
            )

        if "title" in update_data:
            if not update_data["title"].strip():
                raise HTTPException(
                    status_code=400,
                    detail="Project title cannot be empty."
                )

            update_data["title"] = update_data["title"].strip()

        if "project_type" in update_data:
            if update_data["project_type"] not in [
                "poem", "song", "story", "screenplay", "other"
            ]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid project type."
                )

        if "status" in update_data:
            if update_data["status"] not in [
                "active", "archived", "completed"
            ]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid project status."
                )

        user_supabase = get_user_supabase(credentials)

        response = (
            user_supabase.table("projects")
            .update(update_data)
            .eq("id", project_id)
            .eq("user_id", str(current_user.id))
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Project not found."
            )

        return {
            "status": "success",
            "message": "Project updated successfully.",
            "project": response.data[0]
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Project update failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not update project."
        )


# ==========================================
# 16. DELETE AN EXISTING PROJECT
# ==========================================

@app.delete("/api/projects/{project_id}")
def delete_project(
    project_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)

        response = (
            user_supabase.table("projects")
            .delete()
            .eq("id", project_id)
            .eq("user_id", str(current_user.id))
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Project not found."
            )

        return {
            "status": "success",
            "message": "Project deleted successfully.",
            "deleted_project_id": project_id
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Project deletion failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not delete project."
        )


# ==========================================
# 17. CREATE A CONVERSATION
# ==========================================

@app.post("/api/conversations")
def create_conversation(
    conversation: ConversationCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)
        user_id = str(current_user.id)

        if not conversation.title.strip():
            raise HTTPException(
                status_code=400,
                detail="Conversation title cannot be empty."
            )

        # Verify that the selected project belongs to this user.
        if conversation.project_id:
            project_response = (
                user_supabase.table("projects")
                .select("id")
                .eq("id", conversation.project_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not project_response.data:
                raise HTTPException(
                    status_code=404,
                    detail="Project not found."
                )

        conversation_data = {
            "user_id": user_id,
            "project_id": conversation.project_id,
            "title": conversation.title.strip(),
            "language": conversation.language.strip() or "auto",
            "mood": conversation.mood
        }

        response = (
            user_supabase.table("conversations")
            .insert(conversation_data)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Conversation could not be created."
            )

        return {
            "status": "success",
            "message": "Conversation created successfully.",
            "conversation": response.data[0]
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Conversation creation failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not create conversation."
        )


# ==========================================
# 18. GET USER CONVERSATIONS
# ==========================================

@app.get("/api/conversations")
def get_conversations(
    project_id: str | None = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)

        query = (
            user_supabase.table("conversations")
            .select("*")
            .eq("user_id", str(current_user.id))
        )

        if project_id:
            query = query.eq("project_id", project_id)

        response = (
            query.order("updated_at", desc=True)
            .execute()
        )

        return {
            "status": "success",
            "total_conversations": len(response.data),
            "conversations": response.data
        }

    except Exception as error:
        print("Conversation retrieval failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve conversations."
        )


# ==========================================
# 19. GET ONE CONVERSATION
# ==========================================

@app.get("/api/conversations/{conversation_id}")
def get_conversation(
    conversation_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)

        conversation = get_owned_conversation(
            user_supabase,
            conversation_id,
            str(current_user.id)
        )

        return {
            "status": "success",
            "conversation": conversation
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Conversation retrieval failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve conversation."
        )


# ==========================================
# 20. GET MESSAGES IN A CONVERSATION
# ==========================================

@app.get("/api/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)

        # Confirm conversation ownership before reading messages.
        get_owned_conversation(
            user_supabase,
            conversation_id,
            str(current_user.id)
        )

        response = (
            user_supabase.table("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .eq("user_id", str(current_user.id))
            .order("created_at", desc=False)
            .execute()
        )

        return {
            "status": "success",
            "total_messages": len(response.data),
            "messages": response.data
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Message retrieval failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve messages."
        )


# ==========================================
# 21. SAVE A MESSAGE
# ==========================================

@app.post("/api/conversations/{conversation_id}/messages")
def create_message(
    conversation_id: str,
    message: MessageCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)
        user_id = str(current_user.id)

        if not message.content.strip():
            raise HTTPException(
                status_code=400,
                detail="Message content cannot be empty."
            )

        # Confirm conversation ownership.
        conversation = get_owned_conversation(
            user_supabase,
            conversation_id,
            user_id
        )

        response = (
            user_supabase.table("messages")
            .insert({
                "conversation_id": conversation_id,
                "user_id": user_id,
                "role": message.role,
                "content": message.content.strip(),
                "metadata": message.metadata
            })
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Message could not be saved."
            )

        # Update conversation activity time.
        user_supabase.table("conversations").update({
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq(
            "id", conversation_id
        ).eq(
            "user_id", user_id
        ).execute()

        return {
            "status": "success",
            "message": "Message saved successfully.",
            "saved_message": response.data[0],
            "conversation_id": conversation["id"]
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Message creation failed:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not save message."
        )
# ==========================================
# AI RESPONSE GENERATION
# ==========================================

@app.post("/api/conversations/{conversation_id}/generate")
def generate_conversation_response(
    conversation_id: str,
    request: GenerateResponseRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)
        user_id = str(current_user.id)

        # Verify conversation ownership before generating.
        conversation = get_owned_conversation(
            user_supabase,
            conversation_id,
            user_id
        )

        # Retrieve recent conversation history.
        history_response = (
            user_supabase.table("messages")
            .select("role, content, created_at")
            .eq("conversation_id", conversation_id)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )

        history = list(reversed(history_response.data or []))

        # Avoid adding the latest user message twice.
        if history and (
            history[-1]["role"] == "user"
            and history[-1]["content"].strip() == request.prompt.strip()
        ):
            history.pop()

        conversation_context = "\n".join(
            f'{message["role"].upper()}: {message["content"]}'
            for message in history
        )

        full_prompt = f"""
You are BIBBLE, an AI Creative Companion.

Help the user develop their creative work while preserving
their individual creative voice.

Previous conversation:
{conversation_context}

Current user message:
{request.prompt}

Respond naturally and helpfully.
"""

    except HTTPException:
        raise

    except Exception as error:
        print("AI generation preparation failed:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Could not prepare AI response."
        )

    def generate_stream():
        generated_text = ""

        try:
            for chunk in stream_gemini_response(
                full_prompt,
                action=request.action
            ):
                generated_text += chunk

                yield (
                    "data: "
                    + json.dumps({"type": "delta", "text": chunk})
                    + "\n\n"
                )

            if not generated_text.strip():
                raise RuntimeError("The AI returned an empty response.")

            # Save the completed assistant response.
            save_response = (
                user_supabase.table("messages")
                .insert({
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "role": "assistant",
                    "content": generated_text,
                    "metadata": {
                        "action": request.action,
                        "provider": "google-gemini"
                    }
                })
                .execute()
            )

            if not save_response.data:
                raise RuntimeError("Could not save the AI response.")

            user_supabase.table("conversations").update({
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq(
                "id", conversation_id
            ).eq(
                "user_id", user_id
            ).execute()

            yield (
                "data: "
                + json.dumps({
                    "type": "complete",
                    "saved_message": save_response.data[0]
                })
                + "\n\n"
            )

        except Exception as error:
            print("AI response generation failed:", repr(error))

            yield (
                "data: "
                + json.dumps({
                    "type": "error",
                    "message": "AI generation failed. Please try again."
                })
                + "\n\n"
            )

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


# ==========================================
# 22. CREATIVE DOCUMENT REQUEST MODELS
# ==========================================

class DocumentCreateRequest(BaseModel):
    title: str = Field(default="Untitled document", min_length=1, max_length=200)
    content: str = ""
    document_type: Literal[
        "story", "poem", "song", "screenplay", "notes", "other"
    ] = "other"
    project_id: str | None = None


class DocumentUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = None
    document_type: Literal[
        "story", "poem", "song", "screenplay", "notes", "other"
    ] | None = None
    project_id: str | None = None


# ==========================================
# 23. CREATE A CREATIVE DOCUMENT
# ==========================================

@app.post("/api/documents")
def create_creative_document(
    document: DocumentCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)
        user_id = str(current_user.id)

        title = document.title.strip()
        if not title:
            raise HTTPException(
                status_code=400,
                detail="Document title cannot be empty."
            )

        # A document may only be attached to a project owned by this user.
        if document.project_id:
            project_response = (
                user_supabase.table("projects")
                .select("id")
                .eq("id", document.project_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not project_response.data:
                raise HTTPException(
                    status_code=404,
                    detail="Project not found."
                )

        response = (
            user_supabase.table("creative_documents")
            .insert({
                "user_id": user_id,
                "project_id": document.project_id,
                "title": title,
                "content": document.content,
                "document_type": document.document_type
            })
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Document could not be created."
            )

        return {
            "status": "success",
            "message": "Document created successfully.",
            "document": response.data[0]
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Creative document creation failed:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Could not create document."
        )


# ==========================================
# 24. GET ALL USER CREATIVE DOCUMENTS
# ==========================================

@app.get("/api/documents")
def get_creative_documents(
    project_id: str | None = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)

        query = (
            user_supabase.table("creative_documents")
            .select("*")
            .eq("user_id", str(current_user.id))
        )

        if project_id:
            query = query.eq("project_id", project_id)

        response = (
            query.order("updated_at", desc=True)
            .execute()
        )

        return {
            "status": "success",
            "total_documents": len(response.data),
            "documents": response.data
        }

    except Exception as error:
        print("Creative document retrieval failed:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve documents."
        )


# ==========================================
# 25. GET ONE CREATIVE DOCUMENT
# ==========================================

@app.get("/api/documents/{document_id}")
def get_creative_document(
    document_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)

        response = (
            user_supabase.table("creative_documents")
            .select("*")
            .eq("id", document_id)
            .eq("user_id", str(current_user.id))
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Document not found."
            )

        return {
            "status": "success",
            "document": response.data[0]
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Creative document retrieval failed:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve document."
        )


# ==========================================
# 26. UPDATE A CREATIVE DOCUMENT
# ==========================================

@app.patch("/api/documents/{document_id}")
def update_creative_document(
    document_id: str,
    document_data: DocumentUpdateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)
        user_id = str(current_user.id)

        update_data = document_data.model_dump(exclude_unset=True)

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="Please provide at least one field to update."
            )

        if "title" in update_data:
            if update_data["title"] is None or not update_data["title"].strip():
                raise HTTPException(
                    status_code=400,
                    detail="Document title cannot be empty."
                )
            update_data["title"] = update_data["title"].strip()

        if "content" in update_data and update_data["content"] is None:
            raise HTTPException(
                status_code=400,
                detail="Document content cannot be null."
            )

        # If a project is supplied, confirm it belongs to this user.
        # An explicit null project_id removes the project association.
        if update_data.get("project_id"):
            project_response = (
                user_supabase.table("projects")
                .select("id")
                .eq("id", update_data["project_id"])
                .eq("user_id", user_id)
                .execute()
            )

            if not project_response.data:
                raise HTTPException(
                    status_code=404,
                    detail="Project not found."
                )

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        response = (
            user_supabase.table("creative_documents")
            .update(update_data)
            .eq("id", document_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Document not found."
            )

        return {
            "status": "success",
            "message": "Document updated successfully.",
            "document": response.data[0]
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Creative document update failed:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Could not update document."
        )


# ==========================================
# 27. DELETE A CREATIVE DOCUMENT
# ==========================================

@app.delete("/api/documents/{document_id}")
def delete_creative_document(
    document_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = get_user_supabase(credentials)

        response = (
            user_supabase.table("creative_documents")
            .delete()
            .eq("id", document_id)
            .eq("user_id", str(current_user.id))
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Document not found."
            )

        return {
            "status": "success",
            "message": "Document deleted successfully.",
            "deleted_document_id": document_id
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Creative document deletion failed:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Could not delete document."
        )
