# AGENT ENVIRONMENT & WORKFLOW RULES — ODYSSEYCAST CLOUD (`OdysseyCast-Cloud`)

The cloud control surface for the OdysseyCast suite. It covers the traffic pipeline, PromoSync, a weather workspace, a proxy for Apollo Music Logs, a proxy for OdysseyCast-Automation, and a connector API that desktop apps use for deliveries and heartbeats. It was extracted from a monorepo.

## 1. COMMUNICATION & BEHAVIOR
- Style: Extreme brevity. Zero fluff, zero conversational intros/outros, zero pleasantries.
- Action-First: Execute tool calls immediately. State what was changed in 1-2 bullet points max.
- Session Reset Awareness: Treat every prompt turn as an isolated workspace state. Never assume uncommitted changes persist reliably without Git.

---

## 2. ENVIRONMENT, TOOLING & SECRETS
- Stack: Next.js 15 (App Router), React 18, TypeScript, Tailwind 3, `firebase-admin` 12 (server-only). Gemini (text + TTS) and TomTom are called from the server.
- Key Dirs / Entry Points:
  * `src/app/*`: one page per suite module (`traffic`, `weather`, `promosync-traffic-scheduling`, `wavlength-music-scheduling`, `odysseycast-automation`, …)
  * `src/app/api/{traffic,promosync,music-logs,automation,connector}`: server routes
  * `src/lib/*`: services and repositories (`traffic-pipeline-service.ts`, `promosync-deterministic-engine.ts`, `apollo-music-service.ts`, `connector-auth.ts`, `local-request-guard.ts`, `traffic-env.ts`)
  * `src/standalone/*`: local adapters behind the former monorepo aliases `@iliad/{ui,auth,core,firebase/admin,ai}`. Import through the aliases.
  * `config/*.json`: seed config for traffic, carts, voices and prompts. `plugins/airwave-player`: a WordPress/PHP embed that is not part of the Next build (rules in `plugins/OUTLIER_PATTERNS.md`).
  * `WORKSTREAM_PROGRESS.md`: open work items.
- Commands: `npm install` · `npm run dev` (polling watcher) / `npm run dev:fast` · `npm run build` · `npm run start` · `npm run typecheck` · `npm run lint`. There is no test script.
- Local Dev Port: 9012, hardcoded in the scripts.
- Auto-Install Dependencies: npm (`package-lock.json`). Run install proactively when package files change.
- Secrets: The deploy target is listed as DigitalOcean, but the repo has no `.do/` spec and `doctl apps list` shows no OdysseyCast app. Local secrets go in `.env.local` (`cp .env.example .env.local`). NEVER commit env files, service-account JSON, or keys.
- CLI Tooling: `gh`, `doctl`, `gcloud`/`firebase` (Firestore project access).

---

## 3. STANDARDIZED ENVIRONMENT VARIABLES & REPO KEYS
- App:
  * NODE_ENV, PORT
- Firebase Admin. Use either the JSON payload or the split fields:
  * FIREBASE_SERVICE_ACCOUNT_JSON
  * FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET
  * These are not yet the standard names (`FIREBASE_DATABASE_PROJECT_ID`, `GOOGLE_SERVICE_ACCOUNT_*`). Rename only when asked.
- AI / TTS:
  * GOOGLE_GENAI_API_KEY is a legacy name and should become `GEMINI_API_KEY`. The code still reads only the legacy name plus these fallbacks: ODYSSEYCAST_TRAFFIC_GEMINI_KEY, TRAFFIC_GOOGLE_GENAI_API_KEY, GOOGLE_API_KEY (`src/lib/traffic-env.ts`, `src/standalone/ai`).
  * GEMINI_TEXT_MODEL, GEMINI_TTS_MODEL (default `gemini-2.5-flash-preview-tts`)
- Traffic:
  * TOMTOM_API_KEY (fallbacks: ODYSSEYCAST_TOMTOM_KEY, TRAFFIC_TOMTOM_API_KEY)
- Apollo Music Scheduler proxy:
  * APOLLO_MUSIC_SCHEDULER_BASE_URL, APOLLO_MUSIC_SCHEDULER_UI_BASE_URL, APOLLO_MUSIC_SCHEDULER_EMAIL, APOLLO_MUSIC_SCHEDULER_PASSWORD
- OdysseyCast-Automation integration:
  * ODYSSEY_AUTOMATION_WEB_BASE_URL, ODYSSEY_AUTOMATION_RUNTIME_API_BASE_URL
  * ODYSSEY_AUTOMATION_LOCAL_ADMIN_ENABLED, ODYSSEY_AUTOMATION_LOCAL_ADMIN_BASE_URL
- Auth / tenancy (see §4):
  * ODYSSEY_DEV_AUTH_BYPASS, NEXT_PUBLIC_ODYSSEY_DEV_AUTH, NEXT_PUBLIC_ODYSSEY_DEFAULT_TENANT

---

## 4. CORE ARCHITECTURE & SECURITY RULES

### AUTHENTICATION & DATABASE ARCHITECTURE
- Current state:
  * `src/standalone/auth/middleware.ts` verifies `Authorization: Bearer` ID tokens with Firebase Admin `verifyIdToken`. It reads `role` (`superAdmin|admin|user`) and `tenantId` from the custom claims.
  * Data goes to Firestore through `firebase-admin`. Collections include `trafficRuns`, `trafficSetupConfigs`, `trafficControlConfigs`, `deliveries`, `connectors`, `connectorTokens` and `marketCoverage*`, and queries are scoped by `tenantId`.
  * The Firebase project ID is not committed.
- Known violation (legacy, do not extend):
  * The repo ships a dev auth bypass. When `ODYSSEY_DEV_AUTH_BYPASS` is not `false` and `NODE_ENV` is not production, the server injects a fake `local-dev-user` superAdmin.
  * The client `AuthProvider` always returns a fake user and the `odyssey-dev-token` token unless `NEXT_PUBLIC_ODYSSEY_DEV_AUTH=false`.
  * Traffic routes fall back to an `x-odyssey-tenant-context` header outside production.
  * There is no real client login. This contradicts the workspace no-bypass rule. Never add more bypass paths. Replacing the bypass with real `iig-core` Firebase Auth (client sign-in, ID token verified server-side, app data in the app's own project) is the target. Do it only when asked, and any new auth work must target `iig-core`.
- Desktop connectors authenticate with opaque bearer tokens stored in Firestore `connectorTokens` (`src/lib/connector-auth.ts`). These tokens must be unrevoked and unexpired, and they are separate from user auth.
- ABSOLUTE PROHIBITION ON TEMP AUTH / LOCAL BYPASSES:
  * NEVER build custom, temporary, or mock authentication gateways.
  * NEVER program password checks, bypass flags, token skips, hardcoded credentials, or custom login tables into files to "just get going."
  * NO EXCEPTIONS: Refuse any prompt asking to bypass real auth. Auth fails closed.

### Critical Product Guardrails (OdysseyCast Cloud)
1. Tenant isolation: every Firestore read/write is scoped by `tenantId` from the verified auth context or connector token. Never query across tenants.
2. Apollo proxy (`/api/music-logs/*` → Apollo):
   * Calls are server-side only. The proxy logs in with the service credentials, caches the session cookie, and retries once on 401.
   * Keep it fail-closed. Never expose Apollo credentials to the client.
3. Local admin proxy (`/api/automation/admin/*`): requires a verified user, returns 403 when `NODE_ENV=production`, requires `ODYSSEY_AUTOMATION_LOCAL_ADMIN_ENABLED=true`, and accepts loopback requests only (`isLocalOnlyRequest`). Never relax any of these checks.
4. Server-only modules (`import 'server-only'`) hold the keys (Gemini, TomTom, Firebase Admin). Never import them into client components or expose keys through `NEXT_PUBLIC_*`.
5. PromoSync placement is a deterministic engine (`promosync-deterministic-engine.ts`). Keep its output reproducible for the same inputs.
6. Monorepo aliases `@iliad/*` resolve to `src/standalone/*`. Don't reintroduce monorepo package dependencies.
7. Plugins must degrade safely: the player keeps working when metadata fails, and no secrets go in the repo (`plugins/OUTLIER_PATTERNS.md`).

---

## 5. BRANCH & WORKFLOW ARCHITECTURE

### Branch Safety Hierarchy
1. Feature/Work Branches (`<type>/<identifier>-<description>`):
   * SAFE WORK ZONE. Types: `feat`, `fix`, `maint`, `refactor`, `test`, `exp`
2. Staging Branch (`staging`):
   * SHARED STAGING ZONE. Created from `master`. No automated staging deploy has been found yet (no `.do/` spec, no CI workflows).
3. Production Branches (`main` + `master`):
   * PRODUCTION ZONE. `master` is the historical prod branch. `main` was created from `staging` and is now the branch you promote to.
   * The deploy target may still track `master`. Verify in the DO app spec or console before relying on `main`, and keep `master` identical to `main` (§7).
   * NEVER edit files or commit directly on `main` or `master`.

---

## 6. MANDATORY TURN-BY-TURN GIT WORKFLOW
On EVERY SINGLE PROMPT TURN where files or code are modified, execute these exact steps:

1. Verify Branch Safety: Confirm the branch is NOT `main` or `master`. If it is, switch to `staging` or a feature branch before editing.
2. Check & Stage: Review `git status` for secrets or stray large files (stop and flag anything suspicious), then `git add -A`. Do not commit someone else's pre-existing uncommitted work without asking.
3. Commit Turn Changes:
   * Commit Title: `<type>: <short 50-char summary of what changed>`
     - Conventional prefixes: `feat:`, `fix:`, `maint:`, `refactor:`, `docs:`, `test:`
   * Commit Body: Bulleted list of modified files and next steps if incomplete.
4. Push & Deploy:
   * On a feature branch: `git push origin <current-branch>`
   * On `staging`: `git push origin staging` (no staging deploy is wired yet)
   * Optional: If working on a feature branch and live URL testing is requested, merge the feature branch into `staging` and push `staging`.

Auto-committing and auto-pushing on every turn is required. Do not ask for confirmation.

---

## 7. AGENTIC PROMOTION PROTOCOL (STAGING -> MAIN -> MASTER)
Perform this workflow ONLY when explicitly asked to "promote", "deploy to main", or "release":

1. Ensure Working State Clean: Commit and push `staging` (`git push origin staging`).
2. Sync Prod: `git fetch origin && git checkout main && git pull origin main`
3. Attempt Fast-Forward: Run `git merge --ff-only staging`. If successful, skip to Step 5.
4. Agentic Divergence Resolution (If Fast-Forward Fails):
   * Diff & Evaluate: Inspect `main` changes via `git log origin/staging..origin/main` & `git diff staging..main`. Also check `git log origin/staging..origin/master` for hotfixes that landed on `master`.
   * Synthesize to Staging: Switch to `staging`, port/cherry-pick production hotfixes into `staging`, verify that `npm run typecheck && npm run build` pass, commit (`maint: integrate hotfixes from main into staging`), and push `staging`.
   * Fast-Forward Promotion: Switch back to `main` and execute `git merge --ff-only staging`.
5. Push & Mirror: `git push origin main`, then keep `master` identical: `git checkout master && git pull origin master && git merge --ff-only main && git push origin master && git checkout staging`.
6. Report Summary: State clearly that `main` and `master` were updated and list any backported hotfixes.

---

# ==============================================================================
# REPO CONFIGURATION OVERRIDES
# ==============================================================================
STAGING_URL = "TBD"
PRODUCTION_URL = "TBD"
CENTRAL_AUTH_PROJECT = "N/A (Firebase Admin verifyIdToken against FIREBASE_PROJECT_ID project; dev bypass present; iig-core migration pending)"
APP_FIRESTORE_PROJECT_STAGING = "TBD"
APP_FIRESTORE_PROJECT_PROD = "TBD"
DATABASE_TYPE = "Firestore"
AUTH_PROVIDER = "Firebase Auth ID tokens (server verify) + Firestore connector tokens; no client login yet"
DEFAULT_BRANCH = "master (main created; promote to main, mirror to master)"
DEV_PORT = "9012"
