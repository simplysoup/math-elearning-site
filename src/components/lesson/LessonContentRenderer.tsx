import { LessonContent } from "../../types/course";
import { MarkdownComponent } from "./MarkdownComponent";
import { QuestionComponent } from "./QuestionComponent";

export const LessonContentRenderer = ({ 
    content, 
    userAnswer, 
    onAnswerChange 
}: { 
    content: LessonContent;
    userAnswer?: string | number | null;
    onAnswerChange?: (value: string | number) => void;
}) => {
    switch (content.type) {
        case 'markdown':
            return <MarkdownComponent content={content} />;
        case 'question':
            return <QuestionComponent 
                content={content} 
                userAnswer={userAnswer}
                onAnswerChange={onAnswerChange}
            />;
        default:
            return null;
    }
};