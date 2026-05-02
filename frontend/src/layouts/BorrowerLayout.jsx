import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Tag } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  DashboardOutlined,
  FileAddOutlined,
  WalletOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

function BorrowerLayout() {
  const { user, logout, getRoleDisplayName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: '1',
      icon: <UserOutlined />,
      label: `${user?.name || user?.username}`
    },
    {
      type: 'divider'
    },
    {
      key: '2',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  const menuItems = [
    {
      key: '/borrower',
      icon: <DashboardOutlined />,
      label: '我的首页'
    },
    {
      key: '/borrower/application',
      icon: <FileAddOutlined />,
      label: '申请贷款'
    },
    {
      key: '/borrower/loans',
      icon: <WalletOutlined />,
      label: '我的贷款'
    }
  ];

  const getSelectedKey = () => {
    if (location.pathname === '/borrower' || location.pathname === '/borrower/') {
      return ['/borrower'];
    }
    if (location.pathname.startsWith('/borrower/application/')) {
      return ['/borrower/application'];
    }
    return [location.pathname];
  };

  return (
    <Layout className="layout">
      <Header className="layout-header">
        <div className="layout-logo">
          <DashboardOutlined />
          信贷管理系统
        </div>
        <div className="layout-user">
          <Tag color="blue">{getRoleDisplayName(user?.role)}</Tag>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} size="small" />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={200} className="layout-sider">
          <Menu
            mode="inline"
            selectedKeys={getSelectedKey()}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Layout>
          <Content className="layout-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default BorrowerLayout;
