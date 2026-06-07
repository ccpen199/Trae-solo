import React, { useEffect } from 'react'
import { Navigate, Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { Layout, Menu, message } from 'antd'
import {
  DashboardOutlined,
  VideoCameraOutlined,
  ShopOutlined,
  CalendarOutlined,
  TagsOutlined,
  FileTextOutlined,
  LogoutOutlined
} from '@ant-design/icons'

const { Sider, Content, Header } = Layout

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  let user = {}

  try {
    user = JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    localStorage.removeItem('user')
  }

  const adminRoles = ['admin', 'operator', 'regional_admin', 'hq_auditor']
  const canAccess = Boolean(localStorage.getItem('token')) && adminRoles.includes(user.role)

  useEffect(() => {
    if (!canAccess) {
      message.error('无权限访问管理后台')
    }
  }, [canAccess])

  if (!canAccess) {
    return <Navigate to="/login" replace />
  }

  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">数据看板</Link> },
    { key: '/admin/cinemas', icon: <ShopOutlined />, label: <Link to="/admin/cinemas">影院管理</Link> },
    { key: '/admin/movies', icon: <VideoCameraOutlined />, label: <Link to="/admin/movies">影片管理</Link> },
    { key: '/admin/sessions', icon: <CalendarOutlined />, label: <Link to="/admin/sessions">场次管理</Link> },
    { key: '/admin/coupons', icon: <TagsOutlined />, label: <Link to="/admin/coupons">优惠券管理</Link> },
    { key: '/admin/logs', icon: <FileTextOutlined />, label: <Link to="/admin/logs">操作日志</Link> },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    message.success('已退出')
    navigate('/login')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          🎬 管理后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <span style={{ cursor: 'pointer' }} onClick={handleLogout}>
            <LogoutOutlined /> 退出登录
          </span>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
