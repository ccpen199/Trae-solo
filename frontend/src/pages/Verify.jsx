import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Spin, 
  Result,
  message,
  Typography,
  Alert
} from 'antd'
import { 
  ArrowLeftOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import request from '../utils/request'
import { validateIdCard } from '../utils/idCard'
import useUserStore from '../store/user'

const { Title, Text } = Typography

const Verify = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useUserStore()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await request.get('/user/profile')
      setIsVerified(res.data?.is_verified === 1)
    } catch (err) {
      console.error('Load verify error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const res = await request.post('/user/verify', {
        real_name: values.real_name,
        id_card: values.id_card
      })
      if (res.data) {
        updateUser({ ...user, ...res.data })
      }
      message.success('实名认证成功')
      setIsVerified(true)
    } catch (err) {
      console.error('Verify error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="数据加载失败，请点击重试"
        extra={
          <Button type="primary" onClick={loadData}>
            重新加载
          </Button>
        }
      />
    )
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        style={{ marginBottom: 16 }}
        onClick={() => navigate('/settings')}
      >
        返回
      </Button>

      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>
          <SafetyOutlined style={{ marginRight: 8 }} />
          实名认证
        </Title>

        {isVerified ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <Title level={4} style={{ color: '#52c41a' }}>已完成实名认证</Title>
            <Text type="secondary">您已通过实名认证，可以正常使用所有功能</Text>
          </div>
        ) : (
          <div>
            <Alert
              message="实名认证是进行租借、退租、转租等操作的必要条件"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ maxWidth: 400, margin: '0 auto' }}
            >
              <Form.Item
                name="real_name"
                label="真实姓名"
                rules={[
                  { required: true, message: '请输入真实姓名' },
                  { min: 2, max: 10, message: '姓名长度应在2-10个字符之间' }
                ]}
              >
                <Input 
                  size="large"
                  placeholder="请输入真实姓名"
                  maxLength={10}
                />
              </Form.Item>

              <Form.Item
                name="id_card"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.resolve()
                      }
                      const validation = validateIdCard(value)
                      if (!validation.valid) {
                        return Promise.reject(new Error(validation.message))
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Input 
                  size="large"
                  placeholder="请输入18位身份证号"
                  maxLength={18}
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  htmlType="submit"
                  loading={submitting}
                >
                  提交认证
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  您的个人信息将严格保密，仅用于身份验证
                </Text>
              </div>
            </Form>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Verify
