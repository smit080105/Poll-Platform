<div align="center">

# 📊 PollWave

**Real-Time Poll & Survey Intelligence Platform**

[![CI](https://github.com/YOUR_USERNAME/poll-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/poll-platform/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

Create polls, share them instantly with a link, and watch votes pour in live.  
Tamper-proof, one-person-one-vote integrity built right in.

</div>

---

## ✨ Features

- 🔗 **Instant Shareable Links** — Every poll gets a unique short URL
- 🛡️ **Tamper-Proof Voting** — Double-layer one-person-one-vote (app + DB constraints)
- ⚡ **Live Results** — Socket.io powered real-time vote updates
- 👥 **Role-Based Access** — Organizer and Participant roles
- 📊 **Rich Dashboard** — Stats, poll management, and analytics
- 🎨 **Modern Dark UI** — Glassmorphism design with smooth animations
- 🐳 **Docker Ready** — One-command deployment with Docker Compose

---

## 🏗️ Tech Stack

| Layer      | Technology                                 |
|------------|--------------------------------------------|
| Frontend   | React 18, Vite, Lucide Icons               |
| Backend    | Node.js, Express, Socket.io                |
| Database   | Prisma ORM (SQLite dev / PostgreSQL prod)  |
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
- **Docker** & **Docker Compose** (optional, for containerized deployment)

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/poll-platform.git
cd poll-platform

# 2. Install dependencies
npm run install:all

# 3. Set up the backend environment
cp backend/.env.example backend/.env

# 4. Initialize the database
npm run db:push

# 5. Start both servers
npm run dev
```

The frontend will be available at **http://localhost:5173** and the API at **http://localhost:5000**.

### Docker Deployment

```bash
# Production (with PostgreSQL)
docker compose -f docker/docker-compose.yml up --build

# Development (with hot reload)
docker compose -f docker/docker-compose.dev.yml up --build
```

Production app will be available at **http://localhost:3000**.

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
