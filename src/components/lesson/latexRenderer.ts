import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface LatexResult {
    html: string;
    error: boolean;
}

export const renderLatex = (text: string, displayMode: boolean = false): LatexResult => {
    try {
        const html = katex.renderToString(text, {
            throwOnError: false,
            displayMode,
            output: 'mathml'
        });
        return { html, error: false };
    } catch (e) {
        console.error("KaTeX rendering error:", e);
        return { html: text, error: true };
    }
};

export const splitLatexText = (text: string): Array<{ 
    content: string; 
    isLatex: boolean; 
    displayMode: boolean 
}> => {
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
    return parts.filter(part => part.length > 0).map(part => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
            return {
                content: part.slice(2, -2),
                isLatex: true,
                displayMode: true
            };
        } else if (part.startsWith('$') && part.endsWith('$')) {
            return {
                content: part.slice(1, -1),
                isLatex: true,
                displayMode: false
            };
        }
        return {
            content: part,
            isLatex: false,
            displayMode: false
        };
    });
};
