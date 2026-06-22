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
  ShopOutlined,
  FileTextOutlined,
  TeamOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  StarOutlined,
  AppstoreOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import zhCN from 'antd/locale/zh_CN'
import type { MenuProps } from 'antd'
import { useAuth } from '../App'
import { tokenUtils } from '../utils/request'
import authApi from '../api/auth'
import Dashboard from '../pages/enterprise/Dashboard'
import JobManagement from '../pages/enterprise/JobManagement'
import WorkerManagement from '../pages/enterprise/WorkerManagement'
import ContractManagement from '../pages/enterprise/ContractManagement'
import Guarantee from '../pages/enterprise/Guarantee'
import WagePayment from '../pages/enterprise/WagePayment'
import CreditScore from '../pages/enterprise/CreditScore'
import Services from '../pages/enterprise/Services'
import Settings from '../pages/enterprise/Settings'

const { Header, Sider, Content } = Layout
const { Title } = Typography

type MenuItem = Required<MenuProps>['items'][number]

function EnterpriseLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, enterprise, refreshUser } = useAuth()
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
      key: '/enterprise/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/enterprise/dashboard">工作台</Link>,
    },
    {
      key: '/enterprise/jobs',
      icon: <FileTextOutlined />,
      label: <Link to="/enterprise/jobs">用工管理</Link>,
    },
    {
      key: '/enterprise/workers',
      icon: <TeamOutlined />,
      label: <Link to="/enterprise/workers">工人管理</Link>,
    },
    {
      key: '/enterprise/contracts',
      icon: <FileProtectOutlined />,
      label: <Link to="/enterprise/contracts">合同管理</Link>,
    },
    {
      key: '/enterprise/guarantee',
      icon: <SafetyCertificateOutlined />,
      label: <Link to="/enterprise/guarantee">保证金</Link>,
    },
    {
      key: '/enterprise/payroll',
      icon: <DollarOutlined />,
      label: <Link to="/enterprise/payroll">工资发放</Link>,
    },
    {
      key: '/enterprise/credit',
      icon: <StarOutlined />,
      label: <Link to="/enterprise/credit">信用评分</Link>,
    },
    {
      key: '/enterprise/services',
      icon: <AppstoreOutlined />,
      label: <Link to="/enterprise/services">延伸服务</Link>,
    },
    {
      key: '/enterprise/settings',
      icon: <SettingOutlined />,
      label: <Link to="/enterprise/settings">设置</Link>,
    },
  ]

  const selectedKey = location.pathname

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '企业信息',
      onClick: () => navigate('/enterprise/settings'),
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

  const displayName = enterprise?.company_name || user?.real_name || user?.phone || '企业用户'

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={220}
          style={{
            background: '#002140',
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
                background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
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
            defaultOpenKeys={[]}
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
                企业端
              </Title>
            </Space>

            <Space size={20}>
              <Badge count={5} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
              </Badge>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
                  <Avatar size={36} style={{ background: '#1890ff' }} icon={<UserOutlined />} />
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
              <Route path="jobs" element={<JobManagement />} />
              <Route path="workers" element={<WorkerManagement />} />
              <Route path="contracts" element={<ContractManagement />} />
              <Route path="guarantee" element={<Guarantee />} />
              <Route path="payroll" element={<WagePayment />} />
              <Route path="credit" element={<CreditScore />} />
              <Route path="services" element={<Services />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<div>页面不存在</div>} />
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

export default EnterpriseLayout
