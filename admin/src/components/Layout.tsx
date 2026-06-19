import React, { useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown, Tag, Space } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  TeamOutlined,
  WalletOutlined,
  WarningOutlined,
  FundOutlined,
  LogoutOutlined,
  UserOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useService } from '../pages/service/ServiceProvider';
import { PermissionKey } from '../services/permissions';

const { Header, Sider, Content } = Layout;

const MENU_PERMISSION_MAP: Record<string, PermissionKey[]> = {
  '/dashboard': ['dashboard:view'],
  '/tasks': ['task:view'],
  '/task-roi': ['task:roi'],
  '/users': ['user:view'],
  '/withdrawals': ['withdrawal:view'],
  '/risk': ['risk:view'],
  '/ads': ['ad:view'],
};

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

const MENU_DEFS: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/tasks', icon: <UnorderedListOutlined />, label: '任务管理' },
  { key: '/task-roi', icon: <BarChartOutlined />, label: 'ROI分析' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
  { key: '/withdrawals', icon: <WalletOutlined />, label: '提现审核' },
  { key: '/risk', icon: <WarningOutlined />, label: '风控中心' },
  { key: '/ads', icon: <FundOutlined />, label: '广告配置' },
];

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout, roleLabel, canAny, can } = useService();

  const menuItems = useMemo<MenuItem[]>(() => {
    return MENU_DEFS.filter((item) => {
      const perms = MENU_PERMISSION_MAP[item.key];
      if (!perms) return true;
      return canAny(perms);
    });
  }, [canAny]);

  const firstAllowedPath = menuItems[0]?.key || '/dashboard';

  const handleMenuClick = ({ key }: { key: string }) => {
    const perms = MENU_PERMISSION_MAP[key];
    if (perms && !canAny(perms)) {
      navigate('/403');
      return;
    }
    navigate(key);
  };

  const handleLogout = () => {
    logout();
  };

  const headerStyle: React.CSSProperties = {
    padding: '0 24px',
    background: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f0f0f0',
  };

  const roleTagColor =
    admin?.role === 'super'
      ? 'red'
      : admin?.role === 'admin'
      ? 'orange'
      : admin?.role === 'auditor'
      ? 'gold'
      : admin?.role === 'operator'
      ? 'blue'
      : 'default';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible theme="dark" width={220}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
            gap: 8,
            background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
          }}
        >
          <RocketOutlined />
          <span>增长激励中台</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map((m) => ({
            key: m.key,
            icon: m.icon,
            label: m.label,
          }))}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tag icon={<SafetyCertificateOutlined />} color={roleTagColor}>
              {roleLabel}
            </Tag>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>
              权限范围：{Object.keys(menuItems).length} 个模块
            </span>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'info',
                  icon: <UserOutlined />,
                  label: `当前账号：${admin?.username || '管理员'}`,
                  disabled: true,
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar
                size="small"
                style={{ backgroundColor: '#ff6b35' }}
                icon={<UserOutlined />}
              />
              <Space>
                <span style={{ color: '#262626', fontWeight: 500 }}>
                  {admin?.username || '管理员'}
                </span>
              </Space>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
            background: '#f5f7fa',
            overflowY: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
