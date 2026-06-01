import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Typography } from 'antd';
import {
  DashboardOutlined,
  VideoCameraOutlined,
  GiftOutlined,
  PartitionOutlined,
  AlertOutlined,
  DollarOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
  BugOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard.jsx';
import LiveSessions from './pages/LiveSessions.jsx';
import GiftTransactions from './pages/GiftTransactions.jsx';
import SharingRules from './pages/SharingRules.jsx';
import RiskControl from './pages/RiskControl.jsx';
import Settlements from './pages/Settlements.jsx';
import Streamers from './pages/Streamers.jsx';
import Unions from './pages/Unions.jsx';
import AdminOps from './pages/AdminOps.jsx';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/sessions', icon: <VideoCameraOutlined />, label: '直播场次' },
    { key: '/transactions', icon: <GiftOutlined />, label: '打赏流水' },
    { key: '/rules', icon: <PartitionOutlined />, label: '分账规则' },
    { key: '/risk', icon: <AlertOutlined />, label: '风控中心' },
    { key: '/settlements', icon: <DollarOutlined />, label: '结算对账' },
    { key: '/streamers', icon: <TeamOutlined />, label: '主播管理' },
    { key: '/unions', icon: <SettingOutlined />, label: '工会管理' },
    { key: '/admin', icon: <FileTextOutlined />, label: '操作日志' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={200}
      >
        <div style={{ padding: '16px', textAlign: 'center', color: '#fff' }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            {collapsed ? '直播' : '直播打赏分账'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ paddingLeft: 24, fontSize: 16, fontWeight: 500 }}>
            {menuItems.find(m => m.key === location.pathname)?.label || '系统'}
          </div>
        </Header>
        <Content style={{ margin: 16 }}>
          <div style={{ padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, minHeight: 'calc(100vh - 112px)' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sessions" element={<LiveSessions />} />
              <Route path="/transactions" element={<GiftTransactions />} />
              <Route path="/rules" element={<SharingRules />} />
              <Route path="/risk" element={<RiskControl />} />
              <Route path="/settlements" element={<Settlements />} />
              <Route path="/streamers" element={<Streamers />} />
              <Route path="/unions" element={<Unions />} />
              <Route path="/admin" element={<AdminOps />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}
