import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Space, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import request from '../utils/request'
import { getUserRole } from '../utils/auth'

const statusMap = {
  applied: { color: 'blue', text: '已申请' },
  accepted: { color: 'cyan', text: '已接受' },
  working: { color: 'green', text: '工作中' },
  completed: { color: 'default', text: '已完成' },
  disputed: { color: 'red', text: '争议中' },
  cancelled: { color: 'volcano', text: '已取消' }
}

export default function OrderListPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const role = getUserRole()

  const fetchOrders = async (page = 1) => {
    setLoading(true)
    try {
      const res = await request.get('/orders', { params: { page, pageSize: pagination.pageSize } })
      const data = res.data || res
      const rows = Array.isArray(data)
        ? data
        : (Array.isArray(data.data)
          ? data.data
          : (data.list || data.orders || data.items || []))
      setOrders(rows)
      setPagination((prev) => ({ ...prev, current: page, total: data.total || rows.length || 0 }))
    } catch (e) {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(1)
  }, [])

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '岗位名称',
      dataIndex: 'job_title',
      key: 'job_title',
      ellipsis: true,
      render: (text, record) => text || record.job?.title || '-'
    },
    {
      title: role === 'employer' ? '求职者' : '雇主',
      key: 'counterpart',
      width: 120,
      render: (_, record) => role === 'employer'
        ? (record.worker_name || record.worker?.username || '-')
        : (record.employer_name || record.employer?.username || '-')
    },
    {
      title: '时薪',
      dataIndex: 'hourly_wage',
      key: 'hourly_wage',
      width: 100,
      render: (val) => val ? `${val}元/时` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const s = statusMap[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val) => val ? new Date(val).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record.id}`)}>
          详情
        </Button>
      )
    }
  ]

  return (
    <Card title="我的订单">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: fetchOrders,
          showTotal: (total) => `共 ${total} 条`
        }}
      />
    </Card>
  )
}
