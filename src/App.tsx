import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/login"
            element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            }
          />
          <Route
            path="/auth"
            element={
              <MainLayout>
                <AuthCenter />
              </MainLayout>
            }
          />
          <Route
            path="/insurance"
            element={
              <MainLayout>
                <InsurancePlan />
              </MainLayout>
            }
          />
          <Route
            path="/calculator"
            element={
              <MainLayout>
                <Calculator />
              </MainLayout>
            }
          />
          <Route
            path="/transaction"
            element={
              <MainLayout>
                <TransactionCenter />
              </MainLayout>
            }
          />
          <Route
            path="/certificates"
            element={
              <MainLayout>
                <Certificates />
              </MainLayout>
            }
          />
          <Route
            path="/policy"
            element={
              <MainLayout>
                <PolicyGraph />
              </MainLayout>
            }
          />
          <Route
            path="/support"
            element={
              <MainLayout>
                <SupportCenter />
              </MainLayout>
            }
          />
          <Route
            path="/finance"
            element={
              <MainLayout>
                <FinanceConsole />
              </MainLayout>
            }
          />
          <Route
            path="/admin"
            element={
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/admin/policy"
            element={
              <MainLayout>
                <AdminPolicy />
              </MainLayout>
            }
          />
          <Route
            path="/admin/monitor"
            element={
              <MainLayout>
                <AdminMonitor />
              </MainLayout>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <MainLayout>
                <AdminAudit />
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
