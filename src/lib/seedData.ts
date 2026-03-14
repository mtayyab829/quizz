import { collection, addDoc, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

const courses = [
  {
    title: 'Full Stack Engineering',
    description: 'A comprehensive path to becoming a professional full stack developer.',
    modulesCount: 2,
    studentsCount: 150,
    status: 'active',
    icon: 'Code',
    color: 'blue-500'
  },
  {
    title: 'Data Science Career Track',
    description: 'Master data analysis, visualization, and machine learning.',
    modulesCount: 1,
    studentsCount: 95,
    status: 'active',
    icon: 'BarChart',
    color: 'emerald-500'
  }
];

const modules = [
  {
    courseTitle: 'Full Stack Engineering',
    title: 'Web Development Fundamentals',
    description: 'Master the basics of HTML, CSS, and JavaScript.',
    quizzesCount: 1,
    studentsCount: 120,
    engagement: 92,
    status: 'active',
    icon: 'terminal',
    color: 'blue-500'
  },
  {
    courseTitle: 'Full Stack Engineering',
    title: 'UI/UX Design Principles',
    description: 'Design beautiful and functional user interfaces.',
    quizzesCount: 0,
    studentsCount: 64,
    engagement: 85,
    status: 'active',
    icon: 'shield-lock',
    color: 'purple-500'
  },
  {
    courseTitle: 'Data Science Career Track',
    title: 'Data Analysis with Python',
    description: 'Learn how to analyze data and build predictive models.',
    quizzesCount: 1,
    studentsCount: 85,
    engagement: 78,
    status: 'active',
    icon: 'database',
    color: 'emerald-500'
  }
];

const quizzes = [
  {
    moduleTitle: 'Web Development Fundamentals',
    title: 'HTML & CSS Basics',
    description: 'Test your knowledge of semantic HTML and CSS layouts.',
    questionsCount: 3,
    durationMinutes: 10,
    difficulty: 'beginner',
    status: 'active',
    questions: [
      {
        type: 'multiple-choice',
        text: 'What does HTML stand for?',
        options: [
          'Hyper Text Markup Language',
          'High Tech Modern Language',
          'Hyper Transfer Markup Language',
          'Home Tool Markup Language'
        ],
        correctAnswer: 0,
        points: 10,
        explanation: 'HTML stands for Hyper Text Markup Language.'
      },
      {
        type: 'multiple-choice',
        text: 'Which CSS property is used to change the text color of an element?',
        options: [
          'font-color',
          'text-color',
          'color',
          'background-color'
        ],
        correctAnswer: 2,
        points: 10,
        explanation: 'The "color" property is used to change the text color.'
      },
      {
        type: 'true-false',
        text: 'The <br> tag is used for a line break.',
        correctAnswer: 'true',
        points: 5,
        explanation: 'Correct! <br> is a self-closing tag for line breaks.'
      }
    ]
  },
  {
    moduleTitle: 'Data Analysis with Python',
    title: 'Introduction to Python',
    description: 'Basic syntax and data structures in Python.',
    questionsCount: 2,
    durationMinutes: 15,
    difficulty: 'beginner',
    status: 'active',
    questions: [
      {
        type: 'multiple-choice',
        text: 'Which of the following is a Python list?',
        options: [
          '(1, 2, 3)',
          '[1, 2, 3]',
          '{1, 2, 3}',
          '<1, 2, 3>'
        ],
        correctAnswer: 1,
        points: 10,
        explanation: 'Lists in Python are defined using square brackets [].'
      },
      {
        type: 'short-answer',
        text: 'What keyword is used to define a function in Python?',
        correctAnswerText: 'def',
        points: 10,
        explanation: 'The "def" keyword is used to define functions.'
      }
    ]
  }
];

export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Check if we already have courses to avoid duplicates
    const coursesSnap = await getDocs(collection(db, 'courses'));
    if (!coursesSnap.empty) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    const courseIds: Record<string, string> = {};
    const moduleIds: Record<string, string> = {};

    // Seed Courses
    for (const course of courses) {
      const docRef = await addDoc(collection(db, 'courses'), {
        ...course,
        createdBy: 'system',
        createdAt: new Date().toISOString()
      });
      courseIds[course.title] = docRef.id;
      console.log(`Added course: ${course.title}`);
    }

    // Seed Modules
    for (const mod of modules) {
      const { courseTitle, ...modData } = mod;
      const courseId = courseIds[courseTitle];
      
      if (courseId) {
        const docRef = await addDoc(collection(db, 'modules'), {
          ...modData,
          courseId,
          createdBy: 'system',
          createdAt: new Date().toISOString()
        });
        moduleIds[mod.title] = docRef.id;
        console.log(`Added module: ${mod.title}`);
      }
    }

    // Seed Quizzes
    for (const quiz of quizzes) {
      const { moduleTitle, ...quizData } = quiz;
      const moduleId = moduleIds[moduleTitle];
      
      if (moduleId) {
        await addDoc(collection(db, 'quizzes'), {
          ...quizData,
          moduleId,
          createdBy: 'system',
          createdAt: new Date().toISOString()
        });
        console.log(`Added quiz: ${quiz.title}`);
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
