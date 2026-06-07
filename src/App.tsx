import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Enterprises from '@/pages/Enterprises';
import Services from '@/pages/Services';
import ServiceGuide from '@/pages/ServiceGuide';
import Policies from '@/pages/Policies';
import Appeals from '@/pages/Appeals';
import Credit from '@/pages/Credit';
import Bidding from '@/pages/Bidding';
import SupplyChain from '@/pages/SupplyChain';
import Materials from '@/pages/Materials';
import Finance from '@/pages/Finance';
import { useAuthStore } from '@/store/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state._isInitialized);
  const location = useLocation();

  console.log('[ProtectedRoute] isInitialized:', isInitialized, 'isAuthenticated:', isAuthenticated);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a56db] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] 未认证, 跳转到 /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('[ProtectedRoute] 已认证, 渲染页面');
  return <Layout>{children}</Layout>;
}

export default function App() {
  const initializeFromStorage = useAuthStore((state) => state.initializeFromStorage);

  useEffect(() => {
    console.log('[App] 应用启动, 初始化认证状态...');
    initializeFromStorage();
  }, [initializeFromStorage]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/enterprises" element={
          <ProtectedRoute>
            <Enterprises />
          </ProtectedRoute>
        } />
        <Route path="/services" element={
          <ProtectedRoute>
            <Services />
          </ProtectedRoute>
        } />
        <Route path="/services/guide" element={
          <ProtectedRoute>
            <ServiceGuide />
          </ProtectedRoute>
        } />
        <Route path="/policies" element={
          <ProtectedRoute>
            <Policies />
          </ProtectedRoute>
        } />
        <Route path="/appeals" element={
          <ProtectedRoute>
            <Appeals />
          </ProtectedRoute>
        } />
        <Route path="/credit" element={
          <ProtectedRoute>
            <Credit />
          </ProtectedRoute>
        } />
        <Route path="/bidding" element={
          <ProtectedRoute>
            <Bidding />
          </ProtectedRoute>
        } />
        <Route path="/supply-chain" element={
          <ProtectedRoute>
            <SupplyChain />
          </ProtectedRoute>
        } />
        <Route path="/materials" element={
          <ProtectedRoute>
            <Materials />
          </ProtectedRoute>
        } />
        <Route path="/finance" element={
          <ProtectedRoute>
            <Finance />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
