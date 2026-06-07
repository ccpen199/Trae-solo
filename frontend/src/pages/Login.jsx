import React, { useState } from 'react'
import { Form, Input, Button, Tabs, message, Alert } from 'antd'
import { UserOutlined, LockOutlined, FireOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import useUserStore from '../store/userStore'

function Login() {
  const navigate = useNavigate()
  const { login, loading } = useUserStore()
  const [form] = Form.useForm()
  const [loginType, setLoginType] = useState('account')

  const handleLogin = async (values) => {
    try {
      await login(values.username, values.password)
      message.success('登录成功')
      navigate('/')
    } catch (err) {
      // 错误已在拦截器中处理
    }
  }

  const demoAccounts = [
    { role: '系统管理员', username: 'admin', password: '123456' },
    { role: '运营人员', username: 'operator1', password: '123456' },
    { role: '网格员', username: 'grid1', password: '123456' },
    { role: '普通用户', username: 'user1', password: '123456' }
  ]

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🔥</div>
          <div className="login-title">燃气智能生活服务平台</div>
          <div className="login-subtitle">以用户实名档案为基座，构建智慧燃气生态</div>
        </div>

        <Tabs
          activeKey={loginType}
          onChange={setLoginType}
          centered
          items={[
            { key: 'account', label: '账号密码登录' }
          ]}
        />

        {loginType === 'account' && (
          <Form
            form={form}
            onFinish={handleLogin}
            size="large"
            initialValues={{ username: 'user1', password: '123456' }}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" autoComplete="username" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" autoComplete="current-password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} size="large">
                登 录
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              还没有账号？<Link to="/register">立即注册</Link>
            </div>
          </Form>
        )}

        <div style={{ marginTop: 24 }}>
          <Alert
            type="info"
            showIcon
            message="演示账号"
            description={
              <div style={{ fontSize: 12 }}>
                {demoAccounts.map((acc, idx) => (
                  <div key={idx} style={{ marginBottom: 4 }}>
                    <strong>{acc.role}:</strong> {acc.username} / {acc.password}
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </div>
    </div>
  )
}

export default Login
