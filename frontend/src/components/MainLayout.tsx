import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Space, Tag, Typography } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  UserOutlined,
  SafetyOutlined,
  AlertOutlined,
  FileProtectOutlined,
  BarChartOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const roleMap: Record<string, string> = {
    admin: '系统管理员',
    operation: '运营专员',
    lecturer: '讲师',
    legal: '法务专员',
    customer_service: '客服专员',
  };

  const allMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
      badge: null,
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: '课程管理',
      badge: null,
    },
    {
      key: '/materials',
      icon: <FileTextOutlined />,
      label: '素材库管理',
      badge: '授权到期',
    },
    {
      key: '/lecturers',
      icon: <UserOutlined />,
      label: '讲师管理',
      badge: null,
    },
    {
      key: '/publication',
      icon: <SafetyOutlined />,
      label: '上架检查',
      badge: '待审核',
    },
    {
      key: '/piracy',
      icon: <AlertOutlined />,
      label: '盗版线索',
      badge: '新线索',
    },
    {
      key: '/enforcement',
      icon: <FileProtectOutlined />,
      label: '维权流程',
      badge: null,
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '版权报表',
      badge: null,
    },
    {
      key: '/audit',
      icon: <HistoryOutlined />,
      label: '操作日志',
      badge: null,
      roles: ['admin'],
    },
  ];

  const filteredMenuItems = allMenuItems.filter((item) => {
    if (item.roles && user) {
      return item.roles.includes(user.role);
    }
    return true;
  });

  const menuItems = filteredMenuItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{item.label}</span>
        {item.badge && (
          <Tag color="red" style={{ marginLeft: 8 }}>
            {item.badge}
          </Tag>
        )}
      </div>
    ),
  }));

  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div>
          <div style={{ fontWeight: 500 }}>{user?.name || '用户'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{roleMap[user?.role] || user?.role}</div>
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
      onClick: onLogout,
    },
  ];

  const selectedKey = allMenuItems.find((item) =>
    location.pathname.startsWith(item.key)
  )?.key || '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={240}
        collapsedWidth={80}
        style={{
          background: '#001529',
        }}
      >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000c17',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {collapsed ? (
          <div
            style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            CP
          </div>
        ) : (
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
            版权管控系统
          </div>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 'none', paddingTop: 16 }}
      />
    </Sider>

    <Layout>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          height: 64,
          lineHeight: '64px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <div style={{ fontSize: 18, fontWeight: 500, color: '#1f1f1f' }}>
            课程版权管控工作台
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Space size="middle">
            <Tag color="blue">{roleMap[user?.role] || user?.role}</Tag>
          </Space>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar style={{ backgroundColor: '#1677ff' }} size="large">
                <UserOutlined />
              </Avatar>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, color: '#1f1f1f' }}>{user?.name || '用户'}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>{roleMap[user?.role]}</div>
              </div>
              <DownOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
            </div>
          </Dropdown>
        </div>
      </Header>

      <Content
        style={{
          padding: '24px',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Content>
    </Layout>
  </Layout>
  );
};

export default MainLayout;
