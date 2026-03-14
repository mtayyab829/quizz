import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { ModulesPage } from './pages/Modules';
import { UsersPage } from './pages/Users';
import { AnalyticsPage } from './pages/Analytics';
import { SettingsPage } from './pages/Settings';
import { AuditLogsPage } from './pages/AuditLogs';
import { QuizBuilderPage } from './pages/QuizBuilder';
import { LoginPage, SignupPage } from './pages/Auth';
import { StudentDashboard } from './pages/StudentDashboard';
import { ActiveQuizPage } from './pages/ActiveQuiz';
import { LeaderboardPage } from './pages/Leaderboard';
import { AchievementsPage } from './pages/Achievements';
import { QuizHistoryPage } from './pages/QuizHistory';
import { QuizReviewPage } from './pages/QuizReview';
import { ModuleDetailPage } from './pages/ModuleDetail';
import { CoursesPage } from './pages/Courses';
import { CourseDetailPage } from './pages/CourseDetail';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/student-dashboard" />;
  }

  return <>{children}</>;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen">
    <Sidebar />
    <main className="flex-1 bg-background-light dark:bg-background-dark overflow-y-auto">
      {children}
    </main>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route path="/" element={<ProtectedRoute adminOnly><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><AppLayout><CoursesPage /></AppLayout></ProtectedRoute>} />
          <Route path="/courses/:courseId" element={<ProtectedRoute adminOnly><AppLayout><CourseDetailPage /></AppLayout></ProtectedRoute>} />
          <Route path="/courses/:courseId/modules" element={<ProtectedRoute><AppLayout><ModulesPage /></AppLayout></ProtectedRoute>} />
          <Route path="/modules/:moduleId" element={<ProtectedRoute><AppLayout><ModuleDetailPage /></AppLayout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute adminOnly><AppLayout><UsersPage /></AppLayout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute adminOnly><AppLayout><AnalyticsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute adminOnly><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute adminOnly><AppLayout><AuditLogsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/quiz-builder" element={<ProtectedRoute adminOnly><AppLayout><QuizBuilderPage /></AppLayout></ProtectedRoute>} />
          
          <Route path="/student-dashboard" element={<ProtectedRoute><AppLayout><StudentDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><AppLayout><LeaderboardPage /></AppLayout></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><AppLayout><AchievementsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><AppLayout><QuizHistoryPage /></AppLayout></ProtectedRoute>} />
          <Route path="/quiz-review/:resultId" element={<ProtectedRoute><AppLayout><QuizReviewPage /></AppLayout></ProtectedRoute>} />
          <Route path="/active-quiz/:quizId" element={<ProtectedRoute><ActiveQuizPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
