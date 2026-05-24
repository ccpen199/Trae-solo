import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import {
  DashboardOutlined,
  CarOutlined,
  ShopOutlined,
  FileTextOutlined,
  WalletOutlined,
  AlertOutlined,
  CalculatorOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, RoleMap } from '../types';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const getMenuItems = () => {
    const items = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: '运营看板' },
    ];

    if (['operation', 'store', 'admin'].includes(user.role)) {
      items.push({ key: '/vehicles', icon: <CarOutlined />, label: '车辆管理' });
      items.push({ key: '/stores', icon: <ShopOutlined />, label: '门店管理' });
    }

    items.push({ key: '/orders', icon: <FileTextOutlined />, label: '订单管理' });
    items.push({ key: '/deposits', icon: <WalletOutlined />, label: '押金管理' });
    items.push({ key: '/violations', icon: <AlertOutlined />, label: '违章管理' });
    items.push({ key: '/settlements', icon: <CalculatorOutlined />, label: '结算管理' });

    if (['risk', 'operation', 'admin'].includes(user.role)) {
      items.push({ key: '/license', icon: <SafetyOutlined />, label: '驾照审核' });
    }

    if (['operation', 'admin'].includes(user.role)) {
      items.push({ key: '/users', icon: <TeamOutlined />, label: '用户管理' });
    }

    return items;
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
      { key: 'settings', icon: <SettingOutlined />, label: '账户设置', onClick: () => navigate('/profile') },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: onLogout }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" width={220}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 12 : 18, fontWeight: 600, padding: '0 16px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <CarOutlined style={{ marginRight: collapsed ? 0 : 8, fontSize: 24, flexShrink: 0 }} />
          {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>汽车租赁</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', flex: 1 }}>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,0.08)', height: 64, lineHeight: '64px', minHeight: 64, flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'rgba(0,0,0,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: 24 }}>
            {getMenuItems().find(item => item.key === location.pathname)?.label || '汽车租赁管理系统'}
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 12px', whiteSpace: 'nowrap', height: 64 }}>
              <Avatar size={32} style={{ backgroundColor: '#1677ff', marginRight: 8, flexShrink: 0 }}>
                {user?.real_name?.charAt(0) || user?.username?.charAt(0) || '用'}
              </Avatar>
              <span style={{ marginRight: 8, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.real_name || user?.username || '用户'}</span>
              <Badge color="green" style={{ marginRight: 8 }} />
              <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>{RoleMap[user?.role as keyof typeof RoleMap] || ''}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, padding: 24, minHeight: 'calc(100vh - 64px)', background: '#f5f7fa', flex: 1, overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
