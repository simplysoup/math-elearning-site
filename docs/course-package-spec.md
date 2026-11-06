# Course package spec

A course author should be able to write a whole course locally, in a
single file, in any text editor, and then upload it to the site to
clean up and edit — and preview it locally with the real lesson
renderer before uploading. This spec defines that file and the
import/export flow around it. Nothing in this spec is built yet.

## Goals

- One file per course. Plain text, version-controllable, editable
  without the site.
- The file is the whole course: metadata, units, lessons, and every
  block. No sidecar files for v1.
- Upload creates the course on the site (private by default), where
  the existing web editor takes over for cleanup and edits.
- Export downloads a course back out in the same format, so the loop
  is round-trippable: edit locally or online, move either way.
- A local preview renders the file with the real lesson components,
  so what the author sees locally is what students see live.

## The file format

A Markdown file with YAML frontmatter. `#` headings are units,
`##` headings are lessons, and fenced code blocks are lesson blocks.
Order in the file is the order on the site.

```markdown
---
title: Calculus 1
description: Limits, derivatives, and integrals, with interactive graphs.
level: Beginner
estimated_time_minutes: 600
prerequisites: Algebra and trigonometry
---

# Unit 1: Limits

## Lesson 1: What is a limit?

A limit describes the value a function approaches as x gets
close to a point, even if the function never gets there.

```viz
const a = viz.slider('a', 1, 5, 3, 1);
viz.plot(x => a.value * x, { xMin: 0, xMax: 10, yMin: 0, yMax: 50 });
```

```video
https://www.youtube.com/watch?v=riXcZT2ICjA
Introduction to limits — Khan Academy
```

```question multiple_choice
What is the limit of (x^2 - 1) / (x - 1) as x approaches 1?
- 0
- 1
- *2
- It does not exist
> For x != 1 the expression simplifies to x + 1, so the limit is 2.
```
```

### Mapping to the site's data model

| File element | Site object |
|---|---|
| Frontmatter | Course (title, description, level, estimated_time_minutes, prerequisites) |
| `# Unit` heading | Unit (title, order = file order) |
| `## Lesson` heading | Lesson (title, order = file order) |
| Plain Markdown between blocks | Markdown block (one block per paragraph run) |
| ```` ```python ```` (any language) | Code block (language = fence info string) |
| ```` ```viz ```` | Visualization block, kind `custom-code`, code = fence body |
| ```` ```video ```` | Video block: first line = URL, second line = caption |
| ```` ```question multiple_choice ```` | Multiple-choice question block |
| ```` ```question short_answer ```` | Short-answer question block |

### Question syntax

- `multiple_choice`: the question is the first line. Options are
  `- ` lines; the correct option is prefixed `*` (`- *2`). An
  optional explanation is a `> ` line at the end. Exactly one
  option must be marked correct.
- `short_answer`: the question is the first line, the answer is a
  `> ` line (the accepted answer), with an optional second `> ` line
  as the explanation. Exact-match grading, as on the site today.

### Validation (same rules as the API)

The parser enforces these before anything is created, and reports
errors with file line numbers:

- A course needs a title. A unit needs at least one lesson. A
  lesson needs at least one block.
- Video URLs must be YouTube or Vimeo (same check as the API: the
  embed URL is built from the parsed video ID).
- Visualization code must be non-empty and at most 50,000
  characters.
- A multiple-choice question needs at least one non-empty option,
  exactly one marked correct, and question text.
- A short-answer question needs question text and an answer.
- Unknown fence types are an error, not silently skipped.

## Import

### v1 — client-side, no new backend code

The browser parses and validates the file, then calls the existing
endpoints in order: create course, create units, create lessons, PUT
each lesson's content. Progress and per-lesson errors are shown as
it goes. The course is created private; the author publishes it
from the site when ready.

Limitation to state plainly: v1 is not atomic. If the import fails
halfway (network, a rejected block the parser missed), the course
may exist partly built, and the author finishes or deletes it in
the editor.

### v2 — server-side, atomic

`POST /courses/import` takes the file, parses and validates it on
the server, and creates the course, units, lessons, and content in
one transaction. Any validation error returns the line number and
message, and nothing is created. This is the version to build once
v1 proves the format.

## Export and round-tripping

Export serializes a course back to the same format: frontmatter
from the course row, `#`/`##` headings from units/lessons, and one
fenced block per lesson block, in order. `export(import(file))`
must equal the file up to whitespace, for every supported block.
Export is how an online-edited course gets back into a local file.

## Local renderer

Two pieces, both reusing the real components so the preview is
exact:

1. **Preview route in the web app (`/preview`).** Choose a course
   file; the browser parses it with the same parser as import and
   renders it with the real lesson components, read-only, no login
   and no saving. Gating is off in preview (all units open).
2. **Check script.** `npm run check-course <file>` parses and
   validates the file and prints errors with line numbers, so an
   author catches problems without uploading.

Running it locally is the repo's existing dev stack: clone the repo,
`npm install` in `web/`, `npm run dev`, open `/preview`. The API
is not needed for preview (parsing and rendering are client-side);
it is needed only to test a real import against a local server,
where the API runs on SQLite with the seed data.

## Out of scope for v1

- **Exams.** Unit exams and the final exam are not in the format
  yet. Reserved syntax for a later version: an `## Exam` heading
  under a unit, or a final `## Final exam` heading, with a
  `pass_mark: 70` line and `question` blocks. Do not invent the
  syntax until exams are built into the format.
- **Images and uploaded assets.** The site has no image blocks
  today, so a single file covers everything. If image blocks land,
  the format becomes a package: a zip containing the same Markdown
  file plus the asset files, referenced by relative path. The
  Markdown syntax above stays unchanged.
- **Student data.** Import creates course structure only. No
  enrollments, progress, stars, or comments are ever in a file.

## Open decisions

- File extension: `.md` is enough for v1 (frontmatter marks it as a
  course file); a distinct `.course.md` extension is the fallback
  if plain `.md` causes confusion with ordinary documents.
- Re-import: importing a file for a course that already exists
  should update it in place (matching by course id stored in the
  file's frontmatter after first import) rather than duplicating it.
  The exact matching rule is undecided.
