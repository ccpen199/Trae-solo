import React, { useState } from 'react'
import { Form, Input, Button, message, Select } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api'

const roleAccounts: Record<string, { username: string; password: string }> = {
  admin: { username: 'admin', password: 'admin123' },
  doctor: { username: 'doctor1', password: 'doctor123' },
  nurse: { username: 'nurse1', password: 'nurse123' },
  reception: { username: 'reception', password: 'reception123' },
  finance: { username: 'finance', password: 'finance123' },
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const handleRoleChange = (role: string) => {
    setSelectedRole(role)
    if (roleAccounts[role]) {
      form.setFieldsValue(roleAccounts[role])
    }
  }

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await authAPI.login(values)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      message.success('登录成功')
      navigate('/')
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">🦷 牙科诊所管理系统</h2>
        <Form form={form} name="login" onFinish={onFinish} size="large">
          <Form.Item name="quickRole" label="快速选择角色">
            <Select placeholder="选择角色快速填充" allowClear onChange={handleRoleChange}>
              <Select.Option value="admin">系统管理员</Select.Option>
              <Select.Option value="doctor">医生</Select.Option>
              <Select.Option value="nurse">护士</Select.Option>
              <Select.Option value="reception">前台</Select.Option>
              <Select.Option value="finance">财务</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', color: '#999', fontSize: '12px' }}>
          <p>默认账号：admin/admin123（管理员）</p>
          <p>doctor1/doctor123（医生）| reception/reception123（前台）</p>
        </div>
      </div>
    </div>
  )
}

export default Login
