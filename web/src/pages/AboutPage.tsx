import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-4xl font-bold text-center mb-6">About</h1>
        <p className="text-gray-700 leading-relaxed mb-4">
          Place AI Slop Here
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Learn Math or Smth
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Real People</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-center">
            <img
              src="/assets/team/jane_doe.jpg"
              alt="Jane Doe"
              className="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <h3 className="font-medium">Jane Doe</h3>
              <p className="text-sm text-gray-600">The One Above All</p>
            </div>
          </div>
          <div className="flex items-center">
            <img
              src="/assets/team/john_smith.jpg"
              alt="John Smith"
              className="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <h3 className="font-medium">John Smith</h3>
              <p className="text-sm text-gray-600">"Full-Stack Developer"</p>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Get in Touch</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          I don't have an email
          <a href="mailto:info@mathelearn.com" className="p-1 text-blue-500 hover:underline">
            info@mathelearn.com
          </a>.
        </p>
        <div className="text-center">
          <Link to="/" className="text-blue-500 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
