import { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, Checkbox, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../utils/auth'

const { Title, Text } = Typography

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const autoLoginStarted = useRef(false)

  const from = location.state?.from?.pathname || '/dashboard'
  const autoDemoLogin = import.meta.env.VITE_AUTO_DEMO_LOGIN === 'true'

  useEffect(() => {
    if (getToken()) {
      navigate(from, { replace: true })
      return
    }

    if (autoDemoLogin && !autoLoginStarted.current) {
      autoLoginStarted.current = true
      form.setFieldsValue({
        email: 'hr@zhilian.com',
        password: '123456',
        remember: true,
      })
      setTimeout(() => form.submit(), 0)
    }
  }, [autoDemoLogin, form, from, navigate])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      await login({ email: values.email, password: values.password })
      if (values.remember) {
        localStorage.setItem('rememberedEmail', values.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
      setTimeout(() => navigate(from, { replace: true }), 0)
    } catch (err) {
      message.error(err.message || '登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    form.setFieldsValue({
      email: 'hr@zhilian.com',
      password: '123456',
      remember: true,
    })
    form.submit()
  }

  const handleDemoLogin2 = () => {
    form.setFieldsValue({
      email: 'hr2@zhilian.com',
      password: '123456',
      remember: true,
    })
    form.submit()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 10px 30px rgba(24, 144, 255, 0.3)',
          }}>
            <span style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}>Z</span>
          </div>
          <Title level={2} style={{ color: '#fff', margin: '0 0 8px 0', fontWeight: '600' }}>
            智能招聘平台
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px' }}>
            让招聘更智能、更高效
          </Text>
        </div>

        <Card
          style={{ borderRadius: '12px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }}
          styles={{ body: { padding: '32px' } }}
        >
          <Form
            form={form}
            name="login"
            initialValues={{
              remember: true,
              email: localStorage.getItem('rememberedEmail') || '',
            }}
            onFinish={handleSubmit}
            size="large"
            style={{ width: '100%' }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
                placeholder="邮箱"
                autoComplete="username"
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
                prefix={<LockOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: '0' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: '44px', fontSize: '16px', fontWeight: '500', borderRadius: '8px' }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '8px',
          }}>
            <Text style={{ color: '#52c41a', fontSize: '13px', fontWeight: 'bold' }}>
              演示账号（点击一键登录）
            </Text>
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
              <div style={{
                flex: 1,
                padding: '12px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onClick={handleDemoLogin}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1890ff'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,144,255,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d9d9d9'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1890ff', marginBottom: '4px' }}>
                  管理员HR
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>hr@zhilian.com</div>
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>密码：123456</div>
              </div>
              <div style={{
                flex: 1,
                padding: '12px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onClick={handleDemoLogin2}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#52c41a'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(82,196,26,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d9d9d9'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#52c41a', marginBottom: '4px' }}>
                  普通HR
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>hr2@zhilian.com</div>
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>密码：123456</div>
              </div>
            </div>
          </div>
        </Card>

        <div style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255, 255, 255, 0.65)', fontSize: '12px' }}>
          © 2024 智能招聘平台. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default Login
