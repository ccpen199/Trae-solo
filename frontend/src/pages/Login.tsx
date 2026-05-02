import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Form, Input, Button, Card, message, Select } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore, roleNames } from '../stores/authStore'
import { authApi } from '../services/api'

const { Option } = Select

const testUsers = [
  { username: 'user1', password: '123456', role: 'rider' },
  { username: 'maintainer1', password: '123456', role: 'maintainer' },
  { username: 'dispatcher1', password: '123456', role: 'dispatcher' },
  { username: 'service1', password: '123456', role: 'service' },
  { username: 'admin1', password: '123456', role: 'admin' }
]

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { token, setToken, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await authApi.login(values)
      if (res.data.success) {
        const { token, user } = res.data.data
        setToken(token)
        setUser(user)
        message.success('登录成功')
        navigate('/dashboard')
      } else {
        message.error(res.data.message || '登录失败')
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (role: string) => {
    const user = testUsers.find(u => u.role === role)
    if (user) {
      form.setFieldsValue({
        username: user.username,
        password: user.password
      })
    }
  }

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ marginBottom: 8, fontSize: 24, fontWeight: 600 }}>共享单车运营系统</h1>
          <p style={{ color: '#999' }}>请登录以继续</p>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24 }}>
          <p style={{ textAlign: 'center', color: '#999', marginBottom: 12, fontSize: 12 }}>快捷登录（测试账号）</p>
          <Select
            placeholder="选择角色快速登录"
            style={{ width: '100%' }}
            onChange={handleQuickLogin}
            allowClear
          >
            {testUsers.map(user => (
              <Option key={user.role} value={user.role}>
                {roleNames[user.role]} ({user.username} / 123456)
              </Option>
            ))}
          </Select>
        </div>
      </Card>
    </div>
  )
}

export default Login
