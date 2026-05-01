import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import TemplateList from './pages/templates/List';
import TemplateCreate from './pages/templates/Create';
import SmsTaskList from './pages/sms/TaskList';
import SmsRecordList from './pages/sms/RecordList';
import SmsSend from './pages/sms/Send';
import ProviderList from './pages/providers/List';
import RuleList from './pages/rules/List';
import AuditLogList from './pages/audit/List';
import FinanceBalance from './pages/finance/Balance';
import FinanceConsumption from './pages/finance/Consumption';
import FinanceReport from './pages/finance/Report';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/templates" element={<TemplateList />} />
        <Route path="/templates/create" element={<TemplateCreate />} />
        <Route path="/templates/edit/:id" element={<TemplateCreate />} />
        
        <Route path="/sms/send" element={<SmsSend />} />
        <Route path="/sms/tasks" element={<SmsTaskList />} />
        <Route path="/sms/records" element={<SmsRecordList />} />
        
        <Route path="/providers" element={<ProviderList />} />
        <Route path="/rules" element={<RuleList />} />
        <Route path="/audit" element={<AuditLogList />} />
        
        <Route path="/finance/balance" element={<FinanceBalance />} />
        <Route path="/finance/consumption" element={<FinanceConsumption />} />
        <Route path="/finance/report" element={<FinanceReport />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
