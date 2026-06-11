import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
  DashboardOutlined,
  NotificationOutlined,
  PayCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  FileSearchOutlined,
  DatabaseOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

const rolePermissionMap: Record<number, string[]> = {
  1: ['/admin/dashboard', '/admin/announcements', '/admin/payment', '/admin/work-orders', '/admin/users', '/admin/outlets', '/admin/system'],
  2: ['/admin/dashboard', '/admin/announcements', '/admin/payment', '/admin/work-orders', '/admin/outlets'],
  3: ['/admin/dashboard', '/admin/work-orders'],
  4: ['/admin/dashboard', '/admin/payment'],
};

const hasMenuPermission = (roleId: number, menuKey: string): boolean => {
  const allowed = rolePermissionMap[roleId] || rolePermissionMap[2];
  return allowed.some((prefix) => menuKey.startsWith(prefix));
};

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, isLogin, logout } = useAdminStore();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems: MenuProps['items'] = useMemo(() => {
    const roleId = admin?.roleId || 2;
    const allItems: MenuProps['items'] = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/admin/announcements',
      icon: <NotificationOutlined />,
      label: '公告管理',
      children: [
        { key: '/admin/announcements', label: '公告列表' },
        { key: '/admin/announcements/create', label: '新建公告' },
      ],
    },
    {
      key: '/admin/payment',
      icon: <PayCircleOutlined />,
      label: '缴费管理',
      children: [
        { key: '/admin/payment', label: '缴费记录' },
        { key: '/admin/payment/reconciliation', label: '对账报表' },
      ],
    },
    {
      key: '/admin/work-orders',
      icon: <FileTextOutlined />,
      label: '工单管理',
      children: [
        { key: '/admin/work-orders', label: '工单列表' },
        { key: '/admin/work-orders/pending', label: '待处理工单' },
      ],
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: '用户管理',
      children: [
        { key: '/admin/users', label: '用户列表' },
      ],
    },
    {
      key: '/admin/outlets',
      icon: <FileSearchOutlined />,
      label: '网点管理',
    },
    {
      key: '/admin/system',
      icon: <SettingOutlined />,
      label: '系统设置',
      children: [
        { key: '/admin/system/roles', icon: <SafetyOutlined />, label: '角色权限' },
        { key: '/admin/system/regulatory', icon: <DatabaseOutlined />, label: '监管接口' },
        { key: '/admin/system/audit', label: '审计日志' },
      ],
    },
  ];

    const filterByPermission = (items: MenuProps['items']): MenuProps['items'] => {
      return (items || []).filter((item: any) => {
        if (!item) return false;
        if (!hasMenuPermission(roleId, item.key)) return false;
        if (item.children) {
          item.children = filterByPermission(item.children);
          if (item.children.length === 0) return false;
        }
        return true;
      });
    };

    return filterByPermission(allItems);
  }, [admin?.roleId]);

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/admin/login');
      },
    },
  ];

  useEffect(() => {
    if (!isLogin && location.pathname !== '/admin/login') {
      navigate('/admin/login');
      return;
    }
    if (isLogin && location.pathname !== '/admin/login') {
      const roleId = admin?.roleId || 2;
      if (!hasMenuPermission(roleId, location.pathname)) {
        navigate('/admin/dashboard');
      }
    }
  }, [isLogin, location.pathname, navigate, admin?.roleId]);

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/announcements')) return ['/admin/announcements'];
    if (path.startsWith('/admin/payment')) return ['/admin/payment'];
    if (path.startsWith('/admin/work-orders')) return ['/admin/work-orders'];
    if (path.startsWith('/admin/users')) return ['/admin/users'];
    if (path.startsWith('/admin/outlets')) return ['/admin/outlets'];
    if (path.startsWith('/admin/system')) return ['/admin/system'];
    return [path];
  };

  if (location.pathname === '/admin/login') {
    return <Outlet />;
  }

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={240}
        className="bg-gradient-to-b from-gray-800 to-gray-900"
      >
        <div className="h-16 flex items-center justify-center gap-2 px-4 border-b border-gray-700">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">爱</span>
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-lg">管理后台</span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="border-r-0 mt-2"
        />
      </Sider>

      <Layout>
        <Header
          className="flex items-center justify-between px-6"
          style={{ background: colorBgContainer }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="w-12 h-12"
          />

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              欢迎回来，{admin?.realName || '管理员'}
              <span className="ml-2 text-primary-500">({admin?.roleName})</span>
            </span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar size={36} icon={<UserOutlined />} className="bg-primary-500" />
                <div>
                  <div className="text-sm font-medium text-gray-800">{admin?.realName}</div>
                  <div className="text-xs text-gray-500">{admin?.roleName}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          className="m-6 p-6"
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
