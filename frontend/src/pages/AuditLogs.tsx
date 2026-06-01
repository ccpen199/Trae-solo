import { useState, useEffect } from 'react'
import { Table, Card, DatePicker, Select, Input, Row, Col, Tag, App } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { dashboardApi } from '../services/api'
import type { AuditLog } from '../types'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const AuditLogs = () => {
  const [data, setData] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    operator: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null
  })
  const { message } = App.useApp()

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize
      }
      if (filters.module) params.module = filters.module
      if (filters.action) params.action = filters.action
      if (filters.operator) params.operator = filters.operator
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD')
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD')
      }
      const res = await dashboardApi.getAuditLogs(params)
      if (res.data.success) {
        setData(res.data.data.list)
        setTotal(res.data.data.total)
      }
    } catch (error) {
      message.error('加载审计日志失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination, filters])

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    loadData()
  }

  const handleReset = () => {
    setFilters({ module: '', action: '', operator: '', dateRange: null })
    setPagination({ ...pagination, current: 1 })
  }

  const getModuleTag = (module: string) => {
    const colors: Record<string, string> = {
      'farmer': 'blue',
      'credit': 'green',
      'order': 'purple',
      'repayment': 'cyan',
      'risk': 'orange',
      'system': 'gray'
    }
    const labels: Record<string, string> = {
      'farmer': '农户',
      'credit': '授信',
      'order': '订单',
      'repayment': '还款',
      'risk': '风控',
      'system': '系统'
    }
    return <Tag color={colors[module] || 'default'}>{labels[module] || module}</Tag>
  }

  const getActionTag = (action: string) => {
    const colors: Record<string, string> = {
      'create': 'green',
      'update': 'blue',
      'delete': 'red',
      'approve': 'cyan',
      'reject': 'red',
      'cancel': 'orange',
      'repay': 'green'
    }
    return <Tag color={colors[action] || 'default'}>{action}</Tag>
  }

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 80,
      render: (v: string) => getModuleTag(v)
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 80,
      render: (v: string) => getActionTag(v)
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100
    },
    {
      title: '操作详情',
      dataIndex: 'details',
      key: 'details',
      render: (v: string) => {
        try {
          const obj = JSON.parse(v)
          return (
            <div style={{ fontSize: 12, color: '#666' }}>
              {Object.entries(obj).map(([k, val]) => (
                <div key={k}>{k}: {String(val)}</div>
              ))}
            </div>
          )
        } catch {
          return <span style={{ fontSize: 12, color: '#666' }}>{v}</span>
        }
      }
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120
    }
  ]

  return (
    <div>
      <Card title="审计日志查询" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              placeholder="选择模块"
              allowClear
              style={{ width: '100%' }}
              value={filters.module || undefined}
              onChange={(v) => setFilters({ ...filters, module: v })}
              options={[
                { value: 'farmer', label: '农户' },
                { value: 'credit', label: '授信' },
                { value: 'order', label: '订单' },
                { value: 'repayment', label: '还款' },
                { value: 'risk', label: '风控' },
                { value: 'system', label: '系统' }
              ]}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择操作"
              allowClear
              style={{ width: '100%' }}
              value={filters.action || undefined}
              onChange={(v) => setFilters({ ...filters, action: v })}
              options={[
                { value: 'create', label: '创建' },
                { value: 'update', label: '更新' },
                { value: 'delete', label: '删除' },
                { value: 'approve', label: '审批通过' },
                { value: 'reject', label: '审批拒绝' },
                { value: 'cancel', label: '取消' },
                { value: 'repay', label: '还款' }
              ]}
            />
          </Col>
          <Col span={6}>
            <Input
              placeholder="操作人"
              allowClear
              value={filters.operator}
              onChange={(e) => setFilters({ ...filters, operator: e.target.value })}
            />
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(v) => setFilters({ ...filters, dateRange: v as [dayjs.Dayjs, dayjs.Dayjs] | null })}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: 16 }}>
          <Col>
            <button
              className="ant-btn ant-btn-primary"
              onClick={handleSearch}
              style={{ marginRight: 8 }}
            >
              <SearchOutlined /> 查询
            </button>
            <button
              className="ant-btn"
              onClick={handleReset}
            >
              重置
            </button>
          </Col>
        </Row>
      </Card>

      <Card title="审计日志记录" size="small">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize })
          }}
        />
      </Card>
    </div>
  )
}

export default AuditLogs
