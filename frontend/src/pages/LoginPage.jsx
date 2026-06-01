import React, { useEffect } from 'react'
import { Form, Input, Button, Card, Radio, Typography, message } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined, RocketOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'

const { Title, Text } = Typography

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const role = Form.useWatch('role', form) || 'operator'

  useEffect(() => {
    form.setFieldsValue({
      username: role === 'operator' ? 'operator' : 'approver',
      password: '123456'
    })
  }, [role, form])

  const handleLogin = async (values) => {
    try {
      const res = await api.post('/auth/login', values)
      if (res && res.success) {
        const userInfo = { ...res.user, role: values.role }
        localStorage.setItem('push_platform_user', JSON.stringify(userInfo))
        onLogin(userInfo)
        message.success(`欢迎，${userInfo.name}！`)
        navigate(values.role === 'operator' ? '/tasks' : '/approvals')
      } else {
        message.error('登录失败，请检查账号密码')
      }
    } catch (e) {
      message.error(e.response?.data?.message || e.message || '登录失败')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <Card style={{ width: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📨</div>
          <Title level={3} style={{ marginBottom: 4 }}>消息推送运营平台</Title>
          <Text type="secondary">站内信 · 浏览器通知 · 运营弹窗</Text>
        </div>

        <Form form={form} onFinish={handleLogin} initialValues={{ role: 'operator', username: 'operator', password: '123456' }}>
          <Form.Item name="role" style={{ marginBottom: 24 }}>
            <Radio.Group style={{ width: '100%', display: 'flex' }}>
              <Radio.Button value="operator" style={{ flex: 1, textAlign: 'center', height: 60, paddingTop: 18 }}>
                <RocketOutlined style={{ fontSize: 20, display: 'block', marginBottom: 4 }} />
                运营账号
              </Radio.Button>
              <Radio.Button value="approver" style={{ flex: 1, textAlign: 'center', height: 60, paddingTop: 18 }}>
                <SafetyOutlined style={{ fontSize: 20, display: 'block', marginBottom: 4 }} />
                审批账号
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} size="large" placeholder="账号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} size="large" placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={form.isSubmitting} block>
              {role === 'operator' ? '登录运营系统' : '登录审批系统'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6, fontSize: 12 }}>
          <Text type="secondary">
            <strong>测试账号：</strong><br />
            运营：operator / 123456<br />
            审批：approver / 123456
          </Text>
        </div>
      </Card>
    </div>
  )
}