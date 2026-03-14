import { User, Module, Quiz, QuizResult } from './types';

export const MOCK_USERS: User[] = [
  {
    uid: '1',
    displayName: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    role: 'admin',
    createdAt: '2023-10-12',
    photoURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDv_JRbyQdd1Kzm7LPbxqs2S6_Gkw2GBcL8dKYSWLItKIHxhaVBzSp4lnWtkJWS7NdXZo5-NdRid4u4U8eOdbKw8J5H98IdwUEFAPQfSr1KT0-uVQ9cygPjdDtjd-cQeYYadImqaJWw2OmelUZ2KrxKLlAySIZppgjCwRJv5IUx2qT5b4w5BmBhKz_rSH3_LZnlwNBaIh_-r9a0Q158bjsCjwsjfukmUyRUlYpxSb3s6VQu0VpUCHtJV3-fh0leZrKxZ_yaPx-jeEQ',
    totalXP: 1200
  },
  {
    uid: '2',
    displayName: 'Sarah Connor',
    email: 's.connor@edu.org',
    role: 'student',
    createdAt: '2023-11-04',
    totalXP: 850
  },
  {
    uid: '3',
    displayName: 'Mike Knight',
    email: 'mike.k@student.net',
    role: 'student',
    createdAt: '2023-12-20',
    totalXP: 450
  }
];

export const MOCK_MODULES: Module[] = [
  {
    id: 'm1',
    courseId: 'c1',
    title: 'Web Development Fundamentals',
    description: 'Master HTML, CSS, and basic JavaScript through interactive challenges.',
    quizzesCount: 12,
    studentsCount: 1240,
    engagement: 85,
    status: 'active',
    icon: 'terminal',
    color: 'primary'
  },
  {
    id: 'm2',
    courseId: 'c1',
    title: 'Data Science Essentials',
    description: 'Introductory concepts in Python, Pandas, and data visualization techniques.',
    quizzesCount: 8,
    studentsCount: 856,
    engagement: 62,
    status: 'active',
    icon: 'database',
    color: 'purple-500'
  },
  {
    id: 'm3',
    courseId: 'c2',
    title: 'Cybersecurity Advanced',
    description: 'Network security, ethical hacking, and advanced threat detection.',
    quizzesCount: 4,
    studentsCount: 0,
    engagement: 45,
    status: 'draft',
    icon: 'shield-lock',
    color: 'amber-500'
  }
];

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 'q1',
    title: 'HTML Semantic Structure',
    description: 'Test your knowledge of semantic HTML5 tags.',
    moduleId: 'm1',
    questionsCount: 15,
    durationMinutes: 20,
    difficulty: 'intermediate',
    avgScore: 88,
    status: 'active'
  },
  {
    id: 'q2',
    title: 'Advanced CSS Selectors',
    description: 'Deep dive into complex CSS selection patterns.',
    moduleId: 'm1',
    questionsCount: 10,
    durationMinutes: 15,
    difficulty: 'advanced',
    avgScore: 76,
    status: 'active'
  }
];
