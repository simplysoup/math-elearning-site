import { useParams, useNavigate } from "react-router-dom";
import coursesData from '../data/courses.json';
import type { Course, LessonContent } from '../types/course';

type CoursesData = {
    courses: Course[];
};

const LessonPage = () => {
    const { courseId, chapterId, lessonId } = useParams();
    const navigate = useNavigate();
    const courses = (coursesData as CoursesData).courses;
    
    // Find the course, chapter, and lesson
    const course = courses.find(c => c.id.toString() === courseId);
    const chapter = course?.chapters.find(ch => ch.id.toString() === chapterId);
    const lesson = chapter?.lessons.find(l => l.id.toString() === lessonId);

    if (!course || !chapter || !lesson) {
        return <div>Lesson not found</div>;
    }

    const renderContent = (content: LessonContent) => {
        switch (content.type) {
            case 'markdown':
                return (
                    <div className="prose max-w-none mb-6">
                        {content.data.format === 'latex' ? (
                            <div className="bg-gray-100 p-4 rounded">
                                LaTeX content: {content.data.text}
                            </div>
                        ) : (
                            <p>{content.data.text}</p>
                        )}
                    </div>
                );
            case 'video':
                return (
                    <div className="mb-6">
                        <div className="bg-gray-200 aspect-video flex items-center justify-center rounded-lg">
                            <p>Video: {content.data.url}</p>
                        </div>
                        {content.data.caption && (
                            <p className="text-gray-600 mt-2">{content.data.caption}</p>
                        )}
                    </div>
                );
            case 'visualization':
                return (
                    <div className="bg-gray-100 p-4 rounded mb-6">
                        <p>Visualization: {content.data.engine}</p>
                    </div>
                );
            case 'question':
                return (
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <h3 className="font-bold mb-2">{content.data.question}</h3>
                        {content.data.format === 'multiple_choice' && content.data.options && (
                            <ul className="space-y-2">
                                {content.data.options.map((option, index) => (
                                    <li key={index} className="flex items-center">
                                        <input 
                                            type="radio" 
                                            id={`option-${index}`} 
                                            name="question" 
                                            className="mr-2"
                                        />
                                        <label htmlFor={`option-${index}`}>{option}</label>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {content.data.format === 'short_answer' && (
                            <textarea className="w-full p-2 border rounded mt-2"></textarea>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        <li className="inline-flex items-center">
                            <button 
                                onClick={() => navigate(`/courses/${course.id}`)} 
                                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                            >
                                {course.title}
                            </button>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                                </svg>
                                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                                    {chapter.title}
                                </span>
                            </div>
                        </li>
                        <li aria-current="page">
                            <div className="flex items-center">
                                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                                </svg>
                                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                                    {lesson.title}
                                </span>
                            </div>
                        </li>
                    </ol>
                </nav>

                <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
                <p className="text-gray-600 mb-6">{lesson.description}</p>

                <div className="bg-white rounded-lg shadow-md p-6">
                    {lesson.contents.map((content, index) => (
                        <div key={index}>
                            {renderContent(content)}
                        </div>
                    ))}
                </div>

                <div className="flex justify-between mt-8">
                    <button 
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        disabled // Implement navigation logic later
                    >
                        Previous Lesson
                    </button>
                    <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled // Implement navigation logic later
                    >
                        Next Lesson
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonPage;