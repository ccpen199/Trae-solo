import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, message, Card, Descriptions, Row, Col, Statistic, Popconfirm } from 'antd'
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import api from '../api.js'

const statusMap = {
  pending: { color: 'processing', text: '待审批' },
  approved: { color: 'success', text: '已通过' },
  rejected: { color: 'error', text: '已驳回' }
}

const checkLabels = {
  sensitive_check: '敏感词检查',
  duplicate_check: '重复发送检查',
  url_check: '跳转地址检查',
  freq_check: '频控冲突检查',
  gray_check: '灰度范围检查'
}

export default function ApprovalPage({ user }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [taskDetail, setTaskDetail] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/approvals')
      setData(res.list)
    } catch (e) {
      message.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleView = async (item) => {
    setCurrentItem(item)
    try {
      const task = await api.get(`/tasks/${item.task_id}`)
      setTaskDetail(task)
    } catch (e) {
      setTaskDetail(null)
    }
    setDetailVisible(true)
  }

  const handleApprove = async (item) => {
    try {
      await api.post(`/approvals/${item.id}/approve`, { approver: 'admin', comment: '审批通过' })
      message.success('审批通过')
      fetchData()
      setDetailVisible(false)
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleReject = async (item) => {
    try {
      await api.post(`/approvals/${item.id}/reject`, { approver: 'admin', comment: '审批驳回' })
      message.success('已驳回')
      fetchData()
      setDetailVisible(false)
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleResubmit = async (taskId) => {
    try {
      const res = await api.post(`/approvals/${taskId}/submit`)
      message.success(res.allPass ? '已重新提交审批' : '检查未通过，请修改后重试')
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  const isApprover = user && user.role === 'approver'

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '任务标题', dataIndex: 'task_title', width: 200, ellipsis: true },
    { title: '任务ID', dataIndex: 'task_id', width: 80 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag>
    },
    {
      title: '审批人', dataIndex: 'approver', width: 100,
      render: (v) => v || '-'
    },
    { title: '备注', dataIndex: 'comment', width: 200, ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', width: 160 },
    {
      title: '操作', width: 200, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          {isApprover && record.status === 'pending' && (
            <>
              <Popconfirm title="确认通过审批？" onConfirm={() => handleApprove(record)}>
                <Button size="small" type="primary" icon={<CheckOutlined />}>通过</Button>
              </Popconfirm>
              <Popconfirm title="确认驳回该审批？" onConfirm={() => handleReject(record)}>
                <Button size="small" danger icon={<CloseOutlined />}>驳回</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ]

  const stats = {
    pending: data.filter(d => d.status === 'pending').length,
    approved: data.filter(d => d.status === 'approved').length,
    rejected: data.filter(d => d.status === 'rejected').length
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card><Statistic title="待审批" value={stats.pending} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="已通过" value={stats.approved} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="已驳回" value={stats.rejected} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
          locale={{ emptyText: '暂无待审批任务，创建新任务后会自动进入审批流程' }}
          scroll={{ x: 1100 }} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal open={detailVisible} title="审批详情" onCancel={() => setDetailVisible(false)}
        footer={isApprover && currentItem && currentItem.status === 'pending' ? [
          <Button key="reject" danger icon={<CloseOutlined />}
            onClick={() => handleReject(currentItem)}>驳回</Button>,
          <Button key="approve" type="primary" icon={<CheckOutlined />}
            onClick={() => handleApprove(currentItem)}>通过</Button>
        ] : null} width={600}>
        {currentItem && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="审批ID">{currentItem.id}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentItem.status]?.color}>{statusMap[currentItem.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="审批人">{currentItem.approver || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注">{currentItem.comment || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentItem.created_at}</Descriptions.Item>
            </Descriptions>
            <Row gutter={8} style={{ marginTop: 16 }}>
              {Object.entries(checkLabels).map(([key, label]) => (
                <Col span={12} key={key}>
                  <Card size="small" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{label}</span>
                      <Tag color={currentItem[key] ? 'success' : 'error'}>
                        {currentItem[key] ? '通过' : '未通过'}
                      </Tag>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            {taskDetail && (
              <Card title="任务详情" size="small" style={{ marginTop: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="标题">{taskDetail.title}</Descriptions.Item>
                  <Descriptions.Item label="正文">{taskDetail.content}</Descriptions.Item>
                  <Descriptions.Item label="跳转地址">{taskDetail.jump_url || '-'}</Descriptions.Item>
                  <Descriptions.Item label="样式">{taskDetail.style}</Descriptions.Item>
                  <Descriptions.Item label="渠道">
                    {taskDetail.channels.map(c => <Tag key={c}>{c}</Tag>)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}