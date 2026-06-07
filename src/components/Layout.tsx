import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Dropdown, Avatar, Badge, Space, message } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  SwapOutlined,
  BellOutlined,
  HomeOutlined,
  FileTextOutlined,
  CameraOutlined,
  CarOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  RobotOutlined,
  AuditOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/store/auth'
import { getPendingCount } from '@/api/modules/workflow'

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  path: string
}

const menuItems: MenuItem[] = [
  { key: 'home', icon: <HomeOutlined />, label: '首页', path: '/' },
  { key: 'permit', icon: <FileTextOutlined />, label: '进京证', path: '/permit' },
  { key: 'violation', icon: <CameraOutlined />, label: '违法随手拍', path: '/violation' },
  { key: 'accident', icon: <CarOutlined />, label: '事故处理', path: '/accident' },
  { key: 'ebike', icon: <ThunderboltOutlined />, label: '电动车登记', path: '/ebike' },
  { key: 'appointment', icon: <CalendarOutlined />, label: '预约服务', path: '/appointment' },
  { key: 'chatbot', icon: <RobotOutlined />, label: '智能问答', path: '/chatbot' },
  { key: 'admin', icon: <AuditOutlined />, label: '审核工作台', path: '/admin' },
  { key: 'stats', icon: <BarChartOutlined />, label: '统计看板', path: '/admin/stats' },
]

const roleMap: Record<string, string> = {
  user: '普通用户',
  auditor: '审核员',
  admin: '管理员',
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getPendingCount()
        setPendingCount(count || 0)
      } catch (err) {
        // ignore
      }
    }
    if (auth.isAuthenticated) {
      fetchCount()
    }
  }, [auth.isAuthenticated, location.pathname])

  const handleLogout = () => {
    auth.logout()
    message.success('已退出登录')
    navigate('/login')
  }

  const userDropdownItems = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
      onClick: () => message.info('个人中心开发中'),
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ]

  const getActiveKey = () => {
    const path = location.pathname
    if (path === '/') return 'home'
    if (path.startsWith('/permit')) return 'permit'
    if (path.startsWith('/violation')) return 'violation'
    if (path.startsWith('/accident')) return 'accident'
    if (path.startsWith('/ebike')) return 'ebike'
    if (path.startsWith('/appointment')) return 'appointment'
    if (path.startsWith('/chatbot')) return 'chatbot'
    if (path.startsWith('/admin/stats')) return 'stats'
    if (path.startsWith('/admin')) return 'admin'
    return 'home'
  }

  const activeKey = getActiveKey()
  const userRole = roleMap[auth.user?.role || 'user'] || '普通用户'

  return (
    <div className="dashboard-layout">
      <header className="layout-header">
        <div className="flex items-center gap-3">
          <div className="text-white text-xl font-bold">🚗 交管服务平台</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <SwapOutlined />
            <span className="hidden sm:inline">{userRole}</span>
          </div>
          <Badge count={pendingCount} size="small">
            <BellOutlined className="text-white text-lg cursor-pointer" />
          </Badge>
          <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
            <Space className="cursor-pointer hover:opacity-80">
              <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#fff', color: '#0052D9' }} />
              <span className="text-white hidden sm:inline">{auth.user?.name || '用户'}</span>
            </Space>
          </Dropdown>
        </div>
      </header>

      <aside className="layout-sidebar">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`menu-item ${activeKey === item.key ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </aside>

      <main className="layout-content">
        <Outlet />
      </main>

      <div className="mobile-tabbar">
        <div className="flex justify-around py-2">
          {menuItems.slice(0, 5).map((item) => (
            <div
              key={item.key}
              className="flex flex-col items-center gap-1 px-2 py-1 cursor-pointer"
              style={{ color: activeKey === item.key ? '#0052D9' : '#86909C' }}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
