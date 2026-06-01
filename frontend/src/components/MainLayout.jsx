import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  KeyOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  WarningOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { authApi } from '../services/api';

const { Header, Sider, Content } = Layout;

function MainLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authApi.logout().finally(() => {
      localStorage.removeItem('token');
      onLogout();
      navigate('/login');
    });
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/credentials', icon: <KeyOutlined />, label: '凭据管理' },
    { key: '/teams', icon: <TeamOutlined />, label: '团队项目' },
    { key: '/access', icon: <SafetyCertificateOutlined />, label: '访问授权' },
    { key: '/rotation', icon: <ReloadOutlined />, label: '轮换中心' },
    { key: '/incidents', icon: <WarningOutlined />, label: '安全事件' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ key: '/audit', icon: <FileTextOutlined />, label: '审计日志' });
  }

  const userMenu = {
    items: [
      { key: 'user', label: `${user?.username} (${user?.role})`, disabled: true },
      { key: 'dept', label: user?.department, disabled: true },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          🔐 密码保险库
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: 'white', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <Space size={24}>
            <Badge count={0} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size={32} icon={<UserOutlined />} />
                <span>{user?.username}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
