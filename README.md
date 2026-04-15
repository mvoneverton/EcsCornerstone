# ECS Cornerstone

Behavioral assessment platform for Everton Consulting Services. Delivers PCA, WSA, and JA assessments to employees and job candidates, scores responses automatically, and generates detailed PDF profile reports.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express 4, TypeScript 5 |
| Frontend | React 18, Vite, Tailwind CSS, React Query |
| Database | PostgreSQL 15 (primary), Redis 7 (sessions/rate limiting) |
| Auth | JWT (15-min access + 30-day refresh), bcrypt |
| Email | SendGrid |
| PDF | Puppeteer (headless Chromium) |
| Storage | AWS S3 |
| Payments | Stripe |

## Repository Structure

```
ecscornerstone/
├── packages/
│   ├── api/                  # Express + TypeScript backend
│   │   ├── src/
│   │   │   ├── auth/         # Auth routes, JWT helpers
│   │   │   ├── admin/        # Company admin routes
│   │   │   ├── assess/       # Assessment delivery (token-based public routes)
│   │   │   ├── scoring/      # Scoring engine — pure functions, no DB calls
│   │   │   ├── reports/      # PDF generation pipeline
│   │   │   ├── billing/      # Stripe integration
│   │   │   ├── db/           # Pool client, migrations, seed data
│   │   │   ├── middleware/   # Auth, rate limiting, error handling, audit log
│   │   │   ├── types/        # Shared TypeScript interfaces
│   │   │   └── index.ts
│   │   └── tests/
│   │       ├── scoring/      # Unit tests for scoring engine (≥20 per instrument)
│   │       └── api/          # Integration tests
│   └── web/                  # React 18 frontend
│       └── src/
│           ├── pages/
│           ├── components/
│           ├── hooks/
│           └── lib/
├── docker-compose.yml
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Docker + Docker Compose
- npm ≥ 10

### Local Development

**Option A — Docker (all services):**
```bash
cp .env.example .env          # fill in secrets
docker compose up -d          # starts postgres, redis, api, web
```

**Option B — Docker infra, local processes (recommended for active development):**
```bash
cp .env.example .env
docker compose up -d postgres redis   # infra only

npm install                           # install all workspace deps
npm run db:migrate                    # run migrations
npm run db:seed                       # seed plans
npm run dev                           # starts api + web with hot reload
```

API available at `http://localhost:3001`
Web available at `http://localhost:5173`

### Running Tests

```bash
npm test                    # all tests
npm run test:watch          # watch mode
```

### Database Migrations

Migrations live in `packages/api/src/db/migrations/` and run in filename order.

```bash
npm run db:migrate          # apply all pending migrations
npm run db:seed             # insert seed data (plans)
```

## Build Phases

| Step | Status | Description |
|---|---|---|
| 1 | ✅ Done | Project setup — monorepo, TypeScript, Docker |
| 2 | ✅ Done | Database migrations + seed data |
| 3 | ✅ Done | Scoring engine + full unit test suite (48/48 passing) |
| 4 | ✅ Done | Authentication (register, login, JWT, refresh, reset, middleware) |
| 5 | ✅ Done | Company admin routes |
| 6 | ✅ Done | Assessment delivery flow |
| 7 | ✅ Done | PDF report generation (Puppeteer → S3 → signed URL) |
| 8 | ✅ Done | Stripe billing (subscriptions, webhooks, customer portal, overage billing) |

## Environment Variables

See `.env.example` for all required variables. Never commit `.env` to version control.
