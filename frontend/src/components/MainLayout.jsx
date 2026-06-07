import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  FileTextOutlined,
  DollarOutlined,
  ToolOutlined,
  ShoppingOutlined,
  SafetyOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import useUserStore from '../store/userStore'
import { safetyAPI } from '../api'

const { Header, Sider, Content } = Layout

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isOperator } = useUserStore()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  React.useEffect(() => {
    if (user) {
      safetyAPI.getNotifications({ unread_only: 'true', pageSize: 1 })
        .then(data => setUnreadCount(data.unread_count || 0))
        .catch(() => {})
    }
  }, [user])

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/meter-reading', icon: <FileTextOutlined />, label: '燃气报数' },
    { key: '/billing', icon: <DollarOutlined />, label: '在线缴费' },
    { key: '/auto-pay', icon: <DollarOutlined />, label: '代扣签约' },
    { key: '/work-order', icon: <ToolOutlined />, label: '报装报修' },
    { key: '/mall', icon: <ShoppingOutlined />, label: '生活服务' },
    { key: '/mall-orders', icon: <ShoppingOutlined />, label: '我的订单' },
    { key: '/warranty', icon: <SafetyOutlined />, label: '电子质保' },
    { key: '/safety', icon: <SafetyOutlined />, label: '安全知识' },
    { key: '/usage-stats', icon: <BarChartOutlined />, label: '用量分析' },
    { key: '/profile', icon: <UserOutlined />, label: '个人中心' }
  ]

  const userMenuItems = [
    ...(isOperator() ? [{
      key: 'admin',
      icon: <DashboardOutlined />,
      label: '管理后台',
      onClick: () => navigate('/admin/dashboard')
    }] : []),
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile')
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      }
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={220}
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: collapsed ? 24 : 20,
          fontWeight: 700,
          color: '#1890ff',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {collapsed ? '🔥' : '🔥 燃气服务'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: 'white', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          height: 64
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <div style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>
              燃气行业垂直领域智能生活服务平台
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadCount} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                onClick={() => navigate('/usage-stats')}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size={32} icon={<UserOutlined />} />
                <span>{user?.real_name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ background: '#f5f7fa', overflow: 'auto' }}>
          <div className="page-container">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
