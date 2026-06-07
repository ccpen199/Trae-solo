import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Alert, Divider, Tag, Spin } from 'antd'
import {
  UserOutlined, LockOutlined, CarOutlined, SafetyOutlined,
  TeamOutlined, SettingOutlined, InfoCircleOutlined
} from '@ant-design/icons'
import request from '../utils/request'

const demoAccounts = [
  { username: 'admin', password: 'admin123', role: '系统管理员', icon: <SafetyOutlined />, color: 'red' },
  { username: 'platform', password: 'platform123', role: '运营平台', icon: <SettingOutlined />, color: 'blue' },
  { username: 'ops', password: 'ops123', role: '运维操作员', icon: <SettingOutlined />, color: 'purple' },
  { username: 'zhangsan', password: '123456', role: '车主', icon: <UserOutlined />, color: 'green' },
  { username: 'wangwu', password: '123456', role: '车队管理者', icon: <TeamOutlined />, color: 'orange' },
]

const errorMap = {
  'ACCOUNT_NOT_FOUND': '该账号不存在，请检查用户名或联系管理员开通',
  'PASSWORD_INCORRECT': '密码错误，请重新输入（演示账号密码见下方标签）',
  'ACCOUNT_DISABLED': '该账号已被停用，请联系管理员',
  'INVALID_CREDENTIALS': '用户名或密码错误',
  'MISSING_FIELDS': '请输入完整的用户名和密码',
}

const roleLabels = {
  admin: '系统管理员', platform: '运营平台', operator: '运维操作员',
  owner: '车主', fleet_admin: '车队管理者',
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    localStorage.removeItem('etc_token')
    localStorage.removeItem('token')
    localStorage.removeItem('etc_user')
  }, [])

  const handleLoginSuccess = (data, username) => {
    try {
      localStorage.setItem('etc_token', data.token)
      localStorage.setItem('token', data.token)
      localStorage.setItem('etc_user', JSON.stringify(data.user))
      const roleLabel = roleLabels[data.user.role] || data.user.role
      message.success(`登录成功，欢迎 ${data.user.real_name}（${roleLabel}）`, 1.5)
      setTimeout(() => {
        window.location.href = '/'
      }, 300)
    } catch (err) {
      console.error('Login success handler error:', err)
      message.error('登录后处理失败，请重试')
      setLoading(false)
    }
  }

  const handleLoginError = (err, username) => {
    let errorMsg = '登录失败，请重试'
    let errorCode = null

    if (err.response) {
      const resp = err.response.data || {}
      errorCode = resp.code

      if (resp.code && errorMap[resp.code]) {
        errorMsg = errorMap[resp.code]
      } else if (resp.error) {
        errorMsg = resp.error
      } else if (err.response.status === 500) {
        errorMsg = '服务器内部错误，请稍后重试'
      } else if (err.response.status === 403) {
        errorMsg = resp.error || '账号无权限访问，请联系管理员'
      } else if (err.response.status === 401) {
        errorMsg = resp.error || '身份验证失败，请检查账号密码'
      }
    } else if (err.request) {
      errorMsg = '无法连接到服务器，请检查网络连接'
    } else if (err.message) {
      errorMsg = err.message
    }

    setLoginError({
      message: errorMsg,
      username,
      code: errorCode,
      timestamp: new Date().toLocaleString('zh-CN'),
    })
    message.error(errorMsg)
  }

  const onFinish = async (values) => {
    const username = values.username?.trim()
    const password = values.password
    if (!username || !password) {
      message.error('请输入用户名和密码')
      return
    }

    setLoading(true)
    setLoginError(null)

    try {
      const response = await request.post('/auth/login', { username, password })
      handleLoginSuccess(response.data, username)
    } catch (err) {
      console.error('Login request error:', err)
      handleLoginError(err, username)
    } finally {
      setTimeout(() => setLoading(false), 300)
    }
  }

  const fillAccount = async (account) => {
    form.setFieldsValue({ username: account.username, password: account.password })
    await onFinish({ username: account.username, password: account.password })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 50%, #1a3a5c 100%)',
    }}>
      <Card
        style={{
          width: 460,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
        styles={{ body: { padding: '36px 36px 28px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #1a3a5c, #2d6a9f)',
            marginBottom: 16,
          }}>
            <CarOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a3a5c', marginBottom: 4 }}>
            省级ETC管理控制台
          </h1>
          <p style={{ color: '#999', fontSize: 14 }}>全生命周期管理平台</p>
        </div>

        {loginError && (
          <Alert
            message={
              <div>
                <div><strong>登录失败：</strong>{loginError.message}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  账号：{loginError.username} · 时间：{loginError.timestamp}
                  {loginError.code && ` · 错误码：${loginError.code}`}
                </div>
              </div>
            }
            type="error"
            showIcon
            closable
            onClose={() => setLoginError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Spin spinning={loading} tip="登录中...">
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            disabled={loading}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                id="login_username"
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                id="login_password"
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 44,
                  fontSize: 16,
                  background: 'linear-gradient(135deg, #1a3a5c, #2d6a9f)',
                  border: 'none',
                }}
              >
                登录进入
              </Button>
            </Form.Item>
          </Form>
        </Spin>

        <Divider style={{ margin: '20px 0 16px', color: '#ccc', fontSize: 12 }}>
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          演示账号（点击自动填入并登录）
        </Divider>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {demoAccounts.map((acc) => (
            <Tag
              key={acc.username}
              color={acc.color}
              style={{
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: '4px 10px',
                fontSize: 12,
                borderRadius: 4,
                opacity: loading ? 0.5 : 1,
              }}
              onClick={() => !loading && fillAccount(acc)}
            >
              {acc.icon} {acc.username} · {acc.role}
            </Tag>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 12, color: '#8c8c8c', fontSize: 12, fontFamily: 'monospace' }}>
          admin:admin123 / platform:platform123 / ops:ops123 / zhangsan:123456 / wangwu:123456
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, color: '#bfbfbf', fontSize: 12 }}>
          登录失败将自动记录审计日志 · ETC Lifecycle Console v1.0
        </div>
      </Card>
    </div>
  )
}
