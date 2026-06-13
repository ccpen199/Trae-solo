import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown, Badge, Button, Tooltip, App } from 'antd';
import {
  DashboardOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  AlertOutlined,
  CloudUploadOutlined,
  ShareAltOutlined,
  BarChartOutlined,
  BulbFilled,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SettingOutlined,
  ApiOutlined,
  MonitorOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { monitoringAPI } from '../services/api';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const { user, logout } = useAuthStore();
  const { collapsed, toggleCollapsed, addNotification } = useAppStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    fetchOpenAlerts();
    const interval = setInterval(fetchOpenAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchOpenAlerts = async () => {
    try {
      const result = await monitoringAPI.getAlerts({ status: 'open', pageSize: 1 });
      if (result && typeof result === 'object' && 'total' in result) {
        setAlertCount(result.total as number);
      }
    } catch {}
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/devices', icon: <BulbOutlined />, label: '设备管理' },
    { key: '/scenes', icon: <ThunderboltOutlined />, label: '智能场景' },
    { key: '/voice', icon: <MessageOutlined />, label: '语音控制' },
    { key: '/alerts', icon: <AlertOutlined />, label: '告警中心', badge: alertCount > 0 ? alertCount : undefined },
    { key: '/ota', icon: <CloudUploadOutlined />, label: '固件升级' },
    { key: '/share', icon: <ShareAltOutlined />, label: '设备分享' },
    { key: '/analytics', icon: <BarChartOutlined />, label: '数据分析' },
    { key: '/learning', icon: <BulbFilled />, label: 'AI 学习' },
    { key: '/homes', icon: <HomeOutlined />, label: '家庭管理' },
    {
      key: 'admin',
      icon: <MonitorOutlined />,
      label: '管理员',
      children: [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '管理仪表盘' },
        { key: '/admin/vendors', icon: <ApiOutlined />, label: '厂商管理' },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: async () => {
        try {
          await logout();
          message.success('已退出登录');
          navigate('/login');
        } catch {
          navigate('/login');
        }
      },
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return [path];
    if (path.startsWith('/devices/')) return ['/devices'];
    if (path.startsWith('/scenes/')) return ['/scenes'];
    return [path];
  };

  const getOpenKeys = () => {
    if (location.pathname.startsWith('/admin')) return ['admin'];
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: collapsed ? '0 8px' : '0 16px',
        }}>
          <div style={{
            fontSize: collapsed ? 20 : 22,
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}>
            <ThunderboltOutlined style={{ color: '#1677ff', fontSize: 24 }} />
            {!collapsed && <span>IoT 管控平台</span>}
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
            />
            <span style={{ fontSize: 16, fontWeight: 500 }}>
              {menuItems.find(m => m.key === location.pathname)?.label ||
                (location.pathname.startsWith('/devices/') ? '设备详情' :
                 location.pathname.startsWith('/scenes/builder') ? '场景编排' :
                 location.pathname.startsWith('/scenes/') ? '场景编辑' : '')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tooltip title="通知">
              <Badge count={alertCount} size="small">
                <Button type="text" icon={<BellOutlined />} onClick={() => navigate('/alerts')} />
              </Badge>
            </Tooltip>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
                <span>{user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 64px - 32px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
