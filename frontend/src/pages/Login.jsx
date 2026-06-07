import React, { useState } from 'react'
import { Form, Input, Button, message, Tabs } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../utils/api.js'

function Login({ setUser }) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const response = await authAPI.login(values)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      setUser(response.data.user)
      message.success('登录成功')
      
      if (response.data.user.role === 'admin' || response.data.user.role === 'superadmin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">校园物联网热水服务系统</h1>
        <Tabs defaultActiveKey="student">
          <Tabs.TabPane tab="学生登录" key="student">
            <Form
              name="student_login"
              onFinish={handleLogin}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入学号' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="学号" />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码（默认学号）" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  登录
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
          <Tabs.TabPane tab="管理员登录" key="admin">
            <Form
              name="admin_login"
              onFinish={handleLogin}
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
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  登录
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>
        <div style={{ marginTop: 20, color: '#999', fontSize: 12, textAlign: 'center' }}>
          <p>测试账号：</p>
          <p>管理员：admin / admin123</p>
          <p>学生：2024000001 / 2024000001</p>
        </div>
      </div>
    </div>
  )
}

export default Login
