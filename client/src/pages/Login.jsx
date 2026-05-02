import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Select } from 'antd'
import { UserOutlined, LockOutlined, BookOutlined, UserSwitchOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import '../index.css'

const { Option } = Select

const roleConfig = {
  student: {
    icon: <BookOutlined />,
    name: '学员',
    desc: '学习课程、完成作业'
  },
  teacher: {
    icon: <UserSwitchOutlined />,
    name: '老师',
    desc: '发布课程、批改作业'
  },
  ta: {
    icon: <TeamOutlined />,
    name: '助教',
    desc: '协助批改、答疑解惑'
  },
  admin: {
    icon: <SettingOutlined />,
    name: '运营/管理员',
    desc: '平台管理、数据统计'
  }
}

function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('student')
  const [form] = Form.useForm()

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    switch (role) {
      case 'student':
        form.setFieldsValue({ email: 'student@learning.com', password: 'student123456' })
        break
      case 'teacher':
        form.setFieldsValue({ email: 'teacher@learning.com', password: 'teacher123456' })
        break
      case 'ta':
        form.setFieldsValue({ email: 'ta@learning.com', password: 'ta123456' })
        break
      case 'admin':
        form.setFieldsValue({ email: 'admin@learning.com', password: 'admin123456' })
        break
    }
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/login', values)
      const { token, user } = response.data
      
      login(token, user)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <h1>在线课程学习平台</h1>
          <p>请选择角色登录</p>
        </div>

        <div className="role-selector">
          {Object.entries(roleConfig).map(([key, config]) => (
            <div
              key={key}
              className={`role-card ${selectedRole === key ? 'active' : ''}`}
              onClick={() => handleRoleSelect(key)}
            >
              <div className="role-icon">{config.icon}</div>
              <div className="role-name">{config.name}</div>
              <div className="role-desc">{config.desc}</div>
            </div>
          ))}
        </div>

        <Form
          form={form}
          name="login"
          initialValues={{
            email: 'student@learning.com',
            password: 'student123456'
          }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          <p>提示：选择角色后会自动填充测试账号密码</p>
          <p>请确保后端服务已启动并执行了数据种子</p>
        </div>
      </Card>
    </div>
  )
}

export default Login
