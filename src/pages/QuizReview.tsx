import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Quiz, QuizResult, Question } from '../types';
import { Header } from '../components/Layout';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Loader2, 
  Trophy,
  HelpCircle,
  Clock,
  Award,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';

export const QuizReviewPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!resultId) return;
      try {
        const resultDoc = await getDoc(doc(db, 'results', resultId));
        if (resultDoc.exists()) {
          const resultData = { id: resultDoc.id, ...resultDoc.data() } as QuizResult;
          setResult(resultData);
          
          const quizDoc = await getDoc(doc(db, 'quizzes', resultData.quizId));
          if (quizDoc.exists()) {
            setQuiz({ id: quizDoc.id, ...quizDoc.data() } as Quiz);
          }
        }
      } catch (error) {
        console.error('Error fetching review data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resultId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!result || !quiz) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Result or Quiz not found.</p>
        <button onClick={() => navigate('/history')} className="mt-4 text-primary font-bold">Back to History</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-12 flex items-center gap-4">
        <button 
          onClick={() => navigate('/history')}
          className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{quiz.title}</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Review • Completed {new Date(result.completedAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
          label="Final Score" 
          value={`${result.score}%`} 
          icon={Trophy} 
          color={result.status === 'passed' ? 'text-emerald-500' : 'text-rose-500'} 
        />
        <StatCard 
          label="Points Earned" 
          value={`${result.earnedPoints} / ${result.totalPoints}`} 
          icon={Award} 
          color="text-primary" 
        />
        <StatCard 
          label="Quiz Status" 
          value={result.status.toUpperCase()} 
          icon={CheckCircle2} 
          color={result.status === 'passed' ? 'text-emerald-500' : 'text-rose-500'} 
        />
      </div>

      <div className="space-y-12">
        {quiz.questions?.map((question, index) => (
          <ReviewQuestionCard 
            key={index} 
            question={question} 
            userAnswer={result.answers?.[index]} 
            index={index} 
          />
        ))}
        {(!quiz.questions || quiz.questions.length === 0) && (
          <p className="text-center text-slate-500 py-12">No question data available for this quiz.</p>
        )}
      </div>

      <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-4">
        <Link 
          to="/student-dashboard" 
          className="w-full md:w-auto px-12 py-5 bg-primary text-white rounded-[24px] font-black hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-primary/20 text-center"
        >
          Back to Dashboard
        </Link>
        <Link 
          to="/history" 
          className="w-full md:w-auto px-12 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-[24px] font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center"
        >
          View History
        </Link>
        {result.status === 'failed' && (
          <Link 
            to={`/active-quiz/${quiz.id}`}
            className="w-full md:w-auto px-12 py-5 bg-emerald-500 text-white rounded-[24px] font-black hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-emerald-500/20 text-center"
          >
            Retake Quiz
          </Link>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
    <div className={cn("size-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center", color)}>
      <Icon size={32} />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={cn("text-2xl font-black", color)}>{value}</p>
    </div>
  </div>
);

interface ReviewQuestionCardProps {
  question: Question;
  userAnswer: any;
  index: number;
}

const ReviewQuestionCard: React.FC<ReviewQuestionCardProps> = ({ question, userAnswer, index }) => {
  let isCorrect = false;

  if (question.type === 'short-answer') {
    isCorrect = typeof userAnswer === 'string' && userAnswer.trim().toLowerCase() === question.correctAnswerText?.trim().toLowerCase();
  } else if (question.type === 'multi-select') {
    const correctAnswers = (question.correctAnswer as number[]) || [];
    const userAnswers = (userAnswer as number[]) || [];
    isCorrect = correctAnswers.length === userAnswers.length && 
                correctAnswers.every(val => userAnswers.includes(val));
  } else if (question.type === 'matching') {
    const userPairs = (userAnswer as Record<number, number>) || {};
    const totalPairs = question.matchingPairs?.length || 0;
    let correctPairs = 0;
    question.matchingPairs?.forEach((pair, i) => {
      if (userPairs[i] === i) correctPairs++;
    });
    isCorrect = correctPairs === totalPairs;
  } else if (question.type === 'ordering') {
    const userOrder = (userAnswer as number[]) || [];
    isCorrect = JSON.stringify(userOrder) === JSON.stringify(question.orderedItems?.map((_, i) => i));
  } else {
    isCorrect = userAnswer === question.correctAnswer;
  }

  const feedback = isCorrect ? question.feedbackCorrect : question.feedbackIncorrect;

  return (
    <div className={cn(
      "p-8 md:p-12 rounded-[48px] border-2 transition-all relative overflow-hidden",
      isCorrect 
        ? "bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20" 
        : "bg-rose-50/30 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20"
    )}>
      <div className="absolute top-0 left-0 w-full h-2 bg-current opacity-10" />
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div className="flex items-start gap-6">
          <span className="size-12 shrink-0 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xl">
            {index + 1}
          </span>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                {question.type.replace('-', ' ')}
              </span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                {question.points || 10} Points
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black leading-tight tracking-tight">{question.text}</h3>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest",
          isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          {isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          {isCorrect ? 'Correct' : 'Incorrect'}
        </div>
      </div>

      {question.imageUrl && (
        <div className="mb-10 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 max-w-2xl">
          <img src={question.imageUrl} alt="Question" className="w-full h-auto object-cover" />
        </div>
      )}

      <div className="space-y-6">
        {question.type === 'multiple-choice' || question.type === 'multi-select' || question.type === 'true-false' ? (
          <div className="grid grid-cols-1 gap-4">
            {question.options?.map((option, i) => {
              const isUserChoice = question.type === 'multi-select' 
                ? (userAnswer as number[] || []).includes(i)
                : userAnswer === i;
              
              const isCorrectChoice = question.type === 'multi-select'
                ? (question.correctAnswer as number[] || []).includes(i)
                : question.correctAnswer === i;
              
              return (
                <div 
                  key={i}
                  className={cn(
                    "p-6 rounded-3xl border-2 text-base font-bold flex items-center justify-between transition-all",
                    isCorrectChoice 
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                      : isUserChoice 
                        ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-8 rounded-xl border-2 flex items-center justify-center text-xs font-black",
                      isCorrectChoice || isUserChoice ? "bg-white/20 border-white/40" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    )}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span>{option}</span>
                  </div>
                  {isCorrectChoice && <CheckCircle2 size={24} />}
                  {isUserChoice && !isCorrectChoice && <XCircle size={24} />}
                </div>
              );
            })}
          </div>
        ) : question.type === 'matching' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Matching</p>
              {question.matchingPairs?.map((pair, i) => {
                const userMatchIdx = userAnswer?.[i];
                const isPairCorrect = userMatchIdx === i;
                return (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border-2 flex items-center justify-between",
                    isPairCorrect ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                  )}>
                    <span className="font-bold">{pair.left}</span>
                    <span className={cn("text-sm font-black", isPairCorrect ? "text-emerald-600" : "text-rose-600")}>
                      → {userMatchIdx !== undefined ? `Def ${userMatchIdx + 1}` : 'None'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Correct Matching</p>
              {question.matchingPairs?.map((pair, i) => (
                <div key={i} className="p-4 bg-emerald-500 text-white rounded-2xl border-2 border-emerald-500 flex items-center justify-between">
                  <span className="font-bold">{pair.left}</span>
                  <span className="text-sm font-black">→ Def {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        ) : question.type === 'ordering' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Order</p>
              {question.orderedItems?.map((_, i) => {
                const itemIdx = userAnswer?.[i];
                const isOrderCorrect = itemIdx === i;
                return (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border-2 flex items-center gap-4",
                    isOrderCorrect ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                  )}>
                    <span className="size-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                    <span className={cn("font-bold", isOrderCorrect ? "text-emerald-600" : "text-rose-600")}>
                      {itemIdx !== undefined ? question.orderedItems?.[itemIdx] : 'None'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Correct Order</p>
              {question.orderedItems?.map((item, i) => (
                <div key={i} className="p-4 bg-emerald-500 text-white rounded-2xl border-2 border-emerald-500 flex items-center gap-4">
                  <span className="size-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                  <span className="font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Answer</p>
              <p className={cn("text-xl font-black", isCorrect ? "text-emerald-600" : "text-rose-600")}>
                {userAnswer || '(No answer provided)'}
              </p>
            </div>
            {!isCorrect && (
              <div className="p-6 rounded-3xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-2">Correct Answer</p>
                <p className="text-xl font-black">{question.correctAnswerText}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {(feedback || question.explanation) && (
        <div className="mt-10 space-y-4">
          {feedback && (
            <div className={cn(
              "p-6 rounded-3xl flex gap-4 items-start",
              isCorrect ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
            )}>
              <Info className="shrink-0 mt-1" size={20} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Feedback</p>
                <p className="font-bold leading-relaxed">{feedback}</p>
              </div>
            </div>
          )}
          {question.explanation && (
            <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-3xl flex gap-4 items-start">
              <HelpCircle className="text-slate-400 shrink-0 mt-1" size={20} />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Detailed Explanation</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{question.explanation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
