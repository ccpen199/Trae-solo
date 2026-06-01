import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  SettingOutlined,
  FileTextOutlined,
  HistoryOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const roleLabels = {
  platform_engineer: '平台工程师',
  ops: '运维',
  developer: '开发者',
  app_owner: '应用负责人',
  security_admin: '安全管理员'
};

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/applications', icon: <AppstoreOutlined />, label: '应用管理' },
    { key: '/configs', icon: <SettingOutlined />, label: '配置管理' },
    { key: '/tasks', icon: <FileTextOutlined />, label: '执行任务' },
    { key: '/change-orders', icon: <SafetyCertificateOutlined />, label: '变更单管理' },
    { key: '/logs', icon: <HistoryOutlined />, label: '调用日志' },
    { key: '/alerts', icon: <AlertOutlined />, label: '告警中心' },
    ...(hasRole('platform_engineer', 'security_admin') ? [{
      key: '/audit',
      icon: <SafetyCertificateOutlined />,
      label: '权限审计'
    }] : [])
  ];

  const userMenu = {
    items: [
      {
        key: 'user',
        label: `${user?.realName} (${roleLabels[user?.role] || user?.role})`,
        disabled: true
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          logout();
          navigate('/login');
        }
      }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{ background: '#001529' }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 20 : 16,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? <SafetyCertificateOutlined /> : 'MFA 管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={userMenu}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.realName}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
