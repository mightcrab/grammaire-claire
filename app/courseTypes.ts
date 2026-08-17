export type Level = "Foundation" | "A1" | "A2" | "B1" | "B2";

export type Example = { fr: string; en: string };

export type Exercise = {
  prompt: string;
  options: string[];
  answer: string;
  rationale: string;
};

export type Lesson = {
  id: string;
  level: Level;
  unit: string;
  title: string;
  summary: string;
  objective: string;
  rule: string;
  pattern?: string;
  examples: Example[];
  trap: string;
  exercise: Exercise;
  prerequisites: string[];
  tags: string[];
  sourceKeys: string[];
  sourceNote: string;
  recognitionOnly?: boolean;
};

export type CourseSource = {
  key: string;
  name: string;
  url: string;
  use: string;
};
