import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRenderProps {
  children: string;
}

const MarkdownRender: React.FC<MarkdownRenderProps> = ({ children }) => {
  return (
    <ReactMarkdown
      children={children}
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    />
  );
};

export default MarkdownRender;
