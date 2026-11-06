import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About</h1>

        <h2 className="text-2xl font-semibold mt-8 mb-3">What this is</h2>
        <p className="leading-relaxed mb-4">
          This is a free place to learn math and to write math courses.
          Every course here is free to read. There is no paywall and no
          advertising.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">How a course works</h2>
        <p className="leading-relaxed mb-4">
          A course is a set of lessons. Each lesson is a short page: an
          explanation, a graph you can move around, and a question to
          answer. You work through them in order, at your own pace.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Reading</h2>
        <p className="leading-relaxed mb-4">
          Reading needs no account. Open a course and start.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Writing</h2>
        <p className="leading-relaxed mb-4">
          To write a course, make an account and open the editor. Pick a
          lesson to edit, or make a new course, chapter, or lesson.
          Saving puts it live straight away, and anyone with the link can
          read it.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Your progress</h2>
        <p className="leading-relaxed mb-6">
          If you are logged in, the lessons you finish are saved to your
          profile, so you can see where you left off.
        </p>

        <div className="mt-8">
          <Link to="/" className="text-pencil hover:underline">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
