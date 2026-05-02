import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Switch,
  Space,
  message,
} from 'antd'
import { EyeOutlined, CheckOutlined } from '@ant-design/icons'
import { commonApi } from '../services/api'
import { formatDate, getNodeName } from '../utils/constants'
import { useAppStore } from '../store'

const TODO_STATUSES = {
  PENDING: '待处理',
  IN_PROGRESS: '处理中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

const TODO_STATUS_COLORS = {
  PENDING: 'orange',
  IN_PROGRESS: 'processing',
  COMPLETED: 'success',
  CANCELLED: 'default',
}

function TodoList() {
  const navigate = useNavigate()
  const setTodoCount = useAppStore((state) => state.setTodoCount)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [filters, setFilters] = useState({
    status: undefined,
  })

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      }

      const res = await commonApi.getTodos(params)
      if (res.data.success) {
        setData(res.data.data.todos || [])
        setPagination((prev) => ({
          ...prev,
          total: res.data.data.pagination?.total || 0,
        }))
      }
    } catch (err) {
      console.error('Load todos error:', err)
      message.error('加载待办列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      const res = await commonApi.updateTodo(id, { status })
      if (res.data.success) {
        message.success('状态更新成功')
        loadData()
        
        const statsRes = await commonApi.getTodos({ status: 'PENDING', page_size: 1 })
        if (statsRes.data.success) {
          setTodoCount(statsRes.data.data.pagination?.total || 0)
        }
      }
    } catch (err) {
      console.error('Update todo error:', err)
      message.error('更新状态失败')
    }
  }

  const columns = [
    {
      title: '待办标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '相关交易',
      dataIndex: 'transaction_order_no',
      key: 'transaction_order_no',
      width: 180,
      render: (val, record) => (
        <span style={{ color: '#1890ff', cursor: 'pointer' }}>
          {val || '-'}
        </span>
      ),
    },
    {
      title: '关联节点',
      dataIndex: 'related_node',
      key: 'related_node',
      width: 140,
      render: (val) => <Tag color="blue">{getNodeName(val)}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={TODO_STATUS_COLORS[status] || 'default'}>
          {TODO_STATUSES[status] || status}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (val) => {
        const colors = { high: 'red', medium: 'orange', low: 'default' }
        const labels = { high: '高', medium: '中', low: '低' }
        return <Tag color={colors[val]}>{labels[val] || val}</Tag>
      },
    },
    {
      title: '截止时间',
      dataIndex: 'due_at',
      key: 'due_at',
      width: 160,
      render: (val) => formatDate(val),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val) => formatDate(val),
    },
    {
      title: '标记完成',
      key: 'complete',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.status === 'PENDING' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleStatusChange(record.id, 'COMPLETED')}
            >
              完成
            </Button>
          )}
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => record.transaction_id && navigate(`/transactions/${record.transaction_id}`)}
            disabled={!record.transaction_id}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ]

  const statusOptions = Object.entries(TODO_STATUSES).map(([key, value]) => ({
    label: value,
    value: key,
  }))

  return (
    <div>
      <div className="page-header">
        <div className="page-title">待办任务</div>
        <div className="page-desc">查看和处理待办任务</div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="middle">
          <Select
            placeholder="状态筛选"
            style={{ width: 160 }}
            allowClear
            value={filters.status}
            onChange={(val) => {
              setFilters({ status: val })
              setPagination((prev) => ({ ...prev, current: 1 }))
            }}
            options={statusOptions}
          />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
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
                <div className="empty-icon">✅</div>
                <div className="empty-text">暂无待办任务</div>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  )
}

export default TodoList
