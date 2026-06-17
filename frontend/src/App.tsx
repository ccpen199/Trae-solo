import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, Typography, Button, Badge, message, Alert, Tooltip, Tag } from 'antd';
import {
  DashboardOutlined, UnorderedListOutlined, ShopOutlined, UserOutlined,
  ApiOutlined, EnvironmentOutlined, AlertOutlined, LogoutOutlined,
  SafetyCertificateOutlined, TruckOutlined, LockOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useEffect, useState, ReactNode } from 'react';
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

type Role = 'admin' | 'user' | 'courier' | null;

const ROLE_PERMISSIONS: Record<Exclude<Role, null>, {
  allowedPaths: string[];
  defaultPath: string;
  deniedHint: string;
}> = {
  admin: {
    allowedPaths: ['/', '/orders', '/create', '/create-order', '/price', '/brands', '/couriers', '/branches', '/complaints', '/api'],
    defaultPath: '/',
    deniedHint: '平台管理员可访问全部 9 个模块'
  },
  user: {
    allowedPaths: ['/orders', '/create', '/create-order', '/price', '/brands', '/couriers'],
    defaultPath: '/orders',
    deniedHint: '普通用户仅可访问：运单/发件/比价/品牌/快递员，不可进入运营台与API中心'
  },
  courier: {
    allowedPaths: ['/couriers', '/complaints', '/orders', '/brands'],
    defaultPath: '/couriers',
    deniedHint: '快递员仅可访问：工作台/投诉SLA/运单/品牌'
  },
};

const ALL_MENUS = [
  { key: '/',       icon: <DashboardOutlined />,     label: <Link to="/">运营管理台</Link>,              roles: ['admin' as Role] },
  { key: '/orders', icon: <UnorderedListOutlined />, label: <Link to="/orders">运单管理</Link>,         roles: ['admin', 'user', 'courier'] as Role[] },
  { key: '/create', icon: <TruckOutlined />,         label: <Link to="/create">智能发件</Link>,         roles: ['admin', 'user'] as Role[] },
  { key: '/price',  icon: <SafetyCertificateOutlined />, label: <Link to="/price">比价引擎</Link>,    roles: ['admin', 'user'] as Role[] },
  { key: '/brands', icon: <ShopOutlined />,          label: <Link to="/brands">品牌资源池</Link>,      roles: ['admin', 'user', 'courier'] as Role[] },
  { key: '/couriers', icon: <UserOutlined />,        label: <Link to="/couriers">快递员池</Link>,       roles: ['admin', 'user', 'courier'] as Role[] },
  { key: '/branches', icon: <EnvironmentOutlined />, label: <Link to="/branches">网点拓扑</Link>,       roles: ['admin'] as Role[] },
  { key: '/complaints', icon: <AlertOutlined />,     label: <Link to="/complaints">投诉SLA</Link>,      roles: ['admin', 'courier'] as Role[] },
  { key: '/api',    icon: <ApiOutlined />,           label: <Link to="/api">开放接口中心</Link>,        roles: ['admin'] as Role[] },
];

function PrivateRoute({ children, requiredRole }: { children: JSX.Element; requiredRole?: Role[] }) {
  const nav = useNavigate();
  const loc = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role: Role = user?.role || null;

  useEffect(() => {
    if (!token) {
      nav('/login');
      return;
    }
    if (role) {
      const perm = ROLE_PERMISSIONS[role];
      if (perm && !perm.allowedPaths.some(p => loc.pathname.startsWith(p.replace('-order', '')) || loc.pathname === p || p === '/create' && loc.pathname === '/create-order')) {
        const currentOk = perm.allowedPaths.some(p => {
          if (p === loc.pathname) return true;
          if (p === '/create' && loc.pathname === '/create-order') return true;
          return false;
        });
        if (!currentOk) {
          message.warning(`【权限边界】${ROLE_PERMISSIONS[role].deniedHint}，已自动跳转到工作台首页`);
          nav(perm.defaultPath);
        }
      }
    }
  }, [token, role, loc.pathname, nav]);

  if (!token) return null;

  const permissionBlock = () => {
    if (!role || !ROLE_PERMISSIONS[role]) return null;
    const perm = ROLE_PERMISSIONS[role];
    const ok = perm.allowedPaths.some(p => p === loc.pathname || (p === '/create' && loc.pathname === '/create-order'));
    if (ok) return null;
    return (
      <div style={{ position: 'absolute', top: 80, right: 24, zIndex: 999, maxWidth: 420 }}>
        <Alert
          type="warning"
          showIcon
          icon={<LockOutlined />}
          message={<Space><Text strong>角色权限边界提示</Text><Badge color="#faad14" text={role === 'admin' ? '管理员' : role === 'courier' ? '快递员' : '普通用户'} /></Space>}
          description={<div style={{ fontSize: 12, lineHeight: 1.8 }}>{perm.deniedHint}<br /><Text type="secondary">若需完整体验，请使用 admin 账号登录运营管理台</Text></div>}
          closable
        />
      </div>
    );
  };

  return (
    <>
      {permissionBlock()}
      {children}
    </>
  );
}

function wrapPrivate(el: JSX.Element, required?: Role[]): ReactNode {
  return <PrivateRoute requiredRole={required}>{el}</PrivateRoute>;
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

  const role: Role = user?.role || null;

  useEffect(() => {
    if (location.pathname === '/login' || !role) return;
    const token = localStorage.getItem('token');
    if (token && role) {
      const perm = ROLE_PERMISSIONS[role];
      const isRoot = location.pathname === '/' || location.pathname === '';
      if (isRoot && role !== 'admin') {
        nav(perm.defaultPath, { replace: true });
      }
    }
  }, [role, location.pathname, nav]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    message.success('已退出登录 · Token 与身份信息已清理');
    nav('/login');
  };

  const menus = ALL_MENUS.filter(m => !role || m.roles.includes(role));
  const menuLabel = role === 'admin' ? '平台管理员' : role === 'courier' ? '品牌快递员' : '普通用户';
  const menuColor = role === 'admin' ? '#1677ff' : role === 'courier' ? '#fa8c16' : '#52c41a';
  const menuDefaultPath = role ? ROLE_PERMISSIONS[role].defaultPath : '/';

  const pageTitle = () => {
    const m = ALL_MENUS.find(mm => mm.key === location.pathname);
    if (m) {
      const children = (m.label as any)?.props?.children;
      return typeof children === 'string' ? children : location.pathname;
    }
    if (location.pathname === '/create-order') return '智能发件';
    return '快递全链路协同开放平台';
  };

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
              <div style={{ width: 32, height: 32, borderRadius: 8, background: menuColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TruckOutlined style={{ fontSize: 18 }} />
              </div>
              <Title level={5} style={{ color: '#fff', margin: 0 }}>快递开放平台</Title>
            </Space>
          ) : (
            <TruckOutlined style={{ fontSize: 22, color: menuColor }} />
          )}
        </div>

        {!collapsed && role && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Badge color={menuColor} /><Text strong style={{ color: '#fff' }}>{menuLabel}</Text>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 1.5 }}>
              权限边界：{ROLE_PERMISSIONS[role].deniedHint}
            </div>
            <Button
              size="small" type="link" style={{ padding: 0, marginTop: 4, fontSize: 11, color: menuColor }}
              onClick={() => nav(menuDefaultPath)}
              icon={<DashboardOutlined />}
            >
              回到 {role === 'admin' ? '运营台首页' : role === 'courier' ? '快递员工作台' : '我的运单'}
            </Button>
          </div>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname === '/create-order' ? '/create' : location.pathname]}
          items={menus}
          style={{ border: 0 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10
        }}>
          <Space>
            <Text type="secondary">{pageTitle()}</Text>
            {role && (
              <Badge color={menuColor} text={<span style={{ fontSize: 11, color: menuColor, fontWeight: 500 }}>{menuLabel}视图</span>} />
            )}
            {role && (
              <Tooltip title={`当前角色允许访问的路径：${ROLE_PERMISSIONS[role].allowedPaths.join(' / ')}`}>
                <InfoCircleOutlined style={{ color: '#bfbfbf' }} />
              </Tooltip>
            )}
          </Space>
          <Space>
            <Badge count={3} size="small">
              <Button type="text" icon={<AlertOutlined />}>告警</Button>
            </Badge>
            <Dropdown menu={{
              items: [
                {
                  key: 'role-info',
                  icon: <LockOutlined style={{ color: menuColor }} />,
                  label: (
                    <Space direction="vertical" size={0} style={{ padding: 4 }}>
                      <Text strong>{user?.name || '用户'} <Tag color={menuColor} style={{ margin: 0 }}>{menuLabel}</Tag></Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>权限范围：{ROLE_PERMISSIONS[role].allowedPaths.length} 个模块</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{ROLE_PERMISSIONS[role].deniedHint}</Text>
                    </Space>
                  )
                },
                { type: 'divider' as const },
                { key: 'default', icon: <DashboardOutlined />, label: '跳转工作台首页', onClick: () => nav(menuDefaultPath) },
                { type: 'divider' as const },
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout }
              ]
            }}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ background: menuColor }} icon={<UserOutlined />} />
                <Text strong>{user?.name || user?.username || '未登录'}</Text>
                <Text type="secondary">（{menuLabel}）</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f5f7fa' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={wrapPrivate(<Dashboard />, ['admin'])} />
            <Route path="/orders" element={wrapPrivate(<Orders />, ['admin', 'user', 'courier'])} />
            <Route path="/create" element={wrapPrivate(<CreateOrder />, ['admin', 'user'])} />
            <Route path="/create-order" element={wrapPrivate(<CreateOrder />, ['admin', 'user'])} />
            <Route path="/price" element={wrapPrivate(<PriceCompare />, ['admin', 'user'])} />
            <Route path="/brands" element={wrapPrivate(<Brands />, ['admin', 'user', 'courier'])} />
            <Route path="/couriers" element={wrapPrivate(<Couriers />, ['admin', 'user', 'courier'])} />
            <Route path="/branches" element={wrapPrivate(<Branches />, ['admin'])} />
            <Route path="/complaints" element={wrapPrivate(<Complaints />, ['admin', 'courier'])} />
            <Route path="/api" element={wrapPrivate(<ApiCenter />, ['admin'])} />
            <Route path="*" element={wrapPrivate(<Dashboard />, ['admin', 'user', 'courier'])} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
