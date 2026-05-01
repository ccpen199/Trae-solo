import React, { useEffect, useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Spin,
  Descriptions,
  Divider,
  Modal,
} from 'antd'
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { useUserStore, UserInfo } from '../stores/userStore'
import { userApi } from '../services/api'

const { Title } = Typography

interface ProfileFormValues {
  name: string
  phone: string
  email: string
}

interface PasswordFormValues {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const Profile: React.FC = () => {
  const { user, setUser, token } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [profileForm] = Form.useForm<ProfileFormValues>()
  const [passwordForm] = Form.useForm<PasswordFormValues>()
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      })
    }
  }, [user, profileForm])

  const handleUpdateProfile = async (values: ProfileFormValues) => {
    setLoading(true)
    try {
      const response = await userApi.updateProfile({
        name: values.name,
        phone: values.phone,
        email: values.email,
      })

      const updatedUser = {
        ...user!,
        name: values.name,
        phone: values.phone,
        email: values.email,
      }
      setUser(updatedUser as UserInfo)
      message.success('个人信息更新成功')
    } catch (error: any) {
      message.error(error.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (values: PasswordFormValues) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      await userApi.changePassword(values.oldPassword, values.newPassword)
      message.success('密码修改成功')
      setPasswordModalVisible(false)
      passwordForm.resetFields()
    } catch (error: any) {
      message.error(error.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      member: '会员',
      employee: '店员',
      manager: '运营经理',
      finance: '财务审计',
      admin: '系统管理员',
    }
    return roleMap[role] || role
  }

  return (
    <Spin spinning={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>
        个人信息
      </Title>

      <Card title="基本信息">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="用户名">
            {user?.username}
          </Descriptions.Item>
          <Descriptions.Item label="角色">
            {getRoleName(user?.role || '')}
          </Descriptions.Item>
          <Descriptions.Item label="姓名">
            {user?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="手机号">
            {user?.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱" span={2}>
            {user?.email || '-'}
          </Descriptions.Item>
        </Descriptions>

        {user?.memberInfo && (
          <>
            <Divider />
            <Descriptions title="会员信息" bordered column={2}>
              <Descriptions.Item label="会员编号">
                {user.memberInfo.memberNo}
              </Descriptions.Item>
              <Descriptions.Item label="会员等级">
                Lv.{user.memberInfo.level}
              </Descriptions.Item>
              <Descriptions.Item label="累计消费">
                ¥{user.memberInfo.totalConsumption}
              </Descriptions.Item>
              <Descriptions.Item label="累计获得积分">
                {user.memberInfo.totalPointsEarned}
              </Descriptions.Item>
              <Descriptions.Item label="累计消费积分">
                {user.memberInfo.totalPointsSpent}
              </Descriptions.Item>
              <Descriptions.Item label="累计过期积分">
                {user.memberInfo.totalPointsExpired}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      <Card title="编辑信息" style={{ marginTop: 24 }}>
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            name="name"
            label="姓名"
          >
            <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
            >
              保存修改
            </Button>
            <Button
              style={{ marginLeft: 16 }}
              icon={<LockOutlined />}
              onClick={() => setPasswordModalVisible(true)}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少6位）" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: '请确认新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button
              onClick={() => setPasswordModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  )
}

export default Profile
