import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, Statistic, Row, Col, Progress, Tag, Table, Spin, Alert, Typography, List } from 'antd'
import {
  TeamOutlined,
  ApartmentOutlined,
  ShoppingOutlined,
  SwapOutlined,
  FileTextOutlined,
  MoneyCollectOutlined,
  WarningOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { api } from '@/api'
import request from '@/api'
import type { JobRequirement, JobMatch, WageArrearsRisk, RegionHeatmap, TradeShortage, TeamCredit, ReviewRecord } from '@/types'
import dayjs from 'dayjs'

const { Title } = Typography

interface DashboardStats {
  totalWorkers: number
  totalEmployers: number
  totalJobs: number
  publishedJobs: number
  pendingJobs: number
  totalMatches: number
  totalContracts: number
  signedContracts: number
  totalPayments: number
  paidPayments: number
  overduePayments: number
  totalTrades: number
  activeTrades: number
  avgDailyWage: number
  healthStatus: {
    green: number
    yellow: number
    red: number
  }
}

interface WorkTrendItem {
  month: string
  jobCount: number
  matchCount: number
}

interface TradeStat {
  id: number
  name: string
  category: string
  worker_count: number
  job_count: number
  avg_wage: number
}

type ApiRecord = Record<string, any>

const emptyHealthStatus = { green: 0, yellow: 0, red: 0 }

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function toNumber(value: unknown): number {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function normalizeDashboardStats(data: ApiRecord = {}): DashboardStats {
  const healthStatus = data.healthStatus || data.health_status || {}

  return {
    totalWorkers: toNumber(data.totalWorkers ?? data.total_workers),
    totalEmployers: toNumber(data.totalEmployers ?? data.total_employers),
    totalJobs: toNumber(data.totalJobs ?? data.total_jobs),
    publishedJobs: toNumber(data.publishedJobs ?? data.published_jobs),
    pendingJobs: toNumber(data.pendingJobs ?? data.pending_jobs),
    totalMatches: toNumber(data.totalMatches ?? data.total_matches),
    totalContracts: toNumber(data.totalContracts ?? data.total_contracts),
    signedContracts: toNumber(data.signedContracts ?? data.signed_contracts),
    totalPayments: toNumber(data.totalPayments ?? data.total_payments),
    paidPayments: toNumber(data.paidPayments ?? data.paid_payments),
    overduePayments: toNumber(data.overduePayments ?? data.overdue_payments),
    totalTrades: toNumber(data.totalTrades ?? data.total_trades),
    activeTrades: toNumber(data.activeTrades ?? data.active_trades),
    avgDailyWage: toNumber(data.avgDailyWage ?? data.avg_daily_wage),
    healthStatus: {
      green: toNumber(healthStatus.green),
      yellow: toNumber(healthStatus.yellow),
      red: toNumber(healthStatus.red)
    }
  }
}

function normalizeWorkTrend(items: unknown): WorkTrendItem[] {
  return asArray<ApiRecord>(items).map(item => ({
    month: String(item.month || ''),
    jobCount: toNumber(item.jobCount ?? item.job_count),
    matchCount: toNumber(item.matchCount ?? item.match_count)
  }))
}

function normalizeWageRisks(items: unknown): WageArrearsRisk[] {
  return asArray<ApiRecord>(items).map(item => ({
    ...item,
    employerId: item.employerId ?? item.employer_id,
    companyName: item.companyName ?? item.company_name,
    riskLevel: item.riskLevel ?? item.risk_level ?? 'low',
    riskScore: toNumber(item.riskScore ?? item.risk_score),
    overdueCount: toNumber(item.overdueCount ?? item.overdue_count),
    totalOverdueAmount: toNumber(item.totalOverdueAmount ?? item.total_overdue_amount),
    warningDate: item.warningDate ?? item.warning_date ?? '',
    measures: item.measures ?? item.measures ?? ''
  })) as WageArrearsRisk[]
}

function normalizeRegionHeatmap(items: unknown): RegionHeatmap[] {
  return asArray<ApiRecord>(items).map(item => ({
    region: String(item.region || ''),
    workerCount: toNumber(item.workerCount ?? item.worker_count),
    jobCount: toNumber(item.jobCount ?? item.job_count),
    demandRatio: toNumber(item.demandRatio ?? item.demand_ratio),
    avgWage: toNumber(item.avgWage ?? item.avg_wage)
  }))
}

function normalizeTradeShortage(items: unknown): TradeShortage[] {
  return asArray<ApiRecord>(items).map(item => ({
    tradeId: toNumber(item.tradeId ?? item.trade_id),
    tradeName: String((item.tradeName ?? item.trade_name) || ''),
    shortageIndex: toNumber(item.shortageIndex ?? item.shortage_index),
    demandCount: toNumber(item.demandCount ?? item.demand_count),
    supplyCount: toNumber(item.supplyCount ?? item.supply_count),
    trend: item.trend ?? item.trend ?? 'stable'
  })) as TradeShortage[]
}

function normalizeTeamCredit(items: unknown): TeamCredit[] {
  return asArray<ApiRecord>(items).map(item => ({
    teamId: toNumber(item.teamId ?? item.team_id),
    teamName: String((item.teamName ?? item.team_name) || ''),
    creditScore: toNumber(item.creditScore ?? item.credit_score),
    rating: item.rating ?? item.rating ?? 'C',
    totalProjects: toNumber(item.totalProjects ?? item.total_projects),
    onTimeRate: toNumber(item.onTimeRate ?? item.on_time_rate),
    complaintCount: toNumber(item.complaintCount ?? item.complaint_count)
  })) as TeamCredit[]
}

interface ReviewRecordWithJob extends ReviewRecord {
  projectName: string
}

function normalizeReviewRecordsForDashboard(items: unknown): ReviewRecordWithJob[] {
  return asArray<ApiRecord>(items).map(item => ({
    id: toNumber(item.id),
    jobId: toNumber(item.jobId ?? item.job_id),
    projectName: String(item.projectName ?? item.project_name ?? ''),
    reviewLevel: item.reviewLevel ?? item.review_level ?? 'ai',
    reviewer: String(item.reviewer || ''),
    result: item.result ?? item.result ?? 'pending',
    comment: String(item.comment || ''),
    reviewDate: item.reviewDate ?? item.review_date ?? '',
    details: item.details ?? item.details ?? ''
  })) as ReviewRecordWithJob[]
}

function normalizeReviewRecords(job: ApiRecord, reviews: unknown[]): ReviewRecordWithJob[] {
  return asArray<ApiRecord>(reviews).map(review => ({
    id: toNumber(review.id),
    jobId: toNumber(review.jobId ?? review.job_id),
    reviewLevel: review.reviewLevel ?? review.review_level ?? 'ai',
    reviewer: String(review.reviewer || ''),
    result: review.result ?? review.result ?? 'pending',
    comment: String(review.comment || ''),
    reviewDate: review.reviewDate ?? review.review_date ?? '',
    details: review.details ?? review.details ?? '',
    projectName: job.projectName ?? job.project_name ?? ''
  })) as ReviewRecordWithJob[]
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [workTrend, setWorkTrend] = useState<WorkTrendItem[]>([])
  const [tradeStats, setTradeStats] = useState<TradeStat[]>([])
  const [recentJobs, setRecentJobs] = useState<JobRequirement[]>([])
  const [recentMatches, setRecentMatches] = useState<JobMatch[]>([])
  const [wageRisks, setWageRisks] = useState<WageArrearsRisk[]>([])
  const [regionHeatmap, setRegionHeatmap] = useState<RegionHeatmap[]>([])
  const [tradeShortage, setTradeShortage] = useState<TradeShortage[]>([])
  const [teamCredit, setTeamCredit] = useState<TeamCredit[]>([])
  const [reviewRecords, setReviewRecords] = useState<ReviewRecordWithJob[]>([])
  const [modulesLoading, setModulesLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [
        statsRes,
        trendRes,
        tradeRes,
        jobsRes,
        matchesRes,
        riskRes
      ] = await Promise.all([
        api.getDashboardStats(),
        request.get('/analytics/work-trend'),
        api.getTradeStats(),
        api.getJobs({ page: 1, pageSize: 5 }),
        api.getMatches({ page: 1, pageSize: 5 }),
        api.getWageArrearsRisk()
      ])

      setDashboardStats(normalizeDashboardStats(statsRes.data as ApiRecord))
      setWorkTrend(normalizeWorkTrend(trendRes.data))
      setTradeStats(asArray<TradeStat>(tradeRes.data))
      setRecentJobs(asArray<JobRequirement>((jobsRes.data as ApiRecord)?.list))
      setRecentMatches(asArray<JobMatch>((matchesRes.data as ApiRecord)?.list))
      setWageRisks(normalizeWageRisks(riskRes.data))
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchModules = async () => {
    try {
      setModulesLoading(true)
      const [
        regionRes,
        shortageRes,
        creditRes
      ] = await Promise.all([
        api.getRegionHeatmap(),
        api.getTradeShortage(),
        api.getTeamCredit()
      ])

      setRegionHeatmap(normalizeRegionHeatmap(regionRes.data))
      setTradeShortage(normalizeTradeShortage(shortageRes.data))
      setTeamCredit(normalizeTeamCredit(creditRes.data))
    } catch (error) {
      console.error('Failed to fetch modules data:', error)
    } finally {
      setModulesLoading(false)
    }
  }

  const fetchReviewRecords = async () => {
    try {
      setReviewsLoading(true)
      const recordsRes = await api.getReviewRecords()
      const records = normalizeReviewRecordsForDashboard(recordsRes.data)
      setReviewRecords(records)
    } catch (error) {
      console.error('Failed to fetch review records:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchModules()
    fetchReviewRecords()
  }, [])

  const workTrendOption = {
    title: { text: '近12个月招工/匹配趋势', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['招工需求', '智能匹配'], bottom: 10 },
    xAxis: {
      type: 'category',
      data: workTrend.map(item => item.month)
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '招工需求',
        type: 'line',
        smooth: true,
        data: workTrend.map(item => item.jobCount),
        itemStyle: { color: '#1890ff' },
        areaStyle: { color: 'rgba(24, 144, 255, 0.1)' }
      },
      {
        name: '智能匹配',
        type: 'line',
        smooth: true,
        data: workTrend.map(item => item.matchCount),
        itemStyle: { color: '#52c41a' },
        areaStyle: { color: 'rgba(82, 196, 26, 0.1)' }
      }
    ]
  }

  const tradeStatsOption = {
    title: { text: '各工种需求人数', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: tradeStats.slice(0, 10).map(item => item.name),
      axisLabel: { interval: 0, rotate: 30 }
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '需求人数',
        type: 'bar',
        data: tradeStats.slice(0, 10).map(item => item.job_count),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#096dd9' }
            ]
          }
        },
        barWidth: '60%'
      }
    ]
  }

  const healthStatus = dashboardStats?.healthStatus || emptyHealthStatus

  const healthStatusOption = {
    title: { text: '工人健康状态分布', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '健康状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}: {c}人' },
        data: [
          { value: healthStatus.green, name: '健康', itemStyle: { color: '#52c41a' } },
          { value: healthStatus.yellow, name: '需关注', itemStyle: { color: '#faad14' } },
          { value: healthStatus.red, name: '异常', itemStyle: { color: '#ff4d4f' } }
        ]
      }
    ]
  }

  const riskCounts = {
    high: wageRisks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length,
    medium: wageRisks.filter(r => r.riskLevel === 'medium').length,
    low: wageRisks.filter(r => r.riskLevel === 'low').length
  }

  const jobColumns = [
    {
      title: '项目名称',
      key: 'projectName',
      ellipsis: true,
      render: (_: unknown, record: ApiRecord) => record.projectName || record.project_name || '-'
    },
    {
      title: '工种',
      key: 'tradeName',
      width: 100,
      render: (_: unknown, record: ApiRecord) => record.tradeName || record.trade_name || '-'
    },
    {
      title: '需求人数',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100
    },
    {
      title: '日薪',
      key: 'dailyWage',
      width: 100,
      render: (_: unknown, record: ApiRecord) => {
        const wage = record.dailyWage ?? record.daily_wage
        return wage === undefined || wage === null ? '-' : `¥${wage}`
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          draft: { color: 'default', text: '草稿' },
          pending_review: { color: 'orange', text: '待审核' },
          ai_reviewed: { color: 'blue', text: 'AI审核' },
          manual_reviewed: { color: 'cyan', text: '人工审核' },
          verified: { color: 'purple', text: '已核验' },
          published: { color: 'green', text: '已发布' },
          filled: { color: 'geekblue', text: '已招满' },
          closed: { color: 'gray', text: '已关闭' }
        }
        const config = statusMap[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    }
  ]

  const matchColumns = [
    {
      title: '匹配ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '工人ID',
      key: 'workerId',
      width: 100,
      render: (_: unknown, record: ApiRecord) => record.workerId ?? record.worker_id ?? '-'
    },
    {
      title: '匹配度',
      key: 'matchScore',
      width: 120,
      render: (_: unknown, record: ApiRecord) => {
        const score = Math.round(toNumber(record.matchScore ?? record.match_score))
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
            <Progress
              percent={score}
              size="small"
              showInfo={false}
              status={score >= 80 ? 'success' : score >= 60 ? 'active' : 'exception'}
              style={{ flex: 1, marginBottom: 0 }}
            />
            <span style={{ width: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {score}%
            </span>
          </div>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待确认' },
          accepted: { color: 'blue', text: '已接受' },
          rejected: { color: 'red', text: '已拒绝' },
          hired: { color: 'green', text: '已入职' }
        }
        const config = statusMap[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '匹配时间',
      key: 'createdAt',
      width: 160,
      render: (_: unknown, record: ApiRecord) => {
        const date = record.createdAt || record.created_at
        return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
      }
    }
  ]

  const getDemandRatioTag = (ratio: number) => {
    if (ratio < 0.5) {
      return <Tag color="red">供需比 {ratio.toFixed(2)}</Tag>
    } else if (ratio < 1) {
      return <Tag color="gold">供需比 {ratio.toFixed(2)}</Tag>
    }
    return <Tag color="green">供需比 {ratio.toFixed(2)}</Tag>
  }

  const getShortageIndexTag = (index: number) => {
    if (index > 2) {
      return <Tag color="red">紧缺指数 {index.toFixed(2)}</Tag>
    } else if (index > 1) {
      return <Tag color="gold">紧缺指数 {index.toFixed(2)}</Tag>
    }
    return <Tag color="green">紧缺指数 {index.toFixed(2)}</Tag>
  }

  const getCreditRatingTag = (rating: string) => {
    const colorMap: Record<string, string> = {
      'A': 'green',
      'B': 'blue',
      'C': 'orange',
      'D': 'red'
    }
    return <Tag color={colorMap[rating] || 'default'}>{rating}级</Tag>
  }

  const getRiskLevelIcon = (level: string) => {
    const iconMap: Record<string, string> = {
      'critical': '🔴',
      'high': '🟠',
      'medium': '🟡',
      'low': '🟢'
    }
    const textMap: Record<string, string> = {
      'critical': '严重',
      'high': '高',
      'medium': '中',
      'low': '低'
    }
    return <span>{iconMap[level] || '🟢'} {textMap[level] || '低'}</span>
  }

  const reviewColumns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      ellipsis: true,
      render: (_: unknown, record: ReviewRecordWithJob) => (
        <Link to={`/jobs/${record.jobId}`} style={{ color: '#1890ff' }}>
          {record.projectName || '-'}
        </Link>
      )
    },
    {
      title: '审核级别',
      key: 'reviewLevel',
      width: 120,
      render: (_: unknown, record: ReviewRecordWithJob) => {
        const levelMap: Record<string, { color: string; text: string; icon: string }> = {
          'ai': { color: 'blue', text: 'AI审核', icon: '🤖' },
          'manual': { color: 'cyan', text: '人工复核', icon: '👨‍💼' },
          'site': { color: 'purple', text: '工地核验', icon: '🏗️' }
        }
        const config = levelMap[record.reviewLevel] || { color: 'default', text: record.reviewLevel, icon: '' }
        return <Tag color={config.color}>{config.icon} {config.text}</Tag>
      }
    },
    {
      title: '审核人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 140
    },
    {
      title: '审核时间',
      key: 'reviewDate',
      width: 140,
      render: (_: unknown, record: ReviewRecordWithJob) => {
        return record.reviewDate ? dayjs(record.reviewDate).format('YYYY-MM-DD') : '-'
      }
    },
    {
      title: '审核结果',
      key: 'result',
      width: 100,
      render: (_: unknown, record: ReviewRecordWithJob) => {
        const resultMap: Record<string, { color: string; text: string; icon: string }> = {
          'pass': { color: 'green', text: '通过', icon: '✅' },
          'fail': { color: 'red', text: '驳回', icon: '❌' },
          'pending': { color: 'orange', text: '待审', icon: '⏳' }
        }
        const config = resultMap[record.result] || { color: 'default', text: record.result, icon: '' }
        return <Tag color={config.color}>{config.icon} {config.text}</Tag>
      }
    },
    {
      title: '备注',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
      render: (_: unknown, record: ReviewRecordWithJob) => {
        const isReject = record.result === 'fail'
        return (
          <span style={{ color: isReject ? '#ff4d4f' : undefined }}>
            {record.comment || '-'}
          </span>
        )
      }
    }
  ]

  if (loading) {
    return (
      <div>
        <Title level={3} style={{ marginBottom: 24 }}>数据看板</Title>
        <Card>
          <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <Spin size="large" />
              <div style={{ marginTop: 12 }}>正在加载看板数据...</div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>数据看板</Title>

      <Alert
        message="欠薪风险预警"
        description={
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>高风险: {riskCounts.high} 家</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <WarningOutlined style={{ color: '#faad14' }} />
              <span style={{ color: '#faad14', fontWeight: 'bold' }}>中风险: {riskCounts.medium} 家</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <WarningOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>低风险: {riskCounts.low} 家</span>
            </span>
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="工人总数"
              value={dashboardStats?.totalWorkers || 0}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              suffix="人"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="雇主总数"
              value={dashboardStats?.totalEmployers || 0}
              prefix={<ApartmentOutlined style={{ color: '#722ed1' }} />}
              suffix="家"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="招工需求数"
              value={dashboardStats?.totalJobs || 0}
              prefix={<ShoppingOutlined style={{ color: '#fa8c16' }} />}
              suffix="条"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="智能匹配数"
              value={dashboardStats?.totalMatches || 0}
              prefix={<SwapOutlined style={{ color: '#52c41a' }} />}
              suffix="次"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="合同数"
              value={dashboardStats?.totalContracts || 0}
              prefix={<FileTextOutlined style={{ color: '#13c2c2' }} />}
              suffix="份"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="工资支付数"
              value={dashboardStats?.totalPayments || 0}
              prefix={<MoneyCollectOutlined style={{ color: '#eb2f96' }} />}
              suffix="笔"
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                区域用工热力图
              </span>
            }
            extra={<Tag color="blue">TOP 3</Tag>}
            loading={modulesLoading}
          >
            <List
              dataSource={regionHeatmap.slice(0, 3)}
              renderItem={(item) => (
                <List.Item
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>{item.region}</span>
                    {getDemandRatioTag(item.demandRatio)}
                  </div>
                  <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#666' }}>
                    <span>工人: <b>{item.workerCount}</b> 人</span>
                    <span>招工: <b>{item.jobCount}</b> 人</span>
                    <span>平均日薪: <b style={{ color: '#fa8c16' }}>¥{item.avgWage}</b></span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <ToolOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                工种紧缺指数
              </span>
            }
            extra={<Tag color="purple">TOP 5</Tag>}
            loading={modulesLoading}
          >
            <List
              dataSource={tradeShortage.slice(0, 5)}
              renderItem={(item) => (
                <List.Item
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>{item.tradeName}</span>
                    {getShortageIndexTag(item.shortageIndex)}
                  </div>
                  <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#666' }}>
                    <span>需求: <b style={{ color: '#ff4d4f' }}>{item.demandCount}</b> 人</span>
                    <span>供应: <b style={{ color: '#52c41a' }}>{item.supplyCount}</b> 人</span>
                    <span>趋势: <b style={{ color: item.trend === 'up' ? '#ff4d4f' : item.trend === 'down' ? '#52c41a' : '#faad14' }}>
                      {item.trend === 'up' ? '↑ 上升' : item.trend === 'down' ? '↓ 下降' : '→ 稳定'}
                    </b></span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <SafetyCertificateOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                班组信用评级
              </span>
            }
            extra={<Tag color="green">TOP 3</Tag>}
            loading={modulesLoading}
          >
            <List
              dataSource={teamCredit.slice(0, 3)}
              renderItem={(item) => (
                <List.Item
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>{item.teamName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getCreditRatingTag(item.rating)}
                      <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{item.creditScore} 分</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#666' }}>
                    <span>项目数: <b>{item.totalProjects}</b> 个</span>
                    <span>按时率: <b style={{ color: '#52c41a' }}>{item.onTimeRate.toFixed(0)}%</b></span>
                    <span>投诉: <b style={{ color: '#ff4d4f' }}>{item.complaintCount}</b> 次</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <ExclamationCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                欠薪风险明细
              </span>
            }
            extra={<Tag color="red">共 {wageRisks.length} 条</Tag>}
            loading={modulesLoading}
          >
            <List
              dataSource={wageRisks}
              style={{ maxHeight: 280, overflowY: 'auto' }}
              renderItem={(item) => (
                <List.Item
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>{item.companyName}</span>
                    {getRiskLevelIcon(item.riskLevel)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 13, color: '#666' }}>
                    <span>逾期金额: <b style={{ color: '#ff4d4f' }}>¥{item.totalOverdueAmount.toLocaleString()}</b></span>
                    <span>逾期次数: <b>{item.overdueCount}</b> 次</span>
                  </div>
                  {item.measures && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                      处置措施: {item.measures}
                    </div>
                  )}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card>
            <ReactECharts option={workTrendOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <ReactECharts option={healthStatusOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card>
            <ReactECharts option={tradeStatsOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近招工需求" extra={<Tag color="blue">共 {recentJobs.length} 条</Tag>}>
            <Table
              columns={jobColumns}
              dataSource={recentJobs}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近匹配记录" extra={<Tag color="green">共 {recentMatches.length} 条</Tag>}>
            <Table
              columns={matchColumns}
              dataSource={recentMatches}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title={
              <span>
                <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                监管复查记录
              </span>
            }
            extra={<Tag color="blue">共 {reviewRecords.length} 条</Tag>}
            loading={reviewsLoading}
          >
            <Table
              columns={reviewColumns}
              dataSource={reviewRecords}
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              size="small"
              scroll={{ x: 900 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
