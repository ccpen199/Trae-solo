import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  Space,
  Progress,
  Tag,
  List,
  Empty,
  message,
} from 'antd'
import {
  BarChartOutlined,
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { api } from '@/lib/api'

const { Option } = Select

export default function Reports() {
  const [loading, setLoading] = useState(false)
  const [semester, setSemester] = useState('2024-2025-2')
  const [summary, setSummary] = useState<any>({})
  const [classroomUtilization, setClassroomUtilization] = useState<any[]>([])
  const [teacherWorkload, setTeacherWorkload] = useState<any[]>([])
  const [adjustmentStats, setAdjustmentStats] = useState<any>({})
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [conflictReasons, setConflictReasons] = useState<any[]>([])
  const [departmentStats, setDepartmentStats] = useState<any[]>([])

  const fetchSummary = async () => {
    try {
      const res: any = await api.reports.summary({ semester })
      setSummary(res.data || res || {})
    } catch (error) {
      console.error('获取统计摘要失败', error)
    }
  }

  const fetchClassroomUtilization = async () => {
    try {
      const res: any = await api.reports.classroomUtilization({ semester })
      setClassroomUtilization(res.data || res || [])
    } catch (error) {
      console.error('获取教室利用率失败', error)
    }
  }

  const fetchTeacherWorkload = async () => {
    try {
      const res: any = await api.reports.teacherWorkload({ semester })
      setTeacherWorkload(res.data || res || [])
    } catch (error) {
      console.error('获取教师课时失败', error)
    }
  }

  const fetchAdjustmentStats = async () => {
    try {
      const res: any = await api.reports.adjustmentStatistics({ semester })
      setAdjustmentStats(res.data || res || {})
    } catch (error) {
      console.error('获取调课统计失败', error)
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      const res: any = await api.reports.pendingApprovals()
      setPendingApprovals(res.data || res || [])
    } catch (error) {
      console.error('获取待审批失败', error)
    }
  }

  const fetchConflictReasons = async () => {
    try {
      const res: any = await api.reports.conflictReasons()
      setConflictReasons(res.data || res || [])
    } catch (error) {
      console.error('获取冲突原因失败', error)
    }
  }

  const fetchDepartmentStats = async () => {
    try {
      const res: any = await api.reports.departmentStats()
      setDepartmentStats(res.data || res || [])
    } catch (error) {
      console.error('获取院系统计失败', error)
    }
  }

  useEffect(() => {
    fetchSummary()
    fetchClassroomUtilization()
    fetchTeacherWorkload()
    fetchAdjustmentStats()
    fetchPendingApprovals()
    fetchConflictReasons()
    fetchDepartmentStats()
  }, [semester])

  const utilizationColumns = [
    {
      title: '教室',
      dataIndex: 'classroom_name',
      key: 'classroom_name',
    },
    {
      title: '楼栋',
      dataIndex: 'building',
      key: 'building',
    },
    {
      title: '已用课时',
      dataIndex: 'used_slots',
      key: 'used_slots',
      align: 'center' as const,
    },
    {
      title: '可用课时',
      dataIndex: 'total_slots',
      key: 'total_slots',
      align: 'center' as const,
    },
    {
      title: '利用率',
      dataIndex: 'utilization_rate',
      key: 'utilization_rate',
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate * 100)}
          size="small"
          status={rate > 0.8 ? 'exception' : rate > 0.5 ? 'active' : 'normal'}
        />
      ),
    },
  ]

  const workloadColumns = [
    {
      title: '教师',
      dataIndex: 'teacher_name',
      key: 'teacher_name',
    },
    {
      title: '院系',
      dataIndex: 'department_name',
      key: 'department_name',
    },
    {
      title: '课程数',
      dataIndex: 'course_count',
      key: 'course_count',
      align: 'center' as const,
    },
    {
      title: '总课时',
      dataIndex: 'total_hours',
      key: 'total_hours',
      align: 'center' as const,
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => {
        const hours = record.total_hours || 0
        if (hours > 12) return <Tag color="red">超负荷</Tag>
        if (hours > 10) return <Tag color="orange">偏多</Tag>
        if (hours < 4) return <Tag color="blue">偏少</Tag>
        return <Tag color="green">正常</Tag>
      },
    },
  ]

  return (
    <div>
      <Card
        title={
          <span>
            <BarChartOutlined style={{ marginRight: 8 }} />
            统计报表
          </span>
        }
        extra={
          <Select value={semester} onChange={setSemester} style={{ width: 180 }}>
            <Option value="2024-2025-2">2024-2025学年第二学期</Option>
            <Option value="2024-2025-1">2024-2025学年第一学期</Option>
          </Select>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总排课数"
                value={summary.total_schedules || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="教师总数"
                value={summary.total_teachers || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="调课申请数"
                value={summary.total_adjustments || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="冲突记录数"
                value={summary.total_conflicts || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="教室利用率 Top 10" size="small">
              <Table
                rowKey="id"
                columns={utilizationColumns}
                dataSource={classroomUtilization.slice(0, 10)}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="教师课时统计" size="small">
              <Table
                rowKey="id"
                columns={workloadColumns}
                dataSource={teacherWorkload.slice(0, 10)}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Card title="调课统计" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Statistic title="待审批" value={adjustmentStats.pending || 0} valueStyle={{ color: '#faad14' }} />
                <Statistic title="已通过" value={adjustmentStats.approved || 0} valueStyle={{ color: '#52c41a' }} />
                <Statistic title="已拒绝" value={adjustmentStats.rejected || 0} valueStyle={{ color: '#ff4d4f' }} />
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="待处理申请" size="small">
              {pendingApprovals.length > 0 ? (
                <List
                  size="small"
                  dataSource={pendingApprovals.slice(0, 5)}
                  renderItem={(item: any) => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.course_name}
                        description={`${item.reason?.slice(0, 20)}...`}
                      />
                      <Tag color="orange">待审</Tag>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无待审批" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          <Col span={8}>
            <Card title="冲突原因分布" size="small">
              {conflictReasons.length > 0 ? (
                <List
                  size="small"
                  dataSource={conflictReasons}
                  renderItem={(item: any) => (
                    <List.Item>
                      <span>{item.reason}</span>
                      <Tag color="red">{item.count}次</Tag>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无冲突记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="各院系排课统计" size="small">
              <Table
                rowKey="id"
                columns={[
                  { title: '院系', dataIndex: 'department_name', key: 'department_name' },
                  { title: '课程数', dataIndex: 'course_count', key: 'course_count', align: 'center' },
                  { title: '排课数', dataIndex: 'schedule_count', key: 'schedule_count', align: 'center' },
                  { title: '教师数', dataIndex: 'teacher_count', key: 'teacher_count', align: 'center' },
                  { title: '学生数', dataIndex: 'student_count', key: 'student_count', align: 'center' },
                ]}
                dataSource={departmentStats}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
