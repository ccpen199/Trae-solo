import React, { useEffect, useState } from 'react'
import { Table, Tag, DatePicker, Button, Input, Select, Row, Col } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { transactionAPI } from '../../utils/api.js'

function AdminTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({
    student_id: '',
    device_id: '',
    start_date: null,
    end_date: null,
  })

  useEffect(() => {
    loadTransactions()
  }, [pagination.current, pagination.pageSize])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      }
      const response = await transactionAPI.getTransactions(params)
      setTransactions(response.data.transactions)
      setPagination(p => ({ ...p, total: response.data.total }))
    } catch (error) {
      console.error('加载交易记录失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }))
    loadTransactions()
  }

  const handleReset = () => {
    setFilters({
      student_id: '',
      device_id: '',
      start_date: null,
      end_date: null,
    })
    setPagination(p => ({ ...p, current: 1 }))
    setTimeout(loadTransactions, 0)
  }

  const columns = [
    {
      title: '交易ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '学号',
      dataIndex: 'student_id',
      key: 'student_id',
    },
    {
      title: '设备',
      dataIndex: 'device_id',
      key: 'device_id',
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (text) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (text) => text ? `${Math.floor(text / 60)}分${text % 60}秒` : '-',
    },
    {
      title: '用水量(L)',
      dataIndex: 'water_used',
      key: 'water_used',
      render: (text) => text?.toFixed(1) || '-',
    },
    {
      title: '平均水温(°C)',
      dataIndex: 'avg_temp',
      key: 'avg_temp',
      render: (text) => text?.toFixed(1) || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{text?.toFixed(2) || '0.00'}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          completed: 'success',
          active: 'processing',
          pending: 'warning',
        }
        const textMap = {
          completed: '已完成',
          active: '进行中',
          pending: '待处理',
        }
        return <Tag color={colorMap[status]}>{textMap[status] || status}</Tag>
      },
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>交易记录</h2>

      <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="学号"
              prefix={<SearchOutlined />}
              value={filters.student_id}
              onChange={(e) => setFilters(f => ({ ...f, student_id: e.target.value }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="设备ID"
              prefix={<SearchOutlined />}
              value={filters.device_id}
              onChange={(e) => setFilters(f => ({ ...f, device_id: e.target.value }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => setFilters(f => ({ 
                ...f, 
                start_date: dates?.[0]?.format('YYYY-MM-DD') || null,
                end_date: dates?.[1]?.format('YYYY-MM-DD') || null,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button type="primary" onClick={handleSearch} style={{ marginRight: 8 }}>
              搜索
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={transactions}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize })),
        }}
      />
    </div>
  )
}

export default AdminTransactions
