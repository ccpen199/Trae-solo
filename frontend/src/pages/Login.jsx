import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Tabs, message, Space, Divider } from 'antd'
import { UserOutlined, LockOutlined, MobileOutlined, WechatOutlined, QqOutlined } from '@ant-design/icons'
import useStore from '../store'
import { authApi } from '../api'

const Login = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useStore()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const data = await authApi.login(values.account, values.password)
      setToken(data.token)
      setUser(data.user)
      message.success('登录成功')
      navigate('/home')
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    setLoading(true)
    try {
      const data = await authApi.register({
        username: values.username,
        phone: values.phone,
        password: values.password,
        nickname: values.username
      })
      setToken(data.token)
      setUser(data.user)
      message.success('注册成功')
      navigate('/home')
    } catch (error) {
      console.error('注册失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleThirdPartyLogin = async (platform) => {
    try {
      const data = await authApi.thirdPartyLogin({
        platform,
        openId: `${platform}_${Date.now()}`,
        nickname: `${platform}用户`,
        avatar: ''
      })
      setToken(data.token)
      setUser(data.user)
      message.success('登录成功')
      navigate('/home')
    } catch (error) {
      console.error('第三方登录失败:', error)
    }
  }

  const loginItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="account"
            rules={[{ required: true, message: '请输入用户名或手机号' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名/手机号" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          form={form}
          name="register"
          onFinish={handleRegister}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input 
              prefix={<MobileOutlined />} 
              placeholder="手机号" 
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
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '40px 24px',
      background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>藏书馆</h1>
        <p style={{ color: '#666' }}>免费借阅，海量好书</p>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={loginItems}
          centered
        />

        <Divider plain style={{ margin: '24px 0 16px' }}>其他登录方式</Divider>

        <Space size="large" style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type="text"
            size="large"
            icon={<WechatOutlined style={{ fontSize: 24, color: '#07c160' }} />}
            onClick={() => handleThirdPartyLogin('wechat')}
          />
          <Button
            type="text"
            size="large"
            icon={<QqOutlined style={{ fontSize: 24, color: '#12b7f5' }} />}
            onClick={() => handleThirdPartyLogin('qq')}
          />
        </Space>

        <div style={{ textAlign: 'center', marginTop: 24, color: '#999', fontSize: 12 }}>
          <p>测试账号: testuser / 123456</p>
        </div>
      </div>
    </div>
  )
}

export default Login
