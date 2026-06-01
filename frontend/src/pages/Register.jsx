import React from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

const Register = ({ onLogin }) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const handleSubmit = async (values) => {
    try {
      const res = await api.post('/auth/register', values)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      onLogin?.(res.data.user)
      message.success('注册成功')
      navigate('/')
    } catch (error) {
      message.error(error.response?.data?.error || '注册失败')
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh',
      padding: '40px'
    }}>
      <Card title="用户注册" style={{ width: 400 }}>
        <Form
          form={form}
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="手机号" size="large" />
          </Form.Item>

          <Form.Item
            name="nickname"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="昵称" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
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
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
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

export default Register
