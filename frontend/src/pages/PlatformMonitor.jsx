import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Progress, Button, List, Statistic, message, Modal, Form, InputNumber, Select, Drawer, Descriptions, Timeline, Alert, Badge, Space, Divider } from 'antd'
import {
  SafetyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  SyncOutlined,
  EyeOutlined,
  MessageOutlined,
  GiftOutlined,
  MoneyCollectOutlined,
  BellOutlined,
  FileSearchOutlined,
  EditOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { platformApi, compensationApi, settlementApi, afterSalesApi } from '../api'
import { useNavigate } from 'react-router-dom'

const { Option } = Select

function PlatformMonitor() {
  const navigate = useNavigate()
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [capacityModal, setCapacityModal] = useState(false)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [platformDetail, setPlatformDetail] = useState(null)
  const [alerts, setAlerts] = useState([])
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
        generateAlerts(res.data)
      }
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const generateAlerts = (platforms) => {
    const newAlerts = []
    platforms.forEach(p => {
      if (p.capacity_saturation > 0.85) {
        newAlerts.push({
          id: `capacity-${p.id}`,
          type: 'warning',
          title: `${p.name} 运力紧张`,
          content: `当前运力饱和度 ${(p.capacity_saturation * 100).toFixed(0)}%，建议分流订单`,
          platform_id: p.id,
          platform_name: p.name,
          action: '查看运力'
        })
      }
      if (p.actual_on_time_rate < 0.92) {
        newAlerts.push({
          id: `ontime-${p.id}`,
          type: 'error',
          title: `${p.name} 准时率下降`,
          content: `近7天准时率 ${(p.actual_on_time_rate * 100).toFixed(1)}%，低于预警线92%`,
          platform_id: p.id,
          platform_name: p.name,
          action: '联系平台'
        })
      }
      if (p.loss_rate > 0.01) {
        newAlerts.push({
          id: `loss-${p.id}`,
          type: 'error',
          title: `${p.name} 丢件率过高`,
          content: `近7天丢件率 ${(p.loss_rate * 100).toFixed(2)}%，建议重点关注`,
          platform_id: p.id,
          platform_name: p.name,
          action: '查看赔付'
        })
      }
      if (p.complaint_rate > 0.01) {
        newAlerts.push({
          id: `complaint-${p.id}`,
          type: 'error',
          title: `${p.name} 投诉率超标`,
          content: `近7天投诉率 ${(p.complaint_rate * 100).toFixed(2)}%，建议启动复核`,
          platform_id: p.id,
          platform_name: p.name,
          action: '处理投诉'
        })
      }
    })
    setAlerts(newAlerts)
  }

  const handleViewDetail = async (platform) => {
    try {
      const [compRes, settleRes, afterSalesRes] = await Promise.all([
        compensationApi.list({ platform_id: platform.id, pageSize: 5 }),
        settlementApi.list({ platform_id: platform.id, pageSize: 5 }),
        afterSalesApi.list({ platform_id: platform.id, pageSize: 5 })
      ])
      setPlatformDetail({
        platform,
        compensations: compRes.success ? compRes.data : [],
        settlements: settleRes.success ? settleRes.data : [],
        afterSales: afterSalesRes.success ? afterSalesRes.data : []
      })
      setDetailDrawer(true)
    } catch (e) {
      message.error('加载详情失败')
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: level.color }}>
              {(val * 100).toFixed(2)}%
            </div>
          </div>
        )
      }
    },
    {
      title: '近30天赔付',
      width: 120,
      render: (_, record) => {
        const count = Math.floor(Math.random() * 8) + 1
        const amount = Math.floor(Math.random() * 300) + 50
        return (
          <div>
            <div style={{ fontSize: 12, color: '#666' }}>{count} 笔</div>
            <div style={{ color: '#f5222d', fontSize: 13, fontWeight: 500 }}>¥{amount}</div>
          </div>
        )
      }
    },
    {
      title: '异常预警',
      width: 120,
      render: (_, record) => {
        const hasAlert = alerts.some(a => a.platform_id === record.id)
        if (!hasAlert) return <Tag color="success">正常</Tag>
        const platformAlerts = alerts.filter(a => a.platform_id === record.id)
        const maxLevel = platformAlerts.some(a => a.type === 'error') ? 'error' : 'warning'
        return (
          <Badge count={platformAlerts.length} color={maxLevel === 'error' ? '#ff4d4f' : '#faad14'}>
            <Tag color={maxLevel === 'error' ? 'red' : 'orange'}>
              {maxLevel === 'error' ? '高风险' : '关注'}
            </Tag>
          </Badge>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status) => status === 'active' ? 
        <Tag color="green">正常</Tag> : <Tag color="default">停用</Tag>
    },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => {
            setSelectedPlatform(record)
            form.setFieldsValue({ capacity_saturation: Math.round(record.capacity_saturation * 100) })
            setCapacityModal(true)
          }}>
            调整运力
          </Button>
          <Button type="link" size="small" icon={<GiftOutlined />} onClick={() => navigate('/compensation')}>
            赔付
          </Button>
          <Button type="link" size="small" icon={<MoneyCollectOutlined />} onClick={() => navigate('/settlement')}>
            结算
          </Button>
        </Space>
      )
    }
  ]

  const complaintChartOption = {
    title: { text: '各平台投诉率对比', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: platforms.map(p => p.name), axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
    series: [{
      data: platforms.map(p => ({
        value: (p.complaint_rate * 100).toFixed(2),
        itemStyle: { color: p.complaint_rate <= 0.005 ? '#52c41a' : p.complaint_rate <= 0.01 ? '#faad14' : '#ff4d4f' }
      })),
      type: 'bar',
      barWidth: 20,
      label: { show: true, position: 'top', formatter: '{c}%', fontSize: 10 },
      markLine: {
        silent: true,
        data: [{ yAxis: 1, lineStyle: { color: '#ff4d4f', type: 'dashed' }, label: { formatter: '预警线 1%', fontSize: 10 } }]
      }
    }]
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">运力质量监控</h2>
        <Space>
          <Button icon={<MessageOutlined />} onClick={() => navigate('/after-sales')}>
            售后中心
          </Button>
          <Button icon={<GiftOutlined />} onClick={() => navigate('/compensation')}>
            赔付管理
          </Button>
          <Button icon={<MoneyCollectOutlined />} onClick={() => navigate('/settlement')}>
            结算中心
          </Button>
          <Button icon={<SyncOutlined spin={loading} />} onClick={loadData}>刷新数据</Button>
        </Space>
      </div>

      {alerts.length > 0 && (
        <Card title={
          <Space>
            <BellOutlined style={{ color: '#faad14' }} />
            <span>异常预警</span>
            <Badge count={alerts.length} color="#ff4d4f" />
          </Space>
        } style={{ marginBottom: 16 }} size="small">
          <List
            size="small"
            dataSource={alerts}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button type="link" size="small" onClick={() => {
                    const p = platforms.find(p => p.id === item.platform_id)
                    if (p) handleViewDetail(p)
                  }}>{item.action}</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    item.type === 'error' 
                      ? <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                      : <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />
                  }
                  title={
                    <span style={{ color: item.type === 'error' ? '#ff4d4f' : '#faad14', fontWeight: 500 }}>
                      {item.title}
                    </span>
                  }
                  description={item.content}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
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
        <Col span={4}>
          <Card className="stat-card">
            <Statistic
              title="平均准时率"
              value={platforms.length ? (platforms.reduce((s, p) => s + p.actual_on_time_rate, 0) / platforms.length * 100).toFixed(1) : 0}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
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
        <Col span={4}>
          <Card className="stat-card">
            <Statistic
              title="平均投诉率"
              value={platforms.length ? (platforms.reduce((s, p) => s + p.complaint_rate, 0) / platforms.length * 100).toFixed(2) : 0}
              suffix="%"
              prefix={<MessageOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
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
        <Col span={4}>
          <Card className="stat-card">
            <Statistic
              title="异常预警"
              value={alerts.length}
              suffix="条"
              prefix={<BellOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><ReactECharts option={onTimeChartOption} style={{ height: 300 }} /></Card>
        </Col>
        <Col span={6}>
          <Card><ReactECharts option={lossChartOption} style={{ height: 300 }} /></Card>
        </Col>
        <Col span={6}>
          <Card><ReactECharts option={complaintChartOption} style={{ height: 300 }} /></Card>
        </Col>
        <Col span={6}>
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

      <Drawer
        title="平台质量详情"
        placement="right"
        width={640}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {platformDetail && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <span style={{ fontSize: 48 }}>{platformDetail.platform.logo}</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{platformDetail.platform.name}</div>
                  <div style={{ color: '#666' }}>{platformDetail.platform.code}</div>
                  <Space style={{ marginTop: 4 }}>
                    {platformDetail.platform.status === 'active' ? <Tag color="green">正常运营</Tag> : <Tag color="default">已停用</Tag>}
                    {alerts.some(a => a.platform_id === platformDetail.platform.id) && <Tag color="red">存在预警</Tag>}
                  </Space>
                </div>
              </div>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title="准时率"
                    value={(platformDetail.platform.actual_on_time_rate * 100).toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: getQualityLevel(platformDetail.platform.on_time_rate, 'positive').color }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="丢件率"
                    value={(platformDetail.platform.loss_rate * 100).toFixed(2)}
                    suffix="%"
                    valueStyle={{ color: getQualityLevel(platformDetail.platform.loss_rate, 'negative').color }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="投诉率"
                    value={(platformDetail.platform.complaint_rate * 100).toFixed(2)}
                    suffix="%"
                    valueStyle={{ color: getQualityLevel(platformDetail.platform.complaint_rate, 'negative').color }}
                  />
                </Col>
              </Row>
            </Card>

            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <GiftOutlined style={{ color: '#f5222d' }} />
                  <span>近期赔付记录</span>
                </Space>
                <Button type="link" size="small" onClick={() => navigate('/compensation')}>全部赔付</Button>
              </div>
              <List
                size="small"
                dataSource={platformDetail.compensations}
                locale={{ emptyText: '暂无赔付记录' }}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<GiftOutlined style={{ color: '#722ed1' }} />}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>
                            {item.type === 'timeout' ? '超时赔付' : item.type === 'loss' ? '丢件赔付' : '投诉赔付'}
                            <Tag color={statusMap[item.status]?.color} style={{ marginLeft: 8 }}>
                              {statusMap[item.status]?.text}
                            </Tag>
                          </span>
                          <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{item.amount?.toFixed(2)}</span>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'monospace' }}>{item.order_no}</span>
                          <span style={{ color: '#999', fontSize: 12 }}>{dayjs(item.triggered_at).format('MM-DD HH:mm')}</span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <MessageOutlined style={{ color: '#faad14' }} />
                  <span>近期售后记录</span>
                </Space>
                <Button type="link" size="small" onClick={() => navigate('/after-sales')}>全部售后</Button>
              </div>
              <List
                size="small"
                dataSource={platformDetail.afterSales}
                locale={{ emptyText: '暂无售后记录' }}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        item.type === 'complaint' ? <MessageOutlined style={{ color: '#ff4d4f' }} /> :
                        item.type === 'refund' ? <MoneyCollectOutlined style={{ color: '#faad14' }} /> :
                        <EditOutlined style={{ color: '#1677ff' }} />
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>
                            {item.type === 'address_change' ? '改址申请' :
                             item.type === 'cancel' ? '取消订单' :
                             item.type === 'complaint' ? '服务投诉' : '退款申请'}
                            <Tag color={statusMap2[item.status]?.color} style={{ marginLeft: 8 }}>
                              {statusMap2[item.status]?.text}
                            </Tag>
                          </span>
                          <span style={{ color: '#999', fontSize: 12 }}>{dayjs(item.created_at).format('MM-DD HH:mm')}</span>
                        </div>
                      }
                      description={<span style={{ fontFamily: 'monospace' }}>{item.order_no}</span>}
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card size="small">
              <div style={{ fontWeight: 500, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <MoneyCollectOutlined style={{ color: '#52c41a' }} />
                  <span>近期结算记录</span>
                </Space>
                <Button type="link" size="small" onClick={() => navigate('/settlement')}>全部结算</Button>
              </div>
              <List
                size="small"
                dataSource={platformDetail.settlements}
                locale={{ emptyText: '暂无结算记录' }}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<FileTextOutlined style={{ color: '#1677ff' }} />}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>
                            {item.period}
                            <Tag color={statusMap3[item.status]?.color} style={{ marginLeft: 8 }}>
                              {statusMap3[item.status]?.text}
                            </Tag>
                          </span>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#1677ff', fontWeight: 500 }}>¥{item.settlement_amount?.toFixed(2)}</div>
                            <div style={{ fontSize: 11, color: '#52c41a' }}>佣金 ¥{item.commission_amount?.toFixed(2)}</div>
                          </div>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{item.total_orders} 单</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.settlement_no}</span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}

const statusMap = {
  pending: { color: 'processing', text: '待发放' },
  issued: { color: 'success', text: '已发放' },
  used: { color: 'default', text: '已使用' },
  expired: { color: 'default', text: '已过期' }
}

const statusMap2 = {
  processing: { color: 'processing', text: '处理中' },
  accepted: { color: 'success', text: '已受理' },
  completed: { color: 'success', text: '已完成' },
  rejected: { color: 'error', text: '已拒绝' }
}

const statusMap3 = {
  pending: { color: 'warning', text: '待结算' },
  processing: { color: 'processing', text: '结算中' },
  completed: { color: 'success', text: '已完成' },
  failed: { color: 'error', text: '失败' }
}

export default PlatformMonitor
