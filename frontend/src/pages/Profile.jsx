import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message, Avatar, Row, Col, Statistic } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, SafetyOutlined } from '@ant-design/icons'
import api from '../utils/api'

const Profile = () => {
  const [user, setUser] = useState(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const riskLevelNames = { 1: '保守型', 2: '稳健型', 3: '进取型' }
  const riskLevelColors = { 1: '#52c41a', 2: '#faad14', 3: '#ff4d4f' }

  useEffect(() => {
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const data = await api.get('/auth/profile')
      setUser(data)
      form.setFieldsValue(data)
    } catch (error) {
      message.error('获取用户信息失败')
    }
  }

  const handleUpdate = async (values) => {
    setLoading(true)
    try {
      await api.put('/auth/profile', values)
      message.success('更新成功')
      fetchUserInfo()
    } catch (error) {
      message.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="个人信息">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} icon={<UserOutlined />} style={{ marginBottom: 12 }} />
              <h3 style={{ margin: 0 }}>{user?.real_name || user?.username}</h3>
              <p style={{ color: '#999', margin: '4px 0 0 0' }}>@{user?.username}</p>
            </div>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="积分余额" value={user?.points || 0} valueStyle={{ color: '#fa8c16' }} />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="风险等级" 
                  value={riskLevelNames[user?.risk_level || 1]} 
                  valueStyle={{ color: riskLevelColors[user?.risk_level || 1], fontSize: 14 }} 
                />
              </Col>
            </Row>

            <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center' }}>
                <PhoneOutlined style={{ marginRight: 8, color: '#999' }} />
                {user?.phone || '未设置'}
              </p>
              <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center' }}>
                <MailOutlined style={{ marginRight: 8, color: '#999' }} />
                {user?.email || '未设置'}
              </p>
              <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center' }}>
                <EnvironmentOutlined style={{ marginRight: 8, color: '#999' }} />
                {user?.province && user?.city ? `${user.province} ${user.city}` : '未设置'}
              </p>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="编辑资料">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdate}
              initialValues={user}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="username" label="用户名">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="real_name"
                    label="真实姓名"
                    rules={[{ required: true, message: '请输入真实姓名' }]}
                  >
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }
                    ]}
                  >
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
                  >
                    <Input placeholder="请输入邮箱" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="province" label="省份">
                    <Input placeholder="省份" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="city" label="城市">
                    <Input placeholder="城市" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="district" label="区县">
                    <Input placeholder="区县" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="address" label="详细地址">
                <Input.TextArea rows={2} placeholder="请输入详细地址" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Profile
