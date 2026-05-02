import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  message,
} from 'antd'
import { PlusOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { transactionApi, commonApi } from '../../services/api'
import { formatCurrency, getStatusTag, formatDate, CURRENCIES, TRANSACTION_STATUSES, STATUS_NAMES, WORKFLOW_NODES, NODE_NAMES } from '../../utils/constants'
import { useAuthStore } from '../../store'

const { RangePicker } = DatePicker

function TransactionList() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  const [filters, setFilters] = useState({
    status: undefined,
    current_node: undefined,
    order_no: undefined,
    start_date: undefined,
    end_date: undefined,
  })

  const [statusOptions, setStatusOptions] = useState([])
  const [nodeOptions, setNodeOptions] = useState([])

  useEffect(() => {
    loadOptions()
  }, [])

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadOptions = () => {
    const statusOpts = Object.entries(STATUS_NAMES).map(([key, value]) => ({
      label: value,
      value: key,
    }))
    setStatusOptions(statusOpts)

    const nodeOpts = Object.entries(NODE_NAMES).map(([key, value]) => ({
      label: value,
      value: key,
    }))
    setNodeOptions(nodeOpts)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      }

      const res = await transactionApi.getList(params)
      if (res.data.success) {
        setData(res.data.data.transactions || [])
        setPagination((prev) => ({
          ...prev,
          total: res.data.data.pagination?.total || 0,
        }))
      }
    } catch (err) {
      console.error('Load transactions error:', err)
      message.error('加载交易列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
    loadData()
  }

  const handleReset = () => {
    setFilters({
      status: undefined,
      current_node: undefined,
      order_no: undefined,
      start_date: undefined,
      end_date: undefined,
    })
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const columns = [
    {
      title: '单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#1890ff', cursor: 'pointer' }}>
          {text}
        </span>
      ),
    },
    {
      title: '商户',
      dataIndex: 'merchant_name',
      key: 'merchant_name',
      width: 180,
    },
    {
      title: '买家',
      dataIndex: 'buyer_name',
      key: 'buyer_name',
      width: 140,
      render: (val) => val || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (val, record) => formatCurrency(val, record.currency),
    },
    {
      title: '目标币种金额',
      dataIndex: 'target_amount',
      key: 'target_amount',
      width: 160,
      render: (val, record) => val ? formatCurrency(val, record.target_currency) : '-',
    },
    {
      title: '汇率',
      dataIndex: 'exchange_rate',
      key: 'exchange_rate',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const tag = getStatusTag(status)
        return <Tag color={tag.color}>{tag.text}</Tag>
      },
    },
    {
      title: '当前节点',
      dataIndex: 'current_node',
      key: 'current_node',
      width: 120,
      render: (node) => <Tag color="blue">{NODE_NAMES[node] || node}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val) => formatDate(val),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => navigate(`/transactions/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ]

  const canCreate = user?.role_code === 'ADMIN' || 
                    user?.role_code === 'MERCHANT' || 
                    user?.role_code === 'MERCHANT_ADMIN'

  return (
    <div>
      <div className="page-header">
        <div className="page-title">交易管理</div>
        <div className="page-desc">查看和管理所有跨境支付交易</div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="middle">
          <Input
            placeholder="搜索单号"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={filters.order_no}
            onChange={(e) => setFilters((prev) => ({ ...prev, order_no: e.target.value || undefined }))}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态筛选"
            style={{ width: 160 }}
            allowClear
            value={filters.status}
            onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
            options={statusOptions}
          />
          <Select
            placeholder="节点筛选"
            style={{ width: 160 }}
            allowClear
            value={filters.current_node}
            onChange={(val) => setFilters((prev) => ({ ...prev, current_node: val }))}
            options={nodeOptions}
          />
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            style={{ width: 280 }}
            onChange={(dates) => {
              if (dates) {
                setFilters((prev) => ({
                  ...prev,
                  start_date: dates[0]?.format('YYYY-MM-DD'),
                  end_date: dates[1]?.format('YYYY-MM-DD'),
                }))
              } else {
                setFilters((prev) => ({
                  ...prev,
                  start_date: undefined,
                  end_date: undefined,
                }))
              }
            }}
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      <Card
        extra={
          canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/transactions/create')}
            >
              创建收款
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }))
            },
          }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-text">暂无交易记录</div>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  )
}

export default TransactionList
