import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  EnvironmentOutlined,
  DashboardFilled,
  StockOutlined,
  FileTextOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, logout } = useAppStore();

  const menuItems: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/devices-map',
      icon: <EnvironmentOutlined />,
      label: '设备地图',
    },
    {
      key: '/energy-analysis',
      icon: <StockOutlined />,
      label: '能耗分析',
    },
    {
      key: '/device/001',
      icon: <DashboardFilled />,
      label: '设备详情',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '报表中心',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const userMenuItems: MenuItem[] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      type: 'divider',
    } as MenuItem,
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const notificationItems: MenuItem[] = [
    {
      key: '1',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 500 }}>设备故障预警</div>
          <div style={{ fontSize: 12, color: '#999' }}>设备DEV-001出现压力异常</div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 500 }}>收益到账提醒</div>
          <div style={{ fontSize: 12, color: '#999' }}>6月收益已到账，共¥128,500</div>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 500 }}>月度报表已生成</div>
          <div style={{ fontSize: 12, color: '#999' }}>2024年6月投资报表已就绪</div>
        </div>
      ),
    },
  ];

  const selectedKey = menuItems.find(
    (item) => item && typeof item === 'object' && 'key' in item && location.pathname.startsWith(String(item.key))
  )
    ? String((menuItems.find(
        (item) => item && typeof item === 'object' && 'key' in item && location.pathname.startsWith(String(item.key))
      ) as { key: string }).key)
    : '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={240}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)',
            margin: 16,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {collapsed ? (
            <span style={{ fontSize: 24, color: '#1890ff', fontWeight: 'bold' }}>I</span>
          ) : (
            <span style={{ fontSize: 18, color: '#fff', fontWeight: 600, letterSpacing: 1 }}>
              投资商管理平台
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 64, height: 64 }}
            />
            <span style={{ fontSize: 16, color: '#1f1f1f', fontWeight: 500 }}>
              欢迎回来，{userInfo?.name || '投资商'}
            </span>
          </div>
          <Space size={24}>
            <Dropdown menu={{ items: notificationItems }} placement="bottomRight" arrow>
              <Badge count={3} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
              </Badge>
            </Dropdown>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
                <Avatar
                  size={36}
                  src={userInfo?.avatar}
                  style={{ backgroundColor: '#1890ff' }}
                  icon={<UserOutlined />}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1f1f1f' }}>
                    {userInfo?.name || '张投资商'}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {userInfo?.investorLevel || 'VIP会员'}
                  </div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="page-container">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
