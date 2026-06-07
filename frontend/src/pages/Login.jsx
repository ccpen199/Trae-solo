import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

const Login = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await api.post('/auth/login', values)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
    }}>
      <Card 
        title={
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: '#1890ff', margin: 0 }}>国家电网</h1>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 14 }}>综合能源服务门户</p>
          </div>
        }
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        <Form
          name="login"
          onFinish={onFinish}
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
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#999' }}>还没有账号？</span>
            <Link to="/register" style={{ marginLeft: 8 }}>立即注册</Link>
            <span style={{ margin: '0 16px', color: '#999' }}>|</span>
            <Link to="/admin/login">管理员登录</Link>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4, fontSize: 12, color: '#666' }}>
            <p style={{ margin: 0 }}>测试账号：user1 / 123456</p>
            <p style={{ margin: '4px 0 0 0' }}>管理员账号：admin / admin123</p>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login
