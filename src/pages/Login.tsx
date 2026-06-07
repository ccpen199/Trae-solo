import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Alert, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { login } from '@/api/modules/auth'
import { useAuth } from '@/store/auth'

export default function Login() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onFinish = async (values: { idCard: string; password: string; remember: boolean }) => {
    setLoading(true)
    setError('')

    try {
      const response = await login({
        username: values.idCard,
        password: values.password,
      })
      auth.login(response)
      message.success('登录成功，正在跳转...')
      setTimeout(() => {
        navigate('/')
      }, 500)
    } catch (err: any) {
      setError(err.message || '身份证号或密码错误，请重试')
      message.error(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">交管服务平台</h1>
          <p className="text-gray-500">北京市公安局交通管理局</p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className="mb-6"
          />
        )}

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="idCard"
            rules={[
              { required: true, message: '请输入身份证号' },
              { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入有效的身份证号' }
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入身份证号"
              maxLength={18}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
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
              <a className="text-[#0052D9]" href="#">忘记密码？</a>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ height: '44px', fontSize: '16px' }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-2">
            <InfoCircleOutlined className="text-[#0052D9] mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 font-medium mb-1">测试账号</p>
              <p className="text-xs text-gray-500">身份证：110101199001011234</p>
              <p className="text-xs text-gray-500">密码：123456</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            还没有账号？<a className="text-[#0052D9]" href="#">立即注册</a>
          </p>
        </div>
      </div>
    </div>
  )
}
