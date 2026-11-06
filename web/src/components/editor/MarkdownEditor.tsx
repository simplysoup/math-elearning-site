import { useState, useEffect } from 'react';
import { EditorProps } from '../../types/editor';
import MarkdownRender from '../../utils/MarkdownRender';

const MarkdownEditor = ({ content = '', format = 'markdown', onChange }: EditorProps & { format?: string }) => {
  const [localContent, setLocalContent] = useState(content);
  const [localFormat, setLocalFormat] = useState(format);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ text: localContent, format: localFormat });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [localContent, localFormat, onChange]);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={localFormat === 'latex'}
          onChange={(e) => setLocalFormat(e.target.checked ? 'latex' : 'markdown')}
        />
        Render math with LaTeX ($...$ becomes typeset equations)
      </label>
      <textarea
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        placeholder="Write your markdown here..."
        className="w-full p-3 border border-rule rounded-sm min-h-[100px] font-mono text-sm"
      />
      <div className="p-3 border border-rule rounded-sm bg-gray-50">
        <h4 className="font-medium text-gray-700 mb-2">Preview:</h4>
        <div className="prose max-w-none">
          <MarkdownRender>{localContent || "Markdown preview will appear here"}</MarkdownRender>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;