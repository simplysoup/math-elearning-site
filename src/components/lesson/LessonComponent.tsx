import { LessonComponentProps } from "../../types/course";
import { MarkdownComponent } from "./MarkdownComponent";
import { QuestionComponent } from "./QuestionComponent";
import { VisualizationComponent } from "./VisualizationComponent";
import { VideoComponent } from "./VideoComponent";

export const LessonComponent = ({
    content,
    index,
    isCurrent,
    userAnswer,
    showError,
    showExplanation,
    isChecking,
    onAnswerChange,
    onCheckAnswer,
    onContinue,
    onTryAgain,
    onShowExplanation,
    onCompleteLesson,
    isFinalQuestion,
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
            
            {content.type === 'markdown' ? (
                <>
                    <MarkdownComponent content={content} />
                    {isCurrent && (
                        <button
                            onClick={onContinue}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Continue
                        </button>
                    )}
                </>
            ) : content.type === 'question' ? (
                <QuestionComponent 
                    content={content}
                    userAnswer={userAnswer}
                    showError={isCurrent ? showError : false}
                    showExplanation={isCurrent ? showExplanation : false}
                    isChecking={isCurrent ? isChecking : false}
                    isCurrent={isCurrent}
                    onAnswerChange={isCurrent ? handleAnswerChange : undefined}
                    onCheckAnswer={isCurrent ? onCheckAnswer : undefined}
                    onTryAgain={isCurrent ? onTryAgain : undefined}
                    onContinue={isCurrent ? onContinue : undefined}
                    onShowExplanation={isCurrent ? onShowExplanation : undefined}
                    onCompleteLesson={isCurrent ? onCompleteLesson : undefined}
                    isFinalQuestion={isCurrent ? isFinalQuestion : false}
                />
            ) : content.type === 'visualization' ? (
                <>
                    <VisualizationComponent content={content} />
                    {isCurrent && <button
                        onClick={onContinue}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Continue
                    </button>}
                </>
            ) : content.type === 'video' ? (
                <>
                    <VideoComponent content={content} />
                    {isCurrent && <button
                        onClick={onContinue}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Continue
                    </button>}
                </>
            ) : null}
        </div>
    );
};