import { LessonContent } from "../../types/course";
import { MarkdownComponent } from "./MarkdownComponent";
import { QuestionComponent } from "./QuestionComponent";

export const LessonContentRenderer = ({ 
    content,
    userAnswer,
    showError,
    onAnswerChange
}: { 
    content: LessonContent;
    userAnswer?: string | number | null;
    showError?: boolean;
    onAnswerChange?: (value: string | number) => void; // Only value parameter here
}) => {
    switch (content.type) {
        case 'markdown':
            return <MarkdownComponent content={content} />;
        case 'question':
            return <QuestionComponent 
                content={content} 
                userAnswer={userAnswer}
                showError={showError}
                onAnswerChange={onAnswerChange}
            />;
        default:
            return null;
    }
};