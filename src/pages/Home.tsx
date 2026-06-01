import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Users,
  GraduationCap,
  Building2,
  Calendar,
  FileText,
  ChevronRight,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  Plus,
  Upload,
  BarChart3,
  PieChart,
  CheckCircle,
  XCircle,
  Clock4,
} from 'lucide-react'
import {
  Card,
  Badge,
  Progress,
  List,
  Tag,
  Statistic,
  Row,
  Col,
  Space,
  Button,
  Empty,
  Typography,
  Divider,
  Tabs,
} from 'antd'
import { api } from '@/lib/api'

const { Title, Text } = Typography

interface ClassroomUtilization {
  id: number
  name: string
  scheduled_slots: number
  utilization_rate: number
}

interface TeacherWorkload {
  id: number
  name: string
  class_count: number
  weekly_hours: number
}

interface AdjustmentType {
  adjust_type: string
  count: number
}

interface OverviewData {
  classroom_utilization: {
    average: number
    max: number
    min: number
    high_count: number
    medium_count: number
    low_count: number
    top5: ClassroomUtilization[]
    bottom5: ClassroomUtilization[]
  }
  teacher_workload: {
    average: number
    max: number
    min: number
    max_teacher: TeacherWorkload
    min_teacher: TeacherWorkload
    top10: TeacherWorkload[]
  }
  adjustments: {
    total: number
    pending: number
    approved: number
    rejected: number
    by_type: AdjustmentType[]
  }
  conflicts: {
    total: number
    teacher: number
    classroom: number
    class: number
    time: number
    recent: any[]
  }
  pending_approvals: number
  unread_notifications: number
}

interface PendingApproval {
  id: number
  course_name: string
  teacher_name: string
  applicant_name: string
  adjust_type: string
  original_day_of_week: number
  original_slot_id: number
  reason: string
  created_at: string
}

interface Notification {
  id: number
  title: string
  type: string
  created_at: string
  is_read: number
}

interface Conflict {
  id: number
  conflict_type: string
  course1_name: string
  course2_name: string
  teacher1_name: string
  teacher2_name: string
  description: string
  detected_at: string
}

const dayMap: Record<number, string> = {
  1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日'
}

const slotMap: Record<number, string> = {
  1: '第1-2节', 2: '第3-4节', 3: '第5-6节', 4: '第7-8节', 5: '第9-10节',
  6: '第1-2节', 7: '第3-4节', 8: '第5-6节', 9: '第7-8节', 10: '第9-10节'
}

const adjustTypeMap: Record<string, string> = {
  change_time: '时间调整',
  change_room: '教室调整',
  cancel: '停课',
  reschedule: '补课',
}

const conflictTypeMap: Record<string, string> = {
  teacher: '教师冲突',
  classroom: '教室冲突',
  class: '班级冲突',
  time: '时间冲突',
}

const notificationTypeMap: Record<string, { label: string; color: string }> = {
  adjustment: { label: '调课通知', color: 'blue' },
  cancellation: { label: '停课通知', color: 'red' },
  makeup: { label: '补课通知', color: 'green' },
  room_change: { label: '教室变更', color: 'orange' },
  system: { label: '系统通知', color: 'purple' },
}

function getUtilizationColor(rate: number): string {
  if (rate > 80) return '#52c41a'
  if (rate >= 50) return '#faad14'
  return '#ff4d4f'
}

function getUtilizationBgColor(rate: number): string {
  if (rate > 80) return 'bg-green-500'
  if (rate >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function Home() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<{ count: number; recent: PendingApproval[] }>({ count: 0, recent: [] })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewRes, pendingRes, notifRes] = await Promise.all([
        api.reports.overview(),
        api.reports.pendingApprovals(),
        api.notifications.list({ is_read: false }),
      ])
      if (overviewRes.success) setOverview(overviewRes.data)
      if (pendingRes.success) setPendingApprovals(pendingRes.data)
      if (notifRes.success) setNotifications(notifRes.data.slice(0, 5))
    } finally {
      setLoading(false)
    }
  }

  const baseStats = [
    { label: '课程总数', value: 0, icon: BookOpen, color: 'bg-blue-500', link: '/courses' },
    { label: '教师总数', value: 0, icon: Users, color: 'bg-green-500', link: '/teachers' },
    { label: '班级总数', value: 0, icon: GraduationCap, color: 'bg-purple-500', link: '/classes' },
    { label: '教室总数', value: 0, icon: Building2, color: 'bg-orange-500', link: '/classrooms' },
    { label: '排课总数', value: 0, icon: Calendar, color: 'bg-cyan-500', link: '/schedules' },
    { label: '调课申请', value: 0, icon: FileText, color: 'bg-red-500', link: '/adjustments' },
  ]

  const quickActions = [
    { label: '新增排课', icon: Calendar, color: 'bg-blue-500', onClick: () => navigate('/schedules') },
    { label: '新增调课申请', icon: FileText, color: 'bg-green-500', onClick: () => navigate('/adjustments') },
    { label: '数据导入', icon: Upload, color: 'bg-purple-500', onClick: () => {} },
    { label: '统计报表', icon: BarChart3, color: 'bg-orange-500', onClick: () => navigate('/reports') },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const maxHours = overview?.teacher_workload.max || 1

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Title level={3} style={{ margin: 0 }}>仪表盘</Title>
        <Space>
          <Badge count={overview?.pending_approvals || 0} size="small" offset={[-2, 2]}>
            <Button type="primary" icon={<FileText />} onClick={() => navigate('/adjustments')}>
              待处理申请
            </Button>
          </Badge>
          <Badge count={overview?.unread_notifications || 0} size="small" offset={[-2, 2]}>
            <Button icon={<Bell />} onClick={() => navigate('/notifications')}>
              未读通知
            </Button>
          </Badge>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <Space>
                <Building2 className="w-5 h-5 text-blue-500" />
                <Text strong className="text-base">教室利用率</Text>
              </Space>
              <Tag color={overview ? getUtilizationColor(overview.classroom_utilization.average) : 'default'}>
                {overview?.classroom_utilization.average || 0}%
              </Tag>
            </div>
            <Progress
              percent={overview?.classroom_utilization.average || 0}
              strokeColor={getUtilizationColor(overview?.classroom_utilization.average || 0)}
              size="small"
            />
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-green-50 p-2 rounded-lg">
                <Text type="success" strong className="text-lg">{overview?.classroom_utilization.high_count || 0}</Text>
                <div className="text-xs text-gray-500">高利用率</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded-lg">
                <Text type="warning" strong className="text-lg">{overview?.classroom_utilization.medium_count || 0}</Text>
                <div className="text-xs text-gray-500">中利用率</div>
              </div>
              <div className="bg-red-50 p-2 rounded-lg">
                <Text type="danger" strong className="text-lg">{overview?.classroom_utilization.low_count || 0}</Text>
                <div className="text-xs text-gray-500">低利用率</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <Space>
                <Users className="w-5 h-5 text-green-500" />
                <Text strong className="text-base">教师课时统计</Text>
              </Space>
              <Tag color="green">周均 {overview?.teacher_workload.average || 0} 节</Tag>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <Text type="success" strong>最多</Text>
                </div>
                <Text strong>{overview?.teacher_workload.max_teacher?.name || '-'}</Text>
                <Tag color="green">{overview?.teacher_workload.max || 0} 节/周</Tag>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <Text type="danger" strong>最少</Text>
                </div>
                <Text strong>{overview?.teacher_workload.min_teacher?.name || '-'}</Text>
                <Tag color="red">{overview?.teacher_workload.min || 0} 节/周</Tag>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <Space>
                <FileText className="w-5 h-5 text-orange-500" />
                <Text strong className="text-base">调课统计</Text>
              </Space>
              <Tag color="orange">总计 {overview?.adjustments.total || 0}</Tag>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-yellow-50 p-2 rounded-lg">
                <Clock4 className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <Text type="warning" strong className="text-lg">{overview?.adjustments.pending || 0}</Text>
                <div className="text-xs text-gray-500">待审批</div>
              </div>
              <div className="bg-green-50 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <Text type="success" strong className="text-lg">{overview?.adjustments.approved || 0}</Text>
                <div className="text-xs text-gray-500">已通过</div>
              </div>
              <div className="bg-red-50 p-2 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <Text type="danger" strong className="text-lg">{overview?.adjustments.rejected || 0}</Text>
                <div className="text-xs text-gray-500">已拒绝</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <Space>
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <Text strong className="text-base">本月冲突统计</Text>
              </Space>
              <Tag color="red">{overview?.conflicts.total || 0} 次</Tag>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Text type="secondary">教师冲突</Text>
                <Space>
                  <Progress percent={overview?.conflicts.total ? (overview.conflicts.teacher / overview.conflicts.total * 100) : 0} size="small" showInfo={false} strokeColor="#1890ff" />
                  <Tag color="blue">{overview?.conflicts.teacher || 0}</Tag>
                </Space>
              </div>
              <div className="flex items-center justify-between">
                <Text type="secondary">教室冲突</Text>
                <Space>
                  <Progress percent={overview?.conflicts.total ? (overview.conflicts.classroom / overview.conflicts.total * 100) : 0} size="small" showInfo={false} strokeColor="#52c41a" />
                  <Tag color="green">{overview?.conflicts.classroom || 0}</Tag>
                </Space>
              </div>
              <div className="flex items-center justify-between">
                <Text type="secondary">班级冲突</Text>
                <Space>
                  <Progress percent={overview?.conflicts.total ? (overview.conflicts.class / overview.conflicts.total * 100) : 0} size="small" showInfo={false} strokeColor="#722ed1" />
                  <Tag color="purple">{overview?.conflicts.class || 0}</Tag>
                </Space>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider orientation="left"><Text strong>统计图表</Text></Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<Space><BarChart3 className="w-5 h-5 text-blue-500" />教室利用率排行</Space>}>
            <Tabs
              defaultActiveKey="top"
              items={[
                {
                  key: 'top',
                  label: '利用率 Top 5',
                  children: (
                    <div className="space-y-3">
                      {overview?.classroom_utilization.top5.length === 0 ? (
                        <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        overview?.classroom_utilization.top5.map((item, index) => (
                          <div key={item.id} className="flex items-center space-x-3">
                            <Tag color={index < 3 ? 'gold' : 'default'} className="w-8 text-center">
                              {index + 1}
                            </Tag>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <Text strong>{item.name}</Text>
                                <Text strong style={{ color: getUtilizationColor(item.utilization_rate) }}>
                                  {item.utilization_rate.toFixed(2)}%
                                </Text>
                              </div>
                              <Progress
                                percent={item.utilization_rate}
                                size="small"
                                showInfo={false}
                                strokeColor={getUtilizationColor(item.utilization_rate)}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )
                },
                {
                  key: 'bottom',
                  label: '利用率 Bottom 5',
                  children: (
                    <div className="space-y-3">
                      {overview?.classroom_utilization.bottom5.length === 0 ? (
                        <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        overview?.classroom_utilization.bottom5.map((item, index) => (
                          <div key={item.id} className="flex items-center space-x-3">
                            <Tag color="default" className="w-8 text-center">
                              {index + 1}
                            </Tag>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <Text strong>{item.name}</Text>
                                <Text strong style={{ color: getUtilizationColor(item.utilization_rate) }}>
                                  {item.utilization_rate.toFixed(2)}%
                                </Text>
                              </div>
                              <Progress
                                percent={item.utilization_rate}
                                size="small"
                                showInfo={false}
                                strokeColor={getUtilizationColor(item.utilization_rate)}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<Space><BarChart3 className="w-5 h-5 text-green-500" />教师课时排行 Top 10</Space>}>
            <div className="space-y-2">
              {overview?.teacher_workload.top10.length === 0 ? (
                <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                overview?.teacher_workload.top10.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <Tag color={index < 3 ? 'gold' : 'default'} className="w-8 text-center">
                      {index + 1}
                    </Tag>
                    <Text strong className="w-20 truncate">{item.name}</Text>
                    <div className="flex-1">
                      <Progress
                        percent={(item.weekly_hours / maxHours) * 100}
                        size="small"
                        showInfo={false}
                        strokeColor={index < 3 ? '#faad14' : '#1890ff'}
                      />
                    </div>
                    <Tag color={index < 3 ? 'gold' : 'blue'} className="w-16 text-center">
                      {item.weekly_hours} 节
                    </Tag>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<Space><PieChart className="w-5 h-5 text-orange-500" />调课原因分布</Space>}>
            <Row gutter={[16, 16]}>
              {overview?.adjustments.by_type.length === 0 ? (
                <Col span={24}>
                  <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </Col>
              ) : (
                overview?.adjustments.by_type.map((item) => (
                  <Col xs={12} key={item.adjust_type}>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <Statistic
                        title={adjustTypeMap[item.adjust_type] || item.adjust_type}
                        value={item.count}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                      <Progress
                        percent={overview?.adjustments.total ? (item.count / overview.adjustments.total * 100) : 0}
                        size="small"
                        type="dashboard"
                        strokeColor="#fa8c16"
                      />
                    </div>
                  </Col>
                ))
              )}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<Space><PieChart className="w-5 h-5 text-purple-500" />冲突类型分布</Space>}>
            <Row gutter={[16, 16]}>
              {overview?.conflicts.total === 0 ? (
                <Col span={24}>
                  <Empty description="暂无冲突数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </Col>
              ) : (
                <>
                  <Col xs={12}>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Statistic
                        title="教师冲突"
                        value={overview?.conflicts.teacher || 0}
                        valueStyle={{ color: '#1890ff' }}
                      />
                      <Progress
                        percent={overview?.conflicts.total ? (overview.conflicts.teacher / overview.conflicts.total * 100) : 0}
                        size="small"
                        type="dashboard"
                        strokeColor="#1890ff"
                      />
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Statistic
                        title="教室冲突"
                        value={overview?.conflicts.classroom || 0}
                        valueStyle={{ color: '#52c41a' }}
                      />
                      <Progress
                        percent={overview?.conflicts.total ? (overview.conflicts.classroom / overview.conflicts.total * 100) : 0}
                        size="small"
                        type="dashboard"
                        strokeColor="#52c41a"
                      />
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <Statistic
                        title="班级冲突"
                        value={overview?.conflicts.class || 0}
                        valueStyle={{ color: '#722ed1' }}
                      />
                      <Progress
                        percent={overview?.conflicts.total ? (overview.conflicts.class / overview.conflicts.total * 100) : 0}
                        size="small"
                        type="dashboard"
                        strokeColor="#722ed1"
                      />
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <Statistic
                        title="时间冲突"
                        value={overview?.conflicts.time || 0}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                      <Progress
                        percent={overview?.conflicts.total ? (overview.conflicts.time / overview.conflicts.total * 100) : 0}
                        size="small"
                        type="dashboard"
                        strokeColor="#ff4d4f"
                      />
                    </div>
                  </Col>
                </>
              )}
            </Row>
          </Card>
        </Col>
      </Row>

      <Divider orientation="left"><Text strong>待办事项</Text></Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <FileText className="w-5 h-5 text-yellow-500" />
                待审批调课申请
                <Badge count={pendingApprovals.count} size="small" />
              </Space>
            }
            extra={
              pendingApprovals.count > 0 && (
                <Link to="/adjustments" className="text-blue-500 text-sm">
                  查看全部 <ChevronRight className="w-4 h-4 inline" />
                </Link>
              )
            }
          >
            {pendingApprovals.recent.length === 0 ? (
              <Empty description="暂无待审批申请" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={pendingApprovals.recent.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg"
                    onClick={() => navigate(`/adjustments`)}
                  >
                    <List.Item.Meta
                      avatar={<div className={`${getUtilizationBgColor(50)} p-2 rounded-full`}><FileText className="w-4 h-4 text-white" /></div>}
                      title={
                        <div className="flex items-center space-x-2">
                          <Text strong>{item.course_name}</Text>
                          <Tag color="blue">{adjustTypeMap[item.adjust_type]}</Tag>
                        </div>
                      }
                      description={
                        <div className="text-sm text-gray-500">
                          <div>申请人: {item.applicant_name || item.teacher_name}</div>
                          <div className="flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.created_at?.slice(0, 10)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <Bell className="w-5 h-5 text-blue-500" />
                未读通知
                <Badge count={notifications.length} size="small" />
              </Space>
            }
            extra={
              notifications.length > 0 && (
                <Link to="/notifications" className="text-blue-500 text-sm">
                  查看全部 <ChevronRight className="w-4 h-4 inline" />
                </Link>
              )
            }
          >
            {notifications.length === 0 ? (
              <Empty description="暂无未读通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={notifications}
                renderItem={(item) => (
                  <List.Item
                    className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg"
                    onClick={() => navigate(`/notifications`)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Tag color={notificationTypeMap[item.type]?.color || 'default'}>
                          {notificationTypeMap[item.type]?.label || '通知'}
                        </Tag>
                      }
                      title={<Text strong className="text-sm">{item.title}</Text>}
                      description={
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.created_at?.slice(0, 16)}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <AlertTriangle className="w-5 h-5 text-red-500" />
                冲突预警
              </Space>
            }
            extra={
              <Link to="/reports" className="text-blue-500 text-sm">
                查看详情 <ChevronRight className="w-4 h-4 inline" />
              </Link>
            }
          >
            {overview?.conflicts.recent.length === 0 ? (
              <Empty description="暂无冲突预警" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={overview?.conflicts.recent.slice(0, 5)}
                renderItem={(item: Conflict) => (
                  <List.Item className="p-3 bg-red-50 rounded-lg mb-2">
                    <List.Item.Meta
                      avatar={<AlertTriangle className="w-5 h-5 text-red-500" />}
                      title={
                        <Tag color="red">{conflictTypeMap[item.conflict_type]}</Tag>
                      }
                      description={
                        <div className="text-sm">
                          <Text type="danger" strong>{item.course1_name}</Text>
                          <Text type="secondary" className="mx-1">与</Text>
                          <Text type="danger" strong>{item.course2_name}</Text>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.teacher1_name} / {item.teacher2_name}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Divider orientation="left"><Text strong>快速操作</Text></Divider>

      <Row gutter={[16, 16]}>
        {quickActions.map((action, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card
              hoverable
              className="text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              onClick={action.onClick}
            >
              <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <Text strong>{action.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
