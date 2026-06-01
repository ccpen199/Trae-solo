import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../store'
import * as authApi from '../api/auth'
import type { LoginRequest } from '../types'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAppStore((s) => s.token)
  const setToken = useAppStore((s) => s.setToken)
  const setUser = useAppStore((s) => s.setUser)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true })
    }
  }, [token, from, navigate])

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await authApi.login(values)
      if (!res?.token) {
        throw new Error('服务器响应异常，未返回 token')
      }
      setToken(res.token)
      setUser(res.user)
      message.success('登录成功，正在跳转...')
    } catch (err) {
      const msg = (err as Error).message || '用户名或密码错误'
      setErrorMsg(msg)
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Typography.Title level={3} style={{ marginBottom: 8 }}>
            K8s 治理平台
          </Typography.Title>
          <Typography.Text type="secondary">请登录以继续</Typography.Text>
        </div>
        <Form onFinish={handleSubmit} layout="vertical" size="large">
          {errorMsg && (
            <Alert
              message="登录失败"
              description={errorMsg}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
            initialValue="admin"
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoFocus />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
            initialValue="admin123"
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            演示账号：admin / admin123（管理员）、operator / op123（运维）、viewer / view123（只读）
          </Typography.Text>
        </Form>
      </Card>
    </div>
  )
}
