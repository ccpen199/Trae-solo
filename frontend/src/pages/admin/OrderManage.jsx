import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, message, Input, Select, Modal, Descriptions, DatePicker } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import request from '../../utils/request'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const OrderManage = () => {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchText, setSearchText] = useState('')
  const [status, setStatus] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    let filtered = orders
    if (searchText) {
      filtered = filtered.filter(o => 
        o.order_no?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.patient_name?.includes(searchText)
      )
    }
    if (status) {
      filtered = filtered.filter(o => o.status === status)
    }
    setFilteredOrders(filtered)
  }, [searchText, status, orders])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await request.get('/orders')
      setOrders(data.list || data || [])
      setFilteredOrders(data.list || data || [])
    } catch (error) {
      message.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (record) => {
    setSelectedOrder(record)
    setDetailVisible(true)
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160
    },
    {
      title: '服务项目',
      dataIndex: 'service_name',
      key: 'service_name'
    },
    {
      title: '患者姓名',
      dataIndex: 'patient_name',
      key: 'patient_name'
    },
    {
      title: '护士',
      dataIndex: 'nurse_name',
      key: 'nurse_name',
      render: (name) => name || '-'
    },
    {
      title: '预约时间',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      width: 160
    },
    {
      title: '金额',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status]} className="status-tag">
          {ORDER_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2>订单管理</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <RangePicker showTime style={{ width: 350 }} />
          <Select placeholder="订单状态" style={{ width: 150 }} allowClear onChange={setStatus}>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
          <Search
            placeholder="搜索订单号/患者姓名"
            allowClear
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={filteredOrders}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="订单详情"
        open={detailVisible}
        width={800}
        footer={null}
        onCancel={() => setDetailVisible(false)}
      >
        {selectedOrder && (
          <Descriptions column={2}>
            <Descriptions.Item label="订单号">{selectedOrder.order_no}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={ORDER_STATUS_COLORS[selectedOrder.status]}>
                {ORDER_STATUS_LABELS[selectedOrder.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="服务项目">{selectedOrder.service_name}</Descriptions.Item>
            <Descriptions.Item label="预约时间">{selectedOrder.scheduled_at}</Descriptions.Item>
            <Descriptions.Item label="患者姓名">{selectedOrder.patient_name}</Descriptions.Item>
            <Descriptions.Item label="年龄">{selectedOrder.patient_age}岁</Descriptions.Item>
            <Descriptions.Item label="服务地址" span={2}>{selectedOrder.address}</Descriptions.Item>
            <Descriptions.Item label="病情描述" span={2}>{selectedOrder.condition_description}</Descriptions.Item>
            <Descriptions.Item label="护士">{selectedOrder.nurse_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="订单金额">¥{selectedOrder.price}</Descriptions.Item>
            <Descriptions.Item label="下单时间" span={2}>{selectedOrder.created_at}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default OrderManage
