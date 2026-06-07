import { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Button, Tag, Space, Spin, message, Calendar, Badge, Row, Col, Statistic, Descriptions, Alert } from 'antd'
import { UserOutlined, CalendarOutlined, StarOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons'
import request from '../utils/request'
import dayjs from 'dayjs'

const identityOptions = [
  { value: 'student', label: '在校学生' },
  { value: 'professional', label: '上班族/在职人员' },
  { value: 'graduate', label: '应届毕业生' },
  { value: 'freelance', label: '自由职业' }
]

const skillOptions = [
  { value: 'Python', label: 'Python' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'Java', label: 'Java' },
  { value: 'UI设计', label: 'UI设计' },
  { value: '平面设计', label: '平面设计' },
  { value: '翻译', label: '翻译' },
  { value: '写作', label: '写作' },
  { value: '数据录入', label: '数据录入' },
  { value: '客服', label: '客服' },
  { value: '销售', label: '销售' },
  { value: '餐饮服务', label: '餐饮服务' },
  { value: '家教', label: '家教' }
]

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const timeSlots = ['上午', '下午', '晚上']

export default function WorkerProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const [selectedSkills, setSelectedSkills] = useState([])
  const [availability, setAvailability] = useState({})

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await request.get('/profiles/worker')
      const data = res.data || res
      let skills = []
      try {
        skills = data.skills ? (typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills) : []
      } catch (e) {
        skills = []
      }
      let avail = {}
      try {
        avail = data.availability_calendar ? (typeof data.availability_calendar === 'string' ? JSON.parse(data.availability_calendar) : data.availability_calendar) : {}
      } catch (e) {
        avail = {}
      }
      setSelectedSkills(skills)
      setAvailability(avail)
      setProfile({ ...data, skills, availability_calendar: avail })
      form.setFieldsValue({
        ...data,
        skills
      })
    } catch (e) {
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
      values.skills = selectedSkills
      values.availability_calendar = JSON.stringify(availability)
      setSaving(true)
      await request.put('/profiles/worker', values)
      message.success('资料保存成功')
      setEditing(false)
      fetchProfile()
    } catch (e) {
    } finally {
      setSaving(false)
    }
  }

  const getIdentityBadge = (identityType) => {
    switch (identityType) {
      case 'student':
        return <Tag color="blue" icon={<StarOutlined />}>在校学生</Tag>
      case 'professional':
        return <Tag color="purple" icon={<StarOutlined />}>上班族</Tag>
      case 'graduate':
        return <Tag color="green" icon={<StarOutlined />}>应届毕业生</Tag>
      case 'freelance':
        return <Tag color="orange" icon={<StarOutlined />}>自由职业</Tag>
      default:
        return <Tag color="default">未设置</Tag>
    }
  }

  const toggleAvailability = (day, slot) => {
    const key = `${day}-${slot}`
    setAvailability(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const getListData = (value) => {
    const dayOfWeek = value.day()
    const dayName = weekDays[dayOfWeek === 0 ? 6 : dayOfWeek - 1]
    const availableSlots = []
    timeSlots.forEach(slot => {
      if (availability[`${dayName}-${slot}`]) {
        availableSlots.push({ type: 'success', content: slot })
      }
    })
    return availableSlots
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card
            title={<><UserOutlined /> 个人资料</>}
            extra={
              <Button type={editing ? 'default' : 'primary'} onClick={() => setEditing(!editing)}>
                {editing ? '取消编辑' : '编辑资料'}
              </Button>
            }
          >
            {editing ? (
              <Form form={form} layout="vertical" onFinish={handleSave}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="identity_type" label="身份类型" rules={[{ required: true, message: '请选择身份类型' }]}>
                      <Select options={identityOptions} placeholder="请选择身份类型" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="real_name" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
                      <Input placeholder="请输入真实姓名" />
                    </Form.Item>
                  </Col>
                </Row>
                {form.getFieldValue('identity_type') === 'student' && (
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="university" label="学校">
                        <Input placeholder="请输入学校名称" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="major" label="专业">
                        <Input placeholder="请输入专业" />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
                <Form.Item label="技能标签">
                  <Select
                    mode="multiple"
                    value={selectedSkills}
                    onChange={setSelectedSkills}
                    options={skillOptions}
                    placeholder="选择您的技能标签"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="可用时间设置">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {weekDays.map(day => (
                      <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 60, fontWeight: 'bold' }}>{day}</span>
                        <Space>
                          {timeSlots.map(slot => (
                            <Tag.CheckableTag
                              key={`${day}-${slot}`}
                              checked={availability[`${day}-${slot}`]}
                              onChange={() => toggleAvailability(day, slot)}
                            >
                              {slot}
                            </Tag.CheckableTag>
                          ))}
                        </Space>
                      </div>
                    ))}
                  </div>
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
              <div>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <div>
                    <strong>身份标识：</strong>
                    {getIdentityBadge(profile?.identity_type)}
                  </div>
                  <div>
                    <strong>真实姓名：</strong>{profile?.real_name || '未设置'}
                  </div>
                  {profile?.identity_type === 'student' && (
                    <>
                      <div>
                        <strong>学校：</strong>{profile?.university || '未设置'}
                      </div>
                      <div>
                        <strong>专业：</strong>{profile?.major || '未设置'}
                      </div>
                    </>
                  )}
                  <div>
                    <strong>技能标签：</strong>
                    <Space wrap style={{ marginLeft: 8 }}>
                      {(profile?.skills || []).length > 0
                        ? profile.skills.map((skill, idx) => <Tag color="blue" key={idx}>{skill}</Tag>)
                        : <span>未设置</span>
                      }
                    </Space>
                  </div>
                  <div>
                    <strong>可用时间日历：</strong>
                    <div style={{ marginTop: 8, maxWidth: 400 }}>
                      <Calendar
                        fullscreen={false}
                        mode="month"
                        getListData={getListData}
                        headerRender={({ value, type, onChange }) => (
                          <div style={{ padding: 8, textAlign: 'center' }}>
                            <strong>{value.format('YYYY年MM月')}</strong>
                          </div>
                        )}
                      />
                      <Alert
                        message="日历说明：绿色标记表示您当天有空闲时间可接单"
                        type="info"
                        showIcon
                        size="small"
                        style={{ marginTop: 8 }}
                      />
                    </div>
                  </div>
                </Space>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title={<><SafetyCertificateOutlined /> 平台认证</>} size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="实名认证">
                {profile?.real_name ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>已认证</Tag>
                ) : (
                  <Tag color="default">未认证</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="学生认证">
                {profile?.identity_type === 'student' && profile?.university ? (
                  <Tag color="blue" icon={<CheckCircleOutlined />}>已认证</Tag>
                ) : (
                  <Tag color="default">未认证</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="技能等级">
                <Tag color="purple">{(profile?.skills || []).length >= 3 ? '高级' : (profile?.skills || []).length >= 1 ? '入门' : '暂无'}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 4 }}>
              <Text type="success">
                <SafetyCertificateOutlined /> 完善资料可获得更多推荐机会
              </Text>
            </div>
          </Card>

          <Card title={<><StarOutlined /> 接单统计</>} size="small" style={{ marginTop: 16 }}>
            <Row gutter={8}>
              <Col span={12}>
                <Statistic title="累计接单" value={0} valueStyle={{ fontSize: 20 }} />
              </Col>
              <Col span={12}>
                <Statistic title="累计收入" value={0} suffix="元" valueStyle={{ fontSize: 20, color: '#52c41a' }} />
              </Col>
            </Row>
            <Row gutter={8} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Statistic title="完成率" value={100} suffix="%" valueStyle={{ fontSize: 20, color: '#1890ff' }} />
              </Col>
              <Col span={12}>
                <Statistic title="好评率" value={100} suffix="%" valueStyle={{ fontSize: 20, color: '#faad14' }} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
