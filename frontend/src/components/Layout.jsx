import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, message, Badge } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ProjectOutlined,
  FileTextOutlined,
  TeamOutlined,
  WarningOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { slaApi } from '../services/api';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadWarnings();
  }, []);

  const loadWarnings = async () => {
    try {
      const response = await slaApi.getWarnings();
      setWarningCount(response.data.length);
    } catch (error) {
      console.error('加载预警失败:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: '/clients',
      icon: <UserOutlined />,
      label: '客户管理',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/positions',
      icon: <FileTextOutlined />,
      label: '岗位管理',
    },
    {
      key: '/candidates',
      icon: <TeamOutlined />,
      label: '候选人管理',
    },
    {
      key: '/sla-warnings',
      icon: <Badge count={warningCount} size="small"><WarningOutlined /></Badge>,
      label: 'SLA预警',
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getRoleName = (role) => {
    const roles = {
      admin: '管理员',
      manager: '项目经理',
      consultant: '招聘顾问',
      client_hr: '客户HR'
    };
    return roles[role] || role;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 'bold',
          background: 'rgba(255,255,255,0.1)'
        }}>
          {collapsed ? 'RMS' : '招聘管理平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          height: 64,
          lineHeight: '64px'
        }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user.name}</span>
              <span style={{ color: '#999', fontSize: 12 }}>({getRoleName(user.role)})</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
