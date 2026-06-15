import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Statistic, Modal, Form, Input, Select, message, Space } from 'antd'
import {
  SafetyOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  PlusOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { compensationApi, orderApi } from '../api'

const { Option } = Select

function Compensation() {
  const [list, setList] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ type: '', status: '' })
  const [manualModal, setManualModal] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadStats()
    loadList()
  }, [pagination.current, pagination.pageSize])

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
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm')
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">SLA赔付管理</h2>
        <Space>
          <Button icon={<ThunderboltOutlined />} onClick={handleCheckTimeout}>
            检测超时订单
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setManualModal(true)}>
            人工赔付
          </Button>
        </Space>
      </div>

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
    </div>
  )
}

export default Compensation
