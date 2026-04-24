# Parallettes Couple Challenge

A workout tracker for two people doing parallettes exercises together. Challenges are scored on **relative improvement** — your personal best is your baseline, so different fitness levels stay competitive.

## Stack

- **Backend** — Go (`net/http`, `database/sql`, `modernc.org/sqlite`)
- **Frontend** — React + Vite (TypeScript), embedded into the Go binary at build time
- **Database** — SQLite, persisted via a Docker volume

## Running with Docker

```bash
docker compose up --build
```

Open `http://localhost:8080` — or `http://<your-LAN-IP>:8080` from any device on the home network.

Data survives container restarts via a named Docker volume (`db-data`).

## Running locally (dev)

**Backend**
```bash
cd backend
go run main.go
# API on http://localhost:3000
```

**Frontend** (in a second terminal)
```bash
cd frontend
npm install
npm run dev
# App on http://localhost:5173 (proxies /api → :3000)
```

## Project structure

```
parallettes/
├── backend/
│   ├── main.go                        # HTTP server, routing, embeds static/
│   ├── static/                        # Vite build output goes here (Docker only)
│   └── internal/
│       ├── model/model.go             # Shared types
│       ├── db/db.go                   # SQLite schema + queries
│       ├── service/service.go         # Scoring logic
│       └── handler/handler.go         # HTTP handlers
├── frontend/
│   └── src/
│       ├── app.tsx                    # Tab state, API calls
│       ├── styles.css
│       ├── data/challenges.ts         # Static challenge definitions
│       └── components/
│           ├── WorkoutsTab.tsx
│           ├── ChallengesTab.tsx
│           ├── TrackerTab.tsx
│           └── TipsTab.tsx
├── Dockerfile                         # 3-stage: node → go (embed) → alpine
└── docker-compose.yml
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/state` | Returns current scores and full history |
| `POST` | `/api/log` | Log a challenge result, returns updated state |
| `DELETE` | `/api/state` | Reset all scores and history |

### POST /api/log body

```json
{
  "challengeId": 1,
  "himVal": 38,
  "herVal": 4,
  "himBase": 30,
  "herBase": 1
}
```

## Scoring

Each challenge compares **percentage improvement** over each person's own baseline:

- Difference > 5% → winner gets **3 pts**, other gets **0**
- Difference ≤ 5% → both get **1 pt** (tie)
- Time-based challenges (lower = better) invert the calculation automatically
