import { useState } from 'react'
import { Card, Form, Input, Button, Typography, message } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import request from '../utils/request'
import useUserStore from '../store/user'

const { Title, Text } = Typography

const Register = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { login } = useUserStore()

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      const res = await request.post('/auth/register', {
        phone: values.phone,
        password: values.password,
        nickname: values.nickname
      })
      login(res.data.user, res.data.token)
      message.success('注册成功')
      navigate('/')
    } catch (error) {
      console.error('Register error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      width: 400, 
      maxWidth: '90vw'
    }}>
      <Card style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛠️</div>
          <Title level={2} style={{ margin: 0, color: '#333' }}>家电租借平台</Title>
          <Text type="secondary">注册账号</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入手机号"
            />
          </Form.Item>

          <Form.Item
            name="nickname"
            rules={[
              { required: true, message: '请输入昵称' },
              { max: 20, message: '昵称最多20个字符' }
            ]}
          >
            <Input 
              prefix={<SafetyOutlined />} 
              placeholder="请输入昵称"
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
              placeholder="请输入密码"
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
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">已有账号？</Text>
            <Link to="/login" style={{ marginLeft: 8 }}>立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Register
