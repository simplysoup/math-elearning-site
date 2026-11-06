import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';
import { useNavigate } from 'react-router-dom';
import type { Course } from '../types/course';

const LandingPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const navigate = useNavigate();

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/courses/`);
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data: Course[] = await res.json();
        setCourses(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      courses.flatMap(course => course.tags || [])
    )
  );

  // Filter courses based on search term and active filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilters.length === 0) return matchesSearch;

    const matchesAllFilters = activeFilters.every(filter =>
      course.tags.includes(filter)
    );

    return matchesSearch && matchesAllFilters;
  });

  const toggleFilter = (tag: string) => {
    setActiveFilters(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
  };

  const handleCourseClick = (courseId: number) => {
    navigate(`/courses/${courseId}`);
  };

  if (loading) {
    return <div className="text-center py-12">Loading courses...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-5">
        {/* Left: what this is + course ledger */}
        <div className="lg:col-span-3">
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            Free math courses. Write your own.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed">
            This is a free place to learn math and to write math courses.
            Every course here is free to read, and anyone can write one.
            Log in to keep your progress and to use the editor. There is
            nothing to buy.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl">
            <label htmlFor="course-search" className="sr-only">Search courses</label>
            <input
              id="course-search"
              type="text"
              placeholder="Search courses…"
              className="w-full px-3 py-2.5 border border-rule rounded-sm bg-paper focus:outline-none focus:ring-2 focus:ring-pencil"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tracking-widest uppercase">Filter:</span>
              {allTags.map(tag => (
                <button
                  key={tag}
                  aria-pressed={activeFilters.includes(tag)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-sm border transition-colors ${
                    activeFilters.includes(tag)
                      ? 'bg-ink text-white border-ink'
                      : 'bg-paper text-ink border-rule hover:border-ink'
                  }`}
                  onClick={() => toggleFilter(tag)}
                >
                  {tag}
                </button>
              ))}
              {activeFilters.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-pencil hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Course ledger */}
          <div className="mt-8 border-t-2 border-ink">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course, i) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="w-full text-left grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 py-5 border-b border-rule hover:bg-gray-50 transition-colors"
                >
                  <span className="font-mono text-sm text-pencil">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="block font-display text-xl font-semibold leading-snug">
                      {course.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed max-w-lg">
                      {course.description}
                    </span>
                    <span className="mt-2 block font-mono text-xs">
                      {course.chapter_count ?? course.chapters?.length ?? 0} chapters ·{' '}
                      {course.lesson_count ?? course.chapters?.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0) ?? 0} lessons
                    </span>
                  </span>
                  <span className="font-mono text-sm text-pencil whitespace-nowrap">
                    Open →
                  </span>
                </button>
              ))
            ) : (
              <div className="py-12">
                <p className="text-lg">No courses found matching your criteria.</p>
                <button
                  className="mt-3 text-pencil hover:underline"
                  onClick={clearAllFilters}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: how it works */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20 border border-rule rounded-sm p-5">
            <p className="font-mono text-xs tracking-widest uppercase text-pencil">
              How it works
            </p>
            <ol className="mt-4 space-y-4 list-none">
              <li>
                <p className="font-semibold">1. Read a course.</p>
                <p className="mt-1 text-sm leading-relaxed">
                  Open one below and work through it, one short lesson at a
                  time. A lesson is an explanation, a graph you can move,
                  and a question to answer. No account needed.
                </p>
              </li>
              <li>
                <p className="font-semibold">2. Keep your place.</p>
                <p className="mt-1 text-sm leading-relaxed">
                  Make an account and your progress is saved, so you can
                  pick up where you left off.
                </p>
              </li>
              <li>
                <p className="font-semibold">3. Write a course.</p>
                <p className="mt-1 text-sm leading-relaxed">
                  Use the editor to write lessons, then share the link.
                  Anyone can read it, free.
                </p>
              </li>
            </ol>
            <button
              onClick={() => navigate('/editor')}
              className="mt-5 inline-block bg-pencil hover:bg-pencil-dark text-white text-sm font-medium px-4 py-2 rounded-sm transition-colors"
            >
              Make a course →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
