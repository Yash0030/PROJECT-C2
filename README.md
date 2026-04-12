# Lokaal 🌐

Anonymous, location-based group chat that expires. Built to solve what Yik Yak couldn't.

## Architecture

```
lokaal/
├── web/                  ← React (Vite) web app
│   └── src/
│       ├── pages/        ← HomePage, GroupPage, CreatePage, PlacesPage, GhostPage
│       └── components/   ← GroupCard, Layout, JoinRequestsPanel, LoadingScreen
├── shared/               ← Shared across web + future React Native app
│   ├── api/              ← All API calls (axios)
│   ├── hooks/            ← useChat, useLocation, useSocket
│   ├── store/            ← Zustand: sessionStore, groupsStore
│   └── utils/            ← time formatting, distance, health labels
└── server/               ← Node.js + Express + Socket.io
    └── src/
        ├── routes/       ← session, groups, messages, join, places, ghost
        ├── middleware/   ← auth (session token → hash)
        ├── services/     ← contentFilter, ghostTrail, location
        ├── socket/       ← Socket.io setup
        ├── jobs/         ← node-cron: group expiry, health recovery
        └── db/           ← PostgreSQL client + inline migrations, Redis
```

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+ (or use [Upstash](https://upstash.com) free tier)

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd lokaal
cp .env.example .env
# Edit .env with your DATABASE_URL, REDIS_URL, SESSION_SECRET
npm install              # installs root devDeps (concurrently)
cd server && npm install
cd ../web    && npm install
cd ../shared && npm install
cd ..
```

### 2. Database

Create a Postgres database:
```sql
CREATE DATABASE lokaal_dev;
CREATE USER lokaal WITH PASSWORD 'lokaal';
GRANT ALL PRIVILEGES ON DATABASE lokaal_dev TO lokaal;
```

Tables are created automatically on first server boot (inline migrations in `server/src/db/client.js`).

### 3. Run (development)

```bash
# From repo root — starts both server (port 4000) and web (port 5173)
npm run dev

# Or individually:
npm run dev:server
npm run dev:web
```

Open http://localhost:5173

## Feature map

| Feature | Status | Where |
|---|---|---|
| Anonymous sessions | ✅ | `server/routes/session.js` |
| Purpose-gated entry | ✅ | `server/routes/join.js` + `GroupPage.jsx` |
| Ghost Trail score | ✅ | `server/services/ghostTrail.js` + `GhostPage.jsx` |
| Group creation (all templates) | ✅ | `server/routes/groups.js` + `CreatePage.jsx` |
| Real-time chat | ✅ | `server/socket/` + `shared/hooks/useChat.js` |
| Group expiry | ✅ | `expires_at` column + `server/jobs/` cron |
| Content filter | ✅ | `server/services/contentFilter.js` |
| Message flagging | ✅ | `server/routes/messages.js` |
| Creator kick | ✅ | `server/routes/groups.js` |
| Silence mode | ✅ | `server/routes/messages.js` |
| Fuzzy location (neighborhood only) | ✅ | `server/services/location.js` |
| Group health indicator | ✅ | `toxicityScore` → `health_score` column |
| Area Alerts | ✅ | `is_alert` group type |
| Place Memories (tips) | ✅ | `server/routes/places.js` + `PlacesPage.jsx` |
| Ghost Trail min-score gate | ✅ | join requests + group creation |

## Build order (as you suggested)

1. **Now** — Core loop working: create group → join → chat → expire ✅
2. **Next** — Ghost Trail refinement: cross-device persistence, score display in group list
3. **Then** — Place Memories: surface tips on a map, prompt on group expiry
4. **Later** — Health indicator NLP: swap `bad-words` for a proper ML classifier

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SESSION_SECRET` | 32+ char random string |
| `PORT` | Server port (default: 4000) |
| `WEB_ORIGIN` | CORS origin for web (default: http://localhost:5173) |
| `VITE_API_URL` | Web → server API base URL |
| `VITE_WS_URL` | Web → server WebSocket URL |

## Production deploy (Phase 1 — Railway/Render)

1. Push to GitHub
2. Create a Railway project, add PostgreSQL + Redis plugins
3. Set environment variables from `.env.example`
4. Deploy `server/` as the Node.js service
5. Deploy `web/` as a static site (after `npm run build`)
6. Set `WEB_ORIGIN` to your web domain, `VITE_API_URL` to your server domain

Estimated cost: ~$50–100/month on Railway for 0–10k DAU.
