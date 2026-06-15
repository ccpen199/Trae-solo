import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Progress, Button, List, Statistic, message, Modal, Form, InputNumber, Select } from 'antd'
import {
  SafetyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  SyncOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { platformApi } from '../api'

function PlatformMonitor() {
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [capacityModal, setCapacityModal] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await platformApi.stats()
      if (res.success) {
        setPlatforms(res.data)
      }
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCapacity = async (values) => {
    try {
      const res = await platformApi.updateCapacity(selectedPlatform.id, values.capacity_saturation / 100)
      if (res.success) {
        message.success('运力饱和度已更新')
        setCapacityModal(false)
        loadData()
      }
    } catch (e) {
      message.error('更新失败')
    }
  }

  const getSaturationColor = (saturation) => {
    if (saturation < 0.5) return '#52c41a'
    if (saturation < 0.8) return '#faad14'
    return '#ff4d4f'
  }

  const getSaturationStatus = (saturation) => {
    if (saturation < 0.5) return { text: '充足', color: 'green' }
    if (saturation < 0.8) return { text: '较忙', color: 'orange' }
    return { text: '繁忙', color: 'red' }
  }

  const getQualityLevel = (rate, type) => {
    if (type === 'positive') {
      if (rate >= 0.97) return { level: '优秀', color: '#52c41a' }
      if (rate >= 0.93) return { level: '良好', color: '#1677ff' }
      if (rate >= 0.90) return { level: '一般', color: '#faad14' }
      return { level: '较差', color: '#ff4d4f' }
    } else {
      if (rate <= 0.005) return { level: '优秀', color: '#52c41a' }
      if (rate <= 0.01) return { level: '良好', color: '#1677ff' }
      if (rate <= 0.02) return { level: '一般', color: '#faad14' }
      return { level: '较差', color: '#ff4d4f' }
    }
  }

  const onTimeChartOption = {
    title: { text: '各平台准时率对比', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: platforms.map(p => p.name), axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value', min: 85, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      data: platforms.map(p => ({
        value: (p.actual_on_time_rate * 100).toFixed(1),
        itemStyle: { color: p.actual_on_time_rate >= 0.95 ? '#52c41a' : p.actual_on_time_rate >= 0.90 ? '#faad14' : '#ff4d4f' }
      })),
      type: 'bar',
      barWidth: 20,
      label: { show: true, position: 'top', formatter: '{c}%', fontSize: 10 }
    }]
  }

  const lossChartOption = {
    title: { text: '各平台丢件率对比', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: platforms.map(p => p.name), axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
    series: [{
      data: platforms.map(p => ({
        value: (p.loss_rate * 100).toFixed(2),
        itemStyle: { color: p.loss_rate <= 0.005 ? '#52c41a' : p.loss_rate <= 0.01 ? '#faad14' : '#ff4d4f' }
      })),
      type: 'bar',
      barWidth: 20,
      label: { show: true, position: 'top', formatter: '{c}%', fontSize: 10 }
    }]
  }

  const capacityChartOption = {
    title: { text: '各平台运力饱和度', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    yAxis: { type: 'category', data: platforms.map(p => p.name), axisLabel: { fontSize: 10 } },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      data: platforms.map(p => ({
        value: (p.capacity_saturation * 100).toFixed(0),
        itemStyle: { 
          color: p.capacity_saturation < 0.5 ? '#52c41a' : p.capacity_saturation < 0.8 ? '#faad14' : '#ff4d4f' 
        }
      })),
      type: 'bar',
      barWidth: 16,
      label: { show: true, position: 'right', formatter: '{c}%', fontSize: 10 }
    }]
  }

  const columns = [
    {
      title: '平台',
      dataIndex: 'name',
      width: 140,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{record.logo}</span>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.code}</div>
          </div>
        </div>
      )
    },
    {
      title: '运力饱和度',
      dataIndex: 'capacity_saturation',
      width: 200,
      render: (val, record) => {
        const status = getSaturationStatus(val)
        return (
          <div>
            <Progress 
              percent={val * 100} 
              strokeColor={getSaturationColor(val)}
              size="small"
              showInfo={false}
              style={{ marginBottom: 4 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#999' }}>{(val * 100).toFixed(0)}%</span>
              <Tag color={status.color} style={{ margin: 0 }}>{status.text}</Tag>
            </div>
          </div>
        )
      }
    },
    {
      title: '准时率',
      dataIndex: 'actual_on_time_rate',
      width: 150,
      render: (val, record) => {
        const level = getQualityLevel(record.on_time_rate, 'positive')
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: level.color }}>
              {(val * 100).toFixed(1)}%
            </div>
            <Tag color={level.color === '#52c41a' ? 'green' : level.color === '#1677ff' ? 'blue' : level.color === '#faad14' ? 'orange' : 'red'} style={{ margin: 0 }}>
              {level.level}
            </Tag>
          </div>
        )
      }
    },
    {
      title: '丢件率',
      dataIndex: 'loss_rate',
      width: 140,
      render: (val) => {
        const level = getQualityLevel(val, 'negative')
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: level.color }}>
              {(val * 100).toFixed(2)}%
            </div>
          </div>
        )
      }
    },
    {
      title: '投诉率',
      dataIndex: 'complaint_rate',
      width: 140,
      render: (val) => {
        const level = getQualityLevel(val, 'negative')
        return (
          <div style={{ fontSize: 16, fontWeight: 600, color: level.color }}>
            {(val * 100).toFixed(2)}%
          </div>
        )
      }
    },
    { title: '累计订单', dataIndex: 'total_orders', width: 100 },
    { title: '已完成', dataIndex: 'delivered_orders', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status) => status === 'active' ? 
        <Tag color="green">正常</Tag> : <Tag color="default">停用</Tag>
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => {
          setSelectedPlatform(record)
          form.setFieldsValue({ capacity_saturation: Math.round(record.capacity_saturation * 100) })
          setCapacityModal(true)
        }}>
          调整运力
        </Button>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">运力质量监控</h2>
        <Button icon={<SyncOutlined spin={loading} />} onClick={loadData}>刷新数据</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="接入运力平台"
              value={platforms.length}
              suffix="家"
              prefix={<SafetyOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="平均准时率"
              value={platforms.length ? (platforms.reduce((s, p) => s + p.on_time_rate, 0) / platforms.length * 100).toFixed(1) : 0}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="平均丢件率"
              value={platforms.length ? (platforms.reduce((s, p) => s + p.loss_rate, 0) / platforms.length * 100).toFixed(2) : 0}
              suffix="%"
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="平均饱和度"
              value={platforms.length ? (platforms.reduce((s, p) => s + p.capacity_saturation, 0) / platforms.length * 100).toFixed(0) : 0}
              suffix="%"
              prefix={<WarningOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><ReactECharts option={onTimeChartOption} style={{ height: 300 }} /></Card>
        </Col>
        <Col span={8}>
          <Card><ReactECharts option={lossChartOption} style={{ height: 300 }} /></Card>
        </Col>
        <Col span={8}>
          <Card><ReactECharts option={capacityChartOption} style={{ height: 300 }} /></Card>
        </Col>
      </Row>

      <Card title="平台详细数据">
        <Table
          dataSource={platforms}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title="调整运力饱和度"
        open={capacityModal}
        onCancel={() => setCapacityModal(false)}
        footer={null}
      >
        {selectedPlatform && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{selectedPlatform.logo}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{selectedPlatform.name}</div>
                <div style={{ color: '#999', fontSize: 12 }}>{selectedPlatform.code}</div>
              </div>
            </div>
            <Form form={form} layout="vertical" onFinish={handleUpdateCapacity}>
              <Form.Item name="capacity_saturation" label="运力饱和度(%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button onClick={() => setCapacityModal(false)} style={{ marginRight: 8 }}>取消</Button>
                <Button type="primary" htmlType="submit">确认调整</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PlatformMonitor
