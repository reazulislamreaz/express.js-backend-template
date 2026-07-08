# Express.js Backend Template

Production-ready Express.js backend template with clean layered architecture, designed for SaaS applications.

## Features

- **Layered Architecture** — Routes → Controllers → Services → Repositories
- **TypeScript** — Full type safety with strict mode
- **Dual Database Support** — PostgreSQL (Prisma ORM) + MongoDB (native driver)
- **Authentication** — JWT access tokens with refresh token rotation
- **Background Jobs** — Redis + BullMQ queue foundation with graceful worker lifecycle
- **Security** — Helmet, CORS, rate limiting, XSS sanitization, NoSQL injection prevention, HPP, optional CSRF
- **Validation** — Zod schemas with middleware
- **Logging** — Structured logging with Pino (request IDs, redaction)
- **Docker** — Multi-stage Dockerfile + Docker Compose
- **CI/CD** — GitHub Actions pipeline (lint, test, build, Docker)
- **Testing** — Vitest with unit and integration tests

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional, for databases)

### Local Development

```bash
# 1. Clone and install
cp .env.example .env
npm install

# 2. Start databases
docker compose -f docker-compose.dev.yml up -d

# 3. Run migrations
npm run db:migrate

# 4. Seed the default admin user
npm run db:seed

# 5. Start dev server
npm run dev
```

Server runs at `http://localhost:3000`. API prefix: `/api/v1`.

Interactive API docs are available at `http://localhost:3000/api/v1/docs`.
The raw OpenAPI document is available at `http://localhost:3000/api/v1/openapi.json`.

### Docker (Full Stack)

```bash
cp .env.example .env
docker compose up --build
```

## Project Structure

```
src/
├── config/           # Environment validation
├── lib/              # Shared utilities (logger, crypto, database)
│   └── queue/        # BullMQ queues and workers
├── middleware/       # Express middleware
├── modules/          # Feature modules (auth, users, health)
│   └── auth/
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── auth.repository.ts
│       ├── auth.routes.ts
│       ├── auth.validation.ts
│       └── auth.types.ts
├── routes/           # Route aggregator
├── shared/           # Shared types and errors
├── app.ts            # Express app setup
└── server.ts         # Entry point
```

## API Endpoints

| Method | Endpoint                     | Auth  | Description                       |
| ------ | ---------------------------- | ----- | --------------------------------- |
| GET    | `/api/v1/docs`               | No    | Swagger UI documentation          |
| GET    | `/api/v1/openapi.json`       | No    | Raw OpenAPI specification         |
| GET    | `/api/v1/health`             | No    | Liveness check                    |
| GET    | `/api/v1/health/ready`       | No    | Readiness check (DB connectivity) |
| POST   | `/api/v1/auth/register`      | No    | Register new user                 |
| POST   | `/api/v1/auth/login`         | No    | Login                             |
| POST   | `/api/v1/auth/refresh`       | No    | Refresh access token              |
| POST   | `/api/v1/auth/logout`        | No    | Revoke refresh token              |
| GET    | `/api/v1/auth/me`            | Yes   | Current user profile              |
| GET    | `/api/v1/users`              | Admin | List users (paginated)            |
| GET    | `/api/v1/users/:id`          | Yes   | Get user by ID                    |
| PATCH  | `/api/v1/users/:id`          | Yes   | Update user                       |
| GET    | `/api/v1/users/:id/activity` | Yes   | User activity log (MongoDB)       |

## Security

| Protection       | Implementation                                           |
| ---------------- | -------------------------------------------------------- |
| HTTP headers     | Helmet                                                   |
| CORS             | Configurable origins via `CORS_ORIGINS`                  |
| Rate limiting    | Global + stricter auth endpoints                         |
| SQL injection    | Prisma parameterized queries                             |
| NoSQL injection  | Custom middleware (Express 5 compatible)                 |
| XSS              | Request body/query sanitization                          |
| CSRF             | Optional via `CSRF_ENABLED=true` (cookie-based sessions) |
| Password hashing | bcrypt (configurable rounds)                             |
| JWT              | HS256-pinned access tokens + hashed refresh token rotation with reuse detection |

## Admin Seed

Create or update the default admin user:

```bash
npm run db:seed
```

Configure the seed with:

```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPass123
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Admin
```

The seed is idempotent. If the email already exists, it promotes the user to `ADMIN`, reactivates the account, and updates the password.

## Background Jobs

Redis and BullMQ are included for background processing. The template includes an `email` queue with retry/backoff defaults, failed-job logging, and graceful shutdown.

Use `addEmailJob` from `src/lib/queue` when you add email provider integration:

```ts
import { addEmailJob } from '@/lib/queue/index.js';

await addEmailJob({
  to: 'jane@example.com',
  subject: 'Welcome',
  template: 'welcome',
  payload: { firstName: 'Jane' },
});
```

Redis settings:

```bash
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
QUEUE_PREFIX=express-template
QUEUE_WORKERS_ENABLED=true
```

## API Documentation

Swagger UI is enabled by default in development and disabled in production. Override with:

```bash
DOCS_ENABLED=true   # force enable
DOCS_ENABLED=false  # force disable
```

## Environment Variables

See [`.env.example`](.env.example) for all configuration options.

**Required in production:**

- `JWT_SECRET` (min 32 chars)
- `JWT_REFRESH_SECRET` (min 32 chars)
- `DATABASE_URL`

## Scripts

| Command              | Description           |
| -------------------- | --------------------- |
| `npm run dev`        | Start with hot reload |
| `npm run build`      | Compile TypeScript    |
| `npm start`          | Run production build  |
| `npm test`           | Run tests             |
| `npm run lint`       | ESLint                |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed`    | Create/update admin user |
| `npm run db:studio`  | Open Prisma Studio    |

## Adding a New Module

1. Create folder under `src/modules/<name>/`
2. Add: `*.validation.ts`, `*.repository.ts`, `*.service.ts`, `*.controller.ts`, `*.routes.ts`
3. Register routes in `src/routes/index.ts`

## License

MIT

## Created By

Reazul Islam Reaz
