import React, { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Button, message, Space, Descriptions } from 'antd'
import { EditOutlined, SaveOutlined } from '@ant-design/icons'
import { studentAPI } from '../services/api'

const Profile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  
  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : { id: null, name: '', role: '' }
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return { id: null, name: '', role: '' }
    }
  }
  
  const user = getUser()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await studentAPI.getAll()
      const myProfile = res.data.find(p => p.user_id === user.id)
      setProfile(myProfile)
      if (myProfile) {
        form.setFieldsValue(myProfile)
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || '加载档案失败，请稍后重试'
      message.error(errorMsg, 5)
      console.error('加载档案失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await studentAPI.update(profile.id, values)
      message.success('更新成功')
      setEditing(false)
      loadProfile()
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || '更新失败，请稍后重试'
      message.error(errorMsg, 5)
      console.error('更新档案失败:', error)
    }
  }

  if (!profile) {
    return <Card loading={true} />
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>我的档案</h2>
        {!editing && (
          <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>
            编辑
          </Button>
        )}
      </div>

      <Card>
        {editing ? (
          <Form form={form} layout="vertical">
            <Form.Item name="gpa" label="GPA">
              <InputNumber step={0.01} min={0} max={4} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="toefl" label="托福">
              <InputNumber min={0} max={120} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="ielts" label="雅思">
              <InputNumber step={0.5} min={0} max={9} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="gre" label="GRE">
              <InputNumber min={0} max={340} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="gmat" label="GMAT">
              <InputNumber min={0} max={800} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="target_countries" label="目标国家">
              <Input placeholder="如：美国,英国" />
            </Form.Item>
            <Form.Item name="application_season" label="申请季">
              <Input placeholder="如：2025 Fall" />
            </Form.Item>
            <Form.Item name="background_activities" label="背景活动">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="budget" label="预算">
              <InputNumber min={0} style={{ width: '100%' }} addonAfter="RMB" />
            </Form.Item>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存
              </Button>
              <Button onClick={() => { setEditing(false); form.setFieldsValue(profile) }}>
                取消
              </Button>
            </Space>
          </Form>
        ) : (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="GPA">{profile.gpa || '-'}</Descriptions.Item>
            <Descriptions.Item label="托福">{profile.toefl || '-'}</Descriptions.Item>
            <Descriptions.Item label="雅思">{profile.ielts || '-'}</Descriptions.Item>
            <Descriptions.Item label="GRE">{profile.gre || '-'}</Descriptions.Item>
            <Descriptions.Item label="GMAT">{profile.gmat || '-'}</Descriptions.Item>
            <Descriptions.Item label="目标国家">{profile.target_countries || '-'}</Descriptions.Item>
            <Descriptions.Item label="申请季">{profile.application_season || '-'}</Descriptions.Item>
            <Descriptions.Item label="预算">{profile.budget ? `${profile.budget} RMB` : '-'}</Descriptions.Item>
            <Descriptions.Item label="背景活动" span={2}>
              {profile.background_activities || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  )
}

export default Profile
