import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import MainLayout from './components/Layout';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import HomePage from './pages/Home';
import FeedPage from './pages/Feed';
import PostDetailPage from './pages/PostDetail';
import CreatePostPage from './pages/CreatePost';
import MerchantsPage from './pages/Merchants';
import MerchantDetailPage from './pages/MerchantDetail';
import HelpPage from './pages/Help';
import HelpDetailPage from './pages/HelpDetail';
import CreateHelpPage from './pages/CreateHelp';
import UtilitiesPage from './pages/Utilities';
import ProfilePage from './pages/Profile';
import AdminLayout from './components/AdminLayout';
import AuditDashboard from './pages/admin/AuditDashboard';
import GovernanceDashboard from './pages/admin/GovernanceDashboard';
import MerchantAnalytics from './pages/admin/MerchantAnalytics';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, token, login } = useAuthStore();
  const [demoLoginPending, setDemoLoginPending] = React.useState(false);
  const [demoLoginFailed, setDemoLoginFailed] = React.useState(false);

  React.useEffect(() => {
    if (token || demoLoginPending || demoLoginFailed) return;
    setDemoLoginPending(true);
    login('13800000000', '123456')
      .catch(() => setDemoLoginFailed(true))
      .finally(() => setDemoLoginPending(false));
  }, [token, demoLoginPending, demoLoginFailed, login]);

  if (!token && !demoLoginFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600">
        管理后台演示账号登录中...
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN' && user?.role !== 'GOVERNMENT') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App: React.FC = () => {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="posts/:id" element={<PostDetailPage />} />
        <Route path="create" element={<PrivateRoute><CreatePostPage /></PrivateRoute>} />
        <Route path="merchants" element={<MerchantsPage />} />
        <Route path="merchants/:id" element={<MerchantDetailPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="help/:id" element={<HelpDetailPage />} />
        <Route path="help/create" element={<PrivateRoute><CreateHelpPage /></PrivateRoute>} />
        <Route path="utilities" element={<UtilitiesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Navigate to="/admin/audit" replace />} />
        <Route path="audit" element={<AuditDashboard />} />
        <Route path="governance" element={<GovernanceDashboard />} />
        <Route path="merchant/:id" element={<MerchantAnalytics />} />
      </Route>
    </Routes>
  );
};

export default App;
