import React from 'react';
import { renderLatex, splitLatexText } from './latexRenderer';

interface TextWithLatexProps {
    text: string;
}

export const TextWithLatex: React.FC<TextWithLatexProps> = ({ text }) => {
    const parts = splitLatexText(text);

    return (
        <>
            {parts.map((part, index) => {
                if (part.isLatex) {
                    const { html } = renderLatex(part.content, part.displayMode);
                    return (
                        <span 
                            key={index} 
                            dangerouslySetInnerHTML={{ __html: html }} 
                        />
                    );
                }
                // Split plain text by newlines and render each line with a <br />
                return part.content.split('\n').map((line, lineIndex) => (
                    <React.Fragment key={`${index}-${lineIndex}`}>
                        {lineIndex > 0 && <br />}
                        {line}
                    </React.Fragment>
                ));
            })}
        </>
    );
};