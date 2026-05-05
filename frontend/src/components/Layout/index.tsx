import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: 'base-data',
    icon: <AppstoreOutlined />,
    label: '基础数据',
    children: [
      { key: '/materials', icon: <AppstoreOutlined />, label: '物料管理' },
      { key: '/suppliers', icon: <TeamOutlined />, label: '供应商管理' },
      { key: '/customers', icon: <UserOutlined />, label: '客户管理' },
      { key: '/warehouses', icon: <InboxOutlined />, label: '仓库管理' },
    ],
  },
  {
    key: 'inventory',
    icon: <InboxOutlined />,
    label: '仓库管理',
    children: [
      { key: '/inventory', icon: <InboxOutlined />, label: '库存查询' },
      { key: '/stock-in', icon: <ShoppingCartOutlined />, label: '入库管理' },
      { key: '/stock-out', icon: <ShoppingOutlined />, label: '出库管理' },
    ],
  },
  {
    key: 'purchase',
    icon: <ShoppingCartOutlined />,
    label: '采购管理',
    children: [
      { key: '/purchase-orders', icon: <FileTextOutlined />, label: '采购订单' },
      { key: '/purchase-settlements', icon: <FileTextOutlined />, label: '采购结算' },
    ],
  },
  {
    key: 'sales',
    icon: <ShoppingOutlined />,
    label: '销售管理',
    children: [
      { key: '/sales-orders', icon: <FileTextOutlined />, label: '销售订单' },
    ],
  },
  {
    key: 'finance',
    icon: <FileTextOutlined />,
    label: '财务管理',
    children: [
      { key: '/account-payables', icon: <FileTextOutlined />, label: '应付账款' },
      { key: '/account-receivables', icon: <FileTextOutlined />, label: '应收账款' },
    ],
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统设置',
    children: [
      { key: '/employees', icon: <TeamOutlined />, label: '人事管理' },
      { key: '/users', icon: <UserOutlined />, label: '用户管理' },
    ],
  },
];

function convertToMenuItem(items: MenuItem[]): MenuProps['items'] {
  return items.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    children: item.children ? convertToMenuItem(item.children) : undefined,
  }));
}

export default function MainLayout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <span>
          <UserOutlined /> 个人信息
        </span>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <SettingOutlined /> 设置
        </span>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <span onClick={handleLogout}>
          <LogoutOutlined /> 退出登录
        </span>
      ),
    },
  ];

  const getOpenKeys = () => {
    const path = location.pathname;
    for (const item of menuItems) {
      if (item.children) {
        const hasChild = item.children.some((child) => child.key === path);
        if (hasChild) {
          return [item.key];
        }
      }
    }
    return [];
  };

  return (
    <Layout className="layout-container">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ minHeight: '100vh' }}
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
          <span style={{ color: '#fff', fontSize: collapsed ? 16 : 18, fontWeight: 600 }}>
            {collapsed ? 'ERP' : 'ERP管理系统'}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={getOpenKeys()}
          items={convertToMenuItem(menuItems)}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="layout-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
              color: '#fff',
            }}
          />
          <div className="layout-user">
            <Avatar icon={<UserOutlined />} />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <span style={{ cursor: 'pointer' }}>
                {user?.realName || user?.username} <span style={{ marginLeft: 4 }}>▼</span>
              </span>
            </Dropdown>
          </div>
        </Header>
        <Content className="layout-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
