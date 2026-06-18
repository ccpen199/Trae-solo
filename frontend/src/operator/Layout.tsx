import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge, Button, Switch, Tooltip } from 'antd';
import {
  DashboardOutlined,
  DesktopOutlined,
  BarChartOutlined,
  GiftOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '@/store';
import { ROLE_MAP } from '@/utils/constants';

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

const OperatorLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, theme, toggleSidebar, setTheme } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getActiveKey = () => {
    const path = location.pathname;
    if (path.includes('/operator/devices')) return '2';
    if (path.includes('/operator/analytics')) return '3';
    if (path.includes('/operator/packages')) return '4';
    if (path.includes('/operator/work-orders')) return '5';
    if (path.includes('/operator/eco')) return '6';
    return '1';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const routes: Record<string, string> = {
      '1': '/operator',
      '2': '/operator/devices',
      '3': '/operator/analytics',
      '4': '/operator/packages',
      '5': '/operator/work-orders',
      '6': '/operator/eco',
    };
    navigate(routes[key]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: '2',
      icon: <DesktopOutlined />,
      label: '设备管理',
    },
    {
      key: '3',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '4',
      icon: <GiftOutlined />,
      label: '套餐管理',
    },
    {
      key: '5',
      icon: <FileTextOutlined />,
      label: '工单管理',
    },
    {
      key: '6',
      icon: <EnvironmentOutlined />,
      label: '激励管理',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/operator/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? false : sidebarCollapsed}
        theme={theme}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
        width={220}
        collapsedWidth={80}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken && !sidebarCollapsed) {
            toggleSidebar();
          }
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            padding: sidebarCollapsed ? '0 16px' : '0 20px',
            background: theme === 'dark' ? '#002140' : '#fff',
            borderBottom: theme === 'dark' ? '1px solid #000' : '1px solid #f0f0f0',
          }}
        >
          {sidebarCollapsed ? (
            <div style={{ fontSize: 28 }}>🏢</div>
          ) : (
            <Space>
              <div style={{ fontSize: 28 }}>🏢</div>
              <Title level={5} style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#262626' }}>
                运营中心
              </Title>
            </Space>
          )}
        </div>

        <Menu
          theme={theme}
          mode="inline"
          selectedKeys={[getActiveKey()]}
          onClick={handleMenuClick}
          items={menuItems}
          style={{ borderRight: 0, paddingTop: 16 }}
        />
      </Sider>

      <Layout style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 220), transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: theme === 'dark' ? '#001529' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Title level={5} style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#262626' }}>
              {menuItems.find(item => item.key === getActiveKey())?.label as string}
            </Title>
          </Space>

          <Space size="middle">
            <Tooltip title={theme === 'dark' ? '切换亮色主题' : '切换暗色主题'}>
              <Switch
                checked={theme === 'dark'}
                onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
            </Tooltip>

            <Tooltip title="通知">
              <Badge count={3} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{ fontSize: '18px' }}
                />
              </Badge>
            </Tooltip>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
                <Avatar
                  src={user?.avatar}
                  icon={!user?.avatar && <UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                {!sidebarCollapsed && !isMobile && (
                  <div style={{ textAlign: 'left' }}>
                    <Text style={{ color: theme === 'dark' ? '#fff' : '#262626', display: 'block', fontSize: 14, fontWeight: 500 }}>
                      {user?.nickname || user?.username || '运营人员'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {ROLE_MAP[user?.role || 'operator']}
                    </Text>
                  </div>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            padding: isMobile ? 12 : 24,
            minHeight: 'calc(100vh - 128px)',
            background: '#f5f5f5',
          }}
        >
          <Outlet />
        </Content>

        <Footer style={{ textAlign: 'center', background: theme === 'dark' ? '#001529' : '#fff', padding: '12px 24px' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            智慧社区IoT平台 ©{new Date().getFullYear()} 运营端
          </Text>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default OperatorLayout;
