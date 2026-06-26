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

Local dev can run with auth bypass enabled:

- ODYSSEY_DEV_AUTH_BYPASS=true
- NEXT_PUBLIC_ODYSSEY_DEV_AUTH=true

Disable both for strict auth behavior.

## Standalone Compatibility Layer

Former monorepo imports are now mapped to local adapters under src/standalone:

- @iliad/ui
- @iliad/auth and @iliad/auth/middleware
- @iliad/core
- @iliad/firebase/admin
- @iliad/ai

This keeps the app code stable while removing monorepo coupling.
