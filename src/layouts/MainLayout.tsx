import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography, Badge, Space, Avatar, Dropdown, Tag } from 'antd'
import {
  SafetyCertificateOutlined,
  UnorderedListOutlined,
  SafetyOutlined,
  FolderOpenOutlined,
  ApiOutlined,
  GlobalOutlined,
  DashboardOutlined,
  AuditOutlined,
  UserOutlined,
  BellOutlined,
  LockOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/auth', icon: <SafetyCertificateOutlined />, label: '统一身份认证' },
  { key: '/items', icon: <UnorderedListOutlined />, label: '事项标准化管理' },
  { key: '/seal', icon: <SafetyOutlined />, label: '电子印章管理' },
  { key: '/license', icon: <FolderOpenOutlined />, label: '电子证照库' },
  { key: '/data-sharing', icon: <ApiOutlined />, label: '数据共享交换中枢' },
  { key: '/portal', icon: <GlobalOutlined />, label: '门户聚合引擎' },
  { key: '/monitor', icon: <DashboardOutlined />, label: '运行监测大屏' },
  { key: '/audit', icon: <AuditOutlined />, label: '审计日志' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const userMenu = {
    items: [
      { key: 'profile', label: '个人信息', icon: <UserOutlined /> },
      { key: 'security', label: '安全设置', icon: <LockOutlined /> },
      { type: 'divider' as const },
      { key: 'logout', label: '退出登录', danger: true },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <SafetyCertificateOutlined
            style={{ fontSize: 28, color: '#c41d7f', marginRight: collapsed ? 0 : 10 }}
          />
          {!collapsed && (
            <Typography.Text
              strong
              style={{ fontSize: 16, color: '#1a1a1a', whiteSpace: 'nowrap' }}
            >
              统一数字底座
            </Typography.Text>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            height: 64,
          }}
        >
          <Space>
            {collapsed ? (
              <MenuUnfoldOutlined
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() => setCollapsed(false)}
              />
            ) : (
              <MenuFoldOutlined
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() => setCollapsed(true)}
              />
            )}
            <Typography.Text style={{ fontSize: 16, fontWeight: 600 }}>
              国家级政务服务平台
            </Typography.Text>
            <Tag color="green" className="security-badge level3">
              等保三级
            </Tag>
            <Tag color="purple" className="security-badge">
              商密评估
            </Tag>
          </Space>
          <Space size={20}>
            <Badge count={5} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size={32} icon={<UserOutlined />} style={{ background: '#c41d7f' }} />
                <Typography.Text>管理员</Typography.Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
