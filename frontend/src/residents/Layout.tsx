import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge, Drawer, List, Button } from 'antd';
import {
  HomeOutlined,
  DesktopOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  UserOutlined,
  WalletOutlined,
  EnvironmentOutlined,
  ScanOutlined,
  LogoutOutlined,
  MenuOutlined,
  GreenOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '@/store';

const { Header, Content, Footer } = Layout;
const { Text, Title } = Typography;

const ResidentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    if (path.includes('/devices')) return '2';
    if (path.includes('/bookings')) return '3';
    if (path.includes('/orders')) return '4';
    if (path.includes('/wallet') || path.includes('/eco') || path.includes('/scan')) return '5';
    return '1';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const routes: Record<string, string> = {
      '1': '/resident',
      '2': '/resident/devices',
      '3': '/resident/bookings',
      '4': '/resident/orders',
      '5': '/resident/wallet',
    };
    navigate(routes[key]);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'wallet',
      icon: <WalletOutlined />,
      label: '我的钱包',
      onClick: () => navigate('/resident/wallet'),
    },
    {
      key: 'eco',
      icon: <GreenOutlined />,
      label: '环保中心',
      onClick: () => navigate('/resident/eco'),
    },
    {
      key: 'scan',
      icon: <ScanOutlined />,
      label: '扫码使用',
      onClick: () => navigate('/resident/scan'),
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

  const bottomMenuItems = [
    {
      key: '1',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '2',
      icon: <DesktopOutlined />,
      label: '设备',
    },
    {
      key: '3',
      icon: <CalendarOutlined />,
      label: '预约',
    },
    {
      key: '4',
      icon: <ShoppingOutlined />,
      label: '订单',
    },
    {
      key: '5',
      icon: <UserOutlined />,
      label: '我的',
    },
  ];

  const profileMenuItems = [
    {
      key: 'wallet',
      icon: <WalletOutlined />,
      title: '我的钱包',
      description: `余额: ¥${user?.balance?.toFixed(2) || '0.00'}`,
      onClick: () => navigate('/resident/wallet'),
    },
    {
      key: 'eco',
      icon: <GreenOutlined />,
      title: '环保中心',
      description: `环保积分: ${user?.ecoPoints || 0}`,
      onClick: () => navigate('/resident/eco'),
    },
    {
      key: 'scan',
      icon: <ScanOutlined />,
      title: '扫码使用',
      description: '扫描设备二维码',
      onClick: () => navigate('/resident/scan'),
    },
  ];

  const headerContent = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
          />
        )}
        <div>
          <Title level={5} style={{ margin: 0, color: '#fff' }}>
            智慧社区
          </Title>
          {user?.communityId && (
            <Text type="secondary" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              <EnvironmentOutlined style={{ marginRight: 4 }} />
              {user.communityId}
            </Text>
          )}
        </div>
      </div>

      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
        <Space style={{ cursor: 'pointer' }}>
          <Badge count={user?.streakDays || 0} size="small" offset={[-2, 2]}>
            <Avatar
              src={user?.avatar}
              icon={!user?.avatar && <UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
          </Badge>
          {!isMobile && (
            <div style={{ textAlign: 'right' }}>
              <Text style={{ color: '#fff', display: 'block' }}>
                {user?.nickname || user?.username || '用户'}
              </Text>
              <Text type="secondary" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {user?.phone || ''}
              </Text>
            </div>
          )}
        </Space>
      </Dropdown>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '0 24px',
          background: theme === 'dark' ? '#001529' : '#1890ff',
          display: 'flex',
          alignItems: 'center',
          height: 64,
        }}
      >
        {headerContent}
      </Header>

      <Drawer
        title="个人中心"
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Avatar
            size={80}
            src={user?.avatar}
            icon={!user?.avatar && <UserOutlined />}
            style={{ backgroundColor: '#1890ff', marginBottom: 12 }}
          />
          <Title level={5} style={{ margin: 0 }}>
            {user?.nickname || user?.username || '用户'}
          </Title>
          <Text type="secondary">{user?.phone || ''}</Text>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>
                ¥{user?.balance?.toFixed(2) || '0.00'}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>余额</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
                {user?.ecoPoints || 0}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>环保积分</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#faad14' }}>
                {user?.streakDays || 0}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>连续使用</Text>
            </div>
          </div>
        </div>

        <List
          dataSource={profileMenuItems}
          renderItem={(item) => (
            <List.Item
              onClick={() => {
                item.onClick?.();
                setMobileMenuOpen(false);
              }}
              style={{ cursor: 'pointer', padding: '16px 0' }}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: '#f0f5ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      color: '#1890ff',
                    }}
                  >
                    {item.icon}
                  </div>
                }
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
        />

        <Button
          type="primary"
          danger
          block
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ marginTop: 24 }}
        >
          退出登录
        </Button>
      </Drawer>

      <Layout style={{ marginTop: 64, marginBottom: isMobile ? 60 : 0 }}>
        <Content
          style={{
            padding: isMobile ? 12 : 24,
            minHeight: 'calc(100vh - 124px)',
            maxWidth: isMobile ? '100%' : 1200,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <Outlet />
        </Content>

        {!isMobile && (
          <Footer style={{ textAlign: 'center', background: 'transparent', padding: '12px 24px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              智慧社区IoT平台 ©{new Date().getFullYear()} 居民端
            </Text>
          </Footer>
        )}
      </Layout>

      {isMobile && (
        <Footer
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            padding: 0,
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
            height: 60,
          }}
        >
          <Menu
            mode="horizontal"
            selectedKeys={[getActiveKey()]}
            onClick={handleMenuClick}
            style={{
              height: 60,
              border: 'none',
              display: 'flex',
              justifyContent: 'space-around',
            }}
            items={bottomMenuItems.map((item) => ({
              key: item.key,
              icon: (
                <div style={{ textAlign: 'center', paddingTop: 6 }}>
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, lineHeight: 1 }}>{item.label}</div>
                </div>
              ),
              label: '',
            }))}
          />
        </Footer>
      )}
    </Layout>
  );
};

export default ResidentLayout;
