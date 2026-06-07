import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, message } from 'antd'
import {
  DashboardOutlined,
  DesktopOutlined,
  FileTextOutlined,
  WalletOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { messageAPI } from '../utils/api.js'

const { Header, Sider, Content } = Layout

function StudentLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadUnreadCount()
  }, [])

  const loadUnreadCount = async () => {
    try {
      const response = await messageAPI.getMessages()
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error('加载未读消息数失败')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    message.success('已退出登录')
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/student/dashboard',
      icon: <DashboardOutlined />,
      label: '首页',
    },
    {
      key: '/student/devices',
      icon: <DesktopOutlined />,
      label: '设备列表',
    },
    {
      key: '/student/transactions',
      icon: <FileTextOutlined />,
      label: '消费记录',
    },
    {
      key: '/student/recharge',
      icon: <WalletOutlined />,
      label: '账户充值',
    },
    {
      key: '/student/messages',
      icon: <MessageOutlined />,
      label: '消息中心',
      badge: unreadCount > 0 ? { count: unreadCount } : null,
    },
    {
      key: '/student/profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
  ]

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人信息',
        onClick: () => navigate('/student/profile'),
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 16 : 18, fontWeight: 'bold' }}>
          {collapsed ? '热水' : '校园热水服务'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <span style={{ marginRight: 16, color: '#52c41a', fontWeight: 600 }}>登录后首页</span>
          <span
            onClick={() => navigate('/admin/dashboard')}
            style={{ marginRight: 16, color: '#1677ff', fontWeight: 600, cursor: 'pointer' }}
          >
            管理后台
          </span>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.name || user.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', padding: 24, background: '#fff', minHeight: 280, borderRadius: 8 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default StudentLayout
