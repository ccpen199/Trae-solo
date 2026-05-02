import React, { useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, message, Badge } from 'antd'
import {
  FileTextOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  BookOutlined
} from '@ant-design/icons'
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import Dashboard from '../pages/ta/Dashboard'
import AssignmentReview from '../pages/ta/AssignmentReview'
import QuestionAnswer from '../pages/ta/QuestionAnswer'
import Profile from '../pages/ta/Profile'
import '../index.css'

const { Header, Sider, Content } = Layout

function TALayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    message.success('已退出登录')
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页'
    },
    {
      key: '/assignments',
      icon: <FileTextOutlined />,
      label: '作业批改'
    },
    {
      key: '/questions',
      icon: <MessageOutlined />,
      label: '答疑回复'
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人中心'
    }
  ]

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
        onClick: () => navigate('/profile')
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  }

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/assignments/')) return ['/assignments']
    if (path.startsWith('/questions/')) return ['/questions']
    return [path]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: collapsed ? 14 : 18 }}>
            {collapsed ? '助教' : '助教工作台'}
          </h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            助教端
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={8} dot>
              <MessageOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} src={user?.avatar} />
                <span>{user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assignments" element={<AssignmentReview />} />
            <Route path="/assignments/:id/review" element={<AssignmentReview />} />
            <Route path="/questions" element={<QuestionAnswer />} />
            <Route path="/questions/:id" element={<QuestionAnswer />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default TALayout
