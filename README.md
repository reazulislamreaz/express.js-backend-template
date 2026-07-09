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
- **CI/CD** — GitHub Actions CI + GHCR Docker publish on main
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
| POST   | `/api/v1/users/:id/deactivate` | Admin | Deactivate user and revoke sessions |
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
| CSRF             | Optional via `CSRF_ENABLED=true` (skipped for Bearer token requests) |
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

## CI/CD

GitHub Actions runs automatically on every push and pull request to `main` / `develop`.

### CI (`ci.yml`)

Single job pipeline:

1. Install dependencies
2. Lint + format check + type check
3. Run tests (Postgres, MongoDB, Redis service containers)
4. Build TypeScript

### CD (`cd.yml`)

Publishes a production Docker image to **GitHub Container Registry** (`ghcr.io`):

| Trigger | When |
| ------- | ---- |
| CI success on `main` | After the CI workflow passes |
| Git tag `v*.*.*` | e.g. `v1.0.0` |
| Manual | Actions → CD → Run workflow |
| VPS auto-deploy | After publish, if `VPS_DEPLOY_ENABLED=true` |

Image tags: `latest`, commit SHA, and semver tags on releases.

See **[VPS Deployment](#vps-deployment)** below for full server setup.

**First-time setup** (for public repos):

1. Push to `main` and wait for CI + CD to complete
2. Go to **Packages** on GitHub → select the image → **Package settings** → change visibility to **Public** (if needed)
3. Pull the image:

```bash
docker pull ghcr.io/<your-org>/express-template:latest
```

## VPS Deployment

Deploy to your own VPS with Docker. CD can auto-deploy after each successful `main` build.

### Architecture

```
GitHub Actions (CD) → ghcr.io image → SSH → VPS (docker compose)
                                              ↓
                                         Nginx + SSL (optional)
```

### 1. Prepare the VPS (one-time)

On a fresh Ubuntu/Debian VPS:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Create deploy directory
sudo mkdir -p /opt/express-template
sudo chown $USER:$USER /opt/express-template
cd /opt/express-template
```

Copy these files to the VPS (via `scp` or clone the repo):

```bash
scp docker-compose.prod.yml .env.production.example deploy/nginx.conf.example \
  user@your-vps:/opt/express-template/
```

On the VPS:

```bash
cd /opt/express-template
cp .env.production.example .env
nano .env   # set JWT secrets, POSTGRES_PASSWORD, CORS_ORIGINS, etc.
```

Start the stack for the first time (pull image manually or wait for CD):

```bash
export APP_IMAGE=ghcr.io/<your-org>/express-template:latest
docker compose -f docker-compose.prod.yml up -d
```

Run migrations and seed (first deploy only):

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec app npm run db:seed
```

### 2. Nginx + SSL (recommended)

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/express-template
# Edit server_name to your domain
sudo ln -s /etc/nginx/sites-available/express-template /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.yourdomain.com
```

See `deploy/nginx.conf.example` for the reverse proxy config. The app binds to `127.0.0.1:3000` only — not exposed directly to the internet.

### 3. Enable auto-deploy from GitHub Actions

In your GitHub repo:

**Repository variable** (Settings → Secrets and variables → Actions → Variables):

| Variable | Value |
| -------- | ----- |
| `VPS_DEPLOY_ENABLED` | `true` |

**Repository secrets** (Settings → Secrets and variables → Actions → Secrets):

| Secret | Description |
| ------ | ----------- |
| `VPS_HOST` | VPS IP or domain, e.g. `203.0.113.10` |
| `VPS_USER` | SSH user, e.g. `deploy` |
| `VPS_SSH_KEY` | Private SSH key (full PEM contents) |
| `VPS_DEPLOY_PATH` | Deploy directory, e.g. `/opt/express-template` |
| `GHCR_PAT` | GitHub PAT with `read:packages` (if image is private) |

**SSH key setup on VPS:**

```bash
# On your local machine — add public key to VPS
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-vps

# Paste the *private* key contents into GitHub secret VPS_SSH_KEY
```

After setup, every push to `main` that passes CI will:

1. Build & push Docker image to `ghcr.io`
2. SSH into VPS → `docker compose pull` → `docker compose up -d`

### 4. Manual deploy on VPS

```bash
cd /opt/express-template
export APP_IMAGE=ghcr.io/<your-org>/express-template:latest
export GHCR_TOKEN=ghp_xxx        # only if package is private
export GHCR_USER=your-github-user
./scripts/deploy.sh
```

Or trigger **Actions → CD → Run workflow** from GitHub.

### 5. Useful VPS commands

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f app

# Restart
docker compose -f docker-compose.prod.yml restart app

# Status
docker compose -f docker-compose.prod.yml ps

# Run migrations after update
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
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
