import { useEffect, useState } from 'react'
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
  InputNumber,
  Form,
  Select,
  message,
  Empty,
  Progress,
  Descriptions,
  List,
  Avatar,
} from 'antd'
import {
  SafetyCertificateOutlined,
  PlusOutlined,
  EyeOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import wageApi, { type GuaranteeStatistics } from '../../api/wage'
import type { WageGuarantee, WageGuaranteeStatus } from '../../types'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface GuaranteeItem extends WageGuarantee {
  project_name: string
  workers_needed: number
  daily_wage: number
  release_detail: Array<{
    id: number
    worker_name: string
    amount: number
    release_date: string
    status: string
  }>
}

const statusColorMap: Record<WageGuaranteeStatus, string> = {
  locked: 'processing',
  partial_released: 'warning',
  fully_released: 'success',
  refunded: 'default',
}

const statusTextMap: Record<WageGuaranteeStatus, string> = {
  locked: '锁定中',
  partial_released: '部分释放',
  fully_released: '已全部释放',
  refunded: '已退回',
}

const mockGuarantees: GuaranteeItem[] = [
  {
    id: 1,
    job_post_id: 1,
    enterprise_id: 1,
    guarantee_no: 'BZJ2026060001',
    deposit_amount: 52500,
    paid_amount: 52500,
    payment_method: 'bank_transfer',
    payment_order_no: 'BK202606000001',
    payment_time: '2026-06-01 10:30:00',
    release_status: 'partial_released',
    total_released: 21000,
    escrow_account: '中国建设银行监管账户 ****8821',
    created_at: '2026-06-01 10:30:00',
    updated_at: '2026-06-20 09:00:00',
    project_name: 'CBD办公楼装修项目',
    workers_needed: 5,
    daily_wage: 350,
    release_detail: [
      { id: 1, worker_name: '张伟', amount: 5250, release_date: '2026-06-15', status: '已释放' },
      { id: 2, worker_name: '李强', amount: 4900, release_date: '2026-06-15', status: '已释放' },
      { id: 3, worker_name: '王二', amount: 5250, release_date: '2026-06-30', status: '待释放' },
      { id: 4, worker_name: '赵六', amount: 4900, release_date: '2026-06-30', status: '待释放' },
      { id: 5, worker_name: '孙七', amount: 5250, release_date: '2026-07-15', status: 'T+1冻结' },
    ],
  },
  {
    id: 2,
    job_post_id: 2,
    enterprise_id: 1,
    guarantee_no: 'BZJ2026060002',
    deposit_amount: 100800,
    paid_amount: 100800,
    payment_method: 'bank_transfer',
    payment_order_no: 'BK202606000002',
    payment_time: '2026-05-20 14:20:00',
    release_status: 'locked',
    total_released: 0,
    escrow_account: '中国建设银行监管账户 ****8821',
    created_at: '2026-05-20 14:20:00',
    updated_at: '2026-06-18 16:00:00',
    project_name: '商业步行街改造项目',
    workers_needed: 8,
    daily_wage: 420,
    release_detail: [
      { id: 1, worker_name: '王强', amount: 6300, release_date: '2026-06-25', status: 'T+1冻结' },
      { id: 2, worker_name: '刘工', amount: 6300, release_date: '2026-06-25', status: 'T+1冻结' },
    ],
  },
  {
    id: 3,
    job_post_id: 3,
    enterprise_id: 1,
    guarantee_no: 'BZJ2026050008',
    deposit_amount: 29400,
    paid_amount: 29400,
    payment_method: 'alipay',
    payment_order_no: 'AP202605000008',
    payment_time: '2026-05-01 09:15:00',
    release_status: 'fully_released',
    total_released: 29400,
    escrow_account: '中国建设银行监管账户 ****8821',
    created_at: '2026-05-01 09:15:00',
    updated_at: '2026-06-16 12:00:00',
    project_name: '商业街改造一期工程',
    workers_needed: 2,
    daily_wage: 420,
    release_detail: [
      { id: 1, worker_name: '王强', amount: 6300, release_date: '2026-05-15', status: '已释放' },
      { id: 2, worker_name: '王强', amount: 6720, release_date: '2026-05-31', status: '已释放' },
      { id: 3, worker_name: '王强', amount: 6300, release_date: '2026-06-15', status: '已释放' },
      { id: 4, worker_name: '孙七', amount: 10080, release_date: '2026-06-16', status: '已释放' },
    ],
  },
]

function Guarantee() {
  const [statistics, setStatistics] = useState<GuaranteeStatistics | null>(null)
  const [list, setList] = useState<GuaranteeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentGuarantee, setCurrentGuarantee] = useState<GuaranteeItem | null>(null)
  const [rechargeForm] = Form.useForm()
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statRes, listRes] = await Promise.all([
        wageApi.getGuaranteeStatistics(),
        wageApi.getGuarantees(),
      ])
      if (statRes.code === 0 && statRes.data) {
        setStatistics(statRes.data)
      }
      if (listRes.code === 0 && listRes.data) {
      }
    } catch {
      setStatistics({
        total_deposited: 182700,
        current_locked: 132300,
        total_released: 50400,
        frozen: 0,
      })
      setList(mockGuarantees)
    } finally {
      setLoading(false)
    }
  }

  const handleRecharge = async () => {
    try {
      const values = await rechargeForm.validateFields()
      setSubmitLoading(true)
      const res = await wageApi.createGuarantee({
        job_post_id: values.job_post_id,
        deposit_amount: values.amount,
        payment_method: values.payment_method,
      })
      if (res.code === 0) {
        message.success('保证金充值成功')
        setRechargeModalOpen(false)
        rechargeForm.resetFields()
        loadData()
      }
    } catch {
      message.success('保证金充值成功（模拟）')
      setRechargeModalOpen(false)
      rechargeForm.resetFields()
    } finally {
      setSubmitLoading(false)
    }
  }

  const openDetail = (item: GuaranteeItem) => {
    setCurrentGuarantee(item)
    setDetailModalOpen(true)
  }

  const columns: ColumnsType<GuaranteeItem> = [
    {
      title: '保证金编号',
      dataIndex: 'guarantee_no',
      key: 'no',
      width: 160,
      render: (text) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#fa8c16' }} />
          <Text code style={{ fontSize: 13 }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: '关联项目',
      dataIndex: 'project_name',
      key: 'project',
      width: 220,
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.workers_needed}人 × ¥{record.daily_wage}/天
          </Text>
        </Space>
      ),
    },
    {
      title: '存入金额',
      dataIndex: 'deposit_amount',
      key: 'deposit',
      width: 140,
      align: 'right',
      render: (v) => (
        <Space>
          <DollarOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ color: '#1890ff', fontSize: 15 }}>
            ¥{v.toLocaleString()}
          </Text>
        </Space>
      ),
    },
    {
      title: '已释放',
      dataIndex: 'total_released',
      key: 'released',
      width: 140,
      align: 'right',
      render: (v, record) => (
        <Space direction="vertical" size={2} align="end">
          <Text strong style={{ color: '#52c41a' }}>
            ¥{v.toLocaleString()}
          </Text>
          <Progress
            percent={Math.round((v / record.deposit_amount) * 100)}
            size={[100, 6]}
            showInfo={false}
            strokeColor="#52c41a"
          />
        </Space>
      ),
    },
    {
      title: '当前锁定',
      key: 'locked',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <Space>
          <LockOutlined style={{ color: '#faad14' }} />
          <Text strong style={{ color: '#faad14' }}>
            ¥{(record.deposit_amount - record.total_released).toLocaleString()}
          </Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'release_status',
      key: 'status',
      width: 120,
      render: (status: WageGuaranteeStatus) => (
        <Tag
          color={statusColorMap[status]}
          icon={
            status === 'fully_released' ? (
              <CheckCircleOutlined />
            ) : status === 'locked' ? (
              <LockOutlined />
            ) : (
              <UnlockOutlined />
            )
          }
          style={{ padding: '3px 12px', fontSize: 13 }}
        >
          {statusTextMap[status]}
        </Tag>
      ),
    },
    {
      title: '存入日期',
      dataIndex: 'created_at',
      key: 'date',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record)}
        >
          释放明细
        </Button>
      ),
    },
  ]

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
            <SafetyCertificateOutlined style={{ color: '#fa8c16' }} />
            保证金管理
          </Space>
        </Title>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => {
            rechargeForm.resetFields()
            setRechargeModalOpen(true)
          }}
          style={{
            background: 'linear-gradient(135deg, #fa8c16, #d46b08)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(250,140,22,0.3)',
          }}
        >
          保证金充值
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
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
                    icon={<BankOutlined />}
                  />
                  <span style={{ fontSize: 14 }}>累计存入</span>
                </Space>
              }
              value={statistics?.total_deposited ?? 0}
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
                    icon={<LockOutlined />}
                  />
                  <span style={{ fontSize: 14 }}>当前锁定</span>
                </Space>
              }
              value={statistics?.current_locked ?? 0}
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
                    icon={<UnlockOutlined />}
                  />
                  <span style={{ fontSize: 14 }}>已释放</span>
                </Space>
              }
              value={statistics?.total_released ?? 0}
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
              background: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
            }}
          >
            <Statistic
              title={
                <Space>
                  <Avatar
                    size={40}
                    style={{
                      background: 'linear-gradient(135deg, #ff4d4f, #cf1322)',
                      verticalAlign: 'middle',
                    }}
                    icon={<ExclamationCircleOutlined />}
                  />
                  <span style={{ fontSize: 14 }}>冻结</span>
                </Space>
              }
              value={statistics?.frozen ?? 0}
              precision={2}
              prefix="¥"
              style={{ marginTop: 12 }}
              valueStyle={{ color: '#a8071a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table<GuaranteeItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条保证金记录`,
          }}
          locale={{ emptyText: <Empty description="暂无保证金记录" /> }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#fa8c16' }} />
            新增保证金充值
          </Space>
        }
        open={rechargeModalOpen}
        onOk={handleRecharge}
        onCancel={() => {
          setRechargeModalOpen(false)
          rechargeForm.resetFields()
        }}
        confirmLoading={submitLoading}
        width={560}
        okText="确认充值"
        cancelText="取消"
      >
        <Form form={rechargeForm} layout="vertical">
          <Form.Item
            name="job_post_id"
            label="关联项目"
            rules={[{ required: true, message: '请选择关联项目' }]}
          >
            <Select
              size="large"
              placeholder="请选择要充值的项目"
              options={[
                { value: 1, label: 'CBD办公楼装修项目（木工5人）' },
                { value: 2, label: '商业步行街改造项目（瓦工8人）' },
                { value: 4, label: '住宅小区配套工程（电工4人）' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="充值金额"
            rules={[{ required: true, message: '请输入充值金额' }]}
          >
            <InputNumber
              size="large"
              min={1000}
              step={1000}
              placeholder="请输入金额"
              style={{ width: '100%' }}
              addonBefore="¥"
              addonAfter="元"
            />
          </Form.Item>
          <Form.Item
            name="payment_method"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式' }]}
            initialValue="bank_transfer"
          >
            <Select
              size="large"
              options={[
                { value: 'bank_transfer', label: '银企直连转账（推荐）' },
                { value: 'alipay', label: '企业支付宝' },
                { value: 'wechat', label: '企业微信支付' },
              ]}
            />
          </Form.Item>
          <Card
            bordered
            style={{
              background: '#fff7e6',
              borderColor: '#ffd591',
              borderRadius: 8,
            }}
          >
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ExclamationCircleOutlined /> 充值说明
              </Text>
              <Text style={{ fontSize: 13 }}>
                保证金将存入平台监管账户，项目完工后T+1日自动释放至工人账户。
                未使用的保证金可随时申请退回。
              </Text>
            </Space>
          </Card>
        </Form>
      </Modal>

      <Modal
        title={
          currentGuarantee ? (
            <Space>
              <EyeOutlined style={{ color: '#1890ff' }} />
              保证金释放明细 - {currentGuarantee.guarantee_no}
              <Tag
                color={statusColorMap[currentGuarantee.release_status]}
                style={{ marginLeft: 8 }}
              >
                {statusTextMap[currentGuarantee.release_status]}
              </Tag>
            </Space>
          ) : null
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={780}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {currentGuarantee && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card bordered style={{ borderRadius: 8 }} size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="关联项目">
                  {currentGuarantee.project_name}
                </Descriptions.Item>
                <Descriptions.Item label="存入金额">
                  <Text strong style={{ color: '#1890ff' }}>
                    ¥{currentGuarantee.deposit_amount.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="已释放金额">
                  <Text strong style={{ color: '#52c41a' }}>
                    ¥{currentGuarantee.total_released.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="锁定金额">
                  <Text strong style={{ color: '#faad14' }}>
                    ¥
                    {(
                      currentGuarantee.deposit_amount - currentGuarantee.total_released
                    ).toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="监管账户">
                  {currentGuarantee.escrow_account}
                </Descriptions.Item>
                <Descriptions.Item label="存入时间">
                  {dayjs(currentGuarantee.created_at).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              bordered
              style={{ borderRadius: 8 }}
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                  释放记录明细
                </Space>
              }
              size="small"
            >
              <List
                dataSource={currentGuarantee.release_detail}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Tag
                        key="status"
                        color={
                          item.status === '已释放'
                            ? 'success'
                            : item.status === '待释放'
                            ? 'warning'
                            : 'processing'
                        }
                      >
                        {item.status}
                      </Tag>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={36}
                          style={{
                            background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                          }}
                          icon={<UserOutlined />}
                        >
                          {item.worker_name[0]}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong>{item.worker_name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            预计释放：{item.release_date}
                          </Text>
                        </Space>
                      }
                      description={
                        <Text strong style={{ color: '#52c41a', fontSize: 15 }}>
                          ¥{item.amount.toLocaleString()}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default Guarantee
