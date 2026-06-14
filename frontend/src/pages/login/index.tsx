import { useState } from 'react'
import { Form, Input, Button, Card, message, Checkbox } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { APP_TITLE } from '@/utils/constants'

interface LoginForm {
  phone: string
  password: string
  remember?: boolean
}

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true)
    try {
      const result = await login({
        phone: values.phone,
        password: values.password,
      })
      if (result.success) {
        message.success('登录成功')
        navigate('/')
      } else {
        message.error(result.message || '登录失败，请检查手机号和密码')
      }
    } catch (error) {
      console.error('Login error:', error)
      message.error('登录失败，请稍后重试')
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
          <p className="text-gray-500">欢迎回来，请登录您的账户</p>
        </div>
        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入手机号"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请输入密码"
            />
          </Form.Item>
          <Form.Item>
            <div className="flex justify-between items-center">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <a className="text-[#1677ff]">忘记密码？</a>
            </div>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-12 text-base font-semibold"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
          <div className="text-center">
            <span className="text-gray-500">还没有账户？</span>
            <Link to="/register" className="text-[#1677ff] hover:text-[#4096ff] ml-1">
              立即注册
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login
