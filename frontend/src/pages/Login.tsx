import { Form, Input, Button, Card, message, Spin } from 'antd'
import { UserOutlined, LockOutlined, CarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authAPI } from '@/api'
import { useAuthStore } from '@/store'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const result: any = await authAPI.login(values.username, values.password)
      const token = result?.data?.token || result?.token
      const user = result?.data?.user || result?.user
      if (token && user) {
        login(token, user)
        message.success('登录成功')
        navigate('/dashboard')
      } else {
        message.error('登录响应数据格式错误')
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        message.error('用户名或密码错误，请使用 admin/admin123 登录')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Spin spinning={loading}>
        <Card
          style={{
            width: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            borderRadius: 12,
          }}
          bodyStyle={{ padding: '40px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                fontSize: 48,
                color: '#1890ff',
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <CarOutlined />
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold', color: '#262626' }}>
              同城即时配送调度中台
            </h1>
            <p style={{ color: '#8c8c8c', marginTop: 8 }}>请登录您的账号</p>
          </div>
          <Form
            form={form}
            name="login"
            initialValues={{ username: 'admin', password: 'admin123' }}
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="用户名"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="密码"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block style={{ height: 44 }}>
                登录
              </Button>
            </Form.Item>
          </Form>
          <div style={{ marginTop: 16, textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>
            默认账号：admin / admin123
          </div>
        </Card>
      </Spin>
    </div>
  )
}
