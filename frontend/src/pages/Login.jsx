import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../services/api'
import useAuthStore from '../store/authStore'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const result = await userApi.login(values.username, values.password)
      if (result.success) {
        setUser(result.data.user, result.data.token)
        message.success('登录成功')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-box">
        <div className="login-title">
          <h1>库存管理系统</h1>
          <p>请登录您的账户</p>
        </div>
        
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
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
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 16, textAlign: 'center', color: '#999', fontSize: 12 }}>
          <p style={{ margin: 0, color: '#1890ff' }}>📌 系统管理员: admin / admin123</p>
          <p style={{ margin: '4px 0 0 0', color: '#52c41a' }}>📌 仓库管理员: user / user123</p>
        </div>
      </Card>
    </div>
  )
}

export default Login