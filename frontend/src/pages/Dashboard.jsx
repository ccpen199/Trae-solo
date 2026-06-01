import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag } from 'antd'
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { taskAPI, documentAPI, reportAPI } from '../utils/api'
import dayjs from 'dayjs'

function Dashboard({ user }) {
  const [tasks, setTasks] = useState([])
  const [documents, setDocuments] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tasksRes, docsRes, summaryRes] = await Promise.all([
        taskAPI.list({ limit: 10 }),
        documentAPI.list({ limit: 10 }),
        reportAPI.tasksSummary()
      ])
      setTasks(tasksRes.data)
      setDocuments(docsRes.data)
      setSummary(summaryRes.data)
    } catch (error) {
      console.error('Load data failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const taskColumns = [
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    }
  ]

  const docColumns = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          pending: { color: 'default', text: '待审核' },
          approved: { color: 'success', text: '已发布' },
          rejected: { color: 'error', text: '已拒绝' }
        }
        const info = statusMap[status] || { color: 'default', text: status }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据概览</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="任务总数"
              value={summary?.total || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={summary?.by_status?.completed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={(summary?.by_status?.processing || 0) + (summary?.by_status?.reviewing || 0)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核"
              value={summary?.by_status?.reviewing || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近任务" loading={loading}>
            <Table
              columns={taskColumns}
              dataSource={tasks}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近文档" loading={loading}>
            <Table
              columns={docColumns}
              dataSource={documents}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
