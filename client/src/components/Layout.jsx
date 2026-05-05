import React, { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, Button, theme, message, Modal, Form, Input } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  TeamOutlined,
  DesktopOutlined,
  FileTextOutlined,
  LayoutOutlined,
  PlayCircleOutlined,
  CalendarOutlined,
  LogoutOutlined,
  SettingOutlined,
  LockOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getMenus, getButtonPermissions, logout as logoutApi, changePassword } from '../api/auth'

const { Header, Sider, Content } = Layout

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [passwordForm] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, setMenus, setButtonPermissions } = useAuthStore()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  useEffect(() => {
    fetchMenus()
    fetchButtonPermissions()
  }, [])

  const fetchMenus = async () => {
    try {
      const result = await getMenus()
      setMenus(result.data)
      setButtonPermissions(result.data)
      const items = buildMenuItems(result.data)
      setMenuItems(items)
    } catch (error) {
      console.error('获取菜单失败:', error)
    }
  }

  const fetchButtonPermissions = async () => {
    try {
      const result = await getButtonPermissions()
      setButtonPermissions(result.data)
    } catch (error) {
      console.error('获取按钮权限失败:', error)
    }
  }

  const buildMenuItems = (menus, level = 0) => {
    return menus
      .filter(menu => !menu.isHidden)
      .map(menu => {
        const item = {
          key: menu.path || menu.code,
          icon: getMenuIcon(menu.icon),
          label: menu.path ? (
            <Link to={menu.path}>{menu.name}</Link>
          ) : (
            menu.name
          ),
        }
        if (menu.children && menu.children.length > 0) {
          item.children = buildMenuItems(menu.children, level + 1)
        }
        return item
      })
  }

  const getMenuIcon = (iconName) => {
    if (!iconName) return null
    const iconMap = {
      UserOutlined: <UserOutlined />,
      TeamOutlined: <SettingOutlined />,
      DesktopOutlined: <DesktopOutlined />,
      FileTextOutlined: <FileTextOutlined />,
      LayoutOutlined: <LayoutOutlined />,
      PlayCircleOutlined: <PlayCircleOutlined />,
      CalendarOutlined: <CalendarOutlined />,
      SettingOutlined: <SettingOutlined />,
    }
    return iconMap[iconName] || <SettingOutlined />
  }

  const handleLogout = async () => {
    try {
      await logoutApi()
      logout()
      message.success('退出登录成功')
      navigate('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      logout()
      navigate('/login')
    }
  }

  const handlePasswordSubmit = async (values) => {
    setLoading(true)
    try {
      await changePassword(values)
      message.success('密码修改成功，请重新登录')
      setPasswordModalVisible(false)
      passwordForm.resetFields()
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 1000)
    } catch (error) {
      console.error('修改密码失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const userMenuItems = [
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => setPasswordModalVisible(true)
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    },
  ]

  const getSelectedKeys = () => {
    const pathname = location.pathname
    return [pathname]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 64, margin: 16, background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
          <span style={{ color: '#fff', fontSize: collapsed ? 14 : 18, fontWeight: 'bold' }}>
            {collapsed ? 'RBAC' : '权限管理系统'}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ marginRight: 24 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="avatar-dropdown">
                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <span>{user?.realName || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false)
          passwordForm.resetFields()
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          onFinish={handlePasswordSubmit}
          layout="vertical"
        >
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default AppLayout
