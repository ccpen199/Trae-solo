import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, theme, App } from 'antd';
import {
  DashboardOutlined,
  GiftOutlined,
  ShoppingOutlined,
  DollarOutlined,
  HistoryOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/authStore';
import { UserRole } from '@/types';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer } } = theme.useToken();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { message } = App.useApp();

  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '仪表盘'
      }
    ];

    if (user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR) {
      items.push(
        {
          key: '/coupons/templates',
          icon: <GiftOutlined />,
          label: '券模板管理'
        },
        {
          key: '/coupons/distribute',
          icon: <GiftOutlined />,
          label: '券发放队列'
        }
      );
    }

    if (user?.role === UserRole.CUSTOMER) {
      items.push({
        key: '/coupons/my-coupons',
        icon: <GiftOutlined />,
        label: '我的券包'
      });
    }

    items.push({
      key: '/orders',
      icon: <ShoppingOutlined />,
      label: '订单管理'
    });

    if (user?.role === UserRole.ADMIN || user?.role === UserRole.FINANCE) {
      items.push(
        {
          key: '/finance',
          icon: <DollarOutlined />,
          label: '财务核算'
        },
        {
          key: '/finance/audit',
          icon: <HistoryOutlined />,
          label: '审计追踪'
        }
      );
    }

    if (user?.role === UserRole.ADMIN) {
      items.push({
        key: '/system',
        icon: <SettingOutlined />,
        label: '系统设置'
      });
    }

    return items;
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
      label: '账户设置'
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'profile' || key === 'settings') {
      message.info('功能开发中');
    } else {
      navigate(key);
    }
  };

  const handleMenuItemClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        style={{
          background: '#001529',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000
        }}
        width={240}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: sidebarCollapsed ? 14 : 18,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {sidebarCollapsed ? '券' : '优惠券营销系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuItemClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 999
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              style={{ fontSize: 16, width: 64, height: 64 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleMenuClick
              }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <span>{user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            minHeight: 280,
            borderRadius: 8
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
