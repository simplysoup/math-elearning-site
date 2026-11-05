import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ContentBlock, ContentBlockType } from '../types/editor';
import MarkdownEditor from '../components/editor/MarkdownEditor';
import MultipleChoiceEditor from '../components/editor/MultipleChoiceEditor';
import ShortAnswerEditor from '../components/editor/ShortAnswerEditor';
import CodeEditor from '../components/editor/CodeEditor';

interface CourseEditorPageProps {
  /** The lesson being edited; null when none is selected yet. */
  lessonId: number | null;
  initialContent?: ContentBlock[];
  /** Persists the blocks; resolves on success, rejects with an Error. */
  onSave: (content: ContentBlock[]) => Promise<void>;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const CourseEditorPage = ({ lessonId, initialContent = [], onSave }: CourseEditorPageProps) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string>('');

  // Drafts are per lesson, so switching lessons never mixes content.
  const draftKey = lessonId !== null ? `courseDraft:${lessonId}` : 'courseDraft';

  // Memoize the addBlock function
  const addBlock = useCallback((type: ContentBlockType = 'markdown') => {
    const newBlock: ContentBlock = {
      id: uuidv4(),
      type,
      data: getDefaultBlockData(type)
    };
    setBlocks(prev => [...prev, newBlock]);
  }, []);

  // Helper function for default block data
  const getDefaultBlockData = (type: ContentBlockType) => {
    switch(type) {
      case 'multiple_choice':
        return { question: '', options: ['', ''], correctAnswer: 0, explanation: '' };
      case 'short_answer':
        return { question: '', answer: '', explanation: '' };
      case 'code':
        return { code: '', language: 'javascript' };
      default:
        return { text: '' };
    }
  };

  // Stable update function
  const updateBlock = useCallback((id: string, newData: any) => {
    setBlocks(prev => prev.map(block =>
      block.id === id ? { ...block, data: newData } : block
    ));
  }, []);

  useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        setBlocks(JSON.parse(draft));
      } catch {
        setBlocks(initialContent);
      }
    } else {
      setBlocks(initialContent);
    }
    setIsDirty(false);
    setSaveStatus('idle');
    setSaveError('');
    // Runs once per mounted lesson (the wrapper remounts per lesson).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (blocks.length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(blocks));
      setIsDirty(true);
    }
  }, [blocks, draftKey]);

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;

    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < blocks.length) {
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError('');
    try {
      await onSave(blocks);
      // Clear the draft only once the server has the content.
      localStorage.removeItem(draftKey);
      setIsDirty(false);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={() => addBlock('markdown')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 text-sm font-medium"
        >
          + Markdown
        </button>
        <button
          onClick={() => addBlock('multiple_choice')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 text-sm font-medium"
        >
          + Multiple Choice
        </button>
        <button
          onClick={() => addBlock('short_answer')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 text-sm font-medium"
        >
          + Short Answer
        </button>
        <button
          onClick={() => addBlock('code')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 text-sm font-medium"
        >
          + Code Block
        </button>

        <div className="flex-grow"></div>

        {saveStatus === 'saved' && !isDirty && (
          <span className="self-center text-sm text-green-700">Saved.</span>
        )}
        {saveStatus === 'error' && (
          <span className="self-center text-sm text-red-600">{saveError || 'Save failed.'}</span>
        )}
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-medium disabled:opacity-50"
        >
          {saveStatus === 'saving' ? 'Saving…' : 'Save Course'}
        </button>
      </div>

      <div className="space-y-4">
        {blocks.length === 0 && (
          <div className="text-center p-10 bg-gray-50 rounded-lg text-gray-500">
            <p>No content yet. Add your first block to get started!</p>
          </div>
        )}

        {blocks.map((block, index) => (
          <div key={block.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            {block.type === 'visualization' ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                    Interactive visualization
                  </span>
                  <span className="text-sm text-gray-500">
                    {block.data?.config?.title || block.data?.config?.kind || 'Visualization'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  This block renders the lesson's interactive visualization. It is
                  kept exactly as-is when you save; edit it by changing the
                  lesson content on the server.
                </p>
                <button
                  onClick={() => deleteBlock(block.id)}
                  className="mt-2 px-2 py-1 bg-red-100 hover:bg-red-200 rounded-md border border-red-300 text-red-700 text-sm"
                >
                  Remove visualization
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  <select
                    value={block.type}
                    onChange={(e) => {
                      const newType = e.target.value as ContentBlockType;
                      setBlocks(blocks.map(b =>
                        b.id === block.id ? { ...b, type: newType, data: getDefaultBlockData(newType) } : b
                      ));
                    }}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="code">Code Block</option>
                  </select>

                  <button
                    onClick={() => moveBlock(block.id, 'up')}
                    disabled={index === 0}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveBlock(block.id, 'down')}
                    disabled={index === blocks.length - 1}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded-md border border-red-300 text-red-700"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-3">
                  {block.type === 'markdown' && (
                    <MarkdownEditor
                      content={block.data.text}
                      onChange={(text) => updateBlock(block.id, { ...block.data, text })}
                    />
                  )}

                  {block.type === 'multiple_choice' && (
                    <MultipleChoiceEditor
                      question={block.data.question}
                      options={block.data.options}
                      correctAnswer={block.data.correctAnswer}
                      explanation={block.data.explanation}
                      onChange={(newData) => updateBlock(block.id, newData)}
                    />
                  )}

                  {block.type === 'short_answer' && (
                    <ShortAnswerEditor
                      question={block.data.question}
                      answer={block.data.answer}
                      explanation={block.data.explanation}
                      onChange={(newData) => updateBlock(block.id, newData)}
                    />
                  )}

                  {block.type === 'code' && (
                    <CodeEditor
                      code={block.data.code}
                      language={block.data.language}
                      onChange={(newData) => updateBlock(block.id, newData)}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseEditorPage;
