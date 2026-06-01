import React from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeOutlined,
  ShoppingOutlined,
  TeamOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = AntLayout;

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '工作台' },
    { key: '/products', icon: <ShoppingOutlined />, label: '资质产品库' },
    { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
    { key: '/applications', icon: <FileTextOutlined />, label: '办理进度' },
    { key: '/certificates', icon: <SafetyCertificateOutlined />, label: '证书管理' },
    { key: '/todos', icon: <CalendarOutlined />, label: '待办事项' },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      }
    }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
          企业资质办理系统
        </div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
            <Avatar icon={<UserOutlined />} />
            <span>{user?.name || '用户'}</span>
            <span style={{ fontSize: 12, color: '#999' }}>({user?.role || ''})</span>
          </div>
        </Dropdown>
      </Header>
      <AntLayout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <AntLayout style={{ padding: '24px' }}>
          <Content style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8
          }}>
            {children}
          </Content>
        </AntLayout>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
