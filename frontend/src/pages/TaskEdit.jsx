import React, { useState, useEffect } from 'react'
import { Form, Input, Select, DatePicker, Button, Card, Space, message, Row, Col, Checkbox, Tag, Divider, Alert, Statistic, Steps } from 'antd'
import { SaveOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api.js'
import dayjs from 'dayjs'

const { TextArea } = Input

const channelOptions = [
  { value: 'in_app', label: '站内信' },
  { value: 'browser', label: '浏览器通知' },
  { value: 'popup', label: '运营弹窗' }
]

const styleOptions = [
  { value: 'info', label: '蓝色（信息）' },
  { value: 'success', label: '绿色（成功）' },
  { value: 'warning', label: '橙色（警告）' },
  { value: 'error', label: '红色（错误）' }
]

export default function TaskEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [tags, setTags] = useState([])
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [versions, setVersions] = useState([])

  useEffect(() => {
    api.get('/tags').then(res => setTags(res.list)).catch(() => {})
    if (id) {
      api.get(`/tasks/${id}`).then(res => {
        form.setFieldsValue({
          ...res,
          schedule_time: res.schedule_time ? dayjs(res.schedule_time) : null,
          audience_config: res.audience_config
        })
        setPreview({
          estimatedCount: 0,
          sample: []
        })
      }).catch(e => message.error(e.message))
      api.get(`/task-versions/${id}`).then(res => setVersions(res.list)).catch(() => {})
    }
  }, [id])

  const handlePreviewAudience = async () => {
    const config = form.getFieldValue('audience_config') || {}
    try {
      const res = await api.post('/audience/preview', config)
      setPreview(res)
      message.success(`预计触达 ${res.estimatedCount} 人`)
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const data = {
        ...values,
        schedule_time: values.schedule_time ? values.schedule_time.format('YYYY-MM-DD HH:mm:ss') : null,
        audience_config: values.audience_config || {},
        freq_config: values.freq_config || {}
      }
      if (id) {
        await api.put(`/tasks/${id}`, data)
        message.success('任务已更新')
      } else {
        const res = await api.post('/tasks', data)
        if (res.sensitive && res.sensitive.length > 0) {
          message.warning(`包含敏感词: ${res.sensitive.join(', ')}，已保存为草稿`)
        } else {
          message.success('任务已创建，等待审批')
        }
      }
      navigate('/tasks')
    } catch (e) {
      message.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>返回</Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>{id ? '编辑消息任务' : '新建消息任务'}</span>
      </Space>
      <Row gutter={16}>
        <Col span={16}>
          <Card title="消息内容配置" style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{
              style: 'info',
              channels: ['in_app'],
              audience_config: { tags: [], behaviors: [], minLevel: 1, lastVisitDays: 0, exclude: { tags: [], behaviors: [] } },
              freq_config: { dailyLimit: 3, weeklyLimit: 10 }
            }}>
              <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="请输入消息标题" maxLength={50} showCount />
              </Form.Item>
              <Form.Item name="content" label="正文" rules={[{ required: true, message: '请输入正文' }]}>
                <TextArea rows={4} placeholder="请输入消息正文" maxLength={500} showCount />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="jump_url" label="跳转地址">
                    <Input placeholder="如 /promotions/2024" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="style" label="样式" rules={[{ required: true }]}>
                    <Select options={styleOptions} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="channels" label="推送渠道" rules={[{ required: true, message: '请选择渠道' }]}>
                <Checkbox.Group options={channelOptions} />
              </Form.Item>

              <Divider>目标人群配置</Divider>

              <Form.Item name={['audience_config', 'tags']} label="标签">
                <Select mode="multiple" placeholder="选择用户标签" style={{ width: '100%' }}
                  options={tags.map(t => ({ value: t.name, label: t.name }))} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name={['audience_config', 'minLevel']} label="最低会员等级">
                    <Select options={[
                      { value: 1, label: '全部等级' },
                      { value: 2, label: '等级2及以上' },
                      { value: 3, label: '等级3及以上' },
                      { value: 4, label: '等级4及以上' },
                      { value: 5, label: '等级5（最高）' }
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={['audience_config', 'lastVisitDays']} label="最近访问（天）">
                    <Select options={[
                      { value: 0, label: '不限' },
                      { value: 1, label: '1天内' },
                      { value: 3, label: '3天内' },
                      { value: 7, label: '7天内' },
                      { value: 15, label: '15天内' },
                      { value: 30, label: '30天内' }
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="预计触达">
                    <Button onClick={handlePreviewAudience}>计算预计人数</Button>
                    {preview && <Tag color="blue" style={{ marginLeft: 8 }}>预计 {preview.estimatedCount} 人</Tag>}
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name={['audience_config', 'exclude', 'tags']} label="排除标签">
                <Select mode="multiple" placeholder="选择排除的用户标签" style={{ width: '100%' }}
                  options={tags.map(t => ({ value: t.name, label: t.name }))} />
              </Form.Item>

              <Divider>发送时间与频控</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="schedule_time" label="发送时间">
                    <DatePicker showTime style={{ width: '100%' }} placeholder="留空则立即发送" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name={['freq_config', 'dailyLimit']} label="每日上限">
                    <Input type="number" min={1} max={20} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name={['freq_config', 'weeklyLimit']} label="每周上限">
                    <Input type="number" min={1} max={50} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="operator_note" label="运营备注">
                <TextArea rows={2} placeholder="可选，记录操作说明" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>保存并提交审批</Button>
                  <Button onClick={() => navigate('/tasks')}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="消息预览" style={{ marginBottom: 16 }}>
            <MessagePreview form={form} />
          </Card>
          <Card title="版本历史" style={{ marginBottom: 16 }}>
            {versions.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center' }}>暂无版本记录</p>
            ) : (
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {versions.map(v => (
                  <div key={v.id} style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 12, color: '#999' }}>v{v.version} · {v.created_at}</div>
                    <div style={{ fontWeight: 500 }}>{v.title}</div>
                    {v.operator_note && <div style={{ color: '#666', fontSize: 12 }}>{v.operator_note}</div>}
                  </div>
                ))}
              </div>
            )}
          </Card>
          {preview && preview.sample && preview.sample.length > 0 && (
            <Card title="样本用户预览">
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                {preview.sample.map(u => (
                  <div key={u.id} style={{ padding: 6, borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
                    <span>{u.name}</span>
                    <Tag style={{ marginLeft: 4 }}>Lv.{u.level}</Tag>
                    {u.tags.map(t => <Tag key={t} color="blue" style={{ marginLeft: 2 }}>{t}</Tag>)}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}

function MessagePreview({ form }) {
  const title = Form.useWatch('title', form) || '消息标题预览'
  const content = Form.useWatch('content', form) || '消息正文将显示在这里...'
  const style = Form.useWatch('style', form) || 'info'
  const channels = Form.useWatch('channels', form) || []
  const jumpUrl = Form.useWatch('jump_url', form)
  const styleColor = { info: '#1677ff', success: '#52c41a', warning: '#faad14', error: '#ff4d4f' }

  return (
    <div>
      <div style={{
        padding: 16, background: '#f5f5f5', borderRadius: 8,
        borderLeft: `4px solid ${styleColor[style]}`
      }}>
        <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: styleColor[style] }}>
          {title}
        </div>
        <div style={{ color: '#333', marginBottom: 8 }}>{content}</div>
        {jumpUrl && <div style={{ fontSize: 12, color: '#999' }}>→ {jumpUrl}</div>}
      </div>
      <div style={{ marginTop: 12 }}>
        {channels.map(c => <Tag key={c} color="blue">{channelOptions.find(o => o.value === c)?.label || c}</Tag>)}
      </div>
    </div>
  )
}