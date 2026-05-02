import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Tag, Space } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  LogoutOutlined,
  UserOutlined,
  FileDoneOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLegalExpert } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'user',
        label: (
          <div>
            <strong>{user?.realName || user?.username}</strong>
            <div style={{ fontSize: 12, color: '#999' }}>
              {user?.role === 'legal_expert' ? '法务专家' : 
               user?.role === 'admin' ? '管理员' : '普通用户'}
            </div>
          </div>
        ),
        disabled: true
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  };

  const baseMenuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/')
    },
    {
      key: '/contracts',
      icon: <FileTextOutlined />,
      label: '合同管理',
      onClick: () => navigate('/contracts')
    },
    {
      key: '/signing',
      icon: <EditOutlined />,
      label: '待我签署',
      onClick: () => navigate('/signing')
    },
    {
      key: '/seals',
      icon: <SafetyCertificateOutlined />,
      label: '我的印章',
      onClick: () => navigate('/seals')
    }
  ];

  const legalMenuItems = [
    {
      key: '/legal',
      icon: <AuditOutlined />,
      label: '法务管理',
      onClick: () => navigate('/legal')
    },
    {
      key: '/legal/statistics',
      icon: <BarChartOutlined />,
      label: '数据统计',
      onClick: () => navigate('/legal/statistics')
    }
  ];

  const menuItems = isLegalExpert 
    ? [...baseMenuItems, { type: 'divider' }, ...legalMenuItems]
    : baseMenuItems;

  const selectedKey = location.pathname;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: '0 24px', display: 'flex', alignItems: 'center' }}>
        <FileDoneOutlined style={{ fontSize: 24, color: 'white' }} />
        <span className="header-title">电子签约系统</span>
        <div style={{ flex: 1 }} />
        <Dropdown menu={userMenu} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Tag color={isLegalExpert ? 'purple' : 'blue'}>
              {isLegalExpert ? '法务' : '用户'}
            </Tag>
            <Avatar icon={<UserOutlined />} />
            <span className="header-user">{user?.realName || user?.username}</span>
          </Space>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={220} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
            className="sider-menu"
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#f5f7fa',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: 8
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
