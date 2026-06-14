import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined, SafetyOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { APP_TITLE } from '@/utils/constants'

interface RegisterForm {
  phone: string
  password: string
  confirmPassword: string
  name: string
}

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: RegisterForm) => {
    setLoading(true)
    try {
      const result = await register({
        phone: values.phone,
        password: values.password,
        name: values.name,
      })
      if (result.success) {
        message.success('注册成功，请登录')
        navigate('/login')
      } else {
        message.error(result.message || '注册失败，请稍后重试')
      }
    } catch (error) {
      console.error('Register error:', error)
      message.error('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1677ff] to-[#52c41a] py-8">
      <Card className="w-full max-w-md shadow-xl rounded-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#1677ff] to-[#52c41a] flex items-center justify-center mx-auto mb-4">
            <SafetyOutlined className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{APP_TITLE}</h1>
          <p className="text-gray-500">创建新账户</p>
        </div>
        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="name"
            rules={[
              { required: true, message: '请输入姓名' },
              { min: 2, message: '姓名至少2个字符' },
              { max: 20, message: '姓名最多20个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入姓名"
            />
          </Form.Item>
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="text-gray-400" />}
              placeholder="请输入手机号"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
              { max: 20, message: '密码最多20个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请输入密码（6-20个字符）"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请再次输入密码"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-12 text-base font-semibold"
              loading={loading}
            >
              注册
            </Button>
          </Form.Item>
          <div className="text-center">
            <span className="text-gray-500">已有账户？</span>
            <Link to="/login" className="text-[#1677ff] hover:text-[#4096ff] ml-1">
              立即登录
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Register
