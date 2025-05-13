import { MarkdownContent } from "../../types/course";
import MarkdownRender from "../../utils/MarkdownRender"


export const MarkdownComponent = ({ content }: { content: MarkdownContent }) => {
    return (
        <div className="prose max-w-none whitespace-pre-line">
            {content.data.format === 'latex' ? (
                    <MarkdownRender>{content.data.text}</MarkdownRender>
            ) : (
                <p className="whitespace-pre-line">{content.data.text}</p>
            )}
        </div>
    );
};