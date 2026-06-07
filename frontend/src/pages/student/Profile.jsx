import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, message, Descriptions, Tag, Space } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined, IdcardOutlined, AlipayOutlined, ThunderboltOutlined, WalletOutlined } from '@ant-design/icons'
import StudentLayout from '../../components/StudentLayout.jsx'
import { studentAPI } from '../../utils/api.js'

function StudentProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const response = await studentAPI.getProfile()
      console.log('Profile response:', response.data)
      setProfile(response.data)
      form.setFieldsValue({
        phone: response.data.phone,
        email: response.data.email,
        bluetooth_address: response.data.bluetooth_address,
        nfc_card_id: response.data.nfc_card_id,
      })
    } catch (error) {
      console.error('加载个人信息失败:', error)
      message.error('加载个人信息失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (values) => {
    if (!profile) {
      message.error('用户信息未加载，请刷新重试')
      return
    }
    setSaving(true)
    try {
      await studentAPI.updateStudent(profile.student_id, values)
      message.success('保存成功')
      loadProfile()
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'error'
  }

  const getStatusText = (status) => {
    return status === 'active' ? '正常' : status === 'graduated' ? '已毕业' : status
  }

  return (
    <StudentLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>个人信息</h2>
          <Button onClick={loadProfile} loading={loading}>刷新</Button>
        </div>
        
        {loading && !profile ? (
          <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>
        ) : profile ? (
          <>
            <Card title="账户身份信息" style={{ marginBottom: 24 }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="学号">
                  <Space>
                    <IdcardOutlined style={{ color: '#1890ff' }} />
                    <strong style={{ fontSize: 16 }}>{profile.student_id}</strong>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="姓名">
                  <Space>
                    <UserOutlined />
                    <strong>{profile.name}</strong>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="学院">
                  {profile.department}
                </Descriptions.Item>
                <Descriptions.Item label="账户状态">
                  <Tag color={getStatusColor(profile.status)}>
                    {getStatusText(profile.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="账户余额" span={2}>
                  <Space>
                    <WalletOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                    <span style={{ fontSize: 24, fontWeight: 'bold', color: profile.balance > 0 ? '#52c41a' : '#ff4d4f' }}>
                      ¥{profile.balance?.toFixed(2) || '0.00'}
                    </span>
                    {profile.balance <= 0 && <Tag color="red">余额不足</Tag>}
                    {profile.balance > 0 && profile.balance < 10 && <Tag color="orange">余额较低</Tag>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="注册时间">
                  {profile.created_at ? new Date(profile.created_at).toLocaleString() : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="手机号">
                  <Space>
                    <PhoneOutlined style={{ color: '#1890ff' }} />
                    {profile.phone || <Tag color="default">未绑定</Tag>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  <Space>
                    <MailOutlined style={{ color: '#1890ff' }} />
                    {profile.email || <Tag color="default">未设置</Tag>}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="身份绑定信息" style={{ marginBottom: 24 }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="支付宝账户">
                  <Space>
                    <AlipayOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                    {profile.alipay_user_id ? (
                      <span>{profile.alipay_user_id.replace(/(.{6}).*(.{4})/, '$1****$2')}</span>
                    ) : (
                      <Tag color="default">未绑定</Tag>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="蓝牙地址">
                  <Space>
                    <ThunderboltOutlined style={{ color: '#1890ff' }} />
                    {profile.bluetooth_address || <Tag color="default">未绑定</Tag>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="NFC卡号">
                  <Space>
                    <IdcardOutlined style={{ color: '#722ed1' }} />
                    {profile.nfc_card_id || <Tag color="default">未绑定</Tag>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="身份核验方式">
                  <Space>
                    {profile.bluetooth_address && <Tag color="blue">蓝牙</Tag>}
                    {profile.nfc_card_id && <Tag color="purple">NFC</Tag>}
                    {profile.phone && <Tag color="green">手机号</Tag>}
                    {!profile.bluetooth_address && !profile.nfc_card_id && !profile.phone && (
                      <Tag color="default">未设置核验方式</Tag>
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 6, fontSize: 12, color: '#1890ff' }}>
                ℹ️ 身份绑定信息用于无卡身份核验，绑定后可快速通过蓝牙/NFC识别身份，无需每次输入验证码
              </div>
            </Card>

            <Card title="编辑信息">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
              >
                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
                >
                  <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                </Form.Item>
                <Form.Item
                  name="bluetooth_address"
                  label="蓝牙地址"
                  help="格式：AA:BB:CC:DD:EE:FF，用于蓝牙近场识别"
                >
                  <Input placeholder="AA:BB:CC:DD:EE:FF" />
                </Form.Item>
                <Form.Item
                  name="nfc_card_id"
                  label="NFC卡号"
                  help="NFC校园卡号，用于NFC近场识别"
                >
                  <Input placeholder="请输入NFC卡号" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={saving}>
                    保存修改
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
            无法加载个人信息，请刷新页面重试
          </div>
        )}
      </div>
    </StudentLayout>
  )
}

export default StudentProfile
