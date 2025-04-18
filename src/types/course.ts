// Export all interfaces individually
export interface ContentBase {
    type: 'markdown' | 'visualization' | 'video' | 'question';
  }
  
  export interface MarkdownContent extends ContentBase {
    type: 'markdown';
    data: {
      text: string;
      format: 'plain' | 'latex';
    };
  }
  
  export interface VisualizationContent extends ContentBase {
    type: 'visualization';
    data: {
      engine: 'plotly' | 'mathbox' | 'custom';
      config: any;
    };
  }
  
  export interface VideoContent extends ContentBase {
    type: 'video';
    data: {
      url: string;
      caption?: string;
      duration?: number;
    };
  }
  
  export interface QuestionContent extends ContentBase {
    type: 'question';
    data: {
      format: 'multiple_choice' | 'short_answer';
      question: string;
      options?: string[];
      correct_answer: number | string;
      explanation?: string;
    };
  }
  
  // Export the union type
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
    tags: string[]
    image: string;
    chapters: Chapter[];
  }