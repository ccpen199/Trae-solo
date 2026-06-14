import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Descriptions,
  Tabs,
  Table,
  Tag,
  Button,
  Spin,
  Alert,
  Space,
  Progress,
  Card,
  Modal,
  message,
  Form,
  Input,
  Row,
  Col,
} from 'antd'
import { ArrowLeftOutlined, RobotOutlined, FileTextOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { api } from '@/api'
import type { JobRequirement, ReviewRecord, JobMatch, Contract } from '@/types'

interface JobDetailData extends Omit<JobRequirement, 'tradeId' | 'tradeName' | 'employerId' | 'startDate' | 'endDate' | 'dailyWage' | 'projectName' | 'projectAddress' | 'workHours' | 'qualificationRequired' | 'createdAt' | 'updatedAt'> {
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
}

interface MatchDetail extends Omit<JobMatch, 'workerId' | 'matchScore' | 'skillMatchScore' | 'locationMatchScore' | 'performanceMatchScore' | 'createdAt'> {
  worker_id: number
  worker_name: string
  worker_phone: string
  trade_name: string
  daily_wage: number
  distance_km: number
  match_score: number
  skill_match_score: number
  location_match_score: number
  performance_match_score: number
  created_at: string
}

interface ReviewRecordItem extends Omit<ReviewRecord, 'reviewLevel' | 'reviewDate'> {
  review_level: 'ai' | 'manual' | 'site'
  review_date: string
}

interface ContractItem extends Omit<Contract, 'contractNumber' | 'dailyWage' | 'totalAmount' | 'startDate' | 'endDate' | 'workerSignedAt' | 'employerSignedAt' | 'createdAt'> {
  contract_number: string
  worker_name: string
  worker_phone: string
  employer_name: string
  daily_wage: number
  total_amount: number
  start_date: string
  end_date: string
  worker_signed_at?: string
  employer_signed_at?: string
  created_at: string
}



export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [contractLoading, setContractLoading] = useState(false)
  const [hiredLoading, setHiredLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<JobDetailData | null>(null)
  const [reviews, setReviews] = useState<ReviewRecordItem[]>([])
  const [matches, setMatches] = useState<MatchDetail[]>([])
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [hiredWorkers, setHiredWorkers] = useState<MatchDetail[]>([])
  const [matchModalVisible, setMatchModalVisible] = useState(false)
  const [contractModalVisible, setContractModalVisible] = useState(false)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [currentReviewLevel, setCurrentReviewLevel] = useState<'ai' | 'manual' | 'site' | null>(null)
  const [currentReviewResult, setCurrentReviewResult] = useState<'pass' | 'fail' | null>(null)
  const [reviewForm] = Form.useForm()

  useEffect(() => {
    if (id) {
      fetchJob(parseInt(id))
    }
  }, [id])

  useEffect(() => {
    if (id && job) {
      fetchReviews(parseInt(id))
      fetchMatches(parseInt(id))
      fetchContracts(parseInt(id))
      fetchHiredWorkers(parseInt(id))
    }
  }, [id, job])

  const fetchJob = async (jobId: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getJob(jobId)
      if (res.code === 0) {
        setJob(res.data)
      } else {
        setError(res.message || '获取招工详情失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (jobId: number) => {
    setReviewLoading(true)
    try {
      const res = await api.getJobReviews(jobId)
      if (res.code === 0) {
        setReviews(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setReviewLoading(false)
    }
  }

  const fetchMatches = async (jobId: number) => {
    setMatchLoading(true)
    try {
      const res = await api.getJobMatches(jobId)
      if (res.code === 0) {
        setMatches(res.data.filter((m: MatchDetail) => m.status !== 'hired'))
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err)
    } finally {
      setMatchLoading(false)
    }
  }

  const fetchContracts = async (jobId: number) => {
    setContractLoading(true)
    try {
      const res = await api.getContracts({ jobId, pageSize: 100 })
      if (res.code === 0) {
        setContracts(res.data.list || res.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err)
    } finally {
      setContractLoading(false)
    }
  }

  const fetchHiredWorkers = async (jobId: number) => {
    setHiredLoading(true)
    try {
      const res = await api.getJobMatches(jobId)
      if (res.code === 0) {
        setHiredWorkers(res.data.filter((m: MatchDetail) => m.status === 'hired'))
      }
    } catch (err) {
      console.error('Failed to fetch hired workers:', err)
    } finally {
      setHiredLoading(false)
    }
  }

  const handleStartMatch = async () => {
    if (!id) return
    try {
      setMatchModalVisible(true)
      const res = await api.matchJob(parseInt(id))
      if (res.code === 0) {
        message.success('智能匹配完成')
        setMatchModalVisible(false)
        fetchMatches(parseInt(id))
      } else {
        message.error(res.message || '匹配失败')
        setMatchModalVisible(false)
      }
    } catch (err: any) {
      message.error(err.message || '匹配失败')
      setMatchModalVisible(false)
    }
  }

  const handleGenerateContract = async () => {
    if (!id) return
    setContractModalVisible(true)
    try {
      const hiredList = matches.filter(m => m.status === 'accepted')
      if (hiredList.length === 0) {
        message.warning('请先录用工人后再生成合同')
        setContractModalVisible(false)
        return
      }
      for (const worker of hiredList) {
        const contractData = {
          jobId: parseInt(id),
          workerId: worker.worker_id,
          employerId: job?.employer_id,
          startDate: job?.start_date,
          endDate: job?.end_date,
          dailyWage: job?.daily_wage,
          totalAmount: 0,
          templateId: 1,
          content: '标准劳务合同',
        }
        await api.createContract(contractData)
      }
      message.success('合同生成成功')
      setContractModalVisible(false)
      fetchContracts(parseInt(id))
    } catch (err: any) {
      message.error(err.message || '合同生成失败')
      setContractModalVisible(false)
    }
  }

  const handleOpenReviewModal = (level: 'ai' | 'manual' | 'site', result: 'pass' | 'fail') => {
    setCurrentReviewLevel(level)
    setCurrentReviewResult(result)
    reviewForm.resetFields()
    setReviewModalVisible(true)
  }

  const handleSubmitReview = async () => {
    if (!id || !currentReviewLevel || !currentReviewResult) return
    try {
      const values = await reviewForm.validateFields()
      const res = await api.reviewJob(parseInt(id), currentReviewLevel, {
        result: currentReviewResult,
        comment: values.comment || '',
      })
      if (res.code === 0) {
        message.success(currentReviewResult === 'pass' ? '审核通过' : '审核驳回')
        setReviewModalVisible(false)
        fetchReviews(parseInt(id))
        fetchJob(parseInt(id))
      } else {
        message.error(res.message || '审核失败')
      }
    } catch (err: any) {
      if (err.errorFields) {
        return
      }
      message.error(err.message || '提交失败')
    }
  }

  const getReviewStatus = (level: 'ai' | 'manual' | 'site') => {
    const review = reviews.find(r => r.review_level === level)
    return review?.result || 'pending'
  }

  const handleAcceptMatch = async (matchId: number) => {
    try {
      const res = await api.updateMatchStatus(matchId, 'accepted')
      if (res.code === 0) {
        message.success('已接受')
        if (id) fetchMatches(parseInt(id))
      } else {
        message.error(res.message || '操作失败')
      }
    } catch (err: any) {
      message.error(err.message || '操作失败')
    }
  }

  const handleRejectMatch = async (matchId: number) => {
    try {
      const res = await api.updateMatchStatus(matchId, 'rejected')
      if (res.code === 0) {
        message.success('已拒绝')
        if (id) fetchMatches(parseInt(id))
      } else {
        message.error(res.message || '操作失败')
      }
    } catch (err: any) {
      message.error(err.message || '操作失败')
    }
  }

  const handleHireMatch = async (matchId: number) => {
    try {
      const res = await api.updateMatchStatus(matchId, 'hired')
      if (res.code === 0) {
        message.success('已录用')
        if (id) {
          fetchMatches(parseInt(id))
          fetchHiredWorkers(parseInt(id))
        }
      } else {
        message.error(res.message || '操作失败')
      }
    } catch (err: any) {
      message.error(err.message || '操作失败')
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

  const matchStatusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待确认' },
    accepted: { color: 'blue', text: '已接受' },
    rejected: { color: 'default', text: '已拒绝' },
    hired: { color: 'green', text: '已录用' },
  }

  const reviewLevelMap: Record<string, { color: string; text: string }> = {
    ai: { color: 'blue', text: 'AI初筛' },
    manual: { color: 'cyan', text: '人工复核' },
    site: { color: 'green', text: '工地核验' },
  }

  const resultMap: Record<string, { color: string; text: string }> = {
    pass: { color: 'success', text: '通过' },
    fail: { color: 'error', text: '不通过' },
    pending: { color: 'warning', text: '待处理' },
  }

  const contractStatusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    signed_by_worker: { color: 'blue', text: '工人已签' },
    signed_by_employer: { color: 'cyan', text: '雇主已签' },
    fully_signed: { color: 'green', text: '双方已签' },
    completed: { color: 'green', text: '已完成' },
    terminated: { color: 'red', text: '已终止' },
  }

  const reviewColumns = [
    {
      title: '审核级别',
      dataIndex: 'review_level',
      key: 'review_level',
      width: 120,
      render: (level: string) => {
        const info = reviewLevelMap[level] || reviewLevelMap.ai
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '审核人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 120,
    },
    {
      title: '审核结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result: string) => {
        const info = resultMap[result] || resultMap.pending
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '审核意见',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
    },
    {
      title: '审核时间',
      dataIndex: 'review_date',
      key: 'review_date',
      width: 180,
    },
  ]

  const reviewLevels: { key: 'ai' | 'manual' | 'site'; title: string; icon: string }[] = [
    { key: 'ai', title: 'AI初筛', icon: '🤖' },
    { key: 'manual', title: '人工复核', icon: '👤' },
    { key: 'site', title: '工地核验', icon: '🏗️' },
  ]

  const renderReviewFlow = () => (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      {reviewLevels.map((level, index) => {
        const status = getReviewStatus(level.key)
        const statusInfo = resultMap[status] || resultMap.pending
        const isPending = status === 'pending'
        return (
          <Col span={8} key={level.key}>
            <Card
              size="small"
              style={{
                borderColor: isPending ? '#d9d9d9' : status === 'pass' ? '#52c41a' : '#ff4d4f',
                borderWidth: 2,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{level.icon}</div>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{level.title}</div>
                <Tag color={statusInfo.color} style={{ marginBottom: 12 }}>
                  {statusInfo.text}
                </Tag>
                {isPending && (
                  <Space>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleOpenReviewModal(level.key, 'pass')}
                    >
                      通过
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => handleOpenReviewModal(level.key, 'fail')}
                    >
                      驳回
                    </Button>
                  </Space>
                )}
              </div>
            </Card>
          </Col>
        )
      })}
    </Row>
  )

  const matchColumns = [
    {
      title: '工人姓名',
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 120,
    },
    {
      title: '工人电话',
      dataIndex: 'worker_phone',
      key: 'worker_phone',
      width: 130,
    },
    {
      title: '工种',
      dataIndex: 'trade_name',
      key: 'trade_name',
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
      title: '距离(公里)',
      dataIndex: 'distance_km',
      key: 'distance_km',
      width: 100,
      render: (km: number) => `${km?.toFixed(1) || '-'}`,
    },
    {
      title: '匹配总分',
      dataIndex: 'match_score',
      key: 'match_score',
      width: 150,
      render: (score: number) => (
        <Progress
          percent={Math.round(score)}
          size="small"
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
        />
      ),
    },
    {
      title: '技能匹配分',
      dataIndex: 'skill_match_score',
      key: 'skill_match_score',
      width: 110,
      render: (score: number) => `${score?.toFixed(1) || '-'}`,
    },
    {
      title: '位置匹配分',
      dataIndex: 'location_match_score',
      key: 'location_match_score',
      width: 110,
      render: (score: number) => `${score?.toFixed(1) || '-'}`,
    },
    {
      title: '履约匹配分',
      dataIndex: 'performance_match_score',
      key: 'performance_match_score',
      width: 110,
      render: (score: number) => `${score?.toFixed(1) || '-'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = matchStatusMap[status] || matchStatusMap.pending
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: MatchDetail) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleAcceptMatch(record.id)}>
                接受
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleRejectMatch(record.id)}>
                拒绝
              </Button>
            </>
          )}
          {record.status === 'accepted' && (
            <Button type="link" size="small" onClick={() => handleHireMatch(record.id)}>
              录用
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const hiredColumns = [
    {
      title: '工人姓名',
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 120,
    },
    {
      title: '工人电话',
      dataIndex: 'worker_phone',
      key: 'worker_phone',
      width: 130,
    },
    {
      title: '工种',
      dataIndex: 'trade_name',
      key: 'trade_name',
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
      title: '匹配总分',
      dataIndex: 'match_score',
      key: 'match_score',
      width: 150,
      render: (score: number) => (
        <Progress
          percent={Math.round(score)}
          size="small"
          strokeColor="#52c41a"
        />
      ),
    },
    {
      title: '录用时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
  ]

  const contractColumns = [
    {
      title: '合同编号',
      dataIndex: 'contract_number',
      key: 'contract_number',
      width: 180,
    },
    {
      title: '工人姓名',
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 120,
    },
    {
      title: '工人电话',
      dataIndex: 'worker_phone',
      key: 'worker_phone',
      width: 130,
    },
    {
      title: '日薪',
      dataIndex: 'daily_wage',
      key: 'daily_wage',
      width: 100,
      render: (wage: number) => `¥${wage}`,
    },
    {
      title: '合同金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: number) => `¥${amount}`,
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
    },
    {
      title: '结束日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const info = contractStatusMap[status] || contractStatusMap.draft
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
  ]

  const tabItems = [
    {
      key: 'reviews',
      label: '审核记录',
      children: (
        <Spin spinning={reviewLoading}>
          {renderReviewFlow()}
          <Card title="审核历史" size="small">
            <Table
              columns={reviewColumns}
              dataSource={reviews}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: '暂无审核记录' }}
            />
          </Card>
        </Spin>
      ),
    },
    {
      key: 'matches',
      label: '智能匹配结果',
      children: (
        <Spin spinning={matchLoading}>
          <Table
            columns={matchColumns}
            dataSource={matches}
            rowKey="id"
            scroll={{ x: 1300 }}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: '暂无匹配结果，请点击"开始智能匹配"' }}
          />
        </Spin>
      ),
    },
    {
      key: 'hired',
      label: '已录用工人',
      children: (
        <Spin spinning={hiredLoading}>
          <Table
            columns={hiredColumns}
            dataSource={hiredWorkers}
            rowKey="id"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: '暂无已录用工人' }}
          />
        </Spin>
      ),
    },
    {
      key: 'contracts',
      label: '合同记录',
      children: (
        <Spin spinning={contractLoading}>
          <Table
            columns={contractColumns}
            dataSource={contracts}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: '暂无合同记录' }}
          />
        </Spin>
      ),
    },
  ]

  const formatDate = (dateStr: string) => {
    return dateStr?.split('T')[0] || '-'
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/jobs')}>
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>招工需求详情</h2>
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
        {job && (
          <>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div></div>
                <Space>
                  <Button icon={<RobotOutlined />} onClick={handleStartMatch}>
                    开始智能匹配
                  </Button>
                  <Button type="primary" icon={<FileTextOutlined />} onClick={handleGenerateContract}>
                    生成合同
                  </Button>
                </Space>
              </div>
              <Descriptions
                title="基本信息"
                bordered
                column={3}
                size="middle"
              >
                <Descriptions.Item label="ID">{job.id}</Descriptions.Item>
                <Descriptions.Item label="项目名称">{job.project_name}</Descriptions.Item>
                <Descriptions.Item label="雇主">{job.employer_name}</Descriptions.Item>
                <Descriptions.Item label="项目地址" span={2}>{job.project_address}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  {(() => {
                    const info = statusMap[job.status] || statusMap.draft
                    return <Tag color={info.color}>{info.text}</Tag>
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="工种">{job.trade_name}</Descriptions.Item>
                <Descriptions.Item label="招聘人数">{job.quantity} 人</Descriptions.Item>
                <Descriptions.Item label="日薪">¥{job.daily_wage}</Descriptions.Item>
                <Descriptions.Item label="开始日期">{formatDate(job.start_date)}</Descriptions.Item>
                <Descriptions.Item label="结束日期">{formatDate(job.end_date)}</Descriptions.Item>
                <Descriptions.Item label="工作时间">{job.work_hours || '-'}</Descriptions.Item>
                <Descriptions.Item label="资质要求" span={3}>{job.qualification_required || '-'}</Descriptions.Item>
                <Descriptions.Item label="项目描述" span={3}>{job.description || '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{job.created_at}</Descriptions.Item>
                <Descriptions.Item label="更新时间" span={2}>{job.updated_at}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card>
              <Tabs items={tabItems} defaultActiveKey="reviews" />
            </Card>
          </>
        )}
      </Spin>

      <Modal
        title="智能匹配中"
        open={matchModalVisible}
        footer={null}
        closable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>正在进行智能匹配，请稍候...</p>
        </div>
      </Modal>

      <Modal
        title="生成合同中"
        open={contractModalVisible}
        footer={null}
        closable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>正在生成合同，请稍候...</p>
        </div>
      </Modal>

      <Modal
        title={
          currentReviewLevel && currentReviewResult
            ? `${reviewLevelMap[currentReviewLevel]?.text || ''}${currentReviewResult === 'pass' ? '通过' : '驳回'}`
            : '审核'
        }
        open={reviewModalVisible}
        onOk={handleSubmitReview}
        onCancel={() => setReviewModalVisible(false)}
        okText="确认"
        cancelText="取消"
        width={500}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="comment"
            label="审核意见"
            rules={[{ required: currentReviewResult === 'fail', message: '驳回时请填写审核意见' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder={currentReviewResult === 'fail' ? '请输入驳回原因' : '请输入审核意见（可选）'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
