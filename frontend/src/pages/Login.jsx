import React, { useState } from 'react'
import { Form, Input, Button, Card, Tabs, message, Typography } from 'antd'
import { UserOutlined, LockOutlined, HomeOutlined, ToolOutlined, SafetyOutlined } from '@ant-design/icons'
import { authApi } from '../utils/api'

const { Title, Text } = Typography
const phonePattern = /^1[3-9]\d{9}$/

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false)

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const result = await authApi.login(values)
      message.success('登录成功')
      onLogin(result)
    } catch (error) {
      message.error(error.response?.message || error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    setLoading(true)
    try {
      const result = await authApi.register(values)
      message.success('注册成功')
      onLogin(result)
    } catch (error) {
      message.error(error.response?.message || error.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const loginItems = [
    {
      key: 'owner',
      label: (
        <span>
          <HomeOutlined /> 业主登录
        </span>
      ),
      children: (
        <Form
          name="owner_login"
          onFinish={handleLogin}
          initialValues={{ phone: '13800138001', password: '123456', role: 'owner' }}
          autoComplete="off"
        >
          <Form.Item name="role" hidden >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: phonePattern, message: '请输入正确的手机号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
          <Text type="secondary">测试账号: 13800138001 / 123456</Text>
        </Form>
      )
    },
    {
      key: 'master',
      label: (
        <span>
          <ToolOutlined /> 师傅登录
        </span>
      ),
      children: (
        <Form
          name="master_login"
          onFinish={handleLogin}
          initialValues={{ phone: '13800138002', password: '123456', role: 'master' }}
          autoComplete="off"
        >
          <Form.Item name="role" hidden >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: phonePattern, message: '请输入正确的手机号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
          <Text type="secondary">测试账号: 13800138002 / 123456</Text>
        </Form>
      )
    },
    {
      key: 'admin',
      label: (
        <span>
          <SafetyOutlined /> 管理员
        </span>
      ),
      children: (
        <Form
          name="admin_login"
          onFinish={handleLogin}
          initialValues={{ phone: '13800138000', password: '123456', role: 'admin' }}
          autoComplete="off"
        >
          <Form.Item name="role" hidden >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
          <Text type="secondary">测试账号: 13800138000 / 123456</Text>
        </Form>
      )
    }
  ]

  const registerItems = [
    {
      key: 'owner',
      label: '业主注册',
      children: (
        <Form
          name="owner_register"
          onFinish={handleRegister}
          initialValues={{ role: 'owner' }}
          autoComplete="off"
        >
          <Form.Item name="role" hidden >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="姓名" size="large" />
          </Form.Item>
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: phonePattern, message: '请输入正确的手机号' }]}
          >
            <Input placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'master',
      label: '师傅注册',
      children: (
        <Form
          name="master_register"
          onFinish={handleRegister}
          initialValues={{ role: 'master' }}
          autoComplete="off"
        >
          <Form.Item name="role" hidden >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="姓名" size="large" />
          </Form.Item>
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: phonePattern, message: '请输入正确的手机号' }]}
          >
            <Input placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ]

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 420, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>家居服务众包平台</Title>
          <Text type="secondary">专业师傅，放心服务</Text>
        </div>
        <Tabs
          defaultActiveKey="login"
          centered
          items={[
            { key: 'login', label: '登录', children: <Tabs defaultActiveKey="owner" items={loginItems} /> },
            { key: 'register', label: '注册', children: <Tabs defaultActiveKey="owner" items={registerItems} /> }
          ]}
        />
      </Card>
    </div>
  )
}

export default Login
