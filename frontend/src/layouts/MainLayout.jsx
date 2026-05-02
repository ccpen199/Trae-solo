import React from 'react';
import { Layout, Menu, Avatar, Badge, Dropdown, Button, Spin } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  FileTextOutlined,
  MessageOutlined,
  BellOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useUserStore, useAppStore, useNotificationStore } from '../store';
import { notificationApi, todoApi } from '../api';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: '/orders',
    icon: <FileTextOutlined />,
    label: '工单管理',
  },
  {
    key: '/todos',
    icon: <CheckSquareOutlined />,
    label: '我的待办',
  },
  {
    key: '/notifications',
    icon: <BellOutlined />,
    label: '通知中心',
  },
  {
    key: '/org-sync',
    icon: <UserOutlined />,
    label: '组织同步',
  },
];

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const pendingTodoCount = useNotificationStore((state) => state.pendingTodoCount);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const setTodoCounts = useNotificationStore((state) => state.setTodoCounts);

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [notifRes, todoRes] = await Promise.allSettled([
          notificationApi.getUnreadCount(),
          todoApi.getCount(),
        ]);

        if (notifRes.status === 'fulfilled' && notifRes.value.success) {
          setUnreadCount(notifRes.value.data?.count || 0);
        }

        if (todoRes.status === 'fulfilled' && todoRes.value.success) {
          setTodoCounts(todoRes.value.data || { total: 0, pending: 0, completed: 0 });
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    };
    fetchCounts();
  }, [setUnreadCount, setTodoCounts]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '系统设置',
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
    ],
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout className="main-layout">
      <Sider trigger={null} collapsible collapsed={sidebarCollapsed}>
        <div className="sider-logo">
          {sidebarCollapsed ? 'IM' : '即时通讯系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header>
          <div className="header-left">
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
            />
            <span style={{ fontSize: '16px', fontWeight: 600 }}>内部即时通讯系统</span>
          </div>
          <div className="header-right">
            <Badge count={pendingTodoCount} size="small">
              <Button
                type="text"
                icon={<CheckSquareOutlined />}
                onClick={() => navigate('/todos')}
              />
            </Badge>
            <Badge count={unreadCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.name || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content>
          <Spin spinning={loading}>
            <Outlet />
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
