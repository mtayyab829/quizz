import React, { useState, useEffect } from 'react';
import { Header } from '../components/Layout';
import { 
  Plus, 
  Trash2, 
  Settings2, 
  Eye, 
  Save,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Copy,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  MessageSquare,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, addDoc, getDocs, getDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Question, Quiz } from '../types';

const questionTypeLabels: Record<string, string> = {
  'multiple-choice': 'Multiple Choice',
  'multi-select': 'Multi-Select',
  'true-false': 'True/False',
  'short-answer': 'Short Answer',
  'fill-in-the-blank': 'Fill in the Blanks',
  'verbal': 'Verbal',
  'non-verbal': 'Non-Verbal',
  'matching': 'Matching',
  'ordering': 'Ordering',
};

const textResponseTypes = ['short-answer', 'fill-in-the-blank', 'verbal'];
const hasImageUrl = (url?: string) => (url || '').trim().length > 0;

export const QuizBuilderPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get moduleId from query params
  const queryParams = new URLSearchParams(location.search);
  const initialModuleId = queryParams.get('moduleId') || '';
  const initialQuizId = queryParams.get('quizId') || '';

  const [title, setTitle] = useState('New Quiz');
  const [description, setDescription] = useState('');
  const [moduleId, setModuleId] = useState(initialModuleId);
  const [editingQuizId, setEditingQuizId] = useState(initialQuizId);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [passingScore, setPassingScore] = useState(70);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    { 
      id: Date.now().toString(), 
      text: '', 
      type: 'multiple-choice', 
      points: 10, 
      options: ['', '', '', ''], 
      correctAnswer: 0,
      explanation: '',
      feedbackCorrect: 'Great job!',
      feedbackIncorrect: 'Not quite right. Try again!'
    }
  ]);

  useEffect(() => {
    const fetchModules = async () => {
      const q = query(collection(db, 'modules'), where('status', '==', 'active'));
      const snap = await getDocs(q);
      setModules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchModules();
  }, []);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!editingQuizId) return;
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', editingQuizId));
        if (!quizDoc.exists()) return;
        const data = quizDoc.data() as Quiz;
        setTitle(data.title || 'Untitled Quiz');
        setDescription(data.description || '');
        setModuleId(data.moduleId || initialModuleId);
        setDurationMinutes(data.durationMinutes || 20);
        setDifficulty(data.difficulty || 'intermediate');
        setPassingScore(data.passingScore || 70);
        setShuffleQuestions(!!data.shuffleQuestions);
        const loadedQuestions = (data.questions || []).map((q, idx) => ({
          ...q,
          id: q.id || `${Date.now()}-${idx}`
        }));
        setQuestions(loadedQuestions.length > 0 ? loadedQuestions : []);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `quizzes/${editingQuizId}`);
      }
    };
    fetchQuiz();
  }, [editingQuizId, initialModuleId]);

  const addQuestion = (type: Question['type'] = 'multiple-choice') => {
    const newQuestion: Partial<Question> = {
      id: Date.now().toString(),
      text: '',
      type,
      points: 10,
      explanation: '',
      feedbackCorrect: 'Correct!',
      feedbackIncorrect: 'Incorrect.',
    };

    if (type === 'multiple-choice' || type === 'multi-select') {
      newQuestion.options = ['', '', '', ''];
      newQuestion.correctAnswer = type === 'multiple-choice' ? 0 : [0];
    } else if (type === 'true-false') {
      newQuestion.options = ['True', 'False'];
      newQuestion.correctAnswer = 0;
    } else if (type === 'non-verbal') {
      newQuestion.options = ['', '', '', ''];
      newQuestion.optionImages = ['', '', '', ''];
      newQuestion.correctAnswer = 0;
    } else if (textResponseTypes.includes(type)) {
      newQuestion.correctAnswerText = '';
    } else if (type === 'matching') {
      newQuestion.matchingPairs = [{ left: 'Term 1', right: 'Definition 1' }, { left: 'Term 2', right: 'Definition 2' }];
    } else if (type === 'ordering') {
      newQuestion.orderedItems = ['Step 1', 'Step 2', 'Step 3'];
    }

    setQuestions((prev) => [...prev, newQuestion]);
  };

  const duplicateQuestion = (index: number) => {
    setQuestions((prev) => {
      const q = prev[index];
      if (!q) return prev;
      const newQ = { ...q, id: Date.now().toString() };
      const newQuestions = [...prev];
      newQuestions.splice(index + 1, 0, newQ);
      return newQuestions;
    });
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    setQuestions((prev) => {
      const newQuestions = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      return newQuestions;
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((prev) => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSave = async () => {
    if (!user || !moduleId) {
      alert('Please select a module');
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least one question before publishing.');
      return;
    }

    const errors: string[] = [];
    questions.forEach((q, i) => {
      const number = i + 1;
      if (!q.text || q.text.trim() === '') {
        errors.push(`Question ${number}: missing question text.`);
      }
      if (q.type === 'multiple-choice' || q.type === 'multi-select') {
        const options = (q.options || []).map(o => (o || '').trim());
        if (options.length === 0 || options.some(o => o === '')) {
          errors.push(`Question ${number}: all options must have text.`);
        }
      }
      if (q.type === 'true-false') {
        if (!q.options || q.options.length !== 2) {
          errors.push(`Question ${number}: true/false options are incomplete.`);
        }
      }
      if (q.type === 'non-verbal') {
        const imgs = (q.optionImages || []).map(o => (o || '').trim());
        if (imgs.length === 0 || imgs.some(o => o === '')) {
          errors.push(`Question ${number}: all non-verbal options must have image URLs.`);
        }
      }
      if (textResponseTypes.includes(q.type)) {
        if (!q.correctAnswerText || q.correctAnswerText.trim() === '') {
          errors.push(`Question ${number}: correct answer text is required.`);
        }
      }
      if (q.type === 'matching') {
        const pairs = q.matchingPairs || [];
        if (pairs.length === 0 || pairs.some(p => !p.left?.trim() || !p.right?.trim())) {
          errors.push(`Question ${number}: matching pairs must be complete.`);
        }
      }
      if (q.type === 'ordering') {
        const items = (q.orderedItems || []).map(o => (o || '').trim());
        if (items.length === 0 || items.some(o => o === '')) {
          errors.push(`Question ${number}: ordering items must be complete.`);
        }
      }
    });

    if (errors.length > 0) {
      alert(`Please fix the following before publishing:\n\n${errors.slice(0, 8).join('\n')}${errors.length > 8 ? `\n…plus ${errors.length - 8} more.` : ''}`);
      return;
    }

    setSaving(true);
    try {
      const quizData: Partial<Quiz> = {
        title,
        description,
        moduleId,
        questions: questions as Question[],
        questionsCount: questions.length,
        durationMinutes,
        difficulty,
        status: 'active',
        passingScore,
        shuffleQuestions,
        tags: [],
      };

      let savedQuizId = editingQuizId || '';
      if (editingQuizId) {
        await updateDoc(doc(db, 'quizzes', editingQuizId), {
          ...quizData,
          updatedAt: new Date().toISOString()
        });
      } else {
        const quizDoc = await addDoc(collection(db, 'quizzes'), {
          ...quizData,
          createdBy: user.uid,
          createdAt: new Date().toISOString()
        });

        savedQuizId = quizDoc.id;
        setEditingQuizId(quizDoc.id);
      }

      // Add Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        action: editingQuizId ? 'Quiz Updated' : 'Quiz Created',
        userEmail: user.email || 'Unknown',
        userId: user.uid,
        details: editingQuizId ? `Updated quiz "${title}" (ID: ${savedQuizId})` : `Created quiz "${title}" (ID: ${savedQuizId})`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      navigate(`/modules/${moduleId}`);
    } catch (error) {
      handleFirestoreError(error, editingQuizId ? OperationType.UPDATE : OperationType.CREATE, 'quizzes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full pb-24">
      <Header title="Advanced Quiz Builder" />
      
      <div className="mt-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Quiz Basic Info */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight">Quiz Configuration</h2>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  showSettings ? "bg-primary text-white" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Settings2 size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Quiz Title</label>
                  <input 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Advanced React Patterns"
                    type="text" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Target Module</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={moduleId}
                    onChange={(e) => setModuleId(e.target.value)}
                  >
                    <option value="">Select a Module</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {showSettings && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Duration (Mins)</label>
                    <input 
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none" 
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                      type="number" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Passing Score (%)</label>
                    <input 
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none" 
                      value={passingScore}
                      onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
                      type="number" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Difficulty</label>
                    <select 
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="shuffle" 
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="shuffle" className="text-sm font-bold text-slate-600 dark:text-slate-400">Shuffle questions for each student</label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] resize-none" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What should students know before taking this quiz?"
                />
              </div>
            </div>
          </div>

          {/* Questions Area */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tight">Questions ({questions.length})</h3>
              <div className="flex gap-2">
                <div className="relative group">
                  <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                    <Plus size={18} /> Add Question
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                    {[
                      { id: 'multiple-choice', label: 'Multiple Choice' },
                      { id: 'multi-select', label: 'Multi-Select' },
                      { id: 'true-false', label: 'True/False' },
                      { id: 'short-answer', label: 'Short Answer' },
                      { id: 'fill-in-the-blank', label: 'Fill in the Blanks' },
                      { id: 'verbal', label: 'Verbal' },
                      { id: 'non-verbal', label: 'Non-Verbal' },
                      { id: 'matching', label: 'Matching' },
                      { id: 'ordering', label: 'Ordering' },
                    ].map(type => (
                      <button 
                        key={type.id}
                        onClick={() => addQuestion(type.id as any)}
                        className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {questions.map((q, idx) => (
                <QuestionEditor 
                  key={q.id} 
                  question={q} 
                  index={idx} 
                  onUpdate={(updates) => updateQuestion(q.id!, updates)}
                  onRemove={() => removeQuestion(q.id!)}
                  onDuplicate={() => duplicateQuestion(idx)}
                  onMoveUp={() => moveQuestion(idx, 'up')}
                  onMoveDown={() => moveQuestion(idx, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === questions.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
            <h4 className="text-lg font-black mb-6">Quiz Summary</h4>
            <div className="space-y-4 mb-8">
              <SummaryItem label="Questions" value={questions.length} />
              <SummaryItem label="Total Points" value={questions.reduce((acc, q) => acc + (q.points || 0), 0)} />
              <SummaryItem label="Time Limit" value={`${durationMinutes}m`} />
              <SummaryItem label="Passing Score" value={`${passingScore}%`} />
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Publish Quiz
              </button>
              <button 
                onClick={() => setShowPreview(true)}
                className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <Eye size={20} /> Preview Mode
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <HelpCircle size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Quick Tips</span>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3 text-xs text-slate-500 font-medium">
                  <div className="size-1.5 rounded-full bg-primary mt-1 shrink-0" />
                  Use "Matching" for vocabulary or concept definitions.
                </li>
                <li className="flex gap-3 text-xs text-slate-500 font-medium">
                  <div className="size-1.5 rounded-full bg-primary mt-1 shrink-0" />
                  Add explanations to help students learn from mistakes.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal 
          title={title}
          description={description}
          questions={questions as Question[]}
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
};

const QuestionEditor = ({ 
  question, 
  index, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast 
}: any) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleOptionChange = (optIndex: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[optIndex] = value;
    onUpdate({ options: newOptions });
  };

  const handleOptionImageChange = (optIndex: number, value: string) => {
    const newImages = [...(question.optionImages || [])];
    while (newImages.length < (question.options?.length || 0)) {
      newImages.push('');
    }
    newImages[optIndex] = value;
    onUpdate({ optionImages: newImages });
  };

  const toggleCorrectAnswer = (optIndex: number) => {
    if (question.type === 'multiple-choice' || question.type === 'true-false' || question.type === 'non-verbal') {
      onUpdate({ correctAnswer: optIndex });
    } else if (question.type === 'multi-select') {
      const current = (question.correctAnswer as number[]) || [];
      const next = current.includes(optIndex) 
        ? current.filter(i => i !== optIndex) 
        : [...current, optIndex];
      onUpdate({ correctAnswer: next });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
      {/* Header */}
      <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-bottom border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm">
            {index + 1}
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
            <span className="text-xs font-bold text-primary uppercase">{questionTypeLabels[question.type] || question.type?.replace('-', ' ')}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-20"><ArrowUp size={18} /></button>
          <button onClick={onMoveDown} disabled={isLast} className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-20"><ArrowDown size={18} /></button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
          <button onClick={onDuplicate} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Duplicate"><Copy size={18} /></button>
          <button onClick={onRemove} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Delete"><Trash2 size={18} /></button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Question Text & Points */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Text</label>
            <input 
              className="w-full bg-transparent border-none text-xl font-bold outline-none placeholder:text-slate-200 dark:placeholder:text-slate-700" 
              value={question.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Enter your question here..." 
            />
          </div>
          <div className="w-full md:w-32 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <input 
                className="w-full bg-transparent border-none text-sm font-bold text-center outline-none" 
                value={question.points}
                onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 0 })}
                type="number" 
              />
            </div>
          </div>
        </div>

        {/* Question Media */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <ImageIcon size={12} /> Image URL (Optional)
          </div>
          <input 
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none" 
            value={question.imageUrl || ''}
            onChange={(e) => onUpdate({ imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Answer Options Based on Type */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Answers & Options</label>
          
          {(question.type === 'multiple-choice' || question.type === 'multi-select' || question.type === 'true-false') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options?.map((opt: string, i: number) => (
                <div key={i} className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all group/opt",
                  (question.type === 'multi-select' ? (question.correctAnswer as number[]).includes(i) : question.correctAnswer === i)
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                )}>
                  <button 
                    onClick={() => toggleCorrectAnswer(i)}
                    className={cn(
                      "size-6 rounded-full border-2 flex items-center justify-center transition-all",
                      (question.type === 'multi-select' ? (question.correctAnswer as number[]).includes(i) : question.correctAnswer === i)
                        ? "bg-primary border-primary text-white scale-110" 
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    )}
                  >
                    {(question.type === 'multi-select' ? (question.correctAnswer as number[]).includes(i) : question.correctAnswer === i) && <CheckCircle2 size={14} />}
                  </button>
                  <input 
                    className="flex-1 bg-transparent border-none text-sm font-bold outline-none" 
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    disabled={question.type === 'true-false'}
                  />
                </div>
              ))}
            </div>
          )}

          {question.type === 'non-verbal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.optionImages?.map((img: string, i: number) => (
                <div key={i} className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all group/opt",
                  question.correctAnswer === i
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                )}>
                  <button 
                    onClick={() => toggleCorrectAnswer(i)}
                    className={cn(
                      "size-6 rounded-full border-2 flex items-center justify-center transition-all",
                      question.correctAnswer === i
                        ? "bg-primary border-primary text-white scale-110" 
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    )}
                  >
                    {question.correctAnswer === i && <CheckCircle2 size={14} />}
                  </button>
                  <div className="flex-1 space-y-3">
                    <input 
                      className="w-full px-3 py-2 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium outline-none" 
                      value={img}
                      onChange={(e) => handleOptionImageChange(i, e.target.value)}
                      placeholder={`Option ${i + 1} image URL`}
                    />
                    {hasImageUrl(img) && (
                      <img
                        src={img}
                        alt={`Option ${i + 1}`}
                        className="w-full rounded-xl border border-slate-100 dark:border-slate-800"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {textResponseTypes.includes(question.type) && (
            <div className="space-y-4">
              <input 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" 
                value={question.correctAnswerText || ''}
                onChange={(e) => onUpdate({ correctAnswerText: e.target.value })}
                placeholder={
                  question.type === 'fill-in-the-blank'
                    ? "Enter the exact blank(s) answer..."
                    : question.type === 'verbal' || question.type === 'non-verbal'
                      ? "Enter the expected answer or rubric keywords..."
                      : "Enter the exact correct answer..."
                } 
              />
              <p className="text-[10px] text-slate-400 font-bold italic">* Case-insensitive matching will be used.</p>
            </div>
          )}

          {question.type === 'matching' && (
            <div className="space-y-3">
              {question.matchingPairs?.map((pair: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <input 
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none" 
                    value={pair.left}
                    onChange={(e) => {
                      const next = [...question.matchingPairs];
                      next[i].left = e.target.value;
                      onUpdate({ matchingPairs: next });
                    }}
                    placeholder="Term"
                  />
                  <div className="text-slate-300 font-black">→</div>
                  <input 
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none" 
                    value={pair.right}
                    onChange={(e) => {
                      const next = [...question.matchingPairs];
                      next[i].right = e.target.value;
                      onUpdate({ matchingPairs: next });
                    }}
                    placeholder="Definition"
                  />
                  <button 
                    onClick={() => {
                      const next = question.matchingPairs.filter((_: any, idx: number) => idx !== i);
                      onUpdate({ matchingPairs: next });
                    }}
                    className="p-2 text-slate-300 hover:text-rose-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => onUpdate({ matchingPairs: [...(question.matchingPairs || []), { left: '', right: '' }] })}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Pair
              </button>
            </div>
          )}

          {question.type === 'ordering' && (
            <div className="space-y-3">
              {question.orderedItems?.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="size-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500">
                    {i + 1}
                  </div>
                  <input 
                    className="flex-1 bg-transparent border-none text-sm font-bold outline-none" 
                    value={item}
                    onChange={(e) => {
                      const next = [...question.orderedItems];
                      next[i] = e.target.value;
                      onUpdate({ orderedItems: next });
                    }}
                    placeholder={`Step ${i + 1}`}
                  />
                  <button 
                    onClick={() => {
                      const next = question.orderedItems.filter((_: any, idx: number) => idx !== i);
                      onUpdate({ orderedItems: next });
                    }}
                    className="p-2 text-slate-300 hover:text-rose-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => onUpdate({ orderedItems: [...(question.orderedItems || []), ''] })}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
          )}
        </div>

        {/* Advanced Settings Toggle */}
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
        >
          {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options (Feedback & Explanation)
        </button>

        {showAdvanced && (
          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Correct Feedback</label>
                <textarea 
                  className="w-full px-4 py-2 bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-xs font-medium outline-none min-h-[60px]" 
                  value={question.feedbackCorrect || ''}
                  onChange={(e) => onUpdate({ feedbackCorrect: e.target.value })}
                  placeholder="Well done!"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Incorrect Feedback</label>
                <textarea 
                  className="w-full px-4 py-2 bg-rose-50/30 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-xl text-xs font-medium outline-none min-h-[60px]" 
                  value={question.feedbackIncorrect || ''}
                  onChange={(e) => onUpdate({ feedbackIncorrect: e.target.value })}
                  placeholder="Try again next time."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Info size={10} /> Explanation (Shown after quiz completion)
              </label>
              <textarea 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none min-h-[80px]" 
                value={question.explanation || ''}
                onChange={(e) => onUpdate({ explanation: e.target.value })}
                placeholder="Explain the logic behind the correct answer..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PreviewModal = ({ title, questions, onClose }: any) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentQ = questions[currentIdx];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Preview Mode</span>
            <h2 className="text-xl font-black">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          {questions.length > 0 && currentQ ? (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
                  <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-black leading-tight">{currentQ.text}</h3>
                {currentQ.imageUrl && (
                  <img src={currentQ.imageUrl} alt="Question" className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg" />
                )}
              </div>

              <div className="space-y-3">
                {(currentQ.type === 'multiple-choice' || currentQ.type === 'multi-select' || currentQ.type === 'true-false') && (
                  <div className="grid grid-cols-1 gap-3">
                    {currentQ.options?.map((opt: string, i: number) => {
                      const isCorrect = currentQ.type === 'multi-select'
                        ? ((currentQ.correctAnswer as number[]) || []).includes(i)
                        : currentQ.correctAnswer === i;

                      return (
                      <div
                        key={i}
                        className={cn(
                          "p-5 rounded-2xl border-2 transition-all cursor-pointer font-bold space-y-3 flex items-center justify-between",
                          isCorrect
                            ? "border-emerald-400 bg-emerald-50/60 text-emerald-700"
                            : "border-slate-100 dark:border-slate-800 hover:border-primary/30"
                        )}
                      >
                        <div>{(opt || '').trim() || `Option ${i + 1}`}</div>
                        {isCorrect && (
                          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2 py-1 rounded-full">
                            Correct
                          </span>
                        )}
                      </div>
                    )})}
                  </div>
                )}
                {currentQ.type === 'non-verbal' && (
                  <div className="grid grid-cols-1 gap-3">
                    {currentQ.optionImages?.map((img: string, i: number) => (
                      <div key={i} className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all cursor-pointer font-bold space-y-3">
                        {hasImageUrl(img) ? (
                          <img
                            src={img}
                            alt={`Option ${i + 1}`}
                            className="w-full rounded-xl border border-slate-100 dark:border-slate-800"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Image required</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {textResponseTypes.includes(currentQ.type) && (
                  <input 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-lg font-bold outline-none" 
                    placeholder="Type your answer..."
                    disabled
                  />
                )}
                {currentQ.type === 'matching' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {currentQ.matchingPairs?.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <div className="flex-1 text-sm font-bold">{p.left || `Term ${i + 1}`}</div>
                          <div className="text-slate-300 font-black">→</div>
                          <div className="flex-1 text-sm font-bold text-right">{p.right || `Definition ${i + 1}`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {currentQ.type === 'ordering' && (
                  <div className="space-y-2">
                    {currentQ.orderedItems?.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold">
                        <GripVertical size={16} className="text-slate-300" />
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <HelpCircle size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-bold">Add some questions to see a preview!</p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <button 
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(currentIdx - 1)}
            className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-20 transition-all"
          >
            Previous
          </button>
          <button 
            disabled={currentIdx === questions.length - 1}
            onClick={() => setCurrentIdx(currentIdx + 1)}
            className="px-8 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-20 transition-all"
          >
            Next Question
          </button>
        </div>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value }: any) => (
  <div className="flex justify-between items-center">
    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-lg font-black">{value}</span>
  </div>
);
