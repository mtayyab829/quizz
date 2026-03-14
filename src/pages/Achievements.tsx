import React, { useEffect, useState } from 'react';
import { Header } from '../components/Layout';
import { Trophy, Star, Zap, Target, Book, Award, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_quiz', title: 'First Step', description: 'Complete your first quiz', icon: Star, color: 'bg-yellow-500', xp: 50 },
  { id: 'perfect_score', title: 'Perfect Score', description: 'Get 100% on any quiz', icon: Target, color: 'bg-emerald-500', xp: 200 },
  { id: 'streak_3', title: 'On Fire', description: 'Complete quizzes 3 days in a row', icon: Zap, color: 'bg-orange-500', xp: 150 },
  { id: 'module_master', title: 'Module Master', description: 'Complete all quizzes in a module', icon: Book, color: 'bg-blue-500', xp: 500 },
  { id: 'xp_1000', title: 'XP Collector', description: 'Earn a total of 1,000 XP', icon: Award, color: 'bg-purple-500', xp: 300 },
  { id: 'speed_demon', title: 'Speed Demon', description: 'Finish a quiz in under 2 minutes', icon: Zap, color: 'bg-rose-500', xp: 100 },
];

export const AchievementsPage = () => {
  const { user } = useAuth();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'user_achievements'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.data().achievementId));
      setUnlockedIds(ids);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const unlockedCount = unlockedIds.size;

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <Header title="My Achievements" />
      
      <div className="mt-8 mb-12 flex flex-col md:flex-row items-center gap-8 bg-slate-900 text-white p-10 rounded-[40px] relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <h1 className="text-4xl font-black mb-4">Trophy Room</h1>
          <p className="text-slate-400 mb-6 max-w-md">You've unlocked {unlockedCount} out of {ACHIEVEMENT_DEFINITIONS.length} achievements. Keep pushing your limits to collect them all!</p>
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden max-w-xs">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000" 
              style={{ width: `${(unlockedCount / ACHIEVEMENT_DEFINITIONS.length) * 100}%` }}
            />
          </div>
          <p className="text-xs font-bold mt-2 text-primary uppercase tracking-widest">{Math.round((unlockedCount / ACHIEVEMENT_DEFINITIONS.length) * 100)}% Completed</p>
        </div>
        <div className="relative z-10 size-40 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10">
          <Trophy size={80} className="text-yellow-400" />
        </div>
        <div className="absolute top-[-20%] right-[-10%] size-80 bg-primary/20 rounded-full blur-[100px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ACHIEVEMENT_DEFINITIONS.map((achievement) => (
          <AchievementCard 
            key={achievement.id} 
            achievement={achievement} 
            unlocked={unlockedIds.has(achievement.id)} 
          />
        ))}
      </div>
    </div>
  );
};

interface AchievementCardProps {
  achievement: any;
  unlocked: boolean;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, unlocked }) => {
  const Icon = achievement.icon;
  
  return (
    <div className={cn(
      "p-6 rounded-3xl border transition-all duration-300 group",
      unlocked 
        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1" 
        : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-900 opacity-60 grayscale"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "size-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
          unlocked ? achievement.color : "bg-slate-300 dark:bg-slate-700"
        )}>
          <Icon size={28} />
        </div>
        {unlocked ? (
          <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-full">
            <CheckCircle2 size={16} />
          </div>
        ) : (
          <div className="text-slate-400">
            <Lock size={16} />
          </div>
        )}
      </div>
      
      <h3 className="text-lg font-black mb-1">{achievement.title}</h3>
      <p className="text-sm text-slate-500 mb-4">{achievement.description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reward</span>
        <div className="flex items-center gap-1 text-primary font-black">
          <Zap size={14} fill="currentColor" />
          <span>{achievement.xp} XP</span>
        </div>
      </div>
    </div>
  );
};
