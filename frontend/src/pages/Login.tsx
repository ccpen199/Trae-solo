import React, { useState } from 'react'
import { Card, Form, Input, Button, Tabs, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authApi, initApi } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { setToken, setDeveloper } = useAuthStore()

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      const res: any = await authApi.login(values)
      if (res.success) {
        const { token, developer } = res.data
        setToken(token)
        setDeveloper(developer)
        initApi(token)
        message.success('登录成功')
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: { 
    name: string; 
    email: string; 
    password: string; 
    phone?: string 
  }) => {
    setLoading(true)
    try {
      const res: any = await authApi.register(values)
      if (res.success) {
        const { token, developer } = res.data
        setToken(token)
        setDeveloper(developer)
        initApi(token)
        message.success('注册成功')
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const loginForm = (
    <Form
      name="login"
      layout="vertical"
      onFinish={handleLogin}
      autoComplete="off"
    >
      <Form.Item
        name="email"
        label="邮箱"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input 
          prefix={<MailOutlined className="site-form-item-icon" />} 
          placeholder="请输入邮箱"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="密码"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined className="site-form-item-icon" />}
          placeholder="请输入密码"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          登录
        </Button>
      </Form.Item>
    </Form>
  )

  const registerForm = (
    <Form
      name="register"
      layout="vertical"
      onFinish={handleRegister}
      autoComplete="off"
    >
      <Form.Item
        name="name"
        label="姓名"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input 
          prefix={<UserOutlined className="site-form-item-icon" />} 
          placeholder="请输入姓名"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="email"
        label="邮箱"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input 
          prefix={<MailOutlined className="site-form-item-icon" />} 
          placeholder="请输入邮箱"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="密码"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6个字符' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined className="site-form-item-icon" />}
          placeholder="请输入密码"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="phone"
        label="手机号（可选）"
        rules={[
          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
        ]}
      >
        <Input 
          prefix={<PhoneOutlined className="site-form-item-icon" />} 
          placeholder="请输入手机号"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          注册
        </Button>
      </Form.Item>
    </Form>
  )

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: loginForm
    },
    {
      key: 'register',
      label: '注册',
      children: registerForm
    }
  ]

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-title">
          <h1>TIP 开放平台</h1>
          <p>淘宝接入平台治理系统</p>
        </div>
        <Tabs defaultActiveKey="login" items={tabItems} />
      </Card>
    </div>
  )
}

export default Login
