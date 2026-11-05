import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../api';
import type { Course, Chapter, Lesson } from '../types/course';
import { useState, useEffect } from 'react';

type CourseWithChaptersAndLessons = Course & {
  chapters: (Chapter & { lessons: Lesson[] })[];
};

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseWithChaptersAndLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course info
        const resCourse = await fetch(`${API_BASE_URL}/courses/${courseId}`);
        if (!resCourse.ok) throw new Error("Course not found");
        const courseData = await resCourse.json();

        // Fetch chapters
        const resChapters = await fetch(`${API_BASE_URL}/courses/${courseId}/chapters/`);
        const chaptersData = await resChapters.json();

        // For each chapter, fetch its lessons
        const chaptersWithLessons = await Promise.all(
          chaptersData.map(async (chapter: Chapter) => {
            const resLessons = await fetch(`${API_BASE_URL}/chapters/${chapter.id}/lessons/`);
            const lessons: Lesson[] = await resLessons.json();
            return { ...chapter, lessons };
          })
        );

        setCourse({ ...courseData, chapters: chaptersWithLessons });
        // Open the first chapter by default so the lessons are visible.
        if (chaptersWithLessons.length > 0) {
          setExpandedChapters({ [chaptersWithLessons[0].id]: true });
        }
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchCourseData();
  }, [courseId]);

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleLessonClick = (courseId: string, chapterId: number, lessonId: number) => {
    navigate(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!course) return <div className="p-6">Course not found</div>;

  const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <p className="font-mono text-xs tracking-widest uppercase text-pencil">
        Course · {course.chapters.length} chapters · {totalLessons} lessons
      </p>
      <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">{course.title}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">{course.description}</p>
      {course.tags && course.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {course.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 font-mono text-xs border border-rule rounded-sm">
              {tag}
            </span>
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-2 font-display text-2xl font-bold">Syllabus</h2>
      <div className="border-t-2 border-ink">
        {course.chapters.map((chapter, ci) => (
          <section key={chapter.id} className="border-b border-rule">
            <button
              className="w-full text-left flex items-baseline gap-3 py-4 hover:bg-gray-50 transition-colors"
              onClick={() => toggleChapter(chapter.id)}
              aria-expanded={!!expandedChapters[chapter.id]}
            >
              <span className="font-mono text-sm text-pencil">
                {String(ci + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 font-display text-xl font-semibold leading-snug">
                {chapter.title}
              </span>
              <span className="font-mono text-xs">
                {chapter.lessons.length} lessons {expandedChapters[chapter.id] ? '−' : '+'}
              </span>
            </button>
            {expandedChapters[chapter.id] && (
              <div className="pb-4 pl-10">
                {chapter.description && (
                  <p className="text-sm leading-relaxed mb-3">{chapter.description}</p>
                )}
                <ol>
                  {chapter.lessons.map((lesson, li) => (
                    <li key={lesson.id}>
                      <button
                        className="w-full text-left grid grid-cols-[2rem_1fr_auto] items-baseline gap-2 py-2.5 border-t border-rule hover:bg-gray-50 transition-colors"
                        onClick={() => handleLessonClick(course.id.toString(), chapter.id, lesson.id)}
                      >
                        <span className="font-mono text-xs">{ci + 1}.{li + 1}</span>
                        <span>
                          <span className="block font-medium leading-snug">{lesson.title}</span>
                          {lesson.description && (
                            <span className="block text-sm">{lesson.description}</span>
                          )}
                        </span>
                        <span className="font-mono text-xs text-pencil">Start →</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};

export default CoursePage;
