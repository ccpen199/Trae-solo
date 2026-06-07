import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Tag } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ReadOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import useUserStore from '../store/userStore'

const { Header, Sider, Content } = Layout

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isOperator } = useUserStore()
  const [collapsed, setCollapsed] = useState(false)

  if (!isOperator()) {
    navigate('/')
    return null
  }

  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '运营看板' },
    { key: '/admin/work-orders', icon: <FileTextOutlined />, label: '工单管理' },
    { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
    { key: '/admin/sla-monitor', icon: <ClockCircleOutlined />, label: 'SLA监控' },
    { key: '/admin/meter-readings', icon: <ReadOutlined />, label: '抄表审核' }
  ]

  const userMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '用户端首页',
      onClick: () => navigate('/')
    },
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
        theme="dark"
        width={220}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: collapsed ? 24 : 18,
          fontWeight: 700,
          color: 'white',
          background: '#001529'
        }}>
          {collapsed ? '🔥' : '🔥 管理后台'}
        </div>
        <Menu
          mode="inline"
          theme="dark"
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
              燃气智能服务平台 - 管理后台
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tag color="red">管理员</Tag>
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

export default AdminLayout
