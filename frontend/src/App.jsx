import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme, Avatar, Dropdown, Space } from 'antd'
import {
  MessageOutlined, TeamOutlined, CheckCircleOutlined,
  FileTextOutlined, BarChartOutlined, UserOutlined,
  BellOutlined, LogoutOutlined, SafetyOutlined, RocketOutlined
} from '@ant-design/icons'
import LoginPage from './pages/LoginPage.jsx'
import TaskList from './pages/TaskList.jsx'
import TaskEdit from './pages/TaskEdit.jsx'
import AudiencePage from './pages/AudiencePage.jsx'
import ApprovalPage from './pages/ApprovalPage.jsx'
import SendRecords from './pages/SendRecords.jsx'
import ReportsPage from './pages/ReportsPage.jsx'

const { Header, Sider, Content } = Layout

const operatorMenuItems = [
  { key: '/tasks', icon: <MessageOutlined />, label: '消息任务' },
  { key: '/audience', icon: <TeamOutlined />, label: '人群圈选' },
  { key: '/records', icon: <FileTextOutlined />, label: '发送记录' },
  { key: '/reports', icon: <BarChartOutlined />, label: '复盘报表' }
]

const approverMenuItems = [
  { key: '/approvals', icon: <CheckCircleOutlined />, label: '审批管理' }
]

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  useEffect(() => {
    const saved = localStorage.getItem('push_platform_user')
    if (saved) {
      try {
        const userInfo = JSON.parse(saved)
        setUser(userInfo)
        if (location.pathname === '/login' || location.pathname === '/') {
          navigate(userInfo.role === 'operator' ? '/tasks' : '/approvals')
        }
      } catch (e) {
        localStorage.removeItem('push_platform_user')
      }
    } else if (location.pathname !== '/login') {
      navigate('/login')
    }
  }, [location.pathname, navigate])

  const handleLogin = (userInfo) => {
    setUser(userInfo)
  }

  const handleLogout = () => {
    localStorage.removeItem('push_platform_user')
    setUser(null)
    navigate('/login')
  }

  if (!user || location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const menuItems = user.role === 'operator' ? operatorMenuItems : approverMenuItems
  const userMenuItems = [
    {
      key: 'profile',
      icon: user.role === 'operator' ? <RocketOutlined /> : <SafetyOutlined />,
      label: user.role === 'operator' ? '运营账号' : '审批账号'
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const roleLabel = user.role === 'operator' ? '运营系统' : '审批系统'
  const roleColor = user.role === 'operator' ? '#1677ff' : '#52c41a'

  const ProtectedRoute = ({ element, roles }) => {
    if (roles && !roles.includes(user.role)) {
      return <Navigate to={user.role === 'operator' ? '/tasks' : '/approvals'} replace />
    }
    return element
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}
        theme="dark" width={200}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#fff', fontSize: collapsed ? 16 : 18,
          fontWeight: 'bold', borderBottom: '1px solid #1f1f1f' }}>
          {collapsed ? <BellOutlined /> : (
            <span>{roleLabel}</span>
          )}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}
          items={menuItems} onClick={({ key }) => navigate(key)} />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            Web 消息推送运营平台
            <span style={{
              display: 'inline-block',
              marginLeft: 12,
              padding: '2px 8px',
              fontSize: 12,
              background: roleColor,
              color: '#fff',
              borderRadius: 4
            }}>
              {roleLabel}
            </span>
          </span>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" style={{ background: roleColor }} icon={<UserOutlined />} />
              <span>{user.name}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: colorBgContainer,
          borderRadius: borderRadiusLG, minHeight: 'calc(100vh - 112px)' }}>
          <Routes>
            <Route path="/" element={<Navigate to={user.role === 'operator' ? '/tasks' : '/approvals'} replace />} />
            <Route path="/login" element={<Navigate to={user.role === 'operator' ? '/tasks' : '/approvals'} replace />} />
            {user.role === 'operator' && (
              <>
                <Route path="/tasks" element={<TaskList user={user} />} />
                <Route path="/tasks/new" element={<TaskEdit user={user} />} />
                <Route path="/tasks/:id/edit" element={<TaskEdit user={user} />} />
                <Route path="/audience" element={<AudiencePage user={user} />} />
                <Route path="/records" element={<SendRecords user={user} />} />
                <Route path="/reports" element={<ReportsPage user={user} />} />
                <Route path="/approvals" element={<Navigate to="/tasks" replace />} />
              </>
            )}
            {user.role === 'approver' && (
              <>
                <Route path="/approvals" element={<ApprovalPage user={user} />} />
                <Route path="/tasks" element={<Navigate to="/approvals" replace />} />
                <Route path="/audience" element={<Navigate to="/approvals" replace />} />
                <Route path="/records" element={<Navigate to="/approvals" replace />} />
                <Route path="/reports" element={<Navigate to="/approvals" replace />} />
              </>
            )}
            <Route path="*" element={<Navigate to={user.role === 'operator' ? '/tasks' : '/approvals'} replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}