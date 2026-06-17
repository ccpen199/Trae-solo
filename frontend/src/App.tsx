import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, Typography, Button, Badge, message, Result, Spin, Empty, Tag } from 'antd';
import {
  DashboardOutlined, UnorderedListOutlined, ShopOutlined, UserOutlined,
  ApiOutlined, EnvironmentOutlined, AlertOutlined, LogoutOutlined,
  SafetyCertificateOutlined, TruckOutlined, LockOutlined, InfoCircleOutlined,
  LoadingOutlined, ReloadOutlined, LoginOutlined, HomeOutlined
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
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
const { Title, Text, Paragraph } = Typography;

type Role = 'admin' | 'user' | 'courier' | null;

const ROLE_PERMISSIONS: Record<Exclude<Role, null>, {
  allowedPaths: string[];
  defaultPath: string;
  deniedHint: string;
  roleLabel: string;
}> = {
  admin: {
    allowedPaths: ['/', '/orders', '/create', '/create-order', '/price', '/brands', '/couriers', '/branches', '/complaints', '/api'],
    defaultPath: '/',
    deniedHint: '平台管理员可访问全部 9 个模块',
    roleLabel: '平台管理员'
  },
  user: {
    allowedPaths: ['/orders', '/create', '/create-order', '/price', '/brands', '/couriers'],
    defaultPath: '/orders',
    deniedHint: '普通用户仅可访问：运单/发件/比价/品牌/快递员，不可进入运营台与API中心',
    roleLabel: '普通用户（发件方）'
  },
  courier: {
    allowedPaths: ['/couriers', '/complaints', '/orders', '/brands'],
    defaultPath: '/couriers',
    deniedHint: '快递员仅可访问：工作台/投诉SLA/运单/品牌',
    roleLabel: '品牌快递员'
  },
};

const ALL_MENUS = [
  { key: '/',       icon: <DashboardOutlined />,     label: <Link to="/">运营管理台</Link>,              roles: ['admin' as Role], title: '运营管理台' },
  { key: '/orders', icon: <UnorderedListOutlined />, label: <Link to="/orders">运单管理</Link>,         roles: ['admin', 'user', 'courier'] as Role[], title: '运单管理' },
  { key: '/create', icon: <TruckOutlined />,         label: <Link to="/create">智能发件</Link>,         roles: ['admin', 'user'] as Role[], title: '智能发件' },
  { key: '/price',  icon: <SafetyCertificateOutlined />, label: <Link to="/price">比价引擎</Link>,    roles: ['admin', 'user'] as Role[], title: '比价引擎' },
  { key: '/brands', icon: <ShopOutlined />,          label: <Link to="/brands">品牌资源池</Link>,      roles: ['admin', 'user', 'courier'] as Role[], title: '品牌资源池' },
  { key: '/couriers', icon: <UserOutlined />,        label: <Link to="/couriers">快递员池</Link>,       roles: ['admin', 'user', 'courier'] as Role[], title: '快递员池' },
  { key: '/branches', icon: <EnvironmentOutlined />, label: <Link to="/branches">网点拓扑</Link>,       roles: ['admin'] as Role[], title: '网点拓扑' },
  { key: '/complaints', icon: <AlertOutlined />,     label: <Link to="/complaints">投诉SLA</Link>,      roles: ['admin', 'courier'] as Role[], title: '投诉SLA' },
  { key: '/api',    icon: <ApiOutlined />,           label: <Link to="/api">开放接口中心</Link>,        roles: ['admin'] as Role[], title: '开放接口中心' },
];

/* ============ 工具函数 ============ */
function parseUser(): { user: any; role: Role; token: string | null } {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role: Role = user?.role || null;
  return { user, role, token };
}

function isPathAllowed(role: Role, pathname: string): boolean {
  if (!role) return false;
  const perm = ROLE_PERMISSIONS[role];
  if (!perm) return false;
  return perm.allowedPaths.some(p => p === pathname || (p === '/create' && pathname === '/create-order'));
}

/* ============ 页面级空状态组件 ============ */
function PageLoading({ text }: { text?: string }) {
  return (
    <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: '#1677ff' }} spin />} />
      <Text type="secondary" style={{ fontSize: 13 }}>{text || '页面加载中...'}</Text>
    </div>
  );
}

function PageNoPermission({ role, pathname, onBack, onLogin }: {
  role: Role; pathname: string; onBack: () => void; onLogin: () => void;
}) {
  const perm = role ? ROLE_PERMISSIONS[role] : null;
  const roleLabel = perm?.roleLabel || '未登录访客';
  return (
    <Result
      status="warning"
      icon={<LockOutlined style={{ color: '#faad14', fontSize: 48 }} />}
      title={<Space><Badge color="#faad14" text="权限边界提醒" />无访问权限</Space>}
      subTitle={
        <div style={{ textAlign: 'left', maxWidth: 480, margin: '0 auto' }}>
          <Paragraph style={{ marginBottom: 8 }}>
            当前身份：<Text strong>{roleLabel}</Text>，无法访问路径 <Text code>{pathname}</Text>
          </Paragraph>
          <Paragraph type="secondary" style={{ fontSize: 12, lineHeight: 1.8 }}>
            {perm ? (
              <>
                <div>🔒 权限范围：{perm.deniedHint}</div>
                <div>✅ 允许模块：{perm.allowedPaths.filter(p => p !== '/create-order').join(' / ')}</div>
                <div>🎯 建议路径：点击下方按钮返回你的工作台首页</div>
              </>
            ) : (
              <>你还没有登录，无法访问任何业务页面。请先登录选择对应角色身份进入。</>
            )}
          </Paragraph>
        </div>
      }
      extra={[
        <Button key="back" type="primary" icon={<HomeOutlined />} onClick={onBack}>
          回到 {perm?.roleLabel ? perm.roleLabel + '工作台' : '登录页'}
        </Button>,
        <Button key="login" icon={<LoginOutlined />} onClick={onLogin}>
          {role ? '切换账号登录' : '立即登录'}
        </Button>,
        <Button key="retry" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
          刷新重试
        </Button>,
      ]}
    />
  );
}

function PageNotFound({ onHome }: { onHome: () => void }) {
  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，你访问的页面不存在或已下线。"
      extra={[
        <Button type="primary" key="home" icon={<HomeOutlined />} onClick={onHome}>返回首页</Button>,
        <Button key="back" onClick={() => window.history.back()}>返回上一页</Button>,
      ]}
    />
  );
}

/* ============ 授权路由组件 ============ */
function PrivateRoute({ children }: { children: JSX.Element }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { user, role, token } = parseUser();
  const [loading, setLoading] = useState(!token);
  const [checkDone, setCheckDone] = useState(false);

  useEffect(() => {
    if (!token) {
      // 未登录：短暂展示加载状态后跳登录（避免白屏闪烁）
      const t = setTimeout(() => setLoading(false), 200);
      return () => clearTimeout(t);
    }
    setLoading(false);
    setCheckDone(true);
  }, [token, loc.pathname]);

  // 未登录 → 展示 Loading → 然后用 Navigate 同步跳转到登录页
  if (!token) {
    if (loading) {
      return <PageLoading text="正在跳转到登录页..." />;
    }
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }

  // 已登录但路径不在允许范围内 → 无权限页
  if (role && !isPathAllowed(role, loc.pathname)) {
    const defaultPath = ROLE_PERMISSIONS[role].defaultPath;
    return (
      <PageNoPermission
        role={role}
        pathname={loc.pathname}
        onBack={() => nav(defaultPath, { replace: true })}
        onLogin={() => nav('/login', { replace: true })}
      />
    );
  }

  // 正常访问
  return children;
}

/* ============ 错误边界 ============ */
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary] 渲染错误:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: 24 }}>
          <div style={{ maxWidth: 480, width: '100%', background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <h2 style={{ margin: '0 0 8px', color: '#cf1322' }}>页面加载异常</h2>
              <p style={{ color: '#8c8c8c', fontSize: 13, margin: 0 }}>页面渲染时出现错误，以下是详细信息：</p>
            </div>
            <div style={{ padding: 12, background: '#fff2f0', borderRadius: 8, marginBottom: 20, fontSize: 12, color: '#cf1322', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {this.state.error || '未知错误'}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => window.location.href = '/login'} style={{ padding: '8px 20px', background: '#1677ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                🔐 去登录页
              </button>
              <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', background: '#fff', color: '#1677ff', border: '1px solid #1677ff', borderRadius: 6, cursor: 'pointer' }}>
                🔄 刷新重试
              </button>
              <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ padding: '8px 20px', background: '#fff', color: '#8c8c8c', border: '1px solid #d9d9d9', borderRadius: 6, cursor: 'pointer' }}>
                🧹 清理缓存后重试
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#bfbfbf', marginTop: 20, marginBottom: 0 }}>
              快递全链路协同开放平台 · 错误兜底页面
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============ 主应用 ============ */
function AppInner() {
  const location = useLocation();
  const nav = useNavigate();
  
  // 初始化时同步读取 localStorage，避免首屏 null 导致的错误跳转
  const initial = parseUser();
  const [user, setUser] = useState<any>(initial.user);
  const [role, setRole] = useState<Role>(initial.role);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const p = parseUser();
    setUser(p.user);
    setRole(p.role);
  }, [location.pathname]);

  // 登录页独立渲染
  if (location.pathname === '/login') {
    return <Login />;
  }

  // 未登录时的根路径：直接 Navigate 到登录页（避免布局闪烁）
  if (!role && location.pathname !== '/login') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const perm = role ? ROLE_PERMISSIONS[role] : null;
  const menuLabel = role === 'admin' ? '平台管理员' : role === 'courier' ? '品牌快递员' : '普通用户';
  const menuColor = role === 'admin' ? '#1677ff' : role === 'courier' ? '#fa8c16' : '#52c41a';
  const defaultPath = perm?.defaultPath || '/login';

  const menus = role ? ALL_MENUS.filter(m => m.roles.includes(role)) : [];

  const pageTitle = () => {
    if (location.pathname === '/create-order') return '智能发件';
    const m = ALL_MENUS.find(mm => mm.key === location.pathname);
    return m?.title || '快递全链路协同开放平台';
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setRole(null);
    message.success('已退出登录 · Token 与身份信息已清理');
    nav('/login', { replace: true });
  };

  const goDefault = () => nav(defaultPath, { replace: true });

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
          color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
        }} onClick={goDefault}>
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

        {!collapsed && role && perm && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Badge color={menuColor} /><Text strong style={{ color: '#fff' }}>{menuLabel}</Text>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 1.5 }}>
              允许 {perm.allowedPaths.filter(p => p !== '/create-order').length} 个模块
            </div>
            <Button
              size="small" type="link" style={{ padding: 0, marginTop: 4, fontSize: 11, color: menuColor }}
              onClick={goDefault}
              icon={<DashboardOutlined />}
            >
              回到 {role === 'admin' ? '运营台' : role === 'courier' ? '工作台' : '我的运单'}
            </Button>
          </div>
        )}

        {role && menus.length > 0 ? (
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname === '/create-order' ? '/create' : location.pathname]}
            items={menus}
            style={{ border: 0 }}
          />
        ) : (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Empty description={<Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>未加载菜单</Text>} />
            <Button size="small" type="primary" icon={<LoginOutlined />} onClick={() => nav('/login')}>
              去登录
            </Button>
          </div>
        )}
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
            {role && perm && (
              <span title={`允许访问：${perm.allowedPaths.join(' / ')}`}>
                <InfoCircleOutlined style={{ color: '#bfbfbf', cursor: 'help' }} />
              </span>
            )}
          </Space>
          <Space>
            <Badge count={3} size="small">
              <Button type="text" icon={<AlertOutlined />}>告警</Button>
            </Badge>
            {user ? (
              <Dropdown menu={{
                items: [
                  {
                    key: 'role-info',
                    icon: <LockOutlined style={{ color: menuColor }} />,
                    label: (
                      <Space direction="vertical" size={0} style={{ padding: 4, minWidth: 220 }}>
                        <Text strong>{user?.name || '用户'} <Tag color={menuColor} style={{ margin: 0 }}>{menuLabel}</Tag></Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          权限范围：{perm?.allowedPaths.filter(p => p !== '/create-order').length} 个业务模块
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.6 }}>
                          {perm?.deniedHint}
                        </Text>
                      </Space>
                    )
                  },
                  { type: 'divider' as const },
                  { key: 'default', icon: <DashboardOutlined />, label: '回到工作台首页', onClick: goDefault },
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
            ) : (
              <Button type="primary" size="small" icon={<LoginOutlined />} onClick={() => nav('/login')}>
                登录
              </Button>
            )}
          </Space>
        </Header>

        <Content style={{ padding: 24, background: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
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
            <Route path="*" element={<PageNotFound onHome={goDefault} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
