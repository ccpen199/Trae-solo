import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, message, Button, Space } from 'antd'
import api from '../../utils/api'
import dayjs from 'dayjs'

const Exchanges = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const data = await api.get(`/admin/exchange-records?page=${page}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      })
      setRecords(data.records)
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total
      })
    } catch (error) {
      message.error('获取兑换记录失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户', dataIndex: 'username', key: 'username' },
    { title: '商品', dataIndex: 'product_name', key: 'product_name' },
    { title: '积分数', dataIndex: 'points', key: 'points', render: (v, r) => v * r.quantity },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    {
      title: '风控标记',
      dataIndex: 'risk_flag',
      key: 'risk_flag',
      render: (v, r) => v ? (
        <Tag color="red">异常
          {r.risk_reason && <span style={{ marginLeft: 4 }}>({r.risk_reason})</span>}
        </Tag>
      ) : <Tag color="green">正常</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={v === 'success' ? 'green' : 'orange'}>{v === 'success' ? '成功' : '处理中'}</Tag>
    },
    {
      title: '兑换IP',
      dataIndex: 'exchange_ip',
      key: 'exchange_ip',
      width: 120
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    }
  ]

  return (
    <Card title="兑换记录">
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => fetchRecords()}>全部</Button>
        <Button type="primary" onClick={() => fetchRecords(1, 10)}>仅看风控异常</Button>
      </Space>
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

export default Exchanges
