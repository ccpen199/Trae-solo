import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthCenter from './pages/AuthCenter';
import InsurancePlan from './pages/InsurancePlan';
import Calculator from './pages/Calculator';
import TransactionCenter from './pages/TransactionCenter';
import Certificates from './pages/Certificates';
import PolicyGraph from './pages/PolicyGraph';
import SupportCenter from './pages/SupportCenter';
import FinanceConsole from './pages/FinanceConsole';
import AdminDashboard from './pages/AdminDashboard';
import AdminPolicy from './pages/AdminPolicy';
import AdminMonitor from './pages/AdminMonitor';
import AdminAudit from './pages/AdminAudit';
import MainLayout from './components/MainLayout';
import AuthLayout from './components/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useUserStore } from './store/userStore';

const theme = {
  token: {
    colorPrimary: '#1E40AF',
    colorInfo: '#1E40AF',
    colorSuccess: '#059669',
    colorWarning: '#D97706',
    colorError: '#DC2626',
    borderRadius: 8,
    fontFamily: '"Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      siderBg: '#0F172A',
      bodyBg: '#F1F5F9',
      headerHeight: 64,
      triggerBg: '#0F172A',
    },
    Menu: {
      darkItemBg: '#0F172A',
      darkSubMenuItemBg: '#1E293B',
      darkItemSelectedBg: '#1E40AF',
      darkItemHoverBg: '#1E293B',
    },
    Card: {
      colorBorderSecondary: '#E2E8F0',
      boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(30, 64, 175, 0.1)',
    },
  },
};

function LoginPage() {
  const { isLoggedIn } = useUserStore();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  if (isLoggedIn) {
    return <Navigate to={from} replace />;
  }
  return (
    <AuthLayout>
      <Login />
    </AuthLayout>
  );
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          <Route path="/auth" element={<ProtectedPage><AuthCenter /></ProtectedPage>} />
          <Route path="/insurance" element={<ProtectedPage><InsurancePlan /></ProtectedPage>} />
          <Route path="/calculator" element={<ProtectedPage><Calculator /></ProtectedPage>} />
          <Route path="/transaction" element={<ProtectedPage><TransactionCenter /></ProtectedPage>} />
          <Route path="/certificates" element={<ProtectedPage><Certificates /></ProtectedPage>} />
          <Route path="/policy" element={<ProtectedPage><PolicyGraph /></ProtectedPage>} />
          <Route path="/support" element={<ProtectedPage><SupportCenter /></ProtectedPage>} />
          <Route path="/finance" element={<ProtectedPage><FinanceConsole /></ProtectedPage>} />
          <Route path="/admin" element={<ProtectedPage><AdminDashboard /></ProtectedPage>} />
          <Route path="/admin/dashboard" element={<ProtectedPage><AdminDashboard /></ProtectedPage>} />
          <Route path="/admin/policy" element={<ProtectedPage><AdminPolicy /></ProtectedPage>} />
          <Route path="/admin/monitor" element={<ProtectedPage><AdminMonitor /></ProtectedPage>} />
          <Route path="/admin/audit" element={<ProtectedPage><AdminAudit /></ProtectedPage>} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
