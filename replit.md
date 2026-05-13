# Nexus AI — WhatsApp AI Assistant SaaS

A full-stack SaaS dashboard that lets shop owners connect WhatsApp via QR code and use AI to auto-reply to customers based on business info and product catalog.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/whatsapp-ai run dev` — run the React frontend (port 21603)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + framer-motion + recharts + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — all DB schema tables (business, products, customers, conversations, messages, orders, ai_config, faqs, notifications, settings, whatsapp_sessions)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/whatsapp-ai/src/pages/` — all 12 frontend pages
- `artifacts/whatsapp-ai/src/components/` — layout + shadcn/ui components

## Architecture decisions

- Contract-first API design: OpenAPI spec → Orval codegen → typed hooks on frontend
- Drizzle numeric columns (`decimal`) require explicit `String()` conversion on JS numbers before `.set()` calls
- All routes are prefixed `/api/*` and served via a shared reverse proxy
- Dark theme enforced via `document.documentElement.classList.add("dark")` in App.tsx
- Emotion detection state stored per-customer and per-conversation for AI escalation logic

## Product

12-page SaaS dashboard covering:
1. **Dashboard** — live KPI overview (active chats, AI rate, human takeovers, customers)
2. **WhatsApp Connect** — QR code connection flow + session status
3. **Live Chat** — real-time conversation viewer with AI/human toggle, takeover, pause/resume
4. **Notifications** — urgent + prioritized alert feed with mark-read actions
5. **Customers** — manage VIP/blocked status, per-customer AI enable, internal notes
6. **Orders** — order status management with status-change select controls
7. **Products** — full catalog CRUD with grid/list view toggle
8. **Business Profile** — business info form for AI context
9. **AI Training** — tone selector, confidence threshold, custom instructions, FAQs
10. **Analytics** — area charts, pie chart, top questions, KPI stats (recharts)
11. **Settings** — global AI toggle, handover sensitivity, working hours, auto messages
12. **Billing** — plan comparison, usage meters, payment history

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After adding new DB schema tables, run `pnpm run typecheck:libs` to rebuild lib declarations before typechecking artifact packages
- Drizzle `numeric` columns are TypeScript `string` at the type level — always convert JS numbers with `String()` before `.set()`
- Do NOT run `pnpm dev` at workspace root — use workflows or `pnpm --filter` commands
- `pnpm --filter @workspace/<slug> run typecheck` is the correct verification command (not `build`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- API hooks: import from `@workspace/api-client-react` — all hooks generated from OpenAPI spec
- Theme: `--primary` = `#25D366` (WhatsApp green), dark background `#0A0A0B`
