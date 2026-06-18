import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
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
