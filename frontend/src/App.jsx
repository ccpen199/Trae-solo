import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Dropdown, Avatar, theme, Tag } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ApiOutlined,
  WalletOutlined,
  CarOutlined,
  WarningOutlined,
  SwapOutlined,
  ToolOutlined,
  PayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  CodeOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import OBU from './pages/OBU'
import Accounts from './pages/Accounts'
import Toll from './pages/Toll'
import Exceptions from './pages/Exceptions'
import Disputes from './pages/Disputes'
import Operations from './pages/Operations'
import Settlements from './pages/Settlements'
import OpenApi from './pages/OpenApi'
import AuditLogs from './pages/AuditLogs'

const { Header, Sider, Content } = Layout

const allMenuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘', roles: ['admin', 'platform', 'operator', 'owner', 'fleet_admin'] },
  { key: '/users', icon: <UserOutlined />, label: '用户管理', roles: ['admin', 'platform'] },
  { key: '/obu', icon: <ApiOutlined />, label: 'OBU设备管理', roles: ['admin', 'platform', 'operator'] },
  { key: '/accounts', icon: <WalletOutlined />, label: 'ETC账户管理', roles: ['admin', 'platform', 'operator', 'owner', 'fleet_admin'] },
  { key: '/toll', icon: <CarOutlined />, label: '通行记录', roles: ['admin', 'platform', 'operator', 'owner', 'fleet_admin'] },
  { key: '/exceptions', icon: <WarningOutlined />, label: '异常事件', roles: ['admin', 'platform', 'operator'] },
  { key: '/disputes', icon: <SwapOutlined />, label: '争议处理', roles: ['admin', 'platform', 'operator', 'owner', 'fleet_admin'] },
  { key: '/operations', icon: <ToolOutlined />, label: '运维管理', roles: ['admin', 'platform', 'operator'] },
  { key: '/settlements', icon: <PayCircleOutlined />, label: '结算管理', roles: ['admin', 'platform'] },
  { key: '/open-api', icon: <CodeOutlined />, label: '开放接口', roles: ['admin', 'platform'] },
  { key: '/audit-logs', icon: <FileSearchOutlined />, label: '审计日志', roles: ['admin', 'platform'] },
]

const roleLabels = {
  admin: '系统管理员',
  platform: '运营平台',
  operator: '运维操作员',
  owner: '车主',
  fleet_admin: '车队管理者',
}

const roleColors = {
  admin: 'red',
  platform: 'blue',
  operator: 'purple',
  owner: 'green',
  fleet_admin: 'orange',
}

function getUser() {
  const userStr = localStorage.getItem('etc_user')
  try { return JSON.parse(userStr) || {} } catch { return {} }
}

function ProtectedLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { token: themeToken } = theme.useToken()

  const user = getUser()
  const userRole = user.role || 'owner'
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole))

  const handleLogout = () => {
    localStorage.removeItem('etc_token')
    localStorage.removeItem('token')
    localStorage.removeItem('etc_user')
    window.location.href = '/login'
  }

  const dropdownItems = {
    items: [
      { key: 'role', label: <span>角色：<Tag color={roleColors[userRole]}>{roleLabels[userRole] || userRole}</Tag></span>, disabled: true },
      { key: 'name', label: `姓名：${user.real_name || '-'}`, disabled: true },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}>
          {collapsed ? 'ETC' : 'ETC管理控制台'}
        </div>
        {!collapsed && (
          <div style={{ padding: '0 16px 12px', textAlign: 'center' }}>
            <Tag color={roleColors[userRole]} style={{ fontSize: 12 }}>
              {roleLabels[userRole] || userRole}
            </Tag>
          </div>
        )}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: themeToken.colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={dropdownItems} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user.real_name || user.username || '未知用户'}</span>
              <Tag color={roleColors[userRole]} style={{ marginLeft: 4, fontSize: 11 }}>
                {roleLabels[userRole] || userRole}
              </Tag>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/obu" element={<OBU />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/toll" element={<Toll />} />
            <Route path="/exceptions" element={<Exceptions />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/settlements" element={<Settlements />} />
            <Route path="/blacklist" element={<Operations initialTab="1" />} />
            <Route path="/data-quality" element={<Operations initialTab="0" />} />
            <Route path="/value-added" element={<Operations initialTab="2" />} />
            <Route path="/open-api" element={<OpenApi />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('etc_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <ProtectedLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
