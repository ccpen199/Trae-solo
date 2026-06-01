import React, { useState, useEffect } from 'react'
import { Table, Card, Row, Col, Statistic, Tag, Select, Space, Button, Modal, message, Popconfirm, Tooltip } from 'antd'
import { ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import api from '../api.js'

const channelMap = {
  in_app: '站内信',
  browser: '浏览器通知',
  popup: '运营弹窗'
}

export default function SendRecords() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [taskId, setTaskId] = useState('')
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [failModal, setFailModal] = useState(false)
  const [failRecord, setFailRecord] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (taskId) params.taskId = taskId
      const res = await api.get('/send-records', { params })
      setData(res.list)
      setTotal(res.total)
    } catch (e) {
      message.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const params = {}
      if (taskId) params.taskId = taskId
      const res = await api.get('/send-records/stats', { params })
      setStats(res.stats)
    } catch (e) {}
  }

  useEffect(() => {
    api.get('/tasks', { params: { pageSize: 999 } }).then(res => setTasks(res.list)).catch(() => {})
  }, [])

  useEffect(() => { fetchData() }, [page, pageSize, taskId])
  useEffect(() => { fetchStats() }, [taskId])

  const handleRetry = async (record) => {
    try {
      await api.post(`/send-records/${record.id}/retry`)
      message.success('重试成功')
      fetchData()
      fetchStats()
      setFailModal(false)
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleViewFail = (record) => {
    setFailRecord(record)
    setFailModal(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '任务标题', dataIndex: 'task_title', width: 180, ellipsis: true },
    { title: '用户', dataIndex: 'user_name', width: 100 },
    {
      title: '渠道', dataIndex: 'channel', width: 100,
      render: (v) => <Tag color="blue">{channelMap[v] || v}</Tag>
    },
    {
      title: '送达', dataIndex: 'delivered', width: 70, align: 'center',
      render: (v) => v ? <Tag color="success">✓</Tag> : <Tag>-</Tag>
    },
    {
      title: '展示', dataIndex: 'displayed', width: 70, align: 'center',
      render: (v) => v ? <Tag color="success">✓</Tag> : <Tag>-</Tag>
    },
    {
      title: '点击', dataIndex: 'clicked', width: 70, align: 'center',
      render: (v) => v ? <Tag color="success">✓</Tag> : <Tag>-</Tag>
    },
    {
      title: '关闭', dataIndex: 'closed', width: 70, align: 'center',
      render: (v) => v ? <Tag color="warning">✓</Tag> : <Tag>-</Tag>
    },
    {
      title: '失败', dataIndex: 'failed', width: 70, align: 'center',
      render: (v) => v ? <Tag color="error">✓</Tag> : <Tag>-</Tag>
    },
    {
      title: '重试次数', dataIndex: 'retry_count', width: 80, align: 'center'
    },
    { title: '发送时间', dataIndex: 'created_at', width: 160 },
    {
      title: '操作', width: 120, fixed: 'right',
      render: (_, record) => record.failed ? (
        <Space>
          <Popconfirm title="确认重试该条记录？" onConfirm={() => handleRetry(record)}>
            <Button size="small" icon={<ReloadOutlined />}>重试</Button>
          </Popconfirm>
          <Tooltip title="查看失败原因">
            <Button size="small" icon={<ExclamationCircleOutlined />} onClick={() => handleViewFail(record)} />
          </Tooltip>
        </Space>
      ) : null
    }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card size="small"><Statistic title="总数" value={stats?.total || 0} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="送达" value={stats?.delivered || 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="展示" value={stats?.displayed || 0} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="点击" value={stats?.clicked || 0} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="点击率" value={stats?.ctr || '0%'} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="失败" value={stats?.failed || 0} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select allowClear placeholder="筛选任务" value={taskId} onChange={setTaskId}
            style={{ width: 240 }} options={tasks.map(t => ({ value: String(t.id), label: t.title }))} />
        </Space>
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
          locale={{ emptyText: '暂无发送记录，任务审批通过后点击「发送」即可生成推送数据' }}
          scroll={{ x: 1200 }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </Card>
      <Modal open={failModal} title="失败详情" onCancel={() => setFailModal(false)}
        footer={[
          <Button key="close" onClick={() => setFailModal(false)}>关闭</Button>,
          <Popconfirm key="retry" title="确认重试？" onConfirm={() => failRecord && handleRetry(failRecord)}>
            <Button type="primary" icon={<ReloadOutlined />}>重试</Button>
          </Popconfirm>
        ]}>
        {failRecord && (
          <div>
            <p><strong>记录ID:</strong> {failRecord.id}</p>
            <p><strong>用户:</strong> {failRecord.user_name}</p>
            <p><strong>任务:</strong> {failRecord.task_title}</p>
            <p><strong>失败原因:</strong> {failRecord.fail_reason || '未知原因'}</p>
            <p><strong>重试次数:</strong> {failRecord.retry_count}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}