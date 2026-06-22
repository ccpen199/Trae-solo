import { useState } from 'react'
import { Form, Input, Button, Tabs, Typography, message, Card, Alert } from 'antd'
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import authApi from '../api/auth'
import { tokenUtils } from '../utils/request'
import { useAuth } from '../App'
import type { UserRole } from '../types'
import type { TabsProps } from 'antd'

const { Title, Text } = Typography

function Login() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [activeRole, setActiveRole] = useState<UserRole>('worker')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const performLogin = async (phone: string, password: string, role: UserRole) => {
    setLoading(true)
    setSubmitError(null)
    try {
      const res = await authApi.login({
        phone,
        password,
        role,
      })
      if (res.code === 0 && res.data) {
        tokenUtils.setToken(res.data.token)
        tokenUtils.setUserInfo(res.data.user)
        if (res.data.worker) {
          tokenUtils.setWorkerInfo(res.data.worker)
        }
        if (res.data.enterprise) {
          tokenUtils.setEnterpriseInfo(res.data.enterprise)
        }
        message.success(`欢迎回来，${res.data.user.real_name || phone}`)
        await refreshUser()
        const role = res.data.user.role
        setTimeout(() => {
          navigate(
            role === 'worker'
              ? '/worker/dashboard'
              : role === 'enterprise'
              ? '/enterprise/dashboard'
              : '/admin/dashboard',
            { replace: true }
          )
        }, 100)
      } else {
        const errMsg = res.message || '登录失败，请检查账号密码'
        setSubmitError(errMsg)
        message.error(errMsg)
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || '网络异常，请稍后重试'
      setSubmitError(errMsg)
      message.error(errMsg, 3)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (values: { phone: string; password: string }) => {
    await performLogin(values.phone, values.password, activeRole)
  }

  const handleDemoLogin = async (role: UserRole) => {
    const demos: Record<UserRole, { phone: string; password: string }> = {
      worker: { phone: '13900000001', password: 'worker123' },
      enterprise: { phone: '13900000002', password: 'company123' },
      admin: { phone: '13800000000', password: 'admin123' },
    }
    setActiveRole(role)
    form.setFieldsValue(demos[role])
    await performLogin(demos[role].phone, demos[role].password, role)
  }

  const tabItems: TabsProps['items'] = [
    {
      key: 'worker',
      label: (
        <span>
          <UserOutlined /> 工人登录
        </span>
      ),
    },
    {
      key: 'enterprise',
      label: (
        <span>
          <SafetyCertificateOutlined /> 企业登录
        </span>
      ),
    },
    {
      key: 'admin',
      label: (
        <span>
          <SafetyCertificateOutlined /> 管理员
        </span>
      ),
    },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 16px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: '#fff',
            }}
          >
            匠
          </div>
          <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
            匠信工易
          </Title>
          <Text type="secondary">可信用工 · 匠级保障</Text>
        </div>

        <Tabs
          activeKey={activeRole}
          onChange={(key) => {
            setActiveRole(key as UserRole)
            setSubmitError(null)
          }}
          items={tabItems}
          centered
          style={{ marginBottom: 24 }}
        />

        {submitError && (
          <Alert
            type="error"
            message={submitError}
            showIcon
            closable
            onClose={() => setSubmitError(null)}
            style={{ marginBottom: 20 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleLogin} size="large">
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入手机号" maxLength={11} />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44 }}>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              还没有账号？<Link to="/register">立即注册</Link>
            </Text>
          </div>
        </Form>

        <div style={{ marginTop: 20 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 10 }}>
            演示账号快速进入
          </Text>
          <div style={{ display: 'grid', gap: 8 }}>
            <Button onClick={() => void handleDemoLogin('worker')} disabled={loading}>
              一键进入工人演示
            </Button>
            <Button onClick={() => void handleDemoLogin('enterprise')} disabled={loading}>
              一键进入企业演示
            </Button>
            <Button onClick={() => void handleDemoLogin('admin')} disabled={loading}>
              一键进入管理员演示
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Login
