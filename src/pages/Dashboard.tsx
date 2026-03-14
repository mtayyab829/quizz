import React, { useEffect, useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Star, 
  Clock, 
  FileDown, 
  Plus,
  MoreVertical,
  Loader2,
  Database
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { collection, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { seedDatabase } from '../lib/seedData';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeQuizzes: 0,
    avgScore: 0,
    totalSessions: 0
  });
  const [trends, setTrends] = useState({
    totalUsers: { label: '0%', up: true },
    activeQuizzes: { label: '0%', up: true },
    avgScore: { label: '0%', up: true },
    totalSessions: { label: '0%', up: true }
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    await seedDatabase();
    setSeeding(false);
    // Refresh stats
    window.location.reload();
  };

  useEffect(() => {
    // Fetch stats
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const modulesSnap = await getDocs(collection(db, 'modules'));
        const resultsSnap = await getDocs(collection(db, 'results'));
        
        const totalUsers = usersSnap.size;
        const activeQuizzes = modulesSnap.docs.filter(d => d.data().status === 'active').length;
        
        let totalScore = 0;
        resultsSnap.forEach(doc => {
          const data = doc.data();
          totalScore += (data.score / data.totalQuestions) * 100;
        });
        const avgScore = resultsSnap.size > 0 ? Math.round(totalScore / resultsSnap.size) : 0;

        setStats({
          totalUsers,
          activeQuizzes,
          avgScore,
          totalSessions: resultsSnap.size
        });

        const toDate = (value: any) => {
          if (!value) return null;
          if (value.toDate) return value.toDate() as Date;
          if (typeof value === 'string' || typeof value === 'number') return new Date(value);
          return null;
        };

        const now = new Date();
        const startCurrent = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startPrev = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const inRange = (d: Date | null, start: Date, end: Date) => !!d && d >= start && d < end;
        const formatTrend = (current: number, prev: number) => {
          if (prev === 0 && current === 0) return { label: '0%', up: true };
          if (prev === 0 && current > 0) return { label: 'New', up: true };
          const delta = Math.round(((current - prev) / prev) * 100);
          return { label: `${delta > 0 ? '+' : ''}${delta}%`, up: delta >= 0 };
        };

        const usersDates = usersSnap.docs.map(d => toDate(d.data().createdAt));
        const usersCurrent = usersDates.filter(d => inRange(d, startCurrent, now)).length;
        const usersPrev = usersDates.filter(d => inRange(d, startPrev, startCurrent)).length;

        const modulesDates = modulesSnap.docs
          .filter(d => d.data().status === 'active')
          .map(d => toDate(d.data().createdAt));
        const modulesCurrent = modulesDates.filter(d => inRange(d, startCurrent, now)).length;
        const modulesPrev = modulesDates.filter(d => inRange(d, startPrev, startCurrent)).length;

        const results = resultsSnap.docs.map(d => d.data());
        const resultsCurrent = results.filter(r => inRange(toDate(r.completedAt), startCurrent, now));
        const resultsPrev = results.filter(r => inRange(toDate(r.completedAt), startPrev, startCurrent));

        const avgCurrent = resultsCurrent.length
          ? Math.round(resultsCurrent.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) / resultsCurrent.length)
          : 0;
        const avgPrev = resultsPrev.length
          ? Math.round(resultsPrev.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) / resultsPrev.length)
          : 0;

        const avgDelta = avgCurrent - avgPrev;
        const avgTrend = avgPrev === 0 && avgCurrent > 0
          ? { label: 'New', up: true }
          : { label: `${avgDelta > 0 ? '+' : ''}${avgDelta}%`, up: avgDelta >= 0 };

        setTrends({
          totalUsers: formatTrend(usersCurrent, usersPrev),
          activeQuizzes: formatTrend(modulesCurrent, modulesPrev),
          avgScore: avgTrend,
          totalSessions: formatTrend(resultsCurrent.length, resultsPrev.length)
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();

    // Fetch recent activity
    const q = query(collection(db, 'results'), orderBy('completedAt', 'desc'), limit(5));
    const unsubscribeActivity = onSnapshot(q, (snapshot) => {
      const activityData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentActivity(activityData);
      setLoading(false);
    });

    return () => unsubscribeActivity();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Admin Dashboard</h3>
          <p className="text-slate-500 dark:text-slate-400">System overview and performance metrics.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {seeding ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
            Seed Data
          </button>
          <Link to="/quiz-builder" className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <Plus size={18} /> New Quiz
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers.toLocaleString()} trend={trends.totalUsers.label} trendUp={trends.totalUsers.up} color="primary" />
        <StatCard icon={BookOpen} label="Active Modules" value={stats.activeQuizzes.toString()} trend={trends.activeQuizzes.label} trendUp={trends.activeQuizzes.up} color="purple-500" />
        <StatCard icon={Star} label="Average Score" value={`${stats.avgScore}%`} trend={trends.avgScore.label} trendUp={trends.avgScore.up} color="orange-500" />
        <StatCard icon={Clock} label="Total Attempts" value={stats.totalSessions.toString()} trend={trends.totalSessions.label} trendUp={trends.totalSessions.up} color="blue-500" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-lg font-bold">Recent Quiz Activity</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Quiz ID</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold">{activity.studentId.substring(0, 8)}...</td>
                  <td className="px-6 py-4 text-sm">{activity.quizId.substring(0, 8)}...</td>
                  <td className="px-6 py-4 text-sm font-bold">{activity.score}/{activity.totalQuestions}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(activity.completedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, trend, trendUp, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", `bg-${color}/10 text-${color}`)}>
        <Icon size={20} />
      </div>
      <span className={cn("text-xs font-bold px-2 py-1 rounded", trendUp ? "text-green-500 bg-green-50" : "text-red-500 bg-red-50")}>
        {trend}
      </span>
    </div>
    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
    <p className="text-3xl font-bold mt-1">{value}</p>
  </div>
);

const CategoryProgress = ({ label, value, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-slate-500">{value}%</span>
    </div>
    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
      <div className={cn("h-full", color)} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const ActivityRow = ({ user, initial, title, score, status, time, statusColor }: any) => (
  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{initial}</div>
        <span className="text-sm font-semibold">{user}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-sm">{title}</td>
    <td className="px-6 py-4">
      <span className="text-sm font-bold">{score}</span>
    </td>
    <td className="px-6 py-4">
      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold", statusColor)}>
        {status}
      </span>
    </td>
    <td className="px-6 py-4 text-xs text-slate-500">{time}</td>
    <td className="px-6 py-4 text-right">
      <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500">
        <MoreVertical size={18} />
      </button>
    </td>
  </tr>
);
