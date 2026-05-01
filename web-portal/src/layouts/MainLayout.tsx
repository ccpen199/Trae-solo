import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme, Button } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  MessageOutlined,
  SettingOutlined,
  AuditOutlined,
  DollarOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const roleCode = user?.role.code;

  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '仪表盘',
      },
      {
        key: 'templates',
        icon: <FileTextOutlined />,
        label: '模板管理',
        children: [
          { key: '/templates', label: '模板列表' },
          { key: '/templates/create', label: '创建模板' },
        ],
      },
      {
        key: 'sms',
        icon: <MessageOutlined />,
        label: '短信管理',
        children: [
          { key: '/sms/send', label: '发送短信' },
          { key: '/sms/tasks', label: '发送任务' },
          { key: '/sms/records', label: '发送记录' },
        ],
      },
    ];

    if (roleCode === 'developer' || roleCode === 'admin') {
      items.push(
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: '系统配置',
          children: [
            { key: '/providers', label: '通道管理' },
            { key: '/rules', label: '规则配置' },
          ],
        }
      );
    }

    if (roleCode === 'finance' || roleCode === 'admin') {
      items.push(
        {
          key: 'finance',
          icon: <DollarOutlined />,
          label: '财务管理',
          children: [
            { key: '/finance/balance', label: '账户余额' },
            { key: '/finance/consumption', label: '消费记录' },
            { key: '/finance/report', label: '财务报表' },
          ],
        }
      );
    }

    if (roleCode === 'admin' || roleCode === 'operator') {
      items.push({
        key: '/audit',
        icon: <AuditOutlined />,
        label: '审计日志',
      });
    }

    return items;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.realName || user?.username,
      disabled: true,
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
    const pathname = location.pathname;
    return [pathname];
  };

  const getOpenKeys = () => {
    const pathname = location.pathname;
    const keys: string[] = [];
    if (pathname.startsWith('/templates')) keys.push('templates');
    if (pathname.startsWith('/sms')) keys.push('sms');
    if (pathname.startsWith('/providers') || pathname.startsWith('/rules')) keys.push('settings');
    if (pathname.startsWith('/finance')) keys.push('finance');
    return keys;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
      >
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: collapsed ? 12 : 16,
          }}
        >
          {collapsed ? 'SMS' : '短信营销平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={getMenuItems()}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: token.colorTextSecondary }}>
              角色: {user?.role.name}
            </span>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.realName || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
