import React, { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, message, Badge } from 'antd'
import {
  BookOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  MessageOutlined,
  TrophyOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined
} from '@ant-design/icons'
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import Dashboard from '../pages/student/Dashboard'
import CourseList from '../pages/student/CourseList'
import MyCourses from '../pages/student/MyCourses'
import CourseDetail from '../pages/student/CourseDetail'
import CoursePlayer from '../pages/student/CoursePlayer'
import Assignments from '../pages/student/Assignments'
import AssignmentDetail from '../pages/student/AssignmentDetail'
import Questions from '../pages/student/Questions'
import QuestionDetail from '../pages/student/QuestionDetail'
import Certificates from '../pages/student/Certificates'
import Profile from '../pages/student/Profile'
import '../index.css'

const { Header, Sider, Content } = Layout

function StudentLayout() {
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
      key: '/courses',
      icon: <BookOutlined />,
      label: '课程中心'
    },
    {
      key: '/my-courses',
      icon: <PlayCircleOutlined />,
      label: '我的课程'
    },
    {
      key: '/assignments',
      icon: <FileTextOutlined />,
      label: '作业中心'
    },
    {
      key: '/questions',
      icon: <MessageOutlined />,
      label: '答疑社区'
    },
    {
      key: '/certificates',
      icon: <TrophyOutlined />,
      label: '我的证书'
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
    if (path.startsWith('/courses/')) return ['/courses']
    if (path.startsWith('/my-courses/')) return ['/my-courses']
    if (path.startsWith('/assignments/')) return ['/assignments']
    if (path.startsWith('/questions/')) return ['/questions']
    return [path]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: collapsed ? 14 : 18 }}>
            {collapsed ? '学习' : '在线学习平台'}
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
            学员端
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} dot>
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
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/my-courses/:courseId" element={<CoursePlayer />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/assignments/:id" element={<AssignmentDetail />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/questions/:id" element={<QuestionDetail />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default StudentLayout
