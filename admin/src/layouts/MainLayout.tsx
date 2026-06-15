import React, { useState, useEffect } from 'react'
import {
  Layout,
  Menu,
  Breadcrumb,
  Avatar,
  Dropdown,
  Badge,
  Space,
  Button,
  type MenuProps
} from 'antd'
import {
  DashboardOutlined,
  BankOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  AuditOutlined,
  DatabaseOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  ProfileOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useUserStore } from '@/store/user'
import classNames from 'classnames'
import type { MenuItem } from '@/types'

const { Header, Sider, Content } = Layout

const menuItems: MenuItem[] = [
  {
    key: '/dashboard',
    label: '工作台',
    icon: <DashboardOutlined />,
    path: '/dashboard'
  },
  {
    key: '/departments',
    label: '委办局管理',
    icon: <BankOutlined />,
    path: '/departments'
  },
  {
    key: '/services',
    label: '服务事项中枢',
    icon: <AppstoreOutlined />,
    path: '/services'
  },
  {
    key: '/certificates',
    label: '电子证照库',
    icon: <FileTextOutlined />,
    path: '/certificates'
  },
  {
    key: '/tickets',
    label: '12345工单系统',
    icon: <CustomerServiceOutlined />,
    path: '/tickets'
  },
  {
    key: '/audit-logs',
    label: '审计日志',
    icon: <AuditOutlined />,
    path: '/audit-logs'
  },
  {
    key: '/city-data-secretary',
    label: '城市数据秘书',
    icon: <DatabaseOutlined />,
    path: '/city-data-secretary'
  },
  {
    key: '/system',
    label: '系统管理',
    icon: <SettingOutlined />,
    children: [
      {
        key: '/system/users',
        label: '用户管理',
        icon: <TeamOutlined />,
        path: '/system/users'
      },
      {
        key: '/system/roles',
        label: '角色权限',
        icon: <SafetyCertificateOutlined />,
        path: '/system/roles'
      }
    ]
  }
]

const breadcrumbMap: Record<string, string[]> = {
  '/dashboard': ['工作台'],
  '/departments': ['委办局管理'],
  '/services': ['服务事项中枢'],
  '/certificates': ['电子证照库'],
  '/tickets': ['12345工单系统'],
  '/audit-logs': ['审计日志'],
  '/city-data-secretary': ['城市数据秘书'],
  '/system/users': ['系统管理', '用户管理'],
  '/system/roles': ['系统管理', '角色权限']
}

const convertMenuItems = (items: MenuItem[]): MenuProps['items'] => {
  return items.map((item) => {
    if (item.children && item.children.length > 0) {
      return {
        key: item.key,
        icon: item.icon,
        label: item.label,
        children: convertMenuItems(item.children)
      }
    }
    return {
      key: item.key,
      icon: item.icon,
      label: item.label
    }
  })
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo, logout } = useUserStore()
  const [collapsed, setCollapsed] = useState(false)

  const selectedKeys = [location.pathname]

  const getOpenKeys = (): string[] => {
    const path = location.pathname
    const keys: string[] = []
    menuItems.forEach((item) => {
      if (item.children) {
        item.children.forEach((child) => {
          if (child.path === path) {
            keys.push(item.key)
          }
        })
      }
    })
    return keys
  }

  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys())

  useEffect(() => {
    setOpenKeys(getOpenKeys())
  }, [location.pathname])

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: '个人中心'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const breadcrumbItems = breadcrumbMap[location.pathname] || []

  return (
    <Layout className="main-layout" style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0
        }}
      >
        <div
          className={classNames('logo', { 'logo-collapsed': collapsed })}
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {collapsed ? '政务' : '宁夏政务管理后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={convertMenuItems(menuItems)}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: 64
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Breadcrumb items={breadcrumbItems.map((item) => ({ title: item }))} />
          </div>
          <Space size={16}>
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                style={{ width: 40, height: 40 }}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#0958d9' }} />
                <span style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                  {userInfo?.name || '管理员'}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 64px - 32px)'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
