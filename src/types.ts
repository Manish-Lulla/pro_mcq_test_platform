export interface Question {
  id: number;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
    [key: string]: string;
  };
  answer: string;
}

export interface ContextGroup {
  context: string;
  questions: Question[];
}

export interface QuestionBank {
  General_Questions: Question[];
  Context_Based_Questions: ContextGroup[];
  Verbal_Questions: Question[];
  passage_based_questions: ContextGroup[];
}

export interface TestResult {
  id: string;
  userName: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
  timeTaken: number; // in seconds
  date: string;
}

export type TestType = 'verbal' | 'numerical';

export interface QuizSettings {
  userName: string;
  questionCount: number;
  duration: number | null; // in minutes, null for "No Duration"
  testType: TestType;
}
