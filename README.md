# Ping-Me

Ping-Me is a modern, production-grade real-time chat application featuring 1:1 and group conversations, live message delivery, typing indicators, read receipts, and online presence tracking. It is built using a domain-driven architectural pattern with a strict separation between RESTful CRUD operations and real-time state synchronization.

## 🚀 Features

- **Real-Time Messaging:** Bidirectional WebSockets via Socket.IO for instant delivery of messages, typing indicators, read receipts, and delivery acknowledgments.
- **Message Management:** Edit messages, soft-delete messages, and seamlessly sync state across all clients.
- **Presence Tracking:** Live "user online" and "user offline" status tracking via Redis.
- **High Performance History:** Cursor-based pagination for rapid message history retrieval and rendering.
- **Instant Search:** Debounced search-as-you-type utilizing PostgreSQL trigram (`pg_trgm`) indexes.
- **Robust Authentication:** Secure JWT (JSON Web Token) access and refresh pairs.
- **Scalable Real-Time Subsystem:** Built to scale horizontally utilizing Redis as a Socket.IO message broker / adapter (`AsyncRedisManager`).

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI
- **Language:** Python 3.14 (fully `async/await`)
- **Database ORM:** SQLAlchemy 2.0 (with `asyncpg`)
- **Database:** PostgreSQL
- **Migrations:** Alembic
- **Real-Time Engine:** `python-socketio` (ASGI mode)
- **Message Broker / Cache:** Redis (`redis-py` async)

### Frontend
- **Framework:** Next.js (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui (Dual Light/Dark mode with glassmorphism)
- **State Management:** Redux Toolkit (scoped to chat domain)
- **Real-Time Client:** `socket.io-client`
- **Data Fetching / Forms:** Axios, React Hook Form, Zod
- **Virtualization:** `@tanstack/react-virtual` for infinitely scrolling message lists

## 🏗️ Architecture & Conventions

The application logic adheres to a **Domain-Driven Design (DDD)** approach, isolating concerns into functional domains (e.g., Auth, Users, Conversations, Messages).

- **Backend Layers:**
  - `router.py`: Handles HTTP request/response parsing and delegates to services.
  - `service.py`: Contains core business logic. Can be invoked seamlessly by both REST routes and Socket.IO events.
  - `repository.py`: The exclusive layer for SQLAlchemy database execution.
  
- **Frontend Data Flow:**
  - **REST Path:** `Server` → `Axios Service` → `Redux Thunk` → `Redux Slice` → `React Component`
  - **Socket Path:** `Server Event` → `useSocket()` → `Redux Slice` → `React Component`

- **Database Approach:** 
  - Purely asynchronous driver (`asyncpg`) at runtime for maximum concurrency.
  - Synchronous driver (`psycopg2-binary`) used exclusively for Alembic migrations.

## 🏃 Getting Started

*(Instructions for local deployment, environment variable configuration, and database seeding to be added).*
