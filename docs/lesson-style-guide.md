# Lesson style guide

Model: Paul Dawkins, *Paul's Online Math Notes*, Calculus I
(https://tutorial.math.lamar.edu/Classes/CalcI/CalcI.aspx).
The pages this guide is drawn from, read in full:

- The Limit — https://tutorial.math.lamar.edu/Classes/CalcI/TheLimit.aspx
- The Definition of the Derivative —
  https://tutorial.math.lamar.edu/Classes/CalcI/DefnOfDerivative.aspx
- Related Rates — https://tutorial.math.lamar.edu/Classes/CalcI/RelatedRates.aspx
- Optimization — https://tutorial.math.lamar.edu/Classes/CalcI/Optimization.aspx
- Definition of the Definite Integral —
  https://tutorial.math.lamar.edu/Classes/CalcI/DefnOfDefiniteIntegral.aspx

The rule of thumb: a lesson should read like a good teacher
talking a student through one idea, not like a textbook stating
it. If a reader who already knows the material (say, someone who
has taken Real Analysis) has to re-read a sentence to work out
what it is saying, the sentence is wrong, however correct it is.

## 1. Start from a problem, not a definition

Paul never opens with the definition. He opens with a problem
the reader already has, and the concept arrives as the answer
to it.

- The Limit opens by recalling the tangent-line and
  rate-of-change problems from the previous section: "we wanted
  to know how that function was behaving at some point." Only
  then: "This process is called taking a limit."
- The Definition of the Derivative opens the same way: "we saw
  that the computation of the slope of a tangent line, the
  instantaneous rate of change of a function, and the
  instantaneous velocity of an object ... all required us to
  compute the following limit. ... This is such an important
  limit and it arises in so many places that we give it a name.
  We call it a derivative."
- The Definite Integral is motivated by the Area Problem in the
  previous section; the definition is "exactly the limit and
  summation that we looked at in the last section."

**Rule:** the first sentence of a lesson names a concrete
situation or a question, not a term. No lesson opens with
"X is ..." or "X is defined as ...". The definition comes
after the reader already wants it.

## 2. A working definition first, the precise one later

Paul gives what he calls a "working" definition, says plainly
that it is not the precise one, and then unpacks it in words
before formalizing anything:

> "This is not the exact, precise definition of a limit. ... The
> definition given above is more of a 'working' definition."

Then: "So just what does this definition mean? Well let's
suppose that we know that the limit does in fact exist."
He spends a paragraph on one concrete number (0.001) before
he ever writes the formal statement, and then restates it
again in simpler terms: "In somewhat simpler terms the
definition says that as $x$ gets closer and closer to $x = a$
... then $f(x)$ must be getting closer and closer to $L$."

**Rule:** state the idea in plain words first, with a concrete
number or a concrete function. Give the formal statement
second. Then restate the idea once more in your own words.
Three passes over the same idea is normal, not redundant.

## 3. The voice: conversational, second person, "let's"

Paul writes as if he is standing at a board with the reader.
The markers are everywhere:

- "Let's work an example." "Let's think a little bit more
  about what's going on here." "Let's make the point one more
  time just to make sure we've got it."
- "So, with that in mind we are going to work this in pretty
  much the same way that we did in the last section."
- "Notice that we made sure and picked values of $x$ that were
  on both sides of $x = 2$..."
- "First don't get excited about the $\theta$ in function. It's
  just a letter, just like $x$ is a letter!"
- "Be careful and make sure that you properly deal with
  parenthesis when doing the subtracting."

**Rules:**

- Second person, present tense, short sentences. "You", "we",
  "let's", "notice", "watch".
- Never "obviously", "clearly", "simply", "trivially". If it
  were obvious, it would not need saying.
- Anticipate the confusion and answer it before it forms:
  "You do remember rationalization from an Algebra class
  right?" "Note that we needed to convert the diameter to a
  radius." "Note as well that the rate is negative since the
  distance from the wall, $x$, is decreasing."
- Be honest about difficulty: "Wow, that was a lot of work for
  a fairly simple function." "This one is going to be a little
  messier as far as the algebra goes." "Computing most
  derivatives directly from the definition is a fairly complex
  (and sometimes painful) process filled with opportunities to
  make mistakes."

## 4. Every step of a worked example gets a sentence

Paul never writes a chain of algebra without saying what he is
doing and why, before and after each step:

- "First plug the function into the definition of the
  derivative."
- "Now, we know from the previous chapter that we can't just
  plug in $h = 0$ since this will give us a division by zero
  error. So, we are going to have to do some work."
- "Notice that every term in the numerator that didn't have an
  $h$ in it canceled out and we can now factor an $h$ out of
  the numerator which will cancel against the $h$ in the
  denominator. After that we can compute the limit."
- "We didn't multiply out the denominator. Multiplying out the
  denominator will just overly complicate things so let's keep
  it simple."

**Rule:** one step, one sentence, in this order: what you are
about to do, the algebra, what just happened and why it helps.
A bare chain of equations with no sentences between them is a
draft, not a lesson. If a step is "just algebra", say so, and
say which algebra ("factor and cancel", "combine into a single
rational expression", "rationalize the numerator").

## 5. Name the hard part and the common mistake

Paul names the trap explicitly, often more than once, and
sometimes spends a whole aside on it:

- Related Rates, after the ladder example: a long aside on the
  common mistake of labeling the fixed hypotenuse with a
  letter, and why it makes the problem impossible to finish.
  "When labeling a fixed quantity ... with a letter it is
  sometimes easy to forget that it is a fixed quantity and so
  its derivative must be zero."
- Optimization opens by warning that the section "is generally
  one of the more difficult for students" and that "a subtle
  change of wording can completely change the problem", then
  gives the process: "The first step in all of these problems
  should be to very carefully read the problem. Once you've done
  that the next step is to identify the quantity to be optimized
  and the constraint."
- The Limit: "The limit is NOT 6! ... Limits are only
  concerned with what is going on around the point." He then
  repeats the point three more times in the section, and says
  so: "We keep saying this, but it is a very important concept
  about limits that we must always keep in mind. So, we will
  take every opportunity to remind ourselves of this idea."

**Rule:** every lesson names one thing to watch out for, in a
sentence of its own. Repeat the lesson's one central idea at
least twice, in different words. The reader should be able to
say, after the lesson, what the trap was.

## 6. Equations: display the key one, define every symbol

- The key equation of a section gets its own display line,
  never buried mid-sentence. Inline math is only for short
  references ("as $x$ gets closer to $a$", "$f'(x) = 4x - 16$"
  as a result).
- Define every symbol the first time it appears, in words:
  "The number '$a$' that is at the bottom of the integral sign
  is called the lower limit." "We often 'read' $f'(x)$ as
  'f prime of x'." "Rates of change are nothing more than
  derivatives."
- Connect back to earlier material by name: "We saw a situation
  like this back when we were looking at limits at infinity."
  "Recall that rates of change are nothing more than
  derivatives." "As in the previous section when we looked at
  implicit differentiation..."
- End a section by saying what was learned and what comes
  next: "So, what have we learned about limits?" "This does not
  mean however that it isn't important to know the definition
  of the derivative! ... It is just something that we're not
  going to be working with all that much."

## 7. Adapting Paul to this site

Paul's sections are long, with many worked examples. Our
lessons are short, and they lead with the interactive, not the
text: one visualization first (with a one-line prediction
prompt), one short markdown block, one check question, one
optional video. The adaptation:

- The visualization is the lesson. It opens with a one-line
  prompt ("Guess, then drag") and plays once on load, so the
  reader sees the phenomenon before reading a word. The
  markdown comes after, and only says what happened: 60–100
  words, the idea in plain words, the trap named.
- The visualization does the work Paul's tables and graphs
  do: it is the place the reader sees the idea happen. The
  prompt must tell the reader what to do with it ("Move the
  slider and watch ...") and what to look for ("the values
  stay close to 2 no matter how near to 1 you get").
- The video is the worked example, and it is optional: it
  comes last, labelled as such, so the core loop (play, read,
  answer) takes two minutes. The markdown should not try to
  be the worked example as well; it should say what the
  reader just saw.
- The check question tests the idea the lesson taught, not a
  trick. Its explanation re-teaches in one sentence, naming
  the step ("Factor: ... so the limit is ..."), not just
  restating the answer.

**Lesson template (viz first):**

1. The prompt, one line, above the visualization. A guess,
   not a statement. ("As x gets close to 1, does f(x) settle
   on a value? Guess, then drag.")
2. The visualization, playing once on load. The reader sees
   the phenomenon before reading a word.
3. The short text: what happened, the idea in plain words,
   the trap. 60–100 words. The definition or formula goes
   here, on its own line, only now.
4. The check question: the idea the lesson taught, not a
   trick. Its explanation re-teaches in one sentence, naming
   the step.
5. The video, last and optional: the worked example, for
   readers who want it.

## 8. The visualization: an experiment, not a picture

The visualization is where the reader tests the idea, not
where they look at it. The principles below are distilled
from Craig Barton's interactive tools (see the
interactive-math-viz skill for the full version, with the
Barton examples). A visualization that breaks them is a
picture, and a picture does not teach.

**One variable, one idea.** One viz answers one question,
with one control. One slider, everything else frozen. The
slider changes exactly the quantity in the lesson's question.
If a second slider is needed, it is a second viz. The
slider's range is chosen so the phenomenon is visible, not
so the numbers are round: the limit viz runs $x$ from 0 to 2
because the limit is at 1.

**Predict first, then reveal.** The markdown asks the reader
to commit before the slider is moved ("Before you touch the
slider, guess ..."), and the viz is the check. The intro does
not state the specific numerical answer the check question
asks for: the viz shows the evidence, the question asks, and
the question's explanation reveals it. If the intro gives the
answer away, there is nothing to predict and the viz is a
demonstration, not an experiment.

**Surface the current values, prominently.** The numbers the
lesson is about are the largest thing on screen. Use
`viz.readout` for one (input, output) pair, e.g.
`x = 0.90 → f(x) = 1.90`, with `viz.text` underneath for
the sentence that explains what they mean. When there is
more than one pair to show, use `viz.values` — a small
table, one row per pair — instead of cramming both pairs
into one readout line, which wraps mid-value on a narrow
screen. Never bury the values in a sentence, and never make
the reader read them off the graph.

**Draw the target on the picture.** Show the value the data
is approaching as a dashed reference line, so the reader
sees the gap close: the dashed line at $y = 2$ for the
limit, the dashed line at the exact area for the Riemann
sums. Mark the special points: the hole (open circle) where
the function does not exist, the maximum, the turning
points, the point being evaluated (filled dot). A point
without a marker is a number the reader has to guess.
Label every marker in the markdown or in the note
underneath the viz.

**Compare, don't remember.** If the lesson is about two
things — the left and the right of a limit, the secant and
the tangent — put both on screen at the same time. The
limit viz draws a mirror dot the same distance from 1 on
the other side, so both values are visible at once with one
slider. Never ask the reader to run the viz, remember the
result, change a setting, run it again, and compare from
memory.

**Let the edge cases happen.** Dragging the limit slider to
exactly $x = 1$ makes the dots disappear and the values
table say "undefined", instead of silently doing something
else. The viz states its own limits. A slider value that
produces NaN with no message is a bug, not an edge case.

**The default shows the mechanism.** The first thing the
reader sees should explain how the viz works. The limit viz
defaults to $x = 0.9$, close to the limit, not $x = 0.5$.
Dragging the slider from there is the bulk run that shows
the pattern.

**How the API works.** Teacher code runs in a sandboxed
iframe with a small `viz` object: `viz.slider(label, min,
max, start, step)`; `viz.plot(f, { xMin, xMax, yMin, yMax,
title })`, which draws the curve with axes, gridlines and
tick labels and returns `{ svg, toPx, toPy }` so extra
elements (lines, dots, rectangles) can be drawn in the same
coordinates; `viz.readout(s)` for one pair of current
values; `viz.values(rows, headers)` for a table of them;
`viz.text(s)` for the explanatory line underneath;
`viz.redraw(f)` to re-add your own elements after a plot
redraw, because a plot clears its svg on every slider move.
Register redraw callbacks after the plot calls, and call
the draw function once at the end for the initial render.

## 9. Before and after

### Lesson 1 — What is a limit?

Before (definition first, no motivation, the formula does all
the work):

> "A limit describes the value a function approaches as $x$
> gets close to a point, even if the function never actually
> reaches that value. Take $f(x) = \frac{x^2 - 1}{x - 1}$. At
> $x = 1$ the expression is $\frac{0}{0}$, so $f(1)$ is
> undefined. But for every $x$ near 1, the function behaves
> like $x + 1$. Move the slider and watch $f(x)$ get closer
> and closer to 2."

After (problem first, the idea in plain words, the reader
predicts and then checks, the trap named, both sides of the
limit on screen at once):

> "Here is a function that breaks if you try to use it at one
> point. Take $f(x) = \frac{x^2 - 1}{x - 1}$ and plug in
> $x = 1$. You get $\frac{0}{0}$, so $f(1)$ doesn't exist.
> Does that mean we know nothing about what the function is
> doing near $x = 1$? No, and that is what a limit is for.
> A limit asks what a function is doing *around* a point, not
> what it does *at* the point.
>
> Before you touch the slider, guess. As $x$ gets close to 1,
> does $f(x)$ settle on a value, or does it blow up? If it
> settles, what value? Move the slider to 0.9 and check your
> guess, then drag it across 1 and watch what happens on the
> other side.
>
> The two red dots are the same distance from 1 on either
> side, so you can see both sides at once. The open circle
> marks the point where the function doesn't exist, and the
> dashed line is the value the dots are closing in on. Drag
> the slider to 1 and the dots disappear — $f(1)$ doesn't
> exist — but they still close in on the same value from both
> sides.
>
> Notice we never used $x = 1$ itself. We don't need to, and
> the limit doesn't care about it. That is the one idea to
> hold on to: a limit is about what happens *around* the
> point."

The visualization for this lesson draws the dashed limit
line, the open circle at the hole, and a mirror dot the same
distance from 1 on the other side, with the current values
as a table (from the left / from the right, with $x$ and
$f(x)$ columns). The intro does not state the limit is 2;
the reader reads it off the viz and the check question
confirms it.

### Lesson 7 — Related rates

Before (the abstract idea, then the equation chain, no
"what do we know / what do we want"):

> "In a related rates problem, two quantities change together
> and the chain rule links their rates. A 5 m ladder leans
> against a wall. Its foot slides away from the wall at 1 m/s.
> Since $x^2 + y^2 = 25$, differentiating gives
> $2x\frac{dx}{dt} + 2y\frac{dy}{dt} = 0$, so
> $\frac{dy}{dt} = -\frac{x}{y}\frac{dx}{dt}$. Move the $x$
> slider: as the foot goes out, the top comes down faster and
> faster."

After (Paul's process: what do we know, what do we want, what
relates them, differentiate, solve, check the sign):

> "A ladder is sliding down a wall. The foot is moving away
> from the wall at 1 m/s. That is a rate, and a rate is a
> derivative. We want the rate at which the top is coming
> down. That is another derivative.
>
> First, what do we know and what do we want? We know
> $\frac{dx}{dt} = 1$ and we want $\frac{dy}{dt}$.
>
> Next, we need a relationship between $x$ and $y$. The
> ladder, the wall, and the floor make a right triangle, so
> $x^2 + y^2 = 25$. Now differentiate both sides with respect
> to $t$. Remember that $x$ and $y$ are both functions of time,
> so this is implicit differentiation:
>
> $$2x\frac{dx}{dt} + 2y\frac{dy}{dt} = 0$$
>
> Solve for the rate you want:
> $\frac{dy}{dt} = -\frac{x}{y}\frac{dx}{dt}$.
>
> The minus sign is the whole point: as $x$ grows, $y$
> shrinks. Watch the sign. If you get a positive number for
> the top's rate, you have made a mistake somewhere.
> Move the $x$ slider and watch the top come down faster and
> faster as the foot goes out."

## 10. Checklist for a new lesson

- [ ] The first sentence is a situation or a question, not a
      definition.
- [ ] The idea is stated in plain words before any formula.
- [ ] The key equation is on its own line; every symbol in it
      is defined in words.
- [ ] The reader is told what to do with the visualization and
      what to look for.
- [ ] The markdown asks for a prediction before the slider is
      moved, and does not state the specific numerical answer
      the check question asks for.
- [ ] The visualization has one slider, changing exactly the
      quantity in the lesson's question, with a default that
      shows the mechanism.
- [ ] The current values are shown prominently: `viz.readout`
      for one pair, `viz.values` as a table for more than one.
- [ ] A dashed line or marker shows the target value, and
      every point, line and marker on the picture is named.
- [ ] If the lesson compares two things, both are on screen at
      once, not compared from memory.
- [ ] The slider ends do something honest and stated (the
      hole shows "undefined", it does not break or lie).
- [ ] Every algebra step in the text has a sentence saying what
      it is and why.
- [ ] One trap is named, in its own sentence.
- [ ] The central idea is repeated at least twice, in different
      words.
- [ ] No "obviously", "clearly", "simply", "trivially".
- [ ] The check question tests the idea, and its explanation
      names the step that gets the answer.
- [ ] A reader who already knows the material can read it once
      and follow it. If they have to re-read a sentence, rewrite
      the sentence.
