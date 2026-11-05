export type ContentBlockType =
  | 'markdown'
  | 'multiple_choice'
  | 'short_answer'
  | 'code'
  // Read-only in the editor: an interactive visualization block is
  // kept as-is on save, never edited or re-created here.
  | 'visualization';

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
  explanation?: string;
  code?: string;
  language?: string;
  onChange: (data: any) => void;
}