import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Select, Input, Modal, Form, InputNumber, Radio, Drawer, Descriptions, Timeline, message, Space, Row, Col } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined, SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { orderApi, platformApi, merchantApi } from '../api'

const { Option } = Select

function Orders() {
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
    Modal.confirm({
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
      width: 160,
      render: (val) => dayjs(val).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.delivery_status === 'pending' && (
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
              取消
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
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
        width={700}
        footer={null}
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

          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setCreateModal(false)} style={{ marginRight: 8 }}>取消</Button>
            <Button type="primary" htmlType="submit">创建订单</Button>
          </div>
        </Form>
      </Modal>

      <Drawer
        title="订单详情"
        placement="right"
        width={480}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {currentOrder && (
          <div>
            <Descriptions title="基本信息" column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="商户">{currentOrder.merchant_name}</Descriptions.Item>
              <Descriptions.Item label="承运平台">
                {currentOrder.platform_logo} {currentOrder.platform_name}
              </Descriptions.Item>
              <Descriptions.Item label="平台单号">{currentOrder.platform_order_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={statusColorMap[currentOrder.delivery_status]}>
                  {statusTextMap[currentOrder.delivery_status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="物品">{currentOrder.goods_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="重量">{currentOrder.goods_weight}kg</Descriptions.Item>
              <Descriptions.Item label="距离">{currentOrder.distance}km</Descriptions.Item>
              <Descriptions.Item label="费用">
                <span style={{ color: '#1677ff', fontWeight: 500 }}>¥{currentOrder.total_fee?.toFixed(2)}</span>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="收件信息" column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="收件人">{currentOrder.receiver_name}</Descriptions.Item>
              <Descriptions.Item label="电话">{currentOrder.receiver_phone}</Descriptions.Item>
              <Descriptions.Item label="地址">{currentOrder.receiver_address}</Descriptions.Item>
            </Descriptions>

            {currentOrder.rider_name && (
              <Descriptions title="骑手信息" column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="骑手姓名">{currentOrder.rider_name}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{currentOrder.rider_phone || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            <div>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>配送轨迹</div>
              <Timeline
                items={currentOrder.tracks?.map(track => ({
                  color: track.status === 'delivered' ? 'green' : track.status === 'exception' ? 'red' : 'blue',
                  children: (
                    <div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                        {dayjs(track.created_at).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                      <div style={{ fontSize: 14 }}>{track.description}</div>
                      {track.location && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{track.location}</div>}
                    </div>
                  )
                }))}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default Orders
