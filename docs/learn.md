# Teampla — Backend Developer Guide

> **Deployment target:** Vercel
> **Stack:** Python 3.14 · FastAPI · SQLModel · SQLite (local) / Turso or Supabase (production)

---

## 1. What This Is

Teampla is a web API for IT departments to generate balanced project teams. Members self-declare their profiles (skill level, team specialization, shift, weekly schedule, active project count), and admins use the randomizer to produce fair, workload-aware team assignments.

---

## 2. Project Structure

```
teampla/
├── api/
│   └── index.py          # Vercel serverless entry point (Mangum-wrapped FastAPI)
├── app/
│   ├── main.py           # FastAPI app factory + router registration
│   ├── core/
│   │   └── database.py   # SQLModel engine, get_session dependency, init_db()
│   ├── models/           # SQLModel table definitions (source of truth for DB schema)
│   │   ├── member.py     # Member table + enums (SkillLevel, PrimaryTeam, ShiftSchedule)
│   │   ├── team.py       # GeneratedTeam + TeamMemberLink tables
│   │   └── preset.py     # Preset table
│   ├── schemas/          # Pydantic request/response models (API contracts)
│   │   ├── member.py     # MemberCreate, MemberUpdate, MemberRead
│   │   ├── team.py       # RandomizerConfig, GenerateTeamsRequest/Response, TeamRead
│   │   ├── preset.py     # PresetCreate, PresetUpdate, PresetRead
│   │   └── export.py     # ExportRequest, ExportFormat
│   ├── services/
│   │   ├── randomizer.py # Core team generation algorithm (pure function, no DB)
│   │   └── export.py     # Slack / CSV / plain-text formatters (pure functions)
│   └── routers/
│       ├── members.py    # CRUD — /members
│       ├── teams.py      # Generate + CRUD + swap — /teams
│       ├── presets.py    # CRUD — /presets
│       └── export.py     # Export endpoint — /export
├── docs/
│   └── learn.md          # This file
├── vercel.json           # Vercel routing config
├── requirements.txt      # Pinned deps for Vercel (generated from pyproject.toml)
├── pyproject.toml        # uv project config
└── .env.example          # Template for environment variables
```

---

## 3. Local Development Setup

### Prerequisites
- Python 3.14+
- [uv](https://github.com/astral-sh/uv) package manager

### Install and run

```bash
# Install all dependencies
uv sync

# Start the dev server (hot-reload enabled)
uv run uvicorn app.main:app --reload

# API is now at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
# OpenAPI schema at http://localhost:8000/openapi.json
```

The SQLite database file (`teampla.db`) is created automatically on first startup. No migration step is needed in development.

---

## 4. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./teampla.db` | Database connection string. See §5 for production options. |

Set these in a `.env` file at the project root for local development:

```bash
cp .env.example .env
# Edit .env as needed
```

> `.env` is gitignored. Never commit real credentials.

---

## 5. Database

### Local: SQLite

SQLite is used by default. The `teampla.db` file is created alongside the project on first startup. No configuration required.

Tables are created automatically via `SQLModel.metadata.create_all(engine)` (called in `app/core/database.py:init_db()`). This is idempotent — safe to call repeatedly.

### Production on Vercel: Why SQLite won't work

Vercel serverless functions run in a **read-only filesystem** (except `/tmp`). Any SQLite file written there is **ephemeral** — it is lost between function invocations and does not persist across deployments. You must use an external database in production.

### Option A: Turso (recommended for MVP)

[Turso](https://turso.tech) is a libSQL-based cloud database that is SQLite-compatible. It has a free tier and works seamlessly from Vercel.

```bash
# Add the driver
uv add sqlalchemy-libsql

# Set in Vercel dashboard → Project Settings → Environment Variables:
DATABASE_URL=libsql://[your-db].turso.io?authToken=[your-token]
```

No schema changes are needed — the same SQLModel models work with Turso.

### Option B: PostgreSQL via Supabase

[Supabase](https://supabase.com) provides a managed PostgreSQL database with a free tier.

```bash
# Add the driver
uv add psycopg2-binary

# Set in Vercel dashboard:
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

---

## 6. Deploying to Vercel

### How it works

`api/index.py` is the single Vercel Python function. All HTTP traffic is routed to it via `vercel.json`. Inside, `Mangum` wraps the FastAPI app as a serverless handler.

`vercel.json` routes everything to `api/index.py`:
```json
{
  "builds": [{ "src": "api/index.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "api/index.py" }]
}
```

Vercel's `@vercel/python` builder reads `requirements.txt` to install dependencies. This file must be kept in sync with `pyproject.toml`.

### Deployment steps

1. **Connect repo to Vercel** — Push to GitHub and import the repo in the Vercel dashboard.

2. **Set environment variables** — In Vercel dashboard → Project Settings → Environment Variables, add `DATABASE_URL` pointing to Turso or Supabase.

3. **Keep `requirements.txt` in sync** — After adding any package with `uv add <pkg>`, regenerate it:
   ```bash
   uv export --no-dev --no-hashes -o requirements.txt
   ```
   Commit both `pyproject.toml`, `uv.lock`, and `requirements.txt`.

4. **Deploy** — Push to `main`. Vercel builds and deploys automatically.

5. **Verify** — Hit `https://your-app.vercel.app/health`. Expected response: `{"status": "ok"}`.

### Why `lifespan="off"` in `api/index.py`

FastAPI's `lifespan` context manager (used in `app/main.py` for `init_db()`) does not run reliably inside Vercel's serverless context. Setting `lifespan="off"` in Mangum disables it and instead `init_db()` is called explicitly at module import time in `api/index.py` on every cold start.

---

## 7. API Reference

All routes are prefixed automatically by their router. Interactive documentation is available at `/docs`.

### Members — `/members`

| Method | Path | Description |
|---|---|---|
| `GET` | `/members` | List all members. Supports `?skill_level=`, `?shift=`, `?primary_team=`, `?max_projects=` filters. |
| `POST` | `/members` | Create a member profile. |
| `GET` | `/members/{id}` | Get a single member. |
| `PUT` | `/members/{id}` | Update a member profile (partial — only provided fields change). |
| `DELETE` | `/members/{id}` | Delete a member. |

### Teams — `/teams`

| Method | Path | Description |
|---|---|---|
| `POST` | `/teams/generate` | Run the randomizer. Set `persist: true` to save teams to the DB. |
| `GET` | `/teams` | List saved teams. Filter by `?session_id=` to get one randomizer run's teams. |
| `GET` | `/teams/{id}` | Get a single saved team with full member data. |
| `DELETE` | `/teams/{id}` | Delete a saved team. |
| `PATCH` | `/teams/{id}/members` | Replace member assignments (drag-to-swap persist). Body: `["member_id", ...]`. |
| `POST` | `/teams/swap` | Swap two members between two saved teams. Returns advisory warning on skill imbalance. |

### Presets — `/presets`

| Method | Path | Description |
|---|---|---|
| `GET` | `/presets` | List all saved presets. |
| `POST` | `/presets` | Save a new randomizer config as a named preset. |
| `GET` | `/presets/{id}` | Get a preset. |
| `PUT` | `/presets/{id}` | Rename or update a preset's config. |
| `DELETE` | `/presets/{id}` | Delete a preset. |

### Export — `/export`

| Method | Path | Description |
|---|---|---|
| `POST` | `/export` | Export saved teams. Body: `{ session_id, format }`. Formats: `slack`, `csv`, `plain_text`. Returns `text/plain` or `text/csv` with attachment header. |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Returns `{"status": "ok"}`. Use this to verify Vercel deployment. |

---

## 8. Randomizer Algorithm

Defined in [app/services/randomizer.py](../app/services/randomizer.py) as a pure function `generate_teams(members, config)`.

### Steps (per PRD §3.2.2)

1. **Guard checks** — Empty pool or not enough members for the requested team count → conflicts flagged, generation still proceeds.
2. **Sort by project load** — Members sorted ascending by `active_project_count`. Least-loaded members are assigned first (primary fairness signal).
3. **Seed seniors** — If `require_senior_per_team=true`, one Senior/Lead is pulled from the pool and assigned to each team. Shortage flagged as `INSUFFICIENT_SENIORS` conflict (non-blocking).
4. **Seed specializations** — For each `required_specializations` entry, the least-loaded available member with that specialization is assigned to each team that doesn't already have one. Shortage flagged as `INSUFFICIENT_SPECIALIZATION` conflict (non-blocking).
5. **Shuffle within project-count groups** — Remaining members are grouped by `active_project_count`, shuffled within each group (for variety across runs), then flattened back into a pool.
6. **Round-robin distribution** — Remaining members are distributed cyclically across teams, starting from the team with the fewest members.
7. **Shift affinity (optional)** — If `group_by_shift=true`, each remaining member is preferentially assigned to the team whose dominant shift matches theirs.
8. **Intra-team display shuffle** — Seniors appear first within each team card; juniors/mids are shuffled for display variety.
9. **Size validation** — `min_members` and `max_members` violations flagged as `SIZE_VIOLATION` conflicts.
10. **Response** — Teams named Alpha, Beta, Gamma, … (up to 20; falls back to Team 21, 22, … beyond that).

### Reproducibility

Pass `seed: <integer>` in `RandomizerConfig` to get a deterministic result. The seed is stored in `GenerateTeamsResponse.config` and can be saved into a preset for replay.

### Conflicts are non-blocking

All conflicts are advisory. Teams are always generated and returned regardless of constraint violations, matching the PRD design principle: *"Admins always have final say; constraints are warnings, not hard locks."*

---

## 9. Export Formats

Defined in [app/services/export.py](../app/services/export.py).

### Slack

```
*Team Alpha*
• Alice (Senior · Backend · Day Shift · 1 project)
• Bob (Junior · Frontend · Day Shift · 0 projects)

*Team Beta*
• Carlos (Mid-level · DevOps · Day Shift · 2 projects)
```

### CSV

```
Team,Name,Skill Level,Specialization,Shift,Active Projects
Team Alpha,Alice,Senior,Backend,Day Shift,1
Team Alpha,Bob,Junior,Frontend,Day Shift,0
```

### Plain Text

```
Team Alpha
----------
  - Alice (Senior, Backend, Day Shift, 1 project)
  - Bob (Junior, Frontend, Day Shift, 0 projects)
```

---

## 10. Adding a New Endpoint

1. **Define schemas** in `app/schemas/` — request and response Pydantic models.
2. **Implement service logic** in `app/services/` — pure function, no FastAPI imports.
3. **Create a router** in `app/routers/` — inject the service, handle HTTP layer.
4. **Register the router** in `app/main.py` — `app.include_router(your_router.router)`.
5. **Regenerate `requirements.txt`** if you added a new package.

---

## 11. Dependency Management

This project uses [uv](https://github.com/astral-sh/uv).

```bash
# Add a package
uv add <package>

# Remove a package
uv remove <package>

# Regenerate requirements.txt for Vercel after any dependency change
uv export --no-dev --no-hashes -o requirements.txt
```

Always commit `pyproject.toml`, `uv.lock`, **and** `requirements.txt` together.

---

## 12. Open Architectural Decisions

These decisions are deferred pending stakeholder input (see PRD §11):

| Decision | Status | Notes |
|---|---|---|
| Authentication | Deferred | PRD recommends Google SSO or Azure AD. No auth in v1 scaffold. |
| Persist every run vs. explicit save | Deferred | Currently controlled by `persist: bool` in `GenerateTeamsRequest`. |
| Database migrations (Alembic) | Deferred | `create_all` is used for now. Add Alembic when schema stabilizes. |
| CORS origin restriction | Deferred | Currently `allow_origins=["*"]`. Restrict to frontend origin in production. |
| Member visibility rules | Deferred | PRD open question: can members see each other's project counts? |
