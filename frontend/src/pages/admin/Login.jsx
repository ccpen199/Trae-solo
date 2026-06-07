import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await api.post('/admin/login', values)
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin', JSON.stringify(data.admin))
      message.success('登录成功')
      navigate('/admin')
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败')
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        title={
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: '#722ed1', margin: 0 }}>运营管理系统</h1>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 14 }}>国家电网综合能源服务门户</p>
          </div>
        }
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        <Form
          name="admin_login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="管理员账号" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login">返回用户登录</Link>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4, fontSize: 12, color: '#666' }}>
            <p style={{ margin: 0 }}>管理员账号：admin / admin123</p>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default AdminLogin
