import { useState } from 'react'
import { Card, Form, Input, Button, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import request from '../utils/request'
import useUserStore from '../store/user'

const { Title, Text } = Typography

const Login = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { login } = useUserStore()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await request.post('/auth/login', values)
      login(res.data.user, res.data.token)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      width: 400, 
      maxWidth: '90vw'
    }}>
      <Card style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛠️</div>
          <Title level={2} style={{ margin: 0, color: '#333' }}>家电租借平台</Title>
          <Text type="secondary">欢迎登录</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          initialValues={{ phone: '13800138000', password: '123456' }}
          size="large"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入手机号"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">还没有账号？</Text>
            <Link to="/register" style={{ marginLeft: 8 }}>立即注册</Link>
          </div>

          <div style={{ marginTop: 24, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              测试账号：13800138000 / 123456（已实名）
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              测试账号：13800138001 / 123456（未实名）
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login
