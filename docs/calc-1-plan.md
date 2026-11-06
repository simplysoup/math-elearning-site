# Calculus 1 course plan

Paused at Nicholas's request, 2026-11-06. The course is not built
yet. This file holds the structure and the video research so the
build can resume without redoing the searches.

## Structure

4 units, 12 lessons. Each lesson: a short Markdown explanation, one
interactive visualization (teacher-written JavaScript, `custom-code`
block), one short YouTube video, one multiple-choice check question.

- Unit 1: Limits
  1. What is a limit?
  2. Evaluating limits
  3. Continuity (and asymptotes)
- Unit 2: The Derivative
  4. The derivative as a limit (secant lines -> tangent)
  5. Differentiation rules (power, product, quotient)
  6. The chain rule
- Unit 3: Applications of Derivatives
  7. Related rates (falling ladder)
  8. Optimization (box volume)
  9. Curve sketching (increasing/decreasing, concavity)
- Unit 4: Integrals
  10. Antiderivatives
  11. Riemann sums and definite integrals
  12. The Fundamental Theorem of Calculus

## Video candidates

All Khan Academy unless noted. "Found in search output" means the
URL appeared verbatim in a search result; those IDs still need a
final existence check (YouTube oEmbed) before the course is built.
"Needs ID" means no video ID surfaced yet.

1. What is a limit? — https://www.youtube.com/watch?v=riXcZT2ICjA
   "Introduction to limits | Limits | Differential Calculus | Khan
   Academy", about 11:32. Found in search output.
2. Evaluating limits — https://www.youtube.com/watch?v=gWSDDopD9sk
   "Limit examples (part 3) | Limits | Differential Calculus | Khan
   Academy". Found in search output.
3. Continuity — https://www.youtube.com/embed/33J1JHSTv2k
   "Continuity at a point | Limits and continuity | AP Calculus AB |
   Khan Academy". Embed URL from a video index; verify before use.
   Alternate: "Continuity over an interval",
   https://www.youtube.com/watch?v=ENIQiqxFpBc (found in search output).
4. The derivative as a limit — NEEDS ID. "Derivative as a concept"
   (Khan Academy) — the Khan page would not load for the text
   fetcher (client challenge). Find its YouTube ID before building.
5. Differentiation rules — https://www.youtube.com/watch?v=z1lwai-lIzY
   "Power rule introduction (old) | Taking derivatives | Khan
   Academy". Found via a video index Source line; verify before use.
   Alternates (embed URLs from a UBC guide): product rule
   https://www.youtube.com/embed/79ngr0Bur38, quotient rule
   https://www.youtube.com/embed/ho87DN9wO70.
6. The chain rule — https://www.youtube.com/watch?v=0T0QrHO56qg
   "Chain rule | Derivative rules | AP Calculus AB | Khan Academy".
   Found in search output.
7. Related rates — https://www.youtube.com/embed/ELetzk6BZow
   "Ladder Rate-of-Change Problem | Khan Academy". Embed URL from
   the Khan Academy mirror; verify before use. Alternate:
   "Related rates: Approaching cars",
   https://www.youtube.com/watch?v=wV59XWLmv0c (found via archive.org
   Source line).
8. Optimization — ID 1TK8V_qmqrk, "Optimizing box volume
   graphically" (Khan Academy). ID taken from a mirror's .mp4
   filename; verify before use. Alternate (Lumen Learning):
   https://www.youtube.com/embed/_lNDHOV2FlQ.
9. Curve sketching / concavity — NEEDS ID. "Introducing concavity"
   (Khan Academy) — no video ID surfaced in search output. Find
   its YouTube ID before building.
10. Antiderivatives — ID MMv-027KEqU, "Antiderivatives and
    indefinite integrals" (Khan Academy), about 3:43. ID taken from
    a mirror's .mp4 filename; verify before use. Alternate:
    "Indefinite integrals (part II)",
    https://www.youtube.com/watch?v=mHvSYRUEWnE.
11. Riemann sums — https://www.youtube.com/embed/dEAk0BHBYCM
    "Riemann approximation introduction | Accumulation and Riemann
    sums | AP Calculus AB | Khan Academy". Embed URL from a course
    page iframe; verify before use. Alternate: "Introduction to
    integral calculus", ID WDZMjYJyH6k, about 4:52 (from a search
    mirror; verify before use).
12. The Fundamental Theorem of Calculus — https://www.youtube.com/watch?v=WapSrovs7yM
    "Finding derivative with fundamental theorem of calculus | AP
    Calculus AB | Khan Academy". Found in search output. Alternate:
    "Proof of fundamental theorem of calculus",
    https://www.youtube.com/watch?v=pWtt0AvU0KA (about 14 minutes,
    long for this course; prefer the shorter one).

## Visualization notes (for the build)

- Lessons 4 and 11 need custom drawing on top of `viz.plot`, so
  the build first extends the plot API to return
  `{ svg, toPx, toPy }` (not built yet — resume step 2 below). Lesson 4:
  secant line through (a, f(a)) and (a+h, f(a+h)), h on a slider,
  approaching the tangent as h -> 0. Lesson 11: Riemann rectangles
  under the curve, n on a slider, with the running sum.
- The other lessons use `viz.plot` + `viz.slider` directly: limit
  approach (x slider toward the point), power rule (n slider, f
  and f' together), chain rule (inner coefficient slider),
  related rates (time slider, ladder position), optimization (cut
  size slider, volume curve), concavity (x slider, sign of f'),
  antiderivatives (C slider, the family of curves), FTC
  (accumulation function with x slider, computed numerically).
- Ownership: the course will be created under a builder account
  (the author has no account on the live site yet). Transfer
  ownership to his account once he registers.

## Resume steps

1. Verify every candidate ID above with the YouTube oEmbed
   endpoint (`https://www.youtube.com/oembed?url=...&format=json`
   returns the title, or 404). Find IDs for lessons 4 and 9.
2. Extend `viz-host.html` so `viz.plot` returns `{ svg, toPx, toPy }`
   (small change; update the editor help text and the marketplace
   spec line), rebuild, test, deploy, re-run the viz regression
   check.
3. Write the course-builder script (create course, units, lessons,
   PUT content per lesson), run it against the live API, publish
   the course.
4. Verify in a real browser: 4 units, 12 lessons, viz frames ready,
   video embeds present, gating works.
