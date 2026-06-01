import React, { useState, useEffect } from 'react'
import {
  Table, Button, Space, Tag, Modal, Form, Input, Select, message, Timeline, Drawer, Descriptions, Row, Col,
  Alert, Badge, DatePicker, Card, Statistic, Divider, Tooltip, InputNumber,
} from 'antd'
import { 
  PlusOutlined, ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  SafetyOutlined, UserOutlined, SettingOutlined, EyeOutlined,
} from '@ant-design/icons'
import { releasesApi, strategiesApi, metricsApi } from '../api.js'
import dayjs from 'dayjs'

const PHASES = [
  { value: '初始化', label: '初始化', icon: <SettingOutlined /> },
  { value: '白名单验证', label: '白名单验证', icon: <UserOutlined /> },
  { value: '10%放量', label: '10%放量', icon: <PlayCircleOutlined /> },
  { value: '30%放量', label: '30%放量', icon: <PlayCircleOutlined /> },
  { value: '50%放量', label: '50%放量', icon: <PlayCircleOutlined /> },
  { value: '100%放量', label: '100%放量', icon: <PlayCircleOutlined /> },
  { value: '完成', label: '完成', icon: <CheckCircleOutlined /> },
]

const PHASE_ORDER = PHASES.map(p => p.value)

const STATUS_CONFIG = {
  running: { color: 'processing', text: '进行中', icon: <PlayCircleOutlined spin /> },
  paused: { color: 'warning', text: '已暂停', icon: <PauseCircleOutlined /> },
  completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
  failed: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
}

export default function ReleasesPage() {
  const [data, setData] = useState([])
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailMetrics, setDetailMetrics] = useState([])
  const [timelineData, setTimelineData] = useState([])
  const [form] = Form.useForm()
  const selectedStrategyId = Form.useWatch('strategy_id', form)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [res, strats] = await Promise.all([releasesApi.list(), strategiesApi.list()])
      setData(res)
      setStrategies(strats)
    } catch (e) {
      message.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({ 
      start_time: dayjs(),
      status: 'running',
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        start_time: values.start_time ? values.start_time.format('YYYY-MM-DD HH:mm:ss') : null,
        end_time: values.end_time ? values.end_time.format('YYYY-MM-DD HH:mm:ss') : null,
      }
      await releasesApi.create(payload)
      message.success('发布记录创建成功')
      setModalOpen(false)
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  const showDetail = async (record) => {
    setDetail(record)
    setDetailOpen(true)
    
    try {
      const [metrics, strategyReleases] = await Promise.all([
        metricsApi.list({ strategy_id: record.strategy_id }).catch(() => []),
        releasesApi.listByStrategy(record.strategy_id).catch(() => []),
      ])
      
      setDetailMetrics(metrics.slice(0, 10))
      
      const timeline = buildTimeline(strategyReleases, record)
      setTimelineData(timeline)
    } catch (e) {
      console.error('获取详情数据失败:', e)
      setDetailMetrics([])
      setTimelineData([])
    }
  }

  const buildTimeline = (allReleases, currentRecord) => {
    const timeline = []
    
    timeline.push({
      color: 'blue',
      dot: <SettingOutlined />,
      children: (
        <div>
          <div><strong>灰度策略创建</strong></div>
          <div style={{ color: '#999', fontSize: 12 }}>
            {currentRecord.strategy_name} - {dayjs(currentRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </div>
        </div>
      )
    })
    
    const sortedReleases = [...allReleases].sort((a, b) => 
      PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase)
    )
    
    sortedReleases.forEach(release => {
      const isCurrent = release.id === currentRecord.id
      const statusConfig = STATUS_CONFIG[release.status] || STATUS_CONFIG.running
      
      let color = 'gray'
      if (release.status === 'completed') color = 'green'
      else if (release.status === 'running') color = 'blue'
      else if (release.status === 'paused') color = 'orange'
      else if (release.status === 'failed') color = 'red'
      
      timeline.push({
        color,
        dot: statusConfig.icon,
        children: (
          <div style={{ marginBottom: 8 }}>
            <Space>
              <strong>{release.phase}</strong>
              {isCurrent && <Tag color="blue" style={{ marginLeft: 8 }}>当前</Tag>}
              <Badge status={statusConfig.color} text={statusConfig.text} />
            </Space>
            <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              <Space split={<span style={{ color: '#ddd' }}>|</span>}>
                <span><UserOutlined /> {release.operator}</span>
                <span><ClockCircleOutlined /> {dayjs(release.start_time).format('MM-DD HH:mm')}</span>
                {release.end_time && <span>至 {dayjs(release.end_time).format('MM-DD HH:mm')}</span>}
              </Space>
            </div>
            {release.metric_threshold && (
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                指标阈值: {release.metric_threshold}
              </div>
            )}
            {release.check_result && (
              <div style={{ fontSize: 12, color: release.check_result.includes('通过') ? '#52c41a' : '#faad14', marginTop: 2 }}>
                检查结果: {release.check_result}
              </div>
            )}
            {release.pause_reason && (
              <div style={{ fontSize: 12, color: '#faad14', marginTop: 2 }}>
                <ExclamationCircleOutlined /> 暂停原因: {release.pause_reason}
              </div>
            )}
            {release.resume_reason && (
              <div style={{ fontSize: 12, color: '#52c41a', marginTop: 2 }}>
                继续原因: {release.resume_reason}
              </div>
            )}
          </div>
        )
      })
    })
    
    return timeline
  }

  const columns = [
    { 
      title: '阶段', 
      dataIndex: 'phase', 
      key: 'phase', 
      width: 120,
      render: (v) => {
        const phase = PHASES.find(p => p.value === v)
        return (
          <Space>
            {phase?.icon}
            <span>{v}</span>
          </Space>
        )
      }
    },
    { title: '策略名称', dataIndex: 'strategy_name', key: 'strategy_name', width: 160 },
    { title: '操作者', dataIndex: 'operator', key: 'operator', width: 100, render: (v) => <span><UserOutlined /> {v}</span> },
    { 
      title: '指标阈值', 
      dataIndex: 'metric_threshold', 
      key: 'metric_threshold', 
      width: 180, 
      ellipsis: true,
      render: (v) => v ? <Tooltip title={v}><Tag color="blue">{v}</Tag></Tooltip> : <Tag color="default">未设置</Tag>
    },
    { 
      title: '检查结果', 
      dataIndex: 'check_result', 
      key: 'check_result', 
      width: 120, 
      ellipsis: true,
      render: (v) => {
        if (!v) return <Tag color="default">-</Tag>
        if (v.includes('通过')) return <Tag color="green" icon={<CheckCircleOutlined />}>{v}</Tag>
        if (v.includes('异常') || v.includes('失败')) return <Tag color="red" icon={<ExclamationCircleOutlined />}>{v}</Tag>
        return <Tag color="orange">{v}</Tag>
      }
    },
    { 
      title: '开始时间', 
      dataIndex: 'start_time', 
      key: 'start_time', 
      width: 150, 
      render: (v) => <span><ClockCircleOutlined /> {dayjs(v).format('MM-DD HH:mm')}</span> 
    },
    { 
      title: '结束时间', 
      dataIndex: 'end_time', 
      key: 'end_time', 
      width: 150, 
      render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-' 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100, 
      render: (v) => {
        const config = STATUS_CONFIG[v] || STATUS_CONFIG.running
        return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>
      } 
    },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, r) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            onClick={() => showDetail(r)}
            style={{ fontWeight: 600 }}
          >
            <EyeOutlined /> 复查
          </Button>
          {r.status === 'running' && (
            <Tooltip title="记录暂停/继续">
              <Button 
                type="link" 
                size="small" 
                danger
                onClick={() => handleQuickUpdate(r, 'paused')}
              >
                暂停
              </Button>
            </Tooltip>
          )}
          {r.status === 'paused' && (
            <Tooltip title="继续放量">
              <Button 
                size="small" 
                type="primary"
                onClick={() => handleQuickUpdate(r, 'running')}
              >
                继续
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  const handleQuickUpdate = async (record, newStatus) => {
    try {
      let updateData = { status: newStatus }
      if (newStatus === 'paused') {
        const reason = window.prompt('请输入暂停原因：')
        if (!reason) return
        updateData.pause_reason = reason
        updateData.end_time = dayjs().format('YYYY-MM-DD HH:mm:ss')
      } else if (newStatus === 'running') {
        const reason = window.prompt('请输入继续原因：')
        if (!reason) return
        updateData.resume_reason = reason
        updateData.end_time = null
      } else if (newStatus === 'completed') {
        updateData.end_time = dayjs().format('YYYY-MM-DD HH:mm:ss')
        updateData.check_result = '检查通过'
      }
      
      await releasesApi.update(record.id, updateData)
      message.success('更新成功')
      fetchData()
      
      if (detail?.id === record.id) {
        showDetail({ ...record, ...updateData })
      }
    } catch (e) {
      message.error(e.message)
    }
  }

  return (
    <div>
      <Alert
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        message="发布执行规范"
        description="每个灰度发布需记录：阶段开始时间、操作者、指标阈值、检查结果、暂停/继续原因，形成完整的发布闭环审计链路。"
        style={{ marginBottom: 16 }}
      />
      
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建发布记录</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
      </Space>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="进行中" 
              value={data.filter(d => d.status === 'running').length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="已暂停" 
              value={data.filter(d => d.status === 'paused').length}
              valueStyle={{ color: '#faad14' }}
              prefix={<PauseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="已完成" 
              value={data.filter(d => d.status === 'completed').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="失败" 
              value={data.filter(d => d.status === 'failed').length}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Table rowKey="id" loading={loading} dataSource={data} columns={columns} pagination={{ pageSize: 10 }} />
      
      <Modal
        title="新建发布记录"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={700}
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          message="请完整填写发布阶段信息"
          description="开始时间、操作者、指标阈值为必填项；检查结果和暂停/继续原因在对应操作时填写。"
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="strategy_id" label="灰度策略" rules={[{ required: true, message: '请选择灰度策略' }]}>
                <Select
                  options={strategies.map(s => ({ value: s.id, label: `${s.name} (${s.build_number || '未关联版本'})` }))}
                  showSearch
                  optionFilterProp="label"
                  placeholder="请选择灰度策略"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phase" label="发布阶段" rules={[{ required: true, message: '请选择阶段' }]}>
                <Select 
                  options={PHASES.map(p => ({ value: p.value, label: p.value }))}
                  placeholder="请选择阶段"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="operator" label="操作者" rules={[{ required: true, message: '请输入操作者' }]}>
                <Input placeholder="工号或姓名" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select 
                  options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.text }))}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_time" label="开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label="结束时间（可选）">
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="metric_threshold" label="指标阈值（用于检查）">
            <Input placeholder="例如: js_errors<10, api_errors<5, white_screen_rate<0.01" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="check_result" label="检查结果">
                <Select
                  allowClear
                  options={[
                    { value: '检查通过', label: '检查通过' },
                    { value: '指标异常-暂停', label: '指标异常-暂停' },
                    { value: '检查通过-继续', label: '检查通过-继续' },
                    { value: '检查失败-回滚', label: '检查失败-回滚' },
                  ]}
                  placeholder="选择检查结果"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pause_reason" label="暂停原因（暂停时填写）">
                <Input placeholder="暂停放量的原因" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="resume_reason" label="继续原因（继续放量时填写）">
            <Input placeholder="继续放量的原因，如：指标已恢复正常" />
          </Form.Item>
        </Form>
      </Modal>
      
      <Drawer 
        title="发布执行复查" 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        width={720}
        extra={
          <Space>
            {detail?.status === 'running' && (
              <Button danger onClick={() => handleQuickUpdate(detail, 'paused')}>
                <PauseCircleOutlined /> 暂停放量
              </Button>
            )}
            {detail?.status === 'paused' && (
              <Button type="primary" onClick={() => handleQuickUpdate(detail, 'running')}>
                <PlayCircleOutlined /> 继续放量
              </Button>
            )}
            {detail?.status === 'running' && (
              <Button type="primary" onClick={() => handleQuickUpdate(detail, 'completed')}>
                <CheckCircleOutlined /> 标记完成
              </Button>
            )}
          </Space>
        }
      >
        {detail && (
          <>
            <Alert
              type={detail.status === 'running' ? 'info' : detail.status === 'paused' ? 'warning' : 'success'}
              showIcon
              icon={STATUS_CONFIG[detail.status]?.icon}
              message={`当前阶段: ${detail.phase} - ${STATUS_CONFIG[detail.status]?.text}`}
              description={`操作者: ${detail.operator} | 开始时间: ${dayjs(detail.start_time).format('YYYY-MM-DD HH:mm:ss')}`}
              style={{ marginBottom: 16 }}
            />
            
            <Divider orientation="left">阶段基本信息</Divider>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="策略名称">{detail.strategy_name}</Descriptions.Item>
              <Descriptions.Item label="关联版本">{detail.build_number || '-'}</Descriptions.Item>
              <Descriptions.Item label="发布阶段">{detail.phase}</Descriptions.Item>
              <Descriptions.Item label="操作者">{detail.operator}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{dayjs(detail.start_time).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{detail.end_time ? dayjs(detail.end_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="指标阈值">{detail.metric_threshold || '-'}</Descriptions.Item>
              <Descriptions.Item label="检查结果">{detail.check_result || '-'}</Descriptions.Item>
            </Descriptions>
            
            {(detail.pause_reason || detail.resume_reason) && (
              <>
                <Divider orientation="left">暂停/继续记录</Divider>
                <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                  {detail.pause_reason && (
                    <Descriptions.Item label="暂停原因">
                      <Tag color="orange"><ExclamationCircleOutlined /> {detail.pause_reason}</Tag>
                    </Descriptions.Item>
                  )}
                  {detail.resume_reason && (
                    <Descriptions.Item label="继续原因">
                      <Tag color="green"><CheckCircleOutlined /> {detail.resume_reason}</Tag>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}
            
            <Divider orientation="left">阶段流转时间线</Divider>
            <Card size="small" style={{ marginBottom: 16 }}>
              {timelineData.length > 0 ? (
                <Timeline items={timelineData} />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                  暂无阶段流转记录
                </div>
              )}
            </Card>
            
            {detailMetrics.length > 0 && (
              <>
                <Divider orientation="left">近期监控指标</Divider>
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={detailMetrics}
                  pagination={false}
                  columns={[
                    { title: '时间', dataIndex: 'timestamp', width: 120, render: (v) => dayjs(v).format('MM-DD HH:mm') },
                    { title: 'PV', dataIndex: 'pv', width: 60 },
                    { title: 'JS错误', dataIndex: 'js_errors', width: 80, render: (v) => <Tag color={v > 10 ? 'red' : 'green'}>{v}</Tag> },
                    { title: 'API错误', dataIndex: 'api_errors', width: 80, render: (v) => <Tag color={v > 5 ? 'red' : 'green'}>{v}</Tag> },
                    { title: '白屏率', dataIndex: 'white_screen_rate', width: 90, render: (v) => <Tag color={v > 0.01 ? 'red' : 'green'}>{(v * 100).toFixed(2)}%</Tag> },
                    { title: '核心转化', dataIndex: 'core_conversion', width: 90, render: (v) => `${(v * 100).toFixed(2)}%` },
                    { title: '异常', dataIndex: 'is_anomaly', width: 70, render: (v) => v ? <Tag color="red">异常</Tag> : <Tag color="green">正常</Tag> },
                  ]}
                />
              </>
            )}
            
            <Divider orientation="left">审计信息</Divider>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="记录ID">#{detail.id}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  )
}
