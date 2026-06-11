import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu, Badge, Alert, Button, Input, Space, message } from 'antd'
import {
  DashboardOutlined,
  ControlOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard.jsx'
import DeviceControl from './pages/DeviceControl.jsx'
import SceneMode from './pages/SceneMode.jsx'
import Schedule from './pages/Schedule.jsx'
import Statistics from './pages/Statistics.jsx'
import DeviceLearning from './pages/DeviceLearning.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import { isWeakNetwork } from './utils/networkDetection.js'
import { logOperation } from './api/operationLog.js'
import request from './api/request.js'

const { Header, Sider, Content } = Layout
const { Search } = Input

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/devices', icon: <ControlOutlined />, label: '设备控制' },
  { key: '/scenes', icon: <BulbOutlined />, label: '场景模式' },
  { key: '/schedule', icon: <ClockCircleOutlined />, label: '定时任务' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '数据统计' },
  { key: '/learning', icon: <ThunderboltOutlined />, label: '红外学习' },
  { key: '/admin', icon: <SettingOutlined />, label: '管理后台' }
]

function App() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [networkStatus, setNetworkStatus] = useState('online')

  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', '1')
    }
  }, [])

  useEffect(() => {
    const checkNetwork = () => {
      const status = isWeakNetwork() ? 'weak' : (navigator.onLine ? 'online' : 'offline')
      setNetworkStatus(status)
    }
    checkNetwork()
    const interval = setInterval(checkNetwork, 5000)
    window.addEventListener('online', checkNetwork)
    window.addEventListener('offline', checkNetwork)
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', checkNetwork)
      window.removeEventListener('offline', checkNetwork)
    }
  }, [])

  useEffect(() => {
    logOperation('page_view', { path: location.pathname })
  }, [location.pathname])

  const handleDemoLogin = () => {
    localStorage.setItem('userId', '1')
    message.success('演示账号已登录')
  }

  const handleGlobalSearch = async (keyword) => {
    const q = keyword.trim()
    if (!q) return
    try {
      const result = await request.get('/search', { params: { q } })
      message.success(`找到 ${result.total || 0} 条相关设备/场景`)
    } catch (error) {
      message.error('搜索失败')
    }
  }

  const getNetworkBadge = () => {
    if (networkStatus === 'offline') {
      return <Badge status="error" text={<><DisconnectOutlined /> 离线模式</>} />
    }
    if (networkStatus === 'weak') {
      return <Badge status="warning" text={<><WifiOutlined /> 弱网模式</>} />
    }
    return <Badge status="success" text={<><WifiOutlined /> 在线</>} />
  }

  return (
    <Layout className="app-layout">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">
          {collapsed ? 'IR' : '智能红外遥控中台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            window.location.href = key
          }}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="header-title">智能红外遥控中台</div>
          <div className="header-right">
            <Search
              placeholder="搜索设备、场景"
              allowClear
              enterButton
              onSearch={handleGlobalSearch}
              style={{ width: 260 }}
            />
            <Space>
              <Button size="small" onClick={handleDemoLogin}>演示登录</Button>
              <Button size="small" type="primary" onClick={() => { window.location.href = '/devices' }}>
                注册设备
              </Button>
            </Space>
            {getNetworkBadge()}
          </div>
        </Header>
        {networkStatus === 'weak' && (
          <Alert
            message="弱网模式已启用"
            description="当前网络较弱，已自动切换到离线缓存模式，操作记录将在网络恢复后同步。"
            type="warning"
            showIcon
            style={{ margin: '16px 16px 0' }}
          />
        )}
        {networkStatus === 'offline' && (
          <Alert
            message="离线模式"
            description="当前无网络连接，使用本地缓存数据，操作记录将在网络恢复后同步。"
            type="error"
            showIcon
            style={{ margin: '16px 16px 0' }}
          />
        )}
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<DeviceControl />} />
            <Route path="/scenes" element={<SceneMode />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/learning" element={<DeviceLearning />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
