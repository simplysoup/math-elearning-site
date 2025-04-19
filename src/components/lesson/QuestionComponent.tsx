import { QuestionContent } from "../../types/course";
import { TextWithLatex } from "./TextWithLatex";

interface QuestionComponentProps {
    content: QuestionContent;
    userAnswer?: string | number | null;
    showError?: boolean;
    onAnswerChange?: (value: string | number) => void;
}

export const QuestionComponent = ({ 
    content, 
    userAnswer, 
    showError, 
    onAnswerChange 
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
            <ul className="space-y-2">
                {content.data.options.map((option, optionIndex) => (
                    <li key={optionIndex}>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`question`}
                                checked={userAnswer === optionIndex}
                                onChange={() => onAnswerChange?.(optionIndex)}
                                className="h-4 w-4 text-blue-600"
                            />
                            <TextWithLatex text={option} />
                        </label>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold">
                <TextWithLatex text={content.data.question} />
            </h3>
            
            {content.data.format === 'multiple_choice' && renderOptions()}
            
            {content.data.format === 'short_answer' && (
                <textarea
                    className="w-full p-2 border rounded mt-2"
                    value={userAnswer?.toString() || ''}
                    onChange={(e) => onAnswerChange?.(e.target.value)}
                    placeholder="Type your answer here..."
                />
            )}
            
            {showError && (
                <div className="text-red-600">
                    {content.data.explanation || 'Please check your answer'}
                </div>
            )}
        </div>
    );
};