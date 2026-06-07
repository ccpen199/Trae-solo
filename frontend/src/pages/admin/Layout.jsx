import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, message } from 'antd'
import {
  DashboardOutlined,
  DesktopOutlined,
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  WarningOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { alertAPI } from '../../utils/api.js'

const { Header, Sider, Content } = Layout

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadAlertCount()
  }, [])

  const loadAlertCount = async () => {
    try {
      const response = await alertAPI.getAlertStats()
      setAlertCount(response.data.unread || 0)
    } catch (error) {
      console.error('加载告警数量失败')
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
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '运营看板',
    },
    {
      key: '/admin/devices',
      icon: <DesktopOutlined />,
      label: '设备管理',
    },
    {
      key: '/admin/students',
      icon: <UserOutlined />,
      label: '学生管理',
    },
    {
      key: '/admin/transactions',
      icon: <FileTextOutlined />,
      label: '交易记录',
    },
    {
      key: '/admin/analytics',
      icon: <BarChartOutlined />,
      label: '能耗分析',
    },
    {
      key: '/admin/pricing',
      icon: <SettingOutlined />,
      label: '资费配置',
    },
    {
      key: '/admin/alerts',
      icon: <WarningOutlined />,
      label: '告警中心',
      badge: alertCount > 0 ? { count: alertCount } : null,
    },
  ]

  const userMenu = {
    items: [
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
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'white', 
          fontSize: collapsed ? 14 : 16, 
          fontWeight: 'bold' 
        }}>
          {collapsed ? '管理' : '热水管理系统'}
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
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: 0 }}>校园物联网热水服务管理后台</h2>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.username || '管理员'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', padding: 24, background: '#fff', minHeight: 280, borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
