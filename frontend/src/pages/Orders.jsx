import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Select, Input, Modal, Form, InputNumber, Radio, Drawer, Descriptions, Timeline, message, Space, Row, Col, Progress, Alert, Steps, Divider } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined, SyncOutlined, RobotOutlined, BarChartOutlined, ClockCircleOutlined, DollarOutlined, SafetyOutlined, ThunderboltOutlined, WarningOutlined, ExclamationCircleOutlined, GiftOutlined, CustomerServiceOutlined, FileTextOutlined, ShopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { orderApi, platformApi, merchantApi } from '../api'

const { Option } = Select
const { Step } = Steps

function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ status: '', delivery_status: '', platform_id: '' })
  const [createModal, setCreateModal] = useState(false)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [platforms, setPlatforms] = useState([])
  const [merchants, setMerchants] = useState([])
  const [quoteResult, setQuoteResult] = useState(null)
  const [form] = Form.useForm()
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [routeDrawer, setRouteDrawer] = useState(false)
  const [routeDetail, setRouteDetail] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [modal, modalContextHolder] = Modal.useModal()

  useEffect(() => {
    loadPlatforms()
    loadMerchants()
    loadOrders()
  }, [pagination.current, pagination.pageSize])

  const loadPlatforms = async () => {
    try {
      const res = await platformApi.list({ status: 'active' })
      if (res.success) setPlatforms(res.data)
    } catch (e) { console.error(e) }
  }

  const loadMerchants = async () => {
    try {
      const res = await merchantApi.list()
      if (res.success) setMerchants(res.data)
    } catch (e) { console.error(e) }
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await orderApi.list({
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize
      })
      if (res.success) {
        setOrders(res.data)
        setPagination(p => ({ ...p, total: res.total }))
      }
    } catch (e) {
      message.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }))
    loadOrders()
  }

  const handleCreate = async (values) => {
    try {
      const res = await orderApi.create({
        ...values,
        platform_id: selectedPlatform?.id,
        auto_route: !selectedPlatform
      })
      if (res.success) {
        message.success('订单创建成功')
        setCreateModal(false)
        form.resetFields()
        setQuoteResult(null)
        setSelectedPlatform(null)
        loadOrders()
      }
    } catch (e) {
      message.error('创建订单失败')
    }
  }

  const handleQuote = async () => {
    try {
      const values = form.getFieldsValue()
      if (!values.distance) {
        message.warning('请先输入配送距离')
        return
      }
      const res = await orderApi.quote({
        distance: values.distance,
        weight: values.goods_weight || 0,
        urgency: values.urgency || 'normal'
      })
      if (res.success) {
        setQuoteResult(res.data)
      }
    } catch (e) {
      message.error('获取报价失败')
    }
  }

  const handleViewDetail = async (order) => {
    try {
      const res = await orderApi.detail(order.id)
      if (res.success) {
        setCurrentOrder(res.data)
        setDetailDrawer(true)
      }
    } catch (e) {
      message.error('加载订单详情失败')
    }
  }

  const handleViewRoute = async (order) => {
    setRouteLoading(true)
    try {
      const res = await orderApi.quote({
        distance: order.distance,
        weight: order.goods_weight || 0,
        urgency: order.urgency || 'normal'
      })
      if (res.success) {
        const platformData = platforms.find(p => p.id === order.platform_id)
        const routeData = res.data.optimal?.find(r => r.platform.id === order.platform_id) || res.data.optimal?.[0]
        setRouteDetail({
          order,
          platform: platformData,
          route: routeData,
          allPlatforms: res.data.optimal || [],
          recommendation: res.data.reason || ''
        })
        setRouteDrawer(true)
      }
    } catch (e) {
      message.error('加载路由依据失败')
    } finally {
      setRouteLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const res = await orderApi.updateStatus(orderId, { delivery_status: status })
      if (res.success) {
        message.success('状态更新成功')
        loadOrders()
        if (currentOrder?.id === orderId) {
          setCurrentOrder(res.data)
        }
      }
    } catch (e) {
      message.error('状态更新失败')
    }
  }

  const handleCancelOrder = async (orderId) => {
    modal.confirm({
      title: '确认取消订单',
      content: '取消后将通知运力平台，是否继续？',
      onOk: async () => {
        try {
          const res = await orderApi.cancel(orderId, '用户取消')
          if (res.success) {
            message.success('订单已取消')
            loadOrders()
          }
        } catch (e) {
          message.error('取消失败')
        }
      }
    })
  }

  const statusColorMap = {
    pending: 'warning',
    assigned: 'processing',
    picked: 'processing',
    delivering: 'processing',
    delivered: 'success',
    cancelled: 'default',
    exception: 'error'
  }

  const statusTextMap = {
    pending: '待分配',
    assigned: '已分配',
    picked: '已取货',
    delivering: '配送中',
    delivered: '已送达',
    cancelled: '已取消',
    exception: '异常'
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      width: 160,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    { title: '商户', dataIndex: 'merchant_name', width: 120 },
    {
      title: '平台',
      dataIndex: 'platform_name',
      width: 120,
      render: (text, record) => text ? <span>{record.platform_logo} {text}</span> : '-'
    },
    { title: '收件人', dataIndex: 'receiver_name', width: 100 },
    { title: '收件电话', dataIndex: 'receiver_phone', width: 130 },
    { title: '配送地址', dataIndex: 'receiver_address', ellipsis: true },
    { title: '距离', dataIndex: 'distance', width: 80, render: v => v ? `${v}km` : '-' },
    { title: '重量', dataIndex: 'goods_weight', width: 80, render: v => v ? `${v}kg` : '-' },
    {
      title: '时效',
      dataIndex: 'urgency',
      width: 80,
      render: (v) => {
        const map = {
          urgent: { text: '加急', color: 'red', icon: <ThunderboltOutlined /> },
          normal: { text: '普通', color: 'blue', icon: <ClockCircleOutlined /> },
          economy: { text: '经济', color: 'green', icon: <DollarOutlined /> }
        }
        const item = map[v] || map.normal
        return <Tag color={item.color}>{item.icon} {item.text}</Tag>
      }
    },
    {
      title: '异常预警',
      width: 120,
      render: (_, record) => {
        const now = dayjs()
        const eta = record.estimated_arrival_time ? dayjs(record.estimated_arrival_time) : null
        const isTimeout = eta && now.isAfter(eta) && !['delivered', 'cancelled'].includes(record.delivery_status)
        const isException = record.delivery_status === 'exception'
        if (isException) return <Tag color="red"><ExclamationCircleOutlined /> 配送异常</Tag>
        if (isTimeout) return <Tag color="orange"><WarningOutlined /> 已超时</Tag>
        if (eta && now.diff(eta, 'minute') > -15 && now.diff(eta, 'minute') < 0 && !['delivered', 'cancelled'].includes(record.delivery_status)) {
          return <Tag color="gold"><ClockCircleOutlined /> 即将超时</Tag>
        }
        return <Tag color="green">正常</Tag>
      }
    },
    {
      title: '费用',
      dataIndex: 'total_fee',
      width: 100,
      render: (val) => <span style={{ color: '#1677ff', fontWeight: 500 }}>¥{val?.toFixed(2)}</span>
    },
    {
      title: '配送状态',
      dataIndex: 'delivery_status',
      width: 100,
      render: (status) => (
        <Tag color={statusColorMap[status]}>{statusTextMap[status] || status}</Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 110,
      render: (val) => val ? dayjs(val).format('MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<RobotOutlined />} onClick={() => handleViewRoute(record)}>
            路由依据
          </Button>
          {record.delivery_status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, 'assigned')}>
              分配
            </Button>
          )}
          {record.delivery_status === 'assigned' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, 'picked')}>
              取货
            </Button>
          )}
          {record.delivery_status === 'picked' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, 'delivering')}>
              开始配送
            </Button>
          )}
          {record.delivery_status === 'delivering' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, 'delivered')}>
              完成
            </Button>
          )}
          {!['delivered', 'cancelled', 'delivering'].includes(record.delivery_status) && (
            <Button type="link" size="small" danger onClick={() => handleCancelOrder(record.id)}>
              取消订单
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      {modalContextHolder}
      <div className="page-header">
        <h2 className="page-title">订单管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          新建订单
        </Button>
      </div>

      <div className="filter-bar">
        <Select
          placeholder="配送状态"
          style={{ width: 140 }}
          allowClear
          value={filters.delivery_status || undefined}
          onChange={v => setFilters(f => ({ ...f, delivery_status: v || '' }))}
        >
          <Option value="pending">待分配</Option>
          <Option value="assigned">已分配</Option>
          <Option value="picked">已取货</Option>
          <Option value="delivering">配送中</Option>
          <Option value="delivered">已送达</Option>
          <Option value="cancelled">已取消</Option>
        </Select>
        <Select
          placeholder="运力平台"
          style={{ width: 150 }}
          allowClear
          value={filters.platform_id || undefined}
          onChange={v => setFilters(f => ({ ...f, platform_id: v || '' }))}
        >
          {platforms.map(p => (
            <Option key={p.id} value={p.id}>{p.logo} {p.name}</Option>
          ))}
        </Select>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
        <Button icon={<SyncOutlined />} onClick={loadOrders}>刷新</Button>
      </div>

      <Table
        dataSource={orders}
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

      <Modal
        title="新建配送订单"
        open={createModal}
        onCancel={() => { setCreateModal(false); form.resetFields(); setQuoteResult(null); setSelectedPlatform(null) }}
        onOk={() => { setCreateModal(false); form.resetFields(); setQuoteResult(null); setSelectedPlatform(null) }}
        width={700}
        maskClosable={false}
        destroyOnHidden
        cancelText="关闭"
        okText="创建订单"
        footer={[
          <Button key="cancel" onClick={() => { setCreateModal(false); form.resetFields(); setQuoteResult(null); setSelectedPlatform(null) }}>
            关闭
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            创建订单
          </Button>
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="merchant_id" label="发件商户" rules={[{ required: true }]}>
                <Select placeholder="请选择商户">
                  {merchants.map(m => (
                    <Option key={m.id} value={m.id}>{m.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="urgency" label="时效要求" initialValue="normal">
                <Radio.Group>
                  <Radio value="normal">普通</Radio>
                  <Radio value="urgent">加急</Radio>
                  <Radio value="economy">经济</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="receiver_name" label="收件人姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入收件人姓名" />
          </Form.Item>
          <Form.Item name="receiver_phone" label="收件人电话" rules={[{ required: true }]}>
            <Input placeholder="请输入收件人电话" />
          </Form.Item>
          <Form.Item name="receiver_address" label="收件地址" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="请输入详细收件地址" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="distance" label="配送距离(km)">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="公里" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="goods_weight" label="物品重量(kg)" initialValue={0}>
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="公斤" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="&nbsp;">
                <Button onClick={handleQuote} block>智能估价</Button>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="goods_name" label="物品描述">
            <Input placeholder="请输入物品描述" />
          </Form.Item>

          {quoteResult && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>选择承运平台：</div>
              <Row gutter={[12, 12]}>
                <Col span={24}>
                  <div 
                    className={`price-card ${!selectedPlatform ? 'recommended' : ''}`}
                    onClick={() => setSelectedPlatform(null)}
                    style={{ marginBottom: 12 }}
                  >
                    {!selectedPlatform && <div className="recommend-badge">智能推荐</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>智能运力路由</strong>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          系统自动选择最优承运方
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
                          ¥{quoteResult.recommendation?.fee?.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {quoteResult.recommendation?.platform?.name} · {quoteResult.recommendation?.delivery_time}分钟
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
                {quoteResult.optimal?.slice(0, 4).map(item => (
                  <Col span={12} key={item.platform.id}>
                    <div 
                      className={`price-card ${selectedPlatform?.id === item.platform.id ? 'recommended' : ''}`}
                      onClick={() => setSelectedPlatform(item.platform)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 20, marginRight: 8 }}>{item.platform.logo}</span>
                          <strong>{item.platform.name}</strong>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            评分: {(item.score * 100).toFixed(0)}分
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>
                            ¥{item.fee.toFixed(2)}
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {item.delivery_time}分钟
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Form>
      </Modal>

      <Drawer
        title="订单详情"
        placement="right"
        width={520}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
        destroyOnHidden
      >
        {currentOrder && (
          <div>
            {(() => {
              const now = dayjs()
              const eta = currentOrder.estimated_arrival_time ? dayjs(currentOrder.estimated_arrival_time) : null
              const isTimeout = eta && now.isAfter(eta) && !['delivered', 'cancelled'].includes(currentOrder.delivery_status)
              const isException = currentOrder.delivery_status === 'exception'
              const isSoon = eta && now.diff(eta, 'minute') > -15 && now.diff(eta, 'minute') < 0 && !['delivered', 'cancelled'].includes(currentOrder.delivery_status)
              if (isException) return <Alert type="error" style={{ marginBottom: 16 }} message={<Space><ExclamationCircleOutlined /> 配送异常</Space>} description={currentOrder.cancel_reason || '当前订单存在配送异常，请及时处理'} showIcon />
              if (isTimeout) return <Alert type="warning" style={{ marginBottom: 16 }} message={<Space><WarningOutlined /> 已超时 {Math.abs(now.diff(eta, 'minute'))} 分钟</Space>} description="建议立即联系骑手确认或发起SLA赔付流程" showIcon
                action={<Button type="link" size="small" icon={<GiftOutlined />} onClick={() => {setDetailDrawer(false); navigate('/compensation')}}>申请赔付</Button>}
              />
              if (isSoon) return <Alert type="warning" style={{ marginBottom: 16 }} message={<Space><ClockCircleOutlined /> 即将超时</Space>} description={`预计 ${eta.format('HH:mm')} 送达，还剩 ${Math.abs(now.diff(eta, 'minute'))} 分钟`} showIcon />
              return null
            })()}

            <Descriptions title="基本信息" column={1} size="small" style={{ marginBottom: 16 }} bordered>
              <Descriptions.Item label="订单号" contentStyle={{ fontFamily: 'monospace' }}>{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="商户">{currentOrder.merchant_name}</Descriptions.Item>
              <Descriptions.Item label="承运平台">
                <Space>{currentOrder.platform_logo} {currentOrder.platform_name || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="平台单号" contentStyle={{ fontFamily: 'monospace' }}>{currentOrder.platform_order_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={statusColorMap[currentOrder.delivery_status]}>
                  {statusTextMap[currentOrder.delivery_status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="时效要求">
                {(() => {
                  const map = {
                    urgent: { text: '加急单', color: 'red', icon: <ThunderboltOutlined /> },
                    normal: { text: '普通单', color: 'blue', icon: <ClockCircleOutlined /> },
                    economy: { text: '经济单', color: 'green', icon: <DollarOutlined /> }
                  }
                  const item = map[currentOrder.urgency] || map.normal
                  return <Tag color={item.color}>{item.icon} {item.text}</Tag>
                })()}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="物品与配送信息" column={1} size="small" style={{ marginBottom: 16 }} bordered>
              <Descriptions.Item label="物品名称">{currentOrder.goods_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="物品重量"><SafetyOutlined style={{ color: '#52c41a' }} /> {currentOrder.goods_weight || 0} kg</Descriptions.Item>
              <Descriptions.Item label="配送距离"><BarChartOutlined style={{ color: '#1677ff' }} /> {currentOrder.distance || 0} km</Descriptions.Item>
              <Descriptions.Item label="预计送达">{currentOrder.estimated_arrival_time ? dayjs(currentOrder.estimated_arrival_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              <Descriptions.Item label="配送费用">
                <span style={{ color: '#1677ff', fontSize: 16, fontWeight: 600 }}>¥{currentOrder.total_fee?.toFixed(2)}</span>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="收件信息" column={1} size="small" style={{ marginBottom: 16 }} bordered>
              <Descriptions.Item label="收件人">{currentOrder.receiver_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentOrder.receiver_phone}</Descriptions.Item>
              <Descriptions.Item label="收件地址">{currentOrder.receiver_address}</Descriptions.Item>
            </Descriptions>

            {currentOrder.rider_name && (
              <Descriptions title="骑手信息" column={1} size="small" style={{ marginBottom: 16 }} bordered>
                <Descriptions.Item label="骑手姓名">{currentOrder.rider_name}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{currentOrder.rider_phone || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            <div>
              <div style={{ fontWeight: 500, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>配送轨迹</span>
                <Button type="link" size="small" icon={<RobotOutlined />} onClick={() => { setRouteDetail({ order: currentOrder, allPlatforms: [], route: null, recommendation: '可前往运费比价引擎查看详细路由' }); setDetailDrawer(false); setRouteDrawer(true) }}>
                  查看路由依据
                </Button>
              </div>
              <Timeline
                items={currentOrder.tracks?.map(track => ({
                  color: track.status === 'delivered' ? 'green' : track.status === 'exception' ? 'red' : 'blue',
                  children: (
                    <div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                        {dayjs(track.created_at).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                      <div style={{ fontSize: 14 }}>{track.description}</div>
                      {track.location && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>📍 {track.location}</div>}
                    </div>
                  )
                })) || [<div style={{ color: '#999' }}>暂无配送轨迹</div>]}
              />
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        title={
          <Space>
            <RobotOutlined style={{ color: '#722ed1' }} />
            <span>智能路由依据分析</span>
          </Space>
        }
        placement="right"
        width={650}
        open={routeDrawer}
        onClose={() => setRouteDrawer(false)}
        destroyOnHidden
        loading={routeLoading}
      >
        {routeDetail && (
          <div>
            <Alert
              message="智能路由推荐说明"
              description={routeDetail.recommendation || '基于多维度加权评分模型，综合考虑价格、时效、服务质量和运力饱和度，为您选择最优承运方'}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card title="订单参数" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>配送距离</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BarChartOutlined style={{ color: '#1677ff' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{routeDetail.order.distance}km</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>物品重量</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <SafetyOutlined style={{ color: '#52c41a' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{routeDetail.order.goods_weight || 0}kg</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>时效要求</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ClockCircleOutlined style={{ color: '#faad14' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                      {routeDetail.order.urgency === 'urgent' ? '加急' : routeDetail.order.urgency === 'normal' ? '普通' : '经济'}
                    </span>
                  </div>
                </Col>
              </Row>
            </Card>

            <Card title="当前承运方评分详情" size="small" style={{ marginBottom: 16 }}>
              {routeDetail.route ? (
                <div>
                  <Space style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{routeDetail.route.platform.logo}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{routeDetail.route.platform.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>综合评分: {routeDetail.route.score?.toFixed(1)}分</div>
                    </div>
                  </Space>
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="运费成本">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>¥{routeDetail.route.fee?.toFixed(2)}</span>
                        <Progress 
                          percent={routeDetail.route.price_score || 0} 
                          size="small" 
                          style={{ width: 100 }}
                          strokeColor="#52c41a"
                        />
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="预计时效">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{routeDetail.route.delivery_time}分钟</span>
                        <Progress 
                          percent={routeDetail.route.time_score || 0} 
                          size="small" 
                          style={{ width: 100 }}
                          strokeColor="#1677ff"
                        />
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="运力饱和度">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{((routeDetail.platform?.capacity_saturation || 0) * 100).toFixed(0)}%</span>
                        <Progress 
                          percent={routeDetail.route.capacity_score || 0} 
                          size="small" 
                          style={{ width: 100 }}
                          strokeColor="#722ed1"
                        />
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="历史履约率">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{((routeDetail.platform?.actual_on_time_rate || 0) * 100).toFixed(1)}%</span>
                        <Progress 
                          percent={routeDetail.route.quality_score || 0} 
                          size="small" 
                          style={{ width: 100 }}
                          strokeColor="#fa8c16"
                        />
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                  <Alert
                    message="选择理由"
                    description={routeDetail.route.reason || '综合评分最高，为最优选择'}
                    type="success"
                    showIcon
                    style={{ marginTop: 12 }}
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  暂无当前承运方的评分数据
                </div>
              )}
            </Card>

            <Card title="全平台综合对比" size="small">
              <Table
                dataSource={routeDetail.allPlatforms}
                rowKey="platform.id"
                size="small"
                pagination={false}
                scroll={{ x: 600 }}
                rowClassName={(record) => 
                  record.platform.id === routeDetail.order.platform_id 
                    ? 'table-row-selected' 
                    : ''
                }
              >
                <Table.Column 
                  title="平台" 
                  dataIndex="platform.name" 
                  key="platform"
                  render={(text, record) => (
                    <Space>
                      <span style={{ fontSize: 18 }}>{record.platform.logo}</span>
                      {text}
                      {record.platform.id === routeDetail.order.platform_id && (
                        <Tag color="green">已选择</Tag>
                      )}
                    </Space>
                  )}
                />
                <Table.Column 
                  title="运费" 
                  dataIndex="fee" 
                  key="fee"
                  render={(val) => <span style={{ color: '#52c41a' }}>¥{val?.toFixed(2)}</span>}
                  sorter={(a, b) => a.fee - b.fee}
                />
                <Table.Column 
                  title="时效(分)" 
                  dataIndex="delivery_time" 
                  key="time"
                  sorter={(a, b) => a.delivery_time - b.delivery_time}
                />
                <Table.Column 
                  title="综合评分" 
                  dataIndex="score" 
                  key="score"
                  render={(val) => (
                    <span style={{ fontWeight: 600, color: val >= 80 ? '#52c41a' : val >= 60 ? '#faad14' : '#ff4d4f' }}>
                      {val?.toFixed(1)}
                    </span>
                  )}
                  sorter={(a, b) => b.score - a.score}
                />
              </Table>
            </Card>

            <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
              <div><strong>评分权重说明：</strong></div>
              <div>• 加急单：时效权重40%，价格权重20%，质量权重25%，运力权重15%</div>
              <div>• 普通单：时效权重25%，价格权重35%，质量权重25%，运力权重15%</div>
              <div>• 经济单：时效权重15%，价格权重50%，质量权重25%，运力权重15%</div>
            </div>

            <Divider style={{ margin: '20px 0 12px' }} />
            <Card 
              size="small" 
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>业务闭环追溯链路 · 路由 → 售后 → 赔付 → 结算</span>
                </Space>
              }
              style={{ background: '#f9f9f9', border: '1px dashed #d9d9d9' }}
            >
              <Steps size="small" current={1} style={{ marginBottom: 12 }}>
                <Step title="路由决策" description="订单创建" status="finish" icon={<RobotOutlined style={{ color: '#722ed1' }} />} />
                <Step title="当前订单" description="路由依据已存档" status="process" icon={<ShoppingCartOutlined style={{ color: '#1677ff' }} />} />
                <Step title="售后协同" description="改址/取消/投诉" icon={<CustomerServiceOutlined />} />
                <Step title="SLA赔付" description="超时/丢件补偿" icon={<GiftOutlined />} />
                <Step title="月结对账" description="结算付款" icon={<FileTextOutlined />} />
              </Steps>

              <Row gutter={[8, 8]}>
                <Col span={8}>
                  <Button block size="small" type="primary" icon={<EyeOutlined />} onClick={() => { setRouteDrawer(false); setDetailDrawer(true); }}>
                    查看订单详情
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block size="small" icon={<CustomerServiceOutlined />} onClick={() => { 
                    setRouteDrawer(false); 
                    navigate('/after-sales');
                  }}>
                    售后协同工单
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block size="small" icon={<GiftOutlined />} onClick={() => { 
                    setRouteDrawer(false); 
                    navigate('/compensation');
                  }}>
                    SLA赔付追溯
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block size="small" icon={<FileTextOutlined />} onClick={() => { 
                    setRouteDrawer(false); 
                    navigate('/settlement');
                  }}>
                    月结对账入口
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block size="small" icon={<RobotOutlined />} onClick={() => { 
                    setRouteDrawer(false); 
                    navigate('/price-compare');
                  }}>
                    重新比价
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block size="small" icon={<ShopOutlined />} onClick={() => { 
                    setRouteDrawer(false); 
                    navigate('/merchant');
                  }}>
                    商户配送看板
                  </Button>
                </Col>
              </Row>

              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message="追溯闭环说明"
                description={
                  <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                    <div>✅ <b>路由依据存档</b>：五维评分（价格/时效/服务质量/运力饱和度）已随订单永久存档</div>
                    <div>✅ <b>售后状态回传</b>：改址/取消/投诉状态实时从承运方同步，回执时间和结果可追溯</div>
                    <div>✅ <b>SLA赔付追溯</b>：超时/丢件自动触发赔付券，核验状态、复查记录、商户确认完整记录</div>
                    <div>✅ <b>结算对账闭环</b>：按单抽佣自动计算，异常差异高亮，承运方回执作为对账凭证</div>
                  </div>
                }
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default Orders
