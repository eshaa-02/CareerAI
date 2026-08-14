# CareerAI — AI-Powered Job Portal

A full-stack job portal built with Next.js, Express, MongoDB, and Socket.io, featuring
AI-driven resume/job matching, real-time notifications, and dual dark/light themes
(futuristic emerald dark mode, luxury camel & sage light mode).

## ⚠️ Current build status — read this first

This project was generated in a chat session with no ability to install packages,
run a dev server, or execute a test suite — **nothing here has been compiled or run
by the tool that wrote it.** Everything below reflects static verification (every
import checked to resolve to a real file, every service method call checked against
its actual export, key business logic cross-referenced against the source it claims
to match) — a stronger guarantee than "trust me," but not the same as "it ran green."
Run it and tell me what actually happens; the fastest fixes come from a real error
message, not another round of guessing.

**Fully built, frontend and backend both, all 26 dashboard sidebar routes real:**
- Complete backend: all models, controllers, routes, middleware, AI matching engine,
  Socket.io real-time layer, validation, security, seeder + standalone `createAdmin.js`.
- **Interview Management System, backend + frontend:** full lifecycle (schedule →
  invitation → accept/decline/reschedule-request → in-progress → completed → outcome),
  private employer notes, multi-interviewer feedback + ratings, activity/audit trail,
  `.ics` calendar export, 24h/1h email + socket reminders via `node-cron`, 8 premium
  HTML email templates over SMTP (falls back to console logging with no provider
  configured). Candidate interview portal (accept/decline/reschedule/join/countdown)
  and employer interview management page are both wired to real endpoints.
- Every public page: homepage (real DB-driven stats), job search + detail with live
  AI match scoring, company directory, about, contact (EmailJS), login/register.
- **Every candidate dashboard page:** overview, profile editor, resume, AI matching
  (ranked list), applications tracker, saved jobs, interviews, real-time messages,
  notifications, settings.
- **Every employer dashboard page:** overview, company profile, post-job, manage
  jobs, applicants review (this is where `ScheduleInterviewForm` is actually mounted
  now), interviews, analytics (charts), messages, notifications, settings.
- **Every admin dashboard page:** overview, user management, company verification,
  job moderation, platform analytics (charts), interview reports.
- Docker (multi-stage, non-root, healthchecked) for both services + Compose stack,
  GitHub Actions CI (test/lint/build/docker-build) + a CD workflow gated on it,
  a real backend test suite (Jest + Supertest + `mongodb-memory-server` — actual
  ephemeral MongoDB, not mocks) and a frontend test scaffold (Jest + RTL).

**Genuinely not built** — no longer "the whole dashboard," now specific and smaller:
- Interview calendar (month/week/day grid view) — only list/tab views exist.
- AI-generated interview questions, AI feedback summaries, candidate comparison,
  recruiter @mentions, PDF schedule export, recording-link UI — all marked "bonus"
  in the original brief; correctly the first things cut given real scope.
- Forgot/reset password *pages* (the backend endpoints exist; no frontend UI).
- Interview attachments: the schema field exists, there's no upload endpoint or UI.
- Test coverage is a scaffold, not exhaustive — most dashboard pages have zero tests.

## Getting this running

### Option A — Docker Compose (fastest way to see the whole stack)
```bash
git clone <your-repo>
cd job-portal
cp backend/.env.example backend/.env   # fill in JWT_SECRET at minimum
docker compose up --build
```
This starts MongoDB, the backend, and the frontend together. Frontend at
`http://localhost:3000`, backend at `http://localhost:5000`. Note: Mongo runs
as a local container here, not your Atlas cluster — fine for trying the app,
but for real data persistence point `MONGO_URI` at Atlas instead (see the
`environment:` block in `docker-compose.yml`).

Seed demo data into the Dockerized Mongo:
```bash
docker compose exec backend npm run seed
```

### Option B — Run natively (what you need for active development)
```bash
git clone <your-repo>
cd job-portal
npm run install:all
```

### 1. MongoDB Atlas
Create a free cluster, get your connection string.

### 2. Backend environment
```bash
cp backend/.env.example backend/.env
# fill in MONGO_URI, JWT_SECRET, CLIENT_URL
```

### 3. Frontend environment
```bash
cp frontend/.env.local.example frontend/.env.local
# fill in NEXT_PUBLIC_API_URL and EmailJS keys (emailjs.com, free tier)
```

### 4. Seed demo data (optional but recommended)
```bash
npm run seed
```
Creates an admin, an employer with a verified company, three sample jobs, a
candidate with a filled-in profile, and one sample interview invitation so the
Interview Management module has real data on first load. Credentials are
printed to the console.

### 5. Run it
```bash
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

## Tech stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Socket.io-client
- **Backend:** Node.js, Express, MongoDB/Mongoose, Socket.io, JWT + bcrypt
- **AI Matching:** rules-based weighted scoring engine (skills 60% / experience 30% / education 10%) — see `backend/services/aiMatchingService.js`

## Folder structure
```
job-portal/
├── backend/
│   ├── controllers/   # request handlers
│   ├── models/        # Mongoose schemas
│   ├── routes/         
│   ├── middleware/    # auth, validation, rate limiting, upload, errors
│   ├── services/       # AI matching, notifications, socket
│   ├── socket/
│   └── config/
├── frontend/
│   ├── app/            # Next.js App Router pages
│   ├── components/
│   ├── context/         # Auth, Theme, Socket providers
│   ├── services/        # typed API client functions
│   └── types/
```

## API overview
All routes are under `/api`. Key groups: `/auth`, `/users`, `/candidates`,
`/companies`, `/jobs`, `/applications`, `/notifications`, `/messages`, `/admin`,
`/employer`, `/stats`, `/interviews`. Every controller file is documented with
`@route`/`@access` comments — that's the fastest way to see what's available
while building the remaining dashboard pages.

## Testing

Backend tests use Jest + Supertest + `mongodb-memory-server` (a real,
ephemeral MongoDB — not mocks), so they exercise actual Mongoose validation,
hooks, and indexes:
```bash
cd backend
npm test
```
Covers: registration/login (including the admin-role-escalation guard),
the full apply → shortlist → schedule-interview → accept flow end-to-end,
the AI matching engine's scoring logic, and the candidate profile completion
percentage calculation.

Frontend tests use Jest + React Testing Library:
```bash
cd frontend
npm test
```
Covers the shared formatting helpers and the `Button` component. This is a
starting scaffold, not full coverage — no component in `app/dashboard/`
has tests yet; if you add more, colocate them in `frontend/__tests__/`.

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`/`develop`: backend
tests, frontend lint + tests + build, and a Docker build of both images (using
GitHub's own runners, which — unlike the environment this project was
originally generated in — have full internet access, so these steps actually
install and execute for real).

`.github/workflows/deploy.yml` triggers deploy hooks after CI passes on
`main`. It does nothing until you add `VERCEL_DEPLOY_HOOK_URL` and/or
`RAILWAY_DEPLOY_HOOK_URL` as repo secrets — both platforms also auto-deploy
on push by default if you connect the repo directly in their dashboards,
which is simpler than this workflow if you don't need deploys gated on CI.

## Architecture & API docs

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system diagrams (request flow,
  auth flow, AI matching data flow, real-time notification delivery, data
  model relationships) plus an honest "known limitations" section covering
  things like ephemeral disk storage for uploads on Railway/Render.
- [`API.md`](./API.md) — every route, generated directly from the route
  files rather than written from memory, so it can't silently drift.

## Deployment

### Docker (self-hosted / any VPS)
```bash
docker compose -f docker-compose.yml up --build -d
```
Point `MONGO_URI` at Atlas rather than the bundled Mongo container for
anything beyond local testing — see the compose file's `environment:` block.
**Important:** file uploads are stored on local disk inside the backend
container — see the "Known limitations" section of `ARCHITECTURE.md` before
relying on this in production; a redeploy wipes uploaded resumes/logos unless
your host platform preserves named volumes across deploys (the compose file
mounts one, `backend-uploads`, but not every platform honors this the same
way — confirm on yours).

### Platform-as-a-Service (original recommendation)
- **Frontend:** Vercel — set root directory to `frontend`, add the env vars above.
- **Backend:** Railway or Render — set root directory to `backend`, add env vars,
  ensure `PORT` is read from `process.env.PORT`.
- **Database:** MongoDB Atlas — whitelist your deployment platform's IPs (or 0.0.0.0/0).

## Recommended next step
This is a large, multi-week build. For finishing the remaining dashboard pages
against the existing backend, **Claude Code** (desktop or terminal) is a much
better fit than a chat session — it can run the dev server, catch real errors,
and iterate against a live app instead of generating code blind.
