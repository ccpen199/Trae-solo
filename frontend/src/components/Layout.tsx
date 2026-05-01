import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout as AntLayout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Typography,
  Space,
  Badge,
  Spin,
  Result,
} from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  HistoryOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  GiftOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  TrophyOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useUserStore, UserInfo } from '../stores/userStore'
import { userApi } from '../services/api'

const { Header, Sider, Content } = AntLayout
const { Text, Title } = Typography

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, setUser, token } = useUserStore()
  const [collapsed, setCollapsed] = useState(false)
  const [fetchingUser, setFetchingUser] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!token) {
      setIsRedirecting(true)
      navigate('/login', { replace: true })
      return
    }

    if (!user && !fetchingUser) {
      fetchUserInfo()
    }
  }, [token, user, fetchingUser])

  const fetchUserInfo = async () => {
    if (!token || fetchingUser) return
    
    setFetchingUser(true)
    setError(null)
    
    try {
      const response = await userApi.getCurrentUser()
      const responseData = response.data
      
      if (responseData && responseData.success) {
        const userData = responseData.data
        if (userData) {
          setUser(userData as UserInfo)
        } else {
          throw new Error('用户数据为空')
        }
      } else {
        throw new Error(responseData?.message || '获取用户信息失败')
      }
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      
      const isAuthError = 
        error.response?.status === 401 ||
        error.message?.includes('未授权') ||
        error.message?.includes('登录')
      
      if (isAuthError) {
        logout()
        setIsRedirecting(true)
        navigate('/login', { replace: true })
      } else {
        setError(error.message || '获取用户信息失败')
      }
    } finally {
      setFetchingUser(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getMenuItems = () => {
    const baseItems: MenuProps['items'] = [
      {
        key: '/',
        icon: <DashboardOutlined />,
        label: '仪表盘',
      },
    ]

    if (user?.role === 'member') {
      baseItems.push(
        {
          key: '/points',
          icon: <TrophyOutlined />,
          label: '我的积分',
        },
        {
          key: '/points/transactions',
          icon: <HistoryOutlined />,
          label: '积分流水',
        },
        {
          key: '/exchange',
          icon: <GiftOutlined />,
          label: '积分兑换',
        },
        {
          key: '/exchange/orders',
          icon: <FileTextOutlined />,
          label: '兑换记录',
        }
      )
    }

    if (['manager', 'employee', 'admin'].includes(user?.role || '')) {
      baseItems.push(
        {
          key: '/points',
          icon: <TrophyOutlined />,
          label: '积分管理',
        },
        {
          key: '/points/transactions',
          icon: <HistoryOutlined />,
          label: '积分流水',
        },
        {
          key: '/exchange/orders',
          icon: <ShoppingOutlined />,
          label: '兑换订单',
        },
        {
          key: '/rules',
          icon: <SettingOutlined />,
          label: '规则配置',
        }
      )
    }

    if (['finance', 'admin'].includes(user?.role || '')) {
      baseItems.push(
        {
          key: '/reconciliation',
          icon: <CalculatorOutlined />,
          label: '日结对账',
        }
      )
    }

    return baseItems
  }

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key)
  }

  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
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
  ]

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      member: '会员',
      employee: '店员',
      manager: '运营经理',
      finance: '财务审计',
      admin: '系统管理员',
    }
    return roleMap[role] || role
  }

  if (!token || isRedirecting) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>正在跳转登录页面...</Text>
        </div>
      </div>
    )
  }

  if (fetchingUser) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>正在加载用户信息...</Text>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5',
        padding: 24
      }}>
        <Result
          status="warning"
          title="加载出错"
          subTitle={error}
          extra={[
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={fetchUserInfo}
            >
              重试
            </Button>,
            <Button 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              重新登录
            </Button>,
          ]}
        />
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>正在加载用户信息...</Text>
        </div>
      </div>
    )
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <Badge count={collapsed ? '' : null}>
            <Typography.Title
              level={5}
              style={{ color: 'white', margin: 0 }}
            >
              {collapsed ? '积分' : '会员积分系统'}
            </Typography.Title>
          </Badge>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: 'white',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div />
          <Space>
            <Text type="secondary">
              {getRoleName(user?.role || '')}
            </Text>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Text>{user?.name || user?.username}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: 'white',
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
