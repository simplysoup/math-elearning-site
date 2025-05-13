export type ContentBlockType = 'markdown' | 'multiple_choice' | 'short_answer' | 'code';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  data: any;
}

export interface EditorProps {
  content?: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
  answer?: string;
  code?: string;
  language?: string;
  onChange: (data: any) => void;
}