import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, message } from 'antd'
import {
  BookOutlined,
  QuestionCircleOutlined,
  AuditOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BugOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DocumentList from './pages/DocumentList'
import DocumentDetail from './pages/DocumentDetail'
import QAPage from './pages/QAPage'
import TaskList from './pages/TaskList'
import TaskDetail from './pages/TaskDetail'
import ReviewWorkbench from './pages/ReviewWorkbench'
import Reports from './pages/Reports'
import ExceptionList from './pages/ExceptionList'
import AuditLogs from './pages/AuditLogs'
import UserList from './pages/UserList'
import RuleConfig from './pages/RuleConfig'

const { Header, Sider, Content } = Layout

const roleNames = {
  business_owner: '业务负责人',
  model_operator: '模型运营',
  reviewer: '审核人员',
  frontline_user: '一线使用者'
}

const getMenuItems = (role) => {
  const roleMenus = {
    business_owner: [
      { key: 'dashboard', icon: <BarChartOutlined />, label: '数据概览', path: '/dashboard' },
      { key: 'qa', icon: <QuestionCircleOutlined />, label: '智能问答', path: '/qa' },
      { key: 'documents', icon: <BookOutlined />, label: '文档管理', path: '/documents' },
      { key: 'tasks', icon: <FileTextOutlined />, label: '业务台账', path: '/tasks' },
      { key: 'review', icon: <AuditOutlined />, label: '审核工作台', path: '/review' },
      { key: 'reports', icon: <BarChartOutlined />, label: '报表中心', path: '/reports' },
      { key: 'exceptions', icon: <BugOutlined />, label: '异常处理', path: '/exceptions' },
      { key: 'audit', icon: <HistoryOutlined />, label: '审计日志', path: '/audit' },
      { key: 'users', icon: <UserOutlined />, label: '用户管理', path: '/users' },
      { key: 'rules', icon: <SettingOutlined />, label: '规则配置', path: '/rules' }
    ],
    model_operator: [
      { key: 'dashboard', icon: <BarChartOutlined />, label: '数据概览', path: '/dashboard' },
      { key: 'qa', icon: <QuestionCircleOutlined />, label: '智能问答', path: '/qa' },
      { key: 'documents', icon: <BookOutlined />, label: '文档管理', path: '/documents' },
      { key: 'tasks', icon: <FileTextOutlined />, label: '业务台账', path: '/tasks' },
      { key: 'reports', icon: <BarChartOutlined />, label: '报表中心', path: '/reports' },
      { key: 'exceptions', icon: <BugOutlined />, label: '异常处理', path: '/exceptions' }
    ],
    reviewer: [
      { key: 'dashboard', icon: <BarChartOutlined />, label: '数据概览', path: '/dashboard' },
      { key: 'qa', icon: <QuestionCircleOutlined />, label: '智能问答', path: '/qa' },
      { key: 'tasks', icon: <FileTextOutlined />, label: '业务台账', path: '/tasks' },
      { key: 'review', icon: <AuditOutlined />, label: '审核工作台', path: '/review' }
    ],
    frontline_user: [
      { key: 'dashboard', icon: <BarChartOutlined />, label: '数据概览', path: '/dashboard' },
      { key: 'qa', icon: <QuestionCircleOutlined />, label: '智能问答', path: '/qa' },
      { key: 'tasks', icon: <FileTextOutlined />, label: '我的任务', path: '/tasks' }
    ]
  }
  return roleMenus[role] || roleMenus.frontline_user
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error('Failed to parse user data:', e)
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    message.success('登录成功')
    navigate('/dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    message.success('已退出登录')
    navigate('/login')
  }

  if (loading) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        fontSize: '16px',
        color: '#333'
      }}>
        加载中...
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const menuItems = getMenuItems(user.role)
  const selectedKey = menuItems.find(item => location.pathname.startsWith(item.path))?.key || 'dashboard'

  const userDropdownItems = [
    {
      key: 'info',
      label: `${user.full_name} (${roleNames[user.role]})`
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div className="logo">
          <span>AI知识库Agent</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate(item.path)
          }))}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <Dropdown menu={{ items: userDropdownItems }}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.full_name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ background: '#f0f2f5' }}>
          <div className="page-container">
            <Routes>
              <Route path="/login" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/qa" element={<QAPage user={user} />} />
              <Route path="/documents" element={<DocumentList user={user} />} />
              <Route path="/documents/:id" element={<DocumentDetail user={user} />} />
              <Route path="/tasks" element={<TaskList user={user} />} />
              <Route path="/tasks/:id" element={<TaskDetail user={user} />} />
              <Route path="/review" element={<ReviewWorkbench user={user} />} />
              <Route path="/reports" element={<Reports user={user} />} />
              <Route path="/exceptions" element={<ExceptionList user={user} />} />
              <Route path="/audit" element={<AuditLogs user={user} />} />
              <Route path="/users" element={<UserList user={user} />} />
              <Route path="/rules" element={<RuleConfig user={user} />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
