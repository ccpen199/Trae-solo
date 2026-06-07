import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, Tag, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  SendOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  DashboardOutlined,
  OrderedListOutlined,
  TeamOutlined,
  ControlOutlined,
  SafetyCertificateOutlined,
  CreditCardOutlined,
  ApiOutlined,
  EnvironmentOutlined,
  CarryOutOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { getUser, logout, getUserRole, removeToken, removeUser } from '../utils/auth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const requesterMenuItems = [
  { key: '/requester/publish', icon: <SendOutlined />, label: '发布任务', permission: 'publish_order' },
  { key: '/requester/orders', icon: <UnorderedListOutlined />, label: '我的订单', permission: 'review' },
  { key: '/requester/profile', icon: <UserOutlined />, label: '个人中心' },
];

const courierMenuItems = [
  { key: '/courier/available', icon: <ShoppingOutlined />, label: '待接订单', permission: 'accept_order' },
  { key: '/courier/tasks', icon: <CarryOutOutlined />, label: '我的任务', permission: 'complete_order' },
  { key: '/courier/profile', icon: <UserOutlined />, label: '个人中心' },
];

const adminMenuItems = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '运营看板', permission: 'dashboard' },
  { key: '/admin/orders', icon: <OrderedListOutlined />, label: '订单管理', permission: 'order_manage' },
  { key: '/admin/couriers', icon: <TeamOutlined />, label: '跑腿员管理', permission: 'courier_manage' },
  { key: '/admin/dispatch', icon: <ControlOutlined />, label: '调度中心', permission: 'dispatch' },
  { key: '/admin/quality', icon: <SafetyCertificateOutlined />, label: '质检规则', permission: 'quality_rules' },
  { key: '/admin/credit', icon: <CreditCardOutlined />, label: '信用管理', permission: 'credit_manage' },
  { key: '/admin/enterprise', icon: <ApiOutlined />, label: '企业对接', permission: 'enterprise_api' },
  { key: '/admin/areas', icon: <EnvironmentOutlined />, label: '服务区域', permission: 'service_areas' },
];

const menuMap = {
  requester: requesterMenuItems,
  courier: courierMenuItems,
  admin: adminMenuItems,
};

const roleLabelMap = {
  requester: '需求方',
  courier: '跑腿员',
  admin: '平台运营',
};

const roleColorMap = {
  admin: 'purple',
  requester: 'blue',
  courier: 'green',
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const role = getUserRole();

  const userPermissions = user?.permissions || [];
  const roleLabel = user?.roleLabel || roleLabelMap[role] || '';
  const roleColor = roleColorMap[role] || 'default';

  const allMenuItems = menuMap[role] || [];
  const menuItems = allMenuItems.filter(item =>
    !item.permission || userPermissions.includes(item.permission)
  );

  const selectedKey = menuItems.find((item) =>
    location.pathname.startsWith(item.key)
  )?.key || location.pathname;

  const handleLogout = () => {
    removeToken();
    removeUser();
    message.success('已退出登录');
    navigate('/login', { replace: true });
  };

  const dropdownItems = {
    items: [
      {
        key: 'role',
        label: (
          <span>
            当前角色：<Tag color={roleColor}>{roleLabel}</Tag>
          </span>
        ),
        disabled: true,
      },
      {
        key: 'perms',
        label: `权限：${userPermissions.length} 项`,
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人信息',
        onClick: () => navigate(`/${role}/profile`),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={230}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <SendOutlined style={{ fontSize: 24, color: '#667eea' }} />
          {!collapsed && (
            <Text strong style={{ color: '#fff', marginLeft: 10, fontSize: 15, whiteSpace: 'nowrap' }}>
              即时服务调度
            </Text>
          )}
        </div>
        {!collapsed && (
          <div style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Tag color={roleColor} style={{ margin: 0, fontSize: 11 }}>
              {roleLabel}工作台
            </Tag>
          </div>
        )}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 'none' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 230, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {collapsed ? (
              <MenuUnfoldOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => setCollapsed(false)} />
            ) : (
              <MenuFoldOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => setCollapsed(true)} />
            )}
            <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag color={roleColor} style={{ margin: 0 }}>
                {roleLabel}
              </Tag>
              <Text type="secondary">
                权限: {userPermissions.length} 项
              </Text>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Badge count={0} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={dropdownItems} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ background: roleColor }} />
                <Text strong style={{ fontSize: 13 }}>{user?.name || user?.phone || '用户'}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: 24, minHeight: 'calc(100vh - 64px - 48px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
