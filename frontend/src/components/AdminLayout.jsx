import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  CreditCardOutlined,
  GiftOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin')
    navigate('/admin/login')
  }

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
    { key: '/admin/payments', icon: <CreditCardOutlined />, label: '交费记录' },
    { key: '/admin/exchanges', icon: <GiftOutlined />, label: '兑换记录' },
    { key: '/admin/products', icon: <ShoppingOutlined />, label: '商品管理' },
    { key: '/admin/reports', icon: <FileTextOutlined />, label: '数据报送' },
  ]

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ]

  return (
    <Layout className="layout">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} style={{ background: '#001529' }}>
        <div className="logo" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 14 : 16, fontWeight: 'bold', background: '#002140' }}>
          {collapsed ? '管理' : '国网管理后台'}
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
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: 0, color: '#1890ff' }}>运营管理系统</h2>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8, background: '#1890ff' }} />
              <span>管理员</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="site-layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
