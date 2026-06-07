import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Space, Modal, Input, Typography, Spin, message } from 'antd'
import { FlagOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import request from '../../utils/request'

const { Title } = Typography
const { TextArea } = Input

export default function JobAuditPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [currentJob, setCurrentJob] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const fetchJobs = async (page = 1) => {
    setLoading(true)
    try {
      const res = await request.get('/admin/jobs/audit', { params: { page, pageSize: pagination.pageSize } })
      const data = res.data || res
      setJobs(data.list || data.jobs || data.items || [])
      setPagination((prev) => ({ ...prev, current: page, total: data.total || 0 }))
    } catch (e) {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs(1)
  }, [])

  const handleApprove = async (jobId) => {
    setActionLoading(true)
    try {
      await request.put(`/admin/jobs/${jobId}/approve`)
      message.success('已通过审核')
      fetchJobs(pagination.current)
    } catch (e) {
      // handled by interceptor
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('请填写拒绝原因')
      return
    }
    setActionLoading(true)
    try {
      await request.put(`/admin/jobs/${currentJob.id}/reject`, { reason: rejectReason })
      message.success('已拒绝')
      setRejectModalOpen(false)
      setRejectReason('')
      setCurrentJob(null)
      fetchJobs(pagination.current)
    } catch (e) {
      // handled by interceptor
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '岗位名称',
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
      title: '时薪',
      dataIndex: 'hourly_wage',
      key: 'hourly_wage',
      width: 100,
      render: (val) => val ? `${val}元/时` : '-'
    },
    {
      title: '发布者',
      dataIndex: 'employer_name',
      key: 'employer_name',
      width: 120,
      render: (val, record) => val || record.employer_id || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const map = {
          pending: { color: 'orange', text: '待审核' },
          approved: { color: 'green', text: '已通过' },
          rejected: { color: 'red', text: '已拒绝' }
        }
        const s = map[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) =>
        record.status === 'pending' ? (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              loading={actionLoading}
              onClick={() => handleApprove(record.id)}
            >
              通过
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => { setCurrentJob(record); setRejectModalOpen(true) }}
            >
              拒绝
            </Button>
          </Space>
        ) : (
          <Tag color="default">已处理</Tag>
        )
    }
  ]

  return (
    <div>
      <Card title={<><FlagOutlined /> 岗位审核</>}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={jobs}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: fetchJobs,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      <Modal
        title="拒绝岗位"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setRejectReason(''); setCurrentJob(null) }}
        okText="确认拒绝"
        cancelText="取消"
        confirmLoading={actionLoading}
      >
        <TextArea
          rows={4}
          placeholder="请输入拒绝原因"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  )
}
