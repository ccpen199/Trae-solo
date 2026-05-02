import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Badge, theme, message } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  AuditOutlined,
  BarChartOutlined,
  WarningOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/utils/api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  roles?: string[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/reports/dashboard');
        if (response.success && response.data) {
          const data = response.data as any;
          setNotifications(
            (data.pendingVisits || 0) +
            (data.pendingPrescriptions || 0) +
            (data.pendingLabOrders || 0)
          );
        }
      } catch (error) {
        console.error('Fetch notifications error:', error);
      }
    };

    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const menuItems: MenuItem[] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      path: '/dashboard',
    },
    {
      key: 'patients',
      icon: <TeamOutlined />,
      label: '患者管理',
      path: '/patients',
      roles: ['ADMIN', 'DOCTOR', 'NURSE'],
    },
    {
      key: 'visits',
      icon: <FileTextOutlined />,
      label: '就诊处理',
      path: '/visits',
      roles: ['ADMIN', 'DOCTOR', 'NURSE'],
    },
    {
      key: 'prescriptions',
      icon: <MedicineBoxOutlined />,
      label: '处方管理',
      path: '/prescriptions',
      roles: ['ADMIN', 'DOCTOR', 'PHARMACIST'],
    },
    {
      key: 'lab',
      icon: <FileTextOutlined />,
      label: '检查检验',
      path: '/lab',
      roles: ['ADMIN', 'DOCTOR', 'NURSE'],
    },
    {
      key: 'exceptions',
      icon: <WarningOutlined />,
      label: '异常处理',
      path: '/exceptions',
      roles: ['ADMIN', 'DOCTOR', 'PHARMACIST'],
    },
    {
      key: 'audit',
      icon: <AuditOutlined />,
      label: '审计日志',
      path: '/audit',
      roles: ['ADMIN', 'DOCTOR'],
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: '管理报表',
      path: '/reports',
      roles: ['ADMIN'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles || !user) return true;
    return item.roles.includes(user.role.code);
  });

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = menuItems.find((m) => m.key === key);
    if (item) {
      navigate(item.path);
    }
  };

  const handleLogout = async () => {
    await logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'user-info',
        icon: <UserOutlined />,
        label: (
          <div>
            <Text strong>{user?.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user?.role.name} | {user?.department?.name || '无科室'}
            </Text>
          </div>
        ),
        disabled: true,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
      },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
        handleLogout();
      }
    },
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    const item = menuItems.find((m) => path.startsWith(m.path));
    return item?.key || 'dashboard';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <MedicineBoxOutlined
            style={{
              fontSize: collapsed ? 24 : 32,
              color: '#1890ff',
            }}
          />
          {!collapsed && (
            <Typography.Title
              level={5}
              style={{
                color: 'white',
                marginLeft: 12,
                marginBottom: 0,
              }}
            >
              电子病历系统
            </Typography.Title>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={filteredMenuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {filteredMenuItems.find((m) => m.key === getSelectedKey())?.label || '电子病历系统'}
            </Typography.Title>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={notifications} overflowCount={99}>
              <BellOutlined
                style={{ fontSize: 20, color: '#666', cursor: 'pointer' }}
              />
            </Badge>

            <Dropdown menu={userMenu} placement="bottomRight">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                }}
              >
                <Avatar
                  size="large"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
                <div style={{ marginLeft: 12, textAlign: 'right' }}>
                  <Text strong>{user?.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user?.role.name}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
