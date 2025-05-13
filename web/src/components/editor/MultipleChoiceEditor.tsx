import { useState, useEffect } from 'react';
import { EditorProps } from '../../types/editor';

const MultipleChoiceEditor = ({
  question = '',
  options = ['', ''],
  correctAnswer = 0,
  onChange
}: EditorProps) => {
  const [localState, setLocalState] = useState({
    question,
    options,
    correctAnswer
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localState);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [localState, onChange]);

  const handleOptionChange = (index: number, value: string) => {
    setLocalState(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setLocalState(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    setLocalState(prev => {
      const newOptions = prev.options.filter((_, i) => i !== index);
      const newCorrectAnswer = 
        prev.correctAnswer === index ? 0 :
        prev.correctAnswer > index ? prev.correctAnswer - 1 :
        prev.correctAnswer;
      return { ...prev, options: newOptions, correctAnswer: newCorrectAnswer };
    });
  };

  return (
    <div className="space-y-4">
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

      <div className="space-y-2">
        {localState.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct-answer"
              checked={localState.correctAnswer === index}
              onChange={() => setLocalState(prev => ({
                ...prev,
                correctAnswer: index
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-grow p-2 border border-gray-300 rounded-md"
            />
            {localState.options.length > 2 && (
              <button 
                onClick={() => removeOption(index)}
                className="p-1 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button 
        onClick={addOption}
        disabled={localState.options.length >= 6}
        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 text-sm disabled:opacity-50"
      >
        + Add Option (Max: 6)
      </button>
    </div>
  );
};

export default MultipleChoiceEditor;