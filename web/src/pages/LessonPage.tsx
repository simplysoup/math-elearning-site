import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Course, Chapter, Lesson, LessonContent } from '../types/course';
import { LessonHeader } from '../components/lesson/LessonHeader';
import { LessonComponent } from '../components/lesson/LessonComponent';
import { ProgressBar } from '../components/lesson/ProgressBar';

type UserAnswer = {
  [index: number]: string | number | null;
};

type CompletedContent = {
  index: number;
  content: LessonContent;
  userAnswer?: string | number | null;
};

const LessonPage = () => {
  const { courseId, chapterId, lessonId } = useParams();
  const navigate = useNavigate();
  const contentEndRef = useRef<HTMLDivElement>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [lesson, setLesson] = useState<Lesson & { contents: LessonContent[] }>({
    id: 0,
    title: '',
    description: '',
    course_id: 0,
    chapter_id: 0,
    contents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer>({});
  const [showError, setShowError] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [completedContents, setCompletedContents] = useState<CompletedContent[]>([]);

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        if (!courseId || !chapterId || !lessonId) throw new Error("Missing URL parameters");

        // Fetch course
        const resCourse = await fetch(`http://localhost:8000/courses/${courseId}`);
        if (!resCourse.ok) throw new Error("Course not found");
        const courseData: Course = await resCourse.json();
        setCourse(courseData);

        // Fetch chapters
        const resChapters = await fetch(`http://localhost:8000/courses/${courseId}/chapters/`);
        if (!resChapters.ok) throw new Error("Chapters not found");
        const chapters: Chapter[] = await resChapters.json();
        const currentChapter = chapters.find(ch => ch.id.toString() === chapterId);
        if (!currentChapter) throw new Error("Chapter not found");
        setChapter(currentChapter);

        // Fetch lessons
        const resLessons = await fetch(`http://localhost:8000/chapters/${chapterId}/lessons/`);
        if (!resLessons.ok) throw new Error("Lessons not found");
        const lessons: Lesson[] = await resLessons.json();
        const currentLesson = lessons.find(lsn => lsn.id.toString() === lessonId);
        if (!currentLesson) throw new Error("Lesson not found");

        // Fetch lesson content
        const resContent = await fetch(`http://localhost:8000/lessons/${lessonId}/content/`);
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
  }, [courseId, chapterId, lessonId]);

  useEffect(() => {
    setCurrentIndex(0);
    setUserAnswers({});
    setShowError(false);
    setShowExplanation(false);
    setIsChecking(false);
    setCompletedContents([]);
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

    navigate(`/courses/${courseId}`);
  };

  const progress = lesson.contents.length > 0
    ? Math.round((currentIndex / lesson.contents.length) * 100)
    : 0;
  const isComplete = currentIndex === lesson.contents.length - 1;

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!course || !chapter || !lesson) return <div className="p-6">Lesson not found</div>;

  return (
    <div className="p-6 max-w-xl mx-auto pt-8">
      <ProgressBar progress={progress} isComplete={isComplete} />
      <LessonHeader course={course} chapter={chapter} lesson={lesson} />

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
    </div>
  );
};

export default LessonPage;
