import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  FileSearchOutlined,
  FileOutlined,
  BellOutlined,
  CheckSquareOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台', roles: ['admin', 'accountant', 'manager', 'client'] },
    { key: '/clients', icon: <UserOutlined />, label: '客户档案', roles: ['admin', 'accountant', 'manager'] },
    { key: '/documents', icon: <FileTextOutlined />, label: '票据收集', roles: ['admin', 'accountant', 'manager', 'client'] },
    { key: '/accounting', icon: <CalculatorOutlined />, label: '做账管理', roles: ['admin', 'accountant', 'manager'] },
    { key: '/tax', icon: <FileSearchOutlined />, label: '报税管理', roles: ['admin', 'accountant', 'manager'] },
    { key: '/reports', icon: <FileOutlined />, label: '月报管理', roles: ['admin', 'accountant', 'manager', 'client'] },
    { key: '/renewals', icon: <BellOutlined />, label: '续费提醒', roles: ['admin', 'accountant', 'manager'] },
    { key: '/todos', icon: <CheckSquareOutlined />, label: '待办事项', roles: ['admin', 'accountant', 'manager', 'client'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

  const userMenuItems = [
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/login'); } }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          代账平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={filteredMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0 }}>企业代账服务平台</h2>
          <Space>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px', padding: 24, minHeight: 280, background: '#fff', borderRadius: 8 }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
