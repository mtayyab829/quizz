import React, { useEffect, useState } from 'react';
import { Header } from '../components/Layout';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  ArrowRight, 
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Star,
  ChevronRight,
  History,
  Award,
  Users,
  Code,
  BarChart,
  Palette
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Module, QuizResult, Course } from '../types';

const iconMap: Record<string, any> = {
  'Code': Code,
  'BarChart': BarChart,
  'Palette': Palette,
  'BookOpen': BookOpen
};

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeQuizId, setResumeQuizId] = useState<string | null>(null);
  const [resumeSession, setResumeSession] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch active courses
    const coursesQuery = query(collection(db, 'courses'), where('status', '==', 'active'), limit(4));
    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[];
      setActiveCourses(coursesData);
    });

    // Fetch a quiz to resume (last active session)
    const resumeQuery = query(
      collection(db, 'quiz_sessions'), 
      where('userId', '==', user.uid),
      where('status', '==', 'active'),
      orderBy('lastUpdated', 'desc'),
      limit(1)
    );
    const unsubscribeResume = onSnapshot(resumeQuery, (snapshot) => {
      if (!snapshot.empty) {
        const session = snapshot.docs[0].data();
        setResumeQuizId(session.quizId);
        setResumeSession(session);
      } else {
        setResumeQuizId(null);
        setResumeSession(null);
      }
    });

    // Fetch achievements
    const achievementsQuery = query(collection(db, 'user_achievements'), where('userId', '==', user.uid), limit(5));
    const unsubscribeAchievements = onSnapshot(achievementsQuery, (snapshot) => {
      setAchievements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch recent results
    const resultsQuery = query(
      collection(db, 'results'), 
      where('studentId', '==', user.uid), 
      orderBy('completedAt', 'desc'),
      limit(5)
    );
    const unsubscribeResults = onSnapshot(resultsQuery, (snapshot) => {
      const resultsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QuizResult[];
      setRecentResults(resultsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'results');
    });

    return () => {
      unsubscribeCourses();
      unsubscribeResume();
      unsubscribeAchievements();
      unsubscribeResults();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Header title="Student Dashboard" />
      
      <div className="mt-8 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Welcome back, {user?.displayName?.split(' ')[0]}! 👋</h1>
          <p className="text-slate-500">You're doing great! You've earned <span className="text-primary font-bold">{user?.totalXP} XP</span> so far.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/leaderboard" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Users size={18} className="text-blue-500" /> Leaderboard
          </Link>
          <Link to="/achievements" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Award size={18} className="text-yellow-500" /> Achievements
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">My Learning Path</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step 2 of 10</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="size-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Zap size={40} fill="currentColor" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-xl font-bold mb-1">
                    {resumeSession ? `Continue: ${resumeSession.quizTitle}` : 'Start Learning'}
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">
                    {resumeSession 
                      ? `You were on question ${resumeSession.currentQuestion + 1}. Pick up where you left off!` 
                      : "Explore our courses and start your learning journey today."}
                  </p>
                  {resumeSession && (
                    <>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>Session Active</span>
                        <span>{new Date(resumeSession.lastUpdated).toLocaleTimeString()}</span>
                      </div>
                    </>
                  )}
                </div>
                <Link 
                  to={resumeQuizId ? `/active-quiz/${resumeQuizId}` : '#'} 
                  className={cn(
                    "px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all",
                    !resumeQuizId && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Resume Now
                </Link>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Active Courses</h3>
              <Link to="/courses" className="text-sm font-bold text-primary hover:underline">Browse All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCourses.length > 0 ? activeCourses.map(course => (
                <StudentCourseCard 
                  key={course.id}
                  id={course.id}
                  title={course.title} 
                  modulesCount={course.modulesCount} 
                  color={course.color || 'primary'}
                  icon={course.icon}
                />
              )) : (
                <div className="col-span-2 p-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-slate-500">No active courses found. Check back later!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold mb-6">My Progress</h3>
            <div className="space-y-6">
              <ProgressStat label="Total XP" value={user?.totalXP?.toLocaleString() || '0'} sub="Keep learning to earn more!" icon={Trophy} color="text-yellow-500" />
              <ProgressStat label="Quizzes Completed" value={recentResults.length.toString()} sub="Last 30 days" icon={CheckCircle2} color="text-emerald-500" />
              <ProgressStat label="Avg. Score" value={recentResults.length > 0 ? `${Math.round(recentResults.reduce((acc, r) => acc + (r.score / r.totalQuestions * 100), 0) / recentResults.length)}%` : '0%'} sub="Based on recent attempts" icon={Star} color="text-primary" />
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Recent Results</h3>
              <Link to="/history" className="text-xs font-bold text-primary hover:underline">View History</Link>
            </div>
            <div className="space-y-4">
              {recentResults.length > 0 ? recentResults.map(result => (
                <RecentResultItem 
                  key={result.id}
                  title={result.quizTitle || `Quiz ID: ${result.quizId.substring(0, 8)}...`} 
                  score={`${result.score}%`} 
                  date={new Date(result.completedAt).toLocaleDateString()} 
                  status={result.status} 
                />
              )) : (
                <p className="text-sm text-slate-500 text-center py-4">No results yet.</p>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Achievements</h3>
              <Link to="/achievements" className="text-xs font-bold text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {achievements.length > 0 ? achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{achievement.title}</p>
                    <p className="text-[10px] text-slate-500">Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4">
                  <Trophy className="text-slate-200 mx-auto mb-2" size={32} />
                  <p className="text-xs text-slate-500">No achievements yet. Complete quizzes to earn badges!</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const StudentCourseCard = ({ id, title, modulesCount, color, icon }: any) => {
  const Icon = iconMap[icon] || BookOpen;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-6">
        <div className={cn("size-12 rounded-xl flex items-center justify-center", `bg-${color}/10 text-${color}`)}>
          <Icon size={24} />
        </div>
        <div>
          <h4 className="font-bold">{title}</h4>
          <p className="text-xs text-slate-500">{modulesCount} Modules</p>
        </div>
      </div>
      <Link 
        to={`/courses/${id}/modules`} 
        className="w-full mt-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
      >
        View Course <ArrowRight size={16} />
      </Link>
    </div>
  );
};

const ProgressStat = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="flex items-center gap-4">
    <div className={cn("size-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center", color)}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  </div>
);

const RecentResultItem = ({ title, score, date, status }: any) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
    <div className="flex items-center gap-3">
      <div className={cn("size-2 rounded-full", status === 'passed' ? "bg-emerald-500" : "bg-red-500")} />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-[10px] text-slate-500">{date}</p>
      </div>
    </div>
    <span className={cn("text-xs font-black", status === 'passed' ? "text-emerald-600" : "text-red-600")}>{score}</span>
  </div>
);
