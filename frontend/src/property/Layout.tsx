import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge, Button, Popover, List, Drawer } from 'antd';
import {
  DashboardOutlined,
  DesktopOutlined,
  FileTextOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '@/store';
import { formatRelativeTime } from '@/utils/format';

const { Header, Sider, Content, Footer } = Layout;
const { Text, Title } = Typography;

const PropertyLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, theme } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications] = useState([
    { id: '1', title: '新工单提醒', description: '1号楼洗衣机故障报修', time: new Date(Date.now() - 1000 * 60 * 5) },
    { id: '2', title: '设备离线', description: '3号楼烘干机离线超过30分钟', time: new Date(Date.now() - 1000 * 60 * 30) },
    { id: '3', title: '工单完成', description: '您处理的工单已完成', time: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  ]);

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
    if (path.includes('/property/devices')) return '2';
    if (path.includes('/property/work-orders')) return '3';
    return '1';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const routes: Record<string, string> = {
      '1': '/property',
      '2': '/property/devices',
      '3': '/property/work-orders',
    };
    navigate(routes[key]);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: '运维看板',
    },
    {
      key: '2',
      icon: <DesktopOutlined />,
      label: '设备管理',
    },
    {
      key: '3',
      icon: <FileTextOutlined />,
      label: '工单管理',
    },
  ];

  const userMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '返回首页',
      onClick: () => navigate('/resident'),
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

  const notificationContent = (
    <div style={{ width: 320 }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong>通知消息</Text>
      </div>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item style={{ padding: '12px 16px', cursor: 'pointer' }}>
            <List.Item.Meta
              avatar={
                <Badge dot color="red">
                  <Avatar icon={<BellOutlined />} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Badge>
              }
              title={item.title}
              description={
                <div>
                  <div>{item.description}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{formatRelativeTime(item.time)}</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
      <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <Button type="link" size="small">查看全部</Button>
      </div>
    </div>
  );

  const headerContent = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {!isMobile && (
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            style={{ fontSize: '16px', color: '#fff' }}
          />
        )}
        {isMobile && (
          <Button
            type="text"
            icon={<MenuFoldOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            style={{ color: '#fff' }}
          />
        )}
        <div>
          <Title level={5} style={{ margin: 0, color: '#fff' }}>
            智慧社区物业端
          </Title>
          <Text type="secondary" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            {user?.communityId || '阳光花园小区'}
          </Text>
        </div>
      </div>

      <Space size={16}>
        <Popover placement="bottomRight" content={notificationContent} trigger="click">
          <Badge count={notifications.length} size="small">
            <Button type="text" icon={<BellOutlined style={{ fontSize: 18, color: '#fff' }} />} />
          </Badge>
        </Popover>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              src={user?.avatar}
              icon={!user?.avatar && <UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            {!isMobile && (
              <div style={{ textAlign: 'right' }}>
                <Text style={{ color: '#fff', display: 'block' }}>
                  {user?.nickname || user?.username || '物业管理员'}
                </Text>
                <Text type="secondary" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                  {user?.phone || ''}
                </Text>
              </div>
            )}
          </Space>
        </Dropdown>
      </Space>
    </div>
  );

  if (isMobile) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            padding: '0 16px',
            background: theme === 'dark' ? '#001529' : '#1890ff',
            display: 'flex',
            alignItems: 'center',
            height: 64,
          }}
        >
          {headerContent}
        </Header>

        <Drawer
          title="导航菜单"
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={280}
        >
          <Menu
            mode="inline"
            selectedKeys={[getActiveKey()]}
            onClick={handleMenuClick}
            items={menuItems}
            style={{ border: 'none' }}
          />
        </Drawer>

        <Layout style={{ marginTop: 64 }}>
          <Content
            style={{
              padding: 12,
              minHeight: 'calc(100vh - 64px)',
              width: '100%',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        width={240}
        style={{
          position: 'fixed',
          left: 0,
          top: 64,
          bottom: 0,
          zIndex: 99,
          overflowY: 'auto',
          background: theme === 'dark' ? '#001529' : '#001529',
        }}
      >
        <div style={{ padding: sidebarCollapsed ? '16px 8px' : '16px', textAlign: 'center' }}>
          <div style={{ fontSize: sidebarCollapsed ? 24 : 32, marginBottom: 8 }}>🏢</div>
          {!sidebarCollapsed && (
            <div>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>物业运维平台</Text>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getActiveKey()]}
          onClick={handleMenuClick}
          items={menuItems}
          style={{ border: 'none' }}
        />
      </Sider>

      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 240, marginTop: 64 }}>
        <Header
          style={{
            position: 'fixed',
            top: 0,
            left: sidebarCollapsed ? 80 : 240,
            right: 0,
            zIndex: 100,
            padding: '0 24px',
            background: theme === 'dark' ? '#001529' : '#1890ff',
            display: 'flex',
            alignItems: 'center',
            height: 64,
            transition: 'left 0.3s',
          }}
        >
          {headerContent}
        </Header>

        <Content
          style={{
            padding: 24,
            minHeight: 'calc(100vh - 64px - 48px)',
            width: '100%',
          }}
        >
          <Outlet />
        </Content>

        <Footer style={{ textAlign: 'center', background: '#fff', padding: '12px 24px', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            智慧社区IoT平台 ©{new Date().getFullYear()} 物业端
          </Text>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default PropertyLayout;
