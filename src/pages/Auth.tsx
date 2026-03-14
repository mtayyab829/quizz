import React from 'react';
import { 
  Github, 
  Chrome,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export const LoginPage = () => {
  const { user, loading, signingIn, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/' : '/student-dashboard'} />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter">QuizMaster</span>
          </div>
          <h1 className="text-6xl font-black leading-tight mb-6">
            The Future of <br />
            <span className="text-white/60">Learning Management.</span>
          </h1>
          <p className="text-xl text-white/80 max-w-md">
            Empower your team with interactive quizzes, real-time analytics, and personalized learning paths.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-4">
            {[1,2,3,4].map(i => (
              <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} className="size-12 rounded-full border-4 border-primary" alt="User" referrerPolicy="no-referrer" />
            ))}
          </div>
          <p className="text-sm font-medium">Joined by 10,000+ educators worldwide</p>
        </div>

        <div className="absolute top-[-10%] right-[-10%] size-[500px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] size-[600px] bg-black/10 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to access your dashboard</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={signInWithGoogle}
              disabled={signingIn}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm",
                signingIn && "opacity-50 cursor-not-allowed"
              )}
            >
              {signingIn ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
              ) : (
                <Chrome size={20} className="text-primary" />
              )}
              {signingIn ? 'Signing in...' : 'Continue with Google'}
            </button>
            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm opacity-50 cursor-not-allowed">
              <Github size={20} />
              Continue with GitHub
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 dark:bg-slate-950 px-2 text-slate-500 font-bold">Secure Access</span></div>
          </div>

          <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex gap-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Student Access</p>
                <p className="text-xs text-slate-500 mt-1">New students are automatically assigned the student role upon first sign-in.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SignupPage = () => <LoginPage />;
