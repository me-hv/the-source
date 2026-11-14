# THE SOURCE

> **"Everything you create comes from something."**

**THE SOURCE** is a private, sovereign creative knowledge management platform built specifically for artists, musicians, songwriters, rappers, writers, and creative thinkers. It provides a sanctuary where creators capture raw ideas, preserve fleeting inspirations, organize knowledge fluidly, connect disparate thoughts, and turn sparks into finished works—with complete privacy and ownership.

---

## Current Status: Phase 1 Complete (Multi-Modal Capture Engine)

This repository contains **Phase 0: Project Foundation** and **Phase 1: Multi-Modal Capture Engine**.

### Core Philosophy

- **Absolute Creator Sovereignty**: Everything a creator captures belongs to them alone.
- **Frictionless Capture**: Immediate ingestion without cognitive friction or mandatory categorisation.
- **Organic Knowledge Graphs**: Connections between ideas are intentional and user-controlled.
- **Zero AI Interference**: AI never silently alters content and never writes lyrics or creative work on the user's behalf.
- **Privacy & Isolation**: Enforced at the database level through PostgreSQL Row Level Security (RLS) and storage path isolation.

---

## Phase 1: Multi-Modal Capture Capabilities

The Capture Engine enables authenticated creators to save ideas instantly across 5 distinct modalities:

### 1. Text Notes & Creative Drafts
- **Editor**: Rich-text editing powered by [Tiptap](https://tiptap.dev/) with Markdown shortcuts.
- **Data Model**: Stores canonical ProseMirror document JSON in `items.rich_content`, searchable plain text in `items.content`, and Markdown in `items.content_markdown`.
- **Autosave & Draft Safety**: Dual-layer resilience combining synchronous `localStorage` caching with debounced (1500ms) server autosave.
- **Race Condition Prevention**: Monotonic sequence tracking discards out-of-order in-flight server responses.

### 2. Audio Capture (Microphone Recording & Audio Uploads)
- **Browser MediaRecorder**: Native microphone recording with automated browser MIME type detection (`audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`).
- **Controls**: Live recording timer (`MM:SS`), pause, resume, re-record, and native audio playback preview.
- **Audio File Ingestion**: Drag-and-drop or file picker for existing audio tracks and stems (`mp3`, `wav`, `m4a`, `ogg`, `flac`).
- **Storage**: Uploaded directly to private Supabase Storage (`source-assets`) with secure signed URLs.

### 3. Visual References & Image Ingestion
- Supported formats: JPEG, PNG, WebP, GIF, SVG (up to 50 MB limit).
- Instant local preview before uploading.
- Title override with automatic fallback to original filename.

### 4. Document & Creative Asset Ingestion
- Supported formats: PDF, TXT, Markdown.
- Client-side and server-side file size and MIME-type validation.
- Sanitized filenames preventing directory traversal (`../../`).

### 5. Inspiration Link Bookmarking
- Captures URLs with automatic server-side metadata extraction (HTML `<title>` and `og:description`).
- **SSRF Hardening**: Rejects loopbacks (`localhost`, `127.0.0.1`, `[::1]`), internal subnets (RFC 1918 `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs (`169.254.0.0/16`), and AWS/GCP cloud metadata endpoints.

### Global Quick Capture Shortcut
- Accessible from anywhere in the workspace via `Ctrl + K` (Windows/Linux) or `Cmd + K` (macOS).
- Direct triggers in the workspace sidebar navigation and the Overview page launchpad.
- Tab switching preserves in-progress drafts across capture types.

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) App Router (React 19, Server Components first)
- **Language**: TypeScript (Strict Mode enabled)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with dark editorial design tokens & [shadcn/ui](https://ui.shadcn.com/)
- **Rich-Text Engine**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/markdown`
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
│   │   │   └── overview/page.tsx  # Studio overview with Recent Captures & launchpad
│   │   ├── auth/
│   │   │   └── callback/route.ts  # Session exchange & workspace onboarding
│   │   ├── globals.css            # Dark editorial tokens & CSS variables
│   │   ├── layout.tsx             # Root layout with dark theme & Toaster
│   │   └── page.tsx               # Studio landing page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx        # Navigation with Quick Capture trigger & kbd badge
│   │   │   ├── user-nav.tsx       # Profile menu & secure logout
│   │   │   ├── workspace-header.tsx # Workspace title & status indicators
│   │   │   └── workspace-shell.tsx  # Responsive shell with global QuickCaptureDialog
│   │   └── ui/                    # Editorial UI primitives (Button, Dialog, Input, etc.)
│   ├── features/
│   │   ├── auth/                  # Authentication Server Actions & forms
│   │   ├── capture/               # Phase 1: Multi-Modal Capture Engine
│   │   │   ├── actions.ts         # Server Actions: saveText, saveLink, prepareUpload, finalizeUpload
│   │   │   ├── components/        # TiptapEditor, AudioCapture, ImageCapture, FileCapture, LinkCapture
│   │   │   ├── hooks/             # useAudioRecorder, useDraftPersistence, useCaptureShortcut
│   │   │   ├── services/          # upload-service.ts (Storage orchestrator with cleanup)
│   │   │   ├── types.ts           # Capture domain types
│   │   │   └── validation/        # Zod schemas (textCapture, linkCapture, fileMeta, SSRF check)
│   │   ├── items/
│   │   │   ├── components/        # RecentCaptures feed with audio player & signed image URLs
│   │   │   └── queries.ts         # Server-side item queries with signed storage URLs
│   │   └── workspaces/            # Workspace queries and onboarding
│   ├── lib/
│   │   ├── supabase/              # Browser, server, and middleware Supabase clients
│   │   └── utils.ts               # Classnames helper (cn)
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
│   │   ├── auth-flow.spec.ts      # Playwright auth flow E2E tests
│   │   └── capture-flow.spec.ts   # Playwright capture flow E2E tests
│   ├── integration/
│   │   ├── capture-actions.test.ts    # Capture server actions integration test
│   │   └── database-migration.test.ts # Migration verification suite
│   ├── unit/
│   │   ├── audio-recorder.test.ts     # MediaRecorder lifecycle & timer tests
│   │   ├── auth-validation.test.ts    # Zod schema validation tests
│   │   ├── capture-validation.test.ts # Capture schemas, sanitizeFilename, SSRF tests
│   │   ├── draft-persistence.test.ts  # LocalStorage & debounced autosave tests
│   │   ├── isolation-security.test.ts # Multi-tenant isolation tests
│   │   ├── keyboard-shortcut.test.ts  # Ctrl+K / Cmd+K listener tests
│   │   ├── middleware-protection.test.ts # Route guard behavior tests
│   │   ├── session-persistence.test.ts   # Cookie & session lifecycle tests
│   │   ├── tiptap-editor.test.ts      # Tiptap canonical JSON & plaintext tests
│   │   └── workspace-creation.test.ts # Workspace creation & idempotency
│   └── setup.ts                   # Vitest DOM & navigation mocks
```

---

## Database & Storage Architecture

### Schema Mapping for Capture
- **`items.kind`**: Phase 0 CHECK constraint allows `'note'`, `'journal'`, `'reference'`.
  - Text notes, audio recordings, images, and files are saved with `kind: 'note'`.
  - Inspiration links are saved with `kind: 'reference'`.
- **`items.content_type`**: Reflects the medium: `'text'`, `'audio'`, `'image'`, `'file'`, `'link'`.
- **`items.rich_content`**: Stores the canonical JSON structure from Tiptap.
- **`items.content`**: Contains raw searchable plain text or external link URL.
- **`items.content_markdown`**: Contains Markdown serialization for export.
- **`item_assets`**: Links files in private Supabase Storage via `(workspace_id, item_id)` foreign key.

### Private Supabase Storage
- **Bucket**: `source-assets` (private, non-public).
- **Upload Limit**: 50 MB (52,428,800 bytes).
- **Storage Path Pattern**: `{workspace_id}/{item_id}/{sanitized_filename}`.
- **Security & Signed URLs**: Direct public access is disabled. Signed URLs with 1-hour expiration are generated server-side strictly after validating workspace ownership.
- **Failure Cleanup**: `deleteIncompleteCaptureAction` removes orphaned storage objects and draft database records if an upload fails midway.

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

## Automated Testing Suite

### Unit & Integration Tests (Vitest)

Execute the 99 test specifications across all 12 test suites:

```bash
npm run test
```

Test coverage includes:
- **`capture-validation.test.ts`**: Validates text, link, file, audio, and image schemas, filename sanitization, and SSRF address filtering.
- **`audio-recorder.test.ts`**: MediaRecorder lifecycle (start, pause, resume, stop, error), MIME negotiation, timer formatting.
- **`draft-persistence.test.ts`**: LocalStorage draft caching, debounced autosave sequencing, race-condition mitigation.
- **`tiptap-editor.test.ts`**: Canonical ProseMirror document JSON and plain searchable text generation.
- **`keyboard-shortcut.test.ts`**: `Ctrl+K` and `Cmd+K` global keyboard shortcut handling.
- **`capture-actions.test.ts`**: Server actions for text save, draft save, link bookmarking, SSRF checks, storage path generation, signed URL creation, and cleanup.
- **Phase 0 Suites**: Migration verification, multi-tenant isolation, route protection middleware, auth validation, session persistence, workspace creation.

### End-to-End Tests (Playwright)

Execute the Playwright test suite against the built application:

```bash
npm run test:e2e
```

### Production Build & Linting

```bash
npm run lint
npm run build
```

---

## Phase 2 Roadmap

Future phases will build upon this capture engine:
- Full-text search and filtering across captured items
- Creative Collections and organization
- Intentional item connections and relationship graphing
- Creative Journal mode
- Creative export and sharing
