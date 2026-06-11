import React, { useState } from 'react'
import { Card, Form, Input, Button, message, Avatar, Typography, Descriptions, Tag, Space, Upload, Divider } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, IdcardOutlined, CheckCircleOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import type { UploadProps } from 'antd'
import type { User } from '@/types'

const { Title, Text } = Typography
const { TextArea } = Input

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { user, updateUserInfo, isLoggedIn } = useUserStore()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [realNameLoading, setRealNameLoading] = useState(false)

  if (!isLoggedIn || !user) {
    navigate('/login')
    return null
  }

  const handleSave = async (values: any) => {
    setLoading(true)
    try {
      const updatedUser: User = {
        ...user,
        name: values.name,
        phone: values.phone,
        email: values.email,
        address: values.address,
        avatar: values.avatar || user.avatar,
        bio: values.bio,
        updatedAt: new Date().toISOString()
      }
      updateUserInfo(updatedUser)
      setEditing(false)
      message.success('个人信息更新成功！')
    } catch (error) {
      message.error('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRealNameAuth = async (values: any) => {
    setRealNameLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const updatedUser: User = {
        ...user,
        realName: values.realName,
        idCard: values.idCard,
        isVerified: true,
        verifiedAt: new Date().toISOString()
      }
      updateUserInfo(updatedUser)
      message.success('实名认证提交成功，等待审核！')
    } catch (error) {
      message.error('提交失败，请重试')
    } finally {
      setRealNameLoading(false)
    }
  }

  const uploadProps: UploadProps = {
    name: 'avatar',
    action: '/api/upload',
    headers: {
      authorization: 'Bearer ' + localStorage.getItem('token')
    },
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('请上传图片文件！')
        return false
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB！')
        return false
      }
      return true
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success('头像上传成功！')
      } else if (info.file.status === 'error') {
        message.error('头像上传失败！')
      }
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative' }}>
            <Avatar 
              size={100} 
              icon={<UserOutlined />} 
              src={user.avatar}
              style={{ backgroundColor: '#1890ff' }}
            />
            <Upload {...uploadProps}>
              <Button 
                size="small" 
                icon={<UploadOutlined />} 
                style={{ 
                  position: 'absolute', 
                  bottom: -8, 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  fontSize: 12
                }}
              >
                更换
              </Button>
            </Upload>
          </div>
          <div style={{ flex: 1 }}>
            <Space style={{ marginBottom: 8 }}>
              <Title level={3} style={{ margin: 0 }}>{user.name}</Title>
              {user.isVerified ? (
                <Tag color="green" icon={<CheckCircleOutlined />}>已实名认证</Tag>
              ) : (
                <Tag color="orange">未实名认证</Tag>
              )}
              <Tag color="blue">{user.role === 'admin' ? '管理员' : '普通用户'}</Tag>
            </Space>
            <div style={{ color: '#666', lineHeight: 2 }}>
              <div><PhoneOutlined style={{ marginRight: 8 }} />{user.phone}</div>
              {user.email && <div><MailOutlined style={{ marginRight: 8 }} />{user.email}</div>}
              {user.address && <div><EnvironmentOutlined style={{ marginRight: 8 }} />{user.address}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">注册时间</Text>
              <div>{user.createdAt?.split('T')[0]}</div>
            </div>
            <div>
              <Text type="secondary">用户ID</Text>
              <div><Text code>{user.id}</Text></div>
            </div>
          </div>
        </div>
      </Card>

      {!user.isVerified && (
        <Card 
          title={
            <Space>
              <IdcardOutlined />
              <span>实名认证</span>
              <Tag color="orange">未完成</Tag>
            </Space>
          } 
          className="card-shadow"
          style={{ marginBottom: 24 }}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            完成实名认证后，您可以享受更多便捷服务，包括电子证照关联、在线办理等。
          </Text>
          <Form
            layout="vertical"
            onFinish={handleRealNameAuth}
            initialValues={{
              realName: user.realName,
              idCard: user.idCard
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                name="realName"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入身份证上的真实姓名" />
              </Form.Item>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号' }
                ]}
              >
                <Input placeholder="请输入18位身份证号" maxLength={18} />
              </Form.Item>
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={realNameLoading}>
                提交实名认证
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Card 
        title={
          <Space>
            <UserOutlined />
            <span>基本信息</span>
            {!editing && (
              <Button type="link" onClick={() => setEditing(true)} style={{ marginLeft: 'auto' }}>
                编辑
              </Button>
            )}
          </Space>
        }
        className="card-shadow"
      >
        {editing ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              name: user.name,
              phone: user.phone,
              email: user.email,
              address: user.address,
              bio: user.bio
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                name="name"
                label="昵称"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input placeholder="请输入昵称" maxLength={20} />
              </Form.Item>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="请输入邮箱（选填）" />
              </Form.Item>
              <Form.Item
                name="address"
                label="居住地址"
              >
                <Input prefix={<EnvironmentOutlined />} placeholder="请输入居住地址（选填）" />
              </Form.Item>
            </div>
            <Form.Item
              name="bio"
              label="个人简介"
            >
              <TextArea rows={3} placeholder="简单介绍一下自己（选填）" maxLength={200} showCount />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>保存修改</Button>
                <Button onClick={() => setEditing(false)}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="昵称">{user.name}</Descriptions.Item>
            <Descriptions.Item label="手机号">{user.phone}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="居住地址">{user.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="个人简介" span={2}>{user.bio || '-'}</Descriptions.Item>
            {user.isVerified && (
              <>
                <Descriptions.Item label="真实姓名">{user.realName}</Descriptions.Item>
                <Descriptions.Item label="身份证号">
                  {user.idCard ? `${user.idCard.slice(0, 6)}********${user.idCard.slice(-4)}` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="认证时间">{user.verifiedAt?.split('T')[0] || '-'}</Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Card>
    </div>
  )
}

export default ProfilePage
