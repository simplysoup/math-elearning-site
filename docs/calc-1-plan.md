# Calculus 1 course — built and live

Built 2026-11-06, course id 26 on the live site, published to the
marketplace. Owner: the builder account `calc-teacher@example.com`
(the author has no account on the live site yet; transfer ownership
to his account once he registers). Builder script:
`~/workspace/viz-check/build_calc1.py`. Browser check:
`~/workspace/viz-check/check_calc1.js` — 14/14 passed on the live
site (catalogue, gating, viz frames, video embeds, question).

All other test courses were deleted at the same time, so Calculus 1
is the only course on the live site. The test user accounts remain;
only the courses were removed.

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

## Videos used

Every ID below was verified with the YouTube oEmbed endpoint
(HTTP 200 with the expected title) before the course was built.
All Khan Academy unless noted.

1. What is a limit? — riXcZT2ICjA, "Introduction to limits".
2. Evaluating limits — gWSDDopD9sk, "Limit examples (part 3)".
3. Continuity — 33J1JHSTv2k, "Continuity at a point".
4. The derivative as a limit — N2PpRnFqnqY, "Derivative as a
   concept", 7:16.
5. Differentiation rules — z1lwai-lIzY, "Power rule introduction
   (old)". Product/quotient rules are covered in the lesson text;
   their videos (79ngr0Bur38, ho87DN9wO70) were verified but not
   used.
6. The chain rule — 0T0QrHO56qg, "Chain rule".
7. Related rates — ELetzk6BZow, "Ladder Rate-of-Change Problem".
8. Optimization — wS0i9k8UiCg, "Optimizing box volume
   graphically". Note: the mirror-sourced ID 1TK8V_qmqrk turned out
   to be "Optimization: sum of squares", not the box video, so it
   was not used. The lesson uses a 24x24 sheet (clean numbers: max
   at x = 4, V = 1024); the video uses a 20x30 sheet and the lesson
   text says so.
9. Curve sketching / concavity — 0uCjI5J4ew4, "Graphs: Concavity -
   01. Intro" (APEX Calculus, not Khan). No Khan concavity video
   ID surfaced in search; the APEX intro is on-topic and short.
10. Antiderivatives — MMv-027KEqU, "Antiderivatives and indefinite
    integrals".
11. Riemann sums — dEAk0BHBYCM, "Riemann approximation
    introduction". Note: the alternate WDZMjYJyH6k is a 2.5-hour
    mega-video, not a short lesson video; it was not used.
12. The Fundamental Theorem of Calculus — WapSrovs7yM, "Finding
    derivative with fundamental theorem of calculus".

## Visualization notes

- `viz.plot` returns `{ svg, toPx, toPy }` (commit 3d2bd09), so
  teacher code can draw extra elements in the plot's coordinates.
- `viz.redraw(f)` (commit ee8a6cb) re-runs f after every slider
  move. It is required for custom drawings: a plot's draw clears
  its svg on every redraw, so dots, secant lines, and rectangles
  must be re-added by a redraw callback registered after the plot
  call. Every Calc 1 visualization that draws its own elements
  uses this pattern.
- Lesson 4: secant line through (2, 4) and (2+h, (2+h)^2), h on a
  slider, plus a fixed dashed tangent line. Lesson 11: Riemann
  rectangles under y = x^2, n on a slider, with the running sum
  (n = 4 gives 1.750, n = 20 gives about 2.54, exact area 8/3).
  Lesson 7 draws its own SVG (ladder, wall, ground) with
  `document`, no viz.plot. The other lessons use `viz.plot` +
  `viz.slider` directly.

## Fixes after launch (2026-11-06)

- Lesson completion screen (commit de1f1c0): completing a lesson
  no longer dumps the reader back on the course page. It shows a
  "Lesson complete" panel with a Next lesson button (next lesson
  in the unit, or the first lesson of the next unit once it is
  unlocked) and a Back to the course button. Also fixes a
  duplicate final block when a lesson ends with a reading block.
- LaTeX markdown (commit 3e5c7d2): the lesson page only renders a
  markdown block through KaTeX when its format is "latex", but the
  PUT /lessons/{id}/content/ endpoint hard-coded format="markdown"
  and the editor input schema had no format field, so every block
  saved through the editor rendered as plain text with the raw
  $...$ showing. The endpoint now stores the format the client
  sends, and the editor has a "Render math with LaTeX" checkbox on
  markdown blocks. Calc 1's markdown is stored as latex and its
  questions render math through MarkdownRender as before. The
  check script (check_calc1.js) asserts KaTeX elements on lesson
  1 step 1 and the completion flow; 17/17 passed after the fix.
