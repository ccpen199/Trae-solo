import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/user/HomePage';
import RankingPage from '@/pages/user/RankingPage';
import ReportDetailPage from '@/pages/user/ReportDetailPage';
import ComparePage from '@/pages/user/ComparePage';
import CategoryPage from '@/pages/user/CategoryPage';
import SearchPage from '@/pages/user/SearchPage';
import BrandRegister from '@/pages/brand/BrandRegister';
import BrandDashboard from '@/pages/brand/BrandDashboard';
import ReputationBoard from '@/pages/brand/ReputationBoard';
import AppealPage from '@/pages/brand/AppealPage';
import BrandLayout from '@/pages/brand/BrandLayout';
import ReviewerDashboard from '@/pages/reviewer/ReviewerDashboard';
import TaskHall from '@/pages/reviewer/TaskHall';
import MyReports from '@/pages/reviewer/MyReports';
import QualityScore from '@/pages/reviewer/QualityScore';
import ReviewerLayout from '@/pages/reviewer/ReviewerLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import PlanScheduler from '@/pages/admin/PlanScheduler';
import ReviewWorkflow from '@/pages/admin/ReviewWorkflow';
import AdminLayout from '@/pages/admin/AdminLayout';
import AppealHandler from '@/pages/admin/AppealHandler';
import WeightConfig from '@/pages/admin/WeightConfig';
import { useAuthStore } from '@/store/authStore';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-slate-100 font-sans">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rankings" element={<RankingPage />} />
          <Route path="/rankings/:category" element={<RankingPage />} />
          <Route path="/report/:id" element={<ReportDetailPage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/brand/register" element={<BrandRegister />} />

          <Route
            path="/brand/*"
            element={
              <ProtectedRoute role="brand">
                <BrandLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<BrandDashboard />} />
            <Route path="reputation" element={<ReputationBoard />} />
            <Route path="appeal" element={<AppealPage />} />
          </Route>

          <Route
            path="/reviewer/*"
            element={
              <ProtectedRoute role="reviewer">
                <ReviewerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ReviewerDashboard />} />
            <Route path="tasks" element={<TaskHall />} />
            <Route path="reports" element={<MyReports />} />
            <Route path="quality" element={<QualityScore />} />
          </Route>

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="plans" element={<PlanScheduler />} />
            <Route path="reviews" element={<ReviewWorkflow />} />
            <Route path="appeals" element={<AppealHandler />} />
            <Route path="weights" element={<WeightConfig />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
