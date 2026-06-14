import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Select, Typography, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { adminApi } from '../../utils/api'

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

const Orders = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData()
  }, [statusFilter, pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await adminApi.getOrders({
        status: statusFilter || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize
      })
      setData(result.orders)
      setPagination(prev => ({ ...prev, total: result.total }))
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = data.filter(o => 
    o.title.includes(searchText) || 
    o.order_no.includes(searchText) ||
    (o.owner_name || '').includes(searchText)
  )

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160
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
      title: '业主',
      dataIndex: 'owner_name',
      key: 'owner_name'
    },
    {
      title: '师傅',
      dataIndex: 'master_name',
      key: 'master_name',
      render: (val) => val || '待指派'
    },
    {
      title: '金额',
      dataIndex: 'final_price',
      key: 'final_price',
      render: (val, record) => val ? `¥${val}` : (record.budget_price ? `¥${record.budget_price}(预算)` : '-')
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
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>订单管理</Title>
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
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(page) => setPagination(prev => ({ ...prev, current: page.current, pageSize: page.pageSize }))}
      />
    </div>
  )
}

export default Orders
