# math-elearning-site

An unfinished math e-learning site: a React + TypeScript frontend, a FastAPI
backend, and a PostgreSQL database, composed with Docker.

> **Status: unfinished, last active May 2025.** The last commit on the
> default branch (`master`) is "fixed login page bugs. added profile page
> (no backend support)". Treat anything below marked "unverified" as not
> confirmed to work — this README describes what is in the repository, not
> a tested, working deployment.

## What it is

- Browse courses, chapters, and lessons, with lesson content rendered as
  Markdown and math (the frontend uses `react-markdown`, `marked`,
  KaTeX/`react-katex`, and DOMPurify), plus interactive visualizations:
  the first is a "combine like terms" graph (ax + bx) in the Algebraic
  Variables lesson, rendered as plain SVG with sliders, no extra
  charting dependency. Visualization blocks are stored as JSON configs
  in `visualization_contents` and served by the lesson-content endpoint.
- Auth pages and a profile page exist in the frontend.
- The backend exposes registration, login, and email verification, plus
  course read/create endpoints (see `api/main.py`).
- Course data also exists as `web/` course JSON data; how much of the UI
  reads from the API versus local data was not verified end to end.

## Layout

```
web/               React + TypeScript + Vite frontend
  src/main.tsx     Entry point — renders AppRouter, not src/App.tsx
  src/routes/      Router: /, /courses/:courseId,
                   /courses/:courseId/chapters/:chapterId/lessons/:lessonId,
                   /editor, /about, /login, /profile
  src/pages/       Landing, Course, Lesson, About, Auth, Profile pages
  src/components/  Auth, lesson, and editor components
  README.md        Stock Vite template — not project documentation
api/               Python FastAPI backend (uvicorn main:app, port 18766)
  main.py          FastAPI app: /register, /login, /verify-email/{token},
                   /courses/, /courses/{course_id}
  auth.py, models.py, schemas.py, database.py, passwords.py, oauth.py, utils.py
  requirements.txt FastAPI, SQLAlchemy, psycopg2, python-jose, argon2, etc.
db/                PostgreSQL setup (Dockerfile, start.sh)
docker-compose.yml Services: db (internal), api (internal), web (18765)
```

## Known limitations — read before running

- **Profile page backend support is missing as far as can be seen.**
  `ProfilePage` fetches `/user` with a bearer token, but no matching
  `/user` route was found in the API code. The last commit message says
  the profile page has "no backend support", which matches that finding.
  Do not assume the profile page works against the API.
- **Frontend entry point is not `App.tsx`.** `web/src/App.tsx` is the
  stock Vite + React counter template and is not used by `main.tsx`,
  which renders `AppRouter` instead.
- **Compose wiring.** The compose file maps the web service to port
  18765 and the API to 18766 (internal only). The browser reaches the
  API through nginx's same-origin /api proxy; no VITE_API_URL is set
  in a production build.
- **No root README existed before this file.** `web/README.md` is still
  the stock Vite template and was intentionally left alone here.

## Running

Secrets live in environment files, never in the repo. Before the first run:

```bash
cp api/.env.example api/.env       # set DATABASE_URL and SECRET_KEY
cp web/.env.example web/.env       # local dev only; optional
# For compose, also create a .env at the repo root with:
#   POSTGRES_PASSWORD=<a strong password>
#   SECRET_KEY=<a long random string>
docker compose up --build
# web on 18765; the API is reached through the same-origin /api proxy,
# the database is not published to the host.
```

On startup the API container runs Alembic migrations (`alembic upgrade
head`, stamping the baseline if the database was created before
migrations existed) and seeds the sample course if the database is
empty (`api/seed.py`). Schema changes go in new Alembic revisions
(`alembic revision --autogenerate`), never in hand-edited SQL.

For frontend development alone, `web/package.json` defines
`npm run dev` (Vite), `npm run build` (`tsc -b && vite build`),
`npm run lint`, and `npm run preview`. The API runs
`uvicorn main:app --host 0.0.0.0` on port 18766 (no `--reload` in
the container).

## Cleanup flags (actioned Nov 5, 2026)

- The previously committed `web/.env` and `db/pgdata` are no longer
  tracked; both are gitignored. The values they contained were
  example/placeholder credentials, but they remain in git history —
  rotate any real secret that was ever committed before deploying.
