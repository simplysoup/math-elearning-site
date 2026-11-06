import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../components/auth/AuthContext';
import { useParams, useNavigate } from "react-router-dom";
import { Course, Unit, Lesson, LessonContent } from '../types/course';
import { LessonHeader } from '../components/lesson/LessonHeader';
import { LessonComponent } from '../components/lesson/LessonComponent';
import { ProgressBar } from '../components/lesson/ProgressBar';
import CommentsThread from '../components/course/CommentsThread';

type UserAnswer = {
  [index: number]: string | number | null;
};

type CompletedContent = {
  index: number;
  content: LessonContent;
  userAnswer?: string | number | null;
};

const LessonPage = () => {
  const { courseId, unitId, lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const contentEndRef = useRef<HTMLDivElement>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [lesson, setLesson] = useState<Lesson & { contents: LessonContent[] }>({
    id: 0,
    title: '',
    description: '',
    course_id: 0,
    unit_id: 0,
    contents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  // Full unit list and this unit's lessons, kept so the completion
  // screen can offer the next lesson. The completion screen itself.
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [unitLessons, setUnitLessons] = useState<Lesson[]>([]);
  const [completed, setCompleted] = useState(false);
  const [nextLesson, setNextLesson] = useState<{ unitId: number; lessonId: number; title: string } | null>(null);
  const [isLastLesson, setIsLastLesson] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer>({});
  const [showError, setShowError] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [completedContents, setCompletedContents] = useState<CompletedContent[]>([]);

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        if (!courseId || !unitId || !lessonId) throw new Error("Missing URL parameters");

        // Fetch course
        const resCourse = await apiFetch(`/courses/${courseId}`);
        if (!resCourse.ok) throw new Error("Course not found");
        const courseData: Course = await resCourse.json();
        setCourse(courseData);

        // Fetch units
        const resUnits = await apiFetch(`/courses/${courseId}/units/`);
        if (!resUnits.ok) throw new Error("Units not found");
        const units: Unit[] = await resUnits.json();
        const currentUnit = units.find(u => u.id.toString() === unitId);
        if (!currentUnit) throw new Error("Unit not found");
        setUnit(currentUnit);
        setAllUnits(units);

        // Fetch lessons
        const resLessons = await apiFetch(`/units/${unitId}/lessons/`);
        if (!resLessons.ok) throw new Error("Lessons not found");
        const lessons: Lesson[] = await resLessons.json();
        const currentLesson = lessons.find(lsn => lsn.id.toString() === lessonId);
        if (!currentLesson) throw new Error("Lesson not found");
        setUnitLessons(lessons);

        // Fetch lesson content. A locked unit returns 403 here.
        const resContent = await apiFetch(`/lessons/${lessonId}/content/`);
        if (resContent.status === 403) {
          setLocked(true);
          setLesson({ ...currentLesson, contents: [] });
          return;
        }
        if (!resContent.ok) throw new Error("Lesson content not found");
        const contents: LessonContent[] = await resContent.json();

        setLesson({ ...currentLesson, contents });
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [courseId, unitId, lessonId]);

  useEffect(() => {
    setCurrentIndex(0);
    setUserAnswers({});
    setShowError(false);
    setShowExplanation(false);
    setIsChecking(false);
    setCompletedContents([]);
    setLocked(false);
    setCompleted(false);
    setNextLesson(null);
    setIsLastLesson(false);
  }, [lessonId]);

  useEffect(() => {
    contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [completedContents, currentIndex]);

  const handleCheckAnswer = () => {
    setIsChecking(true);
    const currentContent = lesson.contents[currentIndex];

    if (currentContent.type === 'question') {
      const userAnswer = userAnswers[currentIndex];
      const correctAnswer = currentContent.data.correct_answer;

      if (userAnswer === undefined || userAnswer === null) {
        setShowError(true);
        return;
      }

      setShowError(userAnswer !== correctAnswer);
    }
  };

  const handleTryAgain = () => {
    setShowError(false);
    setIsChecking(false);
  };

  const handleShowExplanation = () => {
    setShowExplanation(true);
  };

  const handleAnswerChange = (index: number, value: string | number) => {
    setUserAnswers({
      ...userAnswers,
      [index]: value
    });
    if (isChecking) {
      setIsChecking(false);
      setShowError(false);
    }
  };

  const handleContinue = () => {
    setCompletedContents(prev => [
      ...prev,
      {
        index: currentIndex,
        content: lesson.contents[currentIndex],
        userAnswer: userAnswers[currentIndex]
      }
    ]);

    setShowError(false);
    setShowExplanation(false);
    setIsChecking(false);

    if (currentIndex < lesson.contents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // The last block is reading, not a question, so there is no
      // "Complete Lesson" button for it; Continuing past it finishes
      // the lesson. (Question blocks call handleCompleteLesson directly.)
      handleCompleteLesson();
    }
  };

  const isFinalQuestion = currentIndex === lesson.contents.length - 1;

  const handleCompleteLesson = async () => {
    // Record the final block once, even if this is reached both from
    // the question's "Complete Lesson" button and from Continuing
    // past a final reading block.
    setCompletedContents(prev =>
      prev.some(c => c.index === currentIndex)
        ? prev
        : [...prev, {
            index: currentIndex,
            content: lesson.contents[currentIndex],
            userAnswer: userAnswers[currentIndex]
          }]
    );

    // Persist completion for logged-in users (auto-enrolls them in
    // the course). Anonymous users can still finish the lesson
    // locally; a failed call here never blocks leaving the lesson.
    if (isAuthenticated && lessonId) {
      try {
        await apiFetch(`/lessons/${lessonId}/complete`, { method: 'POST' });
      } catch { /* ignored */ }
    }

    // Completing this lesson may have unlocked the next unit, so
    // re-read the units before deciding what "next lesson" means.
    let freshUnits = allUnits;
    try {
      const res = await apiFetch(`/courses/${courseId}/units/`);
      if (res.ok) {
        freshUnits = await res.json();
        setAllUnits(freshUnits);
      }
    } catch { /* fall back to the mount-time list */ }

    const idx = unitLessons.findIndex(l => l.id.toString() === lessonId);
    if (idx >= 0 && idx < unitLessons.length - 1) {
      const n = unitLessons[idx + 1];
      setNextLesson({ unitId: Number(unitId), lessonId: n.id, title: n.title });
      setIsLastLesson(false);
    } else {
      const unitIdx = freshUnits.findIndex(u => u.id.toString() === unitId);
      const nextUnit = freshUnits[unitIdx + 1];
      if (nextUnit && !nextUnit.locked) {
        try {
          const res = await apiFetch(`/units/${nextUnit.id}/lessons/`);
          if (res.ok) {
            const ls: Lesson[] = await res.json();
            if (ls.length > 0) {
              setNextLesson({ unitId: nextUnit.id, lessonId: ls[0].id, title: ls[0].title });
              setIsLastLesson(false);
            } else {
              setIsLastLesson(true);
            }
          } else {
            setIsLastLesson(true);
          }
        } catch {
          setIsLastLesson(true);
        }
      } else {
        // No next unit, or the next unit is still locked (for
        // example an anonymous reader finishing unit 1).
        setIsLastLesson(true);
      }
    }

    setCompleted(true);
  };

  const progress = lesson.contents.length > 0
    ? Math.round((currentIndex / lesson.contents.length) * 100)
    : 0;
  const isComplete = currentIndex === lesson.contents.length - 1;

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!course || !unit || !lesson) return <div className="p-6">Lesson not found</div>;

  if (locked) {
    return (
      <div className="px-4 py-8 max-w-2xl mx-auto">
        <LessonHeader course={course} unit={unit} lesson={lesson} />
        <p className="leading-relaxed">
          This lesson is locked. Finish the previous unit first. Its
          lessons and its exam, if it has one, must be complete before
          this unit opens.
        </p>
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="mt-4 px-4 py-2 bg-pencil hover:bg-pencil-dark text-white text-sm font-medium rounded-sm"
        >
          Back to the course
        </button>
      </div>
    );
  }

  const isOwner = user?.id !== undefined && course.owner_id !== undefined && user.id === course.owner_id;

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto">
      <ProgressBar progress={progress} isComplete={isComplete} />
      <p className="font-mono text-xs tracking-widest uppercase text-pencil">
        Step {Math.min(currentIndex + 1, lesson.contents.length)} of {lesson.contents.length}
      </p>
      <LessonHeader course={course} unit={unit} lesson={lesson} />

      <div className="space-y-8">
        {completedContents.map((completed, idx) => (
          <LessonComponent
            key={idx}
            content={completed.content}
            index={completed.index}
            isCurrent={false}
            userAnswer={completed.userAnswer}
            showError={false}
            showExplanation={false}
            isChecking={false}
            onAnswerChange={() => {}}
            onCheckAnswer={() => {}}
            onContinue={() => {}}
            onTryAgain={() => {}}
            onShowExplanation={() => {}}
            onCompleteLesson={() => {}}
          />
        ))}

        {!completed && currentIndex < lesson.contents.length && (
          <LessonComponent
            content={lesson.contents[currentIndex]}
            index={currentIndex}
            isCurrent={true}
            userAnswer={userAnswers[currentIndex]}
            showError={showError}
            showExplanation={showExplanation}
            isChecking={isChecking}
            onAnswerChange={handleAnswerChange}
            onCheckAnswer={handleCheckAnswer}
            onContinue={handleContinue}
            onTryAgain={handleTryAgain}
            onShowExplanation={handleShowExplanation}
            onCompleteLesson={handleCompleteLesson}
            isFinalQuestion={isFinalQuestion}
          />
        )}

        {completed && (
          <div className="border border-rule rounded-sm p-6 text-center">
            <p className="text-lg font-medium">Lesson complete.</p>
            <p className="mt-1 text-sm text-stone-600">
              {nextLesson
                ? `Next up: ${nextLesson.title}`
                : isLastLesson
                  ? 'That was the last lesson in this course.'
                  : 'Head back to the course to pick your next lesson.'}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {nextLesson && (
                <button
                  onClick={() => navigate(`/courses/${courseId}/units/${nextLesson.unitId}/lessons/${nextLesson.lessonId}`)}
                  className="px-4 py-2 bg-pencil hover:bg-pencil-dark text-white text-sm font-medium rounded-sm"
                >
                  Next lesson →
                </button>
              )}
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="px-4 py-2 border border-rule rounded-sm text-sm hover:border-ink"
              >
                Back to the course
              </button>
            </div>
          </div>
        )}

        <div ref={contentEndRef} />
      </div>

      <CommentsThread kind="lesson" targetId={lesson.id} isCourseOwner={isOwner} />
    </div>
  );
};

export default LessonPage;
