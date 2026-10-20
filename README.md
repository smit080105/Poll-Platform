<div align="center">

# 🗳️ PollWave

**Community polls and elections.**

PollWave is built for housing societies, student unions, and clubs running real decisions: too small for enterprise e-voting, too important for a WhatsApp poll. Account-based voting limits each participant to one vote per poll.

Real-time results, protected organizer registration, and duplicate-vote prevention — built with React, Express, Prisma, and Socket.io.

Create polls, share them instantly with a link, and watch votes pour in live.  
Tamper-proof, one-person-one-vote integrity built right in.

</div>

---
<!-- CI/CD pipeline verified working -->
## ✨ Features

- 🔗 **Instant Shareable Links** — Every poll gets a unique short URL
- 🛡️ **One Vote per Account** — Application checks backed by a database uniqueness constraint
- ⚡ **Live Results** — Socket.io powered real-time vote updates
- 👥 **Protected Organizer Access** — Organizer registration requires a configured signup code
- 📊 **Rich Dashboard** — Stats, poll management, and analytics
- 🎨 **Modern Dark UI** — Glassmorphism design with smooth animations
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
| `npm run db:studio`       | Open Prisma Studio                   |
| `npm run docker:up`       | Start production Docker stack        |
| `npm run docker:dev`      | Start development Docker stack       |
| `npm run docker:down`     | Stop Docker stack                    |

Run backend unit tests with `cd backend && npm run test:unit`.

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
| GET    | `/api/polls/s/:shortId`   | —        | Get poll by short ID    |
| POST   | `/api/polls/:id/publish`  | Organizer| Publish a draft poll    |
| POST   | `/api/votes/:pollId`      | Bearer   | Submit a vote           |
| GET    | `/api/votes/:pollId/results` | —     | Get poll results        |
| GET    | `/api/health`             | —        | Health check            |

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
