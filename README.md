# EchoGPT Backend REST API

A scalable, robust, and production-ready backend REST API built for the **EchoGPT Chrome Extension** — a multi-AI chat assistant. This service handles authentication, subscription management, dynamic AI provider orchestration, chat history, and web search, all documented via Swagger/OpenAPI.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Database Schema (ERD Overview)](#database-schema-erd-overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Local Setup & Installation](#local-setup--installation)
- [Running via Docker](#running-via-docker)
- [API Documentation (Swagger)](#api-documentation-swagger)
- [Security & Architecture Highlights](#security--architecture-highlights)

---

## 🏗 Architecture Overview

The EchoGPT backend manages user sessions, tracks subscription usage, secures external AI provider credentials, and routes chat/search traffic through a unified, auditable pipeline.

```text
[ EchoGPT Chrome Extension / Client ]
                |
                ▼
      [ Global Middlewares ] (Helmet, CORS, ValidationPipe)
                |
                ▼
      [ JWT & Roles Guards ] (Authentication & Authorization)
                |
        ┌───────────────────────────────┐
        ▼                               ▼
 [ User / Chat Flow ]           [ Admin Panel Flow ]
   ├── Daily Quota Check          ├── Dashboard Metrics
   ├── Web Search Context         ├── System Health (CPU, RAM, DB Latency)
   ├── AI Engine Pipeline         └── Real-time Request Audit Logs
   └── PostgreSQL Persistence
```

---

## 🛠 Tech Stack

- **Framework:** Nest.JS (Node.js TypeScript framework)
- **Database:** PostgreSQL
- **ORM:** Prisma ORM
- **Documentation:** Swagger / OpenAPI 3.0
- **Authentication & Security:** Passport.js, JWT, Bcrypt, Helmet, AES-256-CBC Encryption
- **AI Integrations:** Groq SDK (OpenAI-compatible), Google GenAI SDK, OpenAI SDK
- **Containerization:** Docker & Docker Compose

---

## ✨ Key Features

### 1. Authentication & Session Lifecycle
- Registration with automatic subscription provisioning (`FREE` plan with 20 requests/day)
- JWT Access Token (short-lived) & Refresh Token (long-lived) rotation
- Secure Logout with instant session revocation in the database
- Dual-level role enforcement (`USER`, `ADMIN`)

### 2. User Management
- User Profile retrieval and inline updates (`PATCH /users/profile`)
- Secure password update with previous-hash verification
- Account deletion (`DELETE /users/account`) with cascading cleanup

### 3. Subscription & Quota Management
- Dual-tier subscription architecture: `FREE` (20 req/day) and `PREMIUM` (Unlimited req/day)
- Dynamic tracking of used requests vs. daily limits with automated rate-limiting
- Tier upgrade and downgrade capabilities

### 4. Dynamic AI Provider Management
- Dynamic provider orchestration supporting **OpenAI**, **Anthropic (Claude)**, and **Google Gemini** (via Groq/Gemini)
- At-rest AES-256-CBC encryption for sensitive API credentials
- Provider toggling (Active/Inactive) and default model assignment

### 5. Chat Engine & History
- Multi-turn conversation thread management
- Context-aware prompt routing and token accounting
- Conversation creation, listing, retrieval, and deletion

### 6. Web Search API
- Live query processing and search results caching
- Search history logging, recent search retrieval, and query suggestions

### 7. Admin Panel & Observability
- Aggregated metric dashboard (total users, chats, messages, searches, active providers)
- Real-time hardware telemetry and database query latency checks (`GET /admin/health`)
- Centralized audit trail logs for all inbound API requests

---

## 🗄 Database Schema (ERD Overview)

The normalized relational PostgreSQL schema contains the following models:

- **User** — Account identity, hashed passwords, roles (`USER`, `ADMIN`)
- **Session** — Refresh tokens, user-agent fingerprints, and expiration timestamps
- **Subscription** — Plan tiers (`FREE`, `PREMIUM`), daily limits, and consumption counters
- **AIProvider** — Third-party model endpoints with AES-256 encrypted API keys
- **Conversation** — Context threads grouped per user
- **ChatMessage** — Sequential prompt/response pairs with token counts
- **WebSearch** — Executed user search queries and metadata
- **ApiUsageLog** — Comprehensive audit trails of all inbound API traffic

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:

- **Node.js:** v18.0.0 or later (v20+ recommended)
- **PostgreSQL:** Running instance on port `5432` (or via Docker)
- **npm** or **yarn**

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development

# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:password@localhost:5432/echogpt?schema=public"

# Authentication Secrets
JWT_ACCESS_SECRET="your_jwt_access_secret_key_2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your_jwt_refresh_secret_key_2026"
JWT_REFRESH_EXPIRES_IN="7d"

# AES-256 Secret (Exact 32 characters required)
ENCRYPTION_KEY="12345678901234567890123456789012"

# AI Provider Keys (optional defaults)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GOOGLE_GENAI_API_KEY=""
GROQ_API_KEY=""
```

> ⚠️ Never commit your real `.env` file. Use `.env.example` as the shared template.

---

## 🚀 Local Setup & Installation

1. **Clone the repository:**

   ```bash
   git clone 'https://github.com/jakaria76/echogpt-backend.git'
   cd echogpt-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run Prisma Migrations:**

   ```bash
   npx prisma migrate dev --name init
   ```

4. **Launch development server:**

   ```bash
   npm run start:dev
   ```

5. **Access the API:**

   - **REST API Base URL:** `http://localhost:3000/api/v1`
   - **Interactive Swagger Documentation:** `http://localhost:3000/api/docs`

---

## 🐳 Running via Docker

To spin up both the NestJS API application and the PostgreSQL database in isolated containers:

```bash
# Build and run containers in detached mode
docker-compose up --build -d

# Inspect running containers
docker-compose ps

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## 📄 API Documentation (Swagger)

All endpoints include parameter validations, structured error handling (`400`, `401`, `403`, `404`, `429`), and Bearer JWT authorization.

| Module | Method | Path | Summary | Permission |
|---|---|---|---|---|
| Auth | POST | `/api/v1/auth/register` | Register new user account | Public |
| Auth | POST | `/api/v1/auth/login` | Authenticate user & return tokens | Public |
| Auth | POST | `/api/v1/auth/refresh` | Refresh access token using refresh token | Public |
| Auth | POST | `/api/v1/auth/logout` | Revoke session & invalidate tokens | Bearer JWT |
| Users | GET | `/api/v1/users/profile` | Retrieve active user profile & plan info | Bearer JWT |
| Users | PATCH | `/api/v1/users/profile` | Update profile information | Bearer JWT |
| Users | PATCH | `/api/v1/users/change-password` | Change account password | Bearer JWT |
| Users | DELETE | `/api/v1/users/account` | Permanently terminate user account | Bearer JWT |
| Subscriptions | GET | `/api/v1/subscriptions/status` | Current quota consumption & remaining | Bearer JWT |
| Subscriptions | POST | `/api/v1/subscriptions/upgrade` | Upgrade subscription to PREMIUM | Bearer JWT |
| Providers | POST | `/api/v1/providers` | Configure new AI model provider | Admin Only |
| Providers | GET | `/api/v1/providers` | List all configured providers | Bearer JWT |
| Providers | PATCH | `/api/v1/providers/{id}/toggle` | Toggle provider active status | Admin Only |
| Chat | POST | `/api/v1/chat` | Send prompt and receive AI response | Bearer JWT |
| Chat | GET | `/api/v1/chat/conversations` | List user conversation threads | Bearer JWT |
| Search | POST | `/api/v1/search` | Execute web-assisted search query | Bearer JWT |
| Search | GET | `/api/v1/search/history` | List search history entries | Bearer JWT |
| Admin | GET | `/api/v1/admin/dashboard` | Aggregated business & activity metrics | Admin Only |
| Admin | GET | `/api/v1/admin/health` | Real-time database latency & memory health | Admin Only |
| Admin | GET | `/api/v1/admin/logs` | Centralized API request audit logs | Admin Only |

> Full request/response schemas, error examples, and auth requirements are available in the interactive Swagger UI at `/api/docs`.

---

## 🔒 Security & Architecture Highlights

- **At-Rest Encryption:** Provider API credentials are never stored in plaintext; they are secured using AES-256-CBC ciphering with an initialization vector (IV).
- **Strict Payload Validation:** Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` to prevent mass-assignment vulnerabilities.
- **HTTP Hardening:** Integrated `helmet` middleware for standard security headers and configured CORS restrictions.
- **Failover Protection:** Resilient provider routing logic prevents application crashes during upstream AI service interruptions.

---

## 📦 Project Structure (suggested)

```text
echogpt-backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── auth/
│   ├── users/
│   ├── subscriptions/
│   ├── providers/
│   ├── chat/
│   ├── search/
│   ├── admin/
│   ├── common/          # guards, interceptors, decorators, filters
│   ├── config/
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

## 📝 License

This project was developed as part of a technical assessment for AppifyDevs.
