# Marketplace spec

A free place to learn math and to write math courses. Every course is free
to read. Anyone with an account can write one and share it. There is no
paywall and no payment anywhere in the product.

## Roles

There are two roles, and they are not separate accounts. Anyone with an
account can be a teacher. Anyone can be a student. A person can be both:
a teacher of their own courses and a student of other people's courses.

Reading a course needs no account. Tracking progress, writing a course,
commenting, and leaving a star all need an account.

## Courses

A course has an owner: the account that created it. Only the owner can
edit it. Today any logged-in user can edit any lesson; that changes with
this spec.

A course starts private. Only the owner can see it. The owner chooses to
publish it, and publishing puts it in the public catalogue. The owner can
unpublish it again at any time. Unpublishing hides it from the catalogue
but keeps the course and its student records.

A course has a title, a description, and a level, an estimated time, and
prerequisites. The level, time, and prerequisites are new fields. They
exist so someone can choose a course from its card.

## The forum

The forum has two parts.

1. The public catalogue: every published course, searchable, with the
   aggregate stats from the card section below. Only published courses
   appear here.
2. Discussion and comments: each course and each lesson has a comment
   thread. Any logged-in user can comment. The course owner can delete
   comments on their own course.

## Structure: courses, units, lessons

A course is made of units. A unit is a block of lessons. Units and
lessons are distinct: a lesson is one short page, a unit is the block
that groups lessons together.

Units are gated. The first unit is open. The next unit unlocks only
once the current unit is complete. Lessons inside a unit can be done
in any order.

A unit is complete when every lesson in it is complete and, if the
unit has an exam, the student has passed it. A course is complete when
every unit is complete and, if the course has a final exam, the student
has passed it.

The existing chapter is the unit. The chapter table becomes the unit
table, renamed. There is no separate chapter level on top of units.

## Lessons and completion

A lesson is a short page: an explanation, a graph you can move, a
question to answer, a code block, or an embedded video. Video blocks
take a YouTube or Vimeo link and play in the lesson; other URLs are
rejected. The embed URL is built from the parsed video ID, never from
the raw link, so an arbitrary URL can never become an iframe source.

Finishing a lesson records a completion for that student in that course.
Completion is per lesson, per student. A student's own progress is shown
to them on their profile and on the course page.

## Visualizations

A visualization block is teacher-written JavaScript. The teacher writes
it in the editor (starting from a working example) or uploads a .js file;
the code is stored in the block's config and rendered on the lesson page
inside an iframe with sandbox="allow-scripts" only, so the frame has an
opaque origin and cannot reach the parent page, the user's session, or
the site's API. The code runs in the student's browser against a small
viz API: viz.slider(label, min, max, start, step), viz.plot(f, { xMin,
xMax, yMin, yMax }), viz.text(s), viz.clear(). Plots redraw when a
slider moves. viz.plot returns { svg, toPx, toPy }, so teacher code
can draw extra elements (tangent lines, rectangles, points) in the
same coordinates as the plot; viz.redraw(f) re-runs f after every
slider move, which is where those extra elements are re-added,
because a plot clears its svg on each redraw. Code must be non-empty
and at most 50,000 characters.
The original built-in combine-like-terms graph is still supported and
is kept as-is by the editor; it is not editable there.

## Exams

Exams are optional. A unit may have an exam at its end, and a course
may have a final exam. A unit with no exam needs only its lessons
completed.

Each exam is a set of questions with a pass mark, set when the exam is
written. The default pass mark is 70 percent. A unit exam unlocks once
every lesson in that unit is complete. The final exam unlocks once the
final unit is complete.

Retakes are unlimited. There is no limit on attempts, no waiting period,
and no penalty for failing. The goal is to maximise learning, not to
police students.

Exam status per student is one of: not started, in progress, passed, or
failed. The latest attempt decides the status. A pass is recorded with
the score.

## Tracking and who sees what

Four things are tracked per course:

- Page views: how many times the course page was loaded.
- Lessons completed: how many lesson completions happened in total.
- Course completions: how many students finished every lesson in the
  course.
- Stars: how many eligible people starred the course.

Who sees what:

- A student sees their own data only, in every course: their lesson
  completions, their exam attempts and status, and their own stars.
- A teacher sees every student's history in their own course: each
  student's lesson completions, exam attempts and status, and when they
  last studied. A teacher sees nothing about students in courses they
  do not own.
- Anyone, logged in or not, sees only the aggregate stats on the course
  card: stars, page views, course completions, and lessons completed.
  No individual student's data is ever public.

## Stars

A star is a single star, one per person. There is no 1 to 5 rating.

A person can star a course only after they have completed a unit and,
if that unit has an exam, passed it. The course card shows the total
number of stars.

## Course card stats

The card for a course in the catalogue shows: stars, page views, course
completions, and lessons completed. These are the only numbers shown to
people who are not students of the course.

## Data to add

- Course: owner, visibility (private or published), level, estimated
  time, prerequisites.
- Unit: the block of lessons in a course, in order. The existing
  chapter table becomes the unit table. Lessons belong to a unit, and
  a unit unlocks only after the previous unit is complete.
- Enrollment: which students are enrolled in which course, and when.
- Course views: one row per course page load, or a counter. The count
  must not count the owner's own views.
- Exam: the questions for a unit exam or a final exam, the pass mark,
  and the attempts and scores per student. An exam belongs to a unit
  or to the course as its final exam.
- Stars: one row per person per course.
- Comments: one row per comment, on a course or a lesson, with the
  author and the time.

## Build order

1. Ownership, publishing, and units: course owner, private by default,
   publish and unpublish, owner-only editing, and the chapter to unit
   change with gating.
2. Enrollment and progress views: enroll, the student view of their own
   progress, and the teacher roster with each student's history.
3. Views and card stats: page view counting, lessons completed, course
   completions, and the four numbers on the course card.
4. Exams: unit exams and the final exam, the pass mark, unlimited
   retakes, and exam status per student.
5. Stars: eligibility (completed a unit and passed the test), one star
   per person, and the star count on the card.
6. Forum comments: comment threads on courses and lessons, and deletion
   by the course owner.
7. Catalogue polish: search and sort by stars, views, and completions.

## Open decisions

- Moderation: anyone can publish instantly, since anyone can be a
  teacher. There is no review step in this spec. Reporting and removal
  of bad courses is not decided yet.
- The pass mark default is 70 percent. Change it per exam if that
  number is wrong.
- Gating, decided 2026-11-06: lesson content is served only if the unit
  is unlocked. The owner always sees everything. A logged-in student
  sees a unit when the previous unit is complete (all its lessons done
  and its exam passed if it has one). An anonymous visitor sees only
  the first unit. Completing a lesson and attempting an exam are
  blocked when the unit is locked. The reasoning is that reading needs
  no account for the first unit, while progress requires an account.
- Whether a star can be removed after it is left is not decided.
- Whether the owner's own page views count is decided: they do not.
