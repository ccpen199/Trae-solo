import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Progress,
  Table,
  Typography,
  Space,
  Tag,
  List,
  Avatar,
  Rate,
  Divider,
  Statistic,
  Badge,
  Spin,
  message,
} from 'antd'
import {
  StarOutlined,
  TrophyOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  CalendarOutlined,
  LikeOutlined,
  DislikeOutlined,
  WarningOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useAuth } from '../../App'
import workerApi, { type CraftsmanScoreDetail, type ScoreHistory } from '../../api/worker'
import type { QualityInspection, PeerReview } from '../../types'

const { Title, Text } = Typography

const levelConfig = [
  { level: 0, name: '见习匠', min: 0, max: 30, color: '#bfbfbf', desc: '新人入门，初入行业' },
  { level: 1, name: '初级匠', min: 30, max: 50, color: '#1677ff', desc: '基础扎实，能独立工作' },
  { level: 2, name: '中级匠', min: 50, max: 70, color: '#52c41a', desc: '经验丰富，胜任复杂任务' },
  { level: 3, name: '高级匠', min: 70, max: 85, color: '#faad14', desc: '技艺精湛，行业佼佼者' },
  { level: 4, name: '大师匠', min: 85, max: 95, color: '#fa8c16', desc: '技艺超群，能带徒授业' },
  { level: 5, name: '宗师匠', min: 95, max: 100, color: '#f5222d', desc: '行业泰斗，德艺双馨' },
]

function Craftsman() {
  const { worker } = useAuth()
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<CraftsmanScoreDetail | null>(null)
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([])
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [reviews, setReviews] = useState<(PeerReview & { reviewer_name?: string; job_post_title?: string })[]>([])

  const mockScore: CraftsmanScoreDetail = {
    craftsman_level: worker?.craftsman_level || 2,
    craftsman_score: worker?.craftsman_score || 76,
    quality_score: worker?.quality_score || 82,
    peer_score: worker?.peer_score || 78,
    attendance_score: worker?.attendance_score || 85,
    next_level_score: 85,
    level_up_progress: ((worker?.craftsman_score || 76) - 70) / (85 - 70) * 100,
  }

  const mockHistory: ScoreHistory[] = [
    {
      id: 1,
      date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
      score_type: 'quality',
      before_score: 80,
      after_score: 82,
      change_reason: '质量抽检优秀 +2分',
      related_type: 'inspection',
      related_id: 88,
    },
    {
      id: 2,
      date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
      score_type: 'peer',
      before_score: 76,
      after_score: 78,
      change_reason: '工友好评 +2分',
      related_type: 'review',
      related_id: 156,
    },
    {
      id: 3,
      date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
      score_type: 'total',
      before_score: 74,
      after_score: 76,
      change_reason: '月度综合评估 +2分',
    },
    {
      id: 4,
      date: dayjs().subtract(12, 'day').format('YYYY-MM-DD'),
      score_type: 'attendance',
      before_score: 87,
      after_score: 85,
      change_reason: '迟到一次 -2分',
    },
    {
      id: 5,
      date: dayjs().subtract(18, 'day').format('YYYY-MM-DD'),
      score_type: 'quality',
      before_score: 78,
      after_score: 80,
      change_reason: '项目完工质量验收优秀 +2分',
      related_type: 'inspection',
      related_id: 75,
    },
    {
      id: 6,
      date: dayjs().subtract(25, 'day').format('YYYY-MM-DD'),
      score_type: 'peer',
      before_score: 74,
      after_score: 76,
      change_reason: '团队协作好评 +2分',
      related_type: 'review',
      related_id: 142,
    },
    {
      id: 7,
      date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      score_type: 'total',
      before_score: 72,
      after_score: 74,
      change_reason: '等级维持：中级匠 → 中级匠',
    },
  ]

  const mockInspections: QualityInspection[] = [
    {
      id: 88,
      job_application_id: 195,
      worker_id: worker?.id || 1,
      inspection_date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
      quality_score: 95,
      inspection_items: '电路安装规范、线路布局合理、接线端子牢固',
      rectification_required: 0,
      rectification_completed: 1,
      remarks: '整体质量优秀，工艺精湛',
      created_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 85,
      job_application_id: 195,
      worker_id: worker?.id || 1,
      inspection_date: dayjs().subtract(8, 'day').format('YYYY-MM-DD'),
      quality_score: 88,
      inspection_items: '配电箱安装、接地保护、线缆标识',
      rectification_required: 0,
      rectification_completed: 1,
      remarks: '质量良好，小细节需要加强',
      created_at: dayjs().subtract(8, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 75,
      job_application_id: 188,
      worker_id: worker?.id || 1,
      inspection_date: dayjs().subtract(18, 'day').format('YYYY-MM-DD'),
      quality_score: 92,
      inspection_items: '钢结构焊接质量、焊缝成型、防锈处理',
      rectification_required: 0,
      rectification_completed: 1,
      remarks: '焊接工艺达标，外观优良',
      created_at: dayjs().subtract(18, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 70,
      job_application_id: 188,
      worker_id: worker?.id || 1,
      inspection_date: dayjs().subtract(22, 'day').format('YYYY-MM-DD'),
      quality_score: 78,
      inspection_items: '焊缝检测、构件尺寸',
      issues_found: '个别焊缝存在气孔，需打磨补焊',
      rectification_required: 1,
      rectification_completed: 1,
      remarks: '已完成整改，复查合格',
      created_at: dayjs().subtract(22, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  const mockReviews: (PeerReview & { reviewer_name?: string; job_post_title?: string })[] = [
    {
      id: 156,
      job_post_id: 295,
      reviewer_worker_id: 201,
      target_worker_id: worker?.id || 1,
      review_score: 5,
      teamwork_score: 5,
      skill_score: 5,
      attitude_score: 4,
      review_content: '老王技术过硬，干活麻利不墨迹，电路排得整整齐齐，跟他搭伙干活省心！',
      created_at: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
      reviewer_name: '张师傅',
      job_post_title: '商业大厦精装修电工班组',
    },
    {
      id: 142,
      job_post_id: 288,
      reviewer_worker_id: 198,
      target_worker_id: worker?.id || 1,
      review_score: 5,
      teamwork_score: 5,
      skill_score: 4,
      attitude_score: 5,
      review_content: '老李是个热心人，遇到难题主动帮忙解决，团队合作非常愉快，下次有活还想一起干。',
      created_at: dayjs().subtract(25, 'day').format('YYYY-MM-DD HH:mm:ss'),
      reviewer_name: '赵师傅',
      job_post_title: '科技园区厂房钢结构焊工',
    },
    {
      id: 138,
      job_post_id: 285,
      reviewer_worker_id: 189,
      target_worker_id: worker?.id || 1,
      review_score: 4,
      teamwork_score: 4,
      skill_score: 5,
      attitude_score: 4,
      review_content: '木工手艺没得说，吊顶做得非常平整。就是有时候性子有点急，整体还是很不错的。',
      created_at: dayjs().subtract(40, 'day').format('YYYY-MM-DD HH:mm:ss'),
      reviewer_name: '孙师傅',
      job_post_title: '学校教学楼改造木工班组',
    },
    {
      id: 130,
      job_post_id: 278,
      reviewer_worker_id: 176,
      target_worker_id: worker?.id || 1,
      review_score: 5,
      teamwork_score: 4,
      skill_score: 5,
      attitude_score: 5,
      review_content: '经验丰富，手艺好，人品也不错，非常值得信任的工友！',
      created_at: dayjs().subtract(60, 'day').format('YYYY-MM-DD HH:mm:ss'),
      reviewer_name: '钱师傅',
      job_post_title: '小区住宅装修泥瓦工',
    },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      setScore(mockScore)
      setScoreHistory(mockHistory)
      setInspections(mockInspections)
      setReviews(mockReviews)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const currentLevelConfig = levelConfig.find(
    (l) => l.level === (score?.craftsman_level || 1)
  ) || levelConfig[1]
  const nextLevelConfig = levelConfig.find(
    (l) => l.level === (score?.craftsman_level || 1) + 1
  )

  const radarOption = {
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator: [
        { name: '质量分', max: 100, color: '#8c8c8c' },
        { name: '技能分', max: 100, color: '#8c8c8c' },
        { name: '工友分', max: 100, color: '#8c8c8c' },
        { name: '出勤分', max: 100, color: '#8c8c8c' },
        { name: '综合分', max: 100, color: '#8c8c8c' },
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#595959',
        fontSize: 13,
        fontWeight: 600,
      },
      splitLine: {
        lineStyle: {
          color: ['#f0f0f0', '#e8e8e8', '#d9d9d9', '#bfbfbf'],
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#fafafa', '#f5f5f5', '#fafafa', '#f5f5f5'],
        },
      },
      axisLine: {
        lineStyle: {
          color: '#d9d9d9',
        },
      },
    },
    series: [
      {
        name: '匠级评分',
        type: 'radar',
        data: [
          {
            value: [
              score?.quality_score || 0,
              Math.round(((score?.quality_score || 0) + (score?.peer_score || 0)) / 2),
              score?.peer_score || 0,
              score?.attendance_score || 0,
              score?.craftsman_score || 0,
            ],
            name: '我的评分',
            areaStyle: {
              color: {
                type: 'radial',
                x: 0.5,
                y: 0.5,
                r: 0.5,
                colorStops: [
                  { offset: 0, color: 'rgba(22, 119, 255, 0.6)' },
                  { offset: 1, color: 'rgba(22, 119, 255, 0.1)' },
                ],
              },
            },
            lineStyle: {
              color: '#1677ff',
              width: 2,
            },
            itemStyle: {
              color: '#1677ff',
              borderColor: '#fff',
              borderWidth: 2,
            },
            symbol: 'circle',
            symbolSize: 8,
          },
        ],
      },
    ],
  }

  const historyColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (v: string) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          {dayjs(v).format('MM-DD')}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'score_type',
      key: 'score_type',
      width: 90,
      render: (v: ScoreHistory['score_type']) => {
        const map = {
          total: { tag: <Tag color="gold">综合</Tag>, icon: <TrophyOutlined /> },
          quality: { tag: <Tag color="blue">质量</Tag>, icon: <CheckCircleOutlined /> },
          peer: { tag: <Tag color="green">工友</Tag>, icon: <TeamOutlined /> },
          attendance: { tag: <Tag color="purple">出勤</Tag>, icon: <ClockCircleOutlined /> },
        }
        return (
          <Space size={4}>
            {map[v].icon}
            {map[v].tag}
          </Space>
        )
      },
    },
    {
      title: '分数变化',
      key: 'change',
      width: 120,
      render: (_: unknown, record: ScoreHistory) => {
        const diff = record.after_score - record.before_score
        return (
          <Space size={8}>
            <Text delete type="secondary" style={{ fontSize: 12 }}>
              {record.before_score}
            </Text>
            <RiseOutlined style={{ color: diff >= 0 ? '#52c41a' : '#ff4d4f' }} />
            <Text strong style={{ color: diff >= 0 ? '#52c41a' : '#ff4d4f' }}>
              {record.after_score}
            </Text>
            <Tag color={diff >= 0 ? 'green' : 'red'} style={{ margin: 0 }}>
              {diff >= 0 ? '+' : ''}{diff}
            </Tag>
          </Space>
        )
      },
    },
    {
      title: '变动原因',
      dataIndex: 'change_reason',
      key: 'change_reason',
      render: (v: string) => (
        <Text style={{ fontSize: 13 }}>{v}</Text>
      ),
    },
  ]

  const dims = [
    { key: 'quality', label: '质量分', value: score?.quality_score || 0, color: '#1677ff', icon: <CheckCircleOutlined />, desc: '基于历次质量抽检评分' },
    { key: 'peer', label: '工友分', value: score?.peer_score || 0, color: '#52c41a', icon: <TeamOutlined />, desc: '基于团队协作与工友人脉评价' },
    { key: 'attendance', label: '出勤分', value: score?.attendance_score || 0, color: '#722ed1', icon: <ClockCircleOutlined />, desc: '基于考勤出勤率与迟到早退记录' },
    { key: 'total', label: '综合分', value: score?.craftsman_score || 0, color: '#faad14', icon: <TrophyOutlined />, desc: '加权综合：质量40%+工友25%+出勤25%+历史10%' },
  ]

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
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              background: `linear-gradient(135deg, ${currentLevelConfig.color} 0%, ${currentLevelConfig.color}dd 100%)`,
              border: 'none',
              color: '#fff',
              textAlign: 'center',
            }}
            styles={{ body: { padding: 32 } }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                margin: '0 auto 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: `0 0 40px ${currentLevelConfig.color}66`,
              }}
            >
              <div style={{ fontSize: 14, opacity: 0.9 }}>匠级</div>
              <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, marginTop: 4 }}>
                Lv{score?.craftsman_level || 1}
              </div>
              <div style={{ fontSize: 13, marginTop: 6, opacity: 0.95 }}>
                {currentLevelConfig.name}
              </div>
            </div>

            <Title level={3} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>
              综合评分：{score?.craftsman_score || 0} 分
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
              {currentLevelConfig.desc}
            </Text>

            <div
              style={{
                marginTop: 20,
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                textAlign: 'left',
              }}
            >
              {nextLevelConfig ? (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Space size={4}>
                      <TrophyOutlined />
                      <Text style={{ color: '#fff', fontSize: 13 }}>下一等级：{nextLevelConfig.name}</Text>
                    </Space>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
                      还差 {(nextLevelConfig.min - (score?.craftsman_score || 0)).toFixed(0)} 分
                    </Text>
                  </div>
                  <Progress
                    percent={score?.level_up_progress || 0}
                    showInfo={false}
                    strokeColor={{
                      from: '#fff',
                      to: 'rgba(255,255,255,0.6)',
                    }}
                    trailColor="rgba(255,255,255,0.2)"
                    style={{ margin: 0 }}
                  />
                </Space>
              ) : (
                <Space>
                  <StarOutlined style={{ color: '#ffe58f' }} />
                  <Text style={{ color: '#fff' }}>您已达到最高等级，继续保持！</Text>
                </Space>
              )}
            </div>
          </Card>

          <Card
            title={<Space><TrophyOutlined style={{ color: '#faad14' }} /><span>匠级等级说明</span></Space>}
            style={{ marginTop: 24, borderRadius: 12 }}
            size="small"
          >
            {levelConfig.slice(1).map((l) => (
              <div
                key={l.level}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: l.level < 5 ? '1px dashed #f0f0f0' : 'none',
                  opacity: (score?.craftsman_level || 1) >= l.level ? 1 : 0.5,
                }}
              >
                <Badge
                  color={l.color}
                  text={
                    <Text strong style={{ fontSize: 13 }}>
                      Lv{l.level} {l.name}
                    </Text>
                  }
                  style={{ minWidth: 110 }}
                />
                <div style={{ flex: 1, marginLeft: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {l.min} - {l.max}分
                  </Text>
                </div>
                {(score?.craftsman_level || 1) >= l.level && (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                )}
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={<Space><EyeOutlined style={{ color: '#722ed1' }} /><span>四维评分雷达</span></Space>}
            style={{ borderRadius: 12 }}
          >
            <ReactECharts
              option={radarOption}
              style={{ height: 320 }}
              notMerge={true}
              lazyUpdate={true}
            />
          </Card>

          <Card
            title={<Space><StarOutlined style={{ color: '#faad14' }} /><span>各维度评分详情</span></Space>}
            style={{ marginTop: 24, borderRadius: 12 }}
          >
            <Row gutter={[24, 24]}>
              {dims.map((dim) => (
                <Col xs={24} sm={12} key={dim.key}>
                  <Card
                    size="small"
                    bordered
                    style={{ borderRadius: 10 }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size={8}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: `${dim.color}15`,
                              color: dim.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                            }}
                          >
                            {dim.icon}
                          </div>
                          <Text strong style={{ fontSize: 15 }}>{dim.label}</Text>
                        </Space>
                        <Text strong style={{ fontSize: 26, color: dim.color }}>{dim.value}</Text>
                      </div>
                      <Progress
                        percent={dim.value}
                        showInfo={false}
                        strokeColor={dim.color}
                        style={{ margin: 0 }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>{dim.desc}</Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Card
        title={<Space><RiseOutlined style={{ color: '#1677ff' }} /><span>评分历史记录</span></Space>}
        style={{ marginTop: 24, borderRadius: 12 }}
      >
        <Table
          size="middle"
          dataSource={scoreHistory}
          columns={historyColumns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#1677ff' }} />
                <span>最近质量抽检</span>
                <Tag color="blue">{inspections.length}条</Tag>
              </Space>
            }
            style={{ borderRadius: 12, height: '100%' }}
          >
            <List
              dataSource={inspections}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{ padding: '16px 0', borderBottom: '1px dashed #f0f0f0' }}
                >
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space size={10}>
                        <CalendarOutlined style={{ color: '#8c8c8c' }} />
                        <Text strong>{dayjs(item.inspection_date).format('YYYY-MM-DD')}</Text>
                        {item.rectification_required ? (
                          item.rectification_completed ? (
                            <Tag color="success" style={{ margin: 0 }}>已整改</Tag>
                          ) : (
                            <Tag color="warning" style={{ margin: 0 }}>待整改</Tag>
                          )
                        ) : (
                          <Tag color="blue" style={{ margin: 0 }}>一次性通过</Tag>
                        )}
                      </Space>
                      <Space size={6}>
                        <Statistic
                          value={item.quality_score}
                          valueStyle={{
                            fontSize: 20,
                            fontWeight: 700,
                            color:
                              item.quality_score >= 90
                                ? '#52c41a'
                                : item.quality_score >= 80
                                ? '#1677ff'
                                : item.quality_score >= 70
                                ? '#faad14'
                                : '#ff4d4f',
                          }}
                          suffix="分"
                        />
                        <Rate
                          disabled
                          allowHalf
                          value={item.quality_score / 20}
                          style={{ fontSize: 14 }}
                        />
                      </Space>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      检查项：{item.inspection_items}
                    </Text>
                    {item.issues_found && (
                      <Space size={4} style={{ color: '#faad14', fontSize: 12 }}>
                        <WarningOutlined />
                        <span>问题：{item.issues_found}</span>
                      </Space>
                    )}
                    {item.remarks && (
                      <Space size={4} style={{ color: '#52c41a', fontSize: 12 }}>
                        <LikeOutlined />
                        <span>备注：{item.remarks}</span>
                      </Space>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: '#52c41a' }} />
                <span>最近工友评价</span>
                <Tag color="green">{reviews.length}条</Tag>
              </Space>
            }
            style={{ borderRadius: 12, height: '100%' }}
          >
            <List
              dataSource={reviews}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{ padding: '16px 0', borderBottom: '1px dashed #f0f0f0' }}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Space size={10}>
                        <Avatar
                          style={{ background: '#52c41a' }}
                          size={40}
                        >
                          {item.reviewer_name?.[0] || '友'}
                        </Avatar>
                        <div>
                          <Text strong style={{ fontSize: 14 }}>{item.reviewer_name}</Text>
                          <div>
                            <Rate
                              disabled
                              allowHalf
                              value={item.review_score}
                              style={{ fontSize: 14 }}
                            />
                          </div>
                        </div>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.created_at).fromNow()}
                      </Text>
                    </div>
                    {item.review_content && (
                      <div
                        style={{
                          padding: '10px 14px',
                          background: '#f6ffed',
                          borderRadius: 8,
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: '#389e0d',
                        }}
                      >
                        “{item.review_content}”
                      </div>
                    )}
                    <Space split={<Text type="secondary" style={{ fontSize: 12 }}>|</Text>} size={8}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <LikeOutlined /> 技能 {item.skill_score}分
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <TeamOutlined /> 协作 {item.teamwork_score}分
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <StarOutlined /> 态度 {item.attitude_score}分
                      </Text>
                    </Space>
                    {item.job_post_title && (
                      <Tag color="default" style={{ margin: 0, fontSize: 12 }}>
                        项目：{item.job_post_title}
                      </Tag>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Craftsman
