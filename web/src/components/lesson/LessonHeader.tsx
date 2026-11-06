import { useNavigate } from "react-router-dom";
import { Course, Unit, Lesson } from "../../types/course";

export const LessonHeader = ({ course, unit, lesson }: { course: Course; unit: Unit; lesson: Lesson }) => {
    const navigate = useNavigate();

    return (
        <div className="mb-8">
            <nav className="flex mb-6" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li className="inline-flex items-center">
                        <button 
                            onClick={() => navigate(`/courses/${course.id}`)} 
                            className="inline-flex items-center text-sm font-medium text-ink hover:text-pencil"
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
                                {unit.title}
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

            <h1 className="font-display text-3xl font-bold tracking-tight mb-2">{lesson.title}</h1>
        </div>
    );
};