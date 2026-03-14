import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Layout';
import { Clock, Calendar, Trophy, ChevronRight, Loader2, Search, Filter } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { QuizResult } from '../types';
import { cn } from '../lib/utils';

export const QuizHistoryPage = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'results'),
      where('studentId', '==', user.uid),
      orderBy('completedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resultsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QuizResult[];
      setResults(resultsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredResults = results.filter(r => {
    const matchesSearch = (r.quizTitle || r.quizId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <Header title="Quiz History" />
      
      <div className="mt-8 mb-12">
        <h1 className="text-3xl font-black tracking-tight mb-2">My Performance History</h1>
        <p className="text-slate-500">Review your past attempts and track your improvement over time.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
            placeholder="Search by quiz name..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
          >
            <option value="all">All Results</option>
            <option value="passed">Passed Only</option>
            <option value="failed">Failed Only</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredResults.length > 0 ? filteredResults.map((result) => (
          <HistoryItem key={result.id} result={result} />
        )) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500">No quiz attempts found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface HistoryItemProps {
  result: QuizResult;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ result }) => {
  const isPassed = result.status === 'passed';

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6">
      <div className={cn(
        "size-16 rounded-2xl flex items-center justify-center font-black text-xl shrink-0",
        isPassed ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
      )}>
        {result.score}%
      </div>
      
      <div className="flex-1">
        <h3 className="text-lg font-bold mb-1">{result.quizTitle || 'Untitled Quiz'}</h3>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(result.completedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            {new Date(result.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-yellow-500" />
            Earned {result.xpEarned} XP
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className={cn(
          "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
          isPassed ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
        )}>
          {result.status}
        </div>
        <Link 
          to={`/quiz-review/${result.id}`}
          className="p-2 text-slate-400 hover:text-primary transition-colors"
        >
          <ChevronRight size={24} />
        </Link>
      </div>
    </div>
  );
};
