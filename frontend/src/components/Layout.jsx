import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  AuditOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getMenuItems = () => {
    const items = [
      {
        key: '/',
        icon: <FileTextOutlined />,
        label: '案件列表',
        onClick: () => navigate('/'),
      },
    ];

    if (isManager()) {
      items.push(
        {
          key: '/users',
          icon: <TeamOutlined />,
          label: '用户管理',
          onClick: () => navigate('/users'),
        },
        {
          key: '/audit',
          icon: <AuditOutlined />,
          label: '审计日志',
          onClick: () => navigate('/audit'),
        }
      );
    }

    return items;
  };

  const roleLabels = {
    manager: '管理员',
    lawyer: '律师',
    assistant: '助理',
    client: '客户',
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)' }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            {collapsed ? 'ECS' : '证据目录系统'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <div>
                <div style={{ fontWeight: 500 }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{roleLabels[user?.role]}</div>
              </div>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
