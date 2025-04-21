import { LessonComponentProps } from "../../types/course";
import { LessonContentRenderer } from "./LessonContentRenderer";

export const LessonComponent = ({
    content,
    index,
    isCurrent,
    userAnswer,
    showError,
    onAnswerChange
}: LessonComponentProps) => {
    const handleAnswerChange = (value: string | number) => {
        onAnswerChange?.(index, value);
    };

    return (
        <div className={`mb-8 ${isCurrent ? 'current-content' : 'completed-content'}`}>
            <div className="mb-2 font-medium">
                {content.type === 'markdown' && 'Explanation'}
                {content.type === 'question' && 'Question'}
                {content.type === 'visualization' && 'Interactive'}
                {content.type === 'video' && 'Video'}
            </div>
            
            <div>
                <LessonContentRenderer 
                    content={content} 
                    userAnswer={userAnswer}
                    showError={showError}
                    onAnswerChange={handleAnswerChange}
                />
                
                {isCurrent && content.type === 'question' && (
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => {
                                if (userAnswer !== null && userAnswer !== undefined) {
                                    handleAnswerChange(userAnswer);
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            disabled={userAnswer === null || userAnswer === undefined}
                        >
                            Submit Answer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};