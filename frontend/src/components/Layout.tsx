import React from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  LineChartOutlined,
  AuditOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

const { Header, Sider, Content } = AntLayout;

const getMenuItems = (role: UserRole) => {
  const baseItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
  ];

  switch (role) {
    case UserRole.PUBLISHER:
      return [
        ...baseItems,
        {
          key: '/publisher/batches',
          icon: <FileTextOutlined />,
          label: '任务批次',
        },
        {
          key: '/publisher/create',
          icon: <FileTextOutlined />,
          label: '发布任务',
        },
      ];
    case UserRole.WORKER:
      return [
        ...baseItems,
        {
          key: '/worker/tasks',
          icon: <FileTextOutlined />,
          label: '任务大厅',
        },
        {
          key: '/worker/my-tasks',
          icon: <CheckCircleOutlined />,
          label: '我的任务',
        },
        {
          key: '/worker/wallet',
          icon: <WalletOutlined />,
          label: '我的钱包',
        },
      ];
    case UserRole.EXPERT:
      return [
        ...baseItems,
        {
          key: '/expert/reviews',
          icon: <AuditOutlined />,
          label: '待审核',
        },
      ];
    case UserRole.ADMIN:
      return [
        ...baseItems,
        {
          key: '/admin/users',
          icon: <UserOutlined />,
          label: '用户管理',
        },
        {
          key: '/admin/appeals',
          icon: <AuditOutlined />,
          label: '申诉处理',
        },
        {
          key: '/admin/audit',
          icon: <AuditOutlined />,
          label: '审计日志',
        },
        {
          key: '/admin/statistics',
          icon: <LineChartOutlined />,
          label: '统计分析',
        },
      ];
    default:
      return baseItems;
  }
};

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const userMenu = [
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

  const roleLabels: Record<UserRole, string> = {
    [UserRole.PUBLISHER]: '发布方',
    [UserRole.WORKER]: '接单员',
    [UserRole.EXPERT]: '专家',
    [UserRole.ADMIN]: '管理员',
  };

  const menuItems = user ? getMenuItems(user.role) : [];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <h2 style={{ margin: 0, color: '#1890ff' }}>众包任务平台</h2>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <AntLayout style={{ marginLeft: 220 }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Space>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <span>
                  {user?.real_name || user?.username}
                  <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                    [{roleLabels[user?.role || UserRole.WORKER]}]
                  </span>
                </span>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
