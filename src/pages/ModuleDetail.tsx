import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Layout';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Loader2, 
  Terminal, 
  Database, 
  Shield, 
  Cloud,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Users,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  Copy,
  Archive,
  RefreshCw,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Module, Quiz, ModuleMaterial } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const iconOptions = [
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'database', icon: Database, label: 'Database' },
  { id: 'shield-lock', icon: Shield, label: 'Security' },
  { id: 'cloud', icon: Cloud, label: 'Cloud' }
];

const colorOptions = [
  { id: 'blue-500', label: 'Blue', class: 'bg-blue-500' },
  { id: 'emerald-500', label: 'Emerald', class: 'bg-emerald-500' },
  { id: 'purple-500', label: 'Purple', class: 'bg-purple-500' },
  { id: 'orange-500', label: 'Orange', class: 'bg-orange-500' },
  { id: 'rose-500', label: 'Rose', class: 'bg-rose-500' }
];

export const ModuleDetailPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [module, setModule] = useState<Module | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courseModules, setCourseModules] = useState<Module[]>([]);
  const [quizLoadError, setQuizLoadError] = useState<string | null>(null);
  const [quizRefreshKey, setQuizRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    avgScore: 0,
    passRate: 0,
    uniqueStudents: 0,
    engagementRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<ModuleMaterial[]>([]);
  const [newMaterial, setNewMaterial] = useState<ModuleMaterial>({
    id: '',
    title: '',
    type: 'article',
    url: '',
    description: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft' as 'active' | 'draft' | 'archived',
    icon: 'terminal',
    color: 'blue-500'
  });

  useEffect(() => {
    if (!moduleId) return;

    const fetchModule = async () => {
      try {
        const docRef = doc(db, 'modules', moduleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Module;
          setModule({ id: docSnap.id, ...data });
          setFormData({
            title: data.title,
            description: data.description,
            status: data.status,
            icon: data.icon || 'terminal',
            color: data.color || 'blue-500'
          });
          setMaterials(data.materials || []);
        } else {
          setError('Module not found');
        }
      } catch (err) {
        console.error('Error fetching module:', err);
        setError('Failed to load module details');
      } finally {
        setLoading(false);
      }
    };

    fetchModule();

    // Fetch related quizzes
    const q = query(collection(db, 'quizzes'), where('moduleId', '==', moduleId), orderBy('createdAt', 'desc'));
    const unsubscribeQuizzes = onSnapshot(q, (snapshot) => {
      const quizzesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quiz[];
      setQuizzes(quizzesData);
      setQuizLoadError(null);
    }, (err) => {
      console.error('Error fetching quizzes:', err);
      setQuizLoadError('Failed to load quizzes. Please retry.');
    });

    return () => unsubscribeQuizzes();
  }, [moduleId, quizRefreshKey]);

  useEffect(() => {
    if (!moduleId) return;
    const q = query(collection(db, 'results'), where('moduleId', '==', moduleId), orderBy('completedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => doc.data() as any);
      const totalAttempts = results.length;
      const avgScore = totalAttempts
        ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / totalAttempts)
        : 0;
      const passedCount = results.filter(r => r.status === 'passed').length;
      const passRate = totalAttempts ? Math.round((passedCount / totalAttempts) * 100) : 0;
      const uniqueStudents = new Set(results.map(r => r.studentId)).size;
      const studentsCount = module?.studentsCount || 0;
      const engagementRate = studentsCount > 0 ? Math.round((uniqueStudents / studentsCount) * 100) : 0;

      setStats({
        totalAttempts,
        avgScore,
        passRate,
        uniqueStudents,
        engagementRate
      });
    }, (err) => {
      console.error('Error fetching results:', err);
    });

    return () => unsubscribe();
  }, [moduleId, module?.studentsCount]);

  // Fetch all modules in the course for navigation
  useEffect(() => {
    if (!module?.courseId) return;

    const fetchCourseModules = async () => {
      try {
        const q = query(
          collection(db, 'modules'), 
          where('courseId', '==', module.courseId),
          orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);
        const modulesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module));
        setCourseModules(modulesData);
      } catch (err) {
        console.error('Error fetching course modules:', err);
      }
    };

    fetchCourseModules();
  }, [module?.courseId]);

  const currentIndex = courseModules.findIndex(m => m.id === moduleId);
  const prevModule = currentIndex > 0 ? courseModules[currentIndex - 1] : null;
  const nextModule = currentIndex < courseModules.length - 1 ? courseModules[currentIndex + 1] : null;

  const handleSave = async () => {
    if (!moduleId || !isAdmin) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const docRef = doc(db, 'modules', moduleId);
      await updateDoc(docRef, {
        ...formData,
        materials,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `modules/${moduleId}`);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!moduleId || !isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'modules', moduleId));
      navigate(`/courses/${module?.courseId}/modules`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `modules/${moduleId}`);
      setError('Failed to delete module');
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterial.title.trim()) return;
    const material: ModuleMaterial = {
      ...newMaterial,
      id: `${Date.now()}`
    };
    setMaterials((prev) => [...prev, material]);
    setNewMaterial({
      id: '',
      title: '',
      type: 'article',
      url: '',
      description: ''
    });
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleDuplicateQuiz = async (quiz: Quiz) => {
    try {
      const { id, ...data } = quiz;
      await addDoc(collection(db, 'quizzes'), {
        ...data,
        title: `${quiz.title} (Copy)`,
        status: 'draft',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'quizzes');
    }
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'quizzes', quiz.id));
      await addDoc(collection(db, 'audit_logs'), {
        action: 'Quiz Deleted',
        userEmail: user?.email || 'Unknown',
        userId: user?.uid || 'Unknown',
        details: `Deleted quiz "${quiz.title}" (ID: ${quiz.id})`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `quizzes/${quiz.id}`);
    }
  };

  const toggleArchiveQuiz = async (quiz: Quiz) => {
    try {
      const nextStatus = quiz.status === 'archived' ? 'active' : 'archived';
      await updateDoc(doc(db, 'quizzes', quiz.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `quizzes/${quiz.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error && !module) {
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
          onClick={() => navigate(`/courses/${module?.courseId}/modules`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Back to Modules
        </button>
        {isAdmin && (
          <div className="flex gap-3">
            <Link
              to={`/quiz-builder?moduleId=${moduleId}`}
              className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors"
            >
              <Plus size={18} /> Add Quiz
            </Link>
            <button 
              onClick={handleDelete}
              className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg font-bold flex items-center gap-2 transition-colors"
            >
              <Trash2 size={18} /> Delete
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
          module?.status === 'active' ? "bg-emerald-500/10 text-emerald-500" :
          module?.status === 'archived' ? "bg-rose-500/10 text-rose-500" :
          "bg-slate-500/10 text-slate-500"
        )}>
          {module?.status}
        </span>
        {!isAdmin && (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-600">
            Read-only
          </span>
        )}
        <span className="text-xs text-slate-500 font-medium">
          Created {module?.createdAt ? new Date(module.createdAt).toLocaleDateString() : '—'}
        </span>
        <span className="text-xs text-slate-500 font-medium">
          Updated {module?.updatedAt ? new Date(module.updatedAt).toLocaleDateString() : '—'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Info & Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className={cn("size-16 rounded-2xl flex items-center justify-center", `bg-${formData.color}/10`)}>
                {(() => {
                  const IconComponent = iconOptions.find(i => i.id === formData.icon)?.icon || Terminal;
                  return <IconComponent className={cn(`text-${formData.color}`)} size={32} />;
                })()}
              </div>
              <div>
                <h1 className="text-3xl font-black">{module?.title}</h1>
                <p className="text-slate-500">Module ID: {moduleId}</p>
              </div>
            </div>

            {isAdmin ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Module Title</label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                    placeholder="Enter module title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium min-h-[120px]"
                    placeholder="Enter module description"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Accent Color</label>
                    <div className="flex gap-3">
                      {colorOptions.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setFormData({ ...formData, color: color.id })}
                          className={cn(
                            "size-10 rounded-full border-4 transition-all",
                            color.class,
                            formData.color === color.id ? "border-slate-900 dark:border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Icon</label>
                  <div className="grid grid-cols-4 gap-4">
                    {iconOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFormData({ ...formData, icon: option.id })}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                          formData.icon === option.id 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                      >
                        <option.icon size={24} />
                        <span className="text-xs font-bold">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  {module?.description}
                </p>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    module?.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                  )}>
                    {module?.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Learning Materials */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">Learning Materials</h2>
              <span className="text-sm font-bold text-slate-500">{materials.length} Items</span>
            </div>

            {isAdmin && (
              <div className="mb-6 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-sm"
                    placeholder="Material title"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  />
                  <select
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-sm"
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as ModuleMaterial['type'] })}
                  >
                    <option value="article">Article</option>
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="link">Link</option>
                    <option value="notes">Notes</option>
                  </select>
                  <input
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-sm"
                    placeholder="URL (optional)"
                    value={newMaterial.url || ''}
                    onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                  />
                </div>
                <textarea
                  className="w-full mt-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-sm min-h-[70px]"
                  placeholder="Short description (optional)"
                  value={newMaterial.description || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleAddMaterial}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold"
                  >
                    Add Material
                  </button>
                </div>
              </div>
            )}

            {materials.length > 0 ? (
              <div className="space-y-3">
                {materials.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{m.type}</span>
                        <h4 className="font-bold">{m.title}</h4>
                      </div>
                      {m.description && <p className="text-xs text-slate-500">{m.description}</p>}
                      {m.url && (
                        <a
                          className="text-xs text-primary font-bold hover:underline"
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Resource
                        </a>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleRemoveMaterial(m.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 text-xs font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500">
                No learning materials added yet.
              </div>
            )}
          </div>

          {/* Related Quizzes */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">Module Quizzes</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-500">{quizzes.length} Total</span>
                {isAdmin && (
                  <Link 
                    to={`/quiz-builder?moduleId=${moduleId}`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
                  >
                    <Plus size={16} /> Create Quiz
                  </Link>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              {quizLoadError && (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <AlertTriangle size={16} /> {quizLoadError}
                  </div>
                  <button
                    onClick={() => setQuizRefreshKey((k) => k + 1)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              )}
              {quizzes.length > 0 ? quizzes.map((quiz) => (
                <div key={quiz.id} className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <BookOpen size={20} className="text-slate-500" />
                    </div>
                    <div>
                      <h4 className="font-bold">{quiz.title}</h4>
                      <p className="text-xs text-slate-500">
                        {quiz.questionsCount} Questions • {quiz.durationMinutes} Minutes • Passing {quiz.passingScore || 70}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      quiz.status === 'active' ? "bg-emerald-500/10 text-emerald-600" :
                      quiz.status === 'archived' ? "bg-rose-500/10 text-rose-600" :
                      "bg-slate-500/10 text-slate-500"
                    )}>
                      {quiz.status || 'active'}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      quiz.difficulty === 'beginner' ? "bg-emerald-500/10 text-emerald-500" :
                      quiz.difficulty === 'intermediate' ? "bg-blue-500/10 text-blue-500" :
                      "bg-rose-500/10 text-rose-500"
                    )}>
                      {quiz.difficulty}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === quiz.id ? null : quiz.id)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuId === quiz.id && (
                        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 p-2">
                          <Link
                            to={`/active-quiz/${quiz.id}`}
                            onClick={() => setOpenMenuId(null)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <Eye size={12} /> Preview
                          </Link>
                          {isAdmin && (
                            <>
                              <Link
                                to={`/quiz-builder?moduleId=${moduleId}&quizId=${quiz.id}`}
                                onClick={() => setOpenMenuId(null)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDuplicateQuiz(quiz);
                                }}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                <Copy size={12} /> Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  toggleArchiveQuiz(quiz);
                                }}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                <Archive size={12} /> {quiz.status === 'archived' ? 'Unarchive' : 'Archive'}
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteQuiz(quiz);
                                }}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  <BookOpen className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-slate-500 font-medium">No quizzes added to this module yet.</p>
                  {isAdmin && (
                    <Link
                      to={`/quiz-builder?moduleId=${moduleId}`}
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold"
                    >
                      <Plus size={16} /> Create Your First Quiz
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Module Navigation */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Navigation</h3>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Module {currentIndex + 1} of {courseModules.length || 0}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={!prevModule}
                onClick={() => navigate(`/modules/${prevModule?.id}`)}
                className="flex flex-col items-start gap-1 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all disabled:opacity-30 disabled:hover:bg-transparent group"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Prev
                </div>
                <span className="text-sm font-bold truncate w-full text-left">{prevModule?.title || 'None'}</span>
              </button>
              <button
                disabled={!nextModule}
                onClick={() => navigate(`/modules/${nextModule?.id}`)}
                className="flex flex-col items-end gap-1 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all disabled:opacity-30 disabled:hover:bg-transparent group"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Next <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <span className="text-sm font-bold truncate w-full text-right">{nextModule?.title || 'None'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Engagement Metrics</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black">{quizzes.length}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase">Total Quizzes</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.uniqueStudents}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase">Active Students</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <BarChart size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.engagementRate}%</p>
                  <p className="text-xs text-slate-500 font-bold uppercase">Engagement Rate</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.passRate}%</p>
                  <p className="text-xs text-slate-500 font-bold uppercase">Pass Rate</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.totalAttempts}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase">Total Attempts</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                  <BarChart size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.avgScore}%</p>
                  <p className="text-xs text-slate-500 font-bold uppercase">Avg Score</p>
                </div>
              </div>
            </div>
          </div>

          {(quizzes.length === 0 || quizzes.some(q => q.status === 'draft')) && (
            <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-500/20 flex items-start gap-3 text-amber-700 dark:text-amber-400">
              <AlertTriangle size={20} />
              <div>
                <p className="text-sm font-bold">Module readiness check</p>
                {quizzes.length === 0 && <p className="text-xs mt-1">No quizzes yet. Create at least one quiz before going live.</p>}
                {quizzes.some(q => q.status === 'draft') && <p className="text-xs mt-1">Some quizzes are still in draft.</p>}
              </div>
            </div>
          )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3 text-emerald-600 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <p className="text-sm font-bold">Changes saved successfully!</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20 flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

        </div>
      </div>
    </div>
  );
};
