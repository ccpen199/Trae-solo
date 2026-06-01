import { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Button,
  Table,
  Tag,
  message,
  Divider,
  Space,
  Progress,
} from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  FileTextOutlined,
  ExportOutlined,
  ExclamationCircleOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { TableProps } from 'antd/es/table'
import type {
  StatsOverview,
  HotIssue,
  VersionQuality,
  ResponseTimeData,
  RiskItem,
  FeedbackStatus,
  Severity,
} from '@/types'
import {
  getStatsOverview,
  getHotIssues,
  getVersionQuality,
  getResponseTime,
  getRisks,
  exportWeekly,
} from '@/api'

const { Title } = Typography

const severityColorMap: Record<Severity, string> = {
  critical: 'red',
  major: 'orange',
  minor: 'blue',
  trivial: 'default',
}

const statusMap: Record<FeedbackStatus, string> = {
  pending: '待处理',
  accepted: '已受理',
  supplementing: '补充信息',
  processing: '处理中',
  fixed: '已修复',
  verifying: '待验证',
  closed: '已关闭',
}

const riskTypeText: Record<string, string> = {
  overdue: '超时未处理',
  high_severity: '高严重级别',
  high_impact: '高影响人数',
}

const DashboardPage = () => {
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [hotIssues, setHotIssues] = useState<HotIssue[]>([])
  const [versionQuality, setVersionQuality] = useState<VersionQuality[]>([])
  const [responseTime, setResponseTime] = useState<ResponseTimeData[]>([])
  const [risks, setRisks] = useState<RiskItem[]>([])
  const [exporting, setExporting] = useState(false)
  const [weeklyReportContent, setWeeklyReportContent] = useState<string>('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [overviewRes, hotRes, versionRes, timeRes, risksRes] = await Promise.all([
        getStatsOverview(),
        getHotIssues(),
        getVersionQuality(),
        getResponseTime(),
        getRisks(),
      ])
      setOverview(overviewRes)
      setHotIssues(hotRes)
      setVersionQuality(versionRes)
      setResponseTime(timeRes)
      setRisks(risksRes)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExportWeekly = async () => {
    setExporting(true)
    try {
      await exportWeekly()
      message.success('导出成功，周报内容已在下方展示')
      setWeeklyReportContent('报告已生成下载，请在下方查看关键指标摘要')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const statusChartOption = overview
    ? {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: ['待处理', '已受理', '补充信息', '处理中', '已修复', '待验证', '已关闭'],
        },
        yAxis: { type: 'value' },
        series: [
          {
            name: '数量',
            type: 'bar',
            data: [
              overview.status_counts.pending,
              overview.status_counts.accepted,
              overview.status_counts.supplementing,
              overview.status_counts.processing,
              overview.status_counts.fixed,
              overview.status_counts.verifying,
              overview.status_counts.closed,
            ],
            itemStyle: {
              color: (params: { dataIndex: number }) => {
                const colors = ['#d9d9d9', '#1890ff', '#fa8c16', '#1890ff', '#52c41a', '#13c2c2', '#8c8c8c']
                return colors[params.dataIndex]
              },
            },
            barWidth: '50%',
          },
        ],
      }
    : {}

  const hotIssuesChartOption =
    hotIssues.length > 0
      ? {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { type: 'value' },
          yAxis: {
            type: 'category',
            data: hotIssues.slice(0, 10).map((h) => h.title.slice(0, 15) + (h.title.length > 15 ? '...' : '')).reverse(),
          },
          series: [
            {
              name: '影响人数',
              type: 'bar',
              data: hotIssues.slice(0, 10).map((h) => h.affected_users_count).reverse(),
              itemStyle: {
                color: (params: { dataIndex: number }) => {
                  const colors = ['#ff4d4f', '#ff7a45', '#ffa940', '#ffc53d', '#ffec3d', '#bae637', '#73d13d', '#36cfc9', '#40a9ff', '#597ef7']
                  return colors[params.dataIndex % colors.length]
                },
              },
              label: { show: true, position: 'right' },
            },
          ],
        }
      : {}

  const versionChartOption =
    versionQuality.length > 0
      ? {
          tooltip: { trigger: 'axis' },
          legend: { data: ['关闭率', '反馈数'] },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: {
            type: 'category',
            data: versionQuality.map((v) => v.version),
          },
          yAxis: [
            { type: 'value', name: '百分比(%)', min: 0, max: 100 },
            { type: 'value', name: '反馈数', min: 0 },
          ],
          series: [
            {
              name: '关闭率',
              type: 'line',
              data: versionQuality.map((v) => v.close_rate * 100),
              smooth: true,
              lineStyle: { color: '#52c41a', width: 3 },
              itemStyle: { color: '#52c41a' },
            },
            {
              name: '反馈数',
              type: 'bar',
              yAxisIndex: 1,
              data: versionQuality.map((v) => v.total),
              itemStyle: { color: '#1890ff', opacity: 0.5 },
            },
          ],
        }
      : {}

  const responseTimeChartOption =
    responseTime.length > 0
      ? {
          tooltip: { trigger: 'axis' },
          legend: { data: ['平均响应时长(分钟)'] },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: {
            type: 'category',
            data: responseTime.map((r) => r.date),
          },
          yAxis: { type: 'value', name: '分钟' },
          series: [
            {
              name: '平均响应时长(分钟)',
              type: 'line',
              data: responseTime.map((r) => Math.round(r.avg_time_ms / 60000)),
              smooth: true,
              lineStyle: { width: 3, color: '#722ed1' },
              itemStyle: { color: '#722ed1' },
              areaStyle: { opacity: 0.3, color: '#722ed1' },
            },
          ],
        }
      : {}

  const riskColumns: TableProps<RiskItem>['columns'] = [
    {
      title: '风险类型',
      dataIndex: 'risk_type',
      key: 'risk_type',
      width: 120,
      render: (t: string) => (
        <Tag color="red">
          <ExclamationCircleOutlined /> {riskTypeText[t] || t}
        </Tag>
      ),
    },
    {
      title: '严重级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s: Severity) => (
        <Tag color={severityColorMap[s]}>{s}</Tag>
      ),
    },
    {
      title: '反馈标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: FeedbackStatus) => statusMap[s] || s,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
    },
    {
      title: '影响人数',
      dataIndex: 'affected_users_count',
      key: 'affected_users_count',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (ts: number) => dayjs(ts).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>统计看板</Title>
        <Button
          type="primary"
          icon={<ExportOutlined />}
          onClick={handleExportWeekly}
          loading={exporting}
        >
          导出周报
        </Button>
      </div>

      {weeklyReportContent && (
        <Card 
          size="small" 
          style={{ marginBottom: 16, background: '#e6f7ff', borderColor: '#91d5ff' }}
        >
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <Typography.Text strong style={{ color: '#1890ff' }}>{weeklyReportContent}</Typography.Text>
          </Space>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="待处理"
              value={overview?.pending_total || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="处理中"
              value={overview?.status_counts.processing || 0}
              prefix={<LoadingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="已修复"
              value={overview?.status_counts.fixed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="待验证"
              value={overview?.status_counts.verifying || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="待处理风险"
              value={overview?.at_risk_count || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="平均满意度"
              value={overview?.avg_satisfaction || 0}
              precision={1}
              suffix="/ 5.0"
              prefix={<SmileOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="各状态数量统计" loading={loading}>
            {overview && <ReactECharts option={statusChartOption} style={{ height: 320 }} />}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="高频问题 Top10" loading={loading}>
            {hotIssues.length > 0 && (
              <ReactECharts option={hotIssuesChartOption} style={{ height: 320 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="版本质量趋势" loading={loading} extra={<Tag color="blue">关闭率</Tag>}>
            {versionQuality.length > 0 && (
              <>
                <ReactECharts option={versionChartOption} style={{ height: 220 }} />
                <Divider style={{ margin: '12px 0 8px' }} />
                <Table
                  size="small"
                  dataSource={versionQuality}
                  rowKey="version"
                  pagination={false}
                  columns={[
                    { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
                    { title: '反馈数', dataIndex: 'total', key: 'total', width: 80, align: 'center' },
                    { title: '已关闭', dataIndex: 'closed', key: 'closed', width: 80, align: 'center' },
                    {
                      title: '关闭率',
                      key: 'close_rate',
                      width: 100,
                      align: 'center',
                      render: (_: any, record: VersionQuality) => (
                        <Progress percent={Math.round(record.close_rate * 100)} size="small" />
                      ),
                    },
                    {
                      title: '严重程度',
                      key: 'severity',
                    render: (_: any, record: VersionQuality) => {
                        const sb = record.severity_breakdown
                        return (
                          <Space size={4}>
                            {sb?.critical ? <Tag color="red" style={{ margin: 0 }}>致命{sb.critical}</Tag> : null}
                            {sb?.major ? <Tag color="orange" style={{ margin: 0 }}>严重{sb.major}</Tag> : null}
                            {sb?.minor ? <Tag color="blue" style={{ margin: 0 }}>一般{sb.minor}</Tag> : null}
                          </Space>
                        )
                      },
                    },
                  ]}
                />
              </>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="响应时长趋势" loading={loading}>
            {responseTime.length > 0 && (
              <>
                <ReactECharts option={responseTimeChartOption} style={{ height: 220 }} />
                <Divider style={{ margin: '12px 0 8px' }} />
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                        title="平均响应时长"
                        value={Math.round((overview?.avg_response_time_ms || 0) / 60000)}
                        suffix="分钟"
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="平均修复时长"
                        value={Math.round((overview?.avg_fix_time_ms || 0) / 3600000)}
                        suffix="小时"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="待处理风险列表" loading={loading}>
        <Table
          rowKey="id"
          dataSource={risks}
          columns={riskColumns}
          pagination={false}
          locale={{ emptyText: '暂无待处理风险' }}
        />
      </Card>
    </div>
  )
}

export default DashboardPage
