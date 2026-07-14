A mental math battle game built as an end-to-end DevOps learning project — one small application, deployed through every layer of a real production system.

**Play it (when the cluster is up):** `http://mindsprint.duckdns.org:31666`

---

## What it is

MindSprint is a 60-second mental math game. Pick a difficulty, answer as many questions as you can before the timer runs out, build streaks for bonus points, and land on the leaderboard.

The game itself is intentionally simple. It exists to be the smallest possible product sitting on top of the largest possible amount of real infrastructure — frontend, backend, database, cache, containerisation, orchestration, CI/CD, and cloud deployment, all wired together and deployed for real.

---

## How it works

- Pick a difficulty (easy / medium / hard)
- A 60-second timer starts and questions appear rapidly
- Correct answers score points, with a bonus for consecutive streaks
- Wrong answers deduct points
- When time runs out, your score and accuracy are saved and the leaderboard updates

---

## Architecture

```
Browser
   │
   ▼
Nginx Ingress Controller  (Kubernetes)
   │
   ├── /            → Frontend (React + Vite)
   ├── /game/        → Game API (FastAPI)
   └── /analytics/   → Analytics API (FastAPI)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               PostgreSQL            Redis
          (games, users — persisted)  (sessions, leaderboard, event log)
```

<img width="3748" height="2076" alt="phase 9" src="https://github.com/user-attachments/assets/97519125-7284-42e7-8b19-097ded8a1f97" /># MindSprint

Two backend services rather than one, on purpose — the game API owns gameplay and scoring; the analytics API owns events and stats. They're independently deployable and don't share code, only a Redis instance.

---

## Tech stack

| Layer          | Tool                                  |
|----------------|----------------------------------------|
| Frontend       | React + Vite + TypeScript              |
| Game API       | FastAPI (Python)                       |
| Analytics API  | FastAPI (Python)                       |
| Database       | PostgreSQL 15 + SQLAlchemy + Alembic   |
| Cache          | Redis 7                                |
| Containers     | Docker + docker-compose (local)        |
| Orchestration  | Kubernetes (k3s)                       |
| Ingress        | Nginx Ingress Controller               |
| Cloud          | Oracle Cloud (Always Free tier VM)     |
| Registry       | GitHub Container Registry (GHCR)       |
| CI/CD          | GitHub Actions                         |
| DNS            | DuckDNS                                |

---

## Project structure

```
mindsprint/
├── frontend/          React + Vite game client
├── game-api/           FastAPI service — gameplay, scoring, sessions
├── analytics-api/       FastAPI service — event tracking, stats
├── k8s/                 Kubernetes manifests
├── nginx/                nginx config for local docker-compose
├── .github/workflows/     CI/CD pipeline
└── docker-compose.yml     Local multi-service orchestration
```

---

## Running it locally

Requires Docker Desktop.

```bash
docker-compose up --build
```

Then open `http://localhost`.

Run database migrations on first startup:

```bash
docker-compose exec game-api alembic upgrade head
```

---

## API reference

**Game API** (`/game`)

| Method | Endpoint       | Description                              |
|--------|----------------|-------------------------------------------|
| POST   | `/start`       | Start a session, get the first question   |
| GET    | `/question`    | Get the next question                     |
| POST   | `/answer`      | Submit an answer                          |
| POST   | `/end`         | End the session, save score, get results  |
| GET    | `/leaderboard` | Top 10 scores                             |

**Analytics API** (`/analytics`)

| Method | Endpoint            | Description                     |
|--------|---------------------|-----------------------------------|
| POST   | `/events`           | Ingest a game event               |
| GET    | `/stats/difficulty` | Average scores by difficulty      |
| GET    | `/stats/questions`  | Most frequently missed questions  |

---

## CI/CD

Every push to `main` runs a four-stage pipeline:

```
lint → test → build & push images to GHCR → deploy to cluster
```

GitHub Actions builds and pushes fresh Docker images, then connects to the production VM and rolls the Kubernetes deployments forward.

---

## Deployment notes

MindSprint runs on a single free-tier Oracle Cloud VM (1 vCPU, 1GB RAM) running k3s. This is a deliberately constrained environment, and it shows — the ingress and DNS layer can be intermittently unstable under memory pressure, which is documented in detail in the accompanying blog series rather than hidden. The core application pods (game API, analytics API, database, cache, frontend) run reliably; it's the cluster's own system components that occasionally strain under 1GB of RAM.

TLS/HTTPS was scoped out for this deployment — cert-manager would add further memory pressure that this VM doesn't have room for. The honest, documented alternative is TLS termination at a CDN layer in front of the VM, which wasn't implemented here but is noted as the practical next step.

---

## Blog series

This project is documented in full as a blog series covering each phase — the reasoning, the mistakes, and the fixes: [Medium](https://medium.com/@ctypecharger/mindsprint-4ecc317377a9?sharedUserId=ctypecharger).
