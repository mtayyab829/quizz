import React, { useState, useEffect } from 'react';
import { Header } from '../components/Layout';
import { 
  Search, 
  Filter, 
  Download,
  Calendar,
  User,
  Shield,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching audit logs:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Header title="System Audit Logs" />
      
      <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all" 
            placeholder="Search logs by action, user, or details..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-bold">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <LogLoader key={log.id} log={log} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LogLoader = ({ log }: any) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'bg-emerald-100 text-emerald-700';
      case 'failed': return 'bg-rose-100 text-rose-700';
      case 'warning': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getActionIcon = (action: string) => {
    if (action?.includes('Login')) return <User size={14} className="text-blue-500" />;
    if (action?.includes('Security')) return <Shield size={14} className="text-rose-500" />;
    return <Calendar size={14} className="text-slate-400" />;
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-6 py-4">
        <div className="text-sm font-medium">{new Date(log.timestamp?.toDate ? log.timestamp.toDate() : log.timestamp).toLocaleString()}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
            {log.userEmail?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm">{log.userEmail}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          {getActionIcon(log.action)}
          {log.action}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-500 max-w-xs truncate">{log.details}</div>
      </td>
      <td className="px-6 py-4">
        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
          {log.ipAddress || '127.0.0.1'}
        </code>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase", getStatusColor(log.status || 'success'))}>
          {log.status || 'Success'}
        </span>
      </td>
    </tr>
  );
};
