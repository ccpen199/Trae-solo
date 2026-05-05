import React, { useState, useEffect } from 'react'
import { 
  Card, Form, Input, Select, DatePicker, Button, Table, Space, Tag, 
  message, Descriptions, Modal
} from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { orderApi } from '../services/api'

const OrderQuery = () => {
  const [searchForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const handleSearch = async (values, page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = {
        page,
        pageSize,
      }
      
      if (values.passengerName) {
        params.passengerName = values.passengerName
      }
      if (values.orderNo) {
        params.orderNo = values.orderNo
      }
      if (values.status) {
        params.status = values.status
      }

      const result = await orderApi.list(params)
      
      if (result.success) {
        setOrders(result.data)
        setPagination({
          current: page,
          pageSize,
          total: result.pagination?.total || result.data.length,
        })
        message.success('查询到 ' + (result.total || result.data.length) + ' 条订单')
      } else {
        message.error('查询失败')
      }
    } catch (error) {
      message.error('查询失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleTableChange = (pagination) => {
    handleSearch(searchForm.getFieldsValue(), pagination.current, pagination.pageSize)
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (text) => (
        <Tag color="blue" style={{ fontSize: 12 }}>{text}</Tag>
      ),
    },
    {
      title: '车次',
      dataIndex: 'train_number',
      key: 'train_number',
      width: 100,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <Tag style={{ margin: 0, fontSize: 10 }}>{record.train_type}</Tag>
        </Space>
      ),
    },
    {
      title: '旅客',
      dataIndex: 'passenger_name',
      key: 'passenger_name',
      width: 100,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: 11, color: '#999' }}>
            {record.passenger_phone || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '行程',
      key: 'route',
      width: 200,
      render: (_, record) => (
        <div>
          <div>
            <Tag color="green">{record.from_station}</Tag>
            <span style={{ margin: '0 8px' }}>→</span>
            <Tag color="red">{record.to_station}</Tag>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {String(record.departure_time).substring(0, 5)} - {String(record.arrival_time).substring(0, 5)}
          </div>
          <div style={{ fontSize: 11, color: '#999' }}>
            {String(record.travel_date)}
          </div>
        </div>
      ),
    },
    {
      title: '座位',
      key: 'seat',
      width: 120,
      render: (_, record) => (
        <div>
          <div>{record.seat_type}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.carriage_number} {record.seat_number}
          </div>
        </div>
      ),
    },
    {
      title: '票价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => (
        <span style={{ color: '#ff4d4f', fontSize: 16, fontWeight: 'bold' }}>
          ¥{price}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        let color = 'default'
        let text = status
        if (status === 'paid') { color = 'green'; text = '已支付' }
        else if (status === 'refunded') { color = 'orange'; text = '已退票' }
        else if (status === 'pending') { color = 'processing'; text = '处理中' }
        else if (status === 'cancelled') { color = 'default'; text = '已取消' }
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => String(time || ''),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card title="📋 订单查询" style={{ marginBottom: 24 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="orderNo" label="订单号">
            <Input placeholder="输入订单号" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="passengerName" label="旅客姓名">
            <Input placeholder="输入姓名" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="选择状态" style={{ width: 120 }} allowClear>
              <Select.Option value="paid">已支付</Select.Option>
              <Select.Option value="refunded">已退票</Select.Option>
              <Select.Option value="pending">处理中</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={() => {
                searchForm.resetFields()
                setOrders([])
              }} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title={'查询结果 (共 ' + pagination.total + ' 条)'}>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => '共 ' + total + ' 条',
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false)
          setSelectedOrder(null)
        }}
        footer={[
          <Button key="close" onClick={() => {
            setShowDetailModal(false)
            setSelectedOrder(null)
          }}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedOrder && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="订单号" span={2}>
              <Tag color="blue" style={{ fontSize: 14 }}>{selectedOrder.order_no}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="车次">
              <strong>{selectedOrder.train_number}</strong>
              <Tag style={{ marginLeft: 8 }}>{selectedOrder.train_type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {selectedOrder.status === 'paid' && <Tag color="green">已支付</Tag>}
              {selectedOrder.status === 'refunded' && <Tag color="orange">已退票</Tag>}
              {selectedOrder.status === 'pending' && <Tag color="processing">处理中</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="旅客姓名">{selectedOrder.passenger_name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedOrder.passenger_phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {selectedOrder.passenger_id_card?.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="订单类型">
              <Tag color={selectedOrder.order_type === 'window' ? 'orange' : 'blue'}>
                {selectedOrder.order_type === 'window' ? '窗口售票' : '在线订票'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="出发站">{selectedOrder.from_station}</Descriptions.Item>
            <Descriptions.Item label="到达站">{selectedOrder.to_station}</Descriptions.Item>
            <Descriptions.Item label="发车时间">
              {String(selectedOrder.departure_time).substring(0, 5)}
            </Descriptions.Item>
            <Descriptions.Item label="到达时间">
              {String(selectedOrder.arrival_time).substring(0, 5)}
            </Descriptions.Item>
            <Descriptions.Item label="出发日期">{String(selectedOrder.travel_date)}</Descriptions.Item>
            <Descriptions.Item label="席别">{selectedOrder.seat_type}</Descriptions.Item>
            <Descriptions.Item label="车厢">{selectedOrder.carriage_number}</Descriptions.Item>
            <Descriptions.Item label="座位号">{selectedOrder.seat_number}</Descriptions.Item>
            <Descriptions.Item label="票价" span={2}>
              <span style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 'bold' }}>
                ¥{selectedOrder.price}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {String(selectedOrder.created_at)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default OrderQuery
