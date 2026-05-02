import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, message } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  StarOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthContext } from '../App';
import { roleNames } from '../store/auth';
import { CitizenHome } from '../pages/citizen/Home';
import { ServiceItemsPage } from '../pages/citizen/ServiceItems';
import { MyCasesPage } from '../pages/citizen/MyCases';
import { CaseDetailPage } from '../pages/citizen/CaseDetail';
import { MyReservationsPage } from '../pages/citizen/MyReservations';
import { EvaluationPage } from '../pages/citizen/Evaluation';

const { Header, Sider, Content } = Layout;

export const CitizenLayout: React.FC = () => {
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
      key: '/citizen',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/citizen'),
    },
    {
      key: '/citizen/services',
      icon: <FileTextOutlined />,
      label: '办事大厅',
      onClick: () => navigate('/citizen/services'),
    },
    {
      key: '/citizen/cases',
      icon: <FileTextOutlined />,
      label: '我的办件',
      onClick: () => navigate('/citizen/cases'),
    },
    {
      key: '/citizen/reservations',
      icon: <ScheduleOutlined />,
      label: '我的预约',
      onClick: () => navigate('/citizen/reservations'),
    },
    {
      key: '/citizen/evaluations',
      icon: <StarOutlined />,
      label: '我的评价',
      onClick: () => navigate('/citizen/evaluations'),
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
    if (path === '/citizen') return ['/citizen'];
    if (path.startsWith('/citizen/services')) return ['/citizen/services'];
    if (path.startsWith('/citizen/cases')) return ['/citizen/cases'];
    if (path.startsWith('/citizen/reservations')) return ['/citizen/reservations'];
    if (path.startsWith('/citizen/evaluations')) return ['/citizen/evaluations'];
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
            {roleNames[user?.role as any] || '群众'}端
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
              <Route path="/" element={<CitizenHome />} />
              <Route path="/services" element={<ServiceItemsPage />} />
              <Route path="/cases" element={<MyCasesPage />} />
              <Route path="/cases/:caseId" element={<CaseDetailPage />} />
              <Route path="/reservations" element={<MyReservationsPage />} />
              <Route path="/evaluations" element={<EvaluationPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
