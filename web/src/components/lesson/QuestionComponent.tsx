import { QuestionContent } from "../../types/course";
import MarkdownRender from "../../utils/MarkdownRender";

interface QuestionComponentProps {
    content: QuestionContent;
    userAnswer?: string | number | null;
    showError?: boolean;
    showExplanation?: boolean;
    isChecking?: boolean;
    onAnswerChange?: (value: string | number) => void;
    onCheckAnswer?: () => void;
    onTryAgain?: () => void;
    onContinue?: () => void;
    onShowExplanation?: () => void;
    isFinalQuestion?: boolean;
    isCurrent: boolean;
    onCompleteLesson?: () => void;
}

export const QuestionComponent = ({ 
    content, 
    userAnswer, 
    showError, 
    showExplanation,
    isChecking = false,
    onAnswerChange,
    onCheckAnswer,
    onTryAgain,
    onContinue,
    onShowExplanation,
    isFinalQuestion = false,
    isCurrent = true,
    onCompleteLesson
}: QuestionComponentProps) => {
    const renderOptions = () => {
        if (!content.data.options || content.data.options.length === 0) {
            return (
                <div className="text-pencil bg-mark/40 p-2 rounded-sm">
                    No options available for this question
                </div>
            );
        }

        return (
            <div className={`grid grid-cols-2 gap-3 mt-4 ${isChecking ? 'pointer-events-none' : ''}`}>
                {content.data.options.map((option, optionIndex) => {
                    const isSelected = userAnswer === optionIndex;
                    const isCorrectAnswer = optionIndex === content.data.correct_answer;
                    const isIncorrectAttempt = showError && isSelected;
                    const showAsCorrect = isChecking && isCorrectAnswer;

                    return (
                        <button
                            key={optionIndex}
                            className={`p-4 border rounded-sm text-center transition-colors
                                ${showAsCorrect ? 'bg-mark border-ink' : ''}
                                ${isIncorrectAttempt ? 'bg-gray-100 border-rule text-stone-400' : ''}
                                ${isSelected && !isChecking ? 'bg-mark border-ink' : ''}
                                ${!isSelected && !isChecking ? 'border-rule hover:border-ink' : ''}`}
                            onClick={() => onAnswerChange?.(optionIndex)}
                        >
                            <MarkdownRender>{option}</MarkdownRender>
                        </button>
                    );
                })}
            </div>
        );
    };

    const isCorrect = isChecking && !showError && userAnswer === content.data.correct_answer;

    return (
        <div className="space-y-4 p-4 border border-rule rounded-sm">
            {/* Question bubble */}
            <div className="p-2">
                <MarkdownRender>{content.data.question}</MarkdownRender>
            </div>

            {/* Answer options */}
            {content.data.format === 'multiple_choice' && renderOptions()}

            {content.data.format === 'short_answer' && (
                <textarea
                    className={`w-full p-2 border border-rule rounded-sm mt-2 focus:outline-none focus:ring-2 focus:ring-pencil ${isChecking ? 'bg-gray-50' : ''}`}
                    value={userAnswer?.toString() || ''}
                    onChange={(e) => onAnswerChange?.(e.target.value)}
                    placeholder="Type your answer here..."
                    disabled={isChecking}
                />
            )}

            {/* Check Answer button */}
            {!isChecking && isCurrent && (
                <button
                    onClick={onCheckAnswer}
                    className="px-4 py-2 bg-ink hover:bg-pencil text-white font-medium rounded-sm transition-colors disabled:opacity-50"
                    disabled={userAnswer === null || userAnswer === undefined}
                >
                    Check Answer
                </button>
            )}

            {/* Correct answer feedback */}
            {isCorrect && (
                <div className="bg-mark/60 p-4 rounded-sm border border-ink">
                    <div className="flex justify-between items-center">
                        <span className="font-bold">Correct.</span>
                        <button
                            onClick={onShowExplanation}
                            className="text-pencil hover:underline"
                        >
                            Why?
                        </button>
                    </div>
                </div>
            )}

            {/* Incorrect answer feedback */}
            {isChecking && showError && (
                <div className="bg-gray-50 p-4 rounded-sm border border-rule">
                    <MarkdownRender>{"That's incorrect. Try again."}</MarkdownRender>
                    <div className="flex space-x-3 mt-3">
                        <button
                            onClick={() => onAnswerChange?.(content.data.correct_answer)}
                            className="px-4 py-2 bg-white border border-rule rounded-sm hover:border-ink"
                        >
                            Show Answer
                        </button>
                        <button
                            onClick={onTryAgain}
                            className="px-4 py-2 bg-ink text-white rounded-sm hover:bg-pencil"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* Explanation - shown after clicking Why? */}
            {(showExplanation || !isCurrent ) && (
                <div className="bg-gray-50 p-4 rounded-sm border border-rule">
                    <p><b>Explanation:</b></p>
                    <MarkdownRender>{content.data.explanation || "No explanation available."}</MarkdownRender>
                </div>
            )}

            {/* Continue button - appears below everything for correct answers */}
            {isCorrect && (
                <button
                    onClick={isFinalQuestion ? onCompleteLesson : onContinue}
                    className="w-full px-4 py-2 bg-pencil text-white font-medium rounded-sm hover:bg-pencil-dark transition-colors"
                    disabled={!onContinue && !onCompleteLesson}  // Disable if no callbacks
                >
                    {isFinalQuestion ? 'Complete Lesson' : 'Continue'}
                </button>
            )}
        </div>
    );
};