export interface ContentBase {
  type: 'markdown' | 'visualization' | 'video' | 'question';
}

export interface MarkdownContent extends ContentBase {
  type: 'markdown';
  data: {
      text: string;
      format: 'plain' | 'latex';
  };
  isCurrent: boolean;
}

export interface VisualizationContent extends ContentBase {
  type: 'visualization';
  data: {
      engine: 'plotly' | 'mathbox' | 'custom';
      config: any;
  };
}

export interface VisualizationComponentProps {
  content: VisualizationContent;
  isCurrent?: boolean;
  onContinue?: () => void;
}

export interface VideoContent extends ContentBase {
  type: 'video';
  data: {
      url: string;
      caption?: string;
      duration?: number;
  };
}

export interface VideoComponentProps {
    content: VideoContent;
    isCurrent?: boolean;
    onContinue?: () => void;
}

export interface QuestionContent extends ContentBase {
  type: 'question';
  data: {
      format: 'multiple_choice' | 'short_answer';
      question: string;
      options?: string[];
      correct_answer: number | string;
      explanation?: string;
      visualization?: boolean; // Add this line
  };
  isCurrent: boolean;
}
export type LessonContent =
  | MarkdownContent
  | VisualizationContent
  | VideoContent
  | QuestionContent;

export interface Lesson {
  id: number;
  course_id: number;
  unit_id: number;
  title: string;
  description: string;
  sort_order?: number;
  /** True when the logged-in student has completed this lesson. */
  completed?: boolean;
  contents?: LessonContent[];
}

export interface Unit {
  id: number;
  course_id: number;
  title: string;
  description: string;
  image: string;
  sort_order?: number;
  lesson_count?: number;
  /** True when the requester cannot open this unit yet. */
  locked?: boolean;
  lessons: Lesson[];
}

export interface CourseStats {
  stars: number;
  views: number;
  course_completions: number;
  lessons_completed: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  tags: string[];
  image: string;
  image_url?: string | null;
  owner_id?: number;
  visibility?: 'private' | 'published';
  level?: string | null;
  estimated_time_minutes?: number | null;
  prerequisites?: string | null;
  // The list endpoint returns counts, not nested rows.
  unit_count?: number;
  lesson_count?: number;
  units?: Unit[];
  // Aggregate stats, present on the list and detail endpoints.
  stars?: number;
  views?: number;
  course_completions?: number;
  lessons_completed?: number;
  stats?: CourseStats;
  created_at?: string;
}

/** One unit's progress for the logged-in student. */
export interface UnitProgress {
  unit_id: number;
  complete: boolean;
  locked: boolean;
  exam_status?: string | null;
}

export interface CourseProgress {
  completed_lessons: number;
  total_lessons: number;
  progress: number;
  units: UnitProgress[];
  final_exam_status?: string | null;
  course_complete: boolean;
}

export type ExamStatus = 'not started' | 'in progress' | 'passed' | 'failed';

export interface ExamSummary {
  id: number;
  unit_id?: number | null;
  is_final: boolean;
  title: string;
  pass_mark: number;
  locked: boolean;
  status: ExamStatus | string;
}

export interface ExamQuestion {
  id: number;
  format: 'multiple_choice' | 'short_answer';
  question: string;
  options?: string[];
  explanation?: string;
}

export interface ExamDetail {
  id: number;
  unit_id?: number | null;
  is_final: boolean;
  title: string;
  pass_mark: number;
  locked: boolean;
  status: ExamStatus | string;
  questions: ExamQuestion[];
}

export interface ExamAttempt {
  attempt_id?: number;
  id?: number;
  score: number;
  passed: boolean;
  total: number;
  created_at?: string;
}

export interface Comment {
  id: number;
  author_id: number;
  author_name: string;
  text: string;
  created_at: string;
}

export interface RosterUnitStatus {
  unit_id: number;
  title: string;
  complete: boolean;
  exam_status?: string | null;
}

export interface RosterExamStatus {
  exam_id: number;
  title: string;
  status: string;
  best_score?: number | null;
}

export interface RosterStudent {
  user_id: number;
  username: string;
  email: string;
  enrolled_at?: string | null;
  lessons_completed: number;
  total_lessons: number;
  progress: number;
  units: RosterUnitStatus[];
  exams: RosterExamStatus[];
  last_accessed?: string | null;
}

// Additional types for component props
export interface LessonComponentProps {
  content: LessonContent;
  index: number;
  isCurrent: boolean;
  userAnswer?: string | number | null;
  showError?: boolean;
  showExplanation?: boolean;
  isChecking?: boolean;
  onAnswerChange?: (index: number, value: string | number) => void;
  onCheckAnswer?: () => void;
  onTryAgain?: () => void;
  onContinue?: () => void;
  onShowExplanation?: () => void;
  onCompleteLesson?: () => void;
  isFinalQuestion?: boolean;
}

export interface LessonNavigationProps {
  currentIndex: number;
  totalContents: number;
  onPrevious: () => void;
  onContinue: () => void;
}

export interface LessonHeaderProps {
  course: Course;
  unit: Unit;
  lesson: Lesson;
}
