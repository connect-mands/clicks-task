# Product Analytics Dashboard

Full-stack interactive dashboard that visualizes its own usage. Every filter change and chart click is tracked.

## Prerequisites

PostgreSQL must be running. Options:

**Option A – Docker:**
```bash
docker compose up -d postgres
```
Uses default `postgresql://postgres:postgres@localhost:5432/analytics`.

**Option B – Local PostgreSQL:** Create a database and set `DATABASE_URL` if needed.

## Quick Start

```bash
cd backend && npm install && npx prisma generate && npx prisma db push
cd backend && npm run seed
cd ../frontend && npm install
```

Set `DATABASE_URL` if needed (default: `postgresql://localhost:5432/analytics`).

**Terminal 1:** `cd backend && npm run dev`  
**Terminal 2:** `cd frontend && npm run dev`

- **Frontend:** http://localhost:5173  
- **Backend:** http://localhost:3001  
- **Demo:** `user1` / `password123` (after seed)

## Seed

`npm run seed` (in backend) creates 12 users and 80+ feature clicks.

## Deployment

**Frontend (Netlify):**
- Add env var `VITE_API_URL` = your deployed backend URL (e.g. `https://yourapp.onrender.com`)
- Redeploy after changing env vars (Vite reads them at build time)

**Backend (Render/Railway):** Set `DATABASE_URL` and `JWT_SECRET`, deploy.

## Scaling Essay (1M writes/min)

Use Kafka for write buffering, TimescaleDB/ClickHouse for analytics, pre-aggregation, and horizontal scaling.
