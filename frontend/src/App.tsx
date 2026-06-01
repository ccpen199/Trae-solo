import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AgentList from './pages/AgentList';
import AgentDetail from './pages/AgentDetail';
import CustomerList from './pages/CustomerList';
import EmailGeneration from './pages/EmailGeneration';
import EmailList from './pages/EmailList';
import EmailDetail from './pages/EmailDetail';
import TemplateList from './pages/TemplateList';
import SendRecordList from './pages/SendRecordList';
import AuditLogs from './pages/AuditLogs';

function App() {
  const restoreAuth = useAuthStore((state) => state.restoreAuth);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      restoreAuth();
    } catch (e) {
      console.error('Restore auth error:', e);
      setHasError(true);
    }
  }, [restoreAuth]);

  if (hasError) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>系统出错了</h2>
        <p>请刷新页面重试</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: 16
      }}>
        系统加载中...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="agents" element={<AgentList />} />
        <Route path="agents/:id" element={<AgentDetail />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="emails" element={<EmailList />} />
        <Route path="emails/:id" element={<EmailDetail />} />
        <Route path="generate" element={<EmailGeneration />} />
        <Route path="templates" element={<TemplateList />} />
        <Route path="send-records" element={<SendRecordList />} />
        <Route path="audit" element={<AuditLogs />} />
      </Route>
    </Routes>
  );
}

export default App;
