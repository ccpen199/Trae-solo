import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, message } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  InboxOutlined
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

function App() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else if (location.pathname !== '/login') {
      navigate('/login')
    }
  }, [navigate, location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
    message.success('已退出登录')
  }

  const menuItems = [
    {
      key: '/',
      icon: <BarChartOutlined />,
      label: '数据概览',
    },
    {
      key: '/students',
      icon: <TeamOutlined />,
      label: '学生管理',
    },
    {
      key: '/records',
      icon: <FileTextOutlined />,
      label: '评价记录',
    },
    {
      key: '/dimensions',
      icon: <SettingOutlined />,
      label: '评价维度',
    },
    {
      key: '/appeals',
      icon: <ExclamationCircleOutlined />,
      label: '申诉管理',
    },
    {
      key: '/archives',
      icon: <InboxOutlined />,
      label: '档案归档',
    },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  if (!user) {
    return null
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          综合素质评价系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 500 }}>
            学生综合素质评价管理系统
          </div>
          <Dropdown menu={{ items: userMenuItems }}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
