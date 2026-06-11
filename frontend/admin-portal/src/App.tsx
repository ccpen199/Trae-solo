import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import UserManage from './pages/auth/UserManage';
import RoleManage from './pages/auth/RoleManage';
import AuditLog from './pages/auth/AuditLog';
import ApiManage from './pages/data/ApiManage';
import DataPermission from './pages/data/DataPermission';
import DesensitizeRule from './pages/data/DesensitizeRule';
import CertificateManage from './pages/certificate/CertificateManage';
import TemplateManage from './pages/certificate/TemplateManage';
import PolicyManage from './pages/subsidy/PolicyManage';
import GrantManage from './pages/subsidy/GrantManage';
import FundTrace from './pages/subsidy/FundTrace';
import RiskWarning from './pages/subsidy/RiskWarning';
import ServiceMonitor from './pages/monitor/ServiceMonitor';
import AlertManage from './pages/monitor/AlertManage';
import SlaManage from './pages/monitor/SlaManage';
import TicketManage from './pages/ticket/TicketManage';
import DispatchRule from './pages/ticket/DispatchRule';
import KnowledgeBase from './pages/ticket/KnowledgeBase';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="auth/user" element={<UserManage />} />
        <Route path="auth/role" element={<RoleManage />} />
        <Route path="auth/audit" element={<AuditLog />} />
        <Route path="data/api" element={<ApiManage />} />
        <Route path="data/permission" element={<DataPermission />} />
        <Route path="data/desensitize" element={<DesensitizeRule />} />
        <Route path="certificate/manage" element={<CertificateManage />} />
        <Route path="certificate/template" element={<TemplateManage />} />
        <Route path="subsidy/policy" element={<PolicyManage />} />
        <Route path="subsidy/grant" element={<GrantManage />} />
        <Route path="subsidy/fund" element={<FundTrace />} />
        <Route path="subsidy/risk" element={<RiskWarning />} />
        <Route path="monitor/service" element={<ServiceMonitor />} />
        <Route path="monitor/alert" element={<AlertManage />} />
        <Route path="monitor/sla" element={<SlaManage />} />
        <Route path="ticket/manage" element={<TicketManage />} />
        <Route path="ticket/dispatch" element={<DispatchRule />} />
        <Route path="ticket/knowledge" element={<KnowledgeBase />} />
      </Route>
    </Routes>
  );
};

export default App;
