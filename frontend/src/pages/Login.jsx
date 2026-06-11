import React, { useState } from 'react'
import { Form, Input, Button, Select, Card, message } from 'antd'
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { authAPI } from '../api'

const { Option } = Select

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState('owner1')

  const quickAccounts = [
    { value: 'owner1', label: '车主 - 陈车主', username: 'owner1', desc: '体验车主端功能' },
    { value: 'owner2', label: '车主 - 李车主', username: 'owner2', desc: '体验车主端功能' },
    { value: 'station1', label: '场站管理员 - 张站长', username: 'station1', desc: '体验场站端功能' },
    { value: 'station2', label: '场站管理员 - 李站长', username: 'station2', desc: '体验场站端功能' },
    { value: 'admin', label: '平台管理员', username: 'admin', desc: '体验全部功能' },
    { value: 'grid1', label: '电网公司 - 王工', username: 'grid1', desc: '体验电网端功能' },
    { value: 'pile1', label: '桩企 - 刘经理', username: 'pile1', desc: '体验桩企端功能' },
  ]

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await authAPI.login({
        username: values.username,
        password: values.password,
      })
      message.success('登录成功')
      onLogin(res.data.user, res.data.token)
    } catch (error) {
      message.error(error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (value) => {
    const account = quickAccounts.find(a => a.value === value)
    if (account) {
      setLoginType(value)
      onFinish({ username: account.username, password: '123456' })
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <ThunderboltOutlined style={{ fontSize: 48, color: '#1677ff' }} />
        </div>
        <h1 className="login-title">智慧充电运营平台</h1>
        <p className="login-subtitle">新能源汽车充电基础设施智能运营平台</p>

        <Card size="small" style={{ marginBottom: 24, background: '#f5f7fa' }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>快速登录体验：</div>
          <Select
            style={{ width: '100%' }}
            placeholder="选择体验账号"
            value={loginType}
            onChange={handleQuickLogin}
            loading={loading}
          >
            {quickAccounts.map(acc => (
              <Option key={acc.value} value={acc.value}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{acc.label}</span>
                  <span style={{ color: '#999', fontSize: 12 }}>{acc.desc}</span>
                </div>
              </Option>
            ))}
          </Select>
        </Card>

        <Form
          name="login"
          onFinish={onFinish}
          initialValues={{ username: 'owner1', password: '123456' }}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名/手机号"
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
              style={{ width: '100%', height: 44 }}
              loading={loading}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          默认密码：123456
        </div>
      </div>
    </div>
  )
}

export default Login
