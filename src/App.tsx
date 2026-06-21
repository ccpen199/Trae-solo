import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Appraise from '@/pages/Appraise';
import Certificate from '@/pages/Certificate';
import Knowledge from '@/pages/Knowledge';
import KnowledgeDetail from '@/pages/KnowledgeDetail';
import Valuation from '@/pages/Valuation';
import Community from '@/pages/Community';
import CommunityDetail from '@/pages/CommunityDetail';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import UserProfile from '@/pages/UserProfile';
import UserOrders from '@/pages/UserOrders';
import UserCollections from '@/pages/UserCollections';
import ExpertDashboard from '@/pages/ExpertDashboard';
import ExpertTasks from '@/pages/ExpertTasks';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminExperts from '@/pages/AdminExperts';
import AdminDisputes from '@/pages/AdminDisputes';
import AdminTemplates from '@/pages/AdminTemplates';
import OpenApi from '@/pages/OpenApi';
import About from '@/pages/About';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Help from '@/pages/Help';
import Support from '@/pages/Support';
import Join from '@/pages/Join';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/"
          element={
            <AppLayout>
              <Home />
            </AppLayout>
          }
        />
        <Route
          path="/appraise"
          element={
            <AppLayout>
              <Appraise />
            </AppLayout>
          }
        />
        <Route
          path="/certificate"
          element={
            <AppLayout>
              <Certificate />
            </AppLayout>
          }
        />
        <Route
          path="/certificate/:id"
          element={
            <AppLayout>
              <Certificate />
            </AppLayout>
          }
        />
        <Route
          path="/knowledge"
          element={
            <AppLayout>
              <Knowledge />
            </AppLayout>
          }
        />
        <Route
          path="/knowledge/:id"
          element={
            <AppLayout>
              <KnowledgeDetail />
            </AppLayout>
          }
        />
        <Route
          path="/valuation"
          element={
            <AppLayout>
              <Valuation />
            </AppLayout>
          }
        />
        <Route
          path="/community"
          element={
            <AppLayout>
              <Community />
            </AppLayout>
          }
        />
        <Route
          path="/community/:id"
          element={
            <AppLayout>
              <CommunityDetail />
            </AppLayout>
          }
        />
        <Route
          path="/user/profile"
          element={
            <AppLayout>
              <UserProfile />
            </AppLayout>
          }
        />
        <Route
          path="/user/orders"
          element={
            <AppLayout>
              <UserOrders />
            </AppLayout>
          }
        />
        <Route
          path="/user/collections"
          element={
            <AppLayout>
              <UserCollections />
            </AppLayout>
          }
        />
        <Route
          path="/expert/dashboard"
          element={
            <AppLayout>
              <ExpertDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/expert/tasks"
          element={
            <AppLayout>
              <ExpertTasks />
            </AppLayout>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/admin/experts"
          element={
            <AppLayout>
              <AdminExperts />
            </AppLayout>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <AppLayout>
              <AdminDisputes />
            </AppLayout>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <AppLayout>
              <AdminTemplates />
            </AppLayout>
          }
        />
        <Route
          path="/openapi"
          element={
            <AppLayout>
              <OpenApi />
            </AppLayout>
          }
        />
        <Route
          path="/about"
          element={
            <AppLayout>
              <About />
            </AppLayout>
          }
        />
        <Route
          path="/terms"
          element={
            <AppLayout>
              <Terms />
            </AppLayout>
          }
        />
        <Route
          path="/privacy"
          element={
            <AppLayout>
              <Privacy />
            </AppLayout>
          }
        />
        <Route
          path="/help"
          element={
            <AppLayout>
              <Help />
            </AppLayout>
          }
        />
        <Route
          path="/support"
          element={
            <AppLayout>
              <Support />
            </AppLayout>
          }
        />
        <Route
          path="/join"
          element={
            <AppLayout>
              <Join />
            </AppLayout>
          }
        />

        <Route
          path="*"
          element={
            <AppLayout>
              <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <h1 className="font-serif text-6xl font-bold text-jade-700 mb-4">404</h1>
                <p className="text-jade-500 mb-8">页面不存在或已被移除</p>
              </div>
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}
