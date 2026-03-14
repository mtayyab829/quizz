import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  BarChart3, 
  ShieldCheck,
  LogOut,
  GraduationCap,
  PlusCircle,
  Trophy,
  History,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export const Sidebar = () => {
  const { user, signOut } = useAuth();
  
  const menuItems = user?.role === 'admin' ? [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: BookOpen, label: 'Courses', href: '/courses' },
    { icon: GraduationCap, label: 'Student View', href: '/student-dashboard' },
    { icon: Users, label: 'User Management', href: '/users' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  ] : [
    { icon: GraduationCap, label: 'Dashboard', href: '/student-dashboard' },
    { icon: BookOpen, label: 'Courses', href: '/courses' },
    { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
    { icon: Award, label: 'Achievements', href: '/achievements' },
    { icon: History, label: 'Quiz History', href: '/history' },
  ];

  const settingItems = user?.role === 'admin' ? [
    { icon: Settings, label: 'Platform Settings', href: '/settings' },
    { icon: ShieldCheck, label: 'Audit Logs', href: '/audit-logs' },
  ] : [];

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg text-white">
          <GraduationCap size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">QuizMaster</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role === 'admin' ? 'Admin Control Panel' : 'Student Portal'}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="pb-2 pt-4">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Main Menu</p>
        </div>
        {menuItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {settingItems.length > 0 && (
          <>
            <div className="pb-2 pt-6">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Settings</p>
            </div>
            {settingItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
            {user?.photoURL ? (
              <img 
                className="w-full h-full object-cover" 
                src={user.photoURL} 
                alt={user.displayName}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.displayName}</p>
            <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role}</p>
          </div>
          <button 
            onClick={signOut}
            className="ml-auto p-1 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export const Header = ({ title }: { title: string }) => {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input 
            className="w-64 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
            placeholder="Search data..." 
            type="text"
          />
        </div>
        <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 relative">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
        </button>
        <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </button>
      </div>
    </header>
  );
};
