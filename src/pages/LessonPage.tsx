import { useState, useEffect } from 'react';
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
    
    // Find the course, chapter, and lesson
    const course = courses.find(c => c.id.toString() === courseId);
    const chapter = course?.chapters?.find(ch => ch.id.toString() === chapterId);
    const lesson = chapter?.lessons?.find(l => l.id.toString() === lessonId);

    // State management
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer>({});
    const [expandedComponents, setExpandedComponents] = useState<number[]>([0]);
    const [showError, setShowError] = useState(false);

    if (!course || !chapter || !lesson) {
        return <div>Lesson not found</div>;
    }

    // Reset state when lesson changes
    useEffect(() => {
        setCurrentIndex(0);
        setUserAnswers({});
        setExpandedComponents([0]);
        setShowError(false);
    }, [lessonId]);

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
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setExpandedComponents([...expandedComponents, nextIndex]);
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

    const toggleComponent = (index: number) => {
        if (expandedComponents.includes(index)) {
            setExpandedComponents(expandedComponents.filter(i => i !== index));
        } else {
            setExpandedComponents([...expandedComponents, index]);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <LessonHeader course={course} chapter={chapter} lesson={lesson} />
            
            <div className="space-y-4">
                {lesson.contents.map((content, index) => (
                    <LessonComponent
                        key={index}
                        content={content}
                        index={index}
                        isExpanded={expandedComponents.includes(index)}
                        isCurrent={index === currentIndex}
                        userAnswer={userAnswers[index]}
                        showError={showError && index === currentIndex}
                        onToggle={toggleComponent}
                        onAnswerChange={handleAnswerChange}
                    />
                ))}
            </div>

            <LessonNavigation
                currentIndex={currentIndex}
                totalContents={lesson.contents.length}
                onPrevious={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                onContinue={handleContinue}
            />
        </div>
    );
};

export default LessonPage;