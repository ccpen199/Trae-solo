import React, { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, message, Badge, Card, Row, Col, Statistic } from 'antd'
import {
  BookOutlined,
  FileTextOutlined,
  MessageOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import Dashboard from '../pages/teacher/Dashboard'
import CourseManagement from '../pages/teacher/CourseManagement'
import CourseEditor from '../pages/teacher/CourseEditor'
import AssignmentManagement from '../pages/teacher/AssignmentManagement'
import AssignmentEditor from '../pages/teacher/AssignmentEditor'
import SubmissionReview from '../pages/teacher/SubmissionReview'
import QuestionManagement from '../pages/teacher/QuestionManagement'
import Statistics from '../pages/teacher/Statistics'
import Profile from '../pages/teacher/Profile'
import '../index.css'

const { Header, Sider, Content } = Layout

function TeacherLayout() {
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
      label: '课程管理'
    },
    {
      key: '/assignments',
      icon: <FileTextOutlined />,
      label: '作业管理'
    },
    {
      key: '/questions',
      icon: <MessageOutlined />,
      label: '答疑管理'
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '数据统计'
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
    if (path.startsWith('/assignments/')) return ['/assignments']
    if (path.startsWith('/questions/')) return ['/questions']
    return [path]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: collapsed ? 14 : 18 }}>
            {collapsed ? '教学' : '教师工作台'}
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
            教师端
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={5} dot>
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
            <Route path="/courses" element={<CourseManagement />} />
            <Route path="/courses/create" element={<CourseEditor />} />
            <Route path="/courses/edit/:id" element={<CourseEditor />} />
            <Route path="/assignments" element={<AssignmentManagement />} />
            <Route path="/assignments/create" element={<AssignmentEditor />} />
            <Route path="/assignments/edit/:id" element={<AssignmentEditor />} />
            <Route path="/assignments/:id/submissions" element={<SubmissionReview />} />
            <Route path="/questions" element={<QuestionManagement />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default TeacherLayout
