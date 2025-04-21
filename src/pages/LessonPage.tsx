import { useState, useEffect, useRef } from 'react';
import { useParams } from "react-router-dom";
import coursesData from '../data/courses.json';
import { Course } from '../types/course';
import { LessonHeader } from '../components/lesson/LessonHeader';
import { LessonComponent } from '../components/lesson/LessonComponent';
import { LessonNavigation } from '../components/lesson/LessonNavigation';

type CoursesData = {
    courses: Course[];
};

type UserAnswer = {
    [index: number]: string | number | null;
};

const LessonPage = () => {
    const { courseId, chapterId, lessonId } = useParams();
    const courses = (coursesData as CoursesData).courses;
    const contentRef = useRef<HTMLDivElement>(null); // Properly declare the ref
    
    // Find the course, chapter, and lesson
    const course = courses.find(c => c.id.toString() === courseId);
    const chapter = course?.chapters?.find(ch => ch.id.toString() === chapterId);
    const lesson = chapter?.lessons?.find(l => l.id.toString() === lessonId);

    // State management
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer>({});
    const [showError, setShowError] = useState(false);

    if (!course || !chapter || !lesson) {
        return <div>Lesson not found</div>;
    }

    // Reset state when lesson changes
    useEffect(() => {
        setCurrentIndex(0);
        setUserAnswers({});
        setShowError(false);
    }, [lessonId]);

    // Scroll to current component
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [currentIndex]);

    const handleContinue = () => {
        const currentContent = lesson.contents[currentIndex];
        
        if (currentContent.type === 'question') {
            const userAnswer = userAnswers[currentIndex];
            const correctAnswer = currentContent.data.correct_answer;
            
            if (userAnswer === undefined || userAnswer === null) {
                setShowError(true);
                return;
            }
            
            if (userAnswer !== correctAnswer) {
                setShowError(true);
                return;
            }
        }
        
        setShowError(false);
        
        if (currentIndex < lesson.contents.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            console.log("Lesson completed!");
        }
    };

    const handleAnswerChange = (index: number, value: string | number) => {
        setUserAnswers({
            ...userAnswers,
            [index]: value
        });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <LessonHeader course={course} chapter={chapter} lesson={lesson} />
            
            <div className="space-y-8">
                {/* Only render the current component */}
                <div ref={contentRef}> {/* Properly attach the ref */}
                    <LessonComponent
                        content={lesson.contents[currentIndex]}
                        index={currentIndex}
                        isCurrent={true}
                        userAnswer={userAnswers[currentIndex]}
                        showError={showError}
                        onAnswerChange={handleAnswerChange}
                    />
                </div>
            </div>

            <LessonNavigation
                currentIndex={currentIndex}
                totalContents={lesson.contents.length}
                onPrevious={() => {
                    if (currentIndex > 0) {
                        setCurrentIndex(currentIndex - 1);
                    }
                }}
                onContinue={handleContinue}
            />
        </div>
    );
};

export default LessonPage;