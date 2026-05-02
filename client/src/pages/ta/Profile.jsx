import React, { useState } from 'react'
import { Card, Avatar, Form, Input, Button, Row, Col, Descriptions, Divider, message, Upload } from 'antd'
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  UploadOutlined
} from '@ant-design/icons'
import useAuthStore from '../../store/authStore'

function Profile() {
  const { user } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()

  const handleSave = async (values) => {
    try {
      message.success('个人信息更新成功！')
      setEditing(false)
    } catch (error) {
      console.error('更新失败:', error)
    }
  }

  const dummyRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess('ok')
    }, 0)
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>个人中心</h2>
        {!editing && (
          <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
            编辑资料
          </Button>
        )}
      </div>

      <Row gutter={[24, 16]}>
        <Col xs={24} lg={8}>
          <Card style={{ textAlign: 'center' }}>
            <Upload
              name="avatar"
              showUploadList={false}
              customRequest={dummyRequest}
              accept="image/*"
            >
              <Avatar size={120} icon={<UserOutlined />} src={user?.avatar} style={{ cursor: 'pointer' }} />
            </Upload>
            <h3 style={{ marginTop: 16, marginBottom: 8 }}>{user?.username}</h3>
            <p style={{ color: '#666', margin: 0 }}>
              {user?.role === 'ta' ? '助教' : user?.role}
            </p>
            <Divider />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="邮箱">{user?.email || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="手机">{user?.phone || '未设置'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="基本信息">
            {editing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  username: user?.username,
                  email: user?.email,
                  phone: user?.phone,
                  bio: '负责协助教师批改作业、回复学员疑问，提升学习体验。'
                }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="username"
                      label="用户名"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input placeholder="请输入用户名" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="email"
                      label="邮箱"
                      rules={[
                        { type: 'email', message: '请输入有效的邮箱地址' }
                      ]}
                    >
                      <Input placeholder="请输入邮箱" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="phone"
                      label="手机号码"
                    >
                      <Input placeholder="请输入手机号码" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="bio"
                  label="个人简介"
                >
                  <Input.TextArea rows={4} placeholder="请输入个人简介" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button onClick={() => setEditing(false)} style={{ marginRight: 8 }}>
                    取消
                  </Button>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    保存
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Descriptions column={2}>
                <Descriptions.Item label="用户名">{user?.username || '未设置'}</Descriptions.Item>
                <Descriptions.Item label="角色">
                  {user?.role === 'ta' ? '助教' : user?.role}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">{user?.email || '未设置'}</Descriptions.Item>
                <Descriptions.Item label="手机">{user?.phone || '未设置'}</Descriptions.Item>
                <Descriptions.Item label="个人简介" span={2}>
                  负责协助教师批改作业、回复学员疑问，提升学习体验。
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>

          <Card title="工作数据" style={{ marginTop: 24 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card className="stat-card blue" size="small">
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>48</div>
                  <div style={{ fontSize: 12, color: '#666' }}>已批改作业</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="stat-card green" size="small">
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>32</div>
                  <div style={{ fontSize: 12, color: '#666' }}>已回复问题</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="stat-card orange" size="small">
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>98%</div>
                  <div style={{ fontSize: 12, color: '#666' }}>满意度</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="stat-card purple" size="small">
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#722ed1' }}>12</div>
                  <div style={{ fontSize: 12, color: '#666' }}>服务天数</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Profile
