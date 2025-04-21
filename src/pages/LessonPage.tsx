import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import coursesData from '../data/courses.json';
import { Course, LessonContent } from '../types/course';
import { LessonHeader } from '../components/lesson/LessonHeader';
import { LessonComponent } from '../components/lesson/LessonComponent';
import { ProgressBar } from '../components/lesson/ProgressBar';

type CoursesData = {
    courses: Course[];
};

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
    const courses = (coursesData as CoursesData).courses;
    const contentEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Find the course, chapter, and lesson
    const course = courses.find(c => c.id.toString() === courseId);
    const chapter = course?.chapters?.find(ch => ch.id.toString() === chapterId);
    const lesson = chapter?.lessons?.find(l => l.id.toString() === lessonId);

    // State management
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer>({});
    const [showError, setShowError] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [completedContents, setCompletedContents] = useState<CompletedContent[]>([]);

    if (!course || !chapter || !lesson) {
        return <div>Lesson not found</div>;
    }

    // Calculate progress
    const progress = lesson.contents.length > 0 
        ? Math.round((currentIndex / lesson.contents.length) * 100)
        : 0;
    const isComplete = currentIndex === lesson.contents.length - 1;

    // Reset state when lesson changes
    useEffect(() => {
        setCurrentIndex(0);
        setUserAnswers({});
        setShowError(false);
        setShowExplanation(false);
        setIsChecking(false);
        setCompletedContents([]);
    }, [lessonId]);

    // Scroll to bottom when new content is added
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
        // Add current content to completed
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
        // Add final content to completed if not already added
        if (isFinalQuestion && 
            !completedContents.some(c => c.index === currentIndex)) {
            setCompletedContents(prev => [
                ...prev, 
                {
                    index: currentIndex,
                    content: lesson.contents[currentIndex],
                    userAnswer: userAnswers[currentIndex]
                }
            ]);
        }
        
        // Navigate back to course page
        navigate(`/courses/${courseId}`);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto pt-8"> {/* Added pt-8 for progress bar spacing */}
            <ProgressBar progress={progress} isComplete={isComplete} />
            
            <LessonHeader course={course} chapter={chapter} lesson={lesson} />
            
            <div className="space-y-8">
                {/* Render all completed contents */}
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

                {/* Render current content */}
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