import { useState, useEffect } from 'react';
import { EditorProps } from '../../types/editor';

const ShortAnswerEditor = ({
  question = '',
  answer = '',
  explanation = '',
  onChange
}: EditorProps) => {
  const [localState, setLocalState] = useState({
    question,
    answer,
    explanation,
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
        className="w-full p-2 border border-rule rounded-sm"
      />
      <textarea
        value={localState.answer}
        onChange={(e) => setLocalState(prev => ({
          ...prev,
          answer: e.target.value
        }))}
        placeholder="Enter the correct answer"
        className="w-full p-2 border border-rule rounded-sm min-h-[80px]"
      />
      <input
        type="text"
        value={localState.explanation}
        onChange={(e) => setLocalState(prev => ({
          ...prev,
          explanation: e.target.value
        }))}
        placeholder="Explanation (shown after answering, optional)"
        className="w-full p-2 border border-rule rounded-sm"
      />
    </div>
  );
};

export default ShortAnswerEditor;