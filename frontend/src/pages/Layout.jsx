import React, { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Dropdown } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SettingOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  TeamOutlined,
  BarChartOutlined,
  InboxOutlined,
  AuditOutlined,
  EyeOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { USER_ROLES, USER_ROLES_LABELS } from '../utils/constants'

const { Header, Sider, Content } = AntLayout

const getMenuItems = (role) => {
  const patientFamilyItems = [
    { key: '/services', icon: <AppstoreOutlined />, label: '服务项目' },
    { key: '/patient-family/orders', icon: <InboxOutlined />, label: '我的订单' }
  ]
  const nurseItems = [
    { key: '/nurse/tasks', icon: <FileTextOutlined />, label: '我的任务' },
    { key: '/nurse/schedule', icon: <CalendarOutlined />, label: '护理排班' },
    { key: '/nurse/records', icon: <AuditOutlined />, label: '护理记录' }
  ]
  const dispatcherItems = [
    { key: '/dispatch/pool', icon: <InboxOutlined />, label: '订单池' },
    { key: '/dispatch/audit', icon: <AuditOutlined />, label: '风险审核' },
    { key: '/dispatch/dispatch', icon: <SettingOutlined />, label: '派单管理' },
    { key: '/dispatch/monitor', icon: <EyeOutlined />, label: '任务监控' }
  ]
  const adminItems = [
    { key: '/admin/reports', icon: <BarChartOutlined />, label: '质控报表' },
    { key: '/admin/services', icon: <AppstoreOutlined />, label: '服务管理' },
    { key: '/admin/nurses', icon: <TeamOutlined />, label: '护士管理' },
    { key: '/admin/orders', icon: <FileTextOutlined />, label: '订单管理' },
    { key: '/admin/inventory', icon: <MedicineBoxOutlined />, label: '库存管理' }
  ]
  switch (role) {
    case USER_ROLES.PATIENT_FAMILY: return patientFamilyItems
    case USER_ROLES.NURSE: return nurseItems
    case USER_ROLES.DISPATCHER: return dispatcherItems
    case USER_ROLES.ADMIN: return adminItems
    default: return []
  }
}

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'settings', icon: <SettingOutlined />, label: '账号设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
  ]

  const selectedKey = '/' + location.pathname.split('/').slice(1, 3).join('/')

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 20 : 18, fontWeight: 'bold', background: 'rgba(255,255,255,0.1)' }}>
          {collapsed ? '医护' : '医护到家系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={getMenuItems(user?.role)}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e' }}>
            {USER_ROLES_LABELS[user?.role] || '用户'}端
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} src={user?.avatar} />
              <span style={{ color: '#1a1a2e' }}>{user?.name || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', borderRadius: 8, padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
