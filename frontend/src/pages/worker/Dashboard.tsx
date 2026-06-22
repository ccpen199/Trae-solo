import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Button,
  List,
  Tag,
  Avatar,
  Space,
  Typography,
  Alert,
  Badge,
  message,
  Spin,
} from 'antd'
import {
  UserOutlined,
  ScanOutlined,
  CalendarOutlined,
  StarOutlined,
  WalletOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../App'
import workerApi from '../../api/worker'
import jobApi from '../../api/job'
import type { ApplicationDetail, JobPostWithEnterprise } from '../../api/job'
import type { CraftsmanScoreDetail, WageStatistics } from '../../api/worker'
import type { RiskAlert, WageRelease } from '../../types'

const { Title, Text } = Typography

function Dashboard() {
  const navigate = useNavigate()
  const { user, worker } = useAuth()
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<CraftsmanScoreDetail | null>(null)
  const [wageStats, setWageStats] = useState<WageStatistics | null>(null)
  const [activeProjects, setActiveProjects] = useState<ApplicationDetail[]>([])
  const [recentWages, setRecentWages] = useState<WageRelease[]>([])
  const [alerts, setAlerts] = useState<RiskAlert[]>([])

  const mockScore: CraftsmanScoreDetail = {
    craftsman_level: worker?.craftsman_level || 2,
    craftsman_score: worker?.craftsman_score || 76,
    quality_score: worker?.quality_score || 82,
    peer_score: worker?.peer_score || 78,
    attendance_score: worker?.attendance_score || 85,
    next_level_score: 100,
    level_up_progress: 76,
  }

  const mockActiveProjects: ApplicationDetail[] = [
    {
      id: 101,
      job_post_id: 201,
      worker_id: worker?.id || 1,
      application_status: 'accepted',
      applied_at: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss'),
      hire_date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
      worker_signoff: 0,
      enterprise_confirm: 0,
      job_post: {
        id: 201,
        enterprise_id: 50,
        title: '某商业大厦精装修电工班组',
        skill_required: '电工',
        workers_needed: 8,
        start_date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().add(50, 'day').format('YYYY-MM-DD'),
        daily_wage: 450,
        work_location: '北京市朝阳区建国路88号',
        geofence_radius: 200,
        accommodation_provided: 1,
        accommodation_detail: '提供4人间宿舍',
        meals_provided: 1,
        meals_detail: '提供三餐',
        insurance_provided: 1,
        insurance_detail: '购买工伤保险',
        status: 'in_progress',
        wage_deposit_amount: 200000,
        deposit_paid: 1,
        created_at: dayjs().subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
      },
      enterprise: {
        id: 50,
        user_id: 0,
        company_name: '北京城建集团有限公司',
        verified: 1,
        credit_score: 98,
        total_projects: 156,
        total_workers_hired: 2340,
        created_at: '',
        updated_at: '',
      },
    },
  ]

  const mockRecentWages: WageRelease[] = [
    {
      id: 501,
      wage_guarantee_id: 301,
      job_application_id: 99,
      worker_id: worker?.id || 1,
      release_no: 'WR2026061500123',
      amount: 9800,
      release_reason: '月度工资发放',
      scheduled_release_date: dayjs('2026-06-15').format('YYYY-MM-DD'),
      actual_release_date: dayjs('2026-06-15').format('YYYY-MM-DD HH:mm:ss'),
      status: 'released',
      payslip_url: '',
      created_at: dayjs('2026-06-15').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 500,
      wage_guarantee_id: 299,
      job_application_id: 97,
      worker_id: worker?.id || 1,
      release_no: 'WR2026053000089',
      amount: 12600,
      release_reason: '项目完工结算',
      scheduled_release_date: dayjs('2026-05-30').format('YYYY-MM-DD'),
      actual_release_date: dayjs('2026-05-30').format('YYYY-MM-DD HH:mm:ss'),
      status: 'released',
      payslip_url: '',
      created_at: dayjs('2026-05-30').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 499,
      wage_guarantee_id: 298,
      job_application_id: 96,
      worker_id: worker?.id || 1,
      release_no: 'WR2026051500077',
      amount: 10500,
      release_reason: '月度工资发放',
      scheduled_release_date: dayjs('2026-05-15').format('YYYY-MM-DD'),
      actual_release_date: dayjs('2026-05-15').format('YYYY-MM-DD HH:mm:ss'),
      status: 'released',
      payslip_url: '',
      created_at: dayjs('2026-05-15').format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  const mockAlerts: RiskAlert[] = [
    {
      id: 301,
      alert_type: 'attendance_abnormal',
      severity: 'medium',
      worker_id: worker?.id,
      title: '考勤异常提醒',
      description: '昨日您的下班打卡超出项目地理围栏范围，请及时核实。',
      status: 'active',
      created_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 300,
      alert_type: 'quality_issue',
      severity: 'low',
      worker_id: worker?.id,
      title: '质量抽检通知',
      description: '您所在的班组将于明日上午进行第三季度质量抽检，请做好准备。',
      status: 'active',
      created_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      setScore(mockScore)
      setWageStats({
        total_income: 156800,
        pending_wages: 13500,
        paid_wages: 143300,
        monthly_income: 22400,
      })
      setActiveProjects(mockActiveProjects)
      setRecentWages(mockRecentWages)
      setAlerts(mockAlerts)
    } catch {
      message.error('数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const levelColor = (level: number) => {
    if (level >= 5) return '#f5222d'
    if (level === 4) return '#fa8c16'
    if (level === 3) return '#faad14'
    if (level === 2) return '#52c41a'
    return '#1677ff'
  }

  const levelName = (level: number) => {
    const names = ['见习匠', '初级匠', '中级匠', '高级匠', '大师匠', '宗师匠']
    return names[Math.min(level, 5)]
  }

  const handleCheckIn = async (appId: number) => {
    try {
      message.success('已模拟打卡成功！请前往考勤页面查看详情')
      navigate('/worker/attendance')
    } catch {
      message.error('打卡失败')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
              border: 'none',
            }}
            styles={{ body: { padding: 28 } }}
          >
            <Space align="center" size={20}>
              <Avatar
                size={72}
                style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)' }}
                icon={<UserOutlined style={{ fontSize: 36 }} />}
              />
              <div style={{ flex: 1, color: '#fff' }}>
                <Title level={3} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>
                  {user?.real_name || '师傅'}，早上好！👋
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                  {worker?.primary_skill || '待完善工种'} · {dayjs().format('YYYY年MM月DD日 dddd')}
                </Text>
                <div style={{ marginTop: 12 }}>
                  {user?.face_verified ? (
                    <Tag
                      color="success"
                      icon={<ScanOutlined />}
                      style={{
                        fontSize: 13,
                        padding: '4px 12px',
                        borderRadius: 16,
                        border: 'none',
                        background: 'rgba(82, 196, 26, 0.2)',
                        color: '#b7eb8f',
                      }}
                    >
                      人脸识别已通过
                    </Tag>
                  ) : (
                    <Space>
                      <Tag
                        color="warning"
                        icon={<ExclamationCircleOutlined />}
                        style={{
                          fontSize: 13,
                          padding: '4px 12px',
                          borderRadius: 16,
                          border: 'none',
                          background: 'rgba(250, 173, 20, 0.2)',
                          color: '#ffe58f',
                        }}
                      >
                        未完成人脸识别验证
                      </Tag>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => navigate('/worker/settings')}
                        style={{ borderRadius: 16 }}
                      >
                        立即验证
                      </Button>
                    </Space>
                  )}
                </div>
              </div>
            </Space>
          </Card>

          {alerts.length > 0 && (
            <div style={{ marginTop: 24 }}>
              {alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  type={alert.severity === 'high' || alert.severity === 'critical' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                  showIcon
                  icon={<ExclamationCircleOutlined />}
                  message={alert.title}
                  description={
                    <div>
                      <div>{alert.description}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(alert.created_at).fromNow()}
                      </Text>
                    </div>
                  }
                  style={{ marginBottom: 12, borderRadius: 8 }}
                  action={
                    <Button size="small" type="text" style={{ color: '#1677ff' }}>
                      查看详情
                    </Button>
                  }
                />
              ))}
            </div>
          )}

          <Card
            title={
              <Space>
                <StarOutlined style={{ color: '#faad14' }} />
                <span>匠级评分</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/worker/score')}>
                查看详情 <ArrowRightOutlined />
              </Button>
            }
            style={{ marginTop: 24, borderRadius: 12 }}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${levelColor(score?.craftsman_level || 1)} 0%, ${levelColor(score?.craftsman_level || 1)}99 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
                    Lv{score?.craftsman_level || 1}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>
                    {levelName(score?.craftsman_level || 1)}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 15 }}>
                      综合分 {score?.craftsman_score || 0}/100
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      距下一等级还差 {(score?.next_level_score || 100) - (score?.craftsman_score || 0)} 分
                    </Text>
                  </div>
                  <Progress
                    percent={score?.level_up_progress || 0}
                    showInfo={false}
                    strokeColor={levelColor(score?.craftsman_level || 1)}
                    style={{ margin: 0 }}
                  />
                </div>
              </div>
              <Row gutter={[16, 12]}>
                {[
                  { label: '质量分', value: score?.quality_score || 0, color: '#1677ff' },
                  { label: '工友分', value: score?.peer_score || 0, color: '#52c41a' },
                  { label: '出勤分', value: score?.attendance_score || 0, color: '#722ed1' },
                ].map((item) => (
                  <Col span={8} key={item.label}>
                    <div style={{ marginBottom: 6 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.label}
                      </Text>
                      <Text strong style={{ float: 'right', fontSize: 13 }}>
                        {item.value}
                      </Text>
                    </div>
                    <Progress
                      percent={item.value}
                      showInfo={false}
                      size="small"
                      strokeColor={item.color}
                      style={{ margin: 0 }}
                    />
                  </Col>
                ))}
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card bordered={false} style={{ borderRadius: 12, background: '#e6f4ff' }} styles={{ body: { padding: 20 } }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 12 }}>当前项目</Text>}
                  value={activeProjects.length}
                  prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
                  valueStyle={{ color: '#1677ff', fontSize: 28, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card bordered={false} style={{ borderRadius: 12, background: '#f6ffed' }} styles={{ body: { padding: 20 } }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 12 }}>累计出勤</Text>}
                  value={worker?.total_work_days || 328}
                  suffix="天"
                  prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#389e0d', fontSize: 28, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card bordered={false} style={{ borderRadius: 12, background: '#fffbe6' }} styles={{ body: { padding: 20 } }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 12 }}>匠级等级</Text>}
                  value={score?.craftsman_level || 1}
                  prefix="Lv"
                  suffix={levelName(score?.craftsman_level || 1)}
                  valueStyle={{ color: '#d48806', fontSize: 28, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card bordered={false} style={{ borderRadius: 12, background: '#fff1f0' }} styles={{ body: { padding: 20 } }}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 12 }}>累计收入</Text>}
                  value={wageStats?.total_income || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#cf1322', fontSize: 28, fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <CalendarOutlined style={{ color: '#1677ff' }} />
            <span>进行中的项目</span>
            <Badge count={activeProjects.length} style={{ backgroundColor: '#1677ff' }} />
          </Space>
        }
        style={{ marginTop: 24, borderRadius: 12 }}
      >
        {activeProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
            暂无进行中的项目，去<a onClick={() => navigate('/worker/jobs')}> 找工作 </a>吧
          </div>
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
            dataSource={activeProjects}
            renderItem={(app) => (
              <List.Item>
                <Card
                  hoverable
                  bordered={true}
                  style={{ borderRadius: 8 }}
                  styles={{ body: { padding: 20 } }}
                >
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                      <Title level={5} style={{ margin: 0, marginBottom: 6 }}>
                        {app.job_post?.title}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {app.enterprise?.company_name}
                      </Text>
                    </div>
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          工期
                        </Text>
                        <br />
                        <Text style={{ fontSize: 13 }}>
                          {dayjs(app.job_post?.start_date).format('MM/DD')} - {dayjs(app.job_post?.end_date).format('MM/DD')}
                        </Text>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          日薪
                        </Text>
                        <br />
                        <Text strong style={{ color: '#cf1322', fontSize: 16 }}>
                          ¥{app.job_post?.daily_wage}
                        </Text>
                      </Col>
                    </Row>
                    <Space split={<div style={{ width: 1, height: 14, background: '#e8e8e8' }} />} size={10}>
                      {app.job_post?.accommodation_provided && <Tag color="blue" style={{ margin: 0, fontSize: 12 }}>包住宿</Tag>}
                      {app.job_post?.meals_provided && <Tag color="green" style={{ margin: 0, fontSize: 12 }}>包三餐</Tag>}
                      {app.job_post?.insurance_provided && <Tag color="purple" style={{ margin: 0, fontSize: 12 }}>有保险</Tag>}
                    </Space>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8c8c8c', fontSize: 12 }}>
                      <EnvironmentOutlined />
                      <span>{app.job_post?.work_location}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        type="primary"
                        block
                        size="large"
                        onClick={() => handleCheckIn(app.id)}
                      >
                        今日打卡
                      </Button>
                      <Button
                        block
                        size="large"
                        onClick={() => navigate('/worker/applications')}
                      >
                        项目详情
                      </Button>
                    </div>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card
        title={
          <Space>
            <WalletOutlined style={{ color: '#cf1322' }} />
            <span>最近薪资到账</span>
          </Space>
        }
        extra={
          <Button type="link" onClick={() => navigate('/worker/wages')}>
            查看全部 <ArrowRightOutlined />
          </Button>
        }
        style={{ marginTop: 24, borderRadius: 12 }}
      >
        <List
          dataSource={recentWages}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
            >
              <Space align="center" size={12} style={{ width: '100%' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#fff1f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: '#cf1322',
                  }}
                >
                  💰
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 14 }}>{item.release_reason}</Text>
                    <Text strong style={{ color: '#cf1322', fontSize: 18 }}>
                      +¥{item.amount.toLocaleString()}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      单号：{item.release_no}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      到账：{dayjs(item.actual_release_date).format('MM-DD HH:mm')}
                    </Text>
                  </div>
                </div>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default Dashboard
