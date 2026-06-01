import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, message, Input, Select, Modal, Popconfirm } from 'antd'
import { SearchOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import request from '../../utils/request'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS } from '../../utils/constants'

const { Search } = Input
const { Option } = Select

const OrderList = () => {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchText, setSearchText] = useState('')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

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
    navigate(`/patient-family/orders/${record.id}`)
  }

  const handleCancelOrder = async (id) => {
    try {
      await request.post(`/orders/${id}/cancel`)
      message.success('订单已取消')
      fetchOrders()
    } catch (error) {
      message.error('取消订单失败')
    }
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180
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
      title: '预约时间',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status]} className="status-tag">
          {ORDER_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space className="table-actions">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看详情
          </Button>
          {record.status !== ORDER_STATUS.COMPLETED && record.status !== ORDER_STATUS.CANCELLED && (
            <Popconfirm
              title="确定取消该订单？"
              onConfirm={() => handleCancelOrder(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<CloseOutlined />}>
                取消订单
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2>我的订单</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select placeholder="选择状态" style={{ width: 150 }} allowClear onChange={setStatus}>
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
    </div>
  )
}

export default OrderList
