import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  AuditOutlined,
  AlertOutlined,
  BulbOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const AdminLayout = ({ user, children, onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '数据看板' },
    { key: '/verifications', icon: <AuditOutlined />, label: '认证审核' },
    { key: '/disputes', icon: <AlertOutlined />, label: '纠纷仲裁' },
    { key: '/orders', icon: <FileTextOutlined />, label: '订单管理' },
    { key: '/master-density', icon: <BarChartOutlined />, label: '师傅热力图' },
    { key: '/knowledge', icon: <BulbOutlined />, label: '知识图谱' }
  ]

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: onLogout }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold'
        }}>
          管理后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>家居服务众包平台 - 运营管理</div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name || user?.phone}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', borderRadius: 8, padding: 24 }}>
          <div style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
            个人中心：演示管理员资料与账号状态；分类发现：服务知识图谱、师傅热力图、订单类型和纠纷分类统一查看。
          </div>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
