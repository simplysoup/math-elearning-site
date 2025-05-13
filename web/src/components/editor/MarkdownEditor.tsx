import { useState, useEffect } from 'react';
import { EditorProps } from '../../types/editor';
import MarkdownRender from '../../utils/MarkdownRender';

const MarkdownEditor = ({ content = '', onChange }: EditorProps) => {
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ text: localContent });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [localContent, onChange]);

  return (
    <div className="space-y-3">
      <textarea
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        placeholder="Write your markdown here..."
        className="w-full p-3 border border-gray-300 rounded-md min-h-[100px] font-mono text-sm"
      />
      <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
        <h4 className="font-medium text-gray-700 mb-2">Preview:</h4>
        <div className="prose max-w-none">
          <MarkdownRender>{localContent || "Markdown preview will appear here"}</MarkdownRender>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;