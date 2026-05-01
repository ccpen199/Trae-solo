import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Row,
  Col,
  Alert,
} from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import { userApi } from '../services/api'

const { Title } = Typography

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { token, setToken, setUser } = useUserStore()
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token, navigate])

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    setServerError(null)
    
    try {
      const response = await userApi.login(values.username, values.password)
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || '登录失败')
      }
      
      const responseData = response.data.data
      
      if (!responseData || !responseData.token) {
        throw new Error('登录响应数据格式错误')
      }
      
      setToken(responseData.token)
      if (responseData.user) {
        setUser(responseData.user)
      }
      
      message.success('登录成功')
      navigate('/')
    } catch (error: any) {
      console.error('登录失败:', error)
      
      const errorMessage = error.message || '登录失败'
      
      if (errorMessage.includes('网络错误') || errorMessage.includes('服务是否启动')) {
        setServerError('无法连接到服务器，请确保后端服务已启动')
        message.error('无法连接到服务器')
      } else {
        message.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row
      justify="center"
      align="middle"
      style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <Col xs={22} sm={16} md={12} lg={8}>
        <Card
          style={{
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              会员积分系统
            </Title>
            <Typography.Text type="secondary">
              Membership Points System
            </Typography.Text>
          </div>

          {serverError && (
            <Alert
              message="连接错误"
              description={serverError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
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

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              默认账户：admin / Admin@123
            </Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              会员：member / Member@123
            </Typography.Text>
          </div>
        </Card>
      </Col>
    </Row>
  )
}

export default Login
