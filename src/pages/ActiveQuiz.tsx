import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Trophy,
  ArrowLeft,
  Loader2,
  GripVertical,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, doc, updateDoc, increment, getDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useParams } from 'react-router-dom';
import { Quiz, Question } from '../types';

export const ActiveQuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !user) return;
      try {
        // Check for existing session
        const sessionQuery = query(
          collection(db, 'quiz_sessions'), 
          where('quizId', '==', quizId), 
          where('userId', '==', user.uid),
          where('status', '==', 'active'),
          limit(1)
        );
        const sessionSnap = await getDocs(sessionQuery);
        let existingSession: any = null;
        if (!sessionSnap.empty) {
          existingSession = { id: sessionSnap.docs[0].id, ...sessionSnap.docs[0].data() };
          setSessionId(existingSession.id);
          setAnswers(existingSession.answers || {});
          setCurrentQuestion(existingSession.currentQuestion || 0);
        }

        const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
        if (quizDoc.exists()) {
          const data = quizDoc.data() as Quiz;
          setQuiz({ id: quizDoc.id, ...data });
          
          let quizQuestions = data.questions || [];
          if (data.shuffleQuestions) {
            quizQuestions = shuffleArray(quizQuestions);
          }
          setQuestions(quizQuestions);
          
          if (existingSession) {
            setTimeLeft(existingSession.timeLeft);
          } else {
            setTimeLeft((data.durationMinutes || 20) * 60);
            // Create new session
            const newSession = await addDoc(collection(db, 'quiz_sessions'), {
              quizId,
              userId: user.uid,
              quizTitle: data.title,
              answers: {},
              currentQuestion: 0,
              timeLeft: (data.durationMinutes || 20) * 60,
              status: 'active',
              lastUpdated: new Date().toISOString()
            });
            setSessionId(newSession.id);
          }
        } else {
          alert('Quiz not found');
          navigate('/student-dashboard');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `quizzes/${quizId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate, user]);

  // Auto-save session
  useEffect(() => {
    if (!sessionId || isFinished) return;
    
    const saveSession = async () => {
      try {
        await updateDoc(doc(db, 'quiz_sessions', sessionId), {
          answers,
          currentQuestion,
          timeLeft,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error saving session:", error);
      }
    };

    const debounce = setTimeout(saveSession, 2000);
    return () => clearTimeout(debounce);
  }, [answers, currentQuestion, timeLeft, sessionId, isFinished]);

  const handleFinish = useCallback(async () => {
    if (!user || !quiz) return;
    setSaving(true);
    
    let earnedPoints = 0;
    let correctCount = 0;

    questions.forEach((q, index) => {
      const answer = answers[index];
      let isCorrect = false;

      if (q.type === 'short-answer') {
        isCorrect = typeof answer === 'string' && answer.trim().toLowerCase() === q.correctAnswerText?.trim().toLowerCase();
      } else if (q.type === 'multi-select') {
        const correctAnswers = (q.correctAnswer as number[]) || [];
        const userAnswers = (answer as number[]) || [];
        isCorrect = correctAnswers.length === userAnswers.length && 
                    correctAnswers.every(val => userAnswers.includes(val));
      } else if (q.type === 'matching') {
        // answer is Record<number, number> mapping left index to right index
        const userPairs = (answer as Record<number, number>) || {};
        const totalPairs = q.matchingPairs?.length || 0;
        let correctPairs = 0;
        q.matchingPairs?.forEach((pair, i) => {
          if (userPairs[i] === i) correctPairs++;
        });
        isCorrect = correctPairs === totalPairs;
      } else if (q.type === 'ordering') {
        // answer is number[] of indices in user's order
        const userOrder = (answer as number[]) || [];
        isCorrect = JSON.stringify(userOrder) === JSON.stringify(q.orderedItems?.map((_, i) => i));
      } else {
        isCorrect = answer === q.correctAnswer;
      }

      if (isCorrect) {
        earnedPoints += (q.points || 10);
        correctCount++;
      }
    });

    const totalPoints = questions.reduce((acc, q) => acc + (q.points || 10), 0);
    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    const passingScore = quiz.passingScore || 70;

    try {
      const docRef = await addDoc(collection(db, 'results'), {
        quizId: quiz.id,
        quizTitle: quiz.title,
        moduleId: quiz.moduleId,
        studentId: user.uid,
        studentName: user.displayName || 'Anonymous',
        score: scorePercentage,
        earnedPoints,
        totalPoints,
        totalQuestions: questions.length,
        answers: answers,
        completedAt: new Date().toISOString(),
        xpEarned: earnedPoints,
        status: scorePercentage >= passingScore ? 'passed' : 'failed'
      });

      setResultId(docRef.id);

      // Delete session
      if (sessionId) {
        await updateDoc(doc(db, 'quiz_sessions', sessionId), {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        totalXP: increment(earnedPoints)
      });

      setIsFinished(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'results');
    } finally {
      setSaving(false);
    }
  }, [user, quiz, questions, answers]);

  useEffect(() => {
    if (loading || isFinished || !quiz) return;
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, isFinished, quiz, handleFinish]);

  const handleOptionSelect = (optionIndex: number) => {
    const q = questions[currentQuestion];
    if (q.type === 'multi-select') {
      const current = (answers[currentQuestion] as number[]) || [];
      const next = current.includes(optionIndex) 
        ? current.filter(i => i !== optionIndex) 
        : [...current, optionIndex];
      setAnswers({ ...answers, [currentQuestion]: next });
    } else {
      setAnswers({ ...answers, [currentQuestion]: optionIndex });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No questions found for this quiz.</h2>
          <Link to="/student-dashboard" className="text-primary font-bold hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const scorePercentage = Math.round((questions.filter((q, i) => {
      const answer = answers[i];
      if (q.type === 'short-answer') return typeof answer === 'string' && answer.trim().toLowerCase() === q.correctAnswerText?.trim().toLowerCase();
      if (q.type === 'multi-select') return JSON.stringify(((q.correctAnswer as number[]) || []).sort()) === JSON.stringify(((answer as number[]) || []).sort());
      return answer === q.correctAnswer;
    }).length / questions.length) * 100);

    const earnedPoints = questions.reduce((acc, q, index) => {
      const answer = answers[index];
      let isCorrect = false;
      if (q.type === 'short-answer') isCorrect = typeof answer === 'string' && answer.trim().toLowerCase() === q.correctAnswerText?.trim().toLowerCase();
      else if (q.type === 'multi-select') isCorrect = JSON.stringify(((q.correctAnswer as number[]) || []).sort()) === JSON.stringify(((answer as number[]) || []).sort());
      else isCorrect = answer === q.correctAnswer;
      return acc + (isCorrect ? (q.points || 10) : 0);
    }, 0);

    const passed = scorePercentage >= (quiz.passingScore || 70);

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-12 text-center shadow-2xl">
          <div className={cn(
            "size-24 rounded-full flex items-center justify-center mx-auto mb-8",
            passed ? "bg-emerald-100 dark:bg-emerald-500/10" : "bg-rose-100 dark:bg-rose-500/10"
          )}>
            {passed ? <Trophy className="text-emerald-500" size={48} /> : <XCircle className="text-rose-500" size={48} />}
          </div>
          <h2 className="text-3xl font-black mb-2">{passed ? 'Congratulations!' : 'Keep Practicing!'}</h2>
          <p className="text-slate-500 mb-8">
            {passed 
              ? `You passed the quiz with a score of ${scorePercentage}%!` 
              : `You scored ${scorePercentage}%, but you need ${quiz.passingScore || 70}% to pass.`}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Score</p>
              <p className={cn("text-2xl font-black", passed ? "text-emerald-500" : "text-rose-500")}>{scorePercentage}%</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">XP Earned</p>
              <p className="text-2xl font-black text-primary">+{earnedPoints}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => navigate('/student-dashboard')}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
            >
              Back to Dashboard
            </button>
            {resultId && (
              <Link 
                to={`/quiz-review/${resultId}`}
                className="block w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Review Answers
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/student-dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-black tracking-tight">{quiz.title}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentQuestion + 1} of {questions.length}</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-6 py-2 rounded-full font-mono font-black text-sm transition-all",
          timeLeft < 60 ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        )}>
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full p-8 md:p-12">
        <div className="mb-12">
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-700 ease-out" 
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-8 md:p-16 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary/10" />
          
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                {question.type.replace('-', ' ')}
              </span>
              <span className="px-4 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                {question.points || 10} Points
              </span>
            </div>
            <h3 className="text-2xl md:text-4xl font-black leading-tight tracking-tight">
              {question.text}
            </h3>
            {question.imageUrl && (
              <div className="mt-8 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl">
                <img src={question.imageUrl} alt="Question" className="w-full h-auto object-cover" />
              </div>
            )}
          </div>

          {question.type === 'short-answer' ? (
            <div className="space-y-4">
              <input 
                type="text"
                className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl text-xl font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                placeholder="Type your answer here..."
                value={answers[currentQuestion] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentQuestion]: e.target.value })}
              />
              <div className="flex items-center gap-2 text-slate-400">
                <AlertCircle size={14} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Case-insensitive matching</p>
              </div>
            </div>
          ) : question.type === 'matching' ? (
            <div className="space-y-4">
               <p className="text-sm text-slate-500 italic mb-4">Select the matching pairs below:</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   {question.matchingPairs?.map((pair, i) => (
                     <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                       <span className="font-bold">{pair.left}</span>
                       <select 
                         className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold"
                         value={answers[currentQuestion]?.[i] ?? ''}
                         onChange={(e) => {
                           const current = answers[currentQuestion] || {};
                           setAnswers({ ...answers, [currentQuestion]: { ...current, [i]: parseInt(e.target.value) } });
                         }}
                       >
                         <option value="">Match...</option>
                         {question.matchingPairs?.map((_, idx) => (
                           <option key={idx} value={idx}>Definition {idx + 1}</option>
                         ))}
                       </select>
                     </div>
                   ))}
                 </div>
                 <div className="space-y-3">
                   {question.matchingPairs?.map((pair, i) => (
                     <div key={i} className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                       <span className="text-xs font-black text-slate-400 uppercase mr-2">Def {i + 1}:</span>
                       <span className="text-sm font-medium">{pair.right}</span>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          ) : question.type === 'ordering' ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 italic mb-4">Arrange the items in the correct order (use the dropdowns):</p>
              {question.orderedItems?.map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-xs">
                    {i + 1}
                  </div>
                  <select 
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm"
                    value={answers[currentQuestion]?.[i] ?? ''}
                    onChange={(e) => {
                      const current = [...(answers[currentQuestion] || [])];
                      current[i] = parseInt(e.target.value);
                      setAnswers({ ...answers, [currentQuestion]: current });
                    }}
                  >
                    <option value="">Select item...</option>
                    {question.orderedItems?.map((item, idx) => (
                      <option key={idx} value={idx}>{item}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {question.options?.map((option, index) => {
                const isSelected = question.type === 'multi-select' 
                  ? (answers[currentQuestion] as number[] || []).includes(index)
                  : answers[currentQuestion] === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    className={cn(
                      "w-full p-8 rounded-3xl border-2 text-left transition-all flex items-center justify-between group relative overflow-hidden",
                      isSelected 
                        ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5" 
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30"
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "size-10 rounded-2xl border-2 flex items-center justify-center font-black transition-all",
                        isSelected 
                          ? "bg-primary border-primary text-white rotate-12 scale-110 shadow-lg shadow-primary/30" 
                          : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300 text-slate-400"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-lg font-bold">{option}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={24} className="text-primary animate-in zoom-in" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-8 py-4 font-black text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-0 transition-all uppercase tracking-widest text-xs"
          >
            <ChevronLeft size={20} /> Previous
          </button>
          
          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleFinish}
              disabled={saving || answers[currentQuestion] === undefined}
              className="flex items-center gap-3 px-12 py-5 bg-primary text-white rounded-[24px] font-black hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-primary/30 disabled:opacity-50 uppercase tracking-widest"
            >
              {saving ? <Loader2 className="animate-spin" size={24} /> : 'Finish Quiz'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              disabled={answers[currentQuestion] === undefined}
              className="flex items-center gap-3 px-12 py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[24px] font-black hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 uppercase tracking-widest"
            >
              Next Question <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
;
