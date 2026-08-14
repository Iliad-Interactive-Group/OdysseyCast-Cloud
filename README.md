# OdysseyCast

Standalone Next.js app for OdysseyCast cloud operations.

This repository was extracted from a monorepo so local development can stay fast and low-friction.

## Stack

- Next.js 15 + React 18
- TypeScript
- Tailwind CSS
- Firebase Admin SDK (server-side)
- Gemini + TomTom integrations for traffic pipeline

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

3. Run dev server:

```bash
npm run dev
```

OdysseyCast runs on port 9012 by default.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run lint
```

## Environment Variables

See .env.example for the full template.

Required for runtime features:

- GOOGLE_GENAI_API_KEY for AI text and TTS generation
- TOMTOM_API_KEY for live traffic telemetry
- Firebase Admin credentials for Firestore and Storage
- APOLLO_MUSIC_SCHEDULER_BASE_URL, APOLLO_MUSIC_SCHEDULER_EMAIL, and APOLLO_MUSIC_SCHEDULER_PASSWORD for Music Logs proxying

Local dev can run with auth bypass enabled:

- ODYSSEY_DEV_AUTH_BYPASS=true
- NEXT_PUBLIC_ODYSSEY_DEV_AUTH=true

Disable both for strict auth behavior.

## Music Logs (Apollo) Integration

OdysseyCast-Cloud proxies Music Logs API traffic to Apollo Music Scheduler via server-side routes.

Base route in OdysseyCast-Cloud:

- `/api/music-logs` -> Apollo `/api/day`

Proxy routes:

- `GET /api/music-logs/day`
- `GET /api/music-logs/dashboard`
- `GET /api/music-logs/rules`
- `POST /api/music-logs/rules`
- `GET /api/music-logs/library`
- `POST /api/music-logs/library/add`
- `POST /api/music-logs/library/override`
- `GET /api/music-logs/candidates/:idx`
- `GET /api/music-logs/song-history/:songId`
- `POST /api/music-logs/edit`
- `POST /api/music-logs/move`
- `POST /api/music-logs/move-check`
- `POST /api/music-logs/regenerate`
- `POST /api/music-logs/feature-block`

The proxy signs in to Apollo using the configured service account credentials, caches the Apollo session cookie, and retries once on a 401 by refreshing login. This keeps Apollo auth fail-closed while allowing OdysseyCast-Cloud to operate as the control surface.

## Standalone Compatibility Layer

Former monorepo imports are now mapped to local adapters under src/standalone:

- @iliad/ui
- @iliad/auth and @iliad/auth/middleware
- @iliad/core
- @iliad/firebase/admin
- @iliad/ai

This keeps the app code stable while removing monorepo coupling.
