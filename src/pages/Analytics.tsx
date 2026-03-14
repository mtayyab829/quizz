import React, { useState, useEffect } from 'react';
import { Header } from '../components/Layout';
import { 
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Eye,
  Search,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { cn } from '../lib/utils';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avgScore: 0,
    passRate: 0,
    totalQuizzes: 0,
    topStudents: [] as any[],
    results: [] as any[]
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const resultsSnap = await getDocs(query(collection(db, 'results'), orderBy('completedAt', 'desc')));
        const usersSnap = await getDocs(collection(db, 'users'));
        
        const usersMap = new Map();
        usersSnap.docs.forEach(doc => {
          usersMap.set(doc.id, doc.data());
        });

        const results = resultsSnap.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            studentName: usersMap.get(data.studentId)?.displayName || 'Unknown Student'
          };
        });
        
        // Calculate Avg Score
        let totalScore = 0;
        let passedCount = 0;
        results.forEach((r: any) => {
          totalScore += r.score;
          if (r.status === 'passed') passedCount++;
        });
        const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
        const passRate = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;

        // Top Students (by XP)
        const topStudentsQuery = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(4));
        const topStudentsSnap = await getDocs(topStudentsQuery);
        const topStudents = topStudentsSnap.docs.map(doc => doc.data());

        setStats({
          avgScore,
          passRate,
          totalQuizzes: results.length,
          topStudents,
          results: results.slice(0, 10)
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Header title="Analytics & Reports" />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Average Quiz Scores</h3>
              <p className="text-sm text-slate-500">Student performance over time</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{stats.avgScore}%</span>
              <div className="flex items-center text-emerald-500 text-xs font-semibold">
                <ArrowUpRight size={14} /> 5.2%
              </div>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{v: 60}, {v: 70}, {v: 65}, {v: stats.avgScore}]}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#257bf4" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#257bf4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#257bf4" strokeWidth={3} fill="url(#scoreGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Pass Rate</h3>
              <p className="text-sm text-slate-500">Percentage of quizzes passed</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{stats.passRate}%</span>
              <div className="flex items-center text-emerald-500 text-xs font-semibold">
                <ArrowUpRight size={14} /> Real-time
              </div>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{n: 'Total', v: stats.totalQuizzes}, {n: 'Pass', v: Math.round(stats.totalQuizzes * (stats.passRate / 100))}]}>
                <Bar dataKey="v" fill="#10b981" radius={[4, 4, 0, 0]} />
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-6">Top Performing Students</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.topStudents.map((student, i) => (
            <StudentCard key={i} name={student.displayName} score={student.totalXP} avatar={student.photoURL} />
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold">Detailed Quiz Breakdown</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary outline-none" placeholder="Search students..." type="text"/>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-bold">
                <th className="px-6 py-3">Student ID</th>
                <th className="px-6 py-3">Quiz ID</th>
                <th className="px-6 py-3 text-center">Score</th>
                <th className="px-6 py-3">Date Completed</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.results.map((r, i) => (
                <BreakdownRow 
                  key={i} 
                  name={r.studentName} 
                  quiz={r.quizTitle || r.quizId.substring(0, 8)} 
                  score={`${r.score}%`} 
                  date={new Date(r.completedAt).toLocaleDateString()} 
                  scoreColor={r.status === 'passed' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"} 
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StudentCard = ({ name, score, avatar }: any) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
    <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-100">
      {avatar ? (
        <img className="w-full h-full object-cover" src={avatar} alt={name} referrerPolicy="no-referrer" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
          {name?.[0]}
        </div>
      )}
    </div>
    <div>
      <h4 className="font-bold text-sm">{name}</h4>
      <p className="text-xs text-slate-500">{score} XP</p>
      <div className="flex mt-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    </div>
  </div>
);

const BreakdownRow = ({ name, quiz, score, date, scoreColor }: any) => (
  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
    <td className="px-6 py-4 text-sm font-medium">{name}</td>
    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{quiz}</td>
    <td className="px-6 py-4 text-center">
      <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", scoreColor)}>{score}</span>
    </td>
    <td className="px-6 py-4 text-sm text-slate-500">{date}</td>
    <td className="px-6 py-4 text-right">
      <button className="text-primary hover:text-primary/80 transition-colors">
        <Eye size={18} />
      </button>
    </td>
  </tr>
);
