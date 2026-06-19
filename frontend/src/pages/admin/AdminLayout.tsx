import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Tag } from 'antd';
import { DashboardOutlined, WarningOutlined, SafetyOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider, Header, Content } = Layout;

const roleLabels: Record<string, { label: string; color: string }> = {
  platform_admin: { label: '平台管理员', color: 'purple' },
  property_admin: { label: '物业管理员', color: 'orange' },
  resident: { label: '住户', color: 'blue' },
};

const adminMenuItems: MenuProps['items'] = [
  { key: '/admin', icon: <DashboardOutlined />, label: '健康仪表盘' },
  { key: '/admin/fraud', icon: <WarningOutlined />, label: '虚假信息溯源' },
  { key: '/admin/risk', icon: <SafetyOutlined />, label: '红包资金池风控' },
  { key: '/', icon: <SettingOutlined />, label: '返回居民端' },
];

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const storedCommunity = localStorage.getItem('community');
  const community = storedCommunity ? JSON.parse(storedCommunity) : null;
  const userRole = user?.role || 'platform_admin';

  const selectedKey = adminMenuItems?.find((item) => {
    if (!item || typeof item === 'string') return false;
    const key = (item as { key: string }).key;
    if (key === '/') return false;
    if (key === '/admin') return location.pathname === '/admin' || location.pathname.startsWith('/admin/');
    return location.pathname.startsWith(key);
  })
    ? ((adminMenuItems?.find((item) => {
        if (!item || typeof item === 'string') return false;
        const key = (item as { key: string }).key;
        if (key === '/') return false;
        if (key === '/admin') return location.pathname === '/admin' || location.pathname.startsWith('/admin/');
        return location.pathname.startsWith(key);
      }) as { key: string })?.key ?? '/admin')
    : '/admin';

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === '/') {
      navigate('/', { replace: true });
      return;
    }
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('community');
    navigate('/login', { replace: true });
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息', disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') handleLogout();
  };

  const roleInfo = roleLabels[userRole] || roleLabels.platform_admin;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div
          style={{
            height: 32,
            margin: 16,
            color: '#fff',
            textAlign: 'center',
            fontSize: collapsed ? 14 : 16,
            fontWeight: 'bold',
            lineHeight: '32px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? '管理' : '管理后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={adminMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Space>
            <span style={{ fontSize: 16, fontWeight: 500 }}>
              平台管理控制台
            </span>
            <Tag color="purple">邻里数字基座</Tag>
            {community && <Tag color="blue">{community.name} · {community.subdomain}.邻居.中国</Tag>}
          </Space>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: roleInfo.color === 'purple' ? '#722ed1' : roleInfo.color === 'orange' ? '#fa8c16' : '#1890ff' }} />
              <span>{user?.real_name || '管理员'}</span>
              <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#f5f5f5', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
