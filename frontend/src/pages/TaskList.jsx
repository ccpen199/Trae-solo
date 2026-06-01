import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, message, Popconfirm, Input, Select, Card, Row, Col, Statistic } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, SearchOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'

const statusMap = {
  draft: { color: 'default', text: '草稿' },
  pending_approval: { color: 'processing', text: '待审批' },
  approved: { color: 'success', text: '已通过' },
  rejected: { color: 'error', text: '已驳回' },
  sent: { color: 'blue', text: '已发送' },
  sending: { color: 'cyan', text: '发送中' }
}

const styleMap = {
  info: '蓝色',
  success: '绿色',
  warning: '橙色',
  error: '红色'
}

const channelMap = {
  in_app: '站内信',
  browser: '浏览器通知',
  popup: '运营弹窗'
}

export default function TaskList({ user }) {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewTask, setPreviewTask] = useState(null)
  const [stats, setStats] = useState({ total: 0, sent: 0, pending: 0, draft: 0 })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/tasks', { params: { page, pageSize, keyword, status: statusFilter } })
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
      const all = await api.get('/tasks', { params: { pageSize: 9999 } })
      const sent = all.list.filter(t => t.status === 'sent').length
      const pending = all.list.filter(t => t.status === 'pending_approval').length
      const draft = all.list.filter(t => t.status === 'draft' || t.status === 'rejected').length
      setStats({ total: all.total, sent, pending, draft })
    } catch (e) {}
  }

  useEffect(() => { fetchData() }, [page, pageSize, keyword, statusFilter])
  useEffect(() => { fetchStats() }, [])

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`)
      message.success('删除成功')
      fetchData()
      fetchStats()
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleSend = async (id) => {
    try {
      const res = await api.post(`/tasks/${id}/send`)
      message.success(`发送成功，触达 ${res.userCount} 人，发送 ${res.sentCount} 条`)
      fetchData()
      fetchStats()
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleSubmitApproval = async (id) => {
    try {
      const res = await api.post(`/approvals/${id}/submit`)
      if (res.allPass) {
        message.success('已提交审批')
      } else {
        message.warning('检查未通过，请查看详情后修改')
      }
      fetchData()
      fetchStats()
    } catch (e) {
      message.error(e.message)
    }
  }

  const handlePreview = (record) => {
    setPreviewTask(record)
    setPreviewVisible(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', width: 180, ellipsis: true },
    { title: '正文摘要', dataIndex: 'content', width: 200, ellipsis: true },
    {
      title: '渠道', dataIndex: 'channels', width: 160,
      render: (ch) => ch.map(c => <Tag key={c} color="blue">{channelMap[c] || c}</Tag>)
    },
    {
      title: '样式', dataIndex: 'style', width: 80,
      render: (s) => <Tag color={s}>{styleMap[s] || s}</Tag>
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (s) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag>
    },
    { title: '发送数', dataIndex: 'send_count', width: 80 },
    { title: '创建时间', dataIndex: 'created_at', width: 160 },
    {
      title: '操作', width: 360, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/tasks/${record.id}/edit`)}>编辑</Button>
          {(record.status === 'draft' || record.status === 'rejected') && (
            <Popconfirm title="确认提交审批？" onConfirm={() => handleSubmitApproval(record.id)}>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>提交审批</Button>
            </Popconfirm>
          )}
          {record.status === 'approved' && (
            <Popconfirm title="确认发送该任务？" onConfirm={() => handleSend(record.id)}>
              <Button size="small" type="primary" icon={<SendOutlined />}>发送</Button>
            </Popconfirm>
          )}
          <Popconfirm title="确认删除该任务？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="任务总数" value={stats.total} /></Card></Col>
        <Col span={6}><Card><Statistic title="已发送" value={stats.sent} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="待审批" value={stats.pending} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="草稿/驳回" value={stats.draft} valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input allowClear placeholder="搜索标题" prefix={<SearchOutlined />} value={keyword}
            onChange={e => setKeyword(e.target.value)} style={{ width: 200 }} />
          <Select allowClear placeholder="状态筛选" value={statusFilter} onChange={setStatusFilter}
            style={{ width: 140 }} options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text }))} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/new')}>新建任务</Button>
        </Space>
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无消息任务，点击右上角「新建任务」创建第一条推送' }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </Card>
      <Modal open={previewVisible} title="消息预览" onCancel={() => setPreviewVisible(false)}
        footer={null} width={500}>
        {previewTask && (
          <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#1677ff' }}>
              [{styleMap[previewTask.style]}] {previewTask.title}
            </div>
            <div style={{ marginBottom: 8, color: '#333' }}>{previewTask.content}</div>
            <div style={{ color: '#999', fontSize: 12 }}>
              {previewTask.jump_url && <span>跳转: {previewTask.jump_url}</span>}
            </div>
            <div style={{ marginTop: 8 }}>
              {previewTask.channels.map(c => <Tag key={c} color="blue">{channelMap[c] || c}</Tag>)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}