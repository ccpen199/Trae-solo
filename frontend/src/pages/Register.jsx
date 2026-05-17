import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { authAPI } from '@/api'
import { useUserStore } from '@/store'

function Register() {
  const navigate = useNavigate()
  const { login } = useUserStore()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }
    try {
      setLoading(true)
      const result = await authAPI.register({
        username: values.username,
        email: values.email,
        password: values.password,
        nickname: values.username
      })
      login(result.token, result.user)
      message.success('注册成功！')
      navigate('/')
    } catch (error) {
      message.error('注册失败，请重试')
    } finally {
      setLoading(false)
    }
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
            🎧 注册账号
          </div>
        }
      >
        <Form
          name="register"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 20, message: '用户名长度为3-20个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#999' }} />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#999' }} />}
              placeholder="邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="确认密码"
            />
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
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#666' }}>
            已有账号？ <Link to="/login" style={{ color: '#ff6b9d', fontWeight: 500 }}>立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Register
