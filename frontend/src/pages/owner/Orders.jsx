import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Input, Select, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ownerApi } from '../../utils/api'

const { Title } = Typography

const statusMap = {
  pending: { text: '待指派', color: 'default' },
  negotiating: { text: '议价中', color: 'processing' },
  negotiated: { text: '待接单', color: 'blue' },
  accepted: { text: '已接单', color: 'success' },
  in_progress: { text: '服务中', color: 'warning' },
  completed: { text: '待验收', color: 'purple' },
  accepted_with_signature: { text: '已验收', color: 'purple' },
  finished: { text: '已完成', color: 'success' }
}

const OwnerOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await ownerApi.getOrders(statusFilter || undefined)
      setOrders(data)
    } catch (error) {
      console.error('加载订单失败', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(o => 
    o.title.includes(searchText) || o.order_no.includes(searchText)
  )

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180
    },
    {
      title: '服务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.service_type}</div>
        </div>
      )
    },
    {
      title: '服务地址',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: '师傅',
      dataIndex: 'master_name',
      key: 'master_name',
      render: (text) => text || '待指派'
    },
    {
      title: '预算金额',
      dataIndex: 'budget_price',
      key: 'budget_price',
      render: (val) => val ? `¥${val}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusMap[status]?.color}>
          {statusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/orders/${record.id}`)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => navigate(`/orders/${record.id}`)}>
              指派师傅
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>我的订单</Title>
        <Space>
          <Input
            placeholder="搜索订单"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            style={{ width: 150 }}
            placeholder="筛选状态"
            allowClear
            value={statusFilter || undefined}
            onChange={setStatusFilter}
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.text}</Select.Option>
            ))}
          </Select>
          <Button type="primary" onClick={() => navigate('/orders/create')}>
            发布订单
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}

export default OwnerOrders
