import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Typography,
  Avatar,
  Empty,
  Progress,
  List,
  Alert,
  Steps,
  Descriptions,
  Divider,
} from 'antd'
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  FileTextOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { WageRelease, WageReleaseStatus } from '../../types'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface WageItem extends WageRelease {
  worker_name: string
  project_name: string
}

const statusColorMap: Record<WageReleaseStatus, string> = {
  pending: 'default',
  processing: 'processing',
  released: 'success',
  failed: 'error',
  held: 'warning',
}

const statusTextMap: Record<WageReleaseStatus, string> = {
  pending: '待发放',
  processing: '发放中',
  released: '已发放',
  failed: '发放失败',
  held: '已冻结',
}

const mockReleases: WageItem[] = [
  {
    id: 1,
    wage_guarantee_id: 1,
    job_application_id: 101,
    worker_id: 1,
    release_no: 'GZ202606200001',
    amount: 5250,
    release_reason: '2026年6月上半月工资',
    scheduled_release_date: '2026-06-15',
    actual_release_date: '2026-06-15 09:30:00',
    status: 'released',
    bank_name: '中国建设银行',
    bank_account: '6227 **** **** 8821',
    account_holder: '张伟',
    payslip_url: '/payslip/GZ202606200001.pdf',
    created_at: '2026-06-15 09:00:00',
    worker_name: '张伟',
    project_name: 'CBD办公楼装修项目',
  },
  {
    id: 2,
    wage_guarantee_id: 1,
    job_application_id: 102,
    worker_id: 2,
    release_no: 'GZ202606200002',
    amount: 4900,
    release_reason: '2026年6月上半月工资',
    scheduled_release_date: '2026-06-15',
    actual_release_date: '2026-06-15 09:32:00',
    status: 'released',
    bank_name: '中国工商银行',
    bank_account: '6222 **** **** 3345',
    account_holder: '李强',
    payslip_url: '/payslip/GZ202606200002.pdf',
    created_at: '2026-06-15 09:00:00',
    worker_name: '李强',
    project_name: 'CBD办公楼装修项目',
  },
  {
    id: 3,
    wage_guarantee_id: 2,
    job_application_id: 201,
    worker_id: 3,
    release_no: 'GZ202606250001',
    amount: 6720,
    release_reason: '2026年6月中工资结算',
    scheduled_release_date: '2026-06-25',
    actual_release_date: undefined,
    status: 'processing',
    bank_name: '中国农业银行',
    bank_account: '6228 **** **** 9901',
    account_holder: '王强',
    payslip_url: '/payslip/GZ202606250001.pdf',
    created_at: '2026-06-21 08:00:00',
    worker_name: '王强',
    project_name: '商业步行街改造项目',
  },
  {
    id: 4,
    wage_guarantee_id: 2,
    job_application_id: 202,
    worker_id: 4,
    release_no: 'GZ202606250002',
    amount: 6300,
    release_reason: '2026年6月中工资结算',
    scheduled_release_date: '2026-06-25',
    actual_release_date: undefined,
    status: 'pending',
    bank_name: '中国银行',
    bank_account: '6216 **** **** 7788',
    account_holder: '刘工',
    payslip_url: '/payslip/GZ202606250002.pdf',
    created_at: '2026-06-21 08:00:00',
    worker_name: '刘工',
    project_name: '商业步行街改造项目',
  },
  {
    id: 5,
    wage_guarantee_id: 2,
    job_application_id: 203,
    worker_id: 5,
    release_no: 'GZ202606300001',
    amount: 6300,
    release_reason: '2026年6月下半月工资',
    scheduled_release_date: '2026-06-30',
    actual_release_date: undefined,
    status: 'pending',
    bank_name: '中国建设银行',
    bank_account: '6227 **** **** 1234',
    account_holder: '赵六',
    payslip_url: undefined,
    created_at: '2026-06-21 10:00:00',
    worker_name: '赵六',
    project_name: 'CBD办公楼装修项目',
  },
  {
    id: 6,
    wage_guarantee_id: 1,
    job_application_id: 105,
    worker_id: 6,
    release_no: 'GZ202606300002',
    amount: 5250,
    release_reason: '2026年6月下半月工资',
    scheduled_release_date: '2026-06-30',
    actual_release_date: undefined,
    status: 'held',
    bank_name: '招商银行',
    bank_account: '6225 **** **** 5678',
    account_holder: '孙七',
    payslip_url: undefined,
    created_at: '2026-06-21 10:00:00',
    worker_name: '孙七',
    project_name: 'CBD办公楼装修项目',
  },
]

function WagePayment() {
  const [payslipModalOpen, setPayslipModalOpen] = useState(false)
  const [currentRelease, setCurrentRelease] = useState<WageItem | null>(null)

  const totalThisMonth = mockReleases.reduce((sum, r) => sum + r.amount, 0)
  const releasedThisMonth = mockReleases
    .filter((r) => r.status === 'released')
    .reduce((sum, r) => sum + r.amount, 0)
  const processingAmount = mockReleases
    .filter((r) => r.status === 'processing')
    .reduce((sum, r) => sum + r.amount, 0)
  const pendingAmount = mockReleases
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0)

  const openPayslip = (item: WageItem) => {
    setCurrentRelease(item)
    setPayslipModalOpen(true)
  }

  const columns: ColumnsType<WageItem> = [
    {
      title: '发放单号',
      dataIndex: 'release_no',
      key: 'no',
      width: 170,
      render: (text) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <Text code style={{ fontSize: 12 }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: '工人信息',
      key: 'worker',
      width: 180,
      render: (_, record) => (
        <Space size={10}>
          <Avatar
            size={36}
            style={{ background: 'linear-gradient(135deg, #1890ff, #722ed1)' }}
            icon={<UserOutlined />}
          >
            {record.worker_name[0]}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong>{record.worker_name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.bank_name} · {record.bank_account}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '所属项目',
      dataIndex: 'project_name',
      key: 'project',
      width: 200,
      render: (text) => (
        <Tag color="geekblue" style={{ padding: '2px 10px' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '发放金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (v) => (
        <Text strong style={{ color: '#fa8c16', fontSize: 15 }}>
          ¥{v.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '预计发放日期',
      dataIndex: 'scheduled_release_date',
      key: 'scheduled',
      width: 140,
      render: (text) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: '#52c41a' }} />
          {text}
        </Space>
      ),
    },
    {
      title: '实际发放时间',
      dataIndex: 'actual_release_date',
      key: 'actual',
      width: 170,
      render: (text) => (
        text ? dayjs(text).format('YYYY-MM-DD HH:mm') : <Text type="secondary">-</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: WageReleaseStatus) => {
        const icon =
          status === 'released' ? (
            <CheckCircleOutlined />
          ) : status === 'processing' ? (
            <SyncOutlined spin />
          ) : status === 'failed' ? (
            <InfoCircleOutlined />
          ) : (
            <ClockCircleOutlined />
          )
        return (
          <Tag
            color={statusColorMap[status]}
            icon={icon}
            style={{ padding: '3px 12px', fontSize: 13 }}
          >
            {statusTextMap[status]}
          </Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            disabled={!record.payslip_url}
            onClick={() => openPayslip(record)}
          >
            电子工资条
          </Button>
        </Space>
      ),
    },
  ]

  const pendingList = mockReleases.filter((r) => r.status === 'pending' || r.status === 'processing')

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <DollarOutlined style={{ color: '#fa8c16' }} />
            工资发放
          </Space>
        </Title>
        <Space>
          <Tag color="processing">
            <SyncOutlined spin /> 发放中 {mockReleases.filter((r) => r.status === 'processing').length}
          </Tag>
          <Tag color="default">
            <ClockCircleOutlined /> 待发放 {mockReleases.filter((r) => r.status === 'pending').length}
          </Tag>
        </Space>
      </div>

      {processingAmount > 0 && (
        <Alert
          type="info"
          showIcon
          icon={<BankOutlined />}
          message="银企直连发放进度"
          description={
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space>
                <Text>
                  正在处理 <Text strong style={{ color: '#1890ff' }}>¥{processingAmount.toLocaleString()}</Text> 的工资发放...
                </Text>
                <Progress
                  percent={65}
                  size={[200, 10]}
                  status="active"
                  strokeColor={{ '0%': '#1890ff', '100%': '#52c41a' }}
                  showInfo={false}
                />
              </Space>
              <Steps
                size="small"
                current={1}
                style={{ maxWidth: 500 }}
                items={[
                  { title: '平台审核', description: '已通过' },
                  { title: '银企直连转账', description: '处理中' },
                  { title: '银行到账确认', description: '等待中' },
                  { title: '完成发放', description: '等待中' },
                ]}
              />
            </Space>
          }
          style={{ marginBottom: 20, borderRadius: 12 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
            }}
          >
            <Statistic
              title={
                <Space>
                  <Avatar
                    size={40}
                    style={{
                      background: 'linear-gradient(135deg, #fa8c16, #d46b08)',
                      verticalAlign: 'middle',
                    }}
                    icon={<DollarOutlined />}
                  />
                  <span style={{ fontSize: 14 }}>本月应发</span>
                </Space>
              }
              value={totalThisMonth}
              precision={2}
              prefix="¥"
              style={{ marginTop: 12 }}
              valueStyle={{ color: '#ad4e00' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
            }}
          >
            <Statistic
              title={
                <Space>
                  <Avatar
                    size={40}
                    style={{
                      background: 'linear-gradient(135deg, #52c41a, #389e0d)',
                      verticalAlign: 'middle',
                    }}
                    icon={<CheckCircleOutlined />}
                  />
                  <span style={{ fontSize: 14 }}>已发放</span>
                </Space>
              }
              value={releasedThisMonth}
              precision={2}
              prefix="¥"
              style={{ marginTop: 12 }}
              valueStyle={{ color: '#237804' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
            }}
          >
            <Statistic
              title={
                <Space>
                  <Avatar
                    size={40}
                    style={{
                      background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                      verticalAlign: 'middle',
                    }}
                    icon={<SyncOutlined />}
                  />
                  <span style={{ fontSize: 14 }}>发放中</span>
                </Space>
              }
              value={processingAmount}
              precision={2}
              prefix="¥"
              style={{ marginTop: 12 }}
              valueStyle={{ color: '#0050b3' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
            }}
          >
            <Statistic
              title={
                <Space>
                  <Avatar
                    size={40}
                    style={{
                      background: 'linear-gradient(135deg, #faad14, #d48806)',
                      verticalAlign: 'middle',
                    }}
                    icon={<ClockCircleOutlined />}
                  />
                  <span style={{ fontSize: 14 }}>待发放</span>
                </Space>
              }
              value={pendingAmount}
              precision={2}
              prefix="¥"
              style={{ marginTop: 12 }}
              valueStyle={{ color: '#ad6800' }}
            />
          </Card>
        </Col>
      </Row>

      {pendingList.length > 0 && (
        <Card
          bordered={false}
          style={{ borderRadius: 12, marginBottom: 20 }}
          title={
            <Space>
              <ClockCircleOutlined style={{ color: '#faad14' }} />
              待发放工资（T+1 自动释放）
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            {pendingList.map((item) => (
              <Col xs={24} sm={12} lg={8} key={item.id}>
                <Card
                  bordered
                  style={{
                    borderRadius: 10,
                    background:
                      item.status === 'processing'
                        ? 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)'
                        : '#fafafa',
                  }}
                  size="small"
                  hoverable
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space size={8}>
                        <Avatar
                          size={32}
                          style={{
                            background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                          }}
                        >
                          {item.worker_name[0]}
                        </Avatar>
                        <Space direction="vertical" size={0}>
                          <Text strong>{item.worker_name}</Text>
                          <Tag color="geekblue" style={{ margin: 0, fontSize: 11 }}>
                            {item.project_name}
                          </Tag>
                        </Space>
                      </Space>
                      {item.status === 'processing' && (
                        <SyncOutlined spin style={{ color: '#1890ff', fontSize: 18 }} />
                      )}
                    </Space>
                    <Divider style={{ margin: '8px 0' }} />
                    <Row>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          预计释放
                        </Text>
                        <div style={{ fontWeight: 600, color: '#52c41a' }}>
                          {dayjs(item.scheduled_release_date).format('MM-DD')}
                        </div>
                      </Col>
                      <Col span={12} style={{ textAlign: 'right' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          金额
                        </Text>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#fa8c16',
                            fontSize: 18,
                            lineHeight: 1.2,
                          }}
                        >
                          ¥{item.amount.toLocaleString()}
                        </div>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card bordered={false} style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table<WageItem>
          rowKey="id"
          columns={columns}
          dataSource={mockReleases}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条发放记录`,
          }}
          locale={{ emptyText: <Empty description="暂无工资发放记录" /> }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          currentRelease ? (
            <Space>
              <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
              电子工资条 - {currentRelease.release_no}
            </Space>
          ) : null
        }
        open={payslipModalOpen}
        onCancel={() => setPayslipModalOpen(false)}
        width={640}
        footer={[
          <Button key="download" icon={<FileTextOutlined />}>
            下载 PDF
          </Button>,
          <Button key="close" type="primary" onClick={() => setPayslipModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {currentRelease && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              bordered
              style={{
                borderRadius: 10,
                background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
              }}
            >
              <Row align="middle">
                <Col flex="auto">
                  <Space>
                    <Avatar
                      size={56}
                      style={{
                        background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                        fontSize: 22,
                      }}
                    >
                      {currentRelease.worker_name[0]}
                    </Avatar>
                    <Space direction="vertical" size={2}>
                      <Text strong style={{ fontSize: 18 }}>
                        {currentRelease.worker_name}
                      </Text>
                      <Tag color="geekblue">{currentRelease.project_name}</Tag>
                    </Space>
                  </Space>
                </Col>
                <Col>
                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      发放金额
                    </Text>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: '#1890ff',
                        lineHeight: 1.2,
                      }}
                    >
                      ¥{currentRelease.amount.toLocaleString()}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            <Card bordered style={{ borderRadius: 10 }} size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="发放单号">
                  {currentRelease.release_no}
                </Descriptions.Item>
                <Descriptions.Item label="发放类型">
                  {currentRelease.release_reason}
                </Descriptions.Item>
                <Descriptions.Item label="开户银行">
                  {currentRelease.bank_name}
                </Descriptions.Item>
                <Descriptions.Item label="银行账号">
                  {currentRelease.bank_account}
                </Descriptions.Item>
                <Descriptions.Item label="账户持有人">
                  {currentRelease.account_holder}
                </Descriptions.Item>
                <Descriptions.Item label="预计发放日">
                  {currentRelease.scheduled_release_date}
                </Descriptions.Item>
                <Descriptions.Item label="实际发放时间" span={2}>
                  <Space>
                    <Text strong style={{ color: '#52c41a' }}>
                      {currentRelease.actual_release_date || '待发放'}
                    </Text>
                    <ArrowRightOutlined />
                    <Tag color="success">
                      <CheckCircleOutlined /> 银行处理成功
                    </Tag>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              bordered
              style={{ borderRadius: 10 }}
              size="small"
              title="工资明细"
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Card
                    type="inner"
                    style={{ background: '#f9f9f9', borderRadius: 6 }}
                  >
                    <Statistic
                      title="出勤天数"
                      value={15}
                      suffix="天"
                      style={{ marginBottom: 0 }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    type="inner"
                    style={{ background: '#f9f9f9', borderRadius: 6 }}
                  >
                    <Statistic
                      title="日薪标准"
                      value={350}
                      prefix="¥"
                      suffix="/天"
                      style={{ marginBottom: 0 }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    type="inner"
                    style={{ background: '#e6f7ff', borderRadius: 6 }}
                  >
                    <Statistic
                      title="实发金额"
                      value={currentRelease.amount}
                      prefix="¥"
                      style={{ marginBottom: 0 }}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            <List
              size="small"
              header={<Text strong>发放流程</Text>}
              dataSource={[
                { icon: <CheckCircleOutlined />, title: '平台审核通过', desc: '2026-06-15 09:00' },
                { icon: <CheckCircleOutlined />, title: '银企直连扣款成功', desc: '2026-06-15 09:15' },
                { icon: <CheckCircleOutlined />, title: '银行转账处理', desc: '2026-06-15 09:25' },
                {
                  icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                  title: '工资到账确认',
                  desc: currentRelease.actual_release_date,
                },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space size={12}>
                    <span style={{ color: '#52c41a', fontSize: 16 }}>{item.icon}</span>
                    <Space direction="vertical" size={0}>
                      <Text strong>{item.title}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.desc}
                      </Text>
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default WagePayment
