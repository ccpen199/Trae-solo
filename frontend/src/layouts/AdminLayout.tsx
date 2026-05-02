import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, message } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  WarningOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthContext } from '../App';
import { roleNames } from '../store/auth';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { AdminReports } from '../pages/admin/Reports';
import { AdminMonitoring } from '../pages/admin/Monitoring';
import { AdminLogs } from '../pages/admin/Logs';

const { Header, Sider, Content } = Layout;

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '数据看板',
      onClick: () => navigate('/admin'),
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: '统计报告',
      onClick: () => navigate('/admin/reports'),
    },
    {
      key: '/admin/monitoring',
      icon: <WarningOutlined />,
      label: '异常监控',
      onClick: () => navigate('/admin/monitoring'),
    },
    {
      key: '/admin/logs',
      icon: <FileTextOutlined />,
      label: '操作日志',
      onClick: () => navigate('/admin/logs'),
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/admin') return ['/admin'];
    if (path.startsWith('/admin/reports')) return ['/admin/reports'];
    if (path.startsWith('/admin/monitoring')) return ['/admin/monitoring'];
    if (path.startsWith('/admin/logs')) return ['/admin/logs'];
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            政务办事预约系统
          </div>
          <div
            style={{
              color: '#8c8c8c',
              fontSize: 14,
              marginLeft: 16,
              borderLeft: '1px solid #434343',
              paddingLeft: 16,
            }}
          >
            {roleNames[user?.role as any] || '管理员'}端
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#fff' }}>欢迎，{user?.real_name}</span>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar size="small" icon={<UserOutlined />} />
          </Dropdown>
        </div>
      </Header>

      <Layout>
        <Sider width={200} theme="light" style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>

        <Layout style={{ padding: 24, background: '#f0f2f5' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minHeight: 360,
            }}
          >
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/reports" element={<AdminReports />} />
              <Route path="/monitoring" element={<AdminMonitoring />} />
              <Route path="/logs" element={<AdminLogs />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
