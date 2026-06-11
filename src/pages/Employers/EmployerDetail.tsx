import { Card, Descriptions, Tag, Table, Row, Col, Progress, Statistic, Badge, Button, Typography, Alert, Space, Divider } from 'antd'
import { ArrowLeftOutlined, SafetyOutlined, FileTextOutlined } from '@ant-design/icons'
import { employerProfiles, serviceOrders } from '@/mock/data'
import type { EmployerProfile, ServiceOrder, OrderStatus } from '@/types'
import { useParams, useNavigate } from 'react-router-dom'

const { Title } = Typography

const creditLevelTagColor: Record<string, string> = {
  'A+': 'green',
  A: 'blue',
  B: 'geekblue',
  C: 'orange',
  D: 'red',
}

const getCreditScoreColor = (score: number): string => {
  if (score >= 90) return '#52c41a'
  if (score >= 70) return '#1677ff'
  if (score >= 50) return '#fa8c16'
  return '#ff4d4f'
}

const statusTagColor: Record<string, string> = {
  active: 'green',
  restricted: 'orange',
  blacklisted: 'red',
}

const statusLabel: Record<string, string> = {
  active: '正常',
  restricted: '受限',
  blacklisted: '黑名单',
}

const orderStatusTagColor: Record<OrderStatus, string> = {
  pending: 'default',
  video_screening: 'processing',
  interview_scheduled: 'cyan',
  contract_signed: 'blue',
  insurance_enrolled: 'purple',
  in_service: 'green',
  completed: 'success',
  disputed: 'red',
  cancelled: 'error',
}

const orderStatusLabel: Record<OrderStatus, string> = {
  pending: '待处理',
  video_screening: '视频筛查',
  interview_scheduled: '面试安排',
  contract_signed: '已签约',
  insurance_enrolled: '已投保',
  in_service: '服务中',
  completed: '已完成',
  disputed: '纠纷中',
  cancelled: '已取消',
}

const EmployerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const employer = employerProfiles.find((e: EmployerProfile) => e.id === id)

  if (!employer) {
    return (
      <div className="page-container">
        <Card>
          <Typography.Text type="danger">未找到该雇主信息</Typography.Text>
          <Button type="link" onClick={() => navigate('/employers')}>
            返回列表
          </Button>
        </Card>
      </div>
    )
  }

  const relatedOrders = serviceOrders.filter(
    (o: ServiceOrder) => o.employerId === employer.id
  )

  const showWarning = employer.creditLevel === 'D' || employer.status === 'restricted' || employer.status === 'blacklisted'

  const orderColumns = [
    {
      title: '工单号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '劳动者',
      dataIndex: 'workerName',
      key: 'workerName',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => (
        <Tag color={orderStatusTagColor[status]}>{orderStatusLabel[status]}</Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ]

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employers')}>
          返回
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {employer.name}
        </Title>
        <Tag color={creditLevelTagColor[employer.creditLevel]}>{employer.creditLevel}</Tag>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24} align="middle">
          <Col span={8} style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={employer.creditScore}
              size={160}
              strokeColor={getCreditScoreColor(employer.creditScore)}
              format={(val) => (
                <span style={{ fontSize: 32, fontWeight: 600 }}>{val}</span>
              )}
            />
            <div style={{ marginTop: 8, color: '#666' }}>信用分</div>
          </Col>
          <Col span={16}>
            <Row gutter={24}>
              <Col span={8}>
                <Statistic title="总工单数" value={employer.totalOrders} prefix={<FileTextOutlined />} />
              </Col>
              <Col span={8}>
                <Statistic title="完成工单数" value={employer.completedOrders} />
              </Col>
              <Col span={8}>
                <Statistic
                  title="纠纷率"
                  value={(employer.disputeRate * 100).toFixed(2)}
                  suffix="%"
                  valueStyle={{
                    color: employer.disputeRate * 100 > 5 ? '#ff4d4f' : undefined,
                  }}
                />
              </Col>
            </Row>
            {showWarning && (
              <Alert
                style={{ marginTop: 16 }}
                type="warning"
                showIcon
                icon={<SafetyOutlined />}
                message={
                  employer.creditLevel === 'D'
                    ? '该雇主信用等级为D，属于高风险用户，请注意交易安全'
                    : employer.status === 'blacklisted'
                    ? '该雇主已被加入黑名单，禁止发起新工单'
                    : '该雇主账号已受限，部分功能被限制使用'
                }
              />
            )}
          </Col>
        </Row>
      </Card>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={3}>
          <Descriptions.Item label="姓名">{employer.name}</Descriptions.Item>
          <Descriptions.Item label="手机号">{employer.phone}</Descriptions.Item>
          <Descriptions.Item label="地址">{employer.address}</Descriptions.Item>
          <Descriptions.Item label="城市">{employer.city}</Descriptions.Item>
          <Descriptions.Item label="加入日期">{employer.joinDate}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusTagColor[employer.status]}>{statusLabel[employer.status]}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="关联工单">
        <Table
          rowKey="id"
          columns={orderColumns}
          dataSource={relatedOrders}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default EmployerDetail
