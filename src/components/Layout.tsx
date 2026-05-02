import React from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Badge } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  CustomerServiceOutlined,
  BarChartOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { toggleSidebar } from '../store/slices/uiSlice';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarCollapsed, alerts } = useSelector((state: RootState) => state.ui);

  const roleMenus: Record<string, { path: string; icon: React.ReactNode; label: string }[]> = {
    operation: [
      { path: '/dashboard', icon: <DashboardOutlined />, label: '仪表板' },
      { path: '/shops', icon: <ShopOutlined />, label: '店铺管理' },
      { path: '/products', icon: <AppstoreOutlined />, label: '商品管理' },
      { path: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
      { path: '/warehouse', icon: <InboxOutlined />, label: '仓库工作台' },
      { path: '/customer-service', icon: <CustomerServiceOutlined />, label: '客服工作台' },
      { path: '/analytics', icon: <BarChartOutlined />, label: '数据分析' },
      { path: '/alerts', icon: <BellOutlined />, label: '预警中心' }
    ],
    purchase: [
      { path: '/dashboard', icon: <DashboardOutlined />, label: '仪表板' },
      { path: '/products', icon: <AppstoreOutlined />, label: '商品管理' },
      { path: '/alerts', icon: <BellOutlined />, label: '预警中心' }
    ],
    warehouse: [
      { path: '/dashboard', icon: <DashboardOutlined />, label: '仪表板' },
      { path: '/warehouse', icon: <InboxOutlined />, label: '仓库工作台' },
      { path: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
      { path: '/alerts', icon: <BellOutlined />, label: '预警中心' }
    ],
    customer_service: [
      { path: '/dashboard', icon: <DashboardOutlined />, label: '仪表板' },
      { path: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
      { path: '/customer-service', icon: <CustomerServiceOutlined />, label: '客服工作台' },
      { path: '/alerts', icon: <BellOutlined />, label: '预警中心' }
    ]
  };

  const menus = user ? roleMenus[user.role] || [] : [];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const roleLabels: Record<string, string> = {
    operation: '运营',
    purchase: '采购',
    warehouse: '仓库',
    customer_service: '客服'
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录'
    }
  ];

  const selectedKey = menus.find(m => location.pathname.startsWith(m.path))?.path || '/dashboard';

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#001529'
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          padding: sidebarCollapsed ? 0 : '0 20px',
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {sidebarCollapsed ? '跨境' : '跨境电商系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menus.map(item => ({
            key: item.path,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate(item.path)
          }))}
        />
      </Sider>
      <AntLayout style={{ marginLeft: sidebarCollapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(sidebarCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              style: { fontSize: 18, cursor: 'pointer' },
              onClick: () => dispatch(toggleSidebar())
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Badge count={alerts.length} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => navigate('/alerts')} />
            </Badge>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') handleLogout();
                }
              }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1890ff' }}>
                  {user?.name?.[0] || user?.username?.[0] || 'U'}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.name || user?.username}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>{user ? roleLabels[user.role] : ''}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24, minHeight: 'calc(100vh - 112px)' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;