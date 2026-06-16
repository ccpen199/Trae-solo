import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, Typography, Button, Badge, message } from 'antd';
import {
  DashboardOutlined, UnorderedListOutlined, ShopOutlined, UserOutlined,
  ApiOutlined, EnvironmentOutlined, AlertOutlined, LogoutOutlined,
  SafetyCertificateOutlined, TruckOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Brands from './pages/Brands';
import Couriers from './pages/Couriers';
import ApiCenter from './pages/ApiCenter';
import Branches from './pages/Branches';
import Complaints from './pages/Complaints';
import PriceCompare from './pages/PriceCompare';
import CreateOrder from './pages/CreateOrder';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function PrivateRoute({ children }: { children: JSX.Element }) {
  const nav = useNavigate();
  const token = localStorage.getItem('token');
  useEffect(() => {
    if (!token) nav('/login');
  }, [token, nav]);
  return token ? children : null;
}

export default function App() {
  const location = useLocation();
  const nav = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    nav('/login');
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">运营管理台</Link> },
    { key: '/orders', icon: <UnorderedListOutlined />, label: <Link to="/orders">运单管理</Link> },
    { key: '/create', icon: <TruckOutlined />, label: <Link to="/create">智能发件</Link> },
    { key: '/price', icon: <SafetyCertificateOutlined />, label: <Link to="/price">比价引擎</Link> },
    { key: '/brands', icon: <ShopOutlined />, label: <Link to="/brands">品牌资源池</Link> },
    { key: '/couriers', icon: <UserOutlined />, label: <Link to="/couriers">快递员池</Link> },
    { key: '/branches', icon: <EnvironmentOutlined />, label: <Link to="/branches">网点拓扑</Link> },
    { key: '/complaints', icon: <AlertOutlined />, label: <Link to="/complaints">投诉SLA</Link> },
    { key: '/api', icon: <ApiOutlined />, label: <Link to="/api">开放接口中心</Link> },
  ];

  if (location.pathname === '/login') return <Login />;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{ position: 'sticky', top: 0, height: '100vh' }}
      >
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {!collapsed ? (
            <Space>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TruckOutlined style={{ fontSize: 18 }} />
              </div>
              <Title level={5} style={{ color: '#fff', margin: 0 }}>快递开放平台</Title>
            </Space>
          ) : (
            <TruckOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ border: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10
        }}>
          <Text type="secondary">
            {menuItems.find(m => m.key === location.pathname)?.label?.props?.children || '快递全链路协同开放平台'}
          </Text>
          <Space>
            <Badge count={3} size="small">
              <Button type="text" icon={<AlertOutlined />}>告警</Button>
            </Badge>
            <Dropdown menu={{
              items: [
                { key: 'profile', icon: <UserOutlined />, label: user?.name || '用户' },
                { type: 'divider' as const },
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout }
              ]
            }}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ background: '#1677ff' }} icon={<UserOutlined />} />
                <Text strong>{user?.name || user?.username || '未登录'}</Text>
                <Text type="secondary">（{user?.role === 'admin' ? '管理员' : user?.role === 'courier' ? '快递员' : '用户'}）</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f5f7fa' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
            <Route path="/create" element={<PrivateRoute><CreateOrder /></PrivateRoute>} />
            <Route path="/create-order" element={<PrivateRoute><CreateOrder /></PrivateRoute>} />
            <Route path="/price" element={<PrivateRoute><PriceCompare /></PrivateRoute>} />
            <Route path="/brands" element={<PrivateRoute><Brands /></PrivateRoute>} />
            <Route path="/couriers" element={<PrivateRoute><Couriers /></PrivateRoute>} />
            <Route path="/branches" element={<PrivateRoute><Branches /></PrivateRoute>} />
            <Route path="/complaints" element={<PrivateRoute><Complaints /></PrivateRoute>} />
            <Route path="/api" element={<PrivateRoute><ApiCenter /></PrivateRoute>} />
            <Route path="*" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
