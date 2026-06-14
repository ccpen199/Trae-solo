import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Descriptions,
  Tabs,
  Table,
  Tag,
  Rate,
  Button,
  Spin,
  Alert,
  Space,
  Progress,
  Card,
  Empty,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { api } from '@/api'
import type { Worker, Trade } from '@/types'

interface WorkerDetailData extends Omit<Worker, 'tradeIds' | 'healthStatus' | 'idCard' | 'performanceScore' | 'createdAt' | 'updatedAt'> {
  trade_ids: number[]
  health_status: 'green' | 'yellow' | 'red'
  id_card: string
  performance_score: number
  health_code_source: string
  health_code_updated_at: string
  nucleic_acid_status: '阴性' | '阳性' | '未检测'
  vaccination_status: '未接种' | '一针' | '二针' | '三针'
  created_at: string
  updated_at: string
}

interface CertificateItem {
  id: number
  worker_id: number
  certificate_type: string
  certificate_number: string
  issuing_authority: string
  issue_date: string
  expiry_date: string
  ocr_result: string
  verified: boolean
}

interface ReviewItem {
  id: number
  worker_id: number
  project_id: number
  project_name: string
  rating: number
  comment: string
  reviewer: string
  review_date: string
  work_quality: number
  attendance: number
  discipline: number
  safety: number
  teamwork: number
}

interface TrainingItem {
  id: number
  worker_id: number
  training_name: string
  training_date: string
  training_hours: number
  exam_score: number
  passed: boolean
  certificate_number?: string
}

interface MatchItem {
  id: number
  job_id: number
  worker_id: number
  match_score: number
  skill_match_score: number
  location_match_score: number
  performance_match_score: number
  status: 'pending' | 'accepted' | 'rejected' | 'hired'
  worker_notified: boolean
  employer_notified: boolean
  created_at: string
  project_name: string
  trade_name: string
  daily_wage: number
  project_address: string
  employer_name: string
}

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [certLoading, setCertLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [trainingLoading, setTrainingLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [worker, setWorker] = useState<WorkerDetailData | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [certificates, setCertificates] = useState<CertificateItem[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [trainings, setTrainings] = useState<TrainingItem[]>([])
  const [matches, setMatches] = useState<MatchItem[]>([])

  useEffect(() => {
    if (id) {
      fetchWorker(parseInt(id))
      fetchTrades()
    }
  }, [id])

  useEffect(() => {
    if (id && worker) {
      fetchCertificates(parseInt(id))
      fetchReviews(parseInt(id))
      fetchTrainings(parseInt(id))
      fetchMatches(parseInt(id))
    }
  }, [id, worker])

  const fetchTrades = async () => {
    try {
      const res = await api.getTrades()
      if (res.code === 0) {
        setTrades(Array.isArray(res.data) ? res.data : (res.data as any).list || [])
      }
    } catch (err) {
      console.error('Failed to fetch trades:', err)
    }
  }

  const fetchWorker = async (workerId: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getWorker(workerId)
      if (res.code === 0) {
        setWorker(res.data)
      } else {
        setError(res.message || '获取工人信息失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const fetchCertificates = async (workerId: number) => {
    setCertLoading(true)
    try {
      const res = await api.getWorkerCertificates(workerId)
      if (res.code === 0) {
        setCertificates(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err)
    } finally {
      setCertLoading(false)
    }
  }

  const fetchReviews = async (workerId: number) => {
    setReviewLoading(true)
    try {
      const res = await api.getWorkerReviews(workerId)
      if (res.code === 0) {
        setReviews(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setReviewLoading(false)
    }
  }

  const fetchTrainings = async (workerId: number) => {
    setTrainingLoading(true)
    try {
      const res = await api.getWorkerTrainings(workerId)
      if (res.code === 0) {
        setTrainings(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch trainings:', err)
    } finally {
      setTrainingLoading(false)
    }
  }

  const fetchMatches = async (workerId: number) => {
    setMatchLoading(true)
    try {
      const res = await api.getMatches({ workerId, pageSize: 100 })
      if (res.code === 0) {
        setMatches(res.data.list)
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err)
    } finally {
      setMatchLoading(false)
    }
  }

  const healthStatusMap: Record<string, { color: string; text: string }> = {
    green: { color: 'success', text: '绿色' },
    yellow: { color: 'warning', text: '黄色' },
    red: { color: 'error', text: '红色' },
  }

  const nucleicAcidStatusMap: Record<string, { color: string; text: string }> = {
    '阴性': { color: 'success', text: '阴性' },
    '阳性': { color: 'error', text: '阳性' },
    '未检测': { color: 'default', text: '未检测' },
  }

  const vaccinationStatusMap: Record<string, { color: string; text: string }> = {
    '未接种': { color: 'default', text: '未接种' },
    '一针': { color: 'processing', text: '一针' },
    '二针': { color: 'warning', text: '二针' },
    '三针': { color: 'success', text: '三针' },
  }

  const getTradeNames = (tradeIds: number[]) => {
    return tradeIds
      .map(id => trades.find(t => t.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'default', text: '待处理' },
    accepted: { color: 'processing', text: '已接受' },
    rejected: { color: 'error', text: '已拒绝' },
    hired: { color: 'success', text: '已录用' },
  }

  const certColumns = [
    {
      title: '证书类型',
      dataIndex: 'certificate_type',
      key: 'certificate_type',
      width: 150,
    },
    {
      title: '证书编号',
      dataIndex: 'certificate_number',
      key: 'certificate_number',
      width: 180,
    },
    {
      title: '发证机关',
      dataIndex: 'issuing_authority',
      key: 'issuing_authority',
    },
    {
      title: '发证日期',
      dataIndex: 'issue_date',
      key: 'issue_date',
      width: 120,
    },
    {
      title: '有效期',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 120,
    },
    {
      title: 'OCR识别结果',
      dataIndex: 'ocr_result',
      key: 'ocr_result',
      ellipsis: true,
    },
    {
      title: '审核状态',
      dataIndex: 'verified',
      key: 'verified',
      width: 100,
      render: (verified: boolean) => (
        <Tag color={verified ? 'success' : 'default'}>
          {verified ? '已审核' : '待审核'}
        </Tag>
      ),
    },
  ]

  const reviewColumns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
    },
    {
      title: '综合评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (rating: number) => <Rate disabled value={rating} />,
    },
    {
      title: '评价人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 100,
    },
    {
      title: '评价日期',
      dataIndex: 'review_date',
      key: 'review_date',
      width: 120,
    },
    {
      title: '工作质量',
      dataIndex: 'work_quality',
      key: 'work_quality',
      width: 100,
      render: (score: number) => (
        <Progress
          percent={score * 20}
          size="small"
          strokeColor="#52c41a"
        />
      ),
    },
    {
      title: '出勤',
      dataIndex: 'attendance',
      key: 'attendance',
      width: 100,
      render: (score: number) => (
        <Progress
          percent={score * 20}
          size="small"
          strokeColor="#1890ff"
        />
      ),
    },
    {
      title: '纪律',
      dataIndex: 'discipline',
      key: 'discipline',
      width: 100,
      render: (score: number) => (
        <Progress
          percent={score * 20}
          size="small"
          strokeColor="#722ed1"
        />
      ),
    },
    {
      title: '安全',
      dataIndex: 'safety',
      key: 'safety',
      width: 100,
      render: (score: number) => (
        <Progress
          percent={score * 20}
          size="small"
          strokeColor="#fa8c16"
        />
      ),
    },
    {
      title: '团队协作',
      dataIndex: 'teamwork',
      key: 'teamwork',
      width: 100,
      render: (score: number) => (
        <Progress
          percent={score * 20}
          size="small"
          strokeColor="#eb2f96"
        />
      ),
    },
  ]

  const trainingColumns = [
    {
      title: '培训名称',
      dataIndex: 'training_name',
      key: 'training_name',
    },
    {
      title: '培训日期',
      dataIndex: 'training_date',
      key: 'training_date',
      width: 120,
    },
    {
      title: '培训时长',
      dataIndex: 'training_hours',
      key: 'training_hours',
      width: 100,
      render: (hours: number) => `${hours} 小时`,
    },
    {
      title: '考试成绩',
      dataIndex: 'exam_score',
      key: 'exam_score',
      width: 100,
      render: (score: number) => `${score} 分`,
    },
    {
      title: '是否通过',
      dataIndex: 'passed',
      key: 'passed',
      width: 100,
      render: (passed: boolean) => (
        <Tag color={passed ? 'success' : 'error'}>
          {passed ? '通过' : '未通过'}
        </Tag>
      ),
    },
    {
      title: '证书编号',
      dataIndex: 'certificate_number',
      key: 'certificate_number',
    },
  ]

  const matchColumns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
    },
    {
      title: '雇主',
      dataIndex: 'employer_name',
      key: 'employer_name',
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
      title: '匹配分数',
      dataIndex: 'match_score',
      key: 'match_score',
      width: 120,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || statusMap.pending
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '匹配时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: MatchItem) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/jobs/${record.job_id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ]

  const renderEmptyState = (description: string) => (
    <Empty
      description={description}
      style={{ padding: '40px 0' }}
    />
  )

  const tabItems = [
    {
      key: 'certificates',
      label: '技能证书',
      children: (
        <Spin spinning={certLoading}>
          <Table
            columns={certColumns}
            dataSource={certificates}
            rowKey="id"
            pagination={false}
            locale={{
              emptyText: certificates.length === 0 && !certLoading
                ? renderEmptyState('暂无技能证书记录')
                : '暂无数据'
            }}
          />
        </Spin>
      ),
    },
    {
      key: 'reviews',
      label: '履约评价',
      children: (
        <Spin spinning={reviewLoading}>
          <Table
            columns={reviewColumns}
            dataSource={reviews}
            rowKey="id"
            scroll={{ x: 1100 }}
            pagination={false}
            locale={{
              emptyText: reviews.length === 0 && !reviewLoading
                ? renderEmptyState('暂无履约评价记录')
                : '暂无数据'
            }}
          />
        </Spin>
      ),
    },
    {
      key: 'trainings',
      label: '安全培训',
      children: (
        <Spin spinning={trainingLoading}>
          <Table
            columns={trainingColumns}
            dataSource={trainings}
            rowKey="id"
            pagination={false}
            locale={{
              emptyText: trainings.length === 0 && !trainingLoading
                ? renderEmptyState('暂无安全培训记录')
                : '暂无数据'
            }}
          />
        </Spin>
      ),
    },
    {
      key: 'matches',
      label: '匹配记录',
      children: (
        <Spin spinning={matchLoading}>
          <Table
            columns={matchColumns}
            dataSource={matches}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: matches.length === 0 && !matchLoading
                ? renderEmptyState('暂无匹配记录')
                : '暂无数据'
            }}
          />
        </Spin>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/workers')}
        >
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>工人详情</h2>
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
        {worker && (
          <>
            <Card style={{ marginBottom: 16 }}>
              <Descriptions
                title="基本信息"
                bordered
                column={3}
                size="middle"
              >
                <Descriptions.Item label="ID">{worker.id}</Descriptions.Item>
                <Descriptions.Item label="姓名">{worker.name}</Descriptions.Item>
                <Descriptions.Item label="性别">{worker.gender}</Descriptions.Item>
                <Descriptions.Item label="年龄">{worker.age}</Descriptions.Item>
                <Descriptions.Item label="身份证号">{worker.id_card}</Descriptions.Item>
                <Descriptions.Item label="手机号">{worker.phone}</Descriptions.Item>
                <Descriptions.Item label="住址" span={2}>{worker.address}</Descriptions.Item>
                <Descriptions.Item label="健康状态">
                  {(() => {
                    const info = healthStatusMap[worker.health_status] || healthStatusMap.green
                    return <Tag color={info.color}>{info.text}</Tag>
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="健康码来源">{worker.health_code_source || '-'}</Descriptions.Item>
                <Descriptions.Item label="健康码更新时间">{worker.health_code_updated_at || '-'}</Descriptions.Item>
                <Descriptions.Item label="核酸检测状态">
                  {(() => {
                    const info = nucleicAcidStatusMap[worker.nucleic_acid_status] || nucleicAcidStatusMap['未检测']
                    return <Tag color={info.color}>{info.text}</Tag>
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="疫苗接种情况">
                  {(() => {
                    const info = vaccinationStatusMap[worker.vaccination_status] || vaccinationStatusMap['未接种']
                    return <Tag color={info.color}>{info.text}</Tag>
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="工种" span={2}>
                  {getTradeNames(worker.trade_ids || [])}
                </Descriptions.Item>
                <Descriptions.Item label="履约评分">
                  <Progress
                    percent={worker.performance_score}
                    size="small"
                    strokeColor={worker.performance_score >= 80 ? '#52c41a' : worker.performance_score >= 60 ? '#faad14' : '#ff4d4f'}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">{worker.created_at}</Descriptions.Item>
                <Descriptions.Item label="更新时间" span={2}>{worker.updated_at}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card>
              <Tabs items={tabItems} defaultActiveKey="certificates" />
            </Card>
          </>
        )}
      </Spin>
    </div>
  )
}
