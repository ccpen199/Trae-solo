import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authAPI } from '../utils/api'

const { Title } = Typography

function Login({ onLogin }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleLogin = async values => {
    setLoading(true)
    try {
      const data = await authAPI.login(values)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin?.(data.user)
      message.success(`登录成功，欢迎回来 ${data.user.nickname || data.user.username}`)

      const adminRoles = ['operator', 'regional_admin', 'hq_auditor', 'admin']
      if (adminRoles.includes(data.user.role)) {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (e) {
      message.error(e.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '60px auto' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>登录</Title>
        <Form
          name="login"
          onFinish={handleLogin}
          initialValues={{ username: 'user1', password: '123456' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名/手机号" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          还没有账号？<Link to="/register">立即注册</Link>
        </div>
        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8, fontSize: 12, color: '#666' }}>
          <div>测试账号：</div>
          <div>用户：user1 / 123456</div>
          <div>管理员：admin / 123456</div>
        </div>
      </Card>
    </div>
  )
}

export default Login
