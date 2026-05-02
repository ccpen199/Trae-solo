import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, message } from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  NumberOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuthContext } from '../App';
import { roleNames } from '../store/auth';
import { WindowHome } from '../pages/window/Home';
import { QueuePage } from '../pages/window/Queue';

const { Header, Sider, Content } = Layout;

export const WindowLayout: React.FC = () => {
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
      key: '/window',
      icon: <FileTextOutlined />,
      label: '窗口工作台',
      onClick: () => navigate('/window'),
    },
    {
      key: '/window/queue',
      icon: <NumberOutlined />,
      label: '叫号队列',
      onClick: () => navigate('/window/queue'),
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
    if (path === '/window') return ['/window'];
    if (path.startsWith('/window/queue')) return ['/window/queue'];
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
            {roleNames[user?.role as any] || '窗口人员'}端
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
              <Route path="/" element={<WindowHome />} />
              <Route path="/queue" element={<QueuePage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
