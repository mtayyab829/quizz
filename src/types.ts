export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'student';
  photoURL?: string;
  createdAt: string;
  totalXP: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modulesCount: number;
  studentsCount: number;
  status: 'active' | 'draft' | 'archived';
  icon: string;
  color: string;
  createdBy: string;
  createdAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  questionsCount: number;
  durationMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  avgScore?: number;
  status: 'active' | 'draft' | 'archived';
  questions?: Question[];
  passingScore?: number;
  shuffleQuestions?: boolean;
  allowReview?: boolean;
  maxAttempts?: number;
  tags?: string[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  quizzesCount: number;
  studentsCount: number;
  engagement: number;
  status: 'active' | 'draft' | 'archived';
  icon: string;
  color: string;
  materials?: ModuleMaterial[];
}

export interface ModuleMaterial {
  id: string;
  title: string;
  type: 'article' | 'video' | 'pdf' | 'link' | 'notes';
  url?: string;
  description?: string;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'fill-in-the-blank' | 'verbal' | 'non-verbal' | 'multi-select' | 'matching' | 'ordering';
  text: string;
  imageUrl?: string;
  options?: string[];
  optionImages?: string[];
  correctAnswer?: string | number | number[];
  correctAnswerText?: string;
  points: number;
  explanation?: string;
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
  tags?: string[];
  matchingPairs?: { left: string; right: string }[];
  orderedItems?: string[];
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  moduleId: string;
  studentId: string;
  studentName: string;
  score: number;
  earnedPoints: number;
  totalPoints: number;
  totalQuestions: number;
  completedAt: string;
  status: 'passed' | 'failed';
  xpEarned: number;
  answers?: Record<number, any>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
  requirement: {
    type: 'quiz_count' | 'score_count' | 'xp_total';
    value: number;
  };
}
