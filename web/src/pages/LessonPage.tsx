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

        // Fetch lessons
        const resLessons = await apiFetch(`/units/${unitId}/lessons/`);
        if (!resLessons.ok) throw new Error("Lessons not found");
        const lessons: Lesson[] = await resLessons.json();
        const currentLesson = lessons.find(lsn => lsn.id.toString() === lessonId);
        if (!currentLesson) throw new Error("Lesson not found");

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
    }
  };

  const isFinalQuestion = currentIndex === lesson.contents.length - 1;

  const handleCompleteLesson = () => {
    if (isFinalQuestion && !completedContents.some(c => c.index === currentIndex)) {
      setCompletedContents(prev => [
        ...prev,
        {
          index: currentIndex,
          content: lesson.contents[currentIndex],
          userAnswer: userAnswers[currentIndex]
        }
      ]);
    }

    // Persist completion for logged-in users (auto-enrolls them in the
    // course). Anonymous users can still finish the lesson locally;
    // a failed call here never blocks leaving the lesson.
    if (isAuthenticated && lessonId) {
      apiFetch(`/lessons/${lessonId}/complete`, { method: 'POST' }).catch(() => {});
    }

    navigate(`/courses/${courseId}`);
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

        {currentIndex < lesson.contents.length && (
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

        <div ref={contentEndRef} />
      </div>

      <CommentsThread kind="lesson" targetId={lesson.id} isCourseOwner={isOwner} />
    </div>
  );
};

export default LessonPage;
