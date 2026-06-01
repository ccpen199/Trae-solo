import React, { useState } from 'react'
import { Form, Input, Button, message, Card } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import request from '../utils/request'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await request.post('/auth/login', values)
      login(data.token, data.user)
      message.success('登录成功')
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 300)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div className="login-title">
          <h1>医护到家服务履约系统</h1>
          <p>请登录您的账号</p>
        </div>
        <Form
          name="login"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            <p>测试账号：</p>
            <p>管理员: admin / admin123</p>
            <p>调度员: dispatcher / dispatch123</p>
            <p>护士: nurse1 / nurse123</p>
            <p>患者家属: family1 / family123</p>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login
