<!-- BEGIN:nextjs-agent-rules -->

# Ping-Me — Frontend Agent Context

This file documents architectural decisions, conventions, and patterns for the Ping-Me chat application. Tech stack and folder structure are documented separately — this file covers the *why* and *how* behind implementation choices, so any agent working in this repo makes consistent decisions.

## Tech Stack

| Layer                  | Choice                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Framework              | Next.js (App Router) + React 19                                                                                       |
| Language               | TypeScript                                                                                                            |
| Styling                | Tailwind CSS v4 + shadcn/ui                                                                                           |
| Theme                  | Dual light/dark mode with glassmorphism (`backdrop-blur`, translucent borders, glowing accents) via `next-themes` |
| Animations             | Framer Motion — restricted to page transitions, modals, and sidebar toggles (no list-item/hot-path animations)       |
| Global state           | Redux Toolkit — scoped to chat domain (messages, presence, typing, unread counts)                                    |
| REST client            | Axios (interceptors for auth/refresh tokens)                                                                          |
| Form + validation      | react-hook-form + Zod (`@hookform/resolvers`)                                                                       |
| Real-time client       | `socket.io-client` — abstracted for backend event subscriptions                                                    |
| Message list rendering | `@tanstack/react-virtual` — infinite scroll + cursor-based pagination                                              |
| Search                 | Debounced (300ms) + minimum 2-character threshold + Axios cancel token for stale-response handling                    |

## Folder Structure

```text
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (chat)/
│   │   ├── layout.tsx               # sidebar + main chat shell
│   │   ├── page.tsx                 # default/empty chat state
│   │   └── [conversationId]/page.tsx # active conversation view
│   ├── layout.tsx                   # root layout, ThemeProvider, Redux Provider
│   ├── globals.css
│   └── favicon.ico
│
├── components/
│   ├── ui/                          # shadcn/ui generated components
│   ├── chat/                        # MessageList, MessageItem, Input, Sidebar, etc.
│   ├── search/
│   └── theme/
│
├── common/                          # generic reusable components
├── constants/
├── features/                        # Redux Toolkit slices (auth, messages, presence)
├── hooks/
├── lib/
├── services/                        # API calls
├── store/
├── schemas/                         # Zod schemas matching backend Pydantic
├── types/
└── middleware.ts                    # route protection (auth check)
│
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local
└── package.json
```

## Core Architectural Principles

- **Domain-based structure, not type-based.** Both frontend (`features/`, `services/`) and backend (`app/auth/`, `app/messages/`, etc.) are organized by business domain, not by technical layer. When adding new functionality, colocate router/schema/service/repository (backend) or slice/thunk/service (frontend) within the relevant domain folder rather than a shared `routers/`, `models/`, `schemas/` split.
- **Business logic must be reusable across entry points.** Backend service-layer functions (e.g. `messages/service.py`) must be callable from both HTTP routes *and* Socket.IO event handlers — never bury logic directly inside a router function, since the same "send message" flow needs to run whether triggered via REST or a socket event.
- **Thin routers, thin components.** Routers/pages orchestrate; services/hooks contain logic.

## Pagination

- **Cursor-based, not offset-based**, for all message history endpoints.
- Cursor shape: composite `(created_at, id)` — timestamp alone isn't unique enough (ties), so `id` is the tiebreaker.
- Cursor is passed to clients as an opaque encoded string; clients never construct or parse it manually.
- Requires a composite index matching the cursor + filter columns: `(conversation_id, created_at, id)`.
- Real-time message delivery (via sockets) and paginated history fetches are two separate paths that both feed the same in-memory message list on the frontend — do not try to unify them into one query pattern.

## Search

- **Search-as-you-type** pattern: debounce (~300ms) on the frontend before firing a request, plus a minimum 2-character threshold, plus request cancellation (Axios cancel token) so stale responses never overwrite newer ones.
- Debounce controls *how many requests* are sent; cancellation controls *which response* is trusted — both are required, neither alone is sufficient.
- Backend search uses **PostgreSQL `pg_trgm`** (trigram) with GIN indexes on searchable text columns (`messages.content`, `users.display_name`), not plain `ILIKE` on an unindexed column and not `tsvector` full-text search (which is word-boundary based and doesn't support the mid-word/substring matching expected from instant search).
- Default to **prefix matching** (`'query%'`) for contact/username search — this matches user expectation (autocomplete-style) and is what most production chat apps do. Substring matching (`'%query%'`) remains available via the same trigram index if a broader "search anywhere" feature is added later.
- If search needs outgrow what Postgres trigram indexes can comfortably serve (very large message volume, need for typo-tolerance/relevance ranking), the next step is a dedicated search engine (Typesense/Meilisearch) fed via a background indexing job — not Elasticsearch, unless already justified by other infra needs.

## API Design

- REST endpoints are the source of truth for CRUD operations.
- Socket.IO exists for real-time synchronization, not as a replacement for REST.
- If an operation modifies persistent state (create/edit/delete), the business logic must live in the service layer and be callable from both REST and Socket.IO.
- HTTP endpoints should remain idempotent where appropriate.
- Socket events should only broadcast state changes after successful database commits.

## Repository Layer

- Repository classes are the only layer allowed to execute SQLAlchemy queries.
- Services coordinate repositories and enforce business rules.
- Routers and Socket handlers must never contain SQLAlchemy queries.
- Repository methods should return ORM models, not HTTP responses.

## Real-Time Layer

- **Socket.IO** (not raw WebSocket, not MQTT) is used end-to-end — `socket.io-client` on the frontend, `python-socketio` mounted as an ASGI app alongside FastAPI on the backend.
- Rationale: Socket.IO gives rooms (per-conversation channels), automatic reconnection, and a Redis adapter for multi-instance scaling out of the box, without introducing a separate broker (as MQTT would require). MQTT's advantages (extreme low overhead, guaranteed delivery QoS) matter at a scale and network-reliability profile this project isn't optimizing for yet.
- Redis serves two roles: (1) Socket.IO's adapter for scaling across multiple backend instances, (2) ephemeral state — typing indicators, online presence — that doesn't belong in Postgres.
- Socket event names must be referenced via `constants/socket-events.ts` on the frontend — never raw string literals — to prevent typo-driven silent failures.
- Socket event payload shapes are typed in `types/socket.ts` (frontend) and should mirror whatever shape the backend event handlers actually emit — keep these in sync manually, the same way `schemas/` mirrors REST response shapes.

## Socket Events

**Client → Server**

- `message_send`
- `typing_start`
- `typing_stop`
- `conversation_read`
- `message_delivered`

**Server → Client**

- `message_new`
- `typing`
- `message_read`
- `messages_delivered`
- `user_online`
- `user_offline`

New events must be added to `constants/socket-events.ts` (frontend) and documented here — this list is the single source of truth for what events exist.

## Message Ordering

- History endpoints always return newest → oldest.
- Frontend reverses only when required for rendering.
- Socket-delivered messages are appended in chronological order.
- Cursor pagination always follows the database ordering.

## Database & Migrations

- **SQLAlchemy 2.0 async** (`asyncpg` driver) for the application runtime. **Alembic stays fully synchronous** (`psycopg2-binary` driver) for migrations — these are two deliberately separate code paths, not a mismatch to "fix." Both drivers must remain in `requirements.txt` simultaneously.
- `DATABASE_URL` is stored driverless in `.env` (`postgresql://...`); the async engine constructs its own `postgresql+asyncpg://` variant explicitly at the config layer rather than via runtime string-patching scattered through the codebase.
- Always review autogenerated Alembic migrations before applying — autogenerate reliably catches table/column diffs but can miss type changes, constraints, or anything requiring raw SQL (e.g. `CREATE EXTENSION`), which must be written manually.
- Timestamp fields (`created_at`, `updated_at`) use `server_default=func.now()` — meaning the value is populated by Postgres at insert time, not available on the Python object until after a flush/refresh. When one row's timestamp needs to be copied to another in the same transaction (e.g. bumping `conversation.updated_at` when a message is created), use `func.now()` directly on both rather than reading `.created_at` off an unflushed object.

## Auth

- JWT access + refresh token pair, encoded/decoded via `python-jose`, passwords hashed via `passlib` (bcrypt).
- Frontend attaches/refreshes tokens via Axios interceptors (`lib/axios.ts`), not manually per-request.
- `sender_id` / `user_id` on any write operation (e.g. sending a message) must come from the authenticated session (`get_current_user`), never accepted as a client-supplied field in the request body.

## Frontend Data Flow

**REST**

```
Server → Axios Service → Redux Thunk → Redux Slice → React Component
```

**Socket.IO**

```
Server Event → useSocket() → Redux Slice → React Component
```

REST and Socket.IO are two distinct paths that both terminate in the same Redux slices — never merge them into one code path, and never call a service function directly from a socket handler without going through the slice.

## Optimistic Updates

- Sending a message should immediately render a temporary message in the UI.
- The server response replaces the temporary message.
- Failed sends revert the optimistic state.
- Read receipts and delivery receipts are never optimistic.

## State Management (Frontend)

- Redux Toolkit is scoped to the **chat domain only** — live messages, presence, typing state, unread counts. Not used for local UI state (modal open/closed) or form state (owned by `react-hook-form` + Zod).
- Socket events dispatch directly into Redux slices via a dedicated `useSocket` hook — this is the live-update path, separate from the paginated-fetch path (see Pagination above).

## Validation

- Zod schemas (frontend) and Pydantic schemas (backend) should mirror each other's shape/field names as closely as possible to reduce integration mismatches — treat schema drift between the two as a bug.

## Error Handling

- Services raise domain exceptions.
- Routers translate exceptions into HTTP responses.
- Socket handlers emit error events rather than crashing connections.
- Never swallow exceptions silently.

## Naming

**Backend** (per domain folder)

- `router.py`
- `service.py`
- `repository.py`
- `schemas.py`
- `socket_schemas.py`

**Frontend**

- `*.service.ts`
- `*.slice.ts`
- `*.thunks.ts`
- `*.schema.ts`
- `use*.ts`

## Testing

- REST endpoints should be testable independently of Socket.IO.
- Socket events should reuse service-layer logic.
- Business rules must never exist only in socket handlers.

## Performance

- Message list rendering uses `@tanstack/react-virtual` — only visible messages are rendered to DOM. Any new list-heavy UI (search results, conversation list at scale) should default to virtualization rather than rendering full arrays. Virtualize any list expected to exceed ~100 items.
- Framer Motion is restricted to page transitions, modals, and sidebar toggles. Do not animate individual list items (messages, search results) — this is a deliberate performance boundary, not an oversight.
- Avoid unnecessary Redux updates; normalize Redux state once collections become large.
- Avoid re-rendering entire message lists — memoize expensive selectors.

## File Uploads (Future)

- Files are stored in object storage (e.g., S3-compatible), not in Postgres.
- Postgres stores metadata only.
- Socket events transmit metadata, never binary payloads.

<!-- END:nextjs-agent-rules -->
