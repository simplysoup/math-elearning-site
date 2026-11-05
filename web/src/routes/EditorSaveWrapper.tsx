import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from '../api';
import CourseEditorPage from "../pages/CourseEditorPage";
import { ContentBlock } from "../types/editor";
import type { Course, Chapter, Lesson, LessonContent } from '../types/course';

interface PickerState {
  courses: Course[];
  chapters: Chapter[];
  lessons: Lesson[];
  courseId: number | null;
  chapterId: number | null;
  lessonId: number | null;
}

/** Map the API's read-side content shapes into editor blocks. */
function toEditorBlocks(contents: LessonContent[]): ContentBlock[] {
  return contents.map((c) => {
    if (c.type === 'markdown') {
      return { id: uuidv4(), type: 'markdown', data: { text: c.data.text } };
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
    // Video and unknown kinds have no editor; keep them out rather than
    // silently dropping them on save — the editor refuses to load them.
    throw new Error(`This lesson contains a "${c.type}" block the editor cannot edit.`);
  });
}

const EditorSaveWrapper = () => {
  const [picker, setPicker] = useState<PickerState>({
    courses: [], chapters: [], lessons: [],
    courseId: null, chapterId: null, lessonId: null,
  });
  const [blocks, setBlocks] = useState<ContentBlock[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [error, setError] = useState('');

  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    apiFetch('/courses/')
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load courses');
        const courses: Course[] = await res.json();
        setPicker((p) => ({ ...p, courses }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load courses'))
      .finally(() => setLoading(false));
  }, []);

  const selectCourse = useCallback(async (courseId: number | null) => {
    setPicker((p) => ({ ...p, courseId, chapterId: null, lessonId: null, chapters: [], lessons: [] }));
    setBlocks(null);
    if (courseId === null) return;
    const res = await apiFetch(`/courses/${courseId}/chapters/`);
    if (!res.ok) {
      setError('Could not load chapters');
      return;
    }
    const chapters: Chapter[] = await res.json();
    setPicker((p) => ({ ...p, chapters }));
  }, []);

  const selectChapter = useCallback(async (chapterId: number | null) => {
    setPicker((p) => ({ ...p, chapterId, lessonId: null, lessons: [] }));
    setBlocks(null);
    if (chapterId === null) return;
    const res = await apiFetch(`/chapters/${chapterId}/lessons/`);
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
    if (!picker.chapterId || !newLessonTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await apiFetch(
        `/chapters/${picker.chapterId}/lessons/?title=${encodeURIComponent(newLessonTitle.trim())}`,
        { method: 'POST' },
      );
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

  const createChapter = async () => {
    if (!picker.courseId || !newChapterTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await apiFetch(
        `/courses/${picker.courseId}/chapters/?title=${encodeURIComponent(newChapterTitle.trim())}`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error('Could not create the chapter');
      const chapter: Chapter = await res.json();
      setNewChapterTitle('');
      setPicker((p) => ({ ...p, chapters: [...p.chapters, chapter] }));
      await selectChapter(chapter.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the chapter');
    } finally {
      setCreating(false);
    }
  };

  const createCourse = async () => {
    if (!newCourseTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await apiFetch(
        `/courses/?title=${encodeURIComponent(newCourseTitle.trim())}&description=${encodeURIComponent(newCourseDescription.trim())}`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error('Could not create the course');
      const course: Course = await res.json();
      setNewCourseTitle('');
      setNewCourseDescription('');
      setPicker((p) => ({ ...p, courses: [...p.courses, course] }));
      await selectCourse(course.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the course');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-6">Loading courses…</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold px-6 pt-6">Lesson editor</h1>
      <p className="px-6 text-gray-600 text-sm">
        Pick a lesson to edit it. Saving replaces the lesson's whole
        content — visualizations are kept as-is.
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
            className="mt-1 px-3 py-2 border border-gray-300 rounded-md bg-white min-w-52"
          >
            <option value="">Select a course…</option>
            {picker.courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm font-medium text-gray-700">
          Chapter
          <select
            value={picker.chapterId ?? ''}
            onChange={(e) => selectChapter(e.target.value ? Number(e.target.value) : null)}
            disabled={!picker.courseId}
            className="mt-1 px-3 py-2 border border-gray-300 rounded-md bg-white min-w-52 disabled:opacity-50"
          >
            <option value="">Select a chapter…</option>
            {picker.chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>{ch.title}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm font-medium text-gray-700">
          Lesson
          <select
            value={picker.lessonId ?? ''}
            onChange={(e) => selectLesson(e.target.value ? Number(e.target.value) : null)}
            disabled={!picker.chapterId}
            className="mt-1 px-3 py-2 border border-gray-300 rounded-md bg-white min-w-52 disabled:opacity-50"
          >
            <option value="">Select a lesson…</option>
            {picker.lessons.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </label>
      </div>

      {picker.chapterId !== null && (
        <div className="px-6 pb-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            placeholder="New lesson title"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <button
            onClick={createLesson}
            disabled={creating || !newLessonTitle.trim()}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm disabled:opacity-50"
          >
            + New lesson in this chapter
          </button>
        </div>
      )}

      {picker.courseId !== null && (
        <div className="px-6 pb-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            placeholder="New chapter title"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <button
            onClick={createChapter}
            disabled={creating || !newChapterTitle.trim()}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm disabled:opacity-50"
          >
            + New chapter in this course
          </button>
        </div>
      )}

      <div className="px-6 pb-2 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={newCourseTitle}
          onChange={(e) => setNewCourseTitle(e.target.value)}
          placeholder="New course title"
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          value={newCourseDescription}
          onChange={(e) => setNewCourseDescription(e.target.value)}
          placeholder="Description (optional)"
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <button
          onClick={createCourse}
          disabled={creating || !newCourseTitle.trim()}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm disabled:opacity-50"
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
        <div className="mx-6 my-4 p-10 bg-gray-50 rounded-lg text-center text-gray-500">
          Select a lesson above, or create a new one, to start editing.
        </div>
      )}
    </div>
  );
};

export default EditorSaveWrapper;
