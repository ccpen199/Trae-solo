import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

const Register = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await api.post('/auth/register', values)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      message.success('注册成功')
      navigate('/')
    } catch (error) {
      message.error(error.response?.data?.error || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
    }}>
      <Card 
        title={
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: '#1890ff', margin: 0 }}>用户注册</h1>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 14 }}>国家电网综合能源服务门户</p>
          </div>
        }
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="手机号" />
          </Form.Item>

          <Form.Item
            name="real_name"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="真实姓名" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#999' }}>已有账号？</span>
            <Link to="/login" style={{ marginLeft: 8 }}>立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Register
