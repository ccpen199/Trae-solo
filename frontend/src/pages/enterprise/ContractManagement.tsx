import { useState } from 'react'
import {
  Card,
  Tabs,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions,
  Avatar,
  Empty,
  Timeline,
  Divider,
} from 'antd'
import {
  FileProtectOutlined,
  EyeOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface ContractItem {
  id: number
  contract_no: string
  project_name: string
  worker_name: string
  worker_avatar?: string
  sign_date: string
  total_amount: number
  paid_amount: number
  status: 'active' | 'completed' | 'breached' | 'all'
  skill: string
  daily_wage: number
  start_date: string
  end_date: string
  enterprise_sign: string
  worker_sign: string
  wage_details: Array<{ date: string; days: number; amount: number }>
  performance_records: Array<{ date: string; event: string; status: string }>
}

const statusColorMap: Record<string, string> = {
  active: 'processing',
  completed: 'success',
  breached: 'error',
}

const statusTextMap: Record<string, string> = {
  active: '执行中',
  completed: '已完成',
  breached: '违约',
  all: '全部',
}

const mockContracts: ContractItem[] = [
  {
    id: 1,
    contract_no: 'HT2026060001',
    project_name: 'CBD办公楼装修项目',
    worker_name: '张伟',
    sign_date: '2026-06-01',
    total_amount: 35000,
    paid_amount: 17500,
    status: 'active',
    skill: '木工',
    daily_wage: 350,
    start_date: '2026-06-01',
    end_date: '2026-07-15',
    enterprise_sign: '北京建工装饰有限公司（公章）',
    worker_sign: '张伟（签名）',
    wage_details: [
      { date: '2026-06-01 ~ 2026-06-15', days: 15, amount: 5250 },
      { date: '2026-06-16 ~ 2026-06-30', days: 14, amount: 4900 },
      { date: '2026-07-01 ~ 2026-07-15', days: 15, amount: 5250 },
    ],
    performance_records: [
      { date: '2026-06-01', event: '合同签订生效', status: 'success' },
      { date: '2026-06-01', event: '工人到岗开始工作', status: 'success' },
      { date: '2026-06-15', event: '第一期工资发放 ¥5,250', status: 'success' },
      { date: '2026-06-30', event: '第二期工资发放 ¥4,900', status: 'success' },
    ],
  },
  {
    id: 2,
    contract_no: 'HT2026060002',
    project_name: 'CBD办公楼装修项目',
    worker_name: '李强',
    sign_date: '2026-06-05',
    total_amount: 31500,
    paid_amount: 12600,
    status: 'active',
    skill: '木工',
    daily_wage: 350,
    start_date: '2026-06-05',
    end_date: '2026-07-15',
    enterprise_sign: '北京建工装饰有限公司（公章）',
    worker_sign: '李强（签名）',
    wage_details: [
      { date: '2026-06-05 ~ 2026-06-20', days: 14, amount: 4900 },
      { date: '2026-06-21 ~ 2026-07-05', days: 14, amount: 4900 },
    ],
    performance_records: [
      { date: '2026-06-05', event: '合同签订生效', status: 'success' },
      { date: '2026-06-05', event: '工人到岗开始工作', status: 'success' },
      { date: '2026-06-20', event: '第一期工资发放 ¥4,900', status: 'success' },
    ],
  },
  {
    id: 3,
    contract_no: 'HT2026050008',
    project_name: '商业街改造一期工程',
    worker_name: '王强',
    sign_date: '2026-05-01',
    total_amount: 58800,
    paid_amount: 58800,
    status: 'completed',
    skill: '瓦工',
    daily_wage: 420,
    start_date: '2026-05-01',
    end_date: '2026-06-15',
    enterprise_sign: '北京建工装饰有限公司（公章）',
    worker_sign: '王强（签名）',
    wage_details: [
      { date: '2026-05-01 ~ 2026-05-15', days: 15, amount: 6300 },
      { date: '2026-05-16 ~ 2026-05-31', days: 16, amount: 6720 },
      { date: '2026-06-01 ~ 2026-06-15', days: 15, amount: 6300 },
    ],
    performance_records: [
      { date: '2026-05-01', event: '合同签订生效', status: 'success' },
      { date: '2026-05-15', event: '第一期工资发放 ¥6,300', status: 'success' },
      { date: '2026-05-31', event: '第二期工资发放 ¥6,720', status: 'success' },
      { date: '2026-06-15', event: '第三期工资发放 ¥6,300', status: 'success' },
      { date: '2026-06-16', event: '项目完工验收，合同履约完成', status: 'success' },
    ],
  },
  {
    id: 4,
    contract_no: 'HT2026040003',
    project_name: '住宅小区配套工程',
    worker_name: '赵六',
    sign_date: '2026-04-10',
    total_amount: 48000,
    paid_amount: 32000,
    status: 'breached',
    skill: '电工',
    daily_wage: 400,
    start_date: '2026-04-10',
    end_date: '2026-06-10',
    enterprise_sign: '北京建工装饰有限公司（公章）',
    worker_sign: '赵六（签名）',
    wage_details: [
      { date: '2026-04-10 ~ 2026-04-30', days: 20, amount: 8000 },
      { date: '2026-05-01 ~ 2026-05-31', days: 26, amount: 10400 },
    ],
    performance_records: [
      { date: '2026-04-10', event: '合同签订生效', status: 'success' },
      { date: '2026-04-30', event: '第一期工资发放 ¥8,000', status: 'success' },
      { date: '2026-05-28', event: '工人连续旷工3天', status: 'warning' },
      { date: '2026-06-01', event: '违约记录：工人擅自离岗', status: 'error' },
    ],
  },
]

function ContractManagement() {
  const [activeTab, setActiveTab] = useState('all')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentContract, setCurrentContract] = useState<ContractItem | null>(null)

  const filteredContracts = mockContracts.filter(
    (c) => activeTab === 'all' || c.status === activeTab
  )

  const openDetail = (contract: ContractItem) => {
    setCurrentContract(contract)
    setDetailModalOpen(true)
  }

  const columns: ColumnsType<ContractItem> = [
    {
      title: '合同编号',
      dataIndex: 'contract_no',
      key: 'no',
      width: 160,
      render: (text) => (
        <Space>
          <FileProtectOutlined style={{ color: '#1890ff' }} />
          <Text code>{text}</Text>
        </Space>
      ),
    },
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project',
      width: 220,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '工人',
      key: 'worker',
      width: 140,
      render: (_, record) => (
        <Space>
          <Avatar
            size={32}
            style={{ background: 'linear-gradient(135deg, #1890ff, #722ed1)' }}
            icon={<UserOutlined />}
          >
            {record.worker_name[0]}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text>{record.worker_name}</Text>
            <Tag color="geekblue" style={{ margin: 0, fontSize: 11 }}>
              {record.skill}
            </Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: '签订日期',
      dataIndex: 'sign_date',
      key: 'sign_date',
      width: 130,
      render: (text) => (
        <Space>
          <CalendarOutlined style={{ color: '#52c41a' }} />
          {text}
        </Space>
      ),
    },
    {
      title: '合同工期',
      key: 'period',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.start_date}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            至 {record.end_date}
          </Text>
        </Space>
      ),
    },
    {
      title: '合同金额',
      key: 'amount',
      width: 180,
      render: (_, record) => {
        const percent = Math.round((record.paid_amount / record.total_amount) * 100)
        return (
          <Space direction="vertical" size={4}>
            <Space>
              <DollarOutlined style={{ color: '#fa8c16' }} />
              <Text strong style={{ fontSize: 15, color: '#fa8c16' }}>
                ¥{record.total_amount.toLocaleString()}
              </Text>
            </Space>
            <div style={{ width: 140 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: '#666',
                  marginBottom: 4,
                }}
              >
                <span>已付 ¥{record.paid_amount.toLocaleString()}</span>
                <span>{percent}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 6,
                  background: '#f0f0f0',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #1890ff, #52c41a)',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          </Space>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag
          color={statusColorMap[status]}
          icon={
            status === 'active' ? (
              <ClockCircleOutlined />
            ) : status === 'completed' ? (
              <CheckCircleOutlined />
            ) : (
              <WarningOutlined />
            )
          }
          style={{ padding: '3px 12px', fontSize: 13 }}
        >
          {statusTextMap[status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetail(record)}
          >
            查看详情
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}>
            下载合同
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <FileProtectOutlined style={{ color: '#1890ff' }} />
            合同管理
          </Space>
        </Title>
        <Space>
          <Tag color="processing">
            <ClockCircleOutlined /> 执行中 {mockContracts.filter((c) => c.status === 'active').length}
          </Tag>
          <Tag color="success">
            <CheckCircleOutlined /> 已完成 {mockContracts.filter((c) => c.status === 'completed').length}
          </Tag>
          <Tag color="error">
            <WarningOutlined /> 违约 {mockContracts.filter((c) => c.status === 'breached').length}
          </Tag>
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 24px' }}
          items={[
            { key: 'all', label: '全部' },
            { key: 'active', label: <Space><ClockCircleOutlined />执行中</Space> },
            { key: 'completed', label: <Space><CheckCircleOutlined />已完成</Space> },
            { key: 'breached', label: <Space><WarningOutlined />违约</Space> },
          ]}
        />
        <Table<ContractItem>
          rowKey="id"
          columns={columns}
          dataSource={filteredContracts}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 份合同`,
          }}
          locale={{ emptyText: <Empty description="暂无合同数据" /> }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          currentContract ? (
            <Space>
              <FileTextOutlined style={{ color: '#1890ff' }} />
              合同详情 - {currentContract.contract_no}
              <Tag color={statusColorMap[currentContract.status]} style={{ marginLeft: 8 }}>
                {statusTextMap[currentContract.status]}
              </Tag>
            </Space>
          ) : null
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={900}
        footer={[
          <Button key="download" icon={<DownloadOutlined />}>
            下载合同
          </Button>,
          <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {currentContract && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
                  <Statistic
                    title="合同总金额"
                    value={currentContract.total_amount}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ background: '#e6f7ff', borderRadius: 8 }}>
                  <Statistic
                    title="已支付金额"
                    value={currentContract.paid_amount}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 8 }}>
                  <Statistic
                    title="待支付金额"
                    value={currentContract.total_amount - currentContract.paid_amount}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card bordered style={{ borderRadius: 8 }} title="合同基本信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="项目名称">
                  {currentContract.project_name}
                </Descriptions.Item>
                <Descriptions.Item label="工人工种">
                  <Tag color="geekblue">{currentContract.skill}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="工人姓名">
                  <Space>
                    <Avatar
                      size={24}
                      style={{ background: 'linear-gradient(135deg, #1890ff, #722ed1)' }}
                    >
                      {currentContract.worker_name[0]}
                    </Avatar>
                    {currentContract.worker_name}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="日薪">
                  <Text strong style={{ color: '#fa8c16' }}>
                    ¥{currentContract.daily_wage}/天
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="合同工期">
                  {currentContract.start_date} 至 {currentContract.end_date}
                </Descriptions.Item>
                <Descriptions.Item label="签订日期">
                  {currentContract.sign_date}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              bordered
              style={{ borderRadius: 8 }}
              title={
                <Space>
                  <DollarOutlined style={{ color: '#fa8c16' }} />
                  工资明细
                </Space>
              }
            >
              <Table
                rowKey="date"
                size="small"
                dataSource={currentContract.wage_details}
                pagination={false}
                columns={[
                  { title: '结算周期', dataIndex: 'date', key: 'date' },
                  { title: '出勤天数', dataIndex: 'days', key: 'days', width: 120, align: 'center' },
                  {
                    title: '工资金额',
                    dataIndex: 'amount',
                    key: 'amount',
                    width: 150,
                    align: 'right',
                    render: (v) => <Text strong style={{ color: '#fa8c16' }}>¥{v.toLocaleString()}</Text>,
                  },
                ]}
              />
            </Card>

            <Card
              bordered
              style={{ borderRadius: 8 }}
              title={
                <Space>
                  <UserOutlined style={{ color: '#722ed1' }} />
                  双方签名信息
                </Space>
              }
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Card type="inner" title="企业方（甲方）" size="small">
                    <Text>{currentContract.enterprise_sign}</Text>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      签订日期：{currentContract.sign_date}
                    </Text>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card type="inner" title="工人方（乙方）" size="small">
                    <Text>{currentContract.worker_sign}</Text>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      签订日期：{currentContract.sign_date}
                    </Text>
                  </Card>
                </Col>
              </Row>
            </Card>

            <Card
              bordered
              style={{ borderRadius: 8 }}
              title={
                <Space>
                  <Timeline style={{ margin: 0 }} />
                  履约记录
                </Space>
              }
            >
              <Timeline
                mode="left"
                items={currentContract.performance_records.map((r, idx) => ({
                  color:
                    r.status === 'success'
                      ? 'green'
                      : r.status === 'warning'
                      ? 'gold'
                      : 'red',
                  dot:
                    r.status === 'success' ? (
                      <CheckCircleOutlined />
                    ) : r.status === 'warning' ? (
                      <WarningOutlined />
                    ) : (
                      <WarningOutlined />
                    ),
                  label: dayjs(r.date).format('YYYY-MM-DD'),
                  children: <Text>{r.event}</Text>,
                }))}
              />
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default ContractManagement
