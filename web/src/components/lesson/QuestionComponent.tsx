import { QuestionContent } from "../../types/course";
import { TextWithLatex } from "./TextWithLatex";

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
                <div className="text-yellow-600 bg-yellow-50 p-2 rounded">
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
                            className={`p-4 border rounded-lg text-center transition-all
                                ${showAsCorrect ? 'bg-green-100 border-green-300' : ''}
                                ${isIncorrectAttempt ? 'bg-gray-100 border-gray-300 text-gray-400' : ''}
                                ${isSelected && !isChecking ? 'bg-blue-100 border-blue-300' : ''}
                                ${!isSelected && !isChecking ? 'hover:bg-gray-50' : ''}`}
                            onClick={() => onAnswerChange?.(optionIndex)}
                        >
                            <TextWithLatex text={option} />
                        </button>
                    );
                })}
            </div>
        );
    };

    const isCorrect = isChecking && !showError && userAnswer === content.data.correct_answer;

    return (
        <div className="space-y-4 p-4 bg-gray-100 rounded">
            {/* Question bubble */}
            <div className="p-4 rounded-lg">
                <TextWithLatex text={content.data.question} />
            </div>

            {/* Answer options */}
            {content.data.format === 'multiple_choice' && renderOptions()}
            
            {content.data.format === 'short_answer' && (
                <textarea
                    className={`w-full p-2 border rounded mt-2 ${isChecking ? 'bg-gray-50' : ''}`}
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
                    className="px-4 py-2 bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 border-b-4 border-gray-700 rounded-full"
                    disabled={userAnswer === null || userAnswer === undefined}
                >
                    Check Answer
                </button>
            )}

            {/* Correct answer feedback */}
            {isCorrect && (
                <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-green-800">Correct!</span>
                        <button 
                            onClick={onShowExplanation}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            Why?
                        </button>
                    </div>
                </div>
            )}

            {/* Incorrect answer feedback */}
            {isChecking && showError && (
                <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-200">
                    <TextWithLatex text={"That's incorrect. Try again."} />
                    <div className="flex space-x-3 mt-3">
                        <button
                            onClick={() => onAnswerChange?.(content.data.correct_answer)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Show Answer
                        </button>
                        <button
                            onClick={onTryAgain}
                            className="px-4 py-2 bg-blue-200 text-blue-800 rounded hover:bg-blue-300"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* Explanation - shown after clicking Why? */}
            {(showExplanation || !isCurrent ) && (
                <div className="bg-gray-200 p-4 rounded-lg">
                    <p><b>Explanation:</b></p>
                    <TextWithLatex text={content.data.explanation || "No explanation available."} />
                </div>
            )}

            {/* Continue button - appears below everything for correct answers */}
            {isCorrect && (
                <button
                    onClick={isFinalQuestion ? onCompleteLesson : onContinue}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={!onContinue && !onCompleteLesson}  // Disable if no callbacks
                >
                    {isFinalQuestion ? 'Complete Lesson' : 'Continue'}
                </button>
            )}
        </div>
    );
};