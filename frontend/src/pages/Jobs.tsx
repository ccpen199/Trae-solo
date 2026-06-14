import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Form,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Space,
  Steps,
  Tooltip,
  Popover,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  RobotOutlined,
  UserOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { api } from '@/api'
import type { JobRequirement, Trade, Employer } from '@/types'

const { Option } = Select

interface JobListItem extends Omit<JobRequirement, 'tradeId' | 'tradeName' | 'employerId' | 'startDate' | 'endDate' | 'dailyWage' | 'projectName' | 'projectAddress' | 'workHours' | 'qualificationRequired' | 'createdAt' | 'updatedAt'> {
  trade_id: number
  trade_name: string
  employer_id: number
  employer_name: string
  start_date: string
  end_date: string
  daily_wage: number
  project_name: string
  project_address: string
  work_hours: string
  qualification_required: string
  created_at: string
  updated_at: string
  ai_review_status?: string
  ai_reviewer?: string
  ai_review_comment?: string
  ai_review_at?: string
  manual_review_status?: string
  manual_reviewer?: string
  manual_review_comment?: string
  manual_review_at?: string
  site_review_status?: string
  site_reviewer?: string
  site_review_comment?: string
  site_review_at?: string
}

export default function Jobs() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const filter = searchParams.get('filter')
  const isMyView = filter === 'my'
  const currentEmployerId = 1

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [total, setTotal] = useState(0)
  const [trades, setTrades] = useState<Trade[]>([])
  const [employers, setEmployers] = useState<Employer[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [employerId, setEmployerId] = useState<number | null>(isMyView ? currentEmployerId : null)
  const [tradeId, setTradeId] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [reviewType, setReviewType] = useState<'ai' | 'manual' | 'site'>('ai')
  const [selectedJob, setSelectedJob] = useState<JobListItem | null>(null)
  const [reviewForm] = Form.useForm()
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [targetStatus, setTargetStatus] = useState<string>('')

  useEffect(() => {
    fetchTrades()
    fetchEmployers()
  }, [])

  useEffect(() => {
    setEmployerId(isMyView ? currentEmployerId : null)
    setPage(1)
  }, [isMyView])

  useEffect(() => {
    fetchJobs()
  }, [page, employerId, tradeId, status, keyword])

  const fetchTrades = async () => {
    try {
      const res = await api.getTrades()
      if (res.code === 0) {
        setTrades(Array.isArray(res.data) ? res.data : (res.data as any).list || [])
      }
    } catch (err: any) {
      console.error('Failed to fetch trades:', err)
    }
  }

  const fetchEmployers = async () => {
    try {
      const res = await api.getEmployers({ pageSize: 1000 })
      if (res.code === 0) {
        setEmployers(res.data.list || res.data || [])
      }
    } catch (err: any) {
      console.error('Failed to fetch employers:', err)
    }
  }

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page, pageSize }
      if (employerId) params.employerId = employerId
      if (tradeId) params.tradeId = tradeId
      if (status) params.status = status
      if (keyword) params.keyword = keyword

      const res = await api.getJobs(params)
      if (res.code === 0) {
        setJobs(res.data.list || res.data || [])
        setTotal(res.data.total || 0)
      } else {
        setError(res.message || '获取招工列表失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(1)
  }

  const handleResetFilters = () => {
    setEmployerId(isMyView ? currentEmployerId : null)
    setTradeId(null)
    setStatus(null)
    setKeyword('')
    setPage(1)
  }

  const handleEmployerChange = (value: number | null) => {
    setEmployerId(value)
    setPage(1)
  }

  const handleTradeChange = (value: number | null) => {
    setTradeId(value)
    setPage(1)
  }

  const handleStatusChange = (value: string | null) => {
    setStatus(value)
    setPage(1)
  }

  const handleCreate = () => {
    navigate('/jobs/new')
  }

  const handleViewDetail = (id: number) => {
    navigate(`/jobs/${id}`)
  }

  const handleMatch = (id: number) => {
    navigate(`/jobs/${id}`)
  }

  const openReviewModal = (type: 'ai' | 'manual' | 'site', job: JobListItem) => {
    setReviewType(type)
    setSelectedJob(job)
    reviewForm.resetFields()
    setReviewModalVisible(true)
  }

  const handleReview = async () => {
    if (!selectedJob) return
    try {
      const values = await reviewForm.validateFields()
      const res = await api.reviewJob(selectedJob.id, reviewType, values)
      if (res.code === 0) {
        message.success(reviewType === 'ai' ? 'AI审核成功' : reviewType === 'manual' ? '人工审核成功' : '工地核验成功')
        setReviewModalVisible(false)
        fetchJobs()
      } else {
        message.error(res.message || '审核失败')
      }
    } catch (err: any) {
      if (err.errorFields) return
      message.error(err.message || '提交失败')
    }
  }

  const openStatusModal = (job: JobListItem, status: string) => {
    setSelectedJob(job)
    setTargetStatus(status)
    setStatusModalVisible(true)
  }

  const handleStatusChangeConfirm = async () => {
    if (!selectedJob) return
    try {
      const res = await api.updateJob(selectedJob.id, { status: targetStatus })
      if (res.code === 0) {
        message.success('状态更新成功')
        setStatusModalVisible(false)
        fetchJobs()
      } else {
        message.error(res.message || '状态更新失败')
      }
    } catch (err: any) {
      message.error(err.message || '更新失败')
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    pending_review: { color: 'orange', text: '待审核' },
    ai_reviewed: { color: 'blue', text: 'AI已审核' },
    manual_reviewed: { color: 'cyan', text: '人工已审核' },
    verified: { color: 'green', text: '已核验' },
    published: { color: 'green', text: '已发布' },
    filled: { color: 'purple', text: '已招满' },
    closed: { color: 'default', text: '已关闭' },
  }

  const reviewStatusMap: Record<string, { color: string; text: string; icon: any }> = {
    pass: { color: 'success', text: '通过', icon: <CheckCircleOutlined /> },
    fail: { color: 'error', text: '驳回', icon: <CloseCircleOutlined /> },
    pending: { color: 'warning', text: '待审', icon: <ClockCircleOutlined /> },
  }

  const renderReviewStatus = (status?: string, reviewer?: string, comment?: string, reviewAt?: string) => {
    if (!status || status === 'not_started') {
      return (
        <Tag color="default" icon={<ClockCircleOutlined />}>
          未开始
        </Tag>
      )
    }
    const info = reviewStatusMap[status] || reviewStatusMap.pending
    const content = (
      <div style={{ minWidth: 200 }}>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>状态：</strong>
          <Tag color={info.color}>{info.text}</Tag>
        </p>
        {reviewer && (
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>审核人：</strong>{reviewer}
          </p>
        )}
        {reviewAt && (
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>审核时间：</strong>{reviewAt?.split('T')[0]}
          </p>
        )}
        {comment && (
          <p style={{ margin: 0, color: status === 'fail' ? '#ff4d4f' : undefined }}>
            <strong>意见：</strong>{comment}
          </p>
        )}
      </div>
    )
    return (
      <Popover content={content} title="审核详情" trigger="hover">
        <Tag color={info.color} icon={info.icon}>
          {info.text}
          {reviewer && <span style={{ marginLeft: 4, opacity: 0.8 }}>({reviewer})</span>}
        </Tag>
      </Popover>
    )
  }

  const getEffectiveStatus = (record: JobListItem): string => {
    const aiPass = record.ai_review_status === 'pass'
    const manualPass = record.manual_review_status === 'pass'
    const sitePass = record.site_review_status === 'pass'

    if (record.status === 'published' && (!aiPass || !manualPass || !sitePass)) {
      if (!aiPass) return 'pending_review'
      if (!manualPass) return 'ai_reviewed'
      if (!sitePass) return 'manual_reviewed'
    }
    return record.status
  }

  const getCurrentStep = (status: string) => {
    const stepOrder: Record<string, number> = {
      draft: 0,
      pending_review: 1,
      ai_reviewed: 2,
      manual_reviewed: 3,
      verified: 4,
      published: 4,
      filled: 4,
      closed: 4,
    }
    return stepOrder[status] ?? 0
  }

  const getStepStatus = (stepIndex: number, currentStep: number, reviewStatus?: string) => {
    if (reviewStatus === 'pass') return 'finish'
    if (reviewStatus === 'fail') return 'error'
    if (reviewStatus === 'pending') return 'process'
    if (stepIndex < currentStep) return 'finish'
    if (stepIndex === currentStep) return 'process'
    return 'wait'
  }

  const getReviewStatusForStep = (stepIndex: number, record: JobListItem): string | undefined => {
    if (stepIndex === 1) return record.ai_review_status
    if (stepIndex === 2) return record.manual_review_status
    if (stepIndex === 3) return record.site_review_status
    return undefined
  }

  const renderLatestReviewComment = (record: JobListItem) => {
    const reviews = [
      { level: '工地核验', status: record.site_review_status, comment: record.site_review_comment, reviewer: record.site_reviewer, at: record.site_review_at },
      { level: '人工复核', status: record.manual_review_status, comment: record.manual_review_comment, reviewer: record.manual_reviewer, at: record.manual_review_at },
      { level: 'AI审核', status: record.ai_review_status, comment: record.ai_review_comment, reviewer: record.ai_reviewer, at: record.ai_review_at },
    ]
    const latest = reviews.find(r => r.status && r.comment)
    if (!latest) return null
    const isRejected = latest.status === 'fail'
    return (
      <Popover
        content={
          <div style={{ maxWidth: 300 }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>{latest.level}：</strong>{latest.reviewer}</p>
            <p style={{ margin: 0, color: isRejected ? '#ff4d4f' : undefined }}>{latest.comment}</p>
            {latest.at && <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: 12 }}>{latest.at.split('T')[0]}</p>}
          </div>
        }
        title="最新审核意见"
        trigger="hover"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <InfoCircleOutlined style={{ color: isRejected ? '#ff4d4f' : '#1890ff' }} />
          <Typography.Text
            ellipsis
            style={{
              maxWidth: 150,
              color: isRejected ? '#ff4d4f' : undefined,
            }}
          >
            {latest.comment}
          </Typography.Text>
        </div>
      </Popover>
    )
  }

  const getStatusOptions = () => {
    if (!selectedJob) return []
    const currentStatus = selectedJob.status
    const statusFlow: Record<string, string[]> = {
      draft: ['pending_review', 'closed'],
      pending_review: ['ai_reviewed', 'closed'],
      ai_reviewed: ['manual_reviewed', 'closed'],
      manual_reviewed: ['published', 'closed'],
      verified: ['published', 'closed'],
      published: ['filled', 'closed'],
      filled: ['closed'],
      closed: [],
    }
    return statusFlow[currentStatus] || []
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '项目地址',
      dataIndex: 'project_address',
      key: 'project_address',
      width: 200,
      ellipsis: true,
    },
    {
      title: '工种',
      dataIndex: 'trade_name',
      key: 'trade_name',
      width: 100,
    },
    {
      title: '招聘人数',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: '日薪',
      dataIndex: 'daily_wage',
      key: 'daily_wage',
      width: 100,
      render: (wage: number) => `¥${wage}`,
    },
    {
      title: '工期',
      key: 'duration',
      width: 200,
      render: (_: unknown, record: JobListItem) => {
        const start = record.start_date?.split('T')[0]
        const end = record.end_date?.split('T')[0]
        return `${start || '-'} ~ ${end || '-'}`
      },
    },
    {
      title: '审核流转进度',
      dataIndex: 'status',
      key: 'review_flow',
      width: 450,
      render: (_: unknown, record: JobListItem) => {
        const effectiveStatus = getEffectiveStatus(record)
        const currentStep = getCurrentStep(effectiveStatus)
        const steps = [
          { title: '草稿', icon: <FileTextOutlined /> },
          { title: 'AI审核', icon: <RobotOutlined /> },
          { title: '人工复核', icon: <UserOutlined /> },
          { title: '工地核验', icon: <SafetyOutlined /> },
          { title: '已发布', icon: <CheckCircleOutlined /> },
        ]
        return (
          <Steps
            current={currentStep}
            size="small"
            items={steps.map((step, idx) => ({
              title: step.title,
              icon: step.icon,
              status: getStepStatus(idx, currentStep, getReviewStatusForStep(idx, record)),
            }))}
          />
        )
      },
    },
    {
      title: 'AI审核状态',
      key: 'ai_review',
      width: 140,
      render: (_: unknown, record: JobListItem) =>
        renderReviewStatus(record.ai_review_status, record.ai_reviewer, record.ai_review_comment, record.ai_review_at),
    },
    {
      title: '人工审核状态',
      key: 'manual_review',
      width: 140,
      render: (_: unknown, record: JobListItem) =>
        renderReviewStatus(record.manual_review_status, record.manual_reviewer, record.manual_review_comment, record.manual_review_at),
    },
    {
      title: '工地核验状态',
      key: 'site_review',
      width: 140,
      render: (_: unknown, record: JobListItem) =>
        renderReviewStatus(record.site_review_status, record.site_reviewer, record.site_review_comment, record.site_review_at),
    },
    {
      title: '最新审核意见',
      key: 'latest_comment',
      width: 200,
      render: (_: unknown, record: JobListItem) => renderLatestReviewComment(record),
    },
    {
      title: '雇主名称',
      dataIndex: 'employer_name',
      key: 'employer_name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 350,
      fixed: 'right' as const,
      render: (_: unknown, record: JobListItem) => {
        const effectiveStatus = getEffectiveStatus(record)
        const canAiReview = effectiveStatus === 'draft' || effectiveStatus === 'pending_review'
        const canManualReview = effectiveStatus === 'ai_reviewed'
        const canSiteReview = effectiveStatus === 'manual_reviewed'
        return (
          <Space size="small" wrap>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
              查看详情
            </Button>
            <Button type="link" size="small" onClick={() => handleMatch(record.id)}>
              智能匹配
            </Button>
            <Tooltip title={canAiReview ? '' : '草稿或待审核状态才能进行AI审核'}>
              <Button
                type="primary"
                size="small"
                icon={<RobotOutlined />}
                disabled={!canAiReview}
                onClick={() => openReviewModal('ai', record)}
              >
                AI审核
              </Button>
            </Tooltip>
            <Tooltip title={canManualReview ? '' : 'AI审核通过后才能进行人工复核'}>
              <Button
                type="primary"
                size="small"
                icon={<UserOutlined />}
                disabled={!canManualReview}
                onClick={() => openReviewModal('manual', record)}
              >
                人工审核
              </Button>
            </Tooltip>
            <Tooltip title={canSiteReview ? '' : '人工复核通过后才能进行工地核验'}>
              <Button
                type="primary"
                size="small"
                icon={<SafetyOutlined />}
                disabled={!canSiteReview}
                onClick={() => openReviewModal('site', record)}
              >
                工地核验
              </Button>
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  const reviewModalTitle = () => {
    switch (reviewType) {
      case 'ai': return 'AI审核'
      case 'manual': return '人工审核'
      case 'site': return '工地核验'
    }
  }

  const getReviewTypeText = () => {
    switch (reviewType) {
      case 'ai': return 'AI'
      case 'manual': return '人工'
      case 'site': return '工地'
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>{isMyView ? '我的招工提交' : '招工需求管理'}</h2>
          {isMyView && (
            <Typography.Text type="secondary">
              已按当前账号筛选，可继续搜索项目名称、选择工种或审核状态。
            </Typography.Text>
          )}
        </div>
        <Space>
          <Tooltip title={selectedJob && (getEffectiveStatus(selectedJob) === 'draft' || getEffectiveStatus(selectedJob) === 'pending_review') ? '' : '请选择草稿或待审核状态的记录'}>
            <Button
              icon={<RobotOutlined />}
              disabled={!selectedJob || (getEffectiveStatus(selectedJob) !== 'draft' && getEffectiveStatus(selectedJob) !== 'pending_review')}
              onClick={() => selectedJob && openReviewModal('ai', selectedJob)}
            >
              AI审核
            </Button>
          </Tooltip>
          <Tooltip title={selectedJob && getEffectiveStatus(selectedJob) === 'ai_reviewed' ? '' : '请选择AI审核通过的记录'}>
            <Button
              icon={<UserOutlined />}
              disabled={!selectedJob || getEffectiveStatus(selectedJob) !== 'ai_reviewed'}
              onClick={() => selectedJob && openReviewModal('manual', selectedJob)}
            >
              人工审核
            </Button>
          </Tooltip>
          <Tooltip title={selectedJob && getEffectiveStatus(selectedJob) === 'manual_reviewed' ? '' : '请选择人工复核通过的记录'}>
            <Button
              icon={<SafetyOutlined />}
              disabled={!selectedJob || getEffectiveStatus(selectedJob) !== 'manual_reviewed'}
              onClick={() => selectedJob && openReviewModal('site', selectedJob)}
            >
              工地核验
            </Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            提交需求
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Select
            placeholder="选择雇主"
            allowClear
            style={{ width: '100%' }}
            value={employerId}
            onChange={handleEmployerChange}
            showSearch
            optionFilterProp="children"
          >
            {employers.map((e) => (
              <Option key={e.id} value={e.id}>
                {e.companyName}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={5}>
          <Select
            placeholder="选择工种"
            allowClear
            style={{ width: '100%' }}
            value={tradeId}
            onChange={handleTradeChange}
          >
            {trades.map((t) => (
              <Option key={t.id} value={t.id}>
                {t.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={5}>
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: '100%' }}
            value={status}
            onChange={handleStatusChange}
          >
            {Object.entries(statusMap).map(([key, value]) => (
              <Option key={key} value={key}>
                {value.text}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={9}>
          <Input.Search
            placeholder="搜索项目名称、地址"
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
          />
        </Col>
      </Row>

      <Space wrap style={{ marginBottom: 16 }}>
        <Button onClick={handleResetFilters}>重置筛选</Button>
        {isMyView && <Tag color="blue">我的提交</Tag>}
        {keyword && <Tag color="purple">搜索：{keyword}</Tag>}
        {status && <Tag color="orange">状态：{statusMap[status]?.text || status}</Tag>}
      </Space>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          scroll={{ x: 2800 }}
          rowSelection={{
            type: 'radio',
            onChange: (_, selectedRows) => {
              setSelectedJob(selectedRows[0] as JobListItem || null)
            },
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p) => setPage(p),
          }}
        />
      </Spin>

      <Modal
        title={reviewModalTitle()}
        open={reviewModalVisible}
        onOk={handleReview}
        onCancel={() => setReviewModalVisible(false)}
        width={500}
        okText="提交"
        cancelText="取消"
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="reviewer"
            label={`${getReviewTypeText()}审核人`}
            rules={[{ required: true, message: '请输入审核人' }]}
          >
            <Input placeholder={`请输入${getReviewTypeText()}审核人`} />
          </Form.Item>
          <Form.Item
            name="result"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择审核结果">
              <Option value="pass">通过</Option>
              <Option value="fail">不通过</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="comment"
            label="审核意见"
          >
            <Input.TextArea rows={4} placeholder="请输入审核意见" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认状态变更"
        open={statusModalVisible}
        onOk={handleStatusChangeConfirm}
        onCancel={() => setStatusModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <p>确定要将状态变更为 <strong>{statusMap[targetStatus]?.text || targetStatus}</strong> 吗？</p>
      </Modal>
    </div>
  )
}
