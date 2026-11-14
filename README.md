# THE SOURCE

> **"Everything you create comes from something."**

**THE SOURCE** is a private, sovereign creative knowledge management platform built specifically for artists, musicians, songwriters, rappers, writers, and creative thinkers. It provides a sanctuary where creators capture raw ideas, preserve fleeting inspirations, organize knowledge fluidly, connect disparate thoughts, and turn sparks into finished works—with complete privacy and ownership.

---

## Phase 0: Project Foundation

This repository contains the completed **Phase 0: Project Foundation and Architecture**. It establishes a secure, scalable, and maintainable foundation that all future creative features will build upon.

### Core Philosophy

- **Absolute Creator Sovereignty**: Everything a creator captures belongs to them alone.
- **Frictionless Capture**: Immediate ingestion without cognitive friction.
- **Organic Knowledge Graphs**: Connections between ideas are intentional and user-controlled.
- **Zero AI Interference**: AI never silently alters content and never writes creative work on the user's behalf.
- **Privacy & Isolation**: Enforced at the database level through PostgreSQL Row Level Security (RLS).

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) App Router (React 19, Server Components first)
- **Language**: TypeScript (Strict Mode enabled)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom dark editorial design tokens & [shadcn/ui](https://ui.shadcn.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Supabase Storage)
- **Client Libraries**: `@supabase/supabase-js`, `@supabase/ssr`
- **Validation**: [Zod](https://zod.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) with `@hookform/resolvers/zod`
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons & Feedback**: [Lucide React](https://lucide.dev/) & [Sonner](https://sonner.emilkowal.ski/)
- **Testing**: [Vitest](https://vitest.dev/), React Testing Library, and [Playwright](https://playwright.dev/)

All dependency versions are pinned in `package.json` and locked in `package-lock.json`.

---

## Project Structure

```
the-source/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx         # Editorial auth container with branding
│   │   │   ├── login/page.tsx     # Studio entrance
│   │   │   └── signup/page.tsx    # Private workspace registration
│   │   ├── (workspace)/
│   │   │   ├── layout.tsx         # Authenticated server layout & boundary
│   │   │   └── overview/page.tsx  # Studio overview & capture placeholder
│   │   ├── auth/
│   │   │   └── callback/route.ts  # Session exchange & workspace onboarding
│   │   ├── globals.css            # Dark editorial tokens & CSS variables
│   │   ├── layout.tsx             # Root layout with dark theme & Toaster
│   │   └── page.tsx               # Studio landing page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx        # Navigation with active & coming-soon links
│   │   │   ├── user-nav.tsx       # Profile menu & secure logout
│   │   │   ├── workspace-header.tsx # Workspace title & status indicators
│   │   │   └── workspace-shell.tsx  # Responsive desktop/mobile shell
│   │   └── ui/                    # Editorial UI primitives (Button, Input, Card, etc.)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── actions.ts         # Server Actions: signup, login, logout
│   │   │   └── components/        # LoginForm, SignupForm
│   │   └── workspaces/
│   │       ├── queries.ts         # Server-side workspace context retrieval
│   │       ├── service.ts         # Idempotent personal workspace onboarding
│   │       └── types.ts           # Workspace & Profile domain types
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser Supabase client
│   │   │   ├── middleware.ts      # SSR session cookie refresher & route guard
│   │   │   └── server.ts          # Server Supabase client (cookies)
│   │   ├── utils.ts               # Classnames helper (cn)
│   │   └── validation/            # Zod validation schemas (auth, workspace)
│   ├── middleware.ts              # Next.js route protection middleware
│   ├── stores/                    # Zustand stores (workspace-store.ts)
│   └── types/
│       └── database.types.ts      # Typed PostgreSQL schema & relationships
├── supabase/
│   ├── migrations/
│   │   └── 20261113102406_initial_schema.sql # 9 tables, RLS, Storage & triggers
│   ├── config.toml                # Supabase local environment config
│   └── seed.sql                   # Seed script
├── tests/
│   ├── e2e/
│   │   └── auth-flow.spec.ts      # Playwright end-to-end tests
│   ├── integration/
│   │   └── database-migration.test.ts # Migration verification suite
│   ├── unit/
│   │   ├── auth-validation.test.ts    # Zod schema validation tests
│   │   ├── isolation-security.test.ts # Multi-tenant isolation tests
│   │   ├── middleware-protection.test.ts # Route guard behavior tests
│   │   ├── session-persistence.test.ts   # Cookie & session lifecycle tests
│   │   └── workspace-creation.test.ts    # Workspace creation & idempotency
│   └── setup.ts                   # Vitest DOM & navigation mocks
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Database Architecture

The Phase 0 migration (`supabase/migrations/20261113102406_initial_schema.sql`) establishes nine application tables:

1. **`profiles`**: User identities, linked to `auth.users` on delete cascade.
2. **`workspaces`**: Creative workspaces. Includes a partial unique index on `(owner_id) WHERE is_personal = TRUE` to enforce that each creator has exactly one personal workspace.
3. **`items`**: The core content unit (thoughts, lyrics, recordings, journals, references, notes) with full-text search vector triggers. Includes composite unique constraint `(workspace_id, id)`.
4. **`item_assets`**: File metadata referencing Supabase Storage. Uses composite foreign key `(workspace_id, item_id)` to mathematically eliminate cross-workspace references.
5. **`tags`**: Workspace-scoped creative tags with unique `(workspace_id, name)`.
6. **`item_tags`**: Many-to-many tag links with dual composite foreign keys ensuring item and tag share the exact same workspace.
7. **`collections`**: Hierarchical organizational folders/projects with self-referencing composite foreign key.
8. **`collection_items`**: Ordered collection item references.
9. **`item_connections`**: Directed and bidirectional creative relationships between items. Includes `CHECK (source_item_id <> target_item_id)` to forbid self-connections, and a unique index on `(workspace_id, LEAST(source, target), GREATEST(source, target), relationship_type)` to eliminate duplicate equivalent connections.

### Row Level Security (RLS)

- Enabled on **all 9 application tables**.
- Evaluated via a security-definer helper `public.is_workspace_owner(workspace_id)`.
- Updates enforce both `USING` and `WITH CHECK` clauses.
- Only authenticated users can read, insert, update, or delete records in their own workspaces.

### Supabase Storage

- **Bucket**: `source-assets` (private, non-public).
- **Upload Limit**: 50 MB (52,428,800 bytes).
- **Allowed MIME types**: Images (`jpeg`, `png`, `webp`, `gif`, `svg`), Audio (`mpeg`, `wav`, `ogg`, `mp4`, `x-m4a`, `flac`), Documents (`pdf`, `text/plain`, `text/markdown`).
- **Object Path Format**: `workspace_id/item_id/unique-filename`
- **Storage Policies**: RLS on `storage.objects` extracts `split_part(name, '/', 1)` as `workspace_id` and restricts read/write/delete permissions strictly to the workspace owner.

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- npm v10 or higher

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Automated Testing

### Unit & Integration Tests (Vitest)

Execute the 37 test specifications across all 6 test suites:

```bash
npm run test
```

Test coverage includes:
- Zod schema input validation
- Route protection middleware logic
- Workspace creation and duplicate prevention service
- Database and Storage ownership isolation across multiple test accounts
- Session persistence and cookie handling
- SQL migration integrity verification

### End-to-End Tests (Playwright)

Run the Playwright test suite against the application:

```bash
npm run test:e2e
```

### Production Build & Linting

```bash
npm run lint
npm run build
```

---

## Phase 1 Roadmap

With the foundational architecture locked down, **Phase 1: Multi-Modal Capture** will introduce:
- Quick voice note recording and audio preview
- Distraction-free lyrical draft editor
- Reference bookmarks and clipping
- Tagging and instant item indexing
