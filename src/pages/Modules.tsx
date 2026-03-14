import React, { useEffect, useState } from 'react';
import { Header } from '../components/Layout';
import { 
  Plus, 
  Terminal, 
  Database, 
  Shield, 
  Cloud,
  MoreHorizontal,
  ChevronRight,
  Edit,
  Loader2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Users,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, onSnapshot, query, orderBy, addDoc, where, limit, getDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Module, Course } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Link, useParams, useNavigate } from 'react-router-dom';

const iconMap: Record<string, any> = {
  'terminal': Terminal,
  'database': Database,
  'shield-lock': Shield,
  'cloud': Cloud
};

export const ModulesPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!courseId) {
      navigate('/courses');
      return;
    }

    // Fetch course details
    const fetchCourse = async () => {
      const docRef = doc(db, 'courses', courseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCourse({ id: docSnap.id, ...docSnap.data() } as Course);
      }
    };
    fetchCourse();

    const q = isAdmin 
      ? query(collection(db, 'modules'), where('courseId', '==', courseId), orderBy('createdAt', 'desc'))
      : query(collection(db, 'modules'), where('courseId', '==', courseId), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const modulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Module[];
      setModules(modulesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'modules');
    });

    return () => unsubscribe();
  }, [isAdmin, courseId, navigate]);

  const handleCreateModule = async () => {
    if (!isAdmin || !courseId) return;
    
    try {
      await addDoc(collection(db, 'modules'), {
        courseId,
        title: 'New Module',
        description: 'Description for the new module',
        icon: 'terminal',
        color: 'primary',
        status: 'draft',
        quizzesCount: 0,
        studentsCount: 0,
        engagement: 0,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'modules');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Header title={course?.title || "Modules"} />
      
      <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium mb-4"
          >
            <ArrowLeft size={18} /> Back to Courses
          </button>
          <h1 className="text-3xl font-black tracking-tight mb-2">{course?.title} Modules</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isAdmin ? "Manage and organize modules for this course" : "Choose a module to continue your progress"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} isAdmin={isAdmin} />
          ))}
          
          {isAdmin && (
            <div 
              onClick={handleCreateModule}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
            >
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="text-primary" size={32} />
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Create New Module</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add a new module to this course</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ModuleCard = ({ module, isAdmin }: any) => {
  const Icon = iconMap[module.icon] || Terminal;
  const isDraft = module.status === 'draft';
  const isArchived = module.status === 'archived';
  const isActive = module.status === 'active';
  const [firstQuizId, setFirstQuizId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) return;
    const q = query(collection(db, 'quizzes'), where('moduleId', '==', module.id), where('status', '==', 'active'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setFirstQuizId(snapshot.docs[0].id);
      }
    });
    return () => unsubscribe();
  }, [module.id, isAdmin]);

  const statusColors = {
    draft: "bg-slate-500/10 text-slate-500 border-slate-200",
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    archived: "bg-rose-500/10 text-rose-600 border-rose-200"
  };

  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
    rose: "text-rose-600 bg-rose-50 border-rose-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-200",
    violet: "text-violet-600 bg-violet-50 border-violet-200"
  };

  const moduleColorClass = colorMap[module.color] || colorMap.primary;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all group relative flex flex-col h-full">
      <div className={cn("h-40 relative flex items-center justify-center overflow-hidden", moduleColorClass.split(' ')[1])}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-current via-transparent to-transparent" />
        <Icon className={cn("text-6xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500", moduleColorClass.split(' ')[0])} size={64} />
        
        <div className="absolute top-6 left-6 flex gap-2">
          <div className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md",
            statusColors[module.status as keyof typeof statusColors]
          )}>
            {module.status}
          </div>
        </div>

        <div className="absolute top-6 right-6">
          <div className="px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
            <BookOpen size={12} className="text-primary" />
            <span>{module.quizzesCount || 0} Quizzes</span>
          </div>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-xl font-black leading-tight tracking-tight mb-2 group-hover:text-primary transition-colors">{module.title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">{module.description}</p>
        </div>
        
        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="size-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{module.studentsCount || 0} Enrolled</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-500">
              <Zap size={12} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest">{module.engagement}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {isAdmin ? (
              <>
                <Link 
                  to={`/modules/${module.id}`}
                  className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest text-center hover:opacity-90 transition-all"
                >
                  Manage
                </Link>
                <Link 
                  to={`/quiz-builder?moduleId=${module.id}`}
                  className="p-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary/20 transition-all"
                  title="Add Quiz"
                >
                  <Plus size={20} />
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to={`/modules/${module.id}`}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Details
                </Link>
                <Link 
                  to={firstQuizId ? `/active-quiz/${firstQuizId}` : '#'} 
                  className={cn(
                    "flex-[1.5] py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                    (!firstQuizId || isDraft) && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  Start Learning
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
