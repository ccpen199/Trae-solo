import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Select, message } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons'
import request from '../utils/request'

const { Title } = Typography

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values) => {
    const { confirm, ...data } = values
    setLoading(true)
    try {
      await request.post('/auth/register', data)
      message.success('注册成功，请登录')
      navigate('/login')
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
          注册账号
        </Title>
        <Form name="register" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次密码输入不一致'))
                }
              })
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>
          <Form.Item name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="选择角色">
              <Select.Option value="worker">求职者</Select.Option>
              <Select.Option value="employer">雇主</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="手机号" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            已有账号？<Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}
