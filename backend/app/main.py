
import os

from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, EmailStr

from supabase import create_client, Client


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
    token = credentials.credentials

    try:
        response = supabase.auth.get_user(token)

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


# ==========================================
# 3. REQUEST MODELS
# ==========================================

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class ProjectCreateRequest(BaseModel):
    title: str
    project_type: str
    description: str = ""


class ProjectUpdateRequest(BaseModel):
    title: str | None = None
    project_type: str | None = None
    description: str | None = None
    status: str | None = None


# ==========================================
# 4. FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="BIBBLE API",
    description="AI Creative Companion and Story Development Studio",
    version="1.0.0"
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
        "version": "1.0.0"
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
    try:
        response = supabase.auth.sign_up({
            "email": str(user.email),
            "password": user.password
        })

        return {
            "status": "success",
            "message": "Registration request received. Check your email for verification.",
            "user_id": response.user.id if response.user else None
        }

    except Exception as error:
        print("Registration failed:", repr(error))

        raise HTTPException(
            status_code=400,
            detail="Registration failed. Check your details or try another email."
        )


# ==========================================
# 9. USER LOGIN
# ==========================================

@app.post("/api/auth/login")
def login_user(user: RegisterRequest):
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
            "user_id": response.user.id if response.user else None
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
        "message": "Authenticated successfully!",
        "user_id": current_user.id,
        "email": current_user.email
    }


# ==========================================
# 11. CREATE A NEW PROJECT
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
        user_supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        user_supabase.postgrest.auth(credentials.credentials)

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
# 12. GET ALL USER PROJECTS
# ==========================================

@app.get("/api/projects")
def get_projects(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        user_supabase.postgrest.auth(credentials.credentials)

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
# 13. GET ONE SPECIFIC PROJECT
# ==========================================

@app.get("/api/projects/{project_id}")
def get_project(
    project_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        user_supabase.postgrest.auth(credentials.credentials)

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
# 14. UPDATE AN EXISTING PROJECT
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

        # Validate project title
        if "title" in update_data:
            if not update_data["title"].strip():
                raise HTTPException(
                    status_code=400,
                    detail="Project title cannot be empty."
                )

            update_data["title"] = update_data["title"].strip()

        # Validate project type
        if "project_type" in update_data:
            if update_data["project_type"] not in [
                "poem", "song", "story", "screenplay", "other"
            ]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid project type."
                )

        # Validate project status
        if "status" in update_data:
            if update_data["status"] not in [
                "active", "archived", "completed"
            ]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid project status."
                )

        user_supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        user_supabase.postgrest.auth(credentials.credentials)

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
# 15. DELETE AN EXISTING PROJECT
# ==========================================

@app.delete("/api/projects/{project_id}")
def delete_project(
    project_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user=Depends(get_current_user)
):
    try:
        user_supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        user_supabase.postgrest.auth(credentials.credentials)

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
