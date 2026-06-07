import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, Layout, Result, Button } from 'antd'
import {
  DashboardOutlined,
  PictureOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  AppstoreOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { isLoggedIn, getAuth, removeAuth } from './utils/auth'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DesignSchemes from './pages/DesignSchemes'
import Quotations from './pages/Quotations'
import Inspections from './pages/Inspections'
import Materials from './pages/Materials'
import Projects from './pages/Projects'
import Admin from './pages/Admin'

const { Sider, Content, Header } = Layout

const roleMenuItems: Record<string, { key: string; label: string; icon: React.ReactNode }[]> = {
  admin: [
    { key: '/dashboard', label: '仪表盘', icon: <DashboardOutlined /> },
    { key: '/projects', label: '项目管理', icon: <FolderOutlined /> },
    { key: '/designs', label: '设计方案', icon: <PictureOutlined /> },
    { key: '/quotations', label: '报价管理', icon: <FileTextOutlined /> },
    { key: '/inspections', label: '验收管理', icon: <CheckSquareOutlined /> },
    { key: '/materials', label: '材料管理', icon: <AppstoreOutlined /> },
    { key: '/admin', label: '管理面板', icon: <SettingOutlined /> },
  ],
  owner: [
    { key: '/dashboard', label: '我的工作台', icon: <DashboardOutlined /> },
    { key: '/projects', label: '我的项目', icon: <FolderOutlined /> },
    { key: '/designs', label: '设计方案', icon: <PictureOutlined /> },
    { key: '/quotations', label: '报价管理', icon: <FileTextOutlined /> },
    { key: '/inspections', label: '验收管理', icon: <CheckSquareOutlined /> },
  ],
  designer: [
    { key: '/dashboard', label: '我的工作台', icon: <DashboardOutlined /> },
    { key: '/projects', label: '项目管理', icon: <FolderOutlined /> },
    { key: '/designs', label: '设计方案', icon: <PictureOutlined /> },
  ],
  company: [
    { key: '/dashboard', label: '我的工作台', icon: <DashboardOutlined /> },
    { key: '/projects', label: '项目管理', icon: <FolderOutlined /> },
    { key: '/quotations', label: '报价管理', icon: <FileTextOutlined /> },
    { key: '/inspections', label: '验收管理', icon: <CheckSquareOutlined /> },
  ],
  supplier: [
    { key: '/dashboard', label: '我的工作台', icon: <DashboardOutlined /> },
    { key: '/materials', label: '材料管理', icon: <AppstoreOutlined /> },
  ],
}

const roleLabels: Record<string, string> = {
  admin: '管理员',
  owner: '业主',
  designer: '设计师',
  company: '装修公司',
  supplier: '供应商',
}

const roleDefaultRoute: Record<string, string> = {
  admin: '/dashboard',
  owner: '/dashboard',
  designer: '/designs',
  company: '/quotations',
  supplier: '/materials',
}

const roleAccessMap: Record<string, string[]> = {
  admin: ['/dashboard', '/designs', '/quotations', '/inspections', '/materials', '/projects', '/admin'],
  owner: ['/dashboard', '/designs', '/quotations', '/inspections', '/projects'],
  designer: ['/dashboard', '/designs', '/projects'],
  company: ['/dashboard', '/quotations', '/inspections', '/projects'],
  supplier: ['/dashboard', '/materials'],
}

function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const auth = getAuth()
  const user = auth?.user as { role?: string } | undefined
  const role = user?.role || ''
  if (!allowedRoles.includes(role)) {
    return (
      <Result
        status="403"
        title="权限不足"
        subTitle="您没有访问此页面的权限，请联系管理员"
        extra={<Button type="primary" onClick={() => window.history.back()}>返回</Button>}
      />
    )
  }
  return <>{children}</>
}

function ProtectedRoute() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return <MainLayout />
}

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = getAuth()
  const user = auth?.user as { role?: string; name?: string } | undefined
  const role = (user?.role || 'owner') as string
  const menuItems = roleMenuItems[role] || roleMenuItems.owner

  function handleLogout() {
    removeAuth()
    navigate('/login')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} style={{ background: '#001529' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>家装协同平台</span>
        </div>
        <nav aria-label="业务导航" style={{ padding: '8px 4px' }}>
          {menuItems.map((item) => {
            const selected = location.pathname === item.key
            return (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                data-nav-path={item.key}
                onClick={() => navigate(item.key)}
                style={{
                  width: 'calc(100% - 8px)',
                  height: 40,
                  margin: '4px',
                  padding: '0 24px',
                  border: 0,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: selected ? '#fff' : 'rgba(255,255,255,0.82)',
                  background: selected ? '#1677ff' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', zIndex: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>
            家装产业协同管理平台
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#666' }}>
              <UserOutlined style={{ marginRight: 4 }} />
              {user?.name || '用户'}（{roleLabels[role] || role}）
            </span>
            <a onClick={handleLogout} style={{ color: '#ff4d4f', cursor: 'pointer' }}>
              <LogoutOutlined style={{ marginRight: 4 }} />退出
            </a>
          </div>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#f5f5f5', minHeight: 280, borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

function App() {
  return (
    <ConfigProvider theme={{ token: { motion: false } }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<RoleRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="designs" element={<DesignSchemes />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="materials" element={<Materials />} />
          <Route path="admin" element={<RoleGuard allowedRoles={['admin']}><Admin /></RoleGuard>} />
          <Route path="*" element={<RoleRedirect />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}

function RoleRedirect() {
  const auth = getAuth()
  const user = auth?.user as { role?: string } | undefined
  const role = (user?.role || 'owner') as string
  const target = roleDefaultRoute[role] || '/dashboard'
  return <Navigate to={target} replace />
}

export default App
