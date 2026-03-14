import React, { useState, useEffect } from 'react';
import { Header } from '../components/Layout';
import { 
  UserPlus, 
  FileDown, 
  Filter, 
  Edit2, 
  Trash2, 
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setUsers(usersData);
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
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Header title="User Management" />
      
      <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Administration</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage platform users, roles, and learning categories.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 transition-colors shadow-sm">
            <FileDown size={18} />
            Export Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatItem label="Total Users" value={users.length.toString()} icon="person" color="primary" />
        <StatItem label="Admins" value={users.filter(u => u.role === 'admin').length.toString()} icon="verified_user" color="emerald" />
        <StatItem label="Students" value={users.filter(u => u.role === 'student').length.toString()} icon="school" color="indigo" />
        <StatItem label="Total XP" value={users.reduce((acc, u) => acc + (u.totalXP || 0), 0).toLocaleString()} icon="stars" color="amber" />
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">User Management</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-sm appearance-none focus:ring-primary outline-none">
                <option>All Roles</option>
                <option>Admin</option>
                <option>Student</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Profile</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total XP</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="size-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {user.displayName.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">{user.displayName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold",
                      user.role === 'admin' ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600"
                    )}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-emerald-600">{(user.totalXP || 0).toLocaleString()} XP</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button className="text-slate-400 hover:text-red-500 transition-colors ml-2">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const StatItem = ({ label, value, icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
    <div className={cn("size-12 rounded-full flex items-center justify-center", `bg-${color}-100 text-${color}-600`)}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);
