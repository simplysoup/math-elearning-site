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

## Lessons and completion

A lesson is a short page: an explanation, a graph you can move, a
question to answer, or a code block. Video is still a placeholder block
and is out of scope for this spec.

Finishing a lesson records a completion for that student in that course.
Completion is per lesson, per student. A student's own progress is shown
to them on their profile and on the course page.

## Exams

Each course has one exam at the end: a set of questions. The exam has a
pass mark, set when the exam is written. The default pass mark is 70
percent.

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

A person can star a course only after they have completed a unit and
passed the course test. A unit here means a lesson. The course card
shows the total number of stars.

## Course card stats

The card for a course in the catalogue shows: stars, page views, course
completions, and lessons completed. These are the only numbers shown to
people who are not students of the course.

## Data to add

- Course: owner, visibility (private or published), level, estimated
  time, prerequisites.
- Enrollment: which students are enrolled in which course, and when.
- Course views: one row per course page load, or a counter. The count
  must not count the owner's own views.
- Exam: the questions for the end-of-course test, the pass mark, and
  the attempts and scores per student.
- Stars: one row per person per course.
- Comments: one row per comment, on a course or a lesson, with the
  author and the time.

## Build order

1. Ownership and publishing: course owner, private by default, publish
   and unpublish, owner-only editing.
2. Enrollment and progress views: enroll, the student view of their own
   progress, and the teacher roster with each student's history.
3. Views and card stats: page view counting, lessons completed, course
   completions, and the four numbers on the course card.
4. Exams: the end-of-course test, the pass mark, unlimited retakes, and
   exam status per student.
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
- "Completed a unit" for star eligibility is read as completing a
  lesson. Correct this if a unit means something else.
- Whether a star can be removed after it is left is not decided.
- Whether the owner's own page views count is decided: they do not.
