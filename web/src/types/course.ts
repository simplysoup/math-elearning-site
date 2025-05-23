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
  chapter_id: number;
  title: string;
  description: string;
  contents: LessonContent[];
}

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  description: string;
  image: string;
  lessons: Lesson[];
}

export interface Course {
  id: number;
  title: string;
  description: string;
  tags: string[];
  image: string;
  chapters: Chapter[];
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
  chapter: Chapter;
  lesson: Lesson;
}