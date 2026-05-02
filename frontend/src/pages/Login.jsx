import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons'
import { authApi } from '../services/api'
import { useAuthStore } from '../store'

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await authApi.login(values)
      if (res.data.success) {
        const { token, user } = res.data
        setAuth(user, token, user.permissions || [])
        message.success('登录成功')
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
      message.error(err.response?.data?.error || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <GlobalOutlined style={{ fontSize: 48, color: '#667eea' }} />
        </div>
        <h1 className="login-title">跨境支付结算系统</h1>
        <p className="login-subtitle">Cross-border Payment Settlement System</p>
        
        <Form
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
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 500, color: '#666' }}>测试账号：</div>
          <div>系统管理员: admin / admin123</div>
          <div>商户操作员: merchant / merchant123</div>
          <div>合规审核员: compliance / compliance123</div>
          <div>财务人员: finance / finance123</div>
        </div>
      </div>
    </div>
  )
}

export default Login
