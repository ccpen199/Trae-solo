import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Services from '@/pages/Services';
import ServiceDetail from '@/pages/ServiceDetail';
import ServiceApply from '@/pages/ServiceApply';
import Guide from '@/pages/Guide';
import Collaboration from '@/pages/Collaboration';
import Certificates from '@/pages/Certificates';
import MyApplications from '@/pages/MyApplications';
import Performance from '@/pages/admin/Performance';
import Policy from '@/pages/admin/Policy';
import DisasterRecovery from '@/pages/admin/DisasterRecovery';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/common';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth();
    setChecked(true);
  }, [checkAuth]);

  if (!checked || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gov-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gov-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const RoleHomeRedirect = () => {
  const { getDefaultRoute, user } = useAuthStore();
  const defaultRoute = getDefaultRoute();
  const navigate = useNavigate();

  useEffect(() => {
    if (defaultRoute !== '/') {
      navigate(defaultRoute, { replace: true });
    }
  }, [defaultRoute, navigate]);

  if (defaultRoute === '/') {
    return <Home />;
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gov-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gov-gray-400">正在进入{user?.name}的工作台...</p>
      </div>
    </div>
  );
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading, loginRole, getDefaultRoute, checkAuth } = useAuthStore();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth();
    setChecked(true);
  }, [checkAuth]);

  if (!checked || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gov-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const effectiveRole = loginRole || user?.userType;
  const adminAllowedRoles = ['staff', 'admin', 'platform', 'ops'];
  const isAdminAllowed = isAuthenticated && effectiveRole && adminAllowedRoles.includes(effectiveRole);

  if (!isAdminAllowed) {
    const defaultRoute = getDefaultRoute();
    return <Navigate to={defaultRoute} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const EnterpriseCollaboration = () => (
  <div className="gov-card p-8">
    <h1 className="text-2xl font-bold text-gov-gray-700 mb-6">企业开办"一网通办"</h1>
    <p className="text-gov-gray-500 mb-8">一站式完成工商注册、税务登记、公章刻制、社保开户、银行开户等全流程</p>
    <div className="text-center py-12">
      <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gov-gray-700 mb-2">功能开发中</h3>
      <p className="text-gov-gray-400">企业开办全流程一站式办理即将上线</p>
    </div>
  </div>
);

const NewbornCollaboration = () => (
  <div className="gov-card p-8">
    <h1 className="text-2xl font-bold text-gov-gray-700 mb-6">新生儿出生"一件事"</h1>
    <p className="text-gov-gray-500 mb-8">联办出生医学证明、户口登记、医保参保、预防接种证等事项</p>
    <div className="text-center py-12">
      <div className="w-24 h-24 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-12 h-12 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gov-gray-700 mb-2">功能开发中</h3>
      <p className="text-gov-gray-400">新生儿出生"一件事"联办即将上线</p>
    </div>
  </div>
);

const SystemSettings = () => (
  <div className="gov-card p-8">
    <h1 className="text-2xl font-bold text-gov-gray-700 mb-6">系统设置</h1>
    <div className="text-center py-12">
      <div className="w-24 h-24 rounded-full bg-gov-gray-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-12 h-12 text-gov-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gov-gray-700 mb-2">功能开发中</h3>
      <p className="text-gov-gray-400">系统设置功能即将上线</p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="h-screen flex items-center justify-center bg-gov-gray-50">
    <div className="text-center">
      <h1 className="text-9xl font-bold text-primary-500 mb-4">404</h1>
      <p className="text-xl text-gov-gray-500 mb-8">抱歉，您访问的页面不存在</p>
      <button
        onClick={() => window.location.href = '/'}
        className="gov-btn-primary"
      >
        返回首页
      </button>
    </div>
  </div>
);

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#165DFF',
          borderRadius: 8,
          fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif",
        },
        components: {
          Button: {
            colorPrimary: '#165DFF',
            algorithm: true,
          },
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<RoleHomeRedirect />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:id" element={<ServiceDetail />} />
            <Route path="services/:id/apply" element={<ServiceApply />} />
            <Route path="guide" element={<Guide />} />
            <Route path="collaboration" element={<Collaboration />} />
            <Route path="collaboration/enterprise" element={<EnterpriseCollaboration />} />
            <Route path="collaboration/newborn" element={<NewbornCollaboration />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="my-applications" element={<MyApplications />} />
            
            <Route path="admin">
              <Route path="dashboard" element={
                <AdminRoute>
                  <Performance />
                </AdminRoute>
              } />
              <Route path="policy" element={
                <AdminRoute>
                  <Policy />
                </AdminRoute>
              } />
              <Route path="disaster-recovery" element={
                <AdminRoute>
                  <DisasterRecovery />
                </AdminRoute>
              } />
              <Route path="system" element={
                <AdminRoute>
                  <SystemSettings />
                </AdminRoute>
              } />
            </Route>
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}
