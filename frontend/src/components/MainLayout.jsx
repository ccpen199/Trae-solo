import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  LogoutOutlined,
  ProfileOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : { name: '未登录', role: '' }
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return { name: '未登录', role: '' }
    }
  }
  
  const user = getUser()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const getMenuItems = () => {
    const items = [
      {
        key: '/',
        icon: <DashboardOutlined />,
        label: '概览',
        onClick: () => navigate('/')
      }
    ]

    if (user.role === 'student') {
      items.push({
        key: '/profile',
        icon: <ProfileOutlined />,
        label: '我的档案',
        onClick: () => navigate('/profile')
      })
      items.push({
        key: '/schemes',
        icon: <BookOutlined />,
        label: '我的选校',
        onClick: () => navigate('/schemes')
      })
      items.push({
        key: '/applications',
        icon: <FileTextOutlined />,
        label: '我的申请',
        onClick: () => navigate('/applications')
      })
    } else {
      items.push({
        key: '/students',
        icon: <UserOutlined />,
        label: '学生管理',
        onClick: () => navigate('/students')
      })
      items.push({
        key: '/schemes',
        icon: <BookOutlined />,
        label: '选校方案',
        onClick: () => navigate('/schemes')
      })
      items.push({
        key: '/applications',
        icon: <FileTextOutlined />,
        label: '申请管理',
        onClick: () => navigate('/applications')
      })
    }

    return items
  }

  const roleLabels = {
    admin: '管理员',
    consultant: '顾问',
    teacher: '文案老师',
    student: '学生'
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" collapsible>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          留学申请系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Dropdown menu={{ items: userMenuItems }}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.name} ({roleLabels[user.role]})</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
