import { useState, useEffect } from 'react';
import { Layout, Menu, theme, Typography, Badge } from 'antd';
import {
  DashboardOutlined,
  CloudOutlined,
  AlertOutlined,
  SendOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import MonitorPage from './pages/MonitorPage';
import WarningPage from './pages/WarningPage';
import PublishPage from './pages/PublishPage';
import ReceiptPage from './pages/ReceiptPage';
import ReportPage from './pages/ReportPage';
import OpsLogPage from './pages/OpsLogPage';
import { reportApi } from './api';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '监测面板' },
  { key: '/warning', icon: <AlertOutlined />, label: '预警制作' },
  { key: '/publish', icon: <SendOutlined />, label: '发布管理' },
  { key: '/receipt', icon: <CheckCircleOutlined />, label: '回执与处置' },
  { key: '/report', icon: <BarChartOutlined />, label: '复盘报表' },
  { key: '/ops-log', icon: <FileTextOutlined />, label: '操作日志' },
];

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    reportApi.overview().then((data: any) => {
      setPendingCount(data.pending_receipts || 0);
      setAlertCount(data.total_alerts || 0);
    }).catch(() => {});
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 8 }}>
          <CloudOutlined style={{ fontSize: 24 }} />
          {!collapsed && <Title level={5} style={{ color: '#fff', margin: 0 }}>气象预警</Title>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.key === '/receipt' && pendingCount > 0
              ? <Badge count={pendingCount} size="small">{item.icon}</Badge>
              : item.key === '/' && alertCount > 0
              ? <Badge count={alertCount} size="small" offset={[6, -2]}>{item.icon}</Badge>
              : item.icon,
            label: item.label,
          }))}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={4} style={{ margin: 0 }}>
            {menuItems.find((m) => m.key === location.pathname)?.label || '气象灾害预警发布系统'}
          </Title>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<MonitorPage />} />
            <Route path="/warning" element={<WarningPage />} />
            <Route path="/publish" element={<PublishPage />} />
            <Route path="/receipt" element={<ReceiptPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/ops-log" element={<OpsLogPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}