import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  FileAddOutlined,
  AuditOutlined,
  ScissorOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  QrcodeOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import EntryRegistration from './pages/EntryRegistration';
import PreSlaughterInspection from './pages/PreSlaughterInspection';
import SlaughterProcess from './pages/SlaughterProcess';
import CertificationFlow from './pages/CertificationFlow';
import Dashboard from './pages/Dashboard';
import TracePage from './pages/TracePage';
import RecallManagement from './pages/RecallManagement';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/entry', icon: <FileAddOutlined />, label: '入场登记' },
  { key: '/inspection', icon: <AuditOutlined />, label: '宰前检疫' },
  { key: '/slaughter', icon: <ScissorOutlined />, label: '屠宰过程' },
  { key: '/certification', icon: <SafetyCertificateOutlined />, label: '出证与流向' },
  { key: '/recall', icon: <RollbackOutlined />, label: '召回管理' },
  { key: '/dashboard', icon: <DashboardOutlined />, label: '监管看板' },
  { key: '/trace-demo', icon: <QrcodeOutlined />, label: '扫码溯源' },
];

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = '/' + location.pathname.split('/')[1] || '/entry';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          屠宰检疫追溯
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>畜禽屠宰检疫追溯系统</h1>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280, overflow: 'auto' }}>
          <Routes>
            <Route path="/entry" element={<EntryRegistration />} />
            <Route path="/inspection" element={<PreSlaughterInspection />} />
            <Route path="/slaughter" element={<SlaughterProcess />} />
            <Route path="/certification" element={<CertificationFlow />} />
            <Route path="/recall" element={<RecallManagement />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trace-demo" element={<TracePage />} />
            <Route path="/trace/:certNo" element={<TracePage />} />
            <Route path="*" element={<Navigate to="/entry" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
