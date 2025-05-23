import React, { useState, useEffect } from 'react';
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
        const res = await fetch('http://localhost:8000/courses/');
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
    <div className="font-sans text-gray-800">
      <section id="courses" className="py-16 px-4 sm:px-8">
        <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-6">
          Explore Our Courses
        </h2>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium mb-3">Filter by tags:</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    activeFilters.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleFilter(tag)}
                >
                  {tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-600 mr-2">
                  Active filters: {activeFilters.length}
                </span>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Course Grid */}
        <div className="max-w-6xl mx-auto">
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map(course => (
                <div
                  key={course.id}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleCourseClick(course.id)}
                >
                  {course.image && (
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-t-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl sm:text-2xl font-semibold mb-4">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {course.description}
                  </p>

                  <div className="flex gap-4 text-sm text-gray-500 mb-4">
                    <span>{course.chapters?.length || 0} Chapters</span>
                    <span>•</span>
                    <span>
                      {course.chapters?.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0) || 0} Lessons
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.tags?.map(tag => (
                      <span
                        key={tag}
                        className={`px-2 py-1 text-xs rounded-full ${
                          activeFilters.includes(tag)
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">No courses found matching your criteria.</p>
              <button
                className="mt-4 text-blue-500 hover:underline"
                onClick={clearAllFilters}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
