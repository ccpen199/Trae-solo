import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Tag, Space, Typography } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  SearchOutlined,
  InboxOutlined,
  WarningOutlined,
  LinkOutlined,
  QrcodeOutlined,
  SendOutlined,
  ShopOutlined,
  TeamOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SafetyOutlined,
  UserSwitchOutlined,
  DatabaseOutlined,
  TruckOutlined,
  GiftOutlined,
  FundOutlined,
  FileTextOutlined,
  AuditOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const roleConfig = {
  platform: {
    label: '平台管理员',
    color: 'magenta',
    icon: <BarChartOutlined />,
    defaultPath: '/admin/stats',
    description: '全局数据管控'
  },
  ops: {
    label: '运营管理员',
    color: 'geekblue',
    icon: <UserSwitchOutlined />,
    defaultPath: '/admin/stats',
    description: '运营数据分析'
  },
  admin: {
    label: '系统管理员',
    color: 'red',
    icon: <SafetyOutlined />,
    defaultPath: '/admin/parcels',
    description: '系统用户管理'
  },
  station_master: {
    label: '驿站站长',
    color: 'green',
    icon: <ShopOutlined />,
    defaultPath: '/community/stations',
    description: '驿站运营管理'
  },
  user: {
    label: '普通用户',
    color: 'blue',
    icon: <UserOutlined />,
    defaultPath: '/dashboard',
    description: '个人包裹管理'
  }
}

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const userRole = user?.role || 'user'
  const roleInfo = roleConfig[userRole] || roleConfig.user

  const getUserMenuItems = () => {
    const items = [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '账号设置',
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
      },
    ]
    return items
  }

  const getMenuItems = () => {
    const commonItems = []

    if (userRole === 'user') {
      commonItems.push(
        {
          key: '/dashboard',
          icon: <DashboardOutlined />,
          label: '工作台',
        },
        {
          key: '/track',
          icon: <SearchOutlined />,
          label: '包裹查询',
        },
        {
          key: '/parcels',
          icon: <InboxOutlined />,
          label: '我的包裹',
        },
        {
          key: '/anomaly',
          icon: <WarningOutlined />,
          label: '异常预警',
        },
        {
          key: '/pickup',
          icon: <QrcodeOutlined />,
          label: '取件服务',
        },
        {
          key: '/shipping',
          icon: <SendOutlined />,
          label: '寄件服务',
          children: [
            { key: '/shipping/regular', label: '普通寄件', icon: <TruckOutlined /> },
            { key: '/shipping/large', label: '大件寄送', icon: <GiftOutlined /> },
          ],
        },
        {
          key: 'community',
          icon: <TeamOutlined />,
          label: '社区服务',
          children: [
            { key: '/community/stations', label: '驿站列表', icon: <ShopOutlined /> },
            { key: '/community/posts', label: '邻里互助', icon: <TeamOutlined /> },
            { key: '/community/recycling', label: '绿色回收', icon: <LinkOutlined /> },
          ],
        },
        {
          key: '/trace/:trackingNo',
          icon: <AuditOutlined />,
          label: '溯源复查',
        }
      )
    }

    if (userRole === 'station_master') {
      commonItems.push(
        {
          key: '/dashboard',
          icon: <DashboardOutlined />,
          label: '驿站工作台',
        },
        {
          key: '/community/stations',
          icon: <ShopOutlined />,
          label: '驿站管理',
        },
        {
          key: '/pickup',
          icon: <QrcodeOutlined />,
          label: '取件管理',
        },
        {
          key: '/parcels',
          icon: <InboxOutlined />,
          label: '代收包裹',
        },
        {
          key: '/track',
          icon: <SearchOutlined />,
          label: '包裹查询',
        },
        {
          key: '/community/posts',
          icon: <TeamOutlined />,
          label: '社区互助',
        },
        {
          key: '/community/recycling',
          icon: <LinkOutlined />,
          label: '回收统计',
        }
      )
    }

    if (userRole === 'admin') {
      commonItems.push(
        {
          key: '/admin/parcels',
          icon: <DatabaseOutlined />,
          label: '包裹管理',
        },
        {
          key: '/admin/orders',
          icon: <FileTextOutlined />,
          label: '订单管理',
        },
        {
          key: '/admin/users',
          icon: <TeamOutlined />,
          label: '用户管理',
        },
        {
          key: '/admin/stats',
          icon: <FundOutlined />,
          label: '数据统计',
        },
        {
          key: '/track',
          icon: <SearchOutlined />,
          label: '包裹查询',
        },
        {
          key: '/trace/:trackingNo',
          icon: <AuditOutlined />,
          label: '溯源复查',
        },
        {
          key: '/community/stations',
          icon: <ShopOutlined />,
          label: '驿站审核',
        }
      )
    }

    if (userRole === 'ops') {
      commonItems.push(
        {
          key: '/admin/stats',
          icon: <BarChartOutlined />,
          label: '运营大盘',
        },
        {
          key: '/admin/parcels',
          icon: <DatabaseOutlined />,
          label: '包裹监控',
        },
        {
          key: '/admin/orders',
          icon: <FileTextOutlined />,
          label: '订单管理',
        },
        {
          key: '/anomaly',
          icon: <WarningOutlined />,
          label: '异常处理',
        },
        {
          key: '/community/posts',
          icon: <TeamOutlined />,
          label: '社区运营',
        },
        {
          key: '/track',
          icon: <SearchOutlined />,
          label: '包裹查询',
        },
        {
          key: '/trace/:trackingNo',
          icon: <AuditOutlined />,
          label: '溯源复查',
        }
      )
    }

    if (userRole === 'platform') {
      commonItems.push(
        {
          key: '/admin/stats',
          icon: <BarChartOutlined />,
          label: '数据中心',
        },
        {
          key: '/admin/parcels',
          icon: <DatabaseOutlined />,
          label: '全局包裹',
        },
        {
          key: '/admin/orders',
          icon: <FileTextOutlined />,
          label: '全局订单',
        },
        {
          key: '/admin/users',
          icon: <TeamOutlined />,
          label: '用户管理',
        },
        {
          key: '/community/stations',
          icon: <ShopOutlined />,
          label: '驿站管理',
        },
        {
          key: '/shipping',
          icon: <SendOutlined />,
          label: '运力管理',
          children: [
            { key: '/shipping/regular', label: '普通寄件' },
            { key: '/shipping/large', label: '大件寄送' },
          ],
        },
        {
          key: '/trace/:trackingNo',
          icon: <AuditOutlined />,
          label: '溯源审计',
        }
      )
    }

    return commonItems
  }

  const menuItems = getMenuItems()
  const userMenuItems = getUserMenuItems()

  const handleMenuClick = ({ key }) => {
    if (key === '/trace/:trackingNo') {
      navigate('/track')
    } else {
      navigate(key)
    }
  }

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    }
  }

  const getSelectedKey = () => {
    const path = location.pathname
    if (path.startsWith('/trace/')) return '/trace/:trackingNo'
    if (path === '/shipping') return '/shipping/regular'
    return path
  }

  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/shipping')) return ['/shipping']
    if (path.startsWith('/community')) return ['community']
    return []
  }

  return (
    <Layout className="main-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={240}>
        <div className="logo" style={{ padding: '16px', textAlign: 'center' }}>
          <Space size={8} align="center">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: 'white'
            }}>
              <DashboardOutlined />
            </div>
            {!collapsed && (
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                ExpressTrace
              </span>
            )}
          </Space>
        </div>

        {!collapsed && user && (
          <div style={{ padding: '0 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 }}>
            <Space size={8} align="center">
              <Avatar size="small" icon={<UserOutlined />} />
              <div>
                <div style={{ color: 'white', fontSize: 13 }}>{user.username}</div>
                <Tag color={roleInfo.color} style={{ margin: 0, padding: '0 6px', fontSize: 11 }}>
                  {roleInfo.label}
                </Tag>
              </div>
            </Space>
          </div>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="layout-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ color: 'white', cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            {!collapsed && (
              <Space>
                <Tag color={roleInfo.color} style={{ fontSize: 13, padding: '2px 10px' }}>
                  {roleInfo.icon} {roleInfo.label}
                </Tag>
                <Text type="secondary" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  {roleInfo.description}
                </Text>
              </Space>
            )}
          </div>
          <div className="user-info">
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: '18px', color: 'white' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Avatar style={{
                  background: `linear-gradient(135deg, var(--ant-${roleInfo.color}-5) 0%, var(--ant-${roleInfo.color}-6) 100%)`
                }} icon={roleInfo.icon} />
                <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
                  <span style={{ color: 'white', fontSize: 14 }}>{user?.username || '用户'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{roleInfo.label}</span>
                </Space>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
