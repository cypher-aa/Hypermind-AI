# HyperMind AI

A production-style AI SaaS workspace with 5 specialized Gemini-powered agents, persistent memory, conversation history, prompt templates, and file management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/hypermind-ai run dev` — run the frontend (Vite, port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS v4 + shadcn/ui (dark theme by default)
- API: Express 5 (artifacts/api-server, port 8080)
- DB: PostgreSQL + Drizzle ORM (lib/db)
- AI: Gemini 2.5 Flash via Replit AI Integration (@workspace/integrations-gemini-ai)
- Auth: JWT via jsonwebtoken + bcryptjs (Authorization: Bearer header)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval from OpenAPI spec (lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle for server)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `lib/db/src/schema/` — Drizzle ORM schema (users, conversations, messages, memory, templates, files)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks + Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers (auth, gemini, agents, memory, templates, files, dashboard)
- `artifacts/hypermind-ai/src/pages/` — React pages (auth, dashboard, chat, conversation, agents, memory, templates, files)
- `artifacts/hypermind-ai/src/components/Layout.tsx` — sidebar + responsive shell
- `artifacts/hypermind-ai/src/contexts/` — AuthContext (JWT), ThemeContext (dark/light)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks. Never write fetch calls manually.
- Streaming AI responses over SSE (text/event-stream). Server writes `data: {"content":"..."}` chunks; client reads via `ReadableStream`.
- JWT stored in `localStorage`; wired globally via `setAuthTokenGetter()` in `main.tsx` so all generated hooks auto-attach the auth header.
- Gemini conversations are scoped to an agent via `agentId` column on the conversations table. Agent system prompts live in `artifacts/api-server/src/lib/agents.ts`.
- `@google/genai` must be a direct dependency of `api-server` (not just a transitive dep from `integrations-gemini-ai`) because esbuild externalizes it and Node needs to resolve it at runtime from the artifact's dist directory.

## Product

- **Auth**: Register/login with email+password; JWT-based sessions
- **5 Agents**: Coding 💻, Research 🔬, Career 💼, Learning 📚, General ✨ — each with a specialized system prompt
- **AI Chat**: Streaming conversations powered by Gemini 2.5 Flash; stop mid-stream
- **Memory**: Save facts/preferences/skills/goals that the AI can reference; tag + categorize
- **Templates**: 12 built-in + custom prompt templates; one-click into chat
- **Files**: Upload and manage file metadata (images, PDFs, code, text)
- **Dashboard**: Stats overview, quick agent launch, recent activity

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` — the generated hooks must stay in sync.
- `pnpm --filter @workspace/db run push` must be run after schema changes to apply them to the dev DB.
- Do NOT run `pnpm dev` at the workspace root.
- `@google/genai` must be in `artifacts/api-server/package.json` dependencies (not just lib/integrations-gemini-ai) for the runtime to find it after esbuild externalizes it.
- Conversations table export is `conversations` (not `conversationsTable`) from the Gemini template; both names are exported for compatibility.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
