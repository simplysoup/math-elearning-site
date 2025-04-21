import { MarkdownContent } from "../../types/course";
import { TextWithLatex } from "./TextWithLatex";

export const MarkdownComponent = ({ content }: { content: MarkdownContent }) => {
    return (
        <div className="prose max-w-none whitespace-pre-line">
            {content.data.format === 'latex' ? (
                <div className="bg-gray-100 p-4 rounded">
                    <TextWithLatex text={content.data.text} />
                </div>
            ) : (
                <p className="whitespace-pre-line">{content.data.text}</p>
            )}
        </div>
    );
};