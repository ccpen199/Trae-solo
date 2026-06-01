import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authAPI } from '../utils/api'

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const response = await authAPI.login(values.username, values.password)
      const token = response.data.access_token
      
      localStorage.setItem('token', token)
      
      const userResponse = await authAPI.getCurrentUser()
      onLogin(userResponse.data, token)
    } catch (error) {
      localStorage.removeItem('token')
      message.error('登录失败，请检查用户名和密码')
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
        className="card-shadow"
        style={{ width: 400 }}
        title={
          <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>
            AI售后知识库更新Agent
          </div>
        }
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
          <p>测试账号：</p>
          <p>• admin / admin123 (业务负责人)</p>
          <p>• operator / operator123 (模型运营)</p>
          <p>• reviewer / reviewer123 (审核人员)</p>
          <p>• frontline / frontline123 (一线使用者)</p>
        </div>
      </Card>
    </div>
  )
}

export default Login
