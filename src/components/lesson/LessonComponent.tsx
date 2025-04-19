import { LessonComponentProps } from "../../types/course";
import { LessonContentRenderer } from "./LessonContentRenderer";

export const LessonComponent = ({
    content,
    index,
    isExpanded,
    isCurrent,
    userAnswer,
    onToggle,
    onAnswerChange
}: LessonComponentProps) => {
    return (
        <div 
            className={`mb-6 border rounded-lg overflow-hidden transition-all duration-200 ${
                isCurrent ? 'border-blue-500' : 'border-gray-200'
            }`}
        >
            <button
                className={`w-full p-4 text-left flex justify-between items-center ${
                    isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => onToggle(index)}
            >
                <span className="font-medium">
                    {content.type === 'markdown' && 'Explanation'}
                    {content.type === 'question' && 'Question'}
                    {content.type === 'visualization' && 'Interactive'}
                    {content.type === 'video' && 'Video'}
                </span>
                <svg
                    className={`w-5 h-5 transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {isExpanded && (
                <div className="p-4">
                    <LessonContentRenderer 
                        content={content} 
                        userAnswer={userAnswer}
                        onAnswerChange={(answer) => onAnswerChange?.(index, answer)}
                    />
                    
                    {isCurrent && content.type === 'question' && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => onAnswerChange?.(index, userAnswer ?? '')}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Submit Answer
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};