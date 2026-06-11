import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, message, Dropdown, Avatar } from 'antd'
import {
  CarOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  BellOutlined,
  BarChartOutlined,
  LeafOutlined,
  ShopOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import Login from './pages/Login.jsx'
import ChargingMap from './pages/owner/ChargingMap.jsx'
import ChargerDetail from './pages/owner/ChargerDetail.jsx'
import ChargingControl from './pages/owner/ChargingControl.jsx'
import OrderList from './pages/owner/OrderList.jsx'
import ReservationList from './pages/owner/ReservationList.jsx'
import UserProfile from './pages/owner/UserProfile.jsx'
import PrivatePile from './pages/owner/PrivatePile.jsx'
import GreenCertificate from './pages/owner/GreenCertificate.jsx'
import PathPlanning from './pages/owner/PathPlanning.jsx'
import StationOverview from './pages/station/StationOverview.jsx'
import StationChargerList from './pages/station/StationChargerList.jsx'
import AlarmCenter from './pages/station/AlarmCenter.jsx'
import StationStats from './pages/station/StationStats.jsx'
import StationServices from './pages/station/StationServices.jsx'
import ChargingBehavior from './pages/platform/ChargingBehavior.jsx'
import CarbonAnalysis from './pages/platform/CarbonAnalysis.jsx'
import GovernmentDashboard from './pages/platform/GovernmentDashboard.jsx'

const { Header, Sider, Content } = Layout

const App = () => {
  const [user, setUser] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    } else if (location.pathname !== '/login') {
      navigate('/login')
    }
  }, [navigate, location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    message.success('已退出登录')
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const getOwnerMenuItems = () => [
    {
      key: '/map',
      icon: <EnvironmentOutlined />,
      label: '充电地图',
    },
    {
      key: '/control',
      icon: <ThunderboltOutlined />,
      label: '充电控制',
    },
    {
      key: '/planning',
      icon: <CarOutlined />,
      label: '路径规划',
    },
    {
      key: '/orders',
      icon: <BarChartOutlined />,
      label: '充电订单',
    },
    {
      key: '/reservations',
      icon: <BellOutlined />,
      label: '预约管理',
    },
    {
      key: '/private-pile',
      icon: <ShopOutlined />,
      label: '私桩共享',
    },
    {
      key: '/green-cert',
      icon: <LeafOutlined />,
      label: '绿电凭证',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
  ]

  const getStationMenuItems = () => [
    {
      key: '/station/overview',
      icon: <DashboardOutlined />,
      label: '场站概览',
    },
    {
      key: '/station/chargers',
      icon: <ThunderboltOutlined />,
      label: '设备管理',
    },
    {
      key: '/station/alarms',
      icon: <BellOutlined />,
      label: '告警中心',
    },
    {
      key: '/station/stats',
      icon: <BarChartOutlined />,
      label: '数据统计',
    },
    {
      key: '/station/services',
      icon: <SettingOutlined />,
      label: '配套服务',
    },
  ]

  const getPlatformMenuItems = () => [
    {
      key: '/platform/behavior',
      icon: <BarChartOutlined />,
      label: '充电行为分析',
    },
    {
      key: '/platform/carbon',
      icon: <LeafOutlined />,
      label: '碳减排核算',
    },
    {
      key: '/platform/government',
      icon: <SafetyOutlined />,
      label: '政府监管看板',
    },
  ]

  const getMenuItems = () => {
    if (!user) return []
    switch (user.role) {
      case 'CAR_OWNER':
        return getOwnerMenuItems()
      case 'STATION_OPERATOR':
        return getStationMenuItems()
      case 'ADMIN':
      case 'PILE_ENTERPRISE':
      case 'GRID_COMPANY':
        return [...getOwnerMenuItems(), ...getStationMenuItems(), ...getPlatformMenuItems()]
      default:
        return getOwnerMenuItems()
    }
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  if (location.pathname === '/login') {
    return <Login onLogin={(userData, token) => {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      const defaultPath = userData.role === 'STATION_OPERATOR' ? '/station/overview' : '/map'
      navigate(defaultPath)
    }} />
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 14 : 18, fontWeight: 600 }}>
          {collapsed ? '充电' : '⚡ 智慧充电平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>
            {user?.role === 'CAR_OWNER' && '车主服务中心'}
            {user?.role === 'STATION_OPERATOR' && '场站运营中心'}
            {user?.role === 'ADMIN' && '平台管理中心'}
            {user?.role === 'GRID_COMPANY' && '电网管理中心'}
            {user?.role === 'PILE_ENTERPRISE' && '桩企管理中心'}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 12 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <span style={{ color: '#1a1a1a' }}>{user?.realName || user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<ChargingMap />} />
            <Route path="/charger/:id" element={<ChargerDetail />} />
            <Route path="/control" element={<ChargingControl />} />
            <Route path="/planning" element={<PathPlanning />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/reservations" element={<ReservationList />} />
            <Route path="/private-pile" element={<PrivatePile />} />
            <Route path="/green-cert" element={<GreenCertificate />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/station/overview" element={<StationOverview />} />
            <Route path="/station/chargers" element={<StationChargerList />} />
            <Route path="/station/alarms" element={<AlarmCenter />} />
            <Route path="/station/stats" element={<StationStats />} />
            <Route path="/station/services" element={<StationServices />} />
            <Route path="/platform/behavior" element={<ChargingBehavior />} />
            <Route path="/platform/carbon" element={<CarbonAnalysis />} />
            <Route path="/platform/government" element={<GovernmentDashboard />} />
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
