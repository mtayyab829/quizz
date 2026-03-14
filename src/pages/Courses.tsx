import React, { useEffect, useState } from 'react';
import { Header } from '../components/Layout';
import { 
  Plus, 
  BookOpen,
  MoreHorizontal,
  ChevronRight,
  Edit,
  Loader2,
  ArrowRight,
  Code,
  BarChart,
  Palette,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, onSnapshot, query, orderBy, addDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Course } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const iconMap: Record<string, any> = {
  'Code': Code,
  'BarChart': BarChart,
  'Palette': Palette
};

export const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const q = isAdmin 
      ? query(collection(db, 'courses'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'courses'), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      setCourses(coursesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courses');
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleCreateCourse = async () => {
    if (!isAdmin) return;
    
    try {
      await addDoc(collection(db, 'courses'), {
        title: 'New Course',
        description: 'Description for the new course',
        icon: 'Code',
        color: 'blue-500',
        status: 'draft',
        modulesCount: 0,
        studentsCount: 0,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'courses');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Header title={isAdmin ? "Courses Management" : "Explore Courses"} />
      
      <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">{isAdmin ? "Courses Management" : "Explore Courses"}</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isAdmin ? "Manage and organize your learning curriculum" : "Choose a course and start your learning journey"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} isAdmin={isAdmin} />
          ))}
          
          {isAdmin && (
            <div 
              onClick={handleCreateCourse}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
            >
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="text-primary" size={32} />
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Create New Course</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add a new learning path</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CourseCard = ({ course, isAdmin }: any) => {
  const Icon = iconMap[course.icon] || BookOpen;
  const isDraft = course.status === 'draft';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all group">
      <div className={cn("h-32 relative flex items-center justify-center", `bg-${course.color}/10`)}>
        <Icon className={cn("text-5xl opacity-40 group-hover:scale-110 transition-transform", `text-${course.color}`)} size={48} />
        {isAdmin && (
          <div className={cn(
            "absolute top-4 right-4 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
            isDraft ? "bg-slate-500/10 text-slate-500" : "bg-green-500/10 text-green-600"
          )}>
            {course.status}
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-1">{course.title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">{course.description}</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="leading-tight">
              <p className="text-xs text-slate-400 uppercase font-semibold">Modules</p>
              <p className="font-bold text-sm">{course.modulesCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="leading-tight">
              <p className="text-xs text-slate-400 uppercase font-semibold">Students</p>
              <p className="font-bold text-sm">{course.studentsCount}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        {isAdmin ? (
          <Link 
            to={`/courses/${course.id}`} 
            className="text-slate-500 hover:text-primary transition-colors flex items-center gap-1 text-sm font-bold"
          >
            <Edit size={16} /> Edit Course
          </Link>
        ) : (
          <div />
        )}
        <Link 
          to={`/courses/${course.id}/modules`} 
          className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
        >
          View Modules
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};
