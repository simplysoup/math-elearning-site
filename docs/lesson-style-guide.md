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
lessons are short: one markdown block, one interactive
visualization, one video, one check question. The adaptation:

- The markdown block is the motivation, the idea in plain
  words, and the setup for the visualization. It is not a
  full lecture. Roughly 120–200 words.
- The visualization does the work Paul's tables and graphs
  do: it is the place the reader sees the idea happen. The
  markdown must tell the reader what to do with it ("Move the
  slider and watch ...") and what to look for ("the values
  stay close to 2 no matter how near to 1 you get").
- The video is the worked example. The markdown should not
  try to be the worked example as well; it should set up the
  one question the video answers.
- The check question tests the idea the lesson taught, not a
  trick. Its explanation re-teaches in one sentence, naming
  the step ("Factor: ... so the limit is ..."), not just
  restating the answer.

**Lesson template:**

1. The question. One concrete situation, one sentence.
   ("Here is a function that breaks if you try to use it at
   one point.")
2. The idea, in plain words, with a concrete number or
   function. No new term yet.
3. The setup for the visualization: what to move, what to
   watch for.
4. The definition or formula, only now, on its own line.
5. The trap: one sentence naming what goes wrong if you
   forget the idea.
6. (In the question's explanation:) the step that gets the
   answer, in one sentence.

## 8. Before and after

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

After (problem first, the idea in plain words, the reader does
something, the trap named):

> "Here is a function that breaks if you try to use it at one
> point. Take $f(x) = \frac{x^2 - 1}{x - 1}$ and plug in
> $x = 1$. You get $\frac{0}{0}$, so $f(1)$ doesn't exist.
> Does that mean we know nothing about what the function is
> doing near $x = 1$? No, and that is what a limit is for.
> A limit asks what a function is doing *around* a point, not
> what it does *at* the point.
>
> Try $x = 0.9$ and $x = 1.1$: both give values close to 2.
> Move the slider and watch $f(x)$ close in on 2 from both
> sides. The values stay close to 2 no matter how near to 1
> you get. That is what it means for the limit to be 2.
>
> Notice we never used $x = 1$ itself. We don't need to, and
> the limit doesn't care about it. That is the one idea to
> hold on to: a limit is about what happens *around* the
> point."

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

## 9. Checklist for a new lesson

- [ ] The first sentence is a situation or a question, not a
      definition.
- [ ] The idea is stated in plain words before any formula.
- [ ] The key equation is on its own line; every symbol in it
      is defined in words.
- [ ] The reader is told what to do with the visualization and
      what to look for.
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
