import React from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, IdcardOutlined, PhoneOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import useUserStore from '../store/userStore'

function Register() {
  const navigate = useNavigate()
  const { register, loading } = useUserStore()
  const [form] = Form.useForm()

  const handleRegister = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }
    
    try {
      await register(values)
      message.success('注册成功')
      navigate('/')
    } catch (err) {
      // 错误已在拦截器中处理
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🔥</div>
          <div className="login-title">用户注册</div>
          <div className="login-subtitle">燃气智能生活服务平台</div>
        </div>

        <Form
          form={form}
          onFinish={handleRegister}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 4, message: '用户名至少4位' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名（至少4位）" />
          </Form.Item>

          <Form.Item
            name="real_name"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="真实姓名（用于实名档案）" />
          </Form.Item>

          <Form.Item
            name="id_card"
            rules={[
              { required: true, message: '请输入身份证号' },
              { pattern: /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的18位身份证号' }
            ]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="18位身份证号" />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="11位手机号" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱（选填）" />
          </Form.Item>

          <Form.Item
            name="address"
          >
            <Input prefix={<HomeOutlined />} placeholder="居住地址（选填）" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码（至少6位）" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} size="large">
              注 册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            已有账号？<Link to="/login">立即登录</Link>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default Register
