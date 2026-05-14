import { useState } from 'react'
import { Card, Form, Input, Button, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import request from '../../utils/request'
import useUserStore from '../../store/user'

const { Title, Text } = Typography

const AdminLogin = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { adminLogin } = useUserStore()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await request.post('/auth/admin/login', values)
      adminLogin(res.data.admin, res.data.token)
      message.success('登录成功')
      navigate('/admin')
    } catch (error) {
      console.error('Admin login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5'
    }}>
      <div style={{ width: 400, maxWidth: '90vw' }}>
        <Card style={{ borderRadius: 12 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛠️</div>
            <Title level={3} style={{ margin: 0, color: '#333' }}>管理后台</Title>
            <Text type="secondary">家电租借平台</Text>
          </div>

          <Form
            name="adminLogin"
            onFinish={onFinish}
            initialValues={{ username: 'admin', password: '123456' }}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入用户名"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                默认账号: admin / 123456
              </Text>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default AdminLogin
