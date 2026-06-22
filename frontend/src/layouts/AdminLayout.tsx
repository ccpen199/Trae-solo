import { useState } from 'react'
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  Space,
  Button,
  Modal,
  Form,
  Input,
  message,
  ConfigProvider,
  Typography,
} from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  AuditOutlined,
  WarningOutlined,
  DollarOutlined,
  AppstoreOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import zhCN from 'antd/locale/zh_CN'
import type { MenuProps } from 'antd'
import { useAuth } from '../App'
import { tokenUtils } from '../utils/request'
import authApi from '../api/auth'
import Dashboard from '../pages/admin/Dashboard'
import RiskAlerts from '../pages/admin/RiskAlerts'
import WageSupervision from '../pages/admin/WageSupervision'
import UserManagement from '../pages/admin/UserManagement'
import JobAudit from '../pages/admin/JobAudit'
import PlatformServices from '../pages/admin/PlatformServices'

const { Header, Sider, Content } = Layout
const { Title } = Typography

type MenuItem = Required<MenuProps>['items'][number]

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshUser } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordForm] = Form.useForm()
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出登录',
      content: '确定要退出当前账号吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        tokenUtils.clearAll()
        void refreshUser()
        navigate('/login', { replace: true })
      },
    })
  }

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields()
      setPasswordLoading(true)
      const res = await authApi.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      })
      if (res.code === 0) {
        message.success('密码修改成功，请重新登录')
        setPasswordModalOpen(false)
        passwordForm.resetFields()
        tokenUtils.clearAll()
        navigate('/login', { replace: true })
      } else {
        message.error(res.message || '修改失败')
      }
    } catch {
    } finally {
      setPasswordLoading(false)
    }
  }

  const menuItems: MenuItem[] = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">数据总览</Link>,
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: '用户管理',
      children: [
        {
          key: '/admin/users/workers',
          label: <Link to="/admin/users/workers">工人列表</Link>,
        },
        {
          key: '/admin/users/enterprises',
          label: <Link to="/admin/users/enterprises">企业列表</Link>,
        },
      ],
    },
    {
      key: '/admin/audit',
      icon: <AuditOutlined />,
      label: <Link to="/admin/audit">用工审核</Link>,
    },
    {
      key: '/admin/risk',
      icon: <WarningOutlined />,
      label: <Link to="/admin/risk">风控预警</Link>,
    },
    {
      key: '/admin/wages',
      icon: <DollarOutlined />,
      label: <Link to="/admin/wages">工资监管</Link>,
    },
    {
      key: '/admin/services',
      icon: <AppstoreOutlined />,
      label: <Link to="/admin/services">平台服务</Link>,
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: <Link to="/admin/settings">系统设置</Link>,
    },
  ]

  const selectedKey = location.pathname

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '管理员信息',
      onClick: () => navigate('/admin/settings'),
    },
    {
      key: 'password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => setPasswordModalOpen(true),
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

  const displayName = user?.real_name || user?.phone || '管理员'

  const openKeys = ['/admin/users']

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={220}
          style={{
            background: '#000c17',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #faad14 0%, #f5222d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 'bold',
                marginRight: collapsed ? 0 : 10,
              }}
            >
              匠
            </div>
            {!collapsed && (
              <span style={{ fontSize: 16, fontWeight: 600 }}>匠信工易</span>
            )}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={openKeys}
            items={menuItems}
            style={{ borderRight: 0, marginTop: 8 }}
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
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Space size={16}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 16, width: 48, height: 48 }}
              />
              <Title level={4} style={{ margin: 0, color: '#1f1f1f' }}>
                管理端
              </Title>
              <SafetyCertificateOutlined style={{ fontSize: 16, color: '#faad14' }} />
            </Space>

            <Space size={20}>
              <Badge count={8} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
              </Badge>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
                  <Avatar size={36} style={{ background: '#f5222d' }} icon={<UserOutlined />} />
                  <span style={{ color: '#1f1f1f', fontSize: 14 }}>{displayName}</span>
                </Space>
              </Dropdown>
            </Space>
          </Header>
          <Content
            style={{
              margin: 24,
              padding: 24,
              background: '#fff',
              borderRadius: 8,
              minHeight: 280,
            }}
          >
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users/workers" element={<UserManagement />} />
              <Route path="users/enterprises" element={<UserManagement />} />
              <Route path="audit" element={<JobAudit />} />
              <Route path="risk" element={<RiskAlerts />} />
              <Route path="wages" element={<WageSupervision />} />
              <Route path="services" element={<PlatformServices />} />
              <Route path="settings" element={<div>系统设置</div>} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => {
          setPasswordModalOpen(false)
          passwordForm.resetFields()
        }}
        confirmLoading={passwordLoading}
        okText="确认修改"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="old_password"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码（至少6位）" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  )
}

export default AdminLayout
