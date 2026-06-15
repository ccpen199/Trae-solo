import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Select, Statistic, Modal, Drawer, Descriptions, message, Space, DatePicker, List, Progress, Alert, Steps, Checkbox, Form, Input, InputNumber, Radio, Divider } from 'antd'
import {
  MoneyCollectOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  FileSearchOutlined,
  FileDoneOutlined,
  PayCircleOutlined,
  ReconciliationOutlined,
  PrinterOutlined,
  GiftOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { settlementApi, platformApi, compensationApi } from '../api'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { RangePicker } = DatePicker
const { Step } = Steps
const { TextArea } = Input

function Settlement() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [platformCompensations, setPlatformCompensations] = useState({})
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ platform_id: '', status: '' })
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [currentSettlement, setCurrentSettlement] = useState(null)
  const [generateModal, setGenerateModal] = useState(false)
  const [generatePeriod, setGeneratePeriod] = useState(null)
  const [reconcileModal, setReconcileModal] = useState(false)
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [reconcileForm] = Form.useForm()
  const [invoiceForm] = Form.useForm()
  const [paymentForm] = Form.useForm()

  useEffect(() => {
    loadPlatforms()
    loadMonthlySummary()
    loadList()
    loadPlatformCompensations()
  }, [pagination.current, pagination.pageSize])

  const loadPlatformCompensations = async () => {
    try {
      const res = await compensationApi.list({ pageSize: 100 })
      if (res.success) {
        const compMap = {}
        ;(res.data || []).forEach(c => {
          if (!compMap[c.platform_id]) compMap[c.platform_id] = []
          compMap[c.platform_id].push(c)
        })
        setPlatformCompensations(compMap)
      }
    } catch (e) { console.error(e) }
  }

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

  const handleReconcile = (item) => {
    setCurrentSettlement(item)
    reconcileForm.resetFields()
    setReconcileModal(true)
  }

  const submitReconcile = async (values) => {
    try {
      if (values.matched) {
        await handleUpdateStatus(currentSettlement.id, 'processing')
        message.success('对账完成，已进入结算流程')
      } else {
        message.warning('对账差异已记录，请联系平台处理')
      }
      setReconcileModal(false)
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleInvoice = (item) => {
    setCurrentSettlement(item)
    invoiceForm.resetFields()
    invoiceForm.setFieldsValue({
      title: `${item.platform_name} ${item.period} 服务费`,
      amount: item.commission_amount,
      type: 'company'
    })
    setInvoiceModal(true)
  }

  const submitInvoice = async (values) => {
    try {
      message.success('发票申请已提交，将在3个工作日内开具')
      setInvoiceModal(false)
      loadList()
    } catch (e) {
      message.error('申请失败')
    }
  }

  const handlePayment = (item) => {
    setCurrentSettlement(item)
    paymentForm.resetFields()
    setPaymentModal(true)
  }

  const submitPayment = async (values) => {
    try {
      await handleUpdateStatus(currentSettlement.id, 'completed')
      message.success(`已完成付款 ¥${currentSettlement.settlement_amount?.toFixed(2)}`)
      setPaymentModal(false)
      loadList()
      loadMonthlySummary()
    } catch (e) {
      message.error('付款失败')
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
      width: 300,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<ReconciliationOutlined />} onClick={() => handleReconcile(record)}>
                对账
              </Button>
            </>
          )}
          {record.status === 'processing' && (
            <>
              <Button type="link" size="small" icon={<PayCircleOutlined />} onClick={() => handlePayment(record)}>
                付款
              </Button>
              <Button type="link" size="small" icon={<FileDoneOutlined />} onClick={() => handleInvoice(record)}>
                开发票
              </Button>
            </>
          )}
          {record.status === 'completed' && (
            <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => message.info('已导出结算单')}>
              导出
            </Button>
          )}
        </Space>
      )
    }
  ]

  const getStatusStep = (status) => {
    switch (status) {
      case 'pending': return 0
      case 'processing': return 1
      case 'completed': return 2
      default: return 0
    }
  }

  const totalAmount = monthlySummary.reduce((s, m) => s + (m.total_amount || 0), 0)
  const totalCommission = monthlySummary.reduce((s, m) => s + (m.total_commission || 0), 0)
  const totalOrders = monthlySummary.reduce((s, m) => s + (m.total_orders || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">多平台结算中心</h2>
        <Space>
          <Button icon={<SyncOutlined />} onClick={loadList}>刷新</Button>
          <Button icon={<FileSearchOutlined />} onClick={() => navigate('/platforms')}>
            运力监控
          </Button>
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
          <Card
            title="各平台结算与赔付"
            extra={<Button type="link" size="small" icon={<GiftOutlined />} onClick={() => navigate('/compensation')}>赔付管理</Button>}
          >
            {platforms.map(platform => {
              const platformTotal = monthlySummary
                .filter(m => m.platform_id === platform.id)
                .reduce((s, m) => s + (m.total_amount || 0), 0)
              const percent = totalAmount > 0 ? (platformTotal / totalAmount * 100).toFixed(1) : 0
              const platCompensations = platformCompensations[platform.id] || []
              const compTotal = platCompensations.reduce((s, c) => s + (c.amount || 0), 0)
              const compCount = platCompensations.length
              return (
                <div key={platform.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                    <span>{platform.logo} {platform.name}</span>
                    <Space size={8} wrap>
                      {compCount > 0 && (
                        <Tag color="purple" style={{ margin: 0 }} onClick={() => navigate('/compensation')}>
                          <GiftOutlined /> {compCount}笔 ¥{compTotal.toFixed(2)}
                        </Tag>
                      )}
                      <span style={{ color: '#666', fontSize: 12 }}>¥{platformTotal.toFixed(2)} ({percent}%)</span>
                    </Space>
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
        width={560}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {currentSettlement && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Steps current={getStatusStep(currentSettlement.status)} size="small">
                <Step title="待对账" description={currentSettlement.status === 'pending' ? '当前' : '已完成'} />
                <Step title="结算中" description={currentSettlement.status === 'processing' ? '当前' : currentSettlement.status === 'pending' ? '待处理' : '已完成'} />
                <Step title="已完成" description={currentSettlement.status === 'completed' ? '当前' : '待处理'} />
              </Steps>
            </Card>

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

            <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'center' }} wrap>
              {currentSettlement.status === 'pending' && (
                <Button type="primary" icon={<ReconciliationOutlined />} onClick={() => { setDetailDrawer(false); handleReconcile(currentSettlement); }}>
                  开始对账
                </Button>
              )}
              {currentSettlement.status === 'processing' && (
                <>
                  <Button type="primary" icon={<PayCircleOutlined />} onClick={() => { setDetailDrawer(false); handlePayment(currentSettlement); }}>
                    确认付款
                  </Button>
                  <Button icon={<FileDoneOutlined />} onClick={() => { setDetailDrawer(false); handleInvoice(currentSettlement); }}>
                    申请发票
                  </Button>
                </>
              )}
              {currentSettlement.status === 'completed' && (
                <Button icon={<PrinterOutlined />} onClick={() => message.info('已导出结算单')}>
                  导出结算单
                </Button>
              )}
              <Button icon={<GiftOutlined />} onClick={() => navigate('/compensation')}>
                查看赔付记录
              </Button>
            </Space>

            {(platformCompensations[currentSettlement.platform_id]?.length || 0) > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="SLA赔付关联"
                description={
                  <div>
                    <div>本周期内该平台发生 {platformCompensations[currentSettlement.platform_id].length} 笔赔付，合计 ¥{platformCompensations[currentSettlement.platform_id].reduce((s, c) => s + (c.amount || 0), 0).toFixed(2)}</div>
                    <div style={{ marginTop: 4 }}>
                      <Button type="link" size="small" icon={<GiftOutlined />} onClick={() => navigate('/compensation')}>
                        复查赔付记录
                      </Button>
                    </div>
                  </div>
                }
              />
            )}

            <div style={{ marginBottom: 8, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>结算明细 - 按单抽佣 ({currentSettlement.items?.length || 0} 条)</span>
              <Space>
                <Tag color="blue">
                  平台佣金率: {((currentSettlement.commission_amount / currentSettlement.total_amount) * 100).toFixed(1)}%
                </Tag>
              </Space>
            </div>
            <Table
              dataSource={currentSettlement.items}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 250 }}
              columns={[
                {
                  title: '订单号',
                  dataIndex: 'order_no',
                  width: 130,
                  render: t => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{t}</span>
                },
                {
                  title: '配送距离',
                  dataIndex: 'distance',
                  width: 80,
                  render: v => v ? `${v}km` : '-'
                },
                {
                  title: '订单金额',
                  dataIndex: 'order_amount',
                  width: 100,
                  render: v => <span style={{ color: '#1677ff' }}>¥{v?.toFixed(2)}</span>
                },
                {
                  title: '抽佣率',
                  width: 70,
                  render: (_, r) => <span style={{ color: '#722ed1' }}>{((r.commission_amount / r.order_amount) * 100).toFixed(1)}%</span>
                },
                {
                  title: '平台佣金',
                  dataIndex: 'commission_amount',
                  width: 90,
                  render: v => <span style={{ color: '#52c41a', fontWeight: 500 }}>¥{v?.toFixed(2)}</span>
                },
                {
                  title: '应付平台',
                  width: 100,
                  render: (_, r) => <span style={{ color: '#fa8c16' }}>¥{(r.order_amount - r.commission_amount).toFixed(2)}</span>
                }
              ]}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title="对账确认 - 月结对账明细"
        open={reconcileModal}
        onCancel={() => setReconcileModal(false)}
        footer={null}
        width={650}
        destroyOnClose
      >
        {currentSettlement && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="结算单号">{currentSettlement.settlement_no}</Descriptions.Item>
              <Descriptions.Item label="承运平台">{currentSettlement.platform_logo} {currentSettlement.platform_name}</Descriptions.Item>
              <Descriptions.Item label="结算周期">{currentSettlement.period}</Descriptions.Item>
              <Descriptions.Item label="订单数">{currentSettlement.total_orders} 单</Descriptions.Item>
              <Descriptions.Item label="订单总额">¥{currentSettlement.total_amount?.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="佣金收入">¥{currentSettlement.commission_amount?.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="应付平台" span={2}>
                <span style={{ color: '#1677ff', fontSize: 18, fontWeight: 700 }}>
                  ¥{currentSettlement.settlement_amount?.toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            {(platformCompensations[currentSettlement.platform_id]?.length || 0) > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="SLA赔付异常差异提醒"
                description={
                  <div>
                    <div>
                      本周期内该平台发生 <b>{platformCompensations[currentSettlement.platform_id].length}</b> 笔SLA赔付，
                      合计 <b style={{ color: '#ff4d4f' }}>¥{platformCompensations[currentSettlement.platform_id].reduce((s, c) => s + (c.amount || 0), 0).toFixed(2)}</b>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      建议在结算前复查赔付记录，确保异常处理闭环。
                      <Button type="link" size="small" icon={<GiftOutlined />} onClick={() => navigate('/compensation')}>
                        复查赔付记录
                      </Button>
                    </div>
                  </div>
                }
              />
            )}

            <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
              <strong>对账明细预览（前5条）：</strong>
            </div>
            <Table
              dataSource={currentSettlement.items?.slice(0, 5)}
              rowKey="id"
              size="small"
              pagination={false}
              bordered
            >
              <Table.Column
                title="订单号"
                dataIndex="order_no"
                width={130}
                render={t => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{t}</span>}
              />
              <Table.Column
                title="配送距离"
                dataIndex="distance"
                width={70}
                render={v => v ? `${v}km` : '-'}
              />
              <Table.Column
                title="订单金额"
                dataIndex="order_amount"
                width={85}
                render={v => `¥${v?.toFixed(2)}`}
              />
              <Table.Column
                title="抽佣率"
                width={65}
                render={(_, r) => `${((r.commission_amount / r.order_amount) * 100).toFixed(1)}%`}
              />
              <Table.Column
                title="佣金"
                dataIndex="commission_amount"
                width={75}
                render={v => `¥${v?.toFixed(2)}`}
              />
              <Table.Column
                title="应付平台"
                width={85}
                render={(_, r) => `¥{(r.order_amount - r.commission_amount).toFixed(2)}`}
              />
            </Table>
            {currentSettlement.items?.length > 5 && (
              <div style={{ textAlign: 'center', padding: '8px 0', color: '#999', fontSize: 12 }}>
                ... 还有 {currentSettlement.items.length - 5} 条，详情请查看完整结算单
              </div>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <Form form={reconcileForm} layout="vertical" onFinish={submitReconcile}>
              <Form.Item name="matched" label="对账结果" rules={[{ required: true }]} initialValue={true}>
                <Radio.Group>
                  <Radio value={true}>✅ 账实一致，确认对账</Radio>
                  <Radio value={false}>⚠️ 存在差异，标记待处理</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.matched !== curr.matched}>
                {({ getFieldValue }) => !getFieldValue('matched') && (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="diff_type" label="差异类型" rules={[{ required: true }]}>
                          <Select placeholder="请选择差异类型">
                            <Option value="amount">金额差异</Option>
                            <Option value="count">订单数差异</Option>
                            <Option value="compensation">赔付金额差异</Option>
                            <Option value="other">其他差异</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="diff_amount" label="差异金额(元)" rules={[{ required: true }]}>
                          <InputNumber step={0.01} style={{ width: '100%' }} placeholder="请输入差异金额" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )}
              </Form.Item>
              <Form.Item name="remark" label="备注说明">
                <Input.TextArea rows={2} placeholder="请填写对账备注或差异原因（可选）" />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button onClick={() => setReconcileModal(false)} style={{ marginRight: 8 }}>取消</Button>
                <Button type="primary" htmlType="submit">确认对账</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="申请发票"
        open={invoiceModal}
        onCancel={() => setInvoiceModal(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        {currentSettlement && (
          <Form form={invoiceForm} layout="vertical" onFinish={submitInvoice}>
            <Form.Item name="type" label="发票类型" rules={[{ required: true }]}>
              <Radio.Group>
                <Radio value="company">企业专票</Radio>
                <Radio value="personal">个人普票</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="title" label="发票抬头" rules={[{ required: true }]}>
              <Input placeholder="请输入发票抬头" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="amount" label="开票金额(元)" rules={[{ required: true }]}>
                  <InputNumber step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="tax_no" label="税号">
                  <Input placeholder="选填" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="email" label="接收邮箱" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="请输入接收发票的邮箱" />
            </Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setInvoiceModal(false)} style={{ marginRight: 8 }}>取消</Button>
              <Button type="primary" htmlType="submit">提交申请</Button>
            </div>
          </Form>
        )}
      </Modal>

      <Modal
        title="确认付款"
        open={paymentModal}
        onCancel={() => setPaymentModal(false)}
        footer={null}
        width={480}
        destroyOnClose
      >
        {currentSettlement && (
          <div>
            <Alert
              message="付款确认"
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>
                    向 <b>{currentSettlement.platform_logo} {currentSettlement.platform_name}</b> 支付
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1677ff', textAlign: 'center' }}>
                    ¥{currentSettlement.settlement_amount?.toFixed(2)}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666', textAlign: 'center' }}>
                    结算周期: {currentSettlement.period} | 订单数: {currentSettlement.total_orders} 单
                  </div>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={paymentForm} layout="vertical" onFinish={submitPayment}>
              <Form.Item name="payment_method" label="付款方式" rules={[{ required: true }]} initialValue="bank">
                <Radio.Group>
                  <Radio value="bank">银行转账</Radio>
                  <Radio value="alipay">支付宝</Radio>
                  <Radio value="wechat">微信支付</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="备注说明（可选）" />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button onClick={() => setPaymentModal(false)} style={{ marginRight: 8 }}>取消</Button>
                <Button type="primary" danger htmlType="submit" icon={<PayCircleOutlined />}>
                  确认付款
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

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
