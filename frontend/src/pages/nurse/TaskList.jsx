import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, message, Input, Select, Popconfirm } from 'antd'
import { SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, EnvironmentOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import request from '../../utils/request'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS } from '../../utils/constants'

const { Search } = Input
const { Option } = Select

const TaskList = () => {
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [searchText, setSearchText] = useState('')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    let filtered = tasks
    if (searchText) {
      filtered = filtered.filter(t => 
        t.order_no?.toLowerCase().includes(searchText.toLowerCase()) ||
        t.patient_name?.includes(searchText)
      )
    }
    if (status) {
      filtered = filtered.filter(t => t.status === status)
    }
    setFilteredTasks(filtered)
  }, [searchText, status, tasks])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const data = await request.get('/nurse/tasks')
      setTasks(data.list || data || [])
      setFilteredTasks(data.list || data || [])
    } catch (error) {
      message.error('获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id) => {
    try {
      await request.post(`/nurse/tasks/${id}/accept`)
      message.success('接单成功')
      fetchTasks()
    } catch (error) {
      message.error('接单失败')
    }
  }

  const handleReject = async (id) => {
    try {
      await request.post(`/nurse/tasks/${id}/reject`)
      message.success('已拒单')
      fetchTasks()
    } catch (error) {
      message.error('拒单失败')
    }
  }

  const handleCheckIn = async (id) => {
    try {
      await request.post(`/nurse/tasks/${id}/checkin`)
      message.success('签到成功')
      fetchTasks()
    } catch (error) {
      message.error('签到失败')
    }
  }

  const handleViewDetail = (record) => {
    navigate(`/nurse/tasks/${record.id}`)
  }

  const handleNursingRecord = (record) => {
    navigate(`/nurse/tasks/${record.id}/record`)
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 140
    },
    {
      title: '患者姓名',
      dataIndex: 'patient_name',
      key: 'patient_name'
    },
    {
      title: '服务地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: '预约时间',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      width: 160
    },
    {
      title: '服务项目',
      dataIndex: 'service_name',
      key: 'service_name'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status]} className="status-tag">
          {ORDER_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space className="table-actions">
          {record.status === ORDER_STATUS.DISPATCHED && (
            <>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleAccept(record.id)}>
                接单
              </Button>
              <Popconfirm
                title="确定拒绝该任务？"
                onConfirm={() => handleReject(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button size="small" danger icon={<CloseOutlined />}>
                  拒单
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === ORDER_STATUS.NURSE_ACCEPTED && (
            <Button type="primary" size="small" icon={<EnvironmentOutlined />} onClick={() => handleCheckIn(record.id)}>
              签到
            </Button>
          )}
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {(record.status === ORDER_STATUS.IN_PROGRESS || record.status === ORDER_STATUS.COMPLETED) && (
            <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => handleNursingRecord(record)}>
              护理记录
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2>我的任务</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select placeholder="选择状态" style={{ width: 150 }} allowClear onChange={setStatus}>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
          <Search
            placeholder="搜索订单号/患者姓名"
            allowClear
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={filteredTasks}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}

export default TaskList
