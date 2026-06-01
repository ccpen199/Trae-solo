import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Button, Input, Select, Tag, Space, DatePicker } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { taskAPI } from '../utils/api'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

function TaskList({ user }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    task_type: '',
    start_date: '',
    end_date: '',
    exception_reason: ''
  })

  useEffect(() => {
    loadTasks()
  }, [filters])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.task_type) params.task_type = filters.task_type
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.exception_reason) params.exception_reason = filters.exception_reason
      
      const response = await taskAPI.list(params)
      setTasks(response.data)
    } catch (error) {
      console.error('Load tasks failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 100,
      render: (type) => {
        const typeMap = {
          qa: { color: 'blue', text: '问答' },
          document: { color: 'green', text: '文档' },
          review: { color: 'orange', text: '审核' }
        }
        const info = typeMap[type] || { color: 'default', text: type }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (p) => {
        const map = { high: 'red', medium: 'orange', low: 'green' }
        return <Tag color={map[p] || 'default'}>{p}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          pending: { color: 'default', text: '待处理' },
          processing: { color: 'processing', text: '处理中' },
          reviewing: { color: 'warning', text: '待审核' },
          approved: { color: 'success', text: '已通过' },
          rejected: { color: 'error', text: '已拒绝' },
          completed: { color: 'success', text: '已完成' }
        }
        const info = statusMap[status] || { color: 'default', text: status }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '规则版本',
      dataIndex: 'rule_version',
      key: 'rule_version',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/tasks/${record.id}`)}>
          详情
        </Button>
      )
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>业务台账</h2>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索异常原因"
            prefix={<SearchOutlined />}
            value={filters.exception_reason}
            onChange={(e) => setFilters({ ...filters, exception_reason: e.target.value })}
            style={{ width: 200 }}
          />
          <Select
            placeholder="状态筛选"
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="pending">待处理</Option>
            <Option value="processing">处理中</Option>
            <Option value="reviewing">待审核</Option>
            <Option value="approved">已通过</Option>
            <Option value="rejected">已拒绝</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Select
            placeholder="类型筛选"
            value={filters.task_type}
            onChange={(v) => setFilters({ ...filters, task_type: v })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="qa">问答</Option>
            <Option value="document">文档</Option>
            <Option value="review">审核</Option>
          </Select>
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  ...filters,
                  start_date: dates[0].format('YYYY-MM-DD'),
                  end_date: dates[1].format('YYYY-MM-DD')
                })
              } else {
                setFilters({ ...filters, start_date: '', end_date: '' })
              }
            }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default TaskList
