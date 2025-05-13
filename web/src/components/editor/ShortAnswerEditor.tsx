import { useState, useEffect } from 'react';
import { EditorProps } from '../../types/editor';

const ShortAnswerEditor = ({
  question = '',
  answer = '',
  onChange
}: EditorProps) => {
  const [localState, setLocalState] = useState({
    question,
    answer
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localState);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [localState, onChange]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={localState.question}
        onChange={(e) => setLocalState(prev => ({
          ...prev,
          question: e.target.value
        }))}
        placeholder="Enter the question"
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      <textarea
        value={localState.answer}
        onChange={(e) => setLocalState(prev => ({
          ...prev,
          answer: e.target.value
        }))}
        placeholder="Enter the correct answer"
        className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
      />
    </div>
  );
};

export default ShortAnswerEditor;