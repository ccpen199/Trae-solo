import { Card, Row, Col, Statistic, Progress, Tag, Table, Typography, Space, Badge } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { workerProfiles, employerProfiles, serviceOrders, disputes, serviceSessions } from '@/mock/data'

const { Title } = Typography

const inServiceCount = serviceOrders.filter((o) => o.status === 'in_service').length
const pendingDisputeCount = disputes.filter((d) => d.status === 'pending' || d.status === 'ai_judged').length

const workerLevelMap: Record<string, { color: string; label: string }> = {
  L1: { color: '#52c41a', label: 'L1' },
  L2: { color: '#1890ff', label: 'L2' },
  L3: { color: '#faad14', label: 'L3' },
  L4: { color: '#f5222d', label: 'L4' },
}

const workerLevelData = (['L1', 'L2', 'L3', 'L4'] as const).map((level) => {
  const count = workerProfiles.filter((w) => w.level === level).length
  return { level, count, color: workerLevelMap[level].color, label: workerLevelMap[level].label }
})
const workerMaxCount = Math.max(...workerLevelData.map((d) => d.count), 1)

const creditLevelMap: Record<string, string> = {
  'A+': '#52c41a',
  A: '#1890ff',
  B: '#faad14',
  C: '#fa8c16',
  D: '#f5222d',
}

const creditLevelData = (['A+', 'A', 'B', 'C', 'D'] as const).map((level) => {
  const count = employerProfiles.filter((e) => e.creditLevel === level).length
  return { level, count, color: creditLevelMap[level] }
})
const creditMaxCount = Math.max(...creditLevelData.map((d) => d.count), 1)

const statusTagMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'blue', label: '待处理' },
  video_screening: { color: 'cyan', label: '视频初筛' },
  interview_scheduled: { color: 'geekblue', label: '面试安排' },
  contract_signed: { color: 'purple', label: '合同签署' },
  insurance_enrolled: { color: 'magenta', label: '保险投保' },
  in_service: { color: 'orange', label: '服务中' },
  completed: { color: 'green', label: '已完成' },
  disputed: { color: 'red', label: '纠纷中' },
  cancelled: { color: 'default', label: '已取消' },
}

const latestOrders = [...serviceOrders]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5)

const orderColumns = [
  { title: '工单号', dataIndex: 'id', key: 'id' },
  { title: '雇主', dataIndex: 'employerName', key: 'employerName' },
  { title: '劳动者', dataIndex: 'workerName', key: 'workerName' },
  { title: '类别', dataIndex: 'category', key: 'category' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const tag = statusTagMap[status] || { color: 'default', label: status }
      return <Tag color={tag.color}>{tag.label}</Tag>
    },
  },
  {
    title: '金额',
    dataIndex: 'price',
    key: 'price',
    render: (price: number) => `¥${price.toLocaleString()}`,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (v: string) => new Date(v).toLocaleString('zh-CN'),
  },
]

const alertSessions = serviceSessions.filter(
  (s) => s.deviationAlert || (s.actualDuration != null && Math.abs(s.actualDuration - s.expectedDuration) / s.expectedDuration > 0.2),
)

const sessionStatusMap: Record<string, { color: string; label: string }> = {
  not_started: { color: 'default', label: '未开始' },
  in_progress: { color: 'processing', label: '进行中' },
  completed: { color: 'success', label: '已完成' },
  disputed: { color: 'error', label: '纠纷中' },
}

const alertColumns = [
  { title: '会话ID', dataIndex: 'id', key: 'id' },
  { title: '劳动者', dataIndex: 'workerName', key: 'workerName' },
  {
    title: '预计时长',
    dataIndex: 'expectedDuration',
    key: 'expectedDuration',
    render: (v: number) => `${v} min`,
  },
  {
    title: '实际时长',
    dataIndex: 'actualDuration',
    key: 'actualDuration',
    render: (v: number | undefined) => (v != null ? `${v} min` : '-'),
  },
  {
    title: '偏差预警',
    dataIndex: 'deviationAlert',
    key: 'deviationAlert',
    render: (v: boolean) => (
      <Badge status={v ? 'error' : 'success'} text={v ? '预警' : '正常'} />
    ),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const tag = sessionStatusMap[status] || { color: 'default', label: status }
      return <Tag color={tag.color}>{tag.label}</Tag>
    },
  },
]

const Dashboard: React.FC = () => {
  return (
    <div className="page-container">
      <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>
        家服通运营概览
      </Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="劳动者总数"
              value={workerProfiles.length}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="雇主总数"
              value={employerProfiles.length}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中工单"
              value={inServiceCount}
              prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理纠纷"
              value={pendingDisputeCount}
              prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="劳动者等级分布">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {workerLevelData.map((item) => (
                <div key={item.level}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{item.label}</span>
                    <span>{item.count} 人</span>
                  </div>
                  <Progress
                    percent={(item.count / workerMaxCount) * 100}
                    showInfo={false}
                    strokeColor={item.color}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="雇主信用分布">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {creditLevelData.map((item) => (
                <div key={item.level}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{item.level}</span>
                    <span>{item.count} 人</span>
                  </div>
                  <Progress
                    percent={(item.count / creditMaxCount) * 100}
                    showInfo={false}
                    strokeColor={item.color}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近工单">
            <Table
              columns={orderColumns}
              dataSource={latestOrders}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="服务监管预警">
            <Table
              columns={alertColumns}
              dataSource={alertSessions}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
