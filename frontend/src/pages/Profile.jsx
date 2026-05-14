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
  Avatar,
  Typography
} from 'antd'
import { 
  ArrowLeftOutlined,
  UserOutlined
} from '@ant-design/icons'
import request from '../utils/request'
import useUserStore from '../store/user'

const { Title } = Typography

const Profile = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useUserStore()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await request.get('/user/profile')
      form.setFieldsValue({
        nickname: res.data?.nickname || '',
        avatar: res.data?.avatar || ''
      })
    } catch (err) {
      console.error('Load profile error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (values) => {
    setSaving(true)
    try {
      const res = await request.put('/user/profile', {
        nickname: values.nickname
      })
      if (res.data) {
        updateUser({ ...user, ...res.data })
      }
      message.success('保存成功')
    } catch (err) {
      console.error('Save profile error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="个人信息加载失败，请点击重试"
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
        <Title level={3} style={{ marginBottom: 24 }}>个人资料</Title>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Avatar size={100} src={user?.avatar} icon={<UserOutlined />} />
          <div style={{ marginTop: 16, color: '#999' }}>
            手机号: {user?.phone}
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 400, margin: '0 auto' }}
        >
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[
              { required: true, message: '请输入昵称' },
              { max: 20, message: '昵称最多20个字符' }
            ]}
          >
            <Input 
              size="large"
              placeholder="请输入昵称"
              maxLength={20}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              size="large" 
              block 
              htmlType="submit"
              loading={saving}
            >
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Profile
