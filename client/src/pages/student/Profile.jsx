import React from 'react'
import { Card, message, Form, Input, Button, Avatar } from 'antd'
import { UserOutlined, SaveOutlined } from '@ant-design/icons'
import useAuthStore from '../../store/authStore'
import api from '../../services/api'

function Profile() {
  const { user, updateUser } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)

  const handleUpdate = async (values) => {
    setLoading(true)
    try {
      const res = await api.put('/auth/profile', values)
      updateUser(res.data.user)
      message.success('个人信息更新成功')
    } catch (error) {
      console.error('更新失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>个人中心</h2>
      
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Avatar size={100} icon={<UserOutlined />} src={user?.avatar} />
          <h3 style={{ marginTop: 16, marginBottom: 4 }}>{user?.username}</h3>
          <p style={{ color: '#999', margin: 0 }}>
            角色：{
              user?.role === 'student' ? '学员' :
              user?.role === 'teacher' ? '教师' :
              user?.role === 'ta' ? '助教' : '管理员'
            }
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            username: user?.username,
            email: user?.email,
            phone: user?.phone,
            bio: user?.bio
          }}
          onFinish={handleUpdate}
          style={{ maxWidth: 500, margin: '0 auto' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" disabled />
          </Form.Item>

          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item name="bio" label="个人简介">
            <Input.TextArea rows={3} placeholder="简单介绍一下自己..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Profile
