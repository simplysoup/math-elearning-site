import { EditorProps } from '../../types/editor';

const CodeEditor = ({
  code,
  language,
  onChange
}: EditorProps) => {
  return (
    <div className="space-y-2">
      <select
        value={language}
        onChange={(e) => onChange({ code, language: e.target.value })}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="java">Java</option>
      </select>
      <textarea
        value={code}
        onChange={(e) => onChange({ code: e.target.value, language })}
        placeholder={`Enter your ${language} code`}
        className="w-full p-3 border border-gray-300 rounded-md min-h-[120px] font-mono text-sm bg-gray-50"
      />
    </div>
  );
};

export default CodeEditor;