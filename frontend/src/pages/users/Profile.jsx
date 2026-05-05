import React, { useState } from 'react'
import { Card, Form, Input, Button, Tabs, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import useAuthStore from '../../store/authStore'
import { userApi } from '../../services/api'

const Profile = () => {
  const { user, updateUser } = useAuthStore()
  const [infoLoading, setInfoLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [infoForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const handleInfoSubmit = async (values) => {
    setInfoLoading(true)
    try {
      const result = await userApi.updateProfile(values)
      if (result.success) {
        message.success('个人信息更新成功')
        updateUser(result.data)
      }
    } catch (error) {
      console.error('Update profile failed:', error)
    } finally {
      setInfoLoading(false)
    }
  }

  const handlePasswordSubmit = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的密码不一致')
      return
    }
    setPasswordLoading(true)
    try {
      await userApi.changePassword(values.old_password, values.new_password)
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      console.error('Change password failed:', error)
    } finally {
      setPasswordLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          个人信息
        </span>
      ),
      children: (
        <Card style={{ maxWidth: 600 }}>
          <Form
            form={infoForm}
            layout="vertical"
            onFinish={handleInfoSubmit}
            initialValues={{
              username: user?.username,
              real_name: user?.real_name,
              email: user?.email,
              phone: user?.phone
            }}
          >
            <Form.Item label="用户名" name="username">
              <Input disabled placeholder="用户名不可修改" />
            </Form.Item>
            <Form.Item
              label="真实姓名"
              name="real_name"
              rules={[{ required: true, message: '请输入真实姓名' }]}
            >
              <Input placeholder="请输入真实姓名" />
            </Form.Item>
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item
              label="手机号"
              name="phone"
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={infoLoading}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'password',
      label: (
        <span>
          <LockOutlined style={{ marginRight: 8 }} />
          修改密码
        </span>
      ),
      children: (
        <Card style={{ maxWidth: 600 }}>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
          >
            <Form.Item
              label="原密码"
              name="old_password"
              rules={[{ required: true, message: '请输入原密码' }]}
            >
              <Input.Password placeholder="请输入原密码" />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="new_password"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度至少6位' }
              ]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirm_password"
              rules={[{ required: true, message: '请确认新密码' }]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={passwordLoading}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">个人资料</div>
        <div className="page-description">查看和修改个人信息</div>
      </div>

      <Tabs defaultActiveKey="info" items={tabItems} />
    </div>
  )
}

export default Profile