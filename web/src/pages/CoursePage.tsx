import { useParams, useNavigate, Link } from "react-router-dom";
import { API_BASE_URL, apiFetch } from '../api';
import { useAuth } from '../components/auth/AuthContext';
import type { Course, Unit, Lesson, CourseProgress, ExamSummary } from '../types/course';
import CommentsThread from '../components/course/CommentsThread';
import ExamTaker from '../components/course/ExamTaker';
import { useState, useEffect, useRef } from 'react';

type UnitWithLessons = Unit & { lessons: Lesson[] };

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<UnitWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({});
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [openExamId, setOpenExamId] = useState<number | null>(null);
  const [starred, setStarred] = useState(false);
  const [starMessage, setStarMessage] = useState('');
  const [starBusy, setStarBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [lockedMessage, setLockedMessage] = useState('');
  const viewRecordedRef = useRef(false);
  const enrolledRef = useRef(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      try {
        // Fetch course info. A private course returns 404 for non-owners.
        const resCourse = await apiFetch(`/courses/${courseId}`);
        if (!resCourse.ok) throw new Error("Course not found");
        const courseData: Course = await resCourse.json();
        setCourse(courseData);

        // Fetch units
        const resUnits = await apiFetch(`/courses/${courseId}/units/`);
        const unitsData: Unit[] = resUnits.ok ? await resUnits.json() : [];

        // For each unit, fetch its lessons
        const unitsWithLessons = await Promise.all(
          unitsData.map(async (unit) => {
            const resLessons = await apiFetch(`/units/${unit.id}/lessons/`);
            const lessons: Lesson[] = resLessons.ok ? await resLessons.json() : [];
            return { ...unit, lessons };
          })
        );
        // Keep the contract order: sort_order first, then id.
        unitsWithLessons.sort((a, b) => (a.sort_order ?? a.id) - (b.sort_order ?? b.id));
        setUnits(unitsWithLessons);
        // Open the first unit by default so the lessons are visible.
        if (unitsWithLessons.length > 0) {
          setExpandedUnits({ [unitsWithLessons[0].id]: true });
        }

        // Exams for the course (unit exams and the final exam).
        const resExams = await apiFetch(`/courses/${courseId}/exams`);
        if (resExams.ok) setExams(await resExams.json());

        // The logged-in student's own progress and star state.
        if (localStorage.getItem('token')) {
          const resProgress = await apiFetch(`/courses/${courseId}/progress`);
          if (resProgress.ok) setProgress(await resProgress.json());
          const resStar = await apiFetch(`/courses/${courseId}/star`);
          if (resStar.ok) setStarred((await resStar.json()).starred === true);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // Record one view per page load. The backend does not count the
  // owner's own views; this just reports the load.
  useEffect(() => {
    if (!courseId || viewRecordedRef.current) return;
    viewRecordedRef.current = true;
    fetch(`${API_BASE_URL}/courses/${courseId}/view`, { method: 'POST' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setCourse((prev) => (prev ? { ...prev, views: data.views } : prev));
        }
      })
      .catch(() => {});
  }, [courseId]);

  // Enroll the logged-in student, idempotently, so progress is tracked.
  useEffect(() => {
    if (!courseId || !isAuthenticated || enrolledRef.current) return;
    enrolledRef.current = true;
    apiFetch(`/courses/${courseId}/enroll`, { method: 'POST' }).catch(() => {});
  }, [courseId, isAuthenticated]);

  const refreshProgressAndExams = async () => {
    if (!courseId) return;
    const resProgress = await apiFetch(`/courses/${courseId}/progress`);
    if (resProgress.ok) setProgress(await resProgress.json());
    const resExams = await apiFetch(`/courses/${courseId}/exams`);
    if (resExams.ok) setExams(await resExams.json());
  };

  const toggleUnit = (unitId: number) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  const handleLessonClick = (unit: UnitWithLessons, lesson: Lesson) => {
    if (unit.locked) {
      setLockedMessage('Finish the previous unit first. Its lessons and its exam, if it has one, must be complete before this unit opens.');
      return;
    }
    navigate(`/courses/${courseId}/units/${unit.id}/lessons/${lesson.id}`);
  };

  const handleStar = async () => {
    if (!courseId || starred) return;
    setStarBusy(true);
    setStarMessage('');
    try {
      const res = await apiFetch(`/courses/${courseId}/star`, { method: 'POST' });
      if (res.status === 409) {
        setStarred(true);
        return;
      }
      if (res.status === 403) {
        setStarMessage('To star this course, finish a unit first and pass its exam if it has one.');
        return;
      }
      if (!res.ok) throw new Error('Could not star the course');
      setStarred(true);
      setCourse((prev) => (prev ? { ...prev, stars: (prev.stars ?? 0) + 1 } : prev));
    } catch (err) {
      setStarMessage(err instanceof Error ? err.message : 'Could not star the course');
    } finally {
      setStarBusy(false);
    }
  };

  const setVisibility = async (publish: boolean) => {
    if (!courseId) return;
    setPublishBusy(true);
    setPublishMessage('');
    try {
      const res = await apiFetch(
        `/courses/${courseId}/${publish ? 'publish' : 'unpublish'}`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error(publish ? 'Could not publish the course' : 'Could not unpublish the course');
      setCourse((prev) => (prev ? { ...prev, visibility: publish ? 'published' : 'private' } : prev));
    } catch (err) {
      setPublishMessage(err instanceof Error ? err.message : 'Could not change visibility');
    } finally {
      setPublishBusy(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!course) return <div className="p-6">Course not found</div>;

  const totalLessons = units.reduce((sum, u) => sum + u.lessons.length, 0);
  const isOwner = user?.id !== undefined && course.owner_id !== undefined && user.id === course.owner_id;
  const stars = course.stars ?? course.stats?.stars ?? 0;
  const views = course.views ?? course.stats?.views ?? 0;
  const courseCompletions = course.course_completions ?? course.stats?.course_completions ?? 0;
  const lessonsCompleted = course.lessons_completed ?? course.stats?.lessons_completed ?? 0;
  const finalExam = exams.find((e) => e.is_final);
  const unitExams = exams.filter((e) => !e.is_final);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <p className="font-mono text-xs tracking-widest uppercase text-pencil">
        Course · {units.length} units · {totalLessons} lessons
        {course.visibility === 'private' ? ' · Private' : ''}
      </p>
      <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">{course.title}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">{course.description}</p>

      {(course.level || course.estimated_time_minutes || course.prerequisites) && (
        <dl className="mt-4 max-w-2xl text-sm leading-relaxed">
          {course.level && (
            <div className="flex gap-2">
              <dt className="font-semibold">Level:</dt>
              <dd>{course.level}</dd>
            </div>
          )}
          {course.estimated_time_minutes !== undefined && course.estimated_time_minutes !== null && (
            <div className="flex gap-2">
              <dt className="font-semibold">Estimated time:</dt>
              <dd>{course.estimated_time_minutes} minutes</dd>
            </div>
          )}
          {course.prerequisites && (
            <div className="flex gap-2">
              <dt className="font-semibold">Prerequisites:</dt>
              <dd>{course.prerequisites}</dd>
            </div>
          )}
        </dl>
      )}

      <p className="mt-4 font-mono text-xs text-pencil">
        {stars} stars · {views} views · {courseCompletions} course completions · {lessonsCompleted} lessons completed
      </p>

      {course.tags && course.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {course.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 font-mono text-xs border border-rule rounded-sm">
              {tag}
            </span>
          ))}
        </div>
      )}

      {isAuthenticated && progress && (
        <div className="mt-6">
          <p className="text-sm">
            Your progress: {progress.completed_lessons} of {progress.total_lessons} lessons complete ({progress.progress}%).
            {progress.course_complete ? ' You have finished this course.' : ''}
          </p>
          <div className="mt-2 h-2 bg-rule overflow-hidden max-w-2xl">
            <div className="h-full bg-pencil" style={{ width: `${progress.progress}%` }} />
          </div>
        </div>
      )}

      {isAuthenticated && !starred && (
        <div className="mt-6">
          <button
            onClick={handleStar}
            disabled={starBusy}
            className="px-4 py-2 bg-paper hover:bg-gray-100 border border-rule rounded-sm text-sm font-medium disabled:opacity-50"
          >
            {starBusy ? 'Saving...' : `Star this course (${stars})`}
          </button>
          {starMessage && <p className="mt-2 text-sm">{starMessage}</p>}
        </div>
      )}
      {isAuthenticated && starred && (
        <p className="mt-6 text-sm">You starred this course. ({stars} stars)</p>
      )}

      {isOwner && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setVisibility(course.visibility !== 'published')}
            disabled={publishBusy}
            className="px-4 py-2 bg-pencil hover:bg-pencil-dark text-white text-sm font-medium rounded-sm disabled:opacity-50"
          >
            {publishBusy
              ? 'Saving...'
              : course.visibility === 'published' ? 'Unpublish' : 'Publish'}
          </button>
          <Link to="/editor" className="text-sm text-pencil hover:underline">
            Edit this course
          </Link>
          {publishMessage && <span className="text-sm text-red-600">{publishMessage}</span>}
        </div>
      )}

      <h2 className="mt-10 mb-2 font-display text-2xl font-bold">Syllabus</h2>
      {lockedMessage && (
        <p className="mb-3 text-sm border border-rule rounded-sm p-3 bg-paper">{lockedMessage}</p>
      )}
      <div className="border-t-2 border-ink">
        {units.map((unit, ui) => (
          <section key={unit.id} className="border-b border-rule">
            <button
              className="w-full text-left flex items-baseline gap-3 py-4 hover:bg-gray-50 transition-colors"
              onClick={() => toggleUnit(unit.id)}
              aria-expanded={!!expandedUnits[unit.id]}
            >
              <span className="font-mono text-sm text-pencil">
                {String(ui + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 font-display text-xl font-semibold leading-snug">
                {unit.title}
                {unit.locked ? ' · Locked' : ''}
              </span>
              <span className="font-mono text-xs">
                {unit.lessons.length} lessons {expandedUnits[unit.id] ? '−' : '+'}
              </span>
            </button>
            {expandedUnits[unit.id] && (
              <div className="pb-4 pl-10">
                {unit.description && (
                  <p className="text-sm leading-relaxed mb-3">{unit.description}</p>
                )}
                {unit.locked && (
                  <p className="text-sm mb-3">
                    This unit is locked. Finish the previous unit first.
                  </p>
                )}
                <ol>
                  {unit.lessons.map((lesson, li) => {
                    const completed = lesson.completed === true;
                    return (
                      <li key={lesson.id}>
                        <button
                          className={`w-full text-left grid grid-cols-[2rem_1fr_auto] items-baseline gap-2 py-2.5 border-t border-rule transition-colors ${unit.locked ? 'text-gray-400' : 'hover:bg-gray-50'}`}
                          onClick={() => handleLessonClick(unit, lesson)}
                          disabled={unit.locked}
                          aria-disabled={unit.locked}
                        >
                          <span className="font-mono text-xs">{ui + 1}.{li + 1}</span>
                          <span>
                            <span className="block font-medium leading-snug">{lesson.title}</span>
                            {lesson.description && (
                              <span className="block text-sm">{lesson.description}</span>
                            )}
                          </span>
                          <span className="font-mono text-xs text-pencil">
                            {completed ? 'Done ✓' : unit.locked ? 'Locked' : 'Start →'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </section>
        ))}
        {units.length === 0 && (
          <p className="py-6 text-sm">This course has no units yet.</p>
        )}
      </div>

      {exams.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 font-display text-2xl font-bold">Exams</h2>
          <p className="text-sm leading-relaxed">
            Exams are optional. Pass mark is shown per exam, and you can try
            again as many times as you like.
          </p>
          <div className="mt-4 border-t border-rule">
            {unitExams.map((exam) => (
              <ExamRow
                key={exam.id}
                exam={exam}
                open={openExamId === exam.id}
                onToggle={() => setOpenExamId(openExamId === exam.id ? null : exam.id)}
                onAttemptDone={refreshProgressAndExams}
              />
            ))}
            {finalExam && (
              <ExamRow
                exam={finalExam}
                open={openExamId === finalExam.id}
                onToggle={() => setOpenExamId(openExamId === finalExam.id ? null : finalExam.id)}
                onAttemptDone={refreshProgressAndExams}
              />
            )}
          </div>
        </section>
      )}

      <CommentsThread kind="course" targetId={course.id} isCourseOwner={isOwner} />
    </div>
  );
};

const ExamRow = ({
  exam,
  open,
  onToggle,
  onAttemptDone,
}: {
  exam: ExamSummary;
  open: boolean;
  onToggle: () => void;
  onAttemptDone: () => void;
}) => {
  const statusLabel = exam.status === 'passed'
    ? 'Passed'
    : exam.status === 'failed'
      ? 'Failed'
      : exam.status === 'in progress'
        ? 'In progress'
        : 'Not started';
  return (
    <div className="py-4 border-b border-rule">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-medium">
          {exam.is_final ? 'Final exam: ' : ''}{exam.title}
          {exam.locked ? ' · Locked' : ''}
        </p>
        <p className="font-mono text-xs">
          Pass mark {exam.pass_mark}% · {statusLabel}
        </p>
      </div>
      {exam.locked ? (
        <p className="mt-1 text-sm">
          This exam unlocks once the lessons before it are complete.
        </p>
      ) : (
        <>
          <button
            onClick={onToggle}
            className="mt-2 text-sm text-pencil hover:underline"
          >
            {open ? 'Close exam' : 'Take exam'}
          </button>
          {open && (
            <ExamTaker
              examId={exam.id}
              title={exam.title}
              passMark={exam.pass_mark}
              onAttemptDone={onAttemptDone}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CoursePage;
