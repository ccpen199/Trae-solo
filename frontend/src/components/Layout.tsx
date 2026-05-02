import React from 'react';
import { Layout as AntLayout, Menu, Dropdown, Avatar, Button } from 'antd';
import {
  DashboardOutlined,
  ScanOutlined,
  TruckOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const roleMenuItems: Record<string, { key: string; icon: React.ReactNode; label: string; path: string }[]> = {
  courier: [
    { key: 'scan', icon: <ScanOutlined />, label: '扫码入库', path: '/courier/scan' },
    { key: 'delivery', icon: <TruckOutlined />, label: '派件管理', path: '/courier/delivery' },
    { key: 'packages', icon: <FileTextOutlined />, label: '包裹列表', path: '/courier/packages' },
  ],
  admin: [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '数据看板', path: '/admin/dashboard' },
    { key: 'packages', icon: <FileTextOutlined />, label: '包裹管理', path: '/admin/packages' },
    { key: 'exceptions', icon: <WarningOutlined />, label: '异常处理', path: '/admin/exceptions' },
    { key: 'performance', icon: <UserOutlined />, label: '绩效统计', path: '/admin/performance' },
  ],
  customer_service: [
    { key: 'search', icon: <SearchOutlined />, label: '包裹查询', path: '/cs/search' },
    { key: 'exceptions', icon: <WarningOutlined />, label: '异常处理', path: '/cs/exceptions' },
  ]
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const menuItems = roleMenuItems[user.role] || [];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user',
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{user.role === 'admin' ? '站点管理员' : user.role === 'courier' ? '快递员' : '客服'}</div>
        </div>
      ),
      disabled: true
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      }
    }
  ];

  const getDefaultSelectedKey = () => {
    const item = menuItems.find(m => location.pathname.startsWith(m.path));
    return item?.key || menuItems[0]?.key;
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>
            快递末端派件系统
          </span>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[getDefaultSelectedKey()]}
          style={{ borderRight: 0 }}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.path}>{item.label}</Link>
          }))}
        />
      </Sider>
      
      <AntLayout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: 16 }}>
            {menuItems.find(m => location.pathname.startsWith(m.path))?.label || '首页'}
          </div>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" style={{ height: '100%' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
              {user.name}
            </Button>
          </Dropdown>
        </Header>
        
        <Content style={{ margin: 24, background: '#fff', padding: 24, borderRadius: 4 }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
