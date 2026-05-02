import React, { useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  FileTextOutlined,
  EditOutlined,
  TagsOutlined,
  AuditOutlined,
  ExportOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuthStore, useOrderStore, useUIStore } from '../store/useStore';
import { orderApi } from '../utils/api';

const { Header, Sider, Content } = Layout;

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { todoCounts, setTodoCounts } = useOrderStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  useEffect(() => {
    loadTodoCounts();
  }, []);

  const loadTodoCounts = async () => {
    try {
      const response = await orderApi.getTodoCount();
      setTodoCounts(response.data);
    } catch (error) {
      console.error('加载待办数量失败:', error);
    }
  };

  const getUserMenuItems = () => {
    const items = [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: `当前用户: ${user?.nickname || user?.username}`
      },
      {
        key: 'role',
        label: `角色: ${user?.roleName || user?.role}`
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true
      }
    ];
    return items;
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '仪表盘',
        onClick: () => navigate('/dashboard')
      },
      {
        key: '/orders',
        icon: <FileTextOutlined />,
        label: '订单管理',
        onClick: () => navigate('/orders')
      },
      {
        key: '/templates',
        icon: <TagsOutlined />,
        label: '模板管理',
        onClick: () => navigate('/templates')
      }
    ];

    if (user?.role === 'auditor' || user?.role === 'admin') {
      items.push({
        key: '/review',
        icon: <AuditOutlined />,
        label: (
          <span>
            模板审核
            {todoCounts.pending_template > 0 && (
              <Badge count={todoCounts.pending_template} style={{ marginLeft: 8 }} />
            )}
          </span>
        ),
        onClick: () => navigate('/review')
      });
    }

    if (user?.role === 'creator' || user?.role === 'design_operation' || user?.role === 'admin') {
      items.push({
        key: '/export',
        icon: <ExportOutlined />,
        label: (
          <span>
            导出管理
            {todoCounts.pending_export > 0 && (
              <Badge count={todoCounts.pending_export} style={{ marginLeft: 8 }} />
            )}
          </span>
        ),
        onClick: () => navigate('/export')
      });
    }

    return items;
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/orders/create') return '/orders';
    if (path.startsWith('/orders/')) return '/orders';
    return path;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={toggleSidebar}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          <EditOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          {!sidebarCollapsed && (
            <span style={{ color: 'white', marginLeft: 12, fontSize: 16, fontWeight: 'bold' }}>
              图片编辑器
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={getMenuItems()}
        />
      </Sider>

      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 200 }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {(user?.role === 'design_operation' || user?.role === 'merchant' || user?.role === 'admin') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/orders/create')}
              >
                新建订单
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={todoCounts.total || 0} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
              />
            </Badge>
            
            <Dropdown
              menu={{
                items: getUserMenuItems(),
                onClick: handleMenuClick
              }}
              placement="bottomRight"
            >
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                  {user?.nickname?.charAt(0) || user?.username?.charAt(0)}
                </Avatar>
                <span style={{ color: '#333' }}>{user?.nickname || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#fff',
            minHeight: 280,
            borderRadius: 8
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
