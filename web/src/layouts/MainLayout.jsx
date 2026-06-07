import React, { useState, useEffect } from 'react';
import { Layout, Menu, Breadcrumb, Dropdown, Avatar, Badge, Tag } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  FolderOutlined,
  BankOutlined,
  TeamOutlined,
  BellOutlined,
  StarOutlined,
  SearchOutlined,
  RobotOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  UnorderedListOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/auth';
import { notifications as notifApi } from '../api';

const { Header, Sider, Content, Footer } = Layout;

const ROLE_MAP = {
  super_admin: { label: '超级管理员', color: 'red' },
  admin: { label: '管理员', color: 'orange' },
  operator: { label: '经办人', color: 'blue' },
  reviewer: { label: '审核人', color: 'green' },
  user: { label: '办事人', color: 'default' },
};

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: '/items',
    icon: <AppstoreOutlined />,
    label: '服务事项',
    children: [
      { key: '/items', icon: <UnorderedListOutlined />, label: '事项列表' },
      { key: '/items/create', icon: <PlusOutlined />, label: '新增事项', adminOnly: true },
    ],
  },
  {
    key: '/cases',
    icon: <FileTextOutlined />,
    label: '办件管理',
  },
  {
    key: '/certificates',
    icon: <SafetyCertificateOutlined />,
    label: '电子证照',
  },
  {
    key: '/materials',
    icon: <FolderOutlined />,
    label: '材料库',
  },
  {
    key: '/departments',
    icon: <BankOutlined />,
    label: '部门管理',
    adminOnly: true,
  },
  {
    key: '/users',
    icon: <TeamOutlined />,
    label: '用户管理',
    adminOnly: true,
  },
  {
    key: '/notifications',
    icon: <BellOutlined />,
    label: '消息通知',
  },
  {
    key: '/evaluations',
    icon: <StarOutlined />,
    label: '评价管理',
  },
  {
    key: '/search',
    icon: <SearchOutlined />,
    label: '事项检索',
  },
  {
    key: '/guide',
    icon: <RobotOutlined />,
    label: '智能导办',
  },
];

const breadcrumbMap = {
  '/dashboard': '工作台',
  '/items': '服务事项',
  '/items/create': '新增事项',
  '/cases': '办件管理',
  '/certificates': '电子证照',
  '/materials': '材料库',
  '/departments': '部门管理',
  '/users': '用户管理',
  '/notifications': '消息通知',
  '/evaluations': '评价管理',
  '/search': '事项检索',
  '/guide': '智能导办',
};

function filterMenuByRole(items, user) {
  const isAdmin = user && (user.role === 'super_admin' || user.role === 'admin');
  return items
    .filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      return true;
    })
    .map((item) => {
      if (item.children) {
        const filteredChildren = item.children.filter((child) => {
          if (child.adminOnly && !isAdmin) return false;
          return true;
        });
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter(Boolean);
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const filteredMenuItems = filterMenuByRole(menuItems, user);

  useEffect(() => {
    notifApi.getUnreadCount().then((res) => {
      setUnreadCount(res.data?.count || res.data?.data?.count || 0);
    }).catch(() => {});
  }, []);

  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = [
    { title: '首页' },
    ...pathSnippets.map((snippet, idx) => {
      const url = '/' + pathSnippets.slice(0, idx + 1).join('/');
      return { title: breadcrumbMap[url] || snippet };
    }),
  ];

  const selectedKey = location.pathname.startsWith('/items/')
    ? '/items'
    : location.pathname;

  const openKeys = ['/items'];

  const roleInfo = ROLE_MAP[user?.role] || { label: '未知', color: 'default' };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'password', icon: <KeyOutlined />, label: '修改密码' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        theme="dark"
        breakpoint="lg"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? '云政' : '云南政务'}
        </div>
        {!collapsed && user && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
            <div>{user.real_name || user.username}</div>
            <Tag color={roleInfo.color} style={{ fontSize: 11, marginTop: 4 }}>{roleInfo.label}</Tag>
            {user.department_name && <div style={{ marginTop: 2 }}>{user.department_name}</div>}
          </div>
        )}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={filteredMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              style: { fontSize: 18, cursor: 'pointer' },
              onClick: () => setCollapsed(!collapsed),
            })}
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Badge count={unreadCount} size="small">
              <BellOutlined
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <span>{user?.real_name || user?.username || '用户'}</span>
                <Tag color={roleInfo.color} style={{ fontSize: 11, marginLeft: 4 }}>{roleInfo.label}</Tag>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', minHeight: 280, borderRadius: 4 }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', color: '#999' }}>
          云南省一体化政务服务平台 © 2026
        </Footer>
      </Layout>
    </Layout>
  );
}
