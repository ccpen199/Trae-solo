import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Badge, Breadcrumb } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  AppstoreOutlined, 
  ThunderboltOutlined, 
  FileTextOutlined, 
  AlertOutlined, 
  AuditOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { alertApi } from '../services/api.js';

const { Header, Sider, Content } = Layout;

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadAlertCount();
  }, []);

  const loadAlertCount = async () => {
    try {
      const response = await alertApi.getList({ status: 'open' });
      setAlertCount(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getBreadcrumb = () => {
    const pathMap = {
      '/workbench': ['工作台'],
      '/applications': ['应用管理', '应用列表'],
      '/tasks': ['压测中心', '任务列表'],
      '/change-orders': ['变更管理', '变更单'],
      '/alerts': ['告警中心', '告警列表'],
      '/audit': ['系统审计', '审计日志']
    };
    return pathMap[location.pathname] || [location.pathname.substring(1)];
  };

  const menuItems = [
    {
      key: '/workbench',
      icon: <DashboardOutlined />,
      label: '工作台'
    },
    {
      key: '/applications',
      icon: <AppstoreOutlined />,
      label: '应用管理'
    },
    {
      key: '/tasks',
      icon: <ThunderboltOutlined />,
      label: '压测中心'
    },
    {
      key: '/change-orders',
      icon: <FileTextOutlined />,
      label: '变更管理'
    },
    {
      key: '/alerts',
      icon: <Badge count={alertCount} size="small"><AlertOutlined /></Badge>,
      label: '告警中心'
    },
    {
      key: '/audit',
      icon: <AuditOutlined />,
      label: '系统审计'
    }
  ];

  const userMenu = {
    items: [
      {
        key: 'user',
        icon: <UserOutlined />,
        label: `${user?.name} (${user?.role})`,
        disabled: true
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  };

  const roleMap = {
    platform_engineer: '平台工程师',
    ops: '运维工程师',
    developer: '开发者',
    app_owner: '应用负责人',
    security_admin: '安全管理员'
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div className="logo" style={{ padding: '0 16px' }}>
          {collapsed ? 'API' : 'API 压测工具'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {menuItems.find(m => m.key === location.pathname)?.label || 'API 压测工具'}
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.name}</span>
              <span style={{ color: '#999', fontSize: 12 }}>({roleMap[user?.role] || user?.role})</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '0 16px', padding: 24, background: '#f0f2f5' }}>
          <Breadcrumb className="breadcrumb-nav" items={getBreadcrumb().map(item => ({ title: item }))} />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
