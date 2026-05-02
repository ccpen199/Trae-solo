import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Space, Button, Select, message, Spin } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { orderApi } from '../services/api'
import { statusNames } from '../stores/authStore'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select

interface OrderType {
  id: string
  order_no: string
  status: string
  bike_code: string
  lock_code: string
  user_name: string
  start_time: string
  end_time: string
  duration_minutes: number
  actual_amount: number
  payment_status: string
  created_at: string
  availableActions: string[]
}

const Orders: React.FC = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderType[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const fetchOrders = async (status?: string) => {
    setLoading(true)
    try {
      const params: any = {}
      if (status) params.status = status
      const res = await orderApi.list(params)
      if (res.data.success) {
        setOrders(res.data.data)
      }
    } catch (error) {
      message.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(statusFilter)
  }, [statusFilter])

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending_scan: 'blue',
      pending_ride: 'cyan',
      riding: 'green',
      pending_billing: 'orange',
      billing_confirmed: 'gold',
      pending_exception: 'red',
      pending_dispatch: 'purple',
      completed: 'default',
      cancelled: 'default'
    }
    return colorMap[status] || 'default'
  }

  const columns: ColumnsType<OrderType> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '车辆编号',
      dataIndex: 'bike_code',
      key: 'bike_code'
    },
    {
      title: '锁编号',
      dataIndex: 'lock_code',
      key: 'lock_code'
    },
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {statusNames[status] || status}
        </Tag>
      )
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time) => time || '-'
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (val) => val || '-'
    },
    {
      title: '金额',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      render: (val) => val > 0 ? `¥${val}` : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>订单管理</h2>
        <Select
          placeholder="状态筛选"
          style={{ width: 150 }}
          allowClear
          value={statusFilter || undefined}
          onChange={setStatusFilter}
        >
          {Object.entries(statusNames).map(([key, value]) => (
            <Option key={key} value={key}>{value}</Option>
          ))}
        </Select>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </div>
  )
}

export default Orders
