import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Tabs, message, Spin } from 'antd'
import { UserOutlined, LockOutlined, UserAddOutlined } from '@ant-design/icons'
import { login, register } from '../services/api'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const res = await login(values)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      onLogin?.(res.data.user)
      message.success('登录成功')
      navigate(-1)
    } catch (err) {
      message.error(err.response?.data?.message || '登录失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      const res = await register({
        phone: values.phone,
        password: values.password,
        nickname: values.nickname,
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      onLogin?.(res.data.user)
      message.success('注册成功')
      navigate('/')
    } catch (err) {
      message.error(err.response?.data?.message || '注册失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="手机号"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                border: 'none',
                height: '50px',
                fontSize: '16px',
              }}
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>
            <p>测试账号：13800138000</p>
            <p>测试密码：123456</p>
          </div>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          name="register"
          onFinish={handleRegister}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="手机号"
            />
          </Form.Item>

          <Form.Item
            name="nickname"
            rules={[
              { required: true, message: '请输入昵称' },
              { min: 2, message: '昵称至少2个字符' },
            ]}
          >
            <Input
              prefix={<UserAddOutlined />}
              placeholder="昵称"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: '请确认密码' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                border: 'none',
                height: '50px',
                fontSize: '16px',
              }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1 style={{ color: 'white', marginBottom: '10px' }}>会员登录</h1>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '40px', maxWidth: '500px' }}>
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            centered
            size="large"
          />
        </Card>
      </div>
    </div>
  )
}

export default Login
