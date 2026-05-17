import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Checkbox, message, Divider } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authAPI } from '@/api'
import { useUserStore } from '@/store'

function Login() {
  const navigate = useNavigate()
  const { login } = useUserStore()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    try {
      setLoading(true)
      const { token, user } = await authAPI.login(values.account, values.password)
      login(token, user)
      message.success('登录成功！')
      navigate('/')
    } catch (error) {
      message.error('登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  const handleThirdPartyLogin = (platform) => {
    message.info(`${platform} 登录功能开发中...`)
  }

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #ff6b9d20 0%, #c4456920 100%)',
      margin: -24,
      padding: 24
    }}>
      <Card
        style={{ width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', borderRadius: 16 }}
        title={
          <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 600, color: '#ff6b9d' }}>
            🎧 欢迎回来
          </div>
        }
      >
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="account"
            rules={[{ required: true, message: '请输入用户名/邮箱' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#999' }} />}
              placeholder="用户名/邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Checkbox name="remember">记住我</Checkbox>
              <a style={{ color: '#ff6b9d' }}>忘记密码？</a>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 44,
                borderRadius: 22,
                fontSize: 16,
                background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                border: 'none'
              }}
            >
              登录
            </Button>
          </Form.Item>

          <Divider plain>或使用以下方式登录</Divider>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
            <Button
              type="text"
              icon={<span style={{ fontSize: 28 }}>📱</span>}
              onClick={() => handleThirdPartyLogin('B站')}
            />
            <Button
              type="text"
              icon={<span style={{ fontSize: 28 }}>💬</span>}
              onClick={() => handleThirdPartyLogin('QQ')}
            />
            <Button
              type="text"
              icon={<span style={{ fontSize: 28 }}>👥</span>}
              onClick={() => handleThirdPartyLogin('微信')}
            />
            <Button
              type="text"
              icon={<span style={{ fontSize: 28 }}>📢</span>}
              onClick={() => handleThirdPartyLogin('微博')}
            />
          </div>

          <div style={{ textAlign: 'center', color: '#666' }}>
            还没有账号？ <Link to="/register" style={{ color: '#ff6b9d', fontWeight: 500 }}>立即注册</Link>
          </div>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>
            <p>测试账号: admin / 123456</p>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login
