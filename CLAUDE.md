# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: kevscan

**What it is:** A portfolio-stage, SaaS-style app that ingests CISA KEV (Known Exploited Vulnerabilities) entries and malware intelligence, runs agentic scoring against that data, and surfaces a prioritized patch queue (Patch Now / Patch Soon / Monitor) for vulnerability management.

**Why it exists:** This is a vulnerability management portfolio piece — not a live monetized product. There are no pricing tiers and no paying customers. The audience is technical reviewers (hiring managers, technical interviewers) evaluating this as a demonstration of security and engineering skill, not prospects deciding whether to buy.

> **Important:** Do not add billing, checkout, subscription tiers, or other monetization features unless explicitly asked. That is not the current scope of this project, regardless of what "SaaS-style" might imply.

- Repo: `github.com/rickhenderson/kevscan`
- Local path: `~/kevscan-cloud` (WSL, machine "Dad")

## Stack

npm workspaces monorepo (`apps/*`), three independent services:

- **`apps/web`** — React 18 SPA, Vite 7, React Router 7, Tailwind + shadcn/ui (Radix primitives), react-hook-form + zod. Talks to PocketBase directly for auth/data and to the Express API for scan/export/sync logic.
- **`apps/api`** — Express 5 (ESM) service. Thin orchestration layer: parses uploaded SBOMs, matches libraries against KEV data, generates exports, and runs the scheduled CISA sync. Not a REST wrapper around its own database — PocketBase is the actual store.
- **`apps/pocketbase`** — [PocketBase](https://pocketbase.io) (vendored binary, `apps/pocketbase/pocketbase`, currently v0.38.0) as the backend-as-a-service: SQLite storage, auth, and authorization rules, extended with JS migrations (`pb_migrations/`) and hooks (`pb_hooks/*.pb.js`).

This project was originally scaffolded inside **Hostinger Horizons** (an AI website-builder platform) — that's why `apps/web` has `plugins/visual-editor`, `plugins/selection-mode`, an iframe-route-restoration plugin, and error/console-forwarding scripts injected in `vite.config.js`. Those only activate in dev (`isDev`) and only do anything when the app is loaded inside Horizons' hosted iframe — safe to ignore for normal local CLI work.

## Repository structure

```
kevscan-cloud/
├── apps/
│   ├── api/                  # Express service
│   │   └── src/
│   │       ├── main.js       # app entrypoint, middleware wiring
│   │       ├── routes/       # health-check, upload, scan, cisa-sync, export, schedule-config
│   │       ├── middleware/   # error handler, global rate limit
│   │       └── utils/        # logger, pocketbaseClient (superuser SDK client), scheduler (node-schedule)
│   ├── pocketbase/
│   │   ├── pocketbase         # vendored PocketBase binary
│   │   ├── pb_migrations/     # schema history, JS migration files, timestamp-ordered
│   │   ├── pb_hooks/          # server-side JS hooks (mailer, verification emails, admin dashboard proxy)
│   │   └── pb_data/           # SQLite data + local file storage (gitignored contents)
│   └── web/
│       ├── src/
│       │   ├── pages/         # route-level components
│       │   ├── components/ui/ # shadcn/ui primitives
│       │   ├── contexts/      # AuthContext (wraps PocketBase authStore)
│       │   └── lib/            # pocketbaseClient.js, apiServerClient.js
│       └── plugins/            # Horizons-specific vite plugins (see Stack note above)
├── package.json       # workspace root; orchestrates the three apps via `concurrently`
└── package-lock.json
```

## Architecture notes (read before touching cross-service behavior)

- **Local dev runs all three services together.** Root `npm run dev` starts web (port 3000), api (port 3001), and pocketbase (port 8090) concurrently. `npm run build` only builds `web`. `npm run start` runs `api` + `pocketbase` (production-style, no web dev server) — it is **not** a test suite.
- **The web app's PocketBase/API clients point at `/hcgi/platform` and `/hcgi/api`** (`apps/web/src/lib/pocketbaseClient.js`, `apps/web/src/lib/apiServerClient.js`). These paths are meant to be reverse-proxied to PocketBase (8090) and the Express API (3001) by Hostinger Horizons' hosting layer. There is no local vite proxy for them — running `apps/web` standalone outside that hosting environment, these requests won't resolve. When debugging web ↔ backend integration locally, hit `localhost:8090` / `localhost:3001` directly or add a dev proxy.
- **Authorization lives in PocketBase, not Express.** `apps/api` authenticates to PocketBase as a superuser service account (`pocketbaseClient.js` auto-authenticates with `PB_SUPERUSER_EMAIL`/`PB_SUPERUSER_PASSWORD`) and does not forward or check the calling user's identity — there's no auth middleware in `apps/api/src/middleware`. Per-user/per-role access control (record ownership, admin-only collections) is enforced entirely via PocketBase collection `createRule`/`viewRule`/etc., defined in `apps/pocketbase/pb_migrations/*_created_*.js`. Keep this in mind before assuming an Express route is guarded — it usually isn't; the guard is upstream in PocketBase or absent.
- **Core scan flow:** `POST /upload` detects SBOM format (CycloneDX JSON, SPDX JSON, or a flat JSON array), extracts a library list, and creates an `uploads` record plus a pending `scans` record → `POST /scan` matches each library against the `cisa_kev_vulnerabilities` collection by product name and a version-range check (`versionInRange` in `apps/api/src/routes/scan.js`), then marks the scan `completed` → `POST /export-scan` renders a completed scan as PDF (`pdfkit`) or CSV (`csv` package).
- **KEV ingestion:** `GET /cisa-kev-sync` fetches CISA's published KEV feed and upserts it into `cisa_kev_vulnerabilities` by `cveId`, logging each run to `sync_logs`. `apps/api/src/utils/scheduler.js` runs this automatically on a cron schedule (`node-schedule`), sourced from the `schedule_config` PocketBase collection if present, else `CISA_KEV_SYNC_SCHEDULE`/`CISA_KEV_SYNC_TIMEZONE` env vars.
- **PocketBase schema changes go through migrations.** Add a new timestamped file to `pb_migrations/` rather than hand-editing `pb_data/`; migrations run automatically on `pocketbase serve` startup. Custom server-side logic (branded verification emails, mailer, the `/` route that proxies PocketBase's own admin UI from Horizons' CDN) lives in `pb_hooks/*.pb.js`, PocketBase's JS hooks runtime — not to be confused with `apps/api`.

## Commands

```bash
npm install
npm run dev      # runs web (3000) + api (3001) + pocketbase (8090) concurrently
npm run build    # production build of the web app only
npm run start    # runs api + pocketbase (production-style); does not start web
npm run lint     # lints web and api
```

Per-app equivalents (useful when only touching one service): `npm run dev --prefix apps/web`, `--prefix apps/api`, or `--prefix apps/pocketbase`. `apps/pocketbase/package.json` also has `migrations:up` / `migrations:revert` / `migrations:snapshot` for schema work.

## Conventions

- Small, scoped commits — one concern per commit, descriptive messages. Don't bundle unrelated changes into one commit.
- Match the existing code style/patterns in whatever file you're editing rather than introducing a new pattern, unless asked to standardize something.
- Favor low-maintenance, dependency-light solutions. This is a solo-maintained project — don't introduce a new framework, state library, or heavy dependency without flagging it first and explaining why.
- Don't restructure or rewrite working code as a side effect of an unrelated task. If something genuinely needs a bigger rework, flag it and explain the tradeoff instead of doing it unprompted.

## Security (non-negotiable for this repo)

This is a security-focused portfolio piece — sloppy security hygiene here undercuts the entire premise of the project.

- Never commit secrets, API keys, tokens, or credentials. `.env` stays in `.gitignore` and out of git history, including old commits.
- Before committing, check for accidentally staged secrets: `git status`, `git diff --staged`.
- Set security headers where applicable (CSP, HSTS, X-Frame-Options) and validate all external/user input.
- Flag known CVEs in dependencies rather than silently leaving them — don't just run `npm audit fix --force` without reviewing what it changes.
- Keep the KEV ingestion and scoring logic legible and well-commented. A reviewer skimming the code should be able to follow *how* the prioritization works, not just confirm that it runs.

## Verification

- Run the test suite and linter before considering any change done.
- For anything touching the UI, actually render the page (dev server or build output) and look at it — don't infer correctness from the diff alone.
- For anything touching the KEV/scoring pipeline, add or update a test with real sample data rather than eyeballing sample output.

## Workflow

- Work on a branch, not directly on `main`. Commit there (and open a PR if working solo-with-review) rather than merging straight in.
- Don't deploy to production as a side effect of a coding task. Flag when something's ready to ship and let me trigger the actual deploy.

## Known issues / TODO

- No automated test suite exists yet (no jest/vitest/mocha, no `test` script in any `package.json`). The Verification section above assumes one — until it exists, verify manually (dev server + real sample data) and flag this gap rather than silently skipping verification.
- `app.tar.gz` was removed from the repo root (2026-07-06) — it was an earlier snapshot of the same `apps/` tree, superseded by current code. Two things surfaced while reviewing it before deletion, in case they matter later:
  - It contained `apps/pocketbase/pb_hooks/superusers-allow-list.js` + `superusers.pb.js`, an IP-allowlist that restricted PocketBase superuser/admin operations to specific IPs. Those hooks are **not** in the current `pb_hooks/` — confirmed as intentional (tied to old hosting infra IPs, not needed now), not carried forward.
  - It also contained a stray `apps/api/.env` (placeholder-looking values, not live secrets) — since the archive itself was committed in the initial commit, that `.env` is still present in git history via that blob even after this removal. Not currently planned to rewrite history over it since the values aren't real credentials, but flag if that changes.
- `[Keep this section updated as things come up — this file should stay a living doc, not a one-time snapshot.]`
