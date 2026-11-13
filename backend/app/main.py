import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="BIBBLE API",
    description="Backend scaffold for the BIBBLE creative companion.",
    version="0.1.0",
)

origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "name": "BIBBLE API",
        "status": "scaffold_ready",
        "message": "The BIBBLE backend is running. AI features are not connected yet.",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
