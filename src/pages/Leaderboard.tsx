import React, { useEffect, useState } from 'react';
import { Header } from '../components/Layout';
import { Trophy, Medal, Crown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export const LeaderboardPage = () => {
  const { user: currentUser } = useAuth();
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as User[];
      setLeaders(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <Header title="Global Leaderboard" />
      
      <div className="mt-8 mb-12 text-center">
        <h1 className="text-4xl font-black tracking-tight mb-4">Hall of Fame</h1>
        <p className="text-slate-500 max-w-lg mx-auto">Compete with students worldwide and climb the ranks to become the ultimate QuizMaster.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {leaders.slice(0, 3).map((leader, index) => (
          <TopThreeCard 
            key={leader.uid} 
            user={leader} 
            rank={index + 1} 
            isCurrentUser={leader.uid === currentUser?.uid}
          />
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-6">Rank</th>
                <th className="px-8 py-6">Student</th>
                <th className="px-8 py-6">Experience</th>
                <th className="px-8 py-6 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaders.slice(3).map((leader, index) => (
                <LeaderboardRow 
                  key={leader.uid} 
                  user={leader} 
                  rank={index + 4} 
                  isCurrentUser={leader.uid === currentUser?.uid}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface TopThreeCardProps {
  user: User;
  rank: number;
  isCurrentUser: boolean;
}

const TopThreeCard: React.FC<TopThreeCardProps> = ({ user, rank, isCurrentUser }) => {
  const colors = [
    'from-yellow-400 to-orange-500',
    'from-slate-300 to-slate-400',
    'from-orange-400 to-orange-600'
  ];
  
  const Icons = [Crown, Medal, Trophy];
  const Icon = Icons[rank - 1];

  return (
    <div className={cn(
      "relative p-8 rounded-3xl bg-gradient-to-br text-white shadow-2xl flex flex-col items-center text-center transition-transform hover:scale-105",
      colors[rank - 1],
      isCurrentUser && "ring-4 ring-primary ring-offset-4 dark:ring-offset-slate-950"
    )}>
      <div className="absolute -top-4 -right-4 size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-xl">
        #{rank}
      </div>
      <div className="size-24 rounded-full border-4 border-white/30 p-1 mb-4">
        <img 
          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
          className="w-full h-full rounded-full object-cover bg-white/10" 
          alt={user.displayName}
          referrerPolicy="no-referrer"
        />
      </div>
      <Icon className="mb-2" size={32} />
      <h3 className="text-xl font-black truncate w-full px-4">{user.displayName}</h3>
      <p className="text-white/80 font-bold">{user.totalXP.toLocaleString()} XP</p>
      {isCurrentUser && <span className="mt-4 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">That's You!</span>}
    </div>
  );
};

interface LeaderboardRowProps {
  user: User;
  rank: number;
  isCurrentUser: boolean;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ user, rank, isCurrentUser }) => (
  <tr className={cn(
    "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
    isCurrentUser && "bg-primary/5 dark:bg-primary/10"
  )}>
    <td className="px-8 py-6">
      <span className="text-lg font-black text-slate-400">#{rank}</span>
    </td>
    <td className="px-8 py-6">
      <div className="flex items-center gap-4">
        <img 
          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
          className="size-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800" 
          alt={user.displayName}
          referrerPolicy="no-referrer"
        />
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{user.displayName}</p>
          {isCurrentUser && <span className="text-[10px] font-bold text-primary uppercase">You</span>}
        </div>
      </div>
    </td>
    <td className="px-8 py-6">
      <div className="flex items-center gap-2">
        <Trophy size={16} className="text-yellow-500" />
        <span className="font-black text-slate-700 dark:text-slate-300">{user.totalXP.toLocaleString()}</span>
      </div>
    </td>
    <td className="px-8 py-6 text-right">
      <div className="inline-flex items-center gap-1 text-emerald-500 font-bold text-xs">
        <ArrowUp size={14} /> 2
      </div>
    </td>
  </tr>
);
