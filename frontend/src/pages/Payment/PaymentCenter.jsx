import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Select, DatePicker, Button, Modal, Form, Input, InputNumber, message, Space } from 'antd'
import { PayCircleOutlined, TransactionOutlined, ClockCircleOutlined, UndoOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import api from '../../api'

const { RangePicker } = DatePicker

const defaultRecords = [
  { id: 1, orderNo: 'PAY20240115001', type: '非税', amount: 500, channel: '支付宝', status: '已支付', time: '2024-01-15 10:30:00' },
  { id: 2, orderNo: 'PAY20240115002', type: '社保', amount: 1200, channel: '微信', status: '已支付', time: '2024-01-15 10:25:00' },
  { id: 3, orderNo: 'PAY20240115003', type: '医保', amount: 380, channel: '银联', status: '待支付', time: '2024-01-15 10:20:00' },
  { id: 4, orderNo: 'PAY20240114004', type: '非税', amount: 200, channel: '支付宝', status: '已退款', time: '2024-01-14 16:45:00' },
  { id: 5, orderNo: 'PAY20240114005', type: '社保', amount: 960, channel: '微信', status: '已支付', time: '2024-01-14 14:10:00' },
  { id: 6, orderNo: 'PAY20240114006', type: '医保', amount: 450, channel: '支付宝', status: '已支付', time: '2024-01-14 11:30:00' },
  { id: 7, orderNo: 'PAY20240113007', type: '非税', amount: 1000, channel: '银联', status: '已支付', time: '2024-01-13 09:00:00' },
  { id: 8, orderNo: 'PAY20240113008', type: '社保', amount: 1500, channel: '微信', status: '已退款', time: '2024-01-13 08:30:00' },
]

export default function PaymentCenter() {
  const [stats, setStats] = useState({ amount: 568900, count: 1283, pending: 45, refund: 12 })
  const [records, setRecords] = useState(defaultRecords)
  const [filtered, setFiltered] = useState(defaultRecords)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let list = [...records]
    if (typeFilter) list = list.filter((r) => r.type === typeFilter)
    if (statusFilter) list = list.filter((r) => r.status === statusFilter)
    setFiltered(list)
  }, [typeFilter, statusFilter, records])

  const loadData = async () => {
    const [statsRes, recordsRes] = await Promise.all([
      api.get('/payment/stats'),
      api.get('/payment'),
    ])
    if (statsRes.success && statsRes.data?.data) setStats(statsRes.data.data)
    if (recordsRes.success && recordsRes.data?.data) {
      setRecords(recordsRes.data.data)
      setFiltered(recordsRes.data.data)
    }
  }

  const handleCreateOrder = async () => {
    try {
      const values = await form.validateFields()
      const res = await api.post('/payment', values)
      if (res.success) {
        message.success('订单创建成功')
        const newRecord = {
          id: records.length + 1,
          orderNo: `PAY${dayjs().format('YYYYMMDD')}${String(records.length + 1).padStart(3, '0')}`,
          ...values,
          amount: Number(values.amount),
          status: '待支付',
          time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        }
        setRecords((prev) => [newRecord, ...prev])
        setModalOpen(false)
      }
    } catch {}
  }

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}笔 ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: [
        { value: 523, name: '支付宝', itemStyle: { color: '#1890ff' } },
        { value: 412, name: '微信', itemStyle: { color: '#52c41a' } },
        { value: 298, name: '银联', itemStyle: { color: '#faad14' } },
        { value: 50, name: '其他', itemStyle: { color: '#722ed1' } },
      ],
    }],
  }

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
    {
      title: '缴费类型', dataIndex: 'type', key: 'type', width: 100,
      render: (t) => {
        const colorMap = { '非税': 'blue', '社保': 'green', '医保': 'orange' }
        return <Tag color={colorMap[t] || 'default'}>{t}</Tag>
      },
    },
    { title: '金额（元）', dataIndex: 'amount', key: 'amount', width: 120, render: (a) => `¥${a.toFixed(2)}` },
    { title: '渠道', dataIndex: 'channel', key: 'channel', width: 80 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s) => {
        const colorMap = { '已支付': 'success', '待支付': 'warning', '已退款': 'error' }
        return <Tag color={colorMap[s] || 'default'}>{s}</Tag>
      },
    },
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
  ]

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="今日交易额" value={stats.amount} prefix="¥" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="今日交易笔数" value={stats.count} prefix={<TransactionOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="待支付订单" value={stats.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="退款笔数" value={stats.refund} prefix={<UndoOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title="支付记录"
            style={{ borderRadius: 8 }}
            extra={
              <Space>
                <Select placeholder="缴费类型" allowClear style={{ width: 120 }} value={typeFilter || undefined} onChange={(v) => setTypeFilter(v || '')}>
                  <Select.Option value="非税">非税</Select.Option>
                  <Select.Option value="社保">社保</Select.Option>
                  <Select.Option value="医保">医保</Select.Option>
                </Select>
                <Select placeholder="状态" allowClear style={{ width: 120 }} value={statusFilter || undefined} onChange={(v) => setStatusFilter(v || '')}>
                  <Select.Option value="已支付">已支付</Select.Option>
                  <Select.Option value="待支付">待支付</Select.Option>
                  <Select.Option value="已退款">已退款</Select.Option>
                </Select>
                <Button type="primary" onClick={() => { form.resetFields(); setModalOpen(true) }}>新建订单</Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey="id"
              size="middle"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: filtered.length,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (page, size) => setPagination({ current: page, pageSize: size }),
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="支付渠道分布" style={{ borderRadius: 8 }}>
            <ReactECharts option={pieOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Modal title="新建支付订单" open={modalOpen} onOk={handleCreateOrder} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="type" label="缴费类型" rules={[{ required: true, message: '请选择缴费类型' }]}>
            <Select placeholder="请选择">
              <Select.Option value="非税">非税</Select.Option>
              <Select.Option value="社保">社保</Select.Option>
              <Select.Option value="医保">医保</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="金额（元）" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} placeholder="请输入金额" />
          </Form.Item>
          <Form.Item name="channel" label="支付渠道" rules={[{ required: true, message: '请选择支付渠道' }]}>
            <Select placeholder="请选择">
              <Select.Option value="支付宝">支付宝</Select.Option>
              <Select.Option value="微信">微信</Select.Option>
              <Select.Option value="银联">银联</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
