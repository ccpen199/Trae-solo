import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  theme
} from 'antd';
import {
  DashboardOutlined,
  NotificationOutlined,
  CalendarOutlined,
  TrophyOutlined,
  DollarOutlined,
  MessageOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useUserStore } from '../store/userStore';

const { Header, Sider, Content } = AntLayout;

const getMenuItems = (userRole) => {
  const baseItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台'
    },
    {
      key: '/announcements',
      icon: <NotificationOutlined />,
      label: '公告通知'
    },
    {
      key: '/leaves',
      icon: <CalendarOutlined />,
      label: '请假审批'
    },
    {
      key: '/evaluations',
      icon: <TrophyOutlined />,
      label: '综合测评'
    },
    {
      key: '/class-fees',
      icon: <DollarOutlined />,
      label: '班费管理'
    },
    {
      key: '/feedbacks',
      icon: <MessageOutlined />,
      label: '意见箱'
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '查询报表'
    }
  ];

  return baseItems;
};

const getRoleText = (role) => {
  const roleMap = {
    ADMIN: '管理员',
    TEACHER: '教师',
    CLASS_MONITOR: '班长',
    STUDENT: '学生'
  };
  return roleMap[role] || role;
};

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken();

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: handleLogout
    }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
      >
        <div style={{
          height: 64,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4
        }}>
          {collapsed ? (
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>系</span>
          ) : (
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>系部事务管理系统</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems(user?.role)}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)'
          }}
        >
          <div className="user-header">
            <span style={{ marginRight: 12, color: '#595959' }}>
              {user?.name} ({getRoleText(user?.role)})
            </span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar className="user-avatar" icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
