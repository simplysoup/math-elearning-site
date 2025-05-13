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
    console.log('Rendering content:', content);

    const handleAnswerChange = (value: string | number) => {
        onAnswerChange?.(index, value);
    };

    return (
        <div className={`mb-8 ${isCurrent ? 'current-content' : 'completed-content'}`}>
            
            {content.type === 'markdown' ? (
                <>
                    <MarkdownComponent content={content} />
                    {isCurrent && (
                        <button
                            onClick={onContinue}
                            className="mt-4 bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 border-b-4 border-gray-700 rounded-full"
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
                        className="mt-4 bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 border-b-4 border-gray-700 rounded-full"
                    >
                        Continue
                    </button>}
                </>
            ) : content.type === 'video' ? (
                <>
                    <VideoComponent content={content} />
                    {isCurrent && <button
                        onClick={onContinue}
                        className="mt-4 bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 border-b-4 border-gray-700 rounded-full"
                    >
                        Continue
                    </button>}
                </>
            ) : null}
        </div>
    );
};