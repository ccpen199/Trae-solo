import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Space, Tag, Input, Select, Modal, Form, message, Badge, Row, Col, InputNumber, Descriptions } from 'antd'
import { PlusOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getOrders, createOrder, autoDispatchOrder, type Order, type OrderListParams } from '@/api'

interface TableOrder extends Order {
  key: string
}

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'warning', text: '待分配' },
  assigned: { color: 'processing', text: '已分配' },
  accepted: { color: 'processing', text: '已接单' },
  in_transit: { color: 'processing', text: '配送中' },
  completed: { color: 'success', text: '已完成' },
  cancelled: { color: 'error', text: '已取消' }
}

const Orders: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TableOrder[]>([])
  const [total, setTotal] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<TableOrder | null>(null)
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [orderForm] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })

  const fetchOrders = async (params?: OrderListParams) => {
    setLoading(true)
    try {
      const response = await getOrders(params)
      if (response.code === 0) {
        const list = response.data.list.map(item => ({ ...item, key: item.id }))
        setData(list)
        setTotal(response.data.total)
      } else {
        message.error(response.message || '获取订单列表失败')
      }
    } catch (error) {
      message.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders({ page: 1, pageSize: 10 })
  }, [])

  const handleSearch = (values: any) => {
    const params: OrderListParams = {
      page: 1,
      pageSize: pagination.pageSize,
      ...values
    }
    setPagination({ ...pagination, page: 1 })
    fetchOrders(params)
  }

  const handleAutoDispatch = async (record: TableOrder) => {
    setLoading(true)
    try {
      const response = await autoDispatchOrder(record.id)
      if (response.code === 0) {
        message.success('智能派单成功')
        fetchOrders({ page: pagination.page, pageSize: pagination.pageSize })
      } else {
        message.error(response.message || '智能派单失败')
      }
    } catch (error) {
      message.error('智能派单失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async (values: any) => {
    try {
      const response = await createOrder(values)
      if (response.code === 0) {
        message.success('创建订单成功')
        setIsModalOpen(false)
        orderForm.resetFields()
        fetchOrders({ page: 1, pageSize: pagination.pageSize })
      } else {
        message.error(response.message || '创建订单失败')
      }
    } catch (error) {
      message.error('创建订单失败')
    }
  }

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
    const values = searchForm.getFieldsValue()
    fetchOrders({ page, pageSize, ...values })
  }

  const openDetailModal = (record: TableOrder) => {
    setSelectedOrder(record)
    setDispatchModalOpen(true)
  }

  const columns: ColumnsType<TableOrder> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160
    },
    {
      title: '客户信息',
      key: 'customer',
      width: 160,
      render: (_, record) => (
        <div>
          <div>{record.customer_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.customer_phone}</div>
        </div>
      )
    },
    {
      title: '取货地址',
      dataIndex: 'pickup_address',
      key: 'pickup_address',
      ellipsis: true
    },
    {
      title: '送货地址',
      dataIndex: 'delivery_address',
      key: 'delivery_address',
      ellipsis: true
    },
    {
      title: '货物信息',
      key: 'goods',
      width: 120,
      render: (_, record) => (
        <div>
          <div>{record.loading_requirement || '普通货物'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.cargo_weight}kg</div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status]
        return info ? <Badge status={info.color as any} text={info.text} /> : status
      }
    },
    {
      title: '配送司机',
      dataIndex: 'driver_name',
      key: 'driver_name',
      width: 110,
      render: (name?: string) => name || '-'
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => date || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <a onClick={() => openDetailModal(record)}>详情</a>
          {record.status === 'pending' && (
            <a onClick={() => handleAutoDispatch(record)}>
              <ThunderboltOutlined /> 智能派单
            </a>
          )}
        </Space>
      )
    }
  ]

  return (
    <Card
      title="订单池"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新建订单
        </Button>
      }
    >
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }} onFinish={handleSearch}>
        <Form.Item name="keyword">
          <Input placeholder="搜索订单号/客户名" prefix={<SearchOutlined />} style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="status">
          <Select placeholder="订单状态" allowClear style={{ width: 130 }}>
            <Select.Option value="pending">待分配</Select.Option>
            <Select.Option value="assigned">已分配</Select.Option>
            <Select.Option value="accepted">已接单</Select.Option>
            <Select.Option value="in_transit">配送中</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">查询</Button>
            <Button onClick={() => { searchForm.resetFields(); fetchOrders({ page: 1, pageSize: 10 }) }}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: handleTableChange
        }}
      />

      <Modal
        title="订单详情"
        open={dispatchModalOpen}
        onCancel={() => setDispatchModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="订单号">{selectedOrder.order_no}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {(() => {
                const info = statusMap[selectedOrder.status]
                return info ? <Tag color={info.color}>{info.text}</Tag> : selectedOrder.status
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="客户姓名">{selectedOrder.customer_name}</Descriptions.Item>
            <Descriptions.Item label="客户电话">{selectedOrder.customer_phone}</Descriptions.Item>
            <Descriptions.Item label="取货地址" span={2}>{selectedOrder.pickup_address}</Descriptions.Item>
            <Descriptions.Item label="送货地址" span={2}>{selectedOrder.delivery_address}</Descriptions.Item>
            <Descriptions.Item label="货物重量">{selectedOrder.cargo_weight}kg</Descriptions.Item>
            <Descriptions.Item label="货物体积">{selectedOrder.cargo_volume ? `${selectedOrder.cargo_volume}m³` : '-'}</Descriptions.Item>
            <Descriptions.Item label="装卸要求">{selectedOrder.loading_requirement || '-'}</Descriptions.Item>
            <Descriptions.Item label="客户信用分">{selectedOrder.customer_credit_score ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="时间窗开始">{selectedOrder.time_window_start || '-'}</Descriptions.Item>
            <Descriptions.Item label="时间窗结束">{selectedOrder.time_window_end || '-'}</Descriptions.Item>
            <Descriptions.Item label="配送司机">{selectedOrder.driver_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="下单时间">{selectedOrder.created_at || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="新建订单"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={orderForm} layout="vertical" onFinish={handleCreateOrder}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_name" label="客户姓名" rules={[{ required: true, message: '请输入客户姓名' }]}>
                <Input placeholder="请输入客户姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_phone" label="客户电话" rules={[{ required: true, message: '请输入客户电话' }]}>
                <Input placeholder="请输入客户电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="pickup_address" label="取货地址" rules={[{ required: true, message: '请输入取货地址' }]}>
            <Input placeholder="请输入取货地址" />
          </Form.Item>
          <Form.Item name="delivery_address" label="送货地址" rules={[{ required: true, message: '请输入送货地址' }]}>
            <Input placeholder="请输入送货地址" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cargo_weight" label="货物重量(kg)" rules={[{ required: true, message: '请输入货物重量' }]}>
                <InputNumber placeholder="请输入货物重量" style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cargo_volume" label="货物体积(m³)">
                <InputNumber placeholder="请输入货物体积" style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="loading_requirement" label="装卸要求">
                <Select placeholder="请选择装卸要求">
                  <Select.Option value="普通货物">普通货物</Select.Option>
                  <Select.Option value="轻拿轻放">轻拿轻放</Select.Option>
                  <Select.Option value="易碎品">易碎品</Select.Option>
                  <Select.Option value="需要叉车">需要叉车</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_credit_score" label="客户信用分">
                <InputNumber placeholder="0-100" style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="time_window_start" label="时间窗开始">
                <Input placeholder="如: 2024-01-01 09:00:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="time_window_end" label="时间窗结束">
                <Input placeholder="如: 2024-01-01 18:00:00" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default Orders
