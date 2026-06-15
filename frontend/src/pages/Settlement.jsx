import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Select, Statistic, Modal, Drawer, Descriptions, message, Space, DatePicker } from 'antd'
import {
  MoneyCollectOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  EyeOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { settlementApi, platformApi } from '../api'

const { Option } = Select
const { RangePicker } = DatePicker

function Settlement() {
  const [list, setList] = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ platform_id: '', status: '' })
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [currentSettlement, setCurrentSettlement] = useState(null)
  const [generateModal, setGenerateModal] = useState(false)
  const [generatePeriod, setGeneratePeriod] = useState(null)

  useEffect(() => {
    loadPlatforms()
    loadMonthlySummary()
    loadList()
  }, [pagination.current, pagination.pageSize])

  const loadPlatforms = async () => {
    try {
      const res = await platformApi.list()
      if (res.success) setPlatforms(res.data)
    } catch (e) { console.error(e) }
  }

  const loadMonthlySummary = async () => {
    try {
      const res = await settlementApi.monthlySummary()
      if (res.success) setMonthlySummary(res.data)
    } catch (e) { console.error(e) }
  }

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await settlementApi.list({
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
    try {
      const res = await settlementApi.detail(item.id)
      if (res.success) {
        setCurrentSettlement(res.data)
        setDetailDrawer(true)
      }
    } catch (e) {
      message.error('加载详情失败')
    }
  }

  const handleGenerate = async () => {
    if (!generatePeriod) {
      message.warning('请选择结算周期')
      return
    }
    try {
      const res = await settlementApi.generate({
        period: generatePeriod,
        ...(filters.platform_id ? { platform_id: filters.platform_id } : {})
      })
      if (res.success) {
        message.success(res.message)
        setGenerateModal(false)
        setGeneratePeriod(null)
        loadList()
        loadMonthlySummary()
      }
    } catch (e) {
      message.error(e.response?.data?.message || '生成失败')
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await settlementApi.updateStatus(id, status)
      if (res.success) {
        message.success('状态已更新')
        loadList()
        if (currentSettlement?.id === id) {
          setCurrentSettlement(res.data)
        }
      }
    } catch (e) {
      message.error('更新失败')
    }
  }

  const statusMap = {
    pending: { color: 'warning', text: '待结算' },
    processing: { color: 'processing', text: '结算中' },
    completed: { color: 'success', text: '已完成' },
    failed: { color: 'error', text: '失败' }
  }

  const chartOption = {
    title: { text: '月度结算趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: [...new Set(monthlySummary.map(m => m.period))].slice(-6) },
    yAxis: [
      { type: 'value', name: '订单数' },
      { type: 'value', name: '金额(元)' }
    ],
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: monthlySummary.slice(-6).map(m => m.total_orders),
        itemStyle: { color: '#1677ff' }
      },
      {
        name: '结算金额',
        type: 'line',
        yAxisIndex: 1,
        data: monthlySummary.slice(-6).map(m => m.total_amount?.toFixed(2)),
        itemStyle: { color: '#52c41a' },
        smooth: true
      },
      {
        name: '佣金收入',
        type: 'line',
        yAxisIndex: 1,
        data: monthlySummary.slice(-6).map(m => m.total_commission?.toFixed(2)),
        itemStyle: { color: '#faad14' },
        smooth: true
      }
    ]
  }

  const columns = [
    {
      title: '结算单号',
      dataIndex: 'settlement_no',
      width: 160,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '平台',
      dataIndex: 'platform_name',
      width: 120,
      render: (text, record) => <span>{record.platform_logo} {text}</span>
    },
    { title: '结算周期', dataIndex: 'period', width: 120 },
    { title: '订单数', dataIndex: 'total_orders', width: 100 },
    {
      title: '订单总额',
      dataIndex: 'total_amount',
      width: 120,
      render: (val) => <span>¥{val?.toFixed(2)}</span>
    },
    {
      title: '平台结算',
      dataIndex: 'settlement_amount',
      width: 120,
      render: (val) => <span style={{ color: '#1677ff' }}>¥{val?.toFixed(2)}</span>
    },
    {
      title: '佣金收入',
      dataIndex: 'commission_amount',
      width: 120,
      render: (val) => <span style={{ color: '#52c41a', fontWeight: 500 }}>¥{val?.toFixed(2)}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || {}
        return <Tag color={info.color}>{info.text || status}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, 'processing')}>
              开始结算
            </Button>
          )}
          {record.status === 'processing' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, 'completed')}>
              完成结算
            </Button>
          )}
        </Space>
      )
    }
  ]

  const totalAmount = monthlySummary.reduce((s, m) => s + (m.total_amount || 0), 0)
  const totalCommission = monthlySummary.reduce((s, m) => s + (m.total_commission || 0), 0)
  const totalOrders = monthlySummary.reduce((s, m) => s + (m.total_orders || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">多平台结算中心</h2>
        <Space>
          <Button icon={<SyncOutlined />} onClick={loadList}>刷新</Button>
          <Button type="primary" icon={<MoneyCollectOutlined />} onClick={() => setGenerateModal(true)}>
            生成结算单
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="累计结算订单"
              value={totalOrders}
              prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="累计结算金额"
              value={totalAmount}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="累计佣金收入"
              value={totalCommission}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="待结算单"
              value={list.filter(s => s.status === 'pending').length}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card><ReactECharts option={chartOption} style={{ height: 320 }} /></Card>
        </Col>
        <Col span={8}>
          <Card title="各平台结算占比">
            {platforms.map(platform => {
              const platformTotal = monthlySummary
                .filter(m => m.platform_id === platform.id)
                .reduce((s, m) => s + (m.total_amount || 0), 0)
              const percent = totalAmount > 0 ? (platformTotal / totalAmount * 100).toFixed(1) : 0
              return (
                <div key={platform.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{platform.logo} {platform.name}</span>
                    <span style={{ color: '#666' }}>¥{platformTotal.toFixed(2)} ({percent}%)</span>
                  </div>
                  <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percent}%`, 
                        background: '#1677ff',
                        borderRadius: 3
                      }} 
                    />
                  </div>
                </div>
              )
            })}
          </Card>
        </Col>
      </Row>

      <div className="filter-bar">
        <Select
          placeholder="运力平台"
          style={{ width: 180 }}
          allowClear
          value={filters.platform_id || undefined}
          onChange={v => setFilters(f => ({ ...f, platform_id: v || '' }))}
        >
          {platforms.map(p => (
            <Option key={p.id} value={p.id}>{p.logo} {p.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="结算状态"
          style={{ width: 140 }}
          allowClear
          value={filters.status || undefined}
          onChange={v => setFilters(f => ({ ...f, status: v || '' }))}
        >
          <Option value="pending">待结算</Option>
          <Option value="processing">结算中</Option>
          <Option value="completed">已完成</Option>
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

      <Drawer
        title="结算单详情"
        placement="right"
        width={520}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {currentSettlement && (
          <div>
            <Descriptions title="基本信息" column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="结算单号">
                <span style={{ fontFamily: 'monospace' }}>{currentSettlement.settlement_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="承运平台">
                {currentSettlement.platform_logo} {currentSettlement.platform_name}
              </Descriptions.Item>
              <Descriptions.Item label="结算周期">{currentSettlement.period}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentSettlement.status]?.color}>
                  {statusMap[currentSettlement.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单数">{currentSettlement.total_orders} 单</Descriptions.Item>
            </Descriptions>

            <Descriptions title="费用明细" column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单总额">
                ¥{currentSettlement.total_amount?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="应付平台">
                <span style={{ color: '#1677ff', fontSize: 16, fontWeight: 500 }}>
                  ¥{currentSettlement.settlement_amount?.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="平台佣金收入">
                <span style={{ color: '#52c41a', fontSize: 16, fontWeight: 500 }}>
                  ¥{currentSettlement.commission_amount?.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentSettlement.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              结算明细 ({currentSettlement.items?.length || 0} 条)
            </div>
            <Table
              dataSource={currentSettlement.items}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
              columns={[
                {
                  title: '订单号',
                  dataIndex: 'order_no',
                  render: t => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{t}</span>
                },
                {
                  title: '订单金额',
                  dataIndex: 'order_amount',
                  width: 100,
                  render: v => `¥${v?.toFixed(2)}`
                },
                {
                  title: '佣金',
                  dataIndex: 'commission_amount',
                  width: 80,
                  render: v => `¥${v?.toFixed(2)}`
                }
              ]}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title="生成结算单"
        open={generateModal}
        onCancel={() => { setGenerateModal(false); setGeneratePeriod(null) }}
        onOk={handleGenerate}
        okText="生成"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>选择结算周期：</div>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择月份"
            value={generatePeriod}
            onChange={setGeneratePeriod}
          >
            {[0, 1, 2, 3, 4, 5].map(i => {
              const date = dayjs().subtract(i, 'month')
              return (
                <Option key={i} value={date.format('YYYY-MM')}>
                  {date.format('YYYY年MM月')}
                </Option>
              )
            })}
          </Select>
        </div>
        {filters.platform_id && (
          <div style={{ color: '#666', fontSize: 13 }}>
            将生成指定平台的结算单
          </div>
        )}
        <div style={{ color: '#999', fontSize: 12, marginTop: 12 }}>
          系统将自动统计该周期内已完成的配送订单，按平台和商户维度生成结算单
        </div>
      </Modal>
    </div>
  )
}

export default Settlement
