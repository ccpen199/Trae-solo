import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Tag, Spin, message, Descriptions } from 'antd'
import { BankOutlined } from '@ant-design/icons'
import request from '../utils/request'

export default function EmployerProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await request.get('/profiles/employer')
      const data = res.data || res
      setProfile(data)
      form.setFieldsValue(data)
    } catch (e) {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await request.put('/profiles/employer', values)
      message.success('资料保存成功')
      setEditing(false)
      fetchProfile()
    } catch (e) {
      // handled by interceptor
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  return (
    <Card
      title={<><BankOutlined /> 企业资料</>}
      extra={
        <Button type={editing ? 'default' : 'primary'} onClick={() => setEditing(!editing)}>
          {editing ? '取消编辑' : '编辑资料'}
        </Button>
      }
    >
      {editing ? (
        <Form form={form} layout="vertical" style={{ maxWidth: 600 }} onFinish={handleSave}>
          <Form.Item name="company_name" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input placeholder="请输入公司名称" />
          </Form.Item>
          <Form.Item name="business_license" label="营业执照号">
            <Input placeholder="请输入营业执照号" />
          </Form.Item>
          <Form.Item name="contact_person" label="联系人">
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item name="contact_phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="address" label="公司地址">
            <Input placeholder="请输入公司地址" />
          </Form.Item>
          <Form.Item name="description" label="公司简介">
            <Input.TextArea rows={3} placeholder="请输入公司简介" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存
            </Button>
            <Button style={{ marginLeft: 12 }} onClick={() => setEditing(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <Descriptions bordered column={1} style={{ maxWidth: 600 }}>
          <Descriptions.Item label="公司名称">{profile?.company_name || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="营业执照号">{profile?.business_license || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="联系人">{profile?.contact_person || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{profile?.contact_phone || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="公司地址">{profile?.address || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="公司简介">{profile?.description || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="认证状态">
            {profile?.verified ? <Tag color="green">已认证</Tag> : <Tag color="orange">未认证</Tag>}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  )
}
