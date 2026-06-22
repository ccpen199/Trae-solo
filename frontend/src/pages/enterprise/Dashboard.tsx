import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  List,
  Tag,
  Button,
  Badge,
  Space,
  Avatar,
  Empty,
  Skeleton,
} from 'antd'
import {
  TeamOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { Link, useNavigate } from 'react-router-dom'
import enterpriseApi, { type EnterpriseStatistics } from '../../api/enterprise'
import { useAuth } from '../../App'
import type { RiskAlert } from '../../types'

const priorityColorMap: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
}

const priorityTextMap: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

function Dashboard() {
  const navigate = useNavigate()
  const { enterprise } = useAuth()
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<EnterpriseStatistics | null>(null)
  const [alerts] = useState<RiskAlert[]>([
    {
      id: 1,
      alert_type: 'wage_delay',
      severity: 'high',
      title: '工资发放延迟预警',
      description: '项目「CBD办公楼装修」工资预计延迟，请尽快处理',
      status: 'active',
      created_at: '2026-06-20 10:30:00',
    },
    {
      id: 2,
      alert_type: 'attendance_abnormal',
      severity: 'medium',
      title: '工人考勤异常',
      description: '工人张伟连续3天迟到，请关注',
      status: 'active',
      created_at: '2026-06-19 14:00:00',
    },
  ])

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const res = await enterpriseApi.getStatistics()
      if (res.code === 0 && res.data) {
        setStatistics(res.data)
      }
    } catch {
      setStatistics({
        active_workers: 12,
        ongoing_projects: 3,
        guarantee_balance: 86500,
        credit_score: 92,
        monthly_wage_trend: [
          { date: '06-15', amount: 28000 },
          { date: '06-16', amount: 32000 },
          { date: '06-17', amount: 30500 },
          { date: '06-18', amount: 35000 },
          { date: '06-19', amount: 33000 },
          { date: '06-20', amount: 38000 },
          { date: '06-21', amount: 28000 },
        ],
        pending_tasks: [
          {
            id: 1,
            type: 'review_application',
            title: '审核工人申请',
            description: '有5位工人申请「CBD办公楼装修」项目',
            priority: 'high',
            created_at: '2026-06-21 09:00:00',
          },
          {
            id: 2,
            type: 'verification',
            title: '提交企业认证资料',
            description: '完成企业认证可获得更多平台权益',
            priority: 'medium',
            created_at: '2026-06-20 16:30:00',
          },
          {
            id: 3,
            type: 'confirm_completion',
            title: '确认项目完工',
            description: '「商业街改造」项目待确认完工',
            priority: 'medium',
            created_at: '2026-06-20 11:00:00',
          },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>发放金额: ¥{c}',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: statistics?.monthly_wage_trend.map((i) => i.date) || [],
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#666' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#666', formatter: '¥{value}' },
    },
    series: [
      {
        name: '工资发放',
        type: 'line',
        smooth: true,
        data: statistics?.monthly_wage_trend.map((i) => i.amount) || [],
        lineStyle: { color: '#1890ff', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.35)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.02)' },
            ],
          },
        },
        itemStyle: { color: '#1890ff' },
        symbol: 'circle',
        symbolSize: 8,
      },
    ],
  }

  const taskIconMap: Record<string, JSX.Element> = {
    review_application: <UserAddOutlined style={{ color: '#1890ff' }} />,
    confirm_completion: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    guarantee_replenish: <SafetyCertificateOutlined style={{ color: '#faad14' }} />,
    verification: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
  }

  const creditLevel = statistics?.credit_score
    ? statistics.credit_score >= 90
      ? { text: 'AAA', color: '#52c41a' }
      : statistics.credit_score >= 80
      ? { text: 'AA', color: '#1890ff' }
      : statistics.credit_score >= 70
      ? { text: 'A', color: '#13c2c2' }
      : { text: 'BBB', color: '#faad14' }
    : { text: '-', color: '#999' }

  return (
    <div>
      {enterprise && enterprise.verified === 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="企业未认证"
          description={
            <Space>
              <span>为了保障您的账户安全和交易权益，请尽快完成企业认证。</span>
              <Link to="/enterprise/settings">
                <Button type="primary" size="small">
                  立即认证
                </Button>
              </Link>
            </Space>
          }
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      {alerts.length > 0 && (
        <Alert
          type="error"
          showIcon
          message={`您有 ${alerts.length} 条风险预警需要处理`}
          description={
            <Space direction="vertical" size={4}>
              {alerts.slice(0, 2).map((a) => (
                <span key={a.id}>
                  <Badge color={a.severity === 'high' ? 'red' : 'orange'} />
                  {a.title}
                </span>
              ))}
            </Space>
          }
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
            <Skeleton loading={loading} active paragraph={false}>
              <Statistic
                title={
                  <Space>
                    <Avatar
                      size={40}
                      style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', verticalAlign: 'middle' }}
                      icon={<TeamOutlined />}
                    />
                    <span style={{ fontSize: 14, color: '#666' }}>在用工人</span>
                  </Space>
                }
                value={statistics?.active_workers ?? 0}
                suffix="人"
                style={{ marginTop: 12 }}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
            <Skeleton loading={loading} active paragraph={false}>
              <Statistic
                title={
                  <Space>
                    <Avatar
                      size={40}
                      style={{ background: 'linear-gradient(135deg, #52c41a, #389e0d)', verticalAlign: 'middle' }}
                      icon={<ProjectOutlined />}
                    />
                    <span style={{ fontSize: 14, color: '#666' }}>进行中项目</span>
                  </Space>
                }
                value={statistics?.ongoing_projects ?? 0}
                suffix="个"
                style={{ marginTop: 12 }}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
            <Skeleton loading={loading} active paragraph={false}>
              <Statistic
                title={
                  <Space>
                    <Avatar
                      size={40}
                      style={{ background: 'linear-gradient(135deg, #faad14, #d48806)', verticalAlign: 'middle' }}
                      icon={<SafetyCertificateOutlined />}
                    />
                    <span style={{ fontSize: 14, color: '#666' }}>保证金余额</span>
                  </Space>
                }
                value={statistics?.guarantee_balance ?? 0}
                precision={2}
                prefix="¥"
                style={{ marginTop: 12 }}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
            <Skeleton loading={loading} active paragraph={false}>
              <Statistic
                title={
                  <Space>
                    <Avatar
                      size={40}
                      style={{ background: 'linear-gradient(135deg, #722ed1, #531dab)', verticalAlign: 'middle' }}
                      icon={<StarOutlined />}
                    />
                    <span style={{ fontSize: 14, color: '#666' }}>信用评分</span>
                    <Tag color={creditLevel.color} style={{ marginLeft: 8, fontSize: 12 }}>
                      {creditLevel.text}
                    </Tag>
                  </Space>
                }
                value={statistics?.credit_score ?? 0}
                suffix="分"
                style={{ marginTop: 12 }}
              />
            </Skeleton>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{ borderRadius: 12 }}
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                <span>本月工资发放趋势</span>
              </Space>
            }
            extra={
              <Link to="/enterprise/payroll">
                <Button type="link" size="small" icon={<EyeOutlined />}>
                  查看明细
                </Button>
              </Link>
            }
          >
            <Skeleton loading={loading} active>
              <ReactECharts option={chartOption} style={{ height: 320 }} notMerge />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
            title={
              <Space>
                <StarOutlined style={{ color: '#722ed1' }} />
                <span>信用评分详情</span>
              </Space>
            }
            extra={
              <Link to="/enterprise/credit">
                <Button type="link" size="small">
                  查看更多
                </Button>
              </Link>
            }
          >
            <Skeleton loading={loading} active paragraph={{ rows: 4 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    color: statistics && statistics.credit_score >= 80 ? '#52c41a' : '#1890ff',
                    lineHeight: 1.2,
                  }}
                >
                  {statistics?.credit_score ?? 0}
                </div>
                <Tag color={creditLevel.color} style={{ fontSize: 16, padding: '2px 12px', marginTop: 8 }}>
                  {creditLevel.text} 级企业
                </Tag>
              </div>
              <Progress
                percent={statistics?.credit_score ?? 0}
                strokeColor={creditLevel.color}
                trailColor="#f0f0f0"
                size={[0, 10]}
                style={{ marginBottom: 16 }}
              />
              <div style={{ background: '#fffbe6', padding: 12, borderRadius: 8, border: '1px solid #ffe58f' }}>
                <Space direction="vertical" size={4}>
                  <div style={{ color: '#ad6800', fontSize: 13, fontWeight: 500 }}>
                    <ExclamationCircleOutlined style={{ marginRight: 6 }} />
                    提升建议
                  </div>
                  <div style={{ color: '#874d00', fontSize: 12 }}>
                    • 按时发放工资可提高信用评级
                  </div>
                  <div style={{ color: '#874d00', fontSize: 12 }}>
                    • 完成企业认证可获得 +10 分
                  </div>
                </Space>
              </div>
            </Skeleton>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card
            bordered={false}
            style={{ borderRadius: 12 }}
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                <span>近期待办事项</span>
                <Badge count={statistics?.pending_tasks.length ?? 0} showZero style={{ marginLeft: 8 }} />
              </Space>
            }
          >
            <Skeleton loading={loading} active paragraph={{ rows: 4 }}>
              {statistics?.pending_tasks && statistics.pending_tasks.length > 0 ? (
                <List
                  dataSource={statistics.pending_tasks}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          key="handle"
                          type="link"
                          size="small"
                          onClick={() => {
                            if (item.type === 'review_application') navigate('/enterprise/jobs')
                            else if (item.type === 'verification') navigate('/enterprise/settings')
                            else if (item.type === 'confirm_completion') navigate('/enterprise/jobs')
                            else if (item.type === 'guarantee_replenish') navigate('/enterprise/guarantee')
                          }}
                        >
                          去处理
                        </Button>,
                      ]}
                      style={{ padding: '16px 0' }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar size={44} style={{ background: '#f5f5f5' }}>
                            {taskIconMap[item.type]}
                          </Avatar>
                        }
                        title={
                          <Space>
                            <span style={{ fontWeight: 500, fontSize: 15 }}>{item.title}</span>
                            <Tag color={priorityColorMap[item.priority]}>
                              优先级：{priorityTextMap[item.priority]}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={2} style={{ marginTop: 4 }}>
                            <span style={{ color: '#666' }}>{item.description}</span>
                            <span style={{ color: '#999', fontSize: 12 }}>
                              发布于 {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                            </span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无待办事项" />
              )}
            </Skeleton>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
