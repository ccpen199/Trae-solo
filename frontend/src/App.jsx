import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationList from './pages/ApplicationList';
import ApplicationDetail from './pages/ApplicationDetail';
import ApprovalList from './pages/ApprovalList';
import FinanceList from './pages/FinanceList';
import CCList from './pages/CCList';
import ArchiveList from './pages/ArchiveList';

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { user, loading } = useAuthContext();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="application/create" element={<ApplicationForm />} />
        <Route path="application/edit/:id" element={<ApplicationForm />} />
        <Route path="applications" element={<ApplicationList />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route 
          path="approval" 
          element={
            <ProtectedRoute requiredRoles={['approver', 'admin']}>
              <ApprovalList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="finance" 
          element={
            <ProtectedRoute requiredRoles={['finance', 'admin']}>
              <FinanceList />
            </ProtectedRoute>
          } 
        />
        <Route path="cc" element={<CCList />} />
        <Route path="archive" element={<ArchiveList />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
