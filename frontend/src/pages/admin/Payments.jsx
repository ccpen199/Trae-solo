import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, message } from 'antd'
import api from '../../utils/api'
import dayjs from 'dayjs'

const Payments = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const data = await api.get(`/admin/payment-records?page=${page}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      })
      setRecords(data.records)
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total
      })
    } catch (error) {
      message.error('获取交费记录失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 180 },
    { title: '用户', dataIndex: 'username', key: 'username' },
    { title: '户号', dataIndex: 'account_number', key: 'account_number' },
    { title: '户名', dataIndex: 'account_name', key: 'account_name' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v) => <strong style={{ color: '#52c41a' }}>¥{v}</strong> },
    {
      title: '类型',
      dataIndex: 'is_agent',
      key: 'is_agent',
      render: (v, r) => v ? <Tag color="purple">代缴({r.agent_relation})</Tag> : <Tag color="blue">本人</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const colors = { success: 'green', pending: 'orange', failed: 'red' }
        return <Tag color={colors[v]}>{v === 'success' ? '成功' : v === 'pending' ? '处理中' : '失败'}</Tag>
      }
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    }
  ]

  return (
    <Card title="交费记录">
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, pageSize) => fetchRecords(page, pageSize)
        }}
      />
    </Card>
  )
}

export default Payments
