import { useParams, useNavigate } from "react-router-dom";
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
        const resCourse = await fetch(`http://localhost:8000/courses/${courseId}`);
        if (!resCourse.ok) throw new Error("Course not found");
        const courseData = await resCourse.json();

        // Fetch chapters
        const resChapters = await fetch(`http://localhost:8000/courses/${courseId}/chapters/`);
        const chaptersData = await resChapters.json();

        // For each chapter, fetch its lessons
        const chaptersWithLessons = await Promise.all(
          chaptersData.map(async (chapter: Chapter) => {
            const resLessons = await fetch(`http://localhost:8000/chapters/${chapter.id}/lessons/`);
            const lessons: Lesson[] = await resLessons.json();
            return { ...chapter, lessons };
          })
        );

        setCourse({ ...courseData, chapters: chaptersWithLessons });
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

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-1/3">
          <img 
            src={course.image} 
            alt={course.title} 
            className="rounded-lg shadow-md w-full h-auto"
          />
        </div>
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-gray-600 mb-4">{course.description}</p>
          <div className="flex gap-2 mb-4">
            {course.tags?.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Syllabus</h2>
        <div className="space-y-4">
          {course.chapters.map((chapter) => (
            <div key={chapter.id} className="border rounded-lg p-4">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleChapter(chapter.id)}
              >
                <h3 className="text-xl font-medium mb-2">{chapter.title}</h3>
                <svg 
                  className={`w-5 h-5 transition-transform ${expandedChapters[chapter.id] ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {expandedChapters[chapter.id] && (
                <>
                  {chapter.description && (
                    <p className="text-gray-600 mb-3">{chapter.description}</p>
                  )}
                  <div className="space-y-3">
                    {chapter.lessons.map((lesson) => (
                      <div 
                        key={lesson.id} 
                        className="pl-4 border-l-2 border-blue-200 cursor-pointer hover:bg-blue-50 p-2 rounded"
                        onClick={() => handleLessonClick(course.id.toString(), chapter.id, lesson.id)}
                      >
                        <h4 className="text-lg font-medium">{lesson.title}</h4>
                        {lesson.description && (
                          <p className="text-gray-500">{lesson.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
