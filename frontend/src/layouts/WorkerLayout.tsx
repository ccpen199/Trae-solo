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
  SearchOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  StarOutlined,
  WalletOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
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
import Dashboard from '../pages/worker/Dashboard'
import JobList from '../pages/worker/JobList'
import Applications from '../pages/worker/Applications'
import Attendance from '../pages/worker/Attendance'
import Craftsman from '../pages/worker/Craftsman'
import Wages from '../pages/worker/Wages'
import Certificates from '../pages/worker/Certificates'
import Services from '../pages/worker/Services'
import Settings from '../pages/worker/Settings'

const { Header, Sider, Content } = Layout
const { Title } = Typography

type MenuItem = Required<MenuProps>['items'][number]

function WorkerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, worker, refreshUser } = useAuth()
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
      key: '/worker/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/worker/dashboard">工作台</Link>,
    },
    {
      key: '/worker/jobs',
      icon: <SearchOutlined />,
      label: <Link to="/worker/jobs">找工作</Link>,
    },
    {
      key: '/worker/applications',
      icon: <FileTextOutlined />,
      label: <Link to="/worker/applications">我的申请</Link>,
    },
    {
      key: '/worker/attendance',
      icon: <CheckCircleOutlined />,
      label: <Link to="/worker/attendance">考勤打卡</Link>,
    },
    {
      key: '/worker/score',
      icon: <StarOutlined />,
      label: <Link to="/worker/score">匠级评分</Link>,
    },
    {
      key: '/worker/wages',
      icon: <WalletOutlined />,
      label: <Link to="/worker/wages">薪资管理</Link>,
    },
    {
      key: '/worker/certificates',
      icon: <CertificateOutlined />,
      label: <Link to="/worker/certificates">技能证书</Link>,
    },
    {
      key: '/worker/reviews',
      icon: <TeamOutlined />,
      label: <Link to="/worker/reviews">工友互评</Link>,
    },
    {
      key: '/worker/services',
      icon: <AppstoreOutlined />,
      label: <Link to="/worker/services">延伸服务</Link>,
    },
    {
      key: '/worker/settings',
      icon: <SettingOutlined />,
      label: <Link to="/worker/settings">设置</Link>,
    },
  ]

  const selectedKey = location.pathname

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/worker/settings'),
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

  const displayName = user?.real_name || worker?.primary_skill || user?.phone || '用户'

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={220}
          style={{
            background: '#001529',
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                工人端
              </Title>
            </Space>

            <Space size={20}>
              <Badge count={3} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
              </Badge>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
                  <Avatar size={36} style={{ background: '#1677ff' }} icon={<UserOutlined />} />
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
              <Route path="jobs" element={<JobList />} />
              <Route path="applications" element={<Applications />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="score" element={<Craftsman />} />
              <Route path="wages" element={<Wages />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="reviews" element={<Craftsman />} />
              <Route path="services" element={<Services />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<div style={{ textAlign: 'center', padding: '80px 0', color: '#8c8c8c' }}>页面不存在</div>} />
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

export default WorkerLayout
