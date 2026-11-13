# BIBBLE — AI Creative Companion & Story Development Studio

> **Think freely. Create deeply. Refine intelligently.**  
> A multilingual AI creative partner for brainstorming, poetry, lyrics, stories, scripts, research and creative refinement.

**Project status:** Early development / hackathon prototype  
**Product name:** BIBBLE  
**Primary languages:** Bengali, English and Banglish  
**Target users:** Everyday creators, students, poets, musicians, content creators, screenwriters and filmmakers

---

## 1. What is BIBBLE?

BIBBLE is a proposed AI-powered creative platform that helps people turn unfinished thoughts into meaningful creative work. Instead of only generating text from a prompt, BIBBLE aims to support the full creative process:

1. Understand a rough idea expressed naturally.
2. Brainstorm possible themes, directions and approaches.
3. Generate poems, song lyrics, stories, dialogue and screenplay material.
4. Research relevant creative techniques and references when research would genuinely help.
5. Critique a draft and suggest improvements with reasons.
6. Help the creator revise the work while preserving their control and original writing.

BIBBLE is intended to be useful to both a first-time writer and a filmmaker refining a screenplay. It is a creative tool, not a mental-health or diagnostic service.

## 2. Product experience

### Companion

A welcoming, chat-first experience for everyday creative work:

- Natural conversation in Bengali, English and Banglish.
- Brainstorming from incomplete or loosely expressed ideas.
- Poems, song lyrics, stories, short scripts and dialogue.
- Optional mood and personality preferences.
- Explanations of metaphors, themes and writing choices.

### Creative Studio

A focused workspace for longer and more serious projects:

- Start a new writing project or upload an existing document.
- Develop characters, themes, scenes and story structure.
- Research relevant writing and filmmaking techniques.
- Review pacing, dialogue, continuity and narrative structure.
- Receive alternative suggestions without silently overwriting the original.
- Keep project-specific context and document versions.

The interface should remain simple for new users. Advanced controls should appear progressively, only when they are useful.

## 3. Current development status

This repository begins as a scaffold. The interface and health-check API are starting points, **not a completed AI product**.

| Capability | Status |
|---|---|
| Repository and project structure | Starter scaffold |
| Initial React interface | Prototype scaffold |
| FastAPI health endpoint | Starter scaffold |
| Bengali / English / Banglish generation | Planned |
| Brainstorming workflows | Planned |
| Mood and personality controls | Planned |
| Web research with citations | Planned |
| Creative critique | Planned |
| Script upload and analysis | Planned |
| Project memory and version history | Planned |
| Sponsorship and subscription features | Future phase |

## 4. Technology stack

| Area | Planned technology | Purpose |
|---|---|---|
| Frontend | TypeScript, React, Vite, CSS | Website and creative interface |
| Backend | Python, FastAPI | API, AI workflows and document processing |
| AI model | Provider-neutral adapter (provider to be selected after terms review) | Generation, reasoning and structured responses |
| Web research | Tavily API initially, behind a search adapter | Discover relevant public web sources |
| Database / Auth | Supabase, PostgreSQL | Users, projects, messages and preferences |
| File storage | Supabase Storage | Uploaded manuscripts and project files |
| Document processing | `python-docx`, `pypdf` | Read DOCX and text-based PDF documents |
| Deployment | Cloudflare Pages + a backend host | Public prototype deployment |
| Version control | Git + GitHub | Team collaboration and project history |

**Provider selection note:** The AI provider has intentionally not been locked in. Before connecting one, review its current API terms, age restrictions, commercial-use rules, data-retention policy and treatment of submitted content. Use synthetic or public test material during early experiments; do not send confidential, unpublished or client-owned scripts to a provider unless its terms and your privacy commitments permit it. Keep provider access behind the backend adapter so the provider can be changed without rewriting the frontend.

## 5. High-level architecture

```text
Browser (React + TypeScript)
          |
          v
FastAPI backend
          |
    Intent / task router
          |
   +------+------+----------------+
   |             |                |
   v             v                v
Companion     Creative         Research
workflow      workflow         workflow
   |             |                |
   +-------------+----------------+
                 |
                 v
          Critique workflow
                 |
                 v
      Project context / memory
                 |
        +--------+--------+
        |                 |
        v                 v
    AI provider       Search provider
        |                 |
        +--------+--------+
                 |
                 v
       Structured response
                 |
                 v
        React user interface

Supabase: user data, project data, files and versions
```

Not every request should use every workflow. A simple poem request should not automatically trigger web research. The backend should decide whether research or project-context retrieval is useful, and the user should remain in control of document edits.

## 6. Repository structure

```text
BIBBLE/
├── README.md
├── .gitignore
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       └── main.tsx
└── backend/
    ├── .env.example
    ├── requirements.txt
    └── app/
        └── main.py
```

As the product grows, we will add separate frontend features and backend modules for companion chat, creative generation, research, critique, documents, memory and database access.

## 7. Getting started on Windows

### Prerequisites

Install these tools:

- [Visual Studio Code](https://code.visualstudio.com/)
- [GitHub account](https://github.com/signup)
- [GitHub Desktop](https://desktop.github.com/)
- [Node.js LTS](https://nodejs.org/en/download) (includes npm)
- [Python](https://www.python.org/downloads/) (use a currently supported Python 3 version)

In the VS Code terminal, check the installations:

```powershell
node --version
npm --version
py --version
git --version
```

If `git` is not recognised, install Git for Windows from [git-scm.com](https://git-scm.com/download/win), then reopen the terminal.

### A. Run the frontend

Open a terminal in the `frontend` folder:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

### B. Run the backend

Open a **second** terminal in the `backend` folder:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The API health endpoint should be available at:

- `http://127.0.0.1:8000/health`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

The starter backend only provides a health check. AI, database and research connections will be implemented in later steps.

## 8. Environment variables and API keys

The repository includes example environment files. Copy them to `.env` (backend) or `.env.local` (frontend), then add your own values. We will keep an AI-provider adapter in the backend so that changing providers does not require rewriting the frontend.

Never commit real `.env` files, API keys, service-role keys, passwords or private user documents.

### Planned backend variables

```env
APP_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
AI_PROVIDER_API_KEY=
TAVILY_API_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Planned frontend variable

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Only public configuration belongs in frontend variables. Anything beginning with `VITE_` can be exposed to website visitors. **Never put an AI provider key or Supabase service-role key in a frontend variable.**

### Where to request developer API keys

- Select an AI API provider only after reviewing its current age, commercial-use and data-handling terms. Keep its key in the backend environment only.
- [Tavily](https://tavily.com/) — web-search API key.
- [Supabase](https://supabase.com/) — project URL and database keys.

Create keys only in your own accounts. Store them in local environment files and in the deployment provider's secret/environment-variable settings. Do not paste keys into GitHub issues, chat screenshots or source code.

## 9. Git and GitHub workflow for the team

Use GitHub Desktop first; it provides buttons for the common Git operations.

1. Create a GitHub repository named `BIBBLE`.
2. Clone it to your computer using GitHub Desktop, or create a local repository in GitHub Desktop and publish it.
3. Open the project folder in VS Code.
4. Make one small, focused change.
5. Open GitHub Desktop and review the changed files.
6. Enter a clear summary, for example `Add initial companion screen`.
7. Click **Commit to main** for a simple solo workflow, or use a feature branch when multiple teammates are working.
8. Click **Push origin** to send the commit to GitHub.

For team work, use branches such as:

- `feature/companion-ui`
- `feature/creative-generator`
- `feature/research-engine`
- `fix/document-upload`

Do not have multiple people edit the same files simultaneously unless you coordinate first. Use a Pull Request to review and combine feature branches.

## 10. Security and privacy rules

- Keep provider API keys on the backend only.
- Keep `.env`, `.env.local`, `.venv`, `node_modules`, uploaded documents and generated private files out of Git.
- Use Supabase Row Level Security before storing real user data.
- Validate file type, file size and ownership before processing uploads.
- Treat uploaded documents and web pages as untrusted content, not as instructions to the AI system.
- Keep a clear separation between user-level preferences and project-level memory.
- Preserve original writing and create a new version when an edit is accepted.
- Do not send users' unpublished work to sponsors or advertising partners.
- Do not use sponsor payments to secretly influence research results or creative recommendations.

## 11. Product principles

1. **Human creativity stays in control.** BIBBLE suggests; the creator decides.
2. **Chat first, complexity later.** A new user should not need to learn AI terminology.
3. **Multilingual by design.** Bengali, English and Banglish are first-class input modes.
4. **Research must be traceable.** Source-backed claims should include links and clear distinctions between evidence and interpretation.
5. **No silent rewriting.** Preserve originals and make revisions reversible.
6. **Respect privacy.** Project memory is scoped, inspectable and deletable.
7. **Be transparent.** Sponsored suggestions must be labelled and must not distort creative advice.

## 12. Development roadmap

### Milestone 0 — Foundation

- Set up GitHub, local development and the initial UI.
- Connect the React frontend to the FastAPI health endpoint.
- Establish environment-variable and secret-handling practices.

### Milestone 1 — Companion MVP

- Chat interface.
- Bengali, English and Banglish input.
- Creative brainstorming.
- Poem, lyrics and short-scene generation.
- Optional mood/personality preferences.

### Milestone 2 — Research and critique

- Detect when research would materially improve a task.
- Search relevant public sources.
- Show citations and source links.
- Critique a short creative draft and offer alternatives.

### Milestone 3 — Creative Studio

- Create projects.
- Upload TXT and DOCX documents first; add PDF support after testing.
- Analyse and refine selected passages.
- Preserve versions and project-specific context.

### Later phases

- Longer screenplay analysis and scene-aware retrieval.
- More advanced project memory and collaboration.
- Sponsorship catalogue with explicit disclosure.
- Usage limits and subscriptions after cost and user testing.

## 13. Business model — planned, not implemented

The initial prototype should focus on product quality, not payment processing.

Future options may include:

- Relevant, clearly labelled sponsored recommendations for creative tools and services.
- A free allowance for everyday creative use.
- Optional subscriptions for higher usage, longer documents and advanced research.
- A professional plan for larger projects and expanded analysis.

Sponsored placement must never be disguised as neutral advice. BIBBLE should not sell or share a user's creative documents with sponsors. Payment processing and subscription entitlements will be added only after the core product is validated.

## 14. Contributing

This is an early student project. Before making a large change:

1. Open or create a GitHub Issue describing the task.
2. Agree on the files and feature owner.
3. Create a feature branch.
4. Make small commits with clear messages.
5. Test locally before opening a Pull Request.
6. Explain what changed and how it was tested.

## 15. License

No open-source license has been selected yet. Until a license is added, do not assume that others have permission to reuse, distribute or commercially exploit this code. The team should agree on a license before inviting public contributions.

## 16. Acknowledgements

BIBBLE is an independent student project concept. Product names, APIs and third-party services remain the property of their respective owners. The use of any AI provider or external search service will be subject to its own terms and policies.

---

**BIBBLE — Your imagination, with a creative partner.**
