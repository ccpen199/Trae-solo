import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message, Space, Divider } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import request from '../utils/request'
import { saveUser } from '../utils/auth'

const { Title } = Typography

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await request.post('/auth/login', values)
      const payload = res.data || res
      const user = payload.user ? { ...payload.user, token: payload.token } : payload
      saveUser(user)
      message.success('登录成功')
      const role = user.role
      if (role === 'admin') navigate('/admin/dashboard')
      else if (role === 'employer') navigate('/employer/jobs')
      else navigate('/')
    } catch (e) {
      // error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          兼职招聘平台
        </Title>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          size="large"
          autoComplete="off"
          initialValues={{ username: 'admin', password: 'admin123' }}
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
          <div style={{ textAlign: 'center' }}>
            还没有账号？<Link to="/register">立即注册</Link>
          </div>
          <Divider plain>演示账号</Divider>
          <Space wrap style={{ justifyContent: 'center', width: '100%' }}>
            <Button size="small" onClick={() => form.setFieldsValue({ username: 'worker1', password: 'worker123' })}>
              求职者报名
            </Button>
            <Button size="small" onClick={() => form.setFieldsValue({ username: 'employer1', password: 'employer123' })}>
              雇主发布
            </Button>
            <Button size="small" onClick={() => form.setFieldsValue({ username: 'admin', password: 'admin123' })}>
              后台管理
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}
