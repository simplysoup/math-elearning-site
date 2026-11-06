import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import type { ExamDetail, ExamAttempt } from '../../types/course';

interface ExamTakerProps {
  examId: number;
  title: string;
  passMark: number;
  /** Called after an attempt is recorded, so the parent can refresh status. */
  onAttemptDone?: () => void;
}

/**
 * Takes an exam: all questions on one page, one submit, then a result
 * screen with the score and a Try again button. Retakes are unlimited.
 * Multiple choice answers are sent as the option index, matching the
 * lesson question format; short answers are sent as text.
 */
const ExamTaker = ({ examId, title, passMark, onAttemptDone }: ExamTakerProps) => {
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamAttempt | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/exams/${examId}`);
        if (!res.ok) throw new Error('Could not load the exam');
        const data: ExamDetail = await res.json();
        if (cancelled) return;
        setExam(data);
        const attRes = await apiFetch(`/exams/${examId}/attempts`);
        if (attRes.ok && !cancelled) setAttempts(await attRes.json());
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the exam');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [examId]);

  const setAnswer = (questionId: number, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submit = async () => {
    if (!exam) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        answers: exam.questions.map((q) => ({
          question_id: q.id,
          answer: answers[q.id] ?? '',
        })),
      };
      const res = await apiFetch(`/exams/${examId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Could not submit the exam');
      const data: ExamAttempt = await res.json();
      setResult(data);
      setAttempts((prev) => [data, ...prev]);
      onAttemptDone?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit the exam');
    } finally {
      setSubmitting(false);
    }
  };

  const tryAgain = () => {
    setResult(null);
    setAnswers({});
    setSubmitError('');
  };

  if (loading) return <p className="mt-3 text-sm">Loading exam...</p>;
  if (error) return <p className="mt-3 text-sm text-red-600">{error}</p>;
  if (!exam) return null;

  if (result) {
    return (
      <div className="mt-3 border border-rule rounded-sm p-4 bg-paper">
        <p className="font-display text-xl font-semibold">
          {result.passed ? 'Passed.' : 'Not passed yet.'}
        </p>
        <p className="mt-1 leading-relaxed">
          Score: {result.score} percent ({Math.round((result.score / 100) * result.total)} out of {result.total} correct). The pass mark is {passMark} percent.
        </p>
        <p className="mt-1 text-sm leading-relaxed">
          {result.passed
            ? 'Good work. You can move on to the next unit.'
            : 'You can try again as many times as you like.'}
        </p>
        <button
          onClick={tryAgain}
          className="mt-3 px-4 py-2 bg-pencil hover:bg-pencil-dark text-white text-sm font-medium rounded-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  const unanswered = exam.questions.filter((q) => answers[q.id] === undefined || answers[q.id] === '').length;

  return (
    <div className="mt-3">
      <p className="text-sm">
        Pass mark: {passMark} percent. {exam.questions.length} question{exam.questions.length === 1 ? '' : 's'}.
      </p>
      {attempts.length > 0 && (
        <p className="mt-1 text-sm text-gray-600">
          Previous attempts: {attempts.map((a) => `${a.score}% (${Math.round((a.score / 100) * a.total)}/${a.total})`).join(', ')}
        </p>
      )}
      <ol className="mt-4 space-y-6">
        {exam.questions.map((q, i) => (
          <li key={q.id}>
            <p className="font-medium leading-snug">
              {i + 1}. {q.question}
            </p>
            {q.format === 'multiple_choice' && q.options ? (
              <div className="mt-2 space-y-1">
                {q.options.map((option, oi) => (
                  <label key={oi} className="flex items-start gap-2 text-sm leading-relaxed">
                    <input
                      type="radio"
                      name={`exam-${examId}-q-${q.id}`}
                      checked={answers[q.id] === oi}
                      onChange={() => setAnswer(q.id, oi)}
                      className="mt-1"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={typeof answers[q.id] === 'string' ? (answers[q.id] as string) : ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Your answer"
                className="mt-2 w-full px-3 py-2 border border-rule rounded-sm bg-paper focus:outline-none focus:ring-2 focus:ring-pencil"
              />
            )}
          </li>
        ))}
      </ol>
      {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="mt-4 px-4 py-2 bg-pencil hover:bg-pencil-dark text-white text-sm font-medium rounded-sm disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit exam'}
      </button>
      {unanswered > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          {unanswered} question{unanswered === 1 ? '' : 's'} left unanswered.
        </p>
      )}
      <p className="mt-1 text-xs text-gray-500">Title: {title}</p>
    </div>
  );
};

export default ExamTaker;
