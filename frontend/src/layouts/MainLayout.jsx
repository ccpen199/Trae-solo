import { useState, useEffect } from 'react';
import { Layout, Menu, Breadcrumb, Avatar, Dropdown, Drawer, Button } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  GiftOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
    path: '/dashboard',
  },
  {
    key: 'jobs',
    icon: <AppstoreOutlined />,
    label: '岗位管理',
    path: '/jobs',
  },
  {
    key: 'candidates',
    icon: <TeamOutlined />,
    label: '求职者管理',
    path: '/candidates',
  },
  {
    key: 'applications',
    icon: <FileTextOutlined />,
    label: '投递管理',
    path: '/applications',
  },
  {
    key: 'interviews',
    icon: <CalendarOutlined />,
    label: '面试管理',
    path: '/interviews',
  },
  {
    key: 'offers',
    icon: <GiftOutlined />,
    label: 'Offer管理',
    path: '/offers',
  },
  {
    key: 'analytics',
    icon: <BarChartOutlined />,
    label: '数据分析',
    path: '/analytics',
  },
  {
    key: 'company',
    icon: <SettingOutlined />,
    label: '企业设置',
    path: '/company',
  },
];

const breadcrumbMap = {
  '/dashboard': '仪表盘',
  '/jobs': '岗位管理',
  '/candidates': '求职者管理',
  '/applications': '投递管理',
  '/interviews': '面试管理',
  '/offers': 'Offer管理',
  '/analytics': '数据分析',
  '/company': '企业设置',
  '/profile': '个人中心',
};

function MainLayout() {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, toggleMobileMenu, closeMobileMenu, isMobile } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('dashboard');

  useEffect(() => {
    const path = location.pathname;
    const item = menuItems.find((item) => path.startsWith(item.path));
    if (item) {
      setSelectedKey(item.key);
    }
  }, [location.pathname]);

  const handleMenuClick = ({ key }) => {
    const item = menuItems.find((item) => item.key === key);
    if (item) {
      navigate(item.path);
      if (isMobile) {
        closeMobileMenu();
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: <Link to="/profile">个人中心</Link>,
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
  ];

  const renderMenu = () => (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={handleMenuClick}
    />
  );

  const renderSider = () => {
    if (isMobile) {
      return (
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '16px',
              }}>
                Z
              </div>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>智能招聘平台</span>
            </div>
          }
          placement="left"
          onClose={closeMobileMenu}
          open={mobileMenuOpen}
          width={260}
          styles={{
            header: { background: '#001529', borderBottom: '1px solid #303030' },
            body: { background: '#001529', padding: 0 },
          }}
        >
          {renderMenu()}
        </Drawer>
      );
    }

    return (
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        width={240}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
        }}
      >
        <div className="logo" style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          padding: sidebarCollapsed ? '0' : '0 20px',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '16px',
            flexShrink: 0,
          }}>
            Z
          </div>
          {!sidebarCollapsed && (
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              智能招聘平台
            </span>
          )}
        </div>
        {renderMenu()}
      </Sider>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {renderSider()}
      <Layout>
        <Header style={{
          padding: '0 20px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
            <Button
              type="text"
              icon={isMobile ? <MenuOutlined /> : (sidebarCollapsed ? <MenuOutlined /> : <MenuOutlined />)}
              onClick={isMobile ? toggleMobileMenu : toggleSidebar}
              style={{ fontSize: '16px' }}
            />
            <Breadcrumb style={{ margin: 0 }}>
              <Breadcrumb.Item>
                {breadcrumbMap[location.pathname] || '首页'}
              </Breadcrumb.Item>
            </Breadcrumb>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background 0.3s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar
                  size={32}
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  style={{ background: '#1890ff' }}
                />
                <span style={{
                  color: 'rgba(0, 0, 0, 0.85)',
                  fontSize: '14px',
                  display: isMobile ? 'none' : 'block',
                }}>
                  {user?.name || '用户'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{
          margin: '24px',
          padding: '24px',
          background: '#f0f2f5',
          minHeight: 'calc(100vh - 64px - 48px)',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
