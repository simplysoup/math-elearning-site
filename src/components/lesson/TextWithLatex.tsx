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
                return <span key={index}>{part.content}</span>;
            })}
        </>
    );
};