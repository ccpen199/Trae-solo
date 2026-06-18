import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import TeamList from '@/pages/sanxiaxiang/TeamList';
import CreateTeam from '@/pages/sanxiaxiang/CreateTeam';
import TeamDetail from '@/pages/sanxiaxiang/TeamDetail';
import CheckIn from '@/pages/sanxiaxiang/CheckIn';
import Journals from '@/pages/sanxiaxiang/Journals';
import ProjectList from '@/pages/scholarship/ProjectList';
import ProjectDetail from '@/pages/scholarship/ProjectDetail';
import Stories from '@/pages/scholarship/Stories';
import NewsList from '@/pages/news/NewsList';
import NewsDetail from '@/pages/news/NewsDetail';
import ActivityList from '@/pages/activities/ActivityList';
import ActivityDetail from '@/pages/activities/ActivityDetail';
import BaseList from '@/pages/bases/BaseList';
import BaseApply from '@/pages/bases/BaseApply';
import CreditApply from '@/pages/credits/CreditApply';
import CreditAudit from '@/pages/credits/CreditAudit';
import Transcript from '@/pages/credits/Transcript';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Settings from '@/pages/settings/Settings';
import type { ReactNode } from 'react';

function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, _hydrated } = useAuthStore();
  const location = useLocation();

  if (!_hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function LoginGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, _hydrated } = useAuthStore();

  if (!_hydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginGuard>
              <Login />
            </LoginGuard>
          }
        />
        <Route
          path="/"
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="sanxiaxiang/teams" element={<TeamList />} />
          <Route path="sanxiaxiang/teams/create" element={<CreateTeam />} />
          <Route path="sanxiaxiang/teams/:id" element={<TeamDetail />} />
          <Route path="sanxiaxiang/checkin" element={<CheckIn />} />
          <Route path="sanxiaxiang/journals" element={<Journals />} />
          <Route path="scholarship/projects" element={<ProjectList />} />
          <Route path="scholarship/projects/:id" element={<ProjectDetail />} />
          <Route path="scholarship/stories" element={<Stories />} />
          <Route path="news" element={<NewsList />} />
          <Route path="news/:id" element={<NewsDetail />} />
          <Route path="activities" element={<ActivityList />} />
          <Route path="activities/:id" element={<ActivityDetail />} />
          <Route path="bases" element={<BaseList />} />
          <Route path="bases/apply" element={<BaseApply />} />
          <Route path="credits/apply" element={<CreditApply />} />
          <Route path="credits/audit" element={<CreditAudit />} />
          <Route path="credits/transcript" element={<Transcript />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
