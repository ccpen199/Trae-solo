import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Button, Space, message } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import request from '../utils/request'

const statusMap = {
  open: { color: 'green', text: '招聘中' },
  closed: { color: 'red', text: '已关闭' },
  pending: { color: 'orange', text: '审核中' },
  rejected: { color: 'volcano', text: '已拒绝' }
}

export default function EmployerJobsPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const fetchJobs = async (page = 1) => {
    setLoading(true)
    try {
      const res = await request.get('/jobs/mine', { params: { page, pageSize: pagination.pageSize } })
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

  const handleCloseJob = async (jobId) => {
    try {
      await request.put(`/jobs/${jobId}`, { status: 'closed' })
      message.success('岗位已关闭')
      fetchJobs(pagination.current)
    } catch (e) {
      // handled by interceptor
    }
  }

  const columns = [
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
      render: (val) => `${val}元/时`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const s = statusMap[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    {
      title: '工作地点',
      dataIndex: 'work_location',
      key: 'work_location',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/jobs/${record.id}`)}>
            查看
          </Button>
          {record.status === 'open' && (
            <Button size="small" danger onClick={() => handleCloseJob(record.id)}>
              关闭
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <Card
      title="我的岗位"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/employer/jobs/new')}>
          发布岗位
        </Button>
      }
    >
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
  )
}
