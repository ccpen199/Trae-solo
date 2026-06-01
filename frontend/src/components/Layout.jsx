import React from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  FileTextOutlined,
  HistoryOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  LogoutOutlined,
  RobotOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

function MainLayout({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/bids', icon: <FileTextOutlined />, label: '标书管理' },
    { key: '/ledger', icon: <HistoryOutlined />, label: '业务台账' },
    { key: '/exceptions', icon: <WarningOutlined />, label: '异常处理' },
    { key: '/qualifications', icon: <SafetyCertificateOutlined />, label: '资质管理' }
  ];

  const userMenu = {
    items: [
      { key: 'role', label: `角色: ${user?.role_description}`, disabled: true },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: onLogout }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="layout-header" style={{ background: '#001529', height: 64, lineHeight: '64px' }}>
        <div className="logo">
          <RobotOutlined style={{ fontSize: 24 }} />
          AI 招投标标书助手
        </div>
        <div className="user-info">
          <span>{user?.real_name}</span>
          <Dropdown menu={userMenu}>
            <Avatar icon={<UserOutlined />} />
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={220} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
