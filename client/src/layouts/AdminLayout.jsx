import React, { useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, message, Badge } from 'antd'
import {
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  BookOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
  MessageOutlined,
  TrophyOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import Dashboard from '../pages/admin/Dashboard'
import UserManagement from '../pages/admin/UserManagement'
import CourseManagement from '../pages/admin/CourseManagement'
import OrderManagement from '../pages/admin/OrderManagement'
import RevenueReport from '../pages/admin/RevenueReport'
import LearningAnalytics from '../pages/admin/LearningAnalytics'
import CertificateManagement from '../pages/admin/CertificateManagement'
import SystemSettings from '../pages/admin/SystemSettings'
import '../index.css'

const { Header, Sider, Content } = Layout

function AdminLayout() {
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
      label: '数据概览'
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: '用户管理'
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: '课程管理'
    },
    {
      key: '/orders',
      icon: <FileTextOutlined />,
      label: '订单管理'
    },
    {
      key: '/revenue',
      icon: <DollarOutlined />,
      label: '收入报表'
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '学习分析'
    },
    {
      key: '/certificates',
      icon: <TrophyOutlined />,
      label: '证书管理'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置'
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
    return [path]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: collapsed ? 14 : 18 }}>
            {collapsed ? '管理' : '运营管理后台'}
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
            运营/管理员端
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={10} dot>
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
            <Route path="/users" element={<UserManagement />} />
            <Route path="/courses" element={<CourseManagement />} />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/revenue" element={<RevenueReport />} />
            <Route path="/analytics" element={<LearningAnalytics />} />
            <Route path="/certificates" element={<CertificateManagement />} />
            <Route path="/settings" element={<SystemSettings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
