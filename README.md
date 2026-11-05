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
  KaTeX/`react-katex`, and DOMPurify).
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
api/               Python FastAPI backend (uvicorn main:app, port 8000)
  main.py          FastAPI app: /register, /login, /verify-email/{token},
                   /courses/, /courses/{course_id}
  auth.py, models.py, schemas.py, database.py, passwords.py, oauth.py, utils.py
  requirements.txt FastAPI, SQLAlchemy, psycopg2, python-jose, argon2, etc.
db/                PostgreSQL setup (init.sql, Dockerfile, start.sh)
docker-compose.yml Services: db (5432), api (8000), web (3000)
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
- **Compose wiring is inconsistent (unverified).** The compose file maps
  the web service to port 3000 and the API to 8000, but sets
  `VITE_API_URL` to `http://localhost:3001`, which does not match the
  API port. Running the full stack has not been verified; check and fix
  that value before relying on it.
- **No root README existed before this file.** `web/README.md` is still
  the stock Vite template and was intentionally left alone here.

## Running (unverified)

These commands follow directly from the Dockerfiles and compose file;
they have **not** been run against this repository, so treat them as a
starting point, not a verified setup:

```bash
docker compose up --build
# db on 5432, api on 8000, web on 3000 — see the compose note above
```

For frontend development alone, `web/package.json` defines
`npm run dev` (Vite), `npm run build` (`tsc -b && vite build`),
`npm run lint`, and `npm run preview`. The API Dockerfile runs
`uvicorn main:app --host 0.0.0.0 --reload` on port 8000.

## Cleanup flags (not actioned)

- A `web/.env` file is committed in this public repository. Its contents
  are not reproduced here; check whether it contains any real secrets
  and rotate them if it does, then remove the file from version control.
- A committed `db/pgdata` directory is present. Database data should
  normally live in a Docker volume (the compose file already defines a
  `pg_data` volume), not in the repository. Neither item was deleted
  or changed as part of adding this README.
