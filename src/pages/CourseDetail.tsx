import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Layout';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Users,
  Layout,
  Code,
  BarChart,
  Palette,
  Eye,
  EyeOff,
  Plus,
  Terminal,
  Database,
  Shield,
  Cloud
} from 'lucide-react';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Course, Module } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const iconOptions = [
  { id: 'Code', icon: Code, label: 'Code' },
  { id: 'BarChart', icon: BarChart, label: 'Analytics' },
  { id: 'Palette', icon: Palette, label: 'Design' },
  { id: 'BookOpen', icon: BookOpen, label: 'Education' }
];

const colorOptions = [
  { id: 'blue-500', label: 'Blue', class: 'bg-blue-500' },
  { id: 'emerald-500', label: 'Emerald', class: 'bg-emerald-500' },
  { id: 'violet-500', label: 'Violet', class: 'bg-violet-500' },
  { id: 'amber-500', label: 'Amber', class: 'bg-amber-500' },
  { id: 'rose-500', label: 'Rose', class: 'bg-rose-500' }
];

export const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Code',
    color: 'blue-500',
    status: 'draft' as 'draft' | 'active' | 'archived'
  });

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.id ? { id: docSnap.id, ...docSnap.data() } as Course : null;
          if (data) {
            setCourse(data);
            setFormData({
              title: data.title,
              description: data.description,
              icon: data.icon,
              color: data.color,
              status: data.status
            });
          }
        } else {
          setError('Course not found');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `courses/${courseId}`);
        setError('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();

    // Fetch modules for this course
    if (courseId) {
      const q = query(
        collection(db, 'modules'), 
        where('courseId', '==', courseId),
        orderBy('createdAt', 'asc')
      );
      const unsubscribeModules = onSnapshot(q, (snapshot) => {
        const modulesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Module[];
        setModules(modulesData);
      });
      return () => unsubscribeModules();
    }
  }, [courseId]);

  const handleSave = async () => {
    if (!courseId || !isAdmin) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const docRef = doc(db, 'courses', courseId);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `courses/${courseId}`);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!courseId || !isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this course? All modules within this course will need to be reassigned or deleted manually.')) return;

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      navigate('/courses');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
      setError('Failed to delete course');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center">
        <div className="bg-rose-50 dark:bg-rose-500/10 p-8 rounded-2xl border border-rose-100 dark:border-rose-500/20">
          <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/courses')}
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Back to Courses
        </button>
        
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors font-bold"
            >
              <Trash2 size={18} /> Delete Course
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <p className="font-bold">Course updated successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Layout className="text-primary" size={24} /> General Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Course Title</label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                  placeholder="e.g., Full Stack Development"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!isAdmin}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 resize-none"
                  placeholder="Describe what students will learn in this course..."
                />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Palette className="text-primary" size={24} /> Appearance & Branding
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Select Icon</label>
                <div className="grid grid-cols-4 gap-3">
                  {iconOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, icon: opt.id })}
                      disabled={!isAdmin}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                        formData.icon === opt.id 
                          ? "border-primary bg-primary/5 text-primary" 
                          : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                      )}
                    >
                      <opt.icon size={24} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Theme Color</label>
                <div className="grid grid-cols-5 gap-3">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, color: opt.id })}
                      disabled={!isAdmin}
                      className={cn(
                        "size-10 rounded-full transition-all border-4",
                        opt.class,
                        formData.color === opt.id ? "border-white dark:border-slate-900 scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Modules List */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="text-primary" size={24} /> Course Modules
              </h3>
              {isAdmin && (
                <button 
                  onClick={() => navigate(`/courses/${courseId}/modules`)}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Manage Modules
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {modules.length > 0 ? modules.map((mod) => (
                <div key={mod.id} className="group p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all bg-white dark:bg-slate-900 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className={cn("size-16 rounded-2xl flex items-center justify-center shrink-0", `bg-${mod.color || 'blue-500'}/10`)}>
                        {(() => {
                          const iconMap: any = { Terminal, Database, Shield, Cloud };
                          const Icon = iconMap[mod.icon] || Terminal;
                          return <Icon className={cn(`text-${mod.color || 'blue-500'}`)} size={32} />;
                        })()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-black group-hover:text-primary transition-colors">{mod.title}</h4>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            mod.status === 'active' ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" :
                            mod.status === 'draft' ? "bg-slate-500/10 text-slate-500 border-slate-200" :
                            "bg-rose-500/10 text-rose-600 border-rose-200"
                          )}>
                            {mod.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{mod.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <BookOpen size={12} />
                            <span>{mod.quizzesCount || 0} Quizzes</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Users size={12} />
                            <span>{mod.studentsCount || 0} Students</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isAdmin && (
                        <>
                          <Link 
                            to={`/quiz-builder?moduleId=${mod.id}`}
                            className="p-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary/20 transition-all"
                            title="Add Quiz"
                          >
                            <Plus size={20} />
                          </Link>
                          <Link 
                            to={`/modules/${mod.id}`}
                            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                          >
                            Manage
                          </Link>
                        </>
                      )}
                      {!isAdmin && (
                        <Link 
                          to={`/modules/${mod.id}`}
                          className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                        >
                          View Module
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  <BookOpen className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-slate-500 font-medium">No modules added to this course yet.</p>
                  {isAdmin && (
                    <button 
                      onClick={() => navigate(`/courses/${courseId}/modules`)}
                      className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-bold text-sm"
                    >
                      Add First Module
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold mb-4">Course Status</h3>
            <div className="space-y-2">
              {[
                { id: 'draft', label: 'Draft', icon: Layout, color: 'text-slate-500' },
                { id: 'active', label: 'Active', icon: Eye, color: 'text-emerald-500' },
                { id: 'archived', label: 'Archived', icon: EyeOff, color: 'text-rose-500' }
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() => setFormData({ ...formData, status: status.id as any })}
                  disabled={!isAdmin}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                    formData.status === status.id 
                      ? "bg-slate-50 dark:bg-slate-800 border-primary/50 text-primary font-bold" 
                      : "border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <status.icon size={18} className={status.color} />
                  {status.label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold mb-4">Course Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-blue-500" size={18} />
                  <span className="text-sm font-medium">Modules</span>
                </div>
                <span className="font-bold">{course?.modulesCount || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Users className="text-emerald-500" size={18} />
                  <span className="text-sm font-medium">Students</span>
                </div>
                <span className="font-bold">{course?.studentsCount || 0}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
