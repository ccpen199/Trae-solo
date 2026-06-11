import { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, Checkbox, Card, Typography, message, Divider } from 'antd'
import { UserOutlined, LockOutlined, CrownOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { getToken, setToken as saveToken, setUser as saveUser } from '../utils/auth'
import { auth } from '../api'

const { Title, Text } = Typography

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(null)
  const [form] = Form.useForm()
  const autoLoginStarted = useRef(false)

  const from = location.state?.from?.pathname || '/dashboard'
  const autoDemoLogin = import.meta.env.VITE_AUTO_DEMO_LOGIN === 'true'

  useEffect(() => {
    if (getToken()) {
      navigate(from, { replace: true })
    }
  }, [])

  const doLoginAndNavigate = async (loginData) => {
    try {
      const res = await auth.login(loginData)
      const { token, user } = res.data
      if (!token || !user) {
        throw new Error('服务器返回数据异常')
      }
      saveToken(token)
      saveUser(user)
      message.success(`登录成功，欢迎 ${user.name || ''}！`)
      window.location.href = from
    } catch (err) {
      message.error(err.message || '登录失败，请检查账号密码')
    }
  }

  useEffect(() => {
    if (!autoDemoLogin || getToken() || autoLoginStarted.current || window.__may89099AutoLoginStarted) {
      return
    }

    autoLoginStarted.current = true
    window.__may89099AutoLoginStarted = true
    localStorage.setItem('rememberedEmail', 'hr@zhilian.com')
    doLoginAndNavigate({ email: 'hr@zhilian.com', password: '123456' })
  }, [autoDemoLogin])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      await doLoginAndNavigate({ email: values.email, password: values.password })
      if (values.remember) {
        localStorage.setItem('rememberedEmail', values.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
    } catch (err) {
      // doLoginAndNavigate already shows error
    } finally {
      setLoading(false)
    }
  }

  const handleFinishFailed = ({ errorFields }) => {
    if (errorFields && errorFields.length > 0) {
      message.error(errorFields[0].errors[0] || '请填写完整的登录信息')
    }
  }

  const handleDemoLogin = async (email, password, label) => {
    setDemoLoading(label)
    try {
      await doLoginAndNavigate({ email, password })
    } catch (err) {
      // doLoginAndNavigate already shows error
    } finally {
      setDemoLoading(null)
    }
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
            onFinishFailed={handleFinishFailed}
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

          <Divider style={{ margin: '20px 0 16px' }}>演示账号，一键登录</Divider>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              block
              icon={<CrownOutlined />}
              loading={demoLoading === 'admin'}
              onClick={() => handleDemoLogin('hr@zhilian.com', '123456', 'admin')}
              style={{
                height: '64px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '1px solid #1890ff',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '14px' }}>管理员HR</span>
              <span style={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)', marginTop: '2px' }}>hr@zhilian.com</span>
            </Button>
            <Button
              block
              icon={<TeamOutlined />}
              loading={demoLoading === 'hr'}
              onClick={() => handleDemoLogin('hr2@zhilian.com', '123456', 'hr')}
              style={{
                height: '64px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '1px solid #52c41a',
                background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#52c41a', fontSize: '14px' }}>普通HR</span>
              <span style={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)', marginTop: '2px' }}>hr2@zhilian.com</span>
            </Button>
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
