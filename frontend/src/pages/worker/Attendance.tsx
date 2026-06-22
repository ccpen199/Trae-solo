import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Typography,
  Space,
  Table,
  Tag,
  Badge,
  Statistic,
  Modal,
  message,
  Spin,
  Calendar,
  Alert,
  Tooltip,
  Avatar,
} from 'antd'
import {
  CheckCircleOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  LoginOutlined,
  LogoutOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ScanOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../App'
import workerApi from '../../api/worker'
import jobApi from '../../api/job'
import type { ApplicationDetail } from '../../api/job'
import type { AttendanceRecord, AttendanceStatus } from '../../types'

const { Title, Text } = Typography
const { Option } = Select

const statusMap: Record<AttendanceStatus, { color: string; text: string; bg: string }> = {
  normal: { color: '#52c41a', text: '正常', bg: '#f6ffed' },
  late: { color: '#faad14', text: '迟到', bg: '#fffbe6' },
  early_leave: { color: '#fa8c16', text: '早退', bg: '#fff7e6' },
  absent: { color: '#ff4d4f', text: '缺勤', bg: '#fff1f0' },
  leave: { color: '#1677ff', text: '请假', bg: '#e6f4ff' },
}

function Attendance() {
  const { user, worker } = useAuth()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<ApplicationDetail[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [punchLoading, setPunchLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(dayjs())

  const mockProjects: ApplicationDetail[] = [
    {
      id: 195,
      job_post_id: 295,
      worker_id: worker?.id || 1,
      application_status: 'accepted',
      applied_at: dayjs().subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'),
      hire_date: dayjs().subtract(15, 'day').format('YYYY-MM-DD'),
      worker_signoff: 1,
      worker_signoff_at: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise_confirm: 0,
      job_post: {
        id: 295,
        enterprise_id: 50,
        title: '商业大厦精装修电工班组',
        skill_required: '电工',
        workers_needed: 8,
        start_date: dayjs().subtract(15, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().add(45, 'day').format('YYYY-MM-DD'),
        daily_wage: 450,
        work_location: '北京市朝阳区建国路88号',
        latitude: 39.908823,
        longitude: 116.407526,
        geofence_radius: 200,
        accommodation_provided: 1,
        meals_provided: 1,
        insurance_provided: 1,
        work_hours: '上午8:00-12:00, 下午14:00-18:00',
        status: 'in_progress',
        wage_deposit_amount: 200000,
        deposit_paid: 1,
        created_at: '',
        updated_at: '',
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

  const generateMockRecords = (): AttendanceRecord[] => {
    const list: AttendanceRecord[] = []
    const today = dayjs()
    for (let i = 0; i < 45; i++) {
      const date = today.subtract(i, 'day')
      if (date.day() === 0 || date.day() === 6) {
        if (Math.random() > 0.5) continue
      }
      const rand = Math.random()
      let status: AttendanceStatus = 'normal'
      if (rand > 0.92) status = 'absent'
      else if (rand > 0.85) status = 'late'
      else if (rand > 0.78) status = 'early_leave'

      const checkInHour = status === 'late' ? 8 + Math.floor(Math.random() * 2) : 7 + Math.floor(Math.random() * 1)
      const checkInMin = status === 'late' ? 5 + Math.floor(Math.random() * 55) : 30 + Math.floor(Math.random() * 30)
      const checkOutHour = status === 'early_leave' ? 16 + Math.floor(Math.random() * 1) : 18
      const checkOutMin = status === 'early_leave' ? Math.floor(Math.random() * 60) : Math.floor(Math.random() * 30)

      list.push({
        id: 1000 - i,
        job_application_id: 195,
        worker_id: worker?.id || 1,
        job_post_id: 295,
        date: date.format('YYYY-MM-DD'),
        check_in_time: status === 'absent' ? undefined : `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}:00`,
        check_out_time: status === 'absent' ? undefined : `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}:00`,
        check_in_lat: 39.9088 + Math.random() * 0.002,
        check_in_lng: 116.4075 + Math.random() * 0.002,
        check_in_valid: 1,
        check_out_valid: 1,
        offline_mode: 0,
        work_hours: status === 'absent' ? 0 : status === 'early_leave' ? 7 + Math.random() : 8,
        status,
        created_at: date.format('YYYY-MM-DD HH:mm:ss'),
      })
    }
    return list.sort((a, b) => (dayjs(b.date).isAfter(a.date) ? 1 : -1))
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      setProjects(mockProjects)
      if (mockProjects.length > 0) {
        setSelectedProjectId(mockProjects[0].id)
        const all = generateMockRecords()
        setRecords(all)
        const today = all.find((r) => r.date === dayjs().format('YYYY-MM-DD'))
        if (today) {
          setTodayRecord(today)
        }
      }
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  const handleCheckIn = async () => {
    if (!user?.face_verified) {
      Modal.warning({
        title: '请先完成人脸识别',
        content: '考勤打卡需先完成人脸识别验证，请前往设置页面完成。',
      })
      return
    }
    Modal.confirm({
      title: '上班打卡确认',
      icon: <LoginOutlined style={{ color: '#52c41a' }} />,
      content: (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>当前时间</Text>
            <br />
            <Text strong>{currentTime.format('YYYY-MM-DD HH:mm:ss')}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>打卡地点（模拟GPS）</Text>
            <br />
            <Space>
              <EnvironmentOutlined style={{ color: '#52c41a' }} />
              <Text>{selectedProject?.job_post?.work_location}</Text>
            </Space>
            <br />
            <Tag color="success" style={{ marginTop: 4 }}>定位验证通过 · 在工地范围内</Tag>
          </div>
        </Space>
      ),
      okText: '确认打卡',
      cancelText: '取消',
      onOk: async () => {
        setPunchLoading(true)
        try {
          const newRecord: AttendanceRecord = {
            id: Date.now(),
            job_application_id: selectedProjectId || 0,
            worker_id: worker?.id || 1,
            job_post_id: selectedProject?.job_post_id || 0,
            date: dayjs().format('YYYY-MM-DD'),
            check_in_time: currentTime.format('HH:mm:ss'),
            check_in_valid: 1,
            check_out_valid: 0,
            offline_mode: 0,
            work_hours: 0,
            status: currentTime.hour() > 8 || (currentTime.hour() === 8 && currentTime.minute() > 0) ? 'late' : 'normal',
            created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          }
          setTodayRecord(newRecord)
          setRecords((prev) => [newRecord, ...prev.filter((r) => r.date !== newRecord.date)])
          message.success(
            newRecord.status === 'late'
              ? `打卡成功！您今天迟到了，请下次注意`
              : `上班打卡成功！祝您工作顺利`
          )
        } catch {
          message.error('打卡失败')
        } finally {
          setPunchLoading(false)
        }
      },
    })
  }

  const handleCheckOut = async () => {
    Modal.confirm({
      title: '下班打卡确认',
      icon: <LogoutOutlined style={{ color: '#1677ff' }} />,
      content: (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>当前时间</Text>
            <br />
            <Text strong>{currentTime.format('YYYY-MM-DD HH:mm:ss')}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>打卡地点（模拟GPS）</Text>
            <br />
            <Space>
              <EnvironmentOutlined style={{ color: '#1677ff' }} />
              <Text>{selectedProject?.job_post?.work_location}</Text>
            </Space>
          </div>
          {todayRecord?.check_in_time && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>今日上班打卡</Text>
              <br />
              <Text>{todayRecord.check_in_time}</Text>
            </div>
          )}
        </Space>
      ),
      okText: '确认打卡',
      cancelText: '取消',
      onOk: async () => {
        setPunchLoading(true)
        try {
          const updated: AttendanceRecord = {
            ...(todayRecord || {
              id: Date.now(),
              job_application_id: selectedProjectId || 0,
              worker_id: worker?.id || 1,
              job_post_id: selectedProject?.job_post_id || 0,
              date: dayjs().format('YYYY-MM-DD'),
              check_in_valid: 1,
              offline_mode: 0,
              created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            }),
            check_out_time: currentTime.format('HH:mm:ss'),
            check_out_valid: 1,
            work_hours: currentTime.diff(
              dayjs(todayRecord?.check_in_time || '08:00:00', 'HH:mm:ss'),
              'hour',
              true
            ),
          }
          if (!updated.check_in_time) {
            updated.check_in_time = '08:00:00'
          }
          if (!updated.status) {
            updated.status = currentTime.hour() < 18 ? 'early_leave' : 'normal'
          }
          setTodayRecord(updated)
          setRecords((prev) => {
            const filtered = prev.filter((r) => r.date !== updated.date)
            return [updated, ...filtered]
          })
          message.success(
            updated.status === 'early_leave'
              ? `下班打卡成功！今天早退了 ${18 - currentTime.hour()} 小时，请留意`
              : `下班打卡成功！您辛苦了`
          )
        } catch {
          message.error('打卡失败')
        } finally {
          setPunchLoading(false)
        }
      },
    })
  }

  const monthStats = () => {
    const now = dayjs()
    const monthRecords = records.filter((r) =>
      dayjs(r.date).isSame(now, 'month')
    )
    const normal = monthRecords.filter((r) => r.status === 'normal').length
    const late = monthRecords.filter((r) => r.status === 'late').length
    const early = monthRecords.filter((r) => r.status === 'early_leave').length
    const absent = monthRecords.filter((r) => r.status === 'absent').length
    const totalHours = monthRecords.reduce((sum, r) => sum + r.work_hours, 0)
    return { normal, late, early, absent, totalHours, workDays: monthRecords.length - absent }
  }

  const stats = monthStats()

  const cellRender = (current: dayjs.Dayjs) => {
    const date = current.format('YYYY-MM-DD')
    const record = records.find((r) => r.date === date)
    if (!record) return undefined
    const s = statusMap[record.status]
    return (
      <Tooltip
        title={
          <Space direction="vertical" size={2}>
            <span>
              日期：{date}
            </span>
            <span>状态：{s.text}</span>
            {record.check_in_time && <span>上班：{record.check_in_time}</span>}
            {record.check_out_time && <span>下班：{record.check_out_time}</span>}
            <span>工时：{record.work_hours.toFixed(1)} 小时</span>
          </Space>
        }
      >
        <div
          style={{
            display: 'inline-block',
            width: 24,
            height: 24,
            lineHeight: '24px',
            textAlign: 'center',
            borderRadius: '50%',
            background: s.bg,
            color: s.color,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {current.date()}
        </div>
      </Tooltip>
    )
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (v: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <span>{dayjs(v).format('MM-DD')}</span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(v).format('ddd')}
          </Text>
        </Space>
      ),
    },
    {
      title: '上班打卡',
      dataIndex: 'check_in_time',
      key: 'check_in_time',
      width: 120,
      render: (v: string | null | undefined, record: AttendanceRecord) =>
        v ? (
          <Space>
            <LoginOutlined style={{ color: '#52c41a' }} />
            <span style={{ color: record.check_in_valid ? '#1f1f1f' : '#faad14' }}>{String(v).slice(0, 5)}</span>
            {!record.check_in_valid && <Tag color="warning" style={{ margin: 0 }}>位置异常</Tag>}
          </Space>
        ) : (
          <Text type="secondary">--</Text>
        ),
    },
    {
      title: '下班打卡',
      dataIndex: 'check_out_time',
      key: 'check_out_time',
      width: 120,
      render: (v: string | null | undefined, record: AttendanceRecord) =>
        v ? (
          <Space>
            <LogoutOutlined style={{ color: '#1677ff' }} />
            <span style={{ color: record.check_out_valid ? '#1f1f1f' : '#faad14' }}>{String(v).slice(0, 5)}</span>
            {!record.check_out_valid && <Tag color="warning" style={{ margin: 0 }}>位置异常</Tag>}
          </Space>
        ) : (
          <Text type="secondary">--</Text>
        ),
    },
    {
      title: '工时',
      dataIndex: 'work_hours',
      key: 'work_hours',
      width: 100,
      render: (v: number) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#722ed1' }} />
          <Text strong>{v.toFixed(1)} h</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: AttendanceStatus) => {
        const s = statusMap[v]
        return (
          <Tag color={s.color} style={{ border: 'none', background: s.bg, margin: 0 }}>
            {s.text}
          </Tag>
        )
      },
    },
    {
      title: '地点',
      key: 'location',
      render: (_: unknown, record: AttendanceRecord) =>
        record.check_in_lat ? (
          <Tooltip title={`经度: ${record.check_in_lng?.toFixed(4)}, 纬度: ${record.check_in_lat.toFixed(4)}`}>
            <Space size={4} style={{ color: '#8c8c8c', fontSize: 12 }}>
              <EnvironmentOutlined />
              已定位
            </Space>
          </Tooltip>
        ) : (
          <Text type="secondary">无</Text>
        ),
    },
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
        <Col xs={24} lg={14}>
          <Card
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
              border: 'none',
              color: '#fff',
            }}
            bodyStyle={{ padding: 32 }}
          >
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                    {currentTime.format('YYYY年MM月DD日 dddd')}
                  </Text>
                  <Title level={1} style={{ color: '#fff', margin: 0, marginTop: 8, fontSize: 56, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {currentTime.format('HH:mm')}
                    <span style={{ fontSize: 24, opacity: 0.7, marginLeft: 4 }}>{currentTime.format('ss')}</span>
                  </Title>
                </div>
                {projects.length > 0 && (
                  <Select
                    value={selectedProjectId}
                    onChange={setSelectedProjectId}
                    style={{ width: 240, background: 'rgba(255,255,255,0.15)', borderRadius: 8 }}
                    variant="borderless"
                    size="large"
                  >
                    {projects.map((p) => (
                      <Option key={p.id} value={p.id}>
                        {p.job_post?.title}
                      </Option>
                    ))}
                  </Select>
                )}
              </div>

              {selectedProject && (
                <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.15)', borderRadius: 12 }}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>当前项目</Text>
                      <br />
                      <Text strong style={{ color: '#fff', fontSize: 16 }}>{selectedProject.job_post?.title}</Text>
                    </div>
                    <Space split={<span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>} size={12}>
                      <Space size={4}>
                        <EnvironmentOutlined />
                        <Text style={{ color: '#fff', fontSize: 13 }}>{selectedProject.job_post?.work_location}</Text>
                      </Space>
                      <Space size={4}>
                        <Avatar
                          size={18}
                          style={{ background: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                        >
                          {selectedProject.enterprise?.company_name?.slice(0, 1)}
                        </Avatar>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
                          {selectedProject.enterprise?.company_name}
                        </Text>
                      </Space>
                    </Space>
                  </Space>
                </div>
              )}

              {!user?.face_verified && (
                <Alert
                  type="warning"
                  showIcon
                  icon={<ScanOutlined />}
                  message="请先完成人脸识别验证"
                  description="考勤打卡必须通过人脸识别才能进行，请先前往设置完成验证。"
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
                />
              )}

              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12}>
                  <Button
                    block
                    size="large"
                    type="primary"
                    disabled={!!todayRecord?.check_in_time}
                    loading={punchLoading}
                    onClick={handleCheckIn}
                    style={{
                      height: 72,
                      fontSize: 20,
                      fontWeight: 700,
                      borderRadius: 16,
                      background: todayRecord?.check_in_time ? 'rgba(255,255,255,0.2)' : '#fff',
                      color: todayRecord?.check_in_time ? 'rgba(255,255,255,0.5)' : '#1677ff',
                      border: 'none',
                    }}
                    icon={<LoginOutlined style={{ fontSize: 24 }} />}
                  >
                    {todayRecord?.check_in_time ? `已打卡 ${todayRecord.check_in_time.slice(0, 5)}` : '上班打卡'}
                  </Button>
                </Col>
                <Col xs={24} sm={12}>
                  <Button
                    block
                    size="large"
                    type="default"
                    disabled={!todayRecord?.check_in_time || !!todayRecord?.check_out_time}
                    loading={punchLoading}
                    onClick={handleCheckOut}
                    style={{
                      height: 72,
                      fontSize: 20,
                      fontWeight: 700,
                      borderRadius: 16,
                      background: '#fff',
                      color: '#1677ff',
                      border: 'none',
                    }}
                    icon={<LogoutOutlined style={{ fontSize: 24 }} />}
                  >
                    {todayRecord?.check_out_time
                      ? `已打卡 ${todayRecord.check_out_time.slice(0, 5)}`
                      : todayRecord?.check_in_time
                      ? '下班打卡'
                      : '请先上班打卡'}
                  </Button>
                </Col>
              </Row>

              {todayRecord && (
                <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
                  <Space split={<span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>} size={16}>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#b7eb8f' }} />
                      <Text style={{ color: '#fff', fontSize: 13 }}>
                        今日状态：
                        <Tag color={statusMap[todayRecord.status].color} style={{ margin: 0 }}>
                          {statusMap[todayRecord.status].text}
                        </Tag>
                      </Text>
                    </Space>
                    {todayRecord.check_in_time && todayRecord.check_out_time && (
                      <Space>
                        <ClockCircleOutlined style={{ color: '#bae0ff' }} />
                        <Text style={{ color: '#fff', fontSize: 13 }}>
                          工时 {todayRecord.work_hours.toFixed(1)} 小时
                        </Text>
                      </Space>
                    )}
                  </Space>
                </div>
              )}
            </Space>
          </Card>

          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: '#1677ff' }} />
                <span>{dayjs().format('YYYY年MM月')} 考勤日历</span>
              </Space>
            }
            style={{ marginTop: 24, borderRadius: 12 }}
          >
            <Calendar
              cellRender={cellRender}
              fullscreen={false}
              headerRender={({ value }) => (
                <div style={{ padding: 12, textAlign: 'center', fontWeight: 600, fontSize: 16 }}>
                  {value.format('YYYY年 MM月')}
                </div>
              )}
            />
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {Object.entries(statusMap).map(([k, v]) => (
                <Space key={k} size={6}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: v.bg,
                      border: `1px solid ${v.color}`,
                    }}
                  />
                  <Text style={{ fontSize: 12 }}>{v.text}</Text>
                </Space>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={<Space><InfoCircleOutlined style={{ color: '#722ed1' }} /><span>本月统计</span></Space>}
            style={{ borderRadius: 12 }}
          >
            <Row gutter={[12, 16]}>
              <Col span={12}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 12 }}>出勤天数</Text>}
                  value={stats.workDays}
                  suffix="天"
                  valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 700 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 12 }}>累计工时</Text>}
                  value={stats.totalHours.toFixed(1)}
                  suffix="h"
                  valueStyle={{ color: '#1677ff', fontSize: 24, fontWeight: 700 }}
                />
              </Col>
              <Col span={12}>
                <Badge.Ribbon text="正常" color="#52c41a">
                  <Card size="small" style={{ border: 'none', background: '#f6ffed' }}>
                    <Statistic value={stats.normal} valueStyle={{ color: '#52c41a', fontSize: 20, fontWeight: 700 }} />
                  </Card>
                </Badge.Ribbon>
              </Col>
              <Col span={12}>
                <Badge.Ribbon text="迟到" color="#faad14">
                  <Card size="small" style={{ border: 'none', background: '#fffbe6' }}>
                    <Statistic value={stats.late} valueStyle={{ color: '#d48806', fontSize: 20, fontWeight: 700 }} />
                  </Card>
                </Badge.Ribbon>
              </Col>
              <Col span={12}>
                <Badge.Ribbon text="早退" color="#fa8c16">
                  <Card size="small" style={{ border: 'none', background: '#fff7e6' }}>
                    <Statistic value={stats.early} valueStyle={{ color: '#d46b08', fontSize: 20, fontWeight: 700 }} />
                  </Card>
                </Badge.Ribbon>
              </Col>
              <Col span={12}>
                <Badge.Ribbon text="缺勤" color="#ff4d4f">
                  <Card size="small" style={{ border: 'none', background: '#fff1f0' }}>
                    <Statistic value={stats.absent} valueStyle={{ color: '#cf1322', fontSize: 20, fontWeight: 700 }} />
                  </Card>
                </Badge.Ribbon>
              </Col>
            </Row>
          </Card>

          {projects.length === 0 && (
            <Card style={{ marginTop: 24, borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message="暂无进行中的项目"
                description="您还没有正在进行的项目，请先在找工作页面申请并被录用后再来打卡。"
                style={{ textAlign: 'left', marginTop: 8 }}
              />
            </Card>
          )}

          <Card
            title={<Space><ClockCircleOutlined style={{ color: '#13c2c2' }} /><span>历史打卡记录</span></Space>}
            style={{ marginTop: 24, borderRadius: 12 }}
          >
            <Table
              size="small"
              dataSource={records.slice(0, 15)}
              columns={columns}
              rowKey="id"
              pagination={false}
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Attendance
