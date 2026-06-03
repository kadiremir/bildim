export type Hint =
  | { type: 'text'; content: string }
  | { type: 'image'; uri: string; caption?: string };

export interface QuizItem {
  id: string;
  answer: string; // lowercase Turkish name
  hints: Hint[];
}
