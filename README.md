<div align="center">

# 🗳️ PollWave

**Community polls and elections.**

PollWave is built for housing societies, student unions, and clubs running real decisions: too small for enterprise e-voting, too important for a WhatsApp poll. Account-based voting limits each participant to one vote per poll.

Real-time results, protected organizer registration, and account-based duplicate-vote prevention — built with React, Express, Prisma, and Socket.io.

Create polls, share them instantly with a link, and watch votes pour in live.  
Database-enforced one-person-one-vote limits built right in.

</div>

---
<!-- CI/CD pipeline verified working -->
## ✨ Features

- 🔗 **Instant Shareable Links** — Every poll gets a unique short URL
- 🛡️ **One Vote per Account** — Enforced by a database uniqueness constraint
- ⚡ **Live Results** — Socket.io powered real-time vote updates
- 👥 **Protected Organizer Access** — Organizer registration requires a configured signup code
- 🔒 **Private Poll Links** — Published private polls require a signed-in account; drafts are organizer-only
- 📊 **Rich Dashboard** — Stats, poll management, and analytics
- 🎨 **Responsive UI** — A custom design system with smooth animations
- 🐳 **Docker Ready** — One-command deployment with Docker Compose

---

## 🏗️ Tech Stack

| Layer      | Technology                                 |
|------------|--------------------------------------------|
| Frontend   | React 18, Vite, Lucide Icons               |
| Backend    | Node.js, Express, Socket.io                |
| Database   | Prisma ORM + PostgreSQL                    |
| Auth       | JWT (JSON Web Tokens) + bcrypt             |
| Styling    | Custom CSS with design tokens              |
| DevOps     | Docker, Docker Compose, GitHub Actions     |

---

## 📁 Project Structure

```
poll-platform/
├── .github/            # CI/CD workflows & templates
├── frontend/           # React + Vite client app
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # React Context (Auth)
│   │   ├── pages/      # Route-level pages
│   │   ├── services/   # API client (Axios)
│   │   └── styles/     # Design system CSS
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/            # Express + Prisma API server
│   ├── src/
│   │   ├── middleware/ # Auth & role guards
│   │   ├── routes/     # API route handlers
│   │   └── utils/      # Validators & helpers
│   ├── prisma/         # Database schema
│   └── package.json
├── docker/             # Docker configuration
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── nginx.conf
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── package.json        # Root workspace scripts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 9
- **PostgreSQL** (or Docker Compose for a local PostgreSQL instance)
- **Docker** & **Docker Compose** (for the included database and containerized workflows)

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/poll-platform.git
cd poll-platform

# 2. Install dependencies
npm run install:all

# 3. Start the local PostgreSQL database
docker compose -f docker/docker-compose.dev.yml up -d postgres

# 4. Set up the backend environment
cp backend/.env.example backend/.env

# 5. Initialize the database
npm run db:push

# 6. Start both servers
npm run dev
```

The frontend will be available at **http://localhost:5173** and the API at **http://localhost:5000**.
To create organizer accounts, set `ORGANIZER_SIGNUP_CODE` in `backend/.env`; leave it empty to disable organizer registration. The development Docker Compose stack uses `pollwave-dev-organizer` by default.

### Docker Deployment

```bash
# Production (with PostgreSQL)
cp docker/.env.example docker/.env
# Replace the placeholder values before deploying.
docker compose --env-file docker/.env -f docker/docker-compose.yml up --build

# Development (with hot reload)
docker compose -f docker/docker-compose.dev.yml up --build
```

Production app will be available at **http://localhost:3000**. Set a strong `ORGANIZER_SIGNUP_CODE` in `docker/.env` to enable organizer registration; organizer registrations stay disabled if it is empty.
Set `CLIENT_URL` in `docker/.env` to the public frontend origin when deploying outside localhost. The frontend uses same-origin `/api` and `/socket.io` routes through Nginx.

### Database migrations and existing deployments

Production startup applies checked-in Prisma migrations before starting the API. New databases are created by the initial migration and updated in order. Back up an existing database before upgrading.

For a database previously created with `prisma db push`, back it up and verify its tables, columns, indexes, and foreign keys match [`20261021000000_initial_baseline/migration.sql`](backend/prisma/migrations/20261021000000_initial_baseline/migration.sql). Mark the baseline as applied once, before starting the new Compose stack:

```bash
docker compose --env-file docker/.env -f docker/docker-compose.yml run --build --rm migrate npx prisma migrate resolve --applied 20261021000000_initial_baseline
```

Then start the stack normally:

```bash
docker compose --env-file docker/.env -f docker/docker-compose.yml up --build
```

The second migration adds unique share IDs to existing polls. Do not mark the baseline as applied to an empty or structurally different database; inspect and reconcile it first. The Compose migration service runs `migrate deploy` automatically after this one-time baseline step. `db:push` remains available for local development and should not be used for production releases.

The database-integrity migration constrains roles, poll types, and statuses to values supported by the application. If an existing database contains other values, migration stops with an explicit error; reconcile those records before retrying.

---

## 🔧 Available Scripts

Run from the project root:

| Command                   | Description                          |
|---------------------------|--------------------------------------|
| `npm run dev`             | Start frontend & backend concurrently|
| `npm run dev:frontend`    | Start frontend only (Vite)           |
| `npm run dev:backend`     | Start backend only (nodemon)         |
| `npm run build`           | Build the frontend for production    |
| `npm run install:all`     | Install deps for frontend & backend  |
| `npm run db:push`         | Push Prisma schema to database       |
| `npm run db:migrate`      | Apply checked-in Prisma migrations   |
| `npm run db:studio`       | Open Prisma Studio                   |
| `npm run docker:up`       | Start production Docker stack        |
| `npm run docker:dev`      | Start development Docker stack       |
| `npm run docker:down`     | Stop Docker stack                    |

Run backend unit tests with `cd backend && npm run test:unit`. CI also validates the Prisma schema and builds both Docker images.
Run frontend linting with `npm run lint`. Backend integration tests require a migrated PostgreSQL database and a running API; CI starts both before running `cd backend && npm run test:integration`.

---

## 📝 API Endpoints

| Method | Endpoint                  | Auth     | Description             |
|--------|---------------------------|----------|-------------------------|
| POST   | `/api/auth/register`      | —        | Register a new user     |
| POST   | `/api/auth/login`         | —        | Log in                  |
| GET    | `/api/auth/me`            | Bearer   | Get current user        |
| POST   | `/api/polls`              | Organizer| Create a poll           |
| GET    | `/api/polls`              | Organizer| List organizer's polls  |
| GET    | `/api/polls/public`       | —        | List active public polls|
| GET    | `/api/polls/s/:shortId`   | Conditional | Get a published poll by short ID; private polls require sign-in |
| POST   | `/api/polls/:id/publish`  | Organizer| Publish a draft poll    |
| POST   | `/api/votes/:pollId`      | Bearer   | Submit a vote           |
| GET    | `/api/votes/:pollId/results` | Conditional | Get results; private polls require sign-in, drafts are organizer-only |
| GET    | `/api/health`             | —        | Health check            |

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
