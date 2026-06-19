import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Checkbox,
  message,
  Tabs
} from 'antd'
import { UserOutlined, LockOutlined, WifiOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store'
import { operatorApi } from '@/services/operatorApi'

const { Title, Text } = Typography

function Login() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const onFinish = async (values: { username: string; password: string; remember: boolean }) => {
    setLoading(true)
    try {
      const res: any = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            token: 'mock-operator-token-' + Date.now(),
            user: {
              id: '1',
              username: values.username,
              name: '张运维',
              role: '超级管理员'
            }
          })
        }, 800)
      })
      setToken(res.token)
      setUser(res.user)
      message.success('登录成功')
      navigate('/dashboard', { replace: true })
    } catch (error: any) {
      message.error(error.message || '登录失败')
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
        background: 'linear-gradient(135deg, #001529 0%, #003366 50%, #004d26 100%)',
        padding: 20
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 40
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: '#52c41a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(82,196,26,0.4)'
            }}
          >
            <WifiOutlined style={{ fontSize: 40, color: '#fff' }} />
          </div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>运维管理后台</Title>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
            IoT 智能净水设备运维系统
          </Text>
        </div>

        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            border: 'none'
          }}
          bodyStyle={{ padding: 32 }}
        >
          <Tabs
            defaultActiveKey="account"
            centered
            items={[
              {
                key: 'account',
                label: '账号密码登录'
              }
            ]}
            style={{ marginBottom: 24 }}
          />
          <Form
            form={form}
            name="login"
            size="large"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                placeholder="用户名"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <a style={{ color: '#52c41a' }}>忘记密码？</a>
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{ height: 44, fontSize: 16 }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div
            style={{
              marginTop: 24,
              paddingTop: 24,
              borderTop: '1px dashed #f0f0f0',
              textAlign: 'center'
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              默认账号：admin / 123456
            </Text>
          </div>
        </Card>

        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            color: 'rgba(255,255,255,0.45)',
            fontSize: 12
          }}
        >
          © 2026 IoT 智能净水设备运维平台. All Rights Reserved.
        </div>
      </div>
    </div>
  )
}

export default Login
