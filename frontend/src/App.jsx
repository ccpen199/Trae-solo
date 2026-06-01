import React, { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, Card, Typography, message } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  BarChartOutlined,
  UserOutlined,
  WarningOutlined,
  FileSearchOutlined
} from '@ant-design/icons'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import NegotiationList from './pages/NegotiationList'
import NegotiationDetail from './pages/NegotiationDetail'
import NegotiationCreate from './pages/NegotiationCreate'
import Configurations from './pages/Configurations'
import Exceptions from './pages/Exceptions'
import OperationLogs from './pages/OperationLogs'

const { Header, Content } = Layout
const { Title } = Typography

const App = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const user = {
      id: 'user_004',
      name: '张三',
      role: 'user',
      department: '采购部'
    }
    setCurrentUser(user)
  }, [])

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '数据看板' },
    { key: '/negotiations', icon: <FileTextOutlined />, label: '谈判管理' },
    { key: '/exceptions', icon: <WarningOutlined />, label: '异常处理' },
    { key: '/configurations', icon: <SettingOutlined />, label: '系统配置' },
    { key: '/logs', icon: <FileSearchOutlined />, label: '操作日志' },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const userMenuItems = [
    { key: 'profile', label: '个人信息' },
    { key: 'logout', label: '退出登录' }
  ]

  const selectedKey = location.pathname.startsWith('/negotiation/') 
    ? '/negotiations' 
    : location.pathname

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 24px', 
        background: '#001529' 
      }}>
        <div style={{ 
          color: 'white', 
          fontSize: '20px', 
          fontWeight: 'bold', 
          marginRight: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <BarChartOutlined />
          AI采购谈判助手
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ flex: 1, borderBottom: 'none', background: 'transparent' }}
        />
        <div style={{ color: 'white', marginLeft: 'auto' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              {currentUser?.name || '用户'}
            </span>
          </Dropdown>
        </div>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/negotiations" element={<NegotiationList />} />
          <Route path="/negotiation/:id" element={<NegotiationDetail />} />
          <Route path="/negotiation/create" element={<NegotiationCreate />} />
          <Route path="/configurations" element={<Configurations />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/logs" element={<OperationLogs />} />
        </Routes>
      </Content>
    </Layout>
  )
}

export default App
