import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tabs,
  Typography,
  Space,
  Tag,
  Button,
  Modal,
  Descriptions,
  Divider,
  List,
  Progress,
  message,
  Spin,
  Tooltip,
} from 'antd'
import {
  WalletOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  BankOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  AlertOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import workerApi, { type WageStatistics, type PayslipDetail } from '../../api/worker'
import type { WageRelease, WageReleaseStatus } from '../../types'

const { Title, Text } = Typography

const statusConfig: Record<WageReleaseStatus, { color: string; bg: string; text: string; icon: React.ReactNode }> = {
  pending: { color: '#faad14', bg: '#fffbe6', text: '待发放', icon: <ClockCircleOutlined /> },
  processing: { color: '#1677ff', bg: '#e6f4ff', text: '发放中', icon: <DollarOutlined /> },
  released: { color: '#52c41a', bg: '#f6ffed', text: '已发放', icon: <CheckCircleOutlined /> },
  failed: { color: '#ff4d4f', bg: '#fff1f0', text: '发放失败', icon: <AlertOutlined /> },
  held: { color: '#722ed1', bg: '#f9f0ff', text: '暂扣中', icon: <SafetyOutlined /> },
}

function Wages() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'released' | 'pending'>('released')
  const [stats, setStats] = useState<WageStatistics | null>(null)
  const [releasedWages, setReleasedWages] = useState<WageRelease[]>([])
  const [pendingWages, setPendingWages] = useState<WageRelease[]>([])
  const [payslipVisible, setPayslipVisible] = useState(false)
  const [currentPayslip, setCurrentPayslip] = useState<PayslipDetail | null>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)

  const mockStats: WageStatistics = {
    total_income: 156800,
    pending_wages: 13500,
    paid_wages: 143300,
    monthly_income: 22400,
  }

  const mockReleased: WageRelease[] = [
    {
      id: 505,
      wage_guarantee_id: 305,
      job_application_id: 195,
      worker_id: 1,
      release_no: 'WR2026061500125',
      amount: 11250,
      release_reason: '2026年6月上半月工资',
      scheduled_release_date: dayjs('2026-06-15').format('YYYY-MM-DD'),
      actual_release_date: dayjs('2026-06-15').format('YYYY-MM-DD HH:mm:ss'),
      status: 'released',
      bank_name: '中国工商银行',
      bank_account: '6222 **** **** 1234',
      account_holder: '王建国',
      payslip_url: '',
      created_at: dayjs('2026-06-15').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 501,
      wage_guarantee_id: 301,
      job_application_id: 195,
      worker_id: 1,
      release_no: 'WR2026060100098',
      amount: 11150,
      release_reason: '2026年5月下半月工资',
      scheduled_release_date: dayjs('2026-06-01').format('YYYY-MM-DD'),
      actual_release_date: dayjs('2026-06-01').format('YYYY-MM-DD HH:mm:ss'),
      status: 'released',
      bank_name: '中国工商银行',
      bank_account: '6222 **** **** 1234',
      account_holder: '王建国',
      payslip_url: '',
      created_at: dayjs('2026-06-01').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 500,
      wage_guarantee_id: 299,
      job_application_id: 188,
      worker_id: 1,
      release_no: 'WR2026053000089',
      amount: 12600,
      release_reason: '科技园区焊工项目完工结算',
      scheduled_release_date: dayjs('2026-05-30').format('YYYY-MM-DD'),
      actual_release_date: dayjs('2026-05-30').format('YYYY-MM-DD HH:mm:ss'),
      status: 'released',
      bank_name: '中国工商银行',
      bank_account: '6222 **** **** 1234',
      account_holder: '王建国',
      payslip_url: '',
      created_at: dayjs('2026-05-30').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 499,
      wage_guarantee_id: 298,
      job_application_id: 188,
      worker_id: 1,
      release_no: 'WR2026051500077',
      amount: 10500,
      release_reason: '2026年5月上半月工资',
      scheduled_release_date: dayjs('2026-05-15').format('YYYY-MM-DD'),
      actual_release_date: dayjs('2026-05-15').format('YYYY-MM-DD HH:mm:ss'),
      status: 'released',
      bank_name: '中国工商银行',
      bank_account: '6222 **** **** 1234',
      account_holder: '王建国',
      payslip_url: '',
      created_at: dayjs('2026-05-15').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 495,
      wage_guarantee_id: 295,
      job_application_id: 185,
      worker_id: 1,
      release_no: 'WR2026043000052',
      amount: 14200,
      release_reason: '教学楼木工项目完工结算',
      scheduled_release_date: dayjs('2026-04-30').format('YYYY-MM-DD'),
      actual_release_date: dayjs('2026-04-30').format('YYYY-MM-DD HH:mm:ss'),
      status: 'released',
      bank_name: '中国工商银行',
      bank_account: '6222 **** **** 1234',
      account_holder: '王建国',
      payslip_url: '',
      created_at: dayjs('2026-04-30').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 490,
      wage_guarantee_id: 290,
      job_application_id: 178,
      worker_id: 1,
      release_no: 'WR2026041500031',
      amount: 9800,
      release_reason: '2026年4月上半月工资',
      scheduled_release_date: dayjs('2026-04-15').format('YYYY-MM-DD'),
      actual_release_date: dayjs('2026-04-15').format('YYYY-MM-DD HH:mm:ss'),
      status: 'released',
      bank_name: '中国工商银行',
      bank_account: '6222 **** **** 1234',
      account_holder: '王建国',
      payslip_url: '',
      created_at: dayjs('2026-04-15').format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  const mockPending: WageRelease[] = [
    {
      id: 506,
      wage_guarantee_id: 305,
      job_application_id: 195,
      worker_id: 1,
      release_no: 'WR2026063000168',
      amount: 11250,
      release_reason: '2026年6月下半月工资',
      scheduled_release_date: dayjs('2026-06-30').format('YYYY-MM-DD'),
      status: 'pending',
      created_at: dayjs('2026-06-16').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 507,
      wage_guarantee_id: 306,
      job_application_id: 199,
      worker_id: 1,
      release_no: 'WR2026063000169',
      amount: 2250,
      release_reason: '泥瓦工项目6月工资',
      scheduled_release_date: dayjs('2026-06-30').format('YYYY-MM-DD'),
      status: 'processing',
      created_at: dayjs('2026-06-18').format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  const mockPayslip: PayslipDetail = {
    wage_release: mockReleased[0],
    attendance_records: Array.from({ length: 13 }, (_, i) => ({
      date: dayjs('2026-06-01').add(i, 'day').format('YYYY-MM-DD'),
      work_hours: [0, 6].includes(dayjs('2026-06-01').add(i, 'day').day()) ? 0 : 8,
      status: [0, 6].includes(dayjs('2026-06-01').add(i, 'day').day()) ? 'absent' : 'normal',
      daily_wage: 450,
      amount: [0, 6].includes(dayjs('2026-06-01').add(i, 'day').day()) ? 0 : 450,
    })).filter((r) => r.work_hours > 0),
    deductions: [
      { type: '个人所得税', amount: 135, description: '应纳税所得额11250元，税率3%' },
      { type: '社保个人部分', amount: 565, description: '养老8%+医疗2%+失业0.5%' },
      { type: '住宿费', amount: 300, description: '4人间宿舍15天' },
    ],
    tax: 135,
    base_amount: 12250,
    deduction_total: 1000,
    net_amount: 11250,
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      setStats(mockStats)
      setReleasedWages(mockReleased)
      setPendingWages(mockPending)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleViewPayslip = async (wage: WageRelease) => {
    try {
      setCurrentPayslip(mockPayslip)
      setPayslipVisible(true)
    } catch {
      message.error('工资条加载失败')
    }
  }

  const handleDownload = async () => {
    setDownloadLoading(true)
    setTimeout(() => {
      setDownloadLoading(false)
      message.success('工资条已下载到本地')
    }, 1000)
  }

  const releasedColumns = [
    {
      title: '发放日期',
      dataIndex: 'actual_release_date',
      key: 'actual_release_date',
      width: 150,
      render: (v: any, record: WageRelease) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <Text strong>{v ? dayjs(v).format('YYYY-MM-DD') : '--'}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {v ? dayjs(v).format('HH:mm') : '--'}
          </Text>
        </Space>
      ),
    },
    {
      title: '发放项目',
      dataIndex: 'release_reason',
      key: 'release_reason',
      render: (v: string, record: WageRelease) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 14 }}>{v}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            单号：{record.release_no}
          </Text>
        </Space>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (v: number) => (
        <Text strong style={{ color: '#cf1322', fontSize: 20, fontWeight: 700 }}>
          ¥{v.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: WageReleaseStatus) => {
        const s = statusConfig[v]
        return (
          <Tag
            color={s.color}
            style={{
              border: 'none',
              background: s.bg,
              padding: '4px 10px',
              borderRadius: 16,
              margin: 0,
            }}
            icon={s.icon}
          >
            {s.text}
          </Tag>
        )
      },
    },
    {
      title: '收款账户',
      key: 'bank',
      width: 180,
      render: (record: WageRelease) =>
        record.bank_name ? (
          <Space direction="vertical" size={2}>
            <Space size={4}>
              <BankOutlined style={{ color: '#1677ff' }} />
              <Text style={{ fontSize: 13 }}>{record.bank_name}</Text>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.bank_account}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">--</Text>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (record: WageRelease) => (
        <Space size={6}>
          <Button
            size="small"
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewPayslip(record)}
          >
            工资条
          </Button>
          <Button
            size="small"
            type="link"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            下载
          </Button>
        </Space>
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
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f5222d 0%, #ff7875 100%)' }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>累计总收入</Text>}
              value={stats?.total_income || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontSize: 26, fontWeight: 700 }}
              suffix={<RiseOutlined style={{ fontSize: 14, opacity: 0.8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, background: 'linear-gradient(135deg, #faad14 0%, #ffd666 100%)' }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>待发工资</Text>}
              value={stats?.pending_wages || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontSize: 26, fontWeight: 700 }}
              suffix={<ClockCircleOutlined style={{ fontSize: 14, opacity: 0.8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, background: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)' }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>已发工资</Text>}
              value={stats?.paid_wages || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontSize: 26, fontWeight: 700 }}
              suffix={<CheckCircleOutlined style={{ fontSize: 14, opacity: 0.8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)' }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>本月收入</Text>}
              value={stats?.monthly_income || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontSize: 26, fontWeight: 700 }}
              suffix={<WalletOutlined style={{ fontSize: 14, opacity: 0.8 }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 24, borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'released' | 'pending')}
          items={[
            {
              key: 'released',
              label: (
                <Space>
                  <CheckCircleOutlined />
                  发放记录
                  <Tag color="green" style={{ marginLeft: 4 }}>{releasedWages.length}</Tag>
                </Space>
              ),
            },
            {
              key: 'pending',
              label: (
                <Space>
                  <ClockCircleOutlined />
                  待发工资
                  <Tag color="gold" style={{ marginLeft: 4 }}>{pendingWages.length}</Tag>
                </Space>
              ),
            },
          ]}
          size="large"
          style={{ padding: '0 24px' }}
        />
      </Card>

      {activeTab === 'released' ? (
        <Card style={{ marginTop: -1, borderRadius: '0 0 12px 12px', borderTop: 'none' }}>
          <Table
            size="middle"
            dataSource={releasedWages}
            columns={releasedColumns}
            rowKey="id"
            pagination={{ pageSize: 8, showSizeChanger: false }}
          />
        </Card>
      ) : (
        <Card style={{ marginTop: -1, borderRadius: '0 0 12px 12px', borderTop: 'none' }}>
          {pendingWages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
              暂无待发放工资
            </div>
          ) : (
            <List
              dataSource={pendingWages}
              renderItem={(item) => {
                const s = statusConfig[item.status]
                const daysUntil = dayjs(item.scheduled_release_date).diff(dayjs(), 'day')
                const total = stats?.pending_wages || 0
                const progress = ((total - item.amount) / total) * 100
                return (
                  <Card
                    key={item.id}
                    style={{ marginBottom: 16, borderRadius: 10, border: `1px solid ${s.color}40` }}
                    bodyStyle={{ padding: 20 }}
                  >
                    <Row gutter={[24, 12]} align="middle">
                      <Col xs={24} sm={12} md={8}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <Space size={6}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: s.bg,
                                color: s.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 18,
                              }}
                            >
                              {s.icon}
                            </div>
                            <div>
                              <Text strong style={{ fontSize: 15 }}>{item.release_reason}</Text>
                              <div>
                                <Tag color={s.color} style={{ margin: 0 }}>{s.text}</Tag>
                              </div>
                            </div>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            单号：{item.release_no}
                          </Text>
                        </Space>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>预计发放金额</Text>
                          <Text strong style={{ color: '#cf1322', fontSize: 26, fontWeight: 700 }}>
                            ¥{item.amount.toLocaleString()}
                          </Text>
                        </Space>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Space size={4}>
                              <CalendarOutlined style={{ color: '#8c8c8c' }} />
                              <Text type="secondary" style={{ fontSize: 12 }}>预计发放日</Text>
                            </Space>
                            <Text strong style={{ fontSize: 14 }}>
                              {dayjs(item.scheduled_release_date).format('MM月DD日')}
                            </Text>
                          </div>
                          <div>
                            <Progress
                              percent={100 - progress}
                              status={daysUntil <= 0 ? 'success' : 'active'}
                              showInfo={false}
                              size="small"
                              strokeColor={s.color}
                              style={{ margin: 0 }}
                            />
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {daysUntil > 0 ? (
                              <span>
                                <ClockCircleOutlined /> 距离发放还有 <Text strong style={{ color: s.color }}>{daysUntil}</Text> 天
                              </span>
                            ) : (
                              <span style={{ color: s.color }}>今日或已达发放日，请留意查收</span>
                            )}
                          </Text>
                        </Space>
                      </Col>
                      <Col xs={24} sm={12} md={4}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <Button
                            type="primary"
                            block
                            icon={<EyeOutlined />}
                            onClick={() => handleViewPayslip(item)}
                          >
                            查看明细
                          </Button>
                          <Tooltip title="工资将按约定时间自动发放到您绑定的银行账户">
                            <Button block icon={<InfoCircleOutlined />}>
                              发放说明
                            </Button>
                          </Tooltip>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                )
              }}
            />
          )}
        </Card>
      )}

      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>电子工资条</span>
            <Tag color="blue">{currentPayslip?.wage_release.release_no}</Tag>
          </Space>
        }
        open={payslipVisible}
        onCancel={() => setPayslipVisible(false)}
        width={680}
        footer={[
          <Button key="close" onClick={() => setPayslipVisible(false)}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            loading={downloadLoading}
            onClick={handleDownload}
          >
            下载PDF
          </Button>,
        ]}
      >
        {currentPayslip && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Card
              size="small"
              style={{ borderRadius: 8, background: '#fafafa' }}
              bodyStyle={{ padding: 16 }}
            >
              <Descriptions column={2} size="small" labelStyle={{ width: 100, color: '#8c8c8c' }}>
                <Descriptions.Item label="发薪项目">
                  {currentPayslip.wage_release.release_reason}
                </Descriptions.Item>
                <Descriptions.Item label="发放日期">
                  {dayjs(currentPayslip.wage_release.actual_release_date || currentPayslip.wage_release.scheduled_release_date).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="所属项目">
                  商业大厦精装修电工班组
                </Descriptions.Item>
                <Descriptions.Item label="收款账户">
                  {currentPayslip.wage_release.bank_name || '中国工商银行'} · {currentPayslip.wage_release.bank_account || '6222 **** **** 1234'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              size="small"
              title={<Space><CalendarOutlined style={{ color: '#1677ff' }} /><span>出勤明细</span></Space>}
              style={{ borderRadius: 8 }}
            >
              <Table
                size="small"
                dataSource={currentPayslip.attendance_records}
                pagination={false}
                rowKey="date"
                columns={[
                  {
                    title: '日期',
                    dataIndex: 'date',
                    key: 'date',
                    width: 100,
                    render: (v: string) => (
                      <Space size={4}>
                        <CalendarOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                        <Text style={{ fontSize: 12 }}>{dayjs(v).format('MM-DD')}</Text>
                      </Space>
                    ),
                  },
                  {
                    title: '工时',
                    dataIndex: 'work_hours',
                    key: 'work_hours',
                    width: 80,
                    render: (v: number) => (
                      <Text style={{ fontSize: 12 }}>{v.toFixed(1)} h</Text>
                    ),
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    width: 80,
                    render: (v: string) => {
                      const map: Record<string, { c: string; t: string }> = {
                        normal: { c: '#52c41a', t: '正常' },
                        late: { c: '#faad14', t: '迟到' },
                        absent: { c: '#ff4d4f', t: '缺勤' },
                      }
                      return (
                        <Tag color={map[v]?.c || 'default'} style={{ margin: 0, fontSize: 11 }}>
                          {map[v]?.t || v}
                        </Tag>
                      )
                    },
                  },
                  {
                    title: '日薪',
                    dataIndex: 'daily_wage',
                    key: 'daily_wage',
                    width: 80,
                    render: (v: number) => <Text style={{ fontSize: 12 }}>¥{v}</Text>,
                  },
                  {
                    title: '小计',
                    dataIndex: 'amount',
                    key: 'amount',
                    render: (v: number) => (
                      <Text strong style={{ fontSize: 12 }}>¥{v.toLocaleString()}</Text>
                    ),
                  },
                ]}
              />
            </Card>

            <Card
              size="small"
              title={<Space><FallOutlined style={{ color: '#ff4d4f' }} /><span>扣款明细</span></Space>}
              style={{ borderRadius: 8 }}
            >
              <List
                dataSource={currentPayslip.deductions}
                renderItem={(d) => (
                  <List.Item
                    key={d.type}
                    style={{ padding: '10px 0', borderBottom: '1px dashed #f0f0f0' }}
                  >
                    <Space style={{ width: '100%' }} justify="space-between">
                      <Space direction="vertical" size={2}>
                        <Text strong style={{ fontSize: 13 }}>{d.type}</Text>
                        {d.description && (
                          <Text type="secondary" style={{ fontSize: 11 }}>{d.description}</Text>
                        )}
                      </Space>
                      <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                        -¥{d.amount.toLocaleString()}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>

            <Divider style={{ margin: 0 }} />

            <Card
              size="small"
              style={{ borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}
              bodyStyle={{ padding: 16 }}
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">基础工资总额</Text>
                  <Text strong style={{ fontSize: 16 }}>¥{currentPayslip.base_amount.toLocaleString()}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">扣款合计</Text>
                  <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                    -¥{currentPayslip.deduction_total.toLocaleString()}
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed #b7eb8f' }}>
                  <Space size={4}>
                    <WalletOutlined style={{ color: '#52c41a' }} />
                    <Text strong style={{ fontSize: 16 }}>实发工资</Text>
                  </Space>
                  <Text strong style={{ color: '#389e0d', fontSize: 28, fontWeight: 700 }}>
                    ¥{currentPayslip.net_amount.toLocaleString()}
                  </Text>
                </div>
              </Space>
            </Card>

            <Alert
              type="info"
              showIcon
              icon={<SafetyOutlined />}
              message="平台保障说明"
              description={`本工资由「匠信工易」平台工资担保金发放，来源于企业预缴的项目保证金 ¥200,000.00。如对工资明细有疑问，请在7个工作日内联系平台客服。`}
              style={{ borderRadius: 8 }}
            />
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default Wages
