# Architectural Change — Python/FastAPI → Next.js (Full-Stack)

**Date:** 2026-03-17
**Status:** Approved
**Author:** Aaron
**Affects:** Entire backend + new frontend

---

## 1. Summary of Change

The backend is being migrated from a standalone **Python/FastAPI** application to **Next.js API Routes**, and the frontend is being built in the same codebase. The result is a single Next.js monorepo deployed natively on Vercel.

The Python code in `app/` and `api/` is **replaced**. Business logic (randomizer algorithm, export formatters, validators) is **ported to TypeScript**.

---

## 2. Motivation

| Pain Point (Python + FastAPI on Vercel) | How Next.js Fixes It |
|---|---|
| Two separate runtimes (Python backend + React frontend) requiring cross-origin setup | Single codebase, same origin — no CORS configuration needed |
| `requirements.txt` must be manually synced with `pyproject.toml` for Vercel | Next.js on Vercel is zero-config — `package.json` is the single source of truth |
| `Mangum` wrapper + `lifespan="off"` workaround for serverless SQLModel startup | Next.js API routes are natively serverless — no adapter needed |
| Cold starts are heavier with Python + SQLModel imports | Next.js edge/serverless functions have faster cold starts |
| Test runner mismatch (Python `pytest` for backend, JavaScript `jest`/`vitest` for frontend) | One test runner (`vitest`) covers both API logic and UI components |
| Unit tests in PRD §12 are written in TypeScript — they assume a TS implementation | Tests can be run directly against the ported TypeScript code with no translation |

---

## 3. What Changes vs. What Stays the Same

### Changes
- **Backend language:** Python → TypeScript
- **API framework:** FastAPI → Next.js App Router API Routes (`/app/api/...`)
- **ORM:** SQLModel (Python) → **Prisma** (TypeScript)
- **Entry point:** `api/index.py` + Mangum → Next.js handles routing natively
- **Dependency management:** `uv` / `pyproject.toml` / `requirements.txt` → `npm` / `package.json`
- **`app/` directory:** repurposed from Python package to Next.js App Router

### Stays the Same
- **Database:** SQLite (local dev), Turso or Supabase (production) — same options, Prisma supports both
- **Deployment target:** Vercel — same, but simpler
- **API surface:** same endpoints, same request/response shapes
- **Randomizer algorithm logic:** same 10-step algorithm, ported to TypeScript
- **Export formats:** same Slack / CSV / plain-text output
- **Data model:** same fields and relationships (re-expressed as a Prisma schema)
- **`vercel.json`:** can be removed entirely — Next.js on Vercel needs no routing config

---

## 4. New Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Frontend + backend in one project |
| **Language** | TypeScript | Strict mode enabled |
| **ORM** | Prisma | Schema-first, type-safe, supports SQLite + PostgreSQL |
| **Database (local)** | SQLite via `prisma/dev.db` | Auto-created on `prisma db push` |
| **Database (production)** | Turso or Supabase | Same options as before |
| **UI Library** | React 19 (bundled with Next.js 15) | |
| **Styling** | Tailwind CSS v4 | |
| **Drag-and-drop** | `@dnd-kit/core` + `@dnd-kit/sortable` | Per PRD §7.1 |
| **State management** | Zustand | Per PRD §7.1 |
| **CSV export** | `papaparse` | Client-side CSV generation per PRD §7.3 |
| **Form handling** | React Hook Form + Zod | Zod schemas replace Pydantic validators |
| **Testing** | Vitest + React Testing Library | Matches PRD §12 test format exactly |
| **Linting** | ESLint + Prettier | Replaces Ruff |
| **Package manager** | npm | Standard for Next.js |

---

## 5. New Project Structure

```
teampla/
├── prisma/
│   ├── schema.prisma         # Database schema (replaces SQLModel models)
│   └── dev.db                # SQLite dev database (gitignored)
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing / redirect
│   │   │
│   │   ├── (member)/         # Member-facing pages
│   │   │   └── profile/
│   │   │       └── page.tsx  # Profile setup / edit form (PRD §4.1, §4.3)
│   │   │
│   │   ├── (admin)/          # Admin-facing pages
│   │   │   ├── randomizer/
│   │   │   │   └── page.tsx  # Randomizer config + Generate button (PRD §4.2)
│   │   │   ├── teams/
│   │   │   │   └── page.tsx  # Team cards + drag-to-swap UI (PRD §3.3)
│   │   │   └── presets/
│   │   │       └── page.tsx  # Preset management (PRD §3.4)
│   │   │
│   │   └── api/              # API Routes (replaces FastAPI routers)
│   │       ├── members/
│   │       │   ├── route.ts              # GET /api/members, POST /api/members
│   │       │   └── [id]/
│   │       │       └── route.ts          # GET, PUT, DELETE /api/members/[id]
│   │       ├── teams/
│   │       │   ├── route.ts              # GET /api/teams
│   │       │   ├── generate/
│   │       │   │   └── route.ts          # POST /api/teams/generate
│   │       │   ├── swap/
│   │       │   │   └── route.ts          # POST /api/teams/swap
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET, DELETE /api/teams/[id]
│   │       │       └── members/
│   │       │           └── route.ts      # PATCH /api/teams/[id]/members
│   │       ├── presets/
│   │       │   ├── route.ts              # GET, POST /api/presets
│   │       │   └── [id]/
│   │       │       └── route.ts          # GET, PUT, DELETE /api/presets/[id]
│   │       ├── export/
│   │       │   └── route.ts              # POST /api/export
│   │       └── health/
│   │           └── route.ts              # GET /api/health
│   │
│   ├── components/           # Reusable UI components
│   │   ├── profile/
│   │   │   ├── ProfileForm.tsx           # Member profile form (PRD §3.1)
│   │   │   └── WeeklyScheduleGrid.tsx    # Mon–Sun location grid (PRD §3.1.4)
│   │   ├── randomizer/
│   │   │   ├── RandomizerPanel.tsx       # Constraint config UI (PRD §3.2.1)
│   │   │   └── ConflictBanner.tsx        # Non-blocking conflict warnings
│   │   ├── teams/
│   │   │   ├── TeamBoard.tsx             # Drag-and-drop team canvas (PRD §3.3)
│   │   │   ├── TeamCard.tsx              # Single team column
│   │   │   ├── MemberCard.tsx            # Draggable member tile
│   │   │   └── WorkloadBadge.tsx         # Green/yellow/red indicator (PRD §3.2.3)
│   │   ├── export/
│   │   │   └── ExportMenu.tsx            # Slack / CSV / Copy buttons (PRD §3.5)
│   │   └── ui/                           # Primitive design system components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       └── Modal.tsx
│   │
│   ├── lib/                  # Shared logic (no React imports)
│   │   ├── randomizer.ts     # Ported 10-step algorithm (from app/services/randomizer.py)
│   │   ├── export.ts         # Ported formatters (from app/services/export.py)
│   │   ├── validators.ts     # Zod schemas (replaces app/schemas/ + Pydantic validators)
│   │   ├── prisma.ts         # Singleton Prisma client (prevents connection pool exhaustion)
│   │   └── types.ts          # Shared TypeScript interfaces
│   │
│   ├── store/                # Zustand state
│   │   ├── teamsStore.ts     # Generated teams + swap history + undo stack
│   │   └── randomizerStore.ts # Randomizer config state
│   │
│   └── tests/                # Vitest test files (mirrors PRD §12)
│       ├── randomizer.test.ts     # PRD §12.2 — algorithm unit tests
│       ├── validators.test.ts     # PRD §12.1 — profile validation tests
│       ├── dragSwap.test.ts       # PRD §12.3 — swap logic tests
│       ├── presets.test.ts        # PRD §12.4 — preset management tests
│       ├── export.test.ts         # PRD §12.5 — export formatter tests
│       └── testUtils.ts           # PRD §12.7 — shared fixtures (buildMember, etc.)
│
├── public/                   # Static assets
│
├── docs/
│   ├── learn.md              # Updated developer guide (superseded by this change)
│   └── architect_changes.md  # This file
│
├── .env.example              # Updated env var template
├── next.config.ts            # Next.js config
├── tailwind.config.ts        # Tailwind config
├── tsconfig.json             # TypeScript config
├── vitest.config.ts          # Test config
└── package.json              # Single dependency file (replaces pyproject.toml + requirements.txt)
```

---

## 6. Prisma Schema (Replaces SQLModel Models)

`prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum SkillLevel {
  Junior
  Mid_level  @map("Mid-level")
  Senior
  Lead
}

enum PrimaryTeam {
  Backend
  Frontend
  DevOps
  QA_Testing     @map("QA / Testing")
  Mobile
  Data_Analytics @map("Data / Analytics")
  Full_Stack     @map("Full Stack")
  Other
}

enum ShiftSchedule {
  Day_Shift       @map("Day Shift")
  Afternoon_Shift @map("Afternoon Shift")
  Night_Shift     @map("Night Shift")
}

model Member {
  id                  String   @id @default(uuid())
  name                String
  email               String   @unique
  skillLevel          SkillLevel
  primaryTeam         PrimaryTeam
  otherTeamName       String?
  shift               ShiftSchedule
  weeklySchedule      Json     // { mon, tue, wed, thu, fri, sat, sun }
  activeProjectCount  Int      @default(0)
  isAdmin             Boolean  @default(false)
  updatedAt           DateTime @updatedAt

  teamLinks           TeamMemberLink[]
}

model GeneratedTeam {
  id         String   @id @default(uuid())
  name       String
  sessionId  String
  presetId   String?
  createdAt  DateTime @default(now())

  memberLinks TeamMemberLink[]
}

model TeamMemberLink {
  teamId          String
  memberId        String
  manuallySwapped Boolean @default(false)

  team   GeneratedTeam @relation(fields: [teamId], references: [id], onDelete: Cascade)
  member Member        @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@id([teamId, memberId])
}

model Preset {
  id        String   @id @default(uuid())
  name      String   @unique
  config    Json     // RandomizerConfig snapshot
  createdBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Key differences from the SQLModel schema:
- `onDelete: Cascade` on `TeamMemberLink` — Prisma enforces referential integrity cleanly
- `updatedAt` uses Prisma's `@updatedAt` directive (auto-managed)
- Enums use `@map` to store the display string in the DB while using TypeScript-safe identifiers in code

---

## 7. API Route Migration Map

Every FastAPI endpoint maps 1-to-1 to a Next.js App Router route handler.

| FastAPI Endpoint | Next.js Route File | HTTP Method |
|---|---|---|
| `GET /members` | `src/app/api/members/route.ts` | `GET` |
| `POST /members` | `src/app/api/members/route.ts` | `POST` |
| `GET /members/{id}` | `src/app/api/members/[id]/route.ts` | `GET` |
| `PUT /members/{id}` | `src/app/api/members/[id]/route.ts` | `PUT` |
| `DELETE /members/{id}` | `src/app/api/members/[id]/route.ts` | `DELETE` |
| `POST /teams/generate` | `src/app/api/teams/generate/route.ts` | `POST` |
| `GET /teams` | `src/app/api/teams/route.ts` | `GET` |
| `GET /teams/{id}` | `src/app/api/teams/[id]/route.ts` | `GET` |
| `DELETE /teams/{id}` | `src/app/api/teams/[id]/route.ts` | `DELETE` |
| `PATCH /teams/{id}/members` | `src/app/api/teams/[id]/members/route.ts` | `PATCH` |
| `POST /teams/swap` | `src/app/api/teams/swap/route.ts` | `POST` |
| `GET /presets` | `src/app/api/presets/route.ts` | `GET` |
| `POST /presets` | `src/app/api/presets/route.ts` | `POST` |
| `GET /presets/{id}` | `src/app/api/presets/[id]/route.ts` | `GET` |
| `PUT /presets/{id}` | `src/app/api/presets/[id]/route.ts` | `PUT` |
| `DELETE /presets/{id}` | `src/app/api/presets/[id]/route.ts` | `DELETE` |
| `POST /export` | `src/app/api/export/route.ts` | `POST` |
| `GET /health` | `src/app/api/health/route.ts` | `GET` |

**Route handler pattern** (replaces FastAPI router + Depends):

```typescript
// src/app/api/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemberCreateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const members = await prisma.member.findMany();
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = MemberCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 422 });
  }
  const member = await prisma.member.create({ data: parsed.data });
  return NextResponse.json(member, { status: 201 });
}
```

---

## 8. Business Logic Port (Python → TypeScript)

The randomizer algorithm and export formatters are pure functions with no framework dependencies. They port directly.

### `src/lib/randomizer.ts` (from `app/services/randomizer.py`)

The 10-step algorithm is identical in logic. Python type annotations become TypeScript interfaces. `random.shuffle` → Fisher-Yates shuffle utility.

```typescript
// Same function signature, TypeScript types
export function generateTeams(
  members: Member[],
  config: RandomizerConfig
): GenerateTeamsResponse { ... }
```

### `src/lib/export.ts` (from `app/services/export.py`)

```typescript
export function formatSlack(teams: TeamWithMembers[]): string { ... }
export function formatCSV(teams: TeamWithMembers[]): string { ... }
export function formatPlainText(teams: TeamWithMembers[]): string { ... }
```

### `src/lib/validators.ts` (from `app/schemas/`)

Pydantic models → Zod schemas. Zod is used both server-side (API route validation) and client-side (form validation with React Hook Form).

```typescript
export const WeeklyScheduleSchema = z.object({
  mon: z.enum(["onsite", "wfh", "dayoff"]),
  tue: z.enum(["onsite", "wfh", "dayoff"]),
  // ...
});

export const MemberCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  skillLevel: z.enum(["Junior", "Mid-level", "Senior", "Lead"]),
  // ...
});
```

---

## 9. Frontend Architecture

### Pages and Their PRD Mapping

| Page | Route | PRD Section |
|---|---|---|
| Profile setup/edit | `/profile` | §3.1, §4.1, §4.3 |
| Randomizer config | `/randomizer` | §3.2, §4.2 |
| Team board (drag-to-swap) | `/teams` | §3.3 |
| Preset management | `/presets` | §3.4 |

### Drag-to-Swap UI (`TeamBoard.tsx`)

Uses `@dnd-kit/core` for pointer/touch drag events and `@dnd-kit/sortable` for drop targets. State is managed entirely in Zustand (`teamsStore.ts`) — the drag-to-swap feature is **client-side only**. The backend is called only when the admin explicitly clicks "Save" to persist the final arrangement.

The Zustand store maintains:
- `currentTeams` — the live team state shown in the UI
- `generatedTeams` — snapshot of the originally generated teams (for "Reset to Generated")
- `swapHistory` — stack of previous states (for "Undo")

```typescript
// store/teamsStore.ts (conceptual)
interface TeamsStore {
  currentTeams: TeamWithMembers[];
  generatedTeams: TeamWithMembers[];      // immutable snapshot
  swapHistory: TeamWithMembers[][];       // undo stack
  swapMembers: (a: MemberRef, b: MemberRef) => SwapResult;
  undoLastSwap: () => void;
  resetToGenerated: () => void;
}
```

### Workload Color Coding

Per PRD §3.2.3:
- `activeProjectCount === 0` → green badge
- `activeProjectCount === 1 or 2` → yellow badge
- `activeProjectCount >= 3` → red badge

Implemented as a `WorkloadBadge` component using Tailwind CSS utility classes.

### Weekly Schedule Grid (`WeeklyScheduleGrid.tsx`)

A 7-column grid (Mon–Sun) where each cell cycles through `On-Site → WFH → Day Off` on click. Fully controlled component — value/onChange props consumed by React Hook Form.

---

## 10. State Management Strategy

| State Type | Where It Lives | Why |
|---|---|---|
| Server data (members, presets) | React Server Components + `fetch` | Next.js default — no client JS needed |
| Randomizer config form | React Hook Form | Form state, no global store needed |
| Generated teams + drag state | Zustand (`teamsStore`) | Needs to persist across component tree during session |
| Randomizer config (saved settings) | Zustand (`randomizerStore`) | Shared between RandomizerPanel and PresetMenu |

---

## 11. Environment Variables (Updated)

| Variable | Local Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Prisma SQLite path locally, Turso/Supabase DSN in production |

Prisma's SQLite URL format uses `file:` prefix (different from SQLAlchemy's `sqlite:///`).

```env
# .env (local)
DATABASE_URL="file:./prisma/dev.db"

# Vercel production (Turso example)
DATABASE_URL="libsql://[your-db].turso.io?authToken=[your-token]"
```

---

## 12. Vercel Deployment (Simplified)

Next.js on Vercel is the native combination — no `vercel.json` routing config is needed at all.

### Steps

1. Delete `vercel.json` (no longer needed)
2. Run `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"` to scaffold
3. Set `DATABASE_URL` in Vercel dashboard → Project Settings → Environment Variables
4. Push to `main` — Vercel auto-detects Next.js and deploys

### Database on Vercel

Same two options as the Python backend, now configured for Prisma:

**Turso (recommended MVP):**
```bash
npm install @prisma/adapter-libsql @libsql/client
# Update schema.prisma: provider = "libsql"
DATABASE_URL="libsql://[your-db].turso.io?authToken=[your-token]"
```

**Supabase / PostgreSQL:**
```bash
# Update schema.prisma: provider = "postgresql"
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

Run `prisma db push` or `prisma migrate deploy` as a build step before deployment.

---

## 13. Testing (PRD §12 Alignment)

The unit tests in PRD §12 are written in TypeScript/Jest syntax and test functions like `validateSkillLevel()`, `generateTeams()`, `swapMembers()`, `exportToSlack()`, etc. These tests now run **directly** against the ported TypeScript implementations in `src/lib/` with no translation layer.

```bash
# Run all unit tests
npx vitest

# Run algorithm tests only
npx vitest src/tests/randomizer.test.ts

# Run with coverage
npx vitest --coverage
```

---

## 14. Files to Delete from Python Implementation

Once the Next.js implementation is complete and all tests pass, remove:

```
app/                   # Entire Python package
api/index.py           # Replaced by Next.js API routes
vercel.json            # No longer needed
requirements.txt       # Replaced by package.json
pyproject.toml         # Replaced by package.json
uv.lock                # Replaced by package-lock.json
main.py                # Replaced by Next.js
.venv/                 # Python virtual environment
.python-version        # Python version pin
```

Keep:
- `docs/` — documentation including this file and updated `learn.md`
- `.env.example` — update `DATABASE_URL` format for Prisma
- `.gitignore` — update for Node.js (add `node_modules/`, `prisma/dev.db`, `.next/`)
- `.claude/CLAUDE.md` — PRD is unchanged

---

## 15. Implementation Order

Build in this sequence to maintain a working state at each step:

1. **Scaffold** — `create-next-app`, install dependencies, configure Tailwind + TypeScript
2. **Prisma schema** — define schema, run `prisma db push`, generate client
3. **`src/lib/` (business logic)** — port `randomizer.ts`, `export.ts`, `validators.ts` — write unit tests immediately
4. **API routes** — implement all routes in `src/app/api/`, test with `/docs` equivalent (e.g. Postman or `curl`)
5. **Zustand stores** — `teamsStore`, `randomizerStore`
6. **UI components** — `MemberCard`, `TeamCard`, `WorkloadBadge`, `WeeklyScheduleGrid`
7. **Pages** — Profile → Randomizer → Teams (drag-to-swap) → Presets
8. **Export UI** — `ExportMenu` wired to `/api/export`
9. **Delete Python code** — clean up after all E2E tests pass
10. **Deploy to Vercel** — set `DATABASE_URL`, push, verify `/api/health`

---

## 16. Auth + Member Model Simplification (2026-03-17)

**Status:** Implemented
**Scope:** Auth, member data model, member pages

### 16.1 Google SSO via Auth.js (NextAuth v5)

Added Google SSO authentication using Auth.js (NextAuth v5) with the Prisma adapter.

**Key design decisions:**

| Decision | Rationale |
|---|---|
| Split-config pattern (`auth.config.ts` + `auth.ts`) | Next.js middleware runs in the Edge runtime, which cannot import Prisma. `auth.config.ts` is edge-safe (no Prisma); `auth.ts` is Node.js-only (with Prisma adapter). |
| `session: { strategy: "jwt" }` | Prisma adapter defaults to database sessions; using JWT sessions avoids a `JWTSessionError` when middleware and API routes use different session strategies. |
| `lh3.googleusercontent.com` in `next.config.ts` `remotePatterns` | Required for `next/image` to render Google profile avatars. |

**New files:**
- `src/auth.config.ts` — edge-safe config (providers, redirect rules)
- `src/auth.ts` — full auth with Prisma adapter + JWT callbacks
- `src/middleware.ts` — route protection using edge-safe config
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js handler
- `src/components/providers/SessionProvider.tsx` — client-side session provider
- `src/app/(auth)/login/page.tsx` — "Sign in with Google" page
- `src/lib/authUtils.ts` — `requireAuth()` helper for API routes
- `src/types/next-auth.d.ts` — session type augmentation (`session.user.id`)

**Prisma schema additions:** `User`, `Account`, `Session`, `VerificationToken` models (Auth.js required models).

### 16.2 Removal of Admin Role Distinction

v1 does not require role-based access control. All authenticated users have identical permissions.

**Changes:**
- Removed `isAdmin` field from `Member` model in Prisma schema and TypeScript types
- Removed `requireAdmin()` helper — replaced with `requireAuth()` everywhere
- All API routes now only check that the user is signed in (no admin gate)
- Navbar shows all links to all authenticated users — no conditional rendering based on role

### 16.3 Member Model: Self-Service Profile → Multi-Member-per-User

**Old model (1:1 User → Member):**
Each user had exactly one Member profile representing themselves. The `/profile` page was the single entry point for a user to declare their own details.

**New model (1:many User → Member):**
Any authenticated user can add multiple members to the pool. Each Member has a `userId` FK pointing to the creating user, but `userId` is no longer unique — one user can own many members.

**Motivation:**
IT department leads often need to register an entire team's worth of members, not just themselves. The self-service model required every person to log in, which created friction. The new model lets a single user (e.g., the team lead) bulk-add all members they manage.

**Schema change:**
```prisma
// Before
model User {
  member Member?  // 1:1 unique
}
model Member {
  userId String @unique
}

// After
model User {
  members Member[]  // 1:many
}
model Member {
  userId String     // no @unique — multiple members per user allowed
}
```

**Page changes:**
- Removed: `src/app/(member)/profile/page.tsx` (self-service profile form)
- Added: `src/app/(member)/members/page.tsx` — member pool table with Remove button
- Added: `src/app/(member)/members/add/page.tsx` — Add Member form (reuses `ProfileForm`)
- Updated: Navbar `"My Profile"` link → `"Members"` link pointing to `/members`
