import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  MoneyCollectOutlined,
  BookOutlined,
  SwapOutlined,
  TrophyOutlined,
  SearchOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/employees',
      icon: <UserOutlined />,
      label: '员工管理',
    },
    {
      key: '/departments',
      icon: <TeamOutlined />,
      label: '部门管理',
      hidden: !isAdmin,
    },
    {
      key: '/attendances',
      icon: <CalendarOutlined />,
      label: '考勤管理',
    },
    {
      key: '/salaries',
      icon: <MoneyCollectOutlined />,
      label: '工资管理',
    },
    {
      key: '/trainings',
      icon: <BookOutlined />,
      label: '培训管理',
    },
    {
      key: '/transfers',
      icon: <SwapOutlined />,
      label: '调动管理',
    },
    {
      key: '/reward-punishments',
      icon: <TrophyOutlined />,
      label: '奖惩管理',
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '查询统计',
    },
    {
      key: '/users',
      icon: <SettingOutlined />,
      label: '用户管理',
      hidden: !isAdmin,
    },
  ].filter((item) => !item.hidden);

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const handleSideMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
        }}>
          {collapsed ? (
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>HR</span>
          ) : (
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>人事管理系统</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleSideMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#666' }}>
              {user?.role === 'ADMIN' ? '管理员' : '普通用户'}: {user?.username}
            </span>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleMenuClick }}
              placement="bottomRight"
            >
              <Avatar size="large" icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
