import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Tag } from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  ShoppingOutlined,
  MessageOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  HeartOutlined,
  TeamOutlined,
  AuditOutlined,
  FlagOutlined,
  SoundOutlined,
  PlusOutlined,
  ProfileOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { getUser, removeUser, getUserRole } from '../utils/auth'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const workerMenuItems = [
  { key: '/', icon: <HomeOutlined />, label: '岗位列表' },
  { key: '/worker/profile', icon: <UserOutlined />, label: '个人资料' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '我的订单' },
  { key: '/messages', icon: <MessageOutlined />, label: '消息中心' },
  { key: '/settlements', icon: <DollarOutlined />, label: '结算中心' },
  { key: '/guarantees', icon: <SafetyCertificateOutlined />, label: '权益保障' }
]

const employerMenuItems = [
  { key: '/', icon: <HomeOutlined />, label: '岗位列表' },
  { key: '/employer/profile', icon: <ProfileOutlined />, label: '企业资料' },
  { key: '/employer/jobs', icon: <HomeOutlined />, label: '我的岗位' },
  { key: '/employer/jobs/new', icon: <PlusOutlined />, label: '发布岗位' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '订单管理' },
  { key: '/messages', icon: <MessageOutlined />, label: '消息中心' },
  { key: '/settlements', icon: <DollarOutlined />, label: '结算中心' }
]

const adminMenuItems = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '控制面板' },
  { key: '/admin/health-center', icon: <HeartOutlined />, label: '健康中心' },
  { key: '/admin/student-ops', icon: <TeamOutlined />, label: '学生运营' },
  { key: '/admin/financial-audit', icon: <AuditOutlined />, label: '财务审计' },
  { key: '/admin/jobs/audit', icon: <FlagOutlined />, label: '岗位审核' },
  { key: '/admin/arbitrate', icon: <SoundOutlined />, label: '仲裁管理' }
]

function getMenuItems() {
  const role = getUserRole()
  if (role === 'admin') return adminMenuItems
  if (role === 'employer') return employerMenuItems
  if (role === 'worker') return workerMenuItems
  return [{ key: '/', icon: <HomeOutlined />, label: '岗位列表' }]
}

function getRoleLabel(role) {
  if (role === 'admin') return '管理员'
  if (role === 'employer') return '雇主'
  if (role === 'worker') return '求职者'
  return '游客'
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const user = getUser()
  const role = getUserRole()

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleLogout = () => {
    removeUser()
    navigate('/login')
  }

  const handleDemoAdmin = () => {
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      username: '演示管理员',
      role: 'admin',
      token: 'local-demo-admin'
    }))
    navigate('/admin/dashboard')
  }

  const handleDemoWorker = (target = '/orders') => {
    localStorage.setItem('user', JSON.stringify({
      id: 2,
      username: '演示求职者',
      role: 'worker',
      token: 'local-demo-worker'
    }))
    navigate(target)
  }

  const handleDemoEmployer = () => {
    localStorage.setItem('user', JSON.stringify({
      id: 3,
      username: '演示雇主',
      role: 'employer',
      token: 'local-demo-employer'
    }))
    navigate('/employer/jobs/new')
  }

  const dropdownItems = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人资料',
        onClick: () => {
          if (role === 'worker') navigate('/worker/profile')
          else if (role === 'employer') navigate('/employer/profile')
        }
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  }

  const selectedKey = location.pathname

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {user && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: collapsed ? 16 : 18,
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
          >
            {collapsed ? '兼职' : '兼职招聘平台'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={getMenuItems()}
            onClick={handleMenuClick}
          />
        </Sider>
      )}
      <Layout style={{ marginLeft: user ? (collapsed ? 80 : 200) : 0, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {user && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 16, width: 48, height: 48 }}
              />
            )}
            <Text strong style={{ fontSize: 16 }}>
              兼职招聘平台
            </Text>
          </div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button size="small" onClick={() => handleDemoWorker('/worker/profile')}>个人中心</Button>
              <Button size="small" onClick={() => navigate('/')}>搜索筛选</Button>
              <Button size="small" onClick={() => handleDemoWorker('/orders')}>订单提交</Button>
              <Button size="small" onClick={handleDemoAdmin}>后台管理</Button>
              <Dropdown menu={dropdownItems} placement="bottomRight">
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar icon={<UserOutlined />} />
                  <span>{user.username || '用户'}</span>
                  <Tag>{getRoleLabel(role)}</Tag>
                </div>
              </Dropdown>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => handleDemoWorker('/worker/profile')}>
                个人中心
              </Button>
              <Button onClick={() => handleDemoWorker('/orders')}>
                订单提交
              </Button>
              <Button onClick={handleDemoEmployer}>
                发布岗位
              </Button>
              <Button onClick={handleDemoAdmin}>
                后台管理
              </Button>
              <Button type="primary" onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button onClick={() => navigate('/register')}>注册</Button>
            </div>
          )}
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
