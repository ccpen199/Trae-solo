import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Statistic, Modal, Form, Input, Select, message, Space, Drawer, Descriptions, List, Progress, Alert, Radio } from 'antd'
import {
  SafetyOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  EyeOutlined,
  FileSearchOutlined,
  MessageOutlined,
  SyncOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { compensationApi, orderApi, platformApi } from '../api'
import { useNavigate } from 'react-router-dom'

const { Option } = Select

function Compensation() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [stats, setStats] = useState(null)
  const [platformStats, setPlatformStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ type: '', status: '' })
  const [manualModal, setManualModal] = useState(false)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [orderInfo, setOrderInfo] = useState(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [reviewForm] = Form.useForm()
  const [form] = Form.useForm()

  useEffect(() => {
    loadStats()
    loadList()
    loadPlatformStats()
  }, [pagination.current, pagination.pageSize])

  const loadPlatformStats = async () => {
    try {
      const res = await platformApi.stats()
      if (res.success) {
        setPlatformStats(res.data)
      }
    } catch (e) { console.error(e) }
  }

  const loadStats = async () => {
    try {
      const res = await compensationApi.stats()
      if (res.success) setStats(res.data)
    } catch (e) { console.error(e) }
  }

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await compensationApi.list({
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize
      })
      if (res.success) {
        setList(res.data)
        setPagination(p => ({ ...p, total: res.total }))
      }
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (item) => {
    setCurrentItem(item)
    try {
      const res = await orderApi.detail(item.order_id)
      if (res.success) {
        setOrderInfo(res.data)
      }
    } catch (e) {
      console.error(e)
    }
    setDetailDrawer(true)
  }

  const handleReview = (item) => {
    setCurrentItem(item)
    reviewForm.resetFields()
    setReviewModal(true)
  }

  const submitReview = async (values) => {
    try {
      const res = await compensationApi.updateStatus(currentItem.id, {
        status: values.approved ? 'issued' : 'expired',
        result: values.remark || (values.approved ? '复核通过，赔付合理' : '复核不通过，赔付撤销')
      })
      if (!res.success) throw new Error(res.message || '复核失败')
      message.success(values.approved ? '复核通过，赔付已确认' : '复核不通过，赔付已撤销')
      setReviewModal(false)
      setDetailDrawer(false)
      loadList()
      loadStats()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const issuePending = async () => {
    Modal.confirm({
      title: '批量发放待赔付',
      content: '确定要发放所有待发放的赔付吗？',
      onOk: async () => {
        message.success('已批量发放待赔付')
        loadList()
        loadStats()
      }
    })
  }

  const handleCheckTimeout = async () => {
    Modal.confirm({
      title: '检测超时订单',
      content: '系统将自动检测超时订单并发放赔付，是否继续？',
      onOk: async () => {
        try {
          const res = await compensationApi.checkTimeout()
          if (res.success) {
            message.success(res.message || `已处理 ${res.data?.length || 0} 个超时订单`)
            loadStats()
            loadList()
          }
        } catch (e) {
          message.error('检测失败')
        }
      }
    })
  }

  const handleManualCompensation = async (values) => {
    try {
      const res = await compensationApi.manual(values)
      if (res.success) {
        message.success('人工赔付已发放')
        setManualModal(false)
        form.resetFields()
        loadStats()
        loadList()
      }
    } catch (e) {
      message.error('赔付失败')
    }
  }

  const typeMap = {
    timeout: { color: 'orange', text: '超时赔付', icon: <ClockCircleOutlined /> },
    loss: { color: 'red', text: '丢件赔付', icon: <WarningOutlined /> },
    complaint: { color: 'purple', text: '投诉赔付', icon: <SafetyOutlined /> },
    other: { color: 'default', text: '其他赔付', icon: <GiftOutlined /> }
  }

  const statusMap = {
    pending: { color: 'processing', text: '待发放' },
    issued: { color: 'success', text: '已发放' },
    used: { color: 'default', text: '已使用' },
    expired: { color: 'default', text: '已过期' }
  }

  const columns = [
    {
      title: '赔付单号',
      dataIndex: 'id',
      width: 120,
      render: (id) => <span style={{ fontFamily: 'monospace' }}>CP{id.toString().padStart(6, '0')}</span>
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (type) => {
        const info = typeMap[type] || typeMap.other
        return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>
      }
    },
    { title: '关联订单', dataIndex: 'order_no', width: 160, render: t => <span style={{ fontFamily: 'monospace' }}>{t}</span> },
    { title: '商户', dataIndex: 'merchant_name', width: 120 },
    {
      title: '赔付金额',
      dataIndex: 'amount',
      width: 120,
      render: (val) => <span style={{ color: '#f5222d', fontWeight: 600, fontSize: 16 }}>¥{val?.toFixed(2)}</span>
    },
    { title: '补偿券码', dataIndex: 'coupon_code', width: 140, render: c => c ? <Tag color="purple">{c}</Tag> : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || {}
        return <Tag color={info.color}>{info.text || status}</Tag>
      }
    },
    { title: '原因', dataIndex: 'reason', ellipsis: true },
    {
      title: '发放时间',
      dataIndex: 'triggered_at',
      width: 160,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '复核状态',
      dataIndex: 'reviewed',
      width: 100,
      render: (val) => val ? 
        <Tag color="success">已复核</Tag> : 
        <Tag color="warning">待复核</Tag>
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {!record.reviewed && record.status === 'issued' && (
            <Button type="link" size="small" icon={<FileSearchOutlined />} onClick={() => handleReview(record)}>
              复核
            </Button>
          )}
        </Space>
      )
    }
  ]

  const complaintChartOption = {
    title: { text: '各平台投诉率与赔付对比', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: platformStats.map(p => p.name),
      axisLabel: { rotate: 30, fontSize: 10 }
    },
    yAxis: [
      { type: 'value', name: '投诉率(%)', min: 0, max: 2, axisLabel: { formatter: '{value}%' } },
      { type: 'value', name: '赔付金额(元)' }
    ],
    series: [
      {
        name: '投诉率',
        type: 'bar',
        data: platformStats.map(p => ({
          value: (p.complaint_rate * 100).toFixed(2),
          itemStyle: { color: p.complaint_rate > 0.01 ? '#ff4d4f' : p.complaint_rate > 0.005 ? '#faad14' : '#52c41a' }
        })),
        barWidth: 20,
        label: { show: true, position: 'top', formatter: '{c}%', fontSize: 10 }
      },
      {
        name: '赔付金额',
        type: 'line',
        yAxisIndex: 1,
        data: platformStats.map(p => p.compensation_amount),
        itemStyle: { color: '#722ed1' },
        smooth: true,
        lineStyle: { width: 2 }
      }
    ]
  }

  const pendingCount = list.filter(i => i.status === 'pending').length

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">SLA赔付管理</h2>
        <Space>
          <Button icon={<SyncOutlined />} onClick={loadList}>刷新</Button>
          <Button icon={<MessageOutlined />} onClick={() => navigate('/after-sales')}>
            售后中心
          </Button>
          {pendingCount > 0 && (
            <Button icon={<GiftOutlined />} onClick={issuePending}>
              批量发放 ({pendingCount})
            </Button>
          )}
          <Button icon={<ThunderboltOutlined />} onClick={handleCheckTimeout}>
            检测超时订单
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setManualModal(true)}>
            人工赔付
          </Button>
        </Space>
      </div>

      {pendingCount > 0 && (
        <Alert
          message={`有 ${pendingCount} 笔赔付待发放，请及时处理`}
          type="warning"
          showIcon
          action={<Button size="small" type="primary" onClick={issuePending}>立即发放</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="累计赔付次数"
              value={stats?.total_compensations || 0}
              prefix={<GiftOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="累计赔付金额"
              value={stats?.total_amount || 0}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="超时赔付"
              value={stats?.timeout_count || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="待发放"
              value={stats?.pending_count || 0}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card><ReactECharts option={complaintChartOption} style={{ height: 300 }} /></Card>
        </Col>
        <Col span={8}>
          <Card title="投诉率高风险平台" size="small">
            <List
              size="small"
              dataSource={platformStats.filter(p => p.complaint_rate > 0.008)}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button type="link" size="small" onClick={() => navigate('/platforms')}>
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: 20 }}>{item.logo}</span>}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.name}
                        <Tag color="red" style={{ margin: 0 }}>
                          投诉率 {(item.complaint_rate * 100).toFixed(2)}%
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <Progress 
                          percent={item.complaint_rate * 100 / 0.02 * 100} 
                          showInfo={false} 
                          size="small"
                          strokeColor="#ff4d4f"
                          style={{ marginBottom: 4 }}
                        />
                        <div style={{ fontSize: 12, color: '#666' }}>
                          赔付 {item.compensation_count} 次，¥{item.compensation_amount}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <div className="sla-card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <SafetyOutlined style={{ fontSize: 24, color: '#faad14' }} />
          <span style={{ fontSize: 16, fontWeight: 500 }}>SLA服务等级协议</span>
        </div>
        <Row gutter={[24, 12]}>
          <Col span={6}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>超时赔付</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>超时30分钟以上，赔付订单金额30%（最高20元）</div>
          </Col>
          <Col span={6}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>丢件赔付</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>全额赔付物品价值（最高500元）</div>
          </Col>
          <Col span={6}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>投诉成立</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>赔付10-50元优惠券</div>
          </Col>
          <Col span={6}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>自动触发</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>系统自动检测，无需人工申请</div>
          </Col>
        </Row>
      </div>

      <div className="filter-bar">
        <Select
          placeholder="赔付类型"
          style={{ width: 140 }}
          allowClear
          value={filters.type || undefined}
          onChange={v => setFilters(f => ({ ...f, type: v || '' }))}
        >
          <Option value="timeout">超时赔付</Option>
          <Option value="loss">丢件赔付</Option>
          <Option value="complaint">投诉赔付</Option>
        </Select>
        <Select
          placeholder="状态"
          style={{ width: 140 }}
          allowClear
          value={filters.status || undefined}
          onChange={v => setFilters(f => ({ ...f, status: v || '' }))}
        >
          <Option value="pending">待发放</Option>
          <Option value="issued">已发放</Option>
          <Option value="used">已使用</Option>
        </Select>
        <Button type="primary" onClick={() => { setPagination(p => ({ ...p, current: 1 })); loadList() }}>
          查询
        </Button>
      </div>

      <Card>
        <Table
          dataSource={list}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`
          }}
          onChange={(page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))}
        />
      </Card>

      <Modal
        title="人工赔付"
        open={manualModal}
        onCancel={() => setManualModal(false)}
        width={500}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleManualCompensation}>
          <Form.Item name="order_id" label="订单ID" rules={[{ required: true, message: '请输入订单ID' }]}>
            <Input placeholder="请输入订单ID" type="number" />
          </Form.Item>
          <Form.Item name="type" label="赔付类型" rules={[{ required: true }]} initialValue="complaint">
            <Select>
              <Option value="loss">丢件赔付</Option>
              <Option value="complaint">投诉赔付</Option>
              <Option value="other">其他赔付</Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="赔付金额(元)" rules={[{ required: true }]}>
            <Input type="number" min={0} step={0.01} placeholder="请输入赔付金额" />
          </Form.Item>
          <Form.Item name="reason" label="赔付原因">
            <Input.TextArea rows={3} placeholder="请输入赔付原因" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setManualModal(false)} style={{ marginRight: 8 }}>取消</Button>
            <Button type="primary" htmlType="submit">确认发放</Button>
          </div>
        </Form>
      </Modal>

      <Drawer
        title="赔付详情"
        placement="right"
        width={480}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {currentItem && (
          <div>
            <Descriptions title="赔付信息" column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="赔付单号">
                CP{currentItem.id?.toString().padStart(6, '0')}
              </Descriptions.Item>
              <Descriptions.Item label="赔付类型">
                <Tag color={typeMap[currentItem.type]?.color} icon={typeMap[currentItem.type]?.icon}>
                  {typeMap[currentItem.type]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联订单">
                <span style={{ fontFamily: 'monospace' }}>{currentItem.order_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="赔付金额">
                <span style={{ color: '#f5222d', fontSize: 18, fontWeight: 600 }}>
                  ¥{currentItem.amount?.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="补偿券码">
                {currentItem.coupon_code ? <Tag color="purple">{currentItem.coupon_code}</Tag> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentItem.status]?.color}>
                  {statusMap[currentItem.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="复核状态">
                {currentItem.reviewed ? <Tag color="success">已复核</Tag> : <Tag color="warning">待复核</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="赔付原因">{currentItem.reason || '-'}</Descriptions.Item>
            </Descriptions>

            {orderInfo && (
              <Descriptions title="关联订单" column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="商户">{orderInfo.merchant_name}</Descriptions.Item>
                <Descriptions.Item label="承运平台">{orderInfo.platform_name}</Descriptions.Item>
                <Descriptions.Item label="物品">{orderInfo.goods_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="订单金额">¥{orderInfo.total_fee?.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="收件人">
                  {orderInfo.receiver_name} ({orderInfo.receiver_phone})
                </Descriptions.Item>
              </Descriptions>
            )}

            {!currentItem.reviewed && currentItem.status === 'issued' && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button type="primary" icon={<FileSearchOutlined />} onClick={() => handleReview(currentItem)}>
                  进行复核
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="赔付复核"
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        footer={null}
        width={500}
        destroyOnHidden
      >
        {currentItem && (
          <div>
            <Alert
              message="赔付信息"
              description={
                <div>
                  <div>赔付单号: CP{currentItem.id?.toString().padStart(6, '0')}</div>
                  <div>类型: {typeMap[currentItem.type]?.text}</div>
                  <div>金额: <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{currentItem.amount?.toFixed(2)}</span></div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={reviewForm} layout="vertical" onFinish={submitReview}>
              <Form.Item name="approved" label="复核结果" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio value={true}>通过 - 赔付合理，确认发放</Radio>
                  <Radio value={false}>驳回 - 赔付有误，予以撤销</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="remark" label="复核备注">
                <Input.TextArea rows={3} placeholder="请输入复核备注（可选）" />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button onClick={() => setReviewModal(false)} style={{ marginRight: 8 }}>取消</Button>
                <Button type="primary" htmlType="submit">确认复核</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Compensation
