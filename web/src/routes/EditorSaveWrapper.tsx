import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from '../api';
import CourseEditorPage from "../pages/CourseEditorPage";
import { ContentBlock } from "../types/editor";
import type { Course, Unit, Lesson, LessonContent, ExamSummary } from '../types/course';

interface PickerState {
  courses: Course[];
  units: Unit[];
  lessons: Lesson[];
  courseId: number | null;
  unitId: number | null;
  lessonId: number | null;
}

interface DraftQuestion {
  id: string;
  format: 'multiple_choice' | 'short_answer';
  question: string;
  options: string[];
  correctOption: number;
  correctAnswer: string;
  explanation: string;
}

/** Map the API's read-side content shapes into editor blocks. */
function toEditorBlocks(contents: LessonContent[]): ContentBlock[] {
  return contents.map((c) => {
    if (c.type === 'markdown') {
      return { id: uuidv4(), type: 'markdown', data: { text: c.data.text } };
    }
    if (c.type === 'video') {
      return {
        id: uuidv4(),
        type: 'video',
        data: { url: c.data.url, caption: c.data.caption ?? '' },
      };
    }
    if (c.type === 'visualization') {
      return {
        id: uuidv4(),
        type: 'visualization',
        data: { engine: c.data.engine, config: c.data.config },
      };
    }
    if (c.type === 'question' && c.data.format === 'multiple_choice') {
      return {
        id: uuidv4(),
        type: 'multiple_choice',
        data: {
          question: c.data.question,
          options: c.data.options ?? ['', ''],
          correctAnswer: typeof c.data.correct_answer === 'number' ? c.data.correct_answer : 0,
          explanation: c.data.explanation ?? '',
        },
      };
    }
    if (c.type === 'question') {
      return {
        id: uuidv4(),
        type: 'short_answer',
        data: {
          question: c.data.question,
          answer: typeof c.data.correct_answer === 'string' ? c.data.correct_answer : '',
          explanation: c.data.explanation ?? '',
        },
      };
    }
    // Unknown kinds have no editor; keep them out rather than
    // silently dropping them on save. The editor refuses to load them.
    // (All known kinds are handled above, so this is only reachable
    // for a type the API returns that this code does not know yet.)
    const unknownKind = (c as { type?: string }).type ?? "unknown";
    throw new Error(`This lesson contains a "${unknownKind}" block the editor cannot edit.`);
  });
}

const EditorSaveWrapper = () => {
  const [picker, setPicker] = useState<PickerState>({
    courses: [], units: [], lessons: [],
    courseId: null, unitId: null, lessonId: null,
  });
  const [blocks, setBlocks] = useState<ContentBlock[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [error, setError] = useState('');

  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseLevel, setNewCourseLevel] = useState('');
  const [newCourseTime, setNewCourseTime] = useState('');
  const [newCoursePrerequisites, setNewCoursePrerequisites] = useState('');
  const [creating, setCreating] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);

  // Exam authoring for the selected course.
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [examKind, setExamKind] = useState<'unit' | 'final'>('unit');
  const [examUnitId, setExamUnitId] = useState<number | ''>('');
  const [examTitle, setExamTitle] = useState('');
  const [examPassMark, setExamPassMark] = useState('70');
  const [examQuestions, setExamQuestions] = useState<DraftQuestion[]>([]);
  const [examSaving, setExamSaving] = useState(false);
  const [examMessage, setExamMessage] = useState('');

  // The editor lists the user's own courses, private and published,
  // so a private course can be edited before it is published.
  useEffect(() => {
    apiFetch('/me/teaching')
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load your courses');
        const courses: Course[] = await res.json();
        setPicker((p) => ({ ...p, courses }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your courses'))
      .finally(() => setLoading(false));
  }, []);

  const loadExams = useCallback(async (courseId: number) => {
    const res = await apiFetch(`/courses/${courseId}/exams`);
    if (res.ok) setExams(await res.json());
    else setExams([]);
  }, []);

  const selectCourse = useCallback(async (courseId: number | null) => {
    setPicker((p) => ({ ...p, courseId, unitId: null, lessonId: null, units: [], lessons: [] }));
    setBlocks(null);
    setExams([]);
    if (courseId === null) return;
    const res = await apiFetch(`/courses/${courseId}/units/`);
    if (!res.ok) {
      setError('Could not load units');
      return;
    }
    const units: Unit[] = await res.json();
    setPicker((p) => ({ ...p, units }));
    loadExams(courseId);
  }, [loadExams]);

  const selectUnit = useCallback(async (unitId: number | null) => {
    setPicker((p) => ({ ...p, unitId, lessonId: null, lessons: [] }));
    setBlocks(null);
    if (unitId === null) return;
    const res = await apiFetch(`/units/${unitId}/lessons/`);
    if (!res.ok) {
      setError('Could not load lessons');
      return;
    }
    const lessons: Lesson[] = await res.json();
    setPicker((p) => ({ ...p, lessons }));
  }, []);

  const selectLesson = useCallback(async (lessonId: number | null) => {
    setPicker((p) => ({ ...p, lessonId }));
    setBlocks(null);
    setError('');
    if (lessonId === null) return;
    setLoadingLesson(true);
    try {
      const res = await apiFetch(`/lessons/${lessonId}/content/`);
      if (!res.ok) throw new Error('Could not load lesson content');
      const contents: LessonContent[] = await res.json();
      setBlocks(toEditorBlocks(contents));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lesson content');
    } finally {
      setLoadingLesson(false);
    }
  }, []);

  const handleSave = useCallback(async (content: ContentBlock[]) => {
    const lessonId = picker.lessonId;
    if (lessonId === null) throw new Error('No lesson selected');
    const payload = content.map(({ type, data }) => ({ type, data }));
    const res = await apiFetch(`/lessons/${lessonId}/content/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const detail = data?.detail;
      throw new Error(
        typeof detail === 'string' ? detail : 'Save failed. Check the blocks and try again.'
      );
    }
  }, [picker.lessonId]);

  const createLesson = async () => {
    if (!picker.unitId || !newLessonTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await apiFetch(`/units/${picker.unitId}/lessons/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newLessonTitle.trim() }),
      });
      if (!res.ok) throw new Error('Could not create the lesson');
      const lesson: Lesson = await res.json();
      setNewLessonTitle('');
      setPicker((p) => ({ ...p, lessons: [...p.lessons, lesson] }));
      await selectLesson(lesson.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the lesson');
    } finally {
      setCreating(false);
    }
  };

  const createUnit = async () => {
    if (!picker.courseId || !newUnitTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await apiFetch(`/courses/${picker.courseId}/units/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newUnitTitle.trim() }),
      });
      if (!res.ok) throw new Error('Could not create the unit');
      const unit: Unit = await res.json();
      setNewUnitTitle('');
      setPicker((p) => ({ ...p, units: [...p.units, unit] }));
      await selectUnit(unit.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the unit');
    } finally {
      setCreating(false);
    }
  };

  const createCourse = async () => {
    if (!newCourseTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const body: Record<string, unknown> = { title: newCourseTitle.trim() };
      if (newCourseDescription.trim()) body.description = newCourseDescription.trim();
      if (newCourseLevel.trim()) body.level = newCourseLevel.trim();
      if (newCourseTime.trim()) {
        const minutes = Number(newCourseTime.trim());
        if (!Number.isFinite(minutes) || minutes <= 0) throw new Error('Estimated time must be a number of minutes');
        body.estimated_time_minutes = minutes;
      }
      if (newCoursePrerequisites.trim()) body.prerequisites = newCoursePrerequisites.trim();
      const res = await apiFetch('/courses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Could not create the course');
      const course: Course = await res.json();
      setNewCourseTitle('');
      setNewCourseDescription('');
      setNewCourseLevel('');
      setNewCourseTime('');
      setNewCoursePrerequisites('');
      setPicker((p) => ({ ...p, courses: [...p.courses, course] }));
      await selectCourse(course.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the course');
    } finally {
      setCreating(false);
    }
  };

  const selectedCourse = picker.courses.find((c) => c.id === picker.courseId) ?? null;

  const setVisibility = async (publish: boolean) => {
    if (!picker.courseId) return;
    setPublishBusy(true);
    setError('');
    try {
      const res = await apiFetch(
        `/courses/${picker.courseId}/${publish ? 'publish' : 'unpublish'}`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error(publish ? 'Could not publish the course' : 'Could not unpublish the course');
      const visibility = publish ? 'published' as const : 'private' as const;
      setPicker((p) => ({
        ...p,
        courses: p.courses.map((c) => (c.id === picker.courseId ? { ...c, visibility } : c)),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change visibility');
    } finally {
      setPublishBusy(false);
    }
  };

  const addExamQuestion = () => {
    setExamQuestions((prev) => [
      ...prev,
      {
        id: uuidv4(),
        format: 'multiple_choice',
        question: '',
        options: ['', ''],
        correctOption: 0,
        correctAnswer: '',
        explanation: '',
      },
    ]);
  };

  const updateExamQuestion = (id: string, patch: Partial<DraftQuestion>) => {
    setExamQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const removeExamQuestion = (id: string) => {
    setExamQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const saveExam = async () => {
    if (!picker.courseId) return;
    setExamSaving(true);
    setExamMessage('');
    setError('');
    try {
      if (examKind === 'unit' && examUnitId === '') throw new Error('Pick a unit for the unit exam');
      if (examQuestions.length === 0) throw new Error('Add at least one question');
      const passMark = Number(examPassMark);
      if (!Number.isFinite(passMark) || passMark < 0 || passMark > 100) {
        throw new Error('Pass mark must be a number from 0 to 100');
      }
      const questions = examQuestions.map((q) => {
        if (!q.question.trim()) throw new Error('Every question needs its question text');
        if (q.format === 'multiple_choice') {
          const options = q.options.map((o) => o.trim());
          if (options.some((o) => !o)) throw new Error('Every option needs its text');
          return {
            format: 'multiple_choice' as const,
            question: q.question.trim(),
            options,
            correct_answer: q.correctOption,
            explanation: q.explanation.trim() || undefined,
          };
        }
        if (!q.correctAnswer.trim()) throw new Error('Every short answer question needs its answer');
        return {
          format: 'short_answer' as const,
          question: q.question.trim(),
          correct_answer: q.correctAnswer.trim(),
          explanation: q.explanation.trim() || undefined,
        };
      });
      const body = {
        title: examTitle.trim() || undefined,
        pass_mark: passMark,
        questions,
      };
      const path = examKind === 'unit'
        ? `/courses/${picker.courseId}/units/${examUnitId}/exam`
        : `/courses/${picker.courseId}/final-exam`;
      const res = await apiFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Could not save the exam');
      setExamTitle('');
      setExamQuestions([]);
      setExamMessage('Exam saved.');
      await loadExams(picker.courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the exam');
    } finally {
      setExamSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading courses…</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold px-6 pt-6">Lesson editor</h1>
      <p className="px-6 text-gray-600 text-sm">
        Pick a lesson to edit it. Saving replaces the lesson's whole
        content. Visualizations are kept as-is.
      </p>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 px-6 py-4">
        <label className="flex flex-col text-sm font-medium text-gray-700">
          Course
          <select
            value={picker.courseId ?? ''}
            onChange={(e) => selectCourse(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 px-3 py-2 border border-rule rounded-sm bg-paper min-w-52"
          >
            <option value="">Select a course…</option>
            {picker.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}{c.visibility === 'private' ? ' (private)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm font-medium text-gray-700">
          Unit
          <select
            value={picker.unitId ?? ''}
            onChange={(e) => selectUnit(e.target.value ? Number(e.target.value) : null)}
            disabled={!picker.courseId}
            className="mt-1 px-3 py-2 border border-rule rounded-sm bg-paper min-w-52 disabled:opacity-50"
          >
            <option value="">Select a unit…</option>
            {picker.units.map((u) => (
              <option key={u.id} value={u.id}>{u.title}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm font-medium text-gray-700">
          Lesson
          <select
            value={picker.lessonId ?? ''}
            onChange={(e) => selectLesson(e.target.value ? Number(e.target.value) : null)}
            disabled={!picker.unitId}
            className="mt-1 px-3 py-2 border border-rule rounded-sm bg-paper min-w-52 disabled:opacity-50"
          >
            <option value="">Select a lesson…</option>
            {picker.lessons.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </label>
      </div>

      {selectedCourse && (
        <div className="px-6 pb-2 flex flex-wrap items-center gap-3">
          <p className="text-sm">
            Visibility: {selectedCourse.visibility === 'published' ? 'Published' : 'Private'}
          </p>
          <button
            onClick={() => setVisibility(selectedCourse.visibility !== 'published')}
            disabled={publishBusy}
            className="px-3 py-2 bg-pencil hover:bg-pencil-dark text-white rounded-sm text-sm disabled:opacity-50"
          >
            {publishBusy
              ? 'Saving...'
              : selectedCourse.visibility === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      )}

      {picker.unitId !== null && (
        <div className="px-6 pb-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            placeholder="New lesson title"
            className="px-3 py-2 border border-rule rounded-sm text-sm"
          />
          <button
            onClick={createLesson}
            disabled={creating || !newLessonTitle.trim()}
            className="px-3 py-2 bg-paper hover:bg-gray-100 border border-rule rounded-sm text-sm disabled:opacity-50"
          >
            + New lesson in this unit
          </button>
        </div>
      )}

      {picker.courseId !== null && (
        <div className="px-6 pb-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newUnitTitle}
            onChange={(e) => setNewUnitTitle(e.target.value)}
            placeholder="New unit title"
            className="px-3 py-2 border border-rule rounded-sm text-sm"
          />
          <button
            onClick={createUnit}
            disabled={creating || !newUnitTitle.trim()}
            className="px-3 py-2 bg-paper hover:bg-gray-100 border border-rule rounded-sm text-sm disabled:opacity-50"
          >
            + New unit in this course
          </button>
        </div>
      )}

      <div className="px-6 pb-2 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={newCourseTitle}
          onChange={(e) => setNewCourseTitle(e.target.value)}
          placeholder="New course title"
          className="px-3 py-2 border border-rule rounded-sm text-sm"
        />
        <input
          type="text"
          value={newCourseDescription}
          onChange={(e) => setNewCourseDescription(e.target.value)}
          placeholder="Description (optional)"
          className="px-3 py-2 border border-rule rounded-sm text-sm"
        />
        <input
          type="text"
          value={newCourseLevel}
          onChange={(e) => setNewCourseLevel(e.target.value)}
          placeholder="Level (optional)"
          className="px-3 py-2 border border-rule rounded-sm text-sm"
        />
        <input
          type="number"
          min={1}
          value={newCourseTime}
          onChange={(e) => setNewCourseTime(e.target.value)}
          placeholder="Estimated time, minutes (optional)"
          className="px-3 py-2 border border-rule rounded-sm text-sm"
        />
        <input
          type="text"
          value={newCoursePrerequisites}
          onChange={(e) => setNewCoursePrerequisites(e.target.value)}
          placeholder="Prerequisites (optional)"
          className="px-3 py-2 border border-rule rounded-sm text-sm"
        />
        <button
          onClick={createCourse}
          disabled={creating || !newCourseTitle.trim()}
          className="px-3 py-2 bg-paper hover:bg-gray-100 border border-rule rounded-sm text-sm disabled:opacity-50"
        >
          + New course
        </button>
      </div>

      {loadingLesson && <div className="p-6">Loading lesson…</div>}

      {!loadingLesson && picker.lessonId !== null && blocks !== null && (
        <CourseEditorPage
          key={picker.lessonId}
          lessonId={picker.lessonId}
          initialContent={blocks}
          onSave={handleSave}
        />
      )}

      {!loadingLesson && picker.lessonId === null && (
        <div className="mx-6 my-4 p-10 border border-rule rounded-sm text-center">
          Select a lesson above, or create a new one, to start editing.
        </div>
      )}

      {picker.courseId !== null && (
        <section className="mx-6 my-6 border-t-2 border-ink pt-4">
          <h2 className="text-xl font-bold">Exams</h2>
          <p className="mt-1 text-sm text-gray-600">
            A unit exam opens once the unit's lessons are complete. The
            final exam opens once the last unit is complete. Students can
            retake an exam as many times as they like.
          </p>

          {exams.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm">
              {exams.map((exam) => (
                <li key={exam.id} className="border border-rule rounded-sm p-3 bg-paper">
                  {exam.is_final ? 'Final exam: ' : ''}{exam.title}
                  {' '}· Pass mark {exam.pass_mark}% · {exam.status}
                </li>
              ))}
            </ul>
          )}
          {exams.length === 0 && (
            <p className="mt-3 text-sm">This course has no exams yet.</p>
          )}

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Exam type
                <select
                  value={examKind}
                  onChange={(e) => setExamKind(e.target.value as 'unit' | 'final')}
                  className="mt-1 px-3 py-2 border border-rule rounded-sm bg-paper"
                >
                  <option value="unit">Unit exam</option>
                  <option value="final">Final exam</option>
                </select>
              </label>
              {examKind === 'unit' && (
                <label className="flex flex-col text-sm font-medium text-gray-700">
                  Unit
                  <select
                    value={examUnitId}
                    onChange={(e) => setExamUnitId(e.target.value ? Number(e.target.value) : '')}
                    className="mt-1 px-3 py-2 border border-rule rounded-sm bg-paper min-w-52"
                  >
                    <option value="">Select a unit…</option>
                    {picker.units.map((u) => (
                      <option key={u.id} value={u.id}>{u.title}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Title (optional)
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Exam title"
                  className="mt-1 px-3 py-2 border border-rule rounded-sm text-sm"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700">
                Pass mark (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={examPassMark}
                  onChange={(e) => setExamPassMark(e.target.value)}
                  className="mt-1 px-3 py-2 border border-rule rounded-sm text-sm w-24"
                />
              </label>
            </div>

            <div className="space-y-4">
              {examQuestions.map((q, qi) => (
                <div key={q.id} className="border border-rule rounded-sm p-4 bg-paper">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-pencil">Q{qi + 1}</span>
                    <select
                      value={q.format}
                      onChange={(e) => updateExamQuestion(q.id, { format: e.target.value as DraftQuestion['format'] })}
                      className="px-3 py-1 text-sm border border-rule rounded-sm bg-paper"
                    >
                      <option value="multiple_choice">Multiple choice</option>
                      <option value="short_answer">Short answer</option>
                    </select>
                    <button
                      onClick={() => removeExamQuestion(q.id)}
                      className="ml-auto px-2 py-1 bg-red-50 hover:bg-red-100 rounded-sm border border-rule text-pencil text-sm"
                    >
                      Remove question
                    </button>
                  </div>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateExamQuestion(q.id, { question: e.target.value })}
                    placeholder="Question"
                    className="mt-3 w-full px-3 py-2 border border-rule rounded-sm text-sm"
                  />
                  {q.format === 'multiple_choice' ? (
                    <div className="mt-3 space-y-2">
                      {q.options.map((option, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`exam-q-${q.id}`}
                            checked={q.correctOption === oi}
                            onChange={() => updateExamQuestion(q.id, { correctOption: oi })}
                            aria-label={`Mark option ${oi + 1} as correct`}
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const options = [...q.options];
                              options[oi] = e.target.value;
                              updateExamQuestion(q.id, { options });
                            }}
                            placeholder={`Option ${oi + 1}`}
                            className="flex-1 px-3 py-2 border border-rule rounded-sm text-sm"
                          />
                          <button
                            onClick={() => {
                              const options = q.options.filter((_, i) => i !== oi);
                              updateExamQuestion(q.id, {
                                options,
                                correctOption: Math.min(q.correctOption, Math.max(options.length - 1, 0)),
                              });
                            }}
                            disabled={q.options.length <= 2}
                            className="px-2 py-1 text-sm text-pencil hover:underline disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => updateExamQuestion(q.id, { options: [...q.options, ''] })}
                        className="text-sm text-pencil hover:underline"
                      >
                        + Add option
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={q.correctAnswer}
                      onChange={(e) => updateExamQuestion(q.id, { correctAnswer: e.target.value })}
                      placeholder="Correct answer"
                      className="mt-3 w-full px-3 py-2 border border-rule rounded-sm text-sm"
                    />
                  )}
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => updateExamQuestion(q.id, { explanation: e.target.value })}
                    placeholder="Explanation (optional)"
                    className="mt-3 w-full px-3 py-2 border border-rule rounded-sm text-sm"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={addExamQuestion}
                className="px-3 py-2 bg-paper hover:bg-gray-100 border border-rule rounded-sm text-sm"
              >
                + Add question
              </button>
              <button
                onClick={saveExam}
                disabled={examSaving || examQuestions.length === 0}
                className="px-4 py-2 bg-pencil hover:bg-pencil-dark text-white rounded-sm text-sm disabled:opacity-50"
              >
                {examSaving ? 'Saving...' : 'Save exam'}
              </button>
              {examMessage && <span className="text-sm text-pencil">{examMessage}</span>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default EditorSaveWrapper;
