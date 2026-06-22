import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Form,
  Select,
  Input,
  Modal,
  message,
  Statistic,
  Avatar,
  Drawer,
  Descriptions,
  Tooltip,
  Badge,
  Progress,
  Divider,
  Tabs,
  Alert,
  List,
  Popconfirm,
} from 'antd'
import {
  AuditOutlined,
  FileProtectOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  BankOutlined,
  DollarOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
  HomeOutlined,
  FileDoneOutlined,
  UserOutlined,
  PayCircleOutlined,
  FlagFilled,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { PaginationResult, JobPost } from '../../types'
import type { JobAuditItem, ContractItem } from '../../api/admin'
import adminApi from '../../api/admin'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

const jobAuditStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已驳回' },
}

const depositStatusMap: Record<string, { color: string; text: string }> = {
  unpaid: { color: 'red', text: '未支付' },
  paid: { color: 'green', text: '已支付' },
  partial: { color: 'orange', text: '部分支付' },
}

const jobStatusMap: Record<string, { color: string; text: string }> = {
  open: { color: 'blue', text: '招聘中' },
  in_progress: { color: 'processing', text: '进行中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'default', text: '已取消' },
}

function JobAudit() {
  const [activeTab, setActiveTab] = useState<string>('audit')
  const [auditLoading, setAuditLoading] = useState(false)
  const [contractLoading, setContractLoading] = useState(false)
  const [auditList, setAuditList] = useState<PaginationResult<JobAuditItem> | null>(null)
  const [contractList, setContractList] = useState<PaginationResult<ContractItem> | null>(null)
  const [auditPagination, setAuditPagination] = useState({ page: 1, pageSize: 10 })
  const [contractPagination, setContractPagination] = useState({ page: 1, pageSize: 10 })
  const [auditFilterForm] = Form.useForm()
  const [contractFilterForm] = Form.useForm()
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false)
  const [currentAudit, setCurrentAudit] = useState<JobAuditItem | null>(null)
  const [contractDrawerOpen, setContractDrawerOpen] = useState(false)
  const [currentContract, setCurrentContract] = useState<ContractItem | null>(null)
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [auditForm] = Form.useForm()
  const [auditLoadingState, setAuditLoadingState] = useState(false)
  const [markAbnormalOpen, setMarkAbnormalOpen] = useState(false)
  const [abnormalForm] = Form.useForm()
  const [abnormalLoading, setAbnormalLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'audit') {
      void loadAuditList()
    } else {
      void loadContractList()
    }
  }, [activeTab, auditPagination, contractPagination])

  const loadAuditList = async () => {
    setAuditLoading(true)
    try {
      const values = auditFilterForm.getFieldsValue()
      const res = await adminApi.getJobAudits({
        page: auditPagination.page,
        pageSize: auditPagination.pageSize,
        keyword: values.keyword,
        audit_status: values.audit_status,
        deposit_status: values.deposit_status,
      })
      if (res.code === 0 && res.data) {
        setAuditList(res.data)
      }
    } finally {
      setAuditLoading(false)
    }
  }

  const loadContractList = async () => {
    setContractLoading(true)
    try {
      const values = contractFilterForm.getFieldsValue()
      const res = await adminApi.getContracts({
        page: contractPagination.page,
        pageSize: contractPagination.pageSize,
        keyword: values.keyword,
        status: values.status,
        has_anomaly: values.has_anomaly,
      })
      if (res.code === 0 && res.data) {
        setContractList(res.data)
      }
    } finally {
      setContractLoading(false)
    }
  }

  const openAuditDetail = (record: JobAuditItem) => {
    setCurrentAudit(record)
    setAuditDrawerOpen(true)
  }

  const openContractDetail = (record: ContractItem) => {
    setCurrentContract(record)
    setContractDrawerOpen(true)
  }

  const openAuditModal = (record: JobAuditItem) => {
    setCurrentAudit(record)
    auditForm.resetFields()
    setAuditModalOpen(true)
  }

  const submitAudit = async (approved: boolean) => {
    if (!currentAudit) return
    try {
      let values: { reject_reason?: string } = {}
      if (!approved) {
        values = await auditForm.validateFields()
      }
      setAuditLoadingState(true)
      const res = await adminApi.auditJobPost(currentAudit.id, approved, values.reject_reason)
      if (res.code === 0) {
        message.success(approved ? '审核通过' : '已驳回')
        setAuditModalOpen(false)
        await loadAuditList()
      } else {
        message.error(res.message || '操作失败')
      }
    } catch {
    } finally {
      setAuditLoadingState(false)
    }
  }

  const openMarkAbnormal = (record: ContractItem) => {
    setCurrentContract(record)
    abnormalForm.resetFields()
    setMarkAbnormalOpen(true)
  }

  const submitMarkAbnormal = async () => {
    if (!currentContract) return
    try {
      const values = await abnormalForm.validateFields()
      setAbnormalLoading(true)
      const res = await adminApi.markContractAbnormal(currentContract.id, values.reason)
      if (res.code === 0) {
        message.success('已标记异常')
        setMarkAbnormalOpen(false)
        await loadContractList()
      }
    } catch {
    } finally {
      setAbnormalLoading(false)
    }
  }

  const auditStats = {
    pending: auditList?.list.filter((i) => i.audit_status === 'pending').length ?? 0,
    deposit_unpaid: auditList?.list.filter((i) => i.deposit_status === 'unpaid').length ?? 0,
    total: auditList?.total ?? 0,
  }

  const contractStats = {
    total: contractList?.total ?? 0,
    abnormal: contractList?.list.filter((i) => i.is_abnormal).length ?? 0,
    in_progress: contractList?.list.filter((i) => i.status === 'in_progress').length ?? 0,
  }

  const auditPieOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    color: ['#faad14', '#52c41a', '#f5222d'],
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['70%', '50%'],
        label: { formatter: '{b}\n{d}%' },
        data: [
          { name: '待审核', value: 45 },
          { name: '已通过', value: 128 },
          { name: '已驳回', value: 12 },
        ],
      },
    ],
  }

  const auditColumns: ColumnsType<JobAuditItem> = [
    {
      title: '需求ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (val: number) => <Text code>JB{String(val).padStart(6, '0')}</Text>,
    },
    {
      title: '项目标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (val: string, record) => (
        <Space direction="vertical" size={0}>
          <Tooltip title={val}>
            <Text strong>{val}</Text>
          </Tooltip>
          <Space size={4} style={{ fontSize: 11 }}>
            <Tag color="blue" style={{ margin: 0 }} icon={<ThunderboltOutlined />}>
              {record.skill_required}
            </Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: '企业',
      dataIndex: 'enterprise_name',
      key: 'enterprise_name',
      width: 160,
      ellipsis: true,
      render: (val: string, record) => (
        <Space direction="vertical" size={0}>
          <Tooltip title={val}>
            <Space>
              <Avatar size={24} style={{ backgroundColor: '#1890ff', borderRadius: 4 }} icon={<ApartmentOutlined />} />
              <span>{val}</span>
            </Space>
          </Tooltip>
          <Tooltip title={`信用评分 ${record.enterprise_credit}`}>
            <Badge
              count={`★${record.enterprise_credit}`}
              showZero
              style={{
                backgroundColor: record.enterprise_credit >= 800 ? '#52c41a' : record.enterprise_credit >= 600 ? '#faad14' : '#f5222d',
                fontWeight: 'normal',
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '工人数',
      dataIndex: 'workers_needed',
      key: 'workers_needed',
      width: 110,
      align: 'center',
      render: (val: number, record) => (
        <div>
          <Text strong>{record.hired_count}/{val}</Text>
          <div>
            <Progress
              percent={val > 0 ? Math.round((record.hired_count / val) * 100) : 0}
              showInfo={false}
              size="small"
              strokeColor="#faad14"
            />
          </div>
        </div>
      ),
    },
    {
      title: '日薪',
      dataIndex: 'daily_wage',
      key: 'daily_wage',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.daily_wage - b.daily_wage,
      render: (val: number) => (
        <Text strong style={{ color: '#fa8c16' }}>¥{val}</Text>
      ),
    },
    {
      title: '保证金',
      dataIndex: 'wage_deposit_amount',
      key: 'wage_deposit_amount',
      width: 140,
      align: 'right',
      render: (val: number, record) => (
        <Space direction="vertical" size={0} align="end">
          <Text strong>¥{val.toLocaleString()}</Text>
          <Tag
            color={depositStatusMap[record.deposit_status].color}
            icon={record.deposit_status === 'paid' ? <PayCircleOutlined /> : <ExclamationCircleOutlined />}
          >
            {depositStatusMap[record.deposit_status].text}
          </Tag>
        </Space>
      ),
    },
    {
      title: '审核状态',
      dataIndex: 'audit_status',
      key: 'audit_status',
      width: 100,
      render: (val: string) => {
        const s = jobAuditStatusMap[val] || { color: 'default', text: val }
        return (
          <Tag
            color={s.color}
            icon={val === 'pending' ? <ClockCircleOutlined /> : val === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          >
            {s.text}
          </Tag>
        )
      },
    },
    {
      title: '申请人数',
      dataIndex: 'application_count',
      key: 'application_count',
      width: 90,
      align: 'center',
      render: (val: number) => (
        <Tag icon={<TeamOutlined />} color="geekblue">{val}人</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openAuditDetail(record)}>详情</Button>
          {record.audit_status === 'pending' ? (
            <Button
              type="link"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => openAuditModal(record)}
            >
              审核
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  const contractColumns: ColumnsType<ContractItem> = [
    {
      title: '合同ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (val: number) => <Text code>CT{String(val).padStart(6, '0')}</Text>,
    },
    {
      title: '项目名称',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (val: string, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Tooltip title={val}>
              <Text strong>{val}</Text>
            </Tooltip>
            {record.is_abnormal && (
              <Tooltip title={record.abnormal_reason || '标记为异常'}>
                <Tag color="red" icon={<WarningOutlined />}>异常</Tag>
              </Tooltip>
            )}
          </Space>
          <Space size={4} style={{ fontSize: 11 }}>
            <Tag color="blue" style={{ margin: 0 }}>{record.skill_required}</Tag>
            <Text type="secondary">
              <EnvironmentOutlined /> {record.work_location}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '企业',
      dataIndex: 'enterprise_name',
      key: 'enterprise_name',
      width: 140,
      ellipsis: true,
      render: (val: string) => (
        <Tooltip title={val}>
          <Space>
            <Avatar size={24} style={{ backgroundColor: '#1890ff', borderRadius: 4 }} icon={<ApartmentOutlined />} />
            <span>{val}</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '雇佣进度',
      key: 'hire_progress',
      width: 120,
      render: (_, record) => (
        <div>
          <Text strong>{record.hired_count}/{record.workers_needed}</Text>
          <Progress
            percent={record.workers_needed > 0 ? Math.round((record.hired_count / record.workers_needed) * 100) : 0}
            showInfo={false}
            size="small"
            strokeColor="#1890ff"
          />
        </div>
      ),
    },
    {
      title: '合同履约率',
      dataIndex: 'performance_rate',
      key: 'performance_rate',
      width: 120,
      sorter: (a, b) => a.performance_rate - b.performance_rate,
      render: (val: number) => (
        <Space direction="vertical" size={0}>
          <Progress
            percent={val}
            size="small"
            strokeColor={val >= 90 ? '#52c41a' : val >= 70 ? '#faad14' : '#f5222d'}
          />
        </Space>
      ),
    },
    {
      title: '履约状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => {
        const s = jobStatusMap[val] || { color: 'default', text: val }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '开始~结束',
      key: 'date_range',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
          <span>
            <CalendarOutlined style={{ color: '#52c41a' }} /> {dayjs(record.start_date).format('YYYY-MM-DD')}
          </span>
          <span>
            <CalendarOutlined style={{ color: '#f5222d' }} /> {dayjs(record.end_date).format('YYYY-MM-DD')}
          </span>
        </Space>
      ),
    },
    {
      title: '保证金',
      dataIndex: 'wage_deposit_amount',
      key: 'wage_deposit_amount',
      width: 110,
      align: 'right',
      render: (val: number, record) => (
        <Space direction="vertical" size={0} align="end">
          <Text strong>¥{val.toLocaleString()}</Text>
          {record.deposit_paid ? (
            <Tag color="green" icon={<PayCircleOutlined />}>已交</Tag>
          ) : (
            <Tag color="red" icon={<ExclamationCircleOutlined />}>未交</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openContractDetail(record)}>详情</Button>
          {!record.is_abnormal ? (
            <Button
              type="link"
              size="small"
              danger
              icon={<FlagOutlined />}
              onClick={() => openMarkAbnormal(record)}
            >
              标记异常
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #faad14' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <ClockCircleOutlined style={{ color: '#faad14' }} />
                  <Text type="secondary">待审核需求</Text>
                </Space>
              }
              value={auditStats.pending}
              suffix="个"
              valueStyle={{ color: '#faad14', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #f5222d' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                  <Text type="secondary">未交保证金</Text>
                </Space>
              }
              value={auditStats.deposit_unpaid}
              suffix="个"
              valueStyle={{ color: '#f5222d', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #1890ff' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <FileProtectOutlined style={{ color: '#1890ff' }} />
                  <Text type="secondary">进行中合同</Text>
                </Space>
              }
              value={contractStats.in_progress}
              suffix="份"
              valueStyle={{ color: '#1890ff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #f5222d' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <WarningOutlined style={{ color: '#f5222d' }} />
                  <Text type="secondary">异常合同</Text>
                </Space>
              }
              value={contractStats.abnormal}
              suffix="份"
              valueStyle={{ color: '#f5222d', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 8 }}
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ padding: '0 24px' }}
          items={[
            {
              key: 'audit',
              label: (
                <Space>
                  <AuditOutlined style={{ color: '#faad14' }} />
                  用工审核
                  <Badge count={auditStats.pending} showZero style={{ backgroundColor: '#faad14' }} />
                </Space>
              ),
            },
            {
              key: 'contracts',
              label: (
                <Space>
                  <FileProtectOutlined style={{ color: '#1890ff' }} />
                  合同管理
                  {contractStats.abnormal > 0 && (
                    <Badge count={contractStats.abnormal} />
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {activeTab === 'audit' ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={18}>
              <Card style={{ borderRadius: 8 }} styles={{ body: { paddingBottom: 0 } }}>
                <Form
                  form={auditFilterForm}
                  layout="inline"
                  onFinish={() => {
                    setAuditPagination({ ...auditPagination, page: 1 })
                    void loadAuditList()
                  }}
                  style={{ rowGap: 12, marginBottom: 16 }}
                >
                  <Form.Item name="keyword">
                    <Input
                      prefix={<SearchOutlined />}
                      placeholder="项目/企业名称"
                      style={{ width: 200 }}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item name="audit_status" label="审核状态">
                    <Select allowClear placeholder="全部" style={{ width: 130 }}>
                      {Object.entries(jobAuditStatusMap).map(([val, s]) => (
                        <Option key={val} value={val}>{s.text}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="deposit_status" label="保证金">
                    <Select allowClear placeholder="全部" style={{ width: 130 }}>
                      {Object.entries(depositStatusMap).map(([val, s]) => (
                        <Option key={val} value={val}>{s.text}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">筛选</Button>
                      <Button onClick={() => { auditFilterForm.resetFields(); void loadAuditList() }}>重置</Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card title={<Title level={5} style={{ margin: 0 }}>审核状态分布</Title>} style={{ borderRadius: 8 }}>
                <ReactECharts option={auditPieOption} style={{ height: 140 }} />
              </Card>
            </Col>
          </Row>

          <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
            <Table<JobAuditItem>
              rowKey="id"
              size="middle"
              loading={auditLoading}
              columns={auditColumns}
              dataSource={auditList?.list ?? []}
              scroll={{ x: 1400 }}
              pagination={{
                current: auditList?.page ?? auditPagination.page,
                pageSize: auditList?.pageSize ?? auditPagination.pageSize,
                total: auditList?.total ?? 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条需求`,
                onChange: (page, pageSize) => setAuditPagination({ page, pageSize }),
              }}
            />
          </Card>
        </>
      ) : (
        <>
          <Card style={{ borderRadius: 8 }} styles={{ body: { paddingBottom: 0 } }}>
            <Form
              form={contractFilterForm}
              layout="inline"
              onFinish={() => {
                setContractPagination({ ...contractPagination, page: 1 })
                void loadContractList()
              }}
              style={{ rowGap: 12, marginBottom: 16 }}
            >
              <Form.Item name="keyword">
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="项目/企业名称"
                  style={{ width: 200 }}
                  allowClear
                />
              </Form.Item>
              <Form.Item name="status" label="合同状态">
                <Select allowClear placeholder="全部" style={{ width: 130 }}>
                  {Object.entries(jobStatusMap).map(([val, s]) => (
                    <Option key={val} value={val}>{s.text}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="has_anomaly" label="异常标记">
                <Select allowClear placeholder="全部" style={{ width: 130 }}>
                  <Option value={true}>仅异常</Option>
                  <Option value={false}>仅正常</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">筛选</Button>
                  <Button onClick={() => { contractFilterForm.resetFields(); void loadContractList() }}>重置</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
            <Table<ContractItem>
              rowKey="id"
              size="middle"
              loading={contractLoading}
              columns={contractColumns}
              dataSource={contractList?.list ?? []}
              scroll={{ x: 1400 }}
              pagination={{
                current: contractList?.page ?? contractPagination.page,
                pageSize: contractList?.pageSize ?? contractPagination.pageSize,
                total: contractList?.total ?? 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 份合同`,
                onChange: (page, pageSize) => setContractPagination({ page, pageSize }),
              }}
            />
          </Card>
        </>
      )}

      <Drawer
        title={
          currentAudit ? (
            <Space>
              <AuditOutlined style={{ color: '#faad14', fontSize: 24 }} />
              <div>
                <Text strong style={{ fontSize: 16 }}>用工需求详情</Text>
                <div>
                  <Tag color={jobAuditStatusMap[currentAudit.audit_status]?.color}>
                    {jobAuditStatusMap[currentAudit.audit_status]?.text}
                  </Tag>
                  <Text code>JB{String(currentAudit.id).padStart(6, '0')}</Text>
                </div>
              </div>
            </Space>
          ) : null
        }
        open={auditDrawerOpen}
        onClose={() => {
          setAuditDrawerOpen(false)
          setCurrentAudit(null)
        }}
        width={560}
        extra={
          currentAudit?.audit_status === 'pending' ? (
            <Button type="primary" icon={<AuditOutlined />} size="small" onClick={() => openAuditModal(currentAudit)}>
              立即审核
            </Button>
          ) : null
        }
      >
        {currentAudit && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {currentAudit.audit_status === 'pending' && currentAudit.deposit_status === 'unpaid' && (
              <Alert
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                message="企业未支付保证金"
                description="请确认是否在未收到保证金的情况下通过审核"
              />
            )}

            <Descriptions column={1} bordered size="small" title={<Space><FileProtectOutlined /> 需求信息</Space>}>
              <Descriptions.Item label="项目标题"><Text strong>{currentAudit.title}</Text></Descriptions.Item>
              <Descriptions.Item label="所需技能">{currentAudit.skill_required}</Descriptions.Item>
              <Descriptions.Item label="需求人数">{currentAudit.workers_needed} 人（已招 {currentAudit.hired_count} 人）</Descriptions.Item>
              <Descriptions.Item label="日薪标准">¥{currentAudit.daily_wage}/天</Descriptions.Item>
              <Descriptions.Item label="工期">
                {dayjs(currentAudit.start_date).format('YYYY-MM-DD')} ~ {dayjs(currentAudit.end_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="工作地点">
                <Space><EnvironmentOutlined />{currentAudit.work_location}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="工资保证金">
                <Space>
                  <Text strong style={{ color: '#fa8c16' }}>¥{currentAudit.wage_deposit_amount.toLocaleString()}</Text>
                  <Tag color={depositStatusMap[currentAudit.deposit_status].color}>
                    {depositStatusMap[currentAudit.deposit_status].text}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="福利待遇">
                <Space wrap>
                  {currentAudit.accommodation_provided === 1 && <Tag icon={<HomeOutlined />} color="green">提供住宿</Tag>}
                  {currentAudit.meals_provided === 1 && <Tag color="orange">包餐食</Tag>}
                  {currentAudit.insurance_provided === 1 && <Tag color="blue">购保险</Tag>}
                </Space>
              </Descriptions.Item>
              {currentAudit.description && (
                <Descriptions.Item label="项目描述">
                  <Paragraph style={{ margin: 0 }}>{currentAudit.description}</Paragraph>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Descriptions column={1} bordered size="small" title={<Space><BankOutlined /> 企业信息</Space>}>
              <Descriptions.Item label="企业名称">{currentAudit.enterprise_name}</Descriptions.Item>
              <Descriptions.Item label="信用评分">
                <Space>
                  <Text strong style={{
                    color: currentAudit.enterprise_credit >= 800 ? '#52c41a' : currentAudit.enterprise_credit >= 600 ? '#faad14' : '#f5222d',
                    fontSize: 16,
                  }}>
                    ★ {currentAudit.enterprise_credit}
                  </Text>
                  <Progress percent={currentAudit.enterprise_credit / 10} showInfo={false} size="small" />
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small" title={<Space><TeamOutlined /> 申请概况</Space>}>
              <Descriptions.Item label="申请人数">{currentAudit.application_count} 人</Descriptions.Item>
              <Descriptions.Item label="已录用人数">{currentAudit.hired_count} 人</Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small" title={<Space><CalendarOutlined /> 审核记录</Space>}>
              <Descriptions.Item label="创建时间">{dayjs(currentAudit.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              {currentAudit.audit_status !== 'pending' && (
                <Descriptions.Item label="审核状态">
                  <Tag color={jobAuditStatusMap[currentAudit.audit_status]?.color}>
                    {jobAuditStatusMap[currentAudit.audit_status]?.text}
                  </Tag>
                </Descriptions.Item>
              )}
              {currentAudit.reject_reason && (
                <Descriptions.Item label="驳回原因">{currentAudit.reject_reason}</Descriptions.Item>
              )}
            </Descriptions>
          </Space>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <AuditOutlined style={{ color: '#faad14', fontSize: 24 }} />
            <div>
              <Text strong style={{ fontSize: 16 }}>审核用工需求</Text>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>{currentAudit?.title}</div>
            </div>
          </Space>
        }
        open={auditModalOpen}
        onCancel={() => {
          setAuditModalOpen(false)
          setCurrentAudit(null)
        }}
        footer={
          <Space>
            <Button onClick={() => setAuditModalOpen(false)}>取消</Button>
            <Button danger onClick={() => void submitAudit(false)} loading={auditLoadingState} icon={<CloseCircleOutlined />}>
              驳回
            </Button>
            <Button type="primary" onClick={() => void submitAudit(true)} loading={auditLoadingState} icon={<CheckCircleOutlined />}>
              通过
            </Button>
          </Space>
        }
        width={520}
      >
        {currentAudit && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message="审核须知"
              description="请确认企业资质、工资保证金到账情况和项目信息的真实性"
            />

            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="企业" span={2}>{currentAudit.enterprise_name}</Descriptions.Item>
              <Descriptions.Item label="信用评分">★ {currentAudit.enterprise_credit}</Descriptions.Item>
              <Descriptions.Item label="保证金">
                <Tag color={depositStatusMap[currentAudit.deposit_status].color}>
                  {depositStatusMap[currentAudit.deposit_status].text}
                </Tag>
                ¥{currentAudit.wage_deposit_amount.toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '12px 0' }} />

            <Form form={auditForm} layout="vertical">
              <Form.Item
                name="reject_reason"
                label="驳回原因（仅驳回时必填）"
              >
                <TextArea rows={3} placeholder="如驳回，请填写驳回原因..." maxLength={500} showCount />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      <Drawer
        title={
          currentContract ? (
            <Space>
              <FileProtectOutlined style={{ color: '#1890ff', fontSize: 24 }} />
              <div>
                <Text strong style={{ fontSize: 16 }}>合同详情</Text>
                <div>
                  <Tag color={jobStatusMap[currentContract.status]?.color}>
                    {jobStatusMap[currentContract.status]?.text}
                  </Tag>
                  {currentContract.is_abnormal && (
                    <Tag color="red" icon={<WarningOutlined />}>已标记异常</Tag>
                  )}
                  <Text code>CT{String(currentContract.id).padStart(6, '0')}</Text>
                </div>
              </div>
            </Space>
          ) : null
        }
        open={contractDrawerOpen}
        onClose={() => {
          setContractDrawerOpen(false)
          setCurrentContract(null)
        }}
        width={560}
        extra={
          currentContract && !currentContract.is_abnormal ? (
            <Button danger size="small" icon={<FlagFilled />} onClick={() => openMarkAbnormal(currentContract)}>
              标记异常
            </Button>
          ) : null
        }
      >
        {currentContract && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {currentContract.is_abnormal && (
              <Alert
                type="error"
                showIcon
                icon={<WarningOutlined />}
                message="合同已标记为异常"
                description={currentContract.abnormal_reason || '暂无异常说明'}
              />
            )}

            <Descriptions column={1} bordered size="small" title={<Space><FileProtectOutlined /> 合同信息</Space>}>
              <Descriptions.Item label="项目名称"><Text strong>{currentContract.title}</Text></Descriptions.Item>
              <Descriptions.Item label="所属企业">{currentContract.enterprise_name}</Descriptions.Item>
              <Descriptions.Item label="合同状态">
                <Tag color={jobStatusMap[currentContract.status]?.color}>
                  {jobStatusMap[currentContract.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="履约率">
                <Progress
                  percent={currentContract.performance_rate}
                  strokeColor={currentContract.performance_rate >= 90 ? '#52c41a' : currentContract.performance_rate >= 70 ? '#faad14' : '#f5222d'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="工期">
                {dayjs(currentContract.start_date).format('YYYY-MM-DD')} 至 {dayjs(currentContract.end_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="工作地点">
                <Space><EnvironmentOutlined />{currentContract.work_location}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="所需工种">{currentContract.skill_required}</Descriptions.Item>
              <Descriptions.Item label="人员需求">
                {currentContract.hired_count} / {currentContract.workers_needed} 人
                <Progress
                  percent={currentContract.workers_needed > 0 ? Math.round((currentContract.hired_count / currentContract.workers_needed) * 100) : 0}
                  showInfo={false}
                  size="small"
                />
              </Descriptions.Item>
              <Descriptions.Item label="日薪标准">¥{currentContract.daily_wage}/天</Descriptions.Item>
              <Descriptions.Item label="工资保证金">
                <Space>
                  <Text strong>¥{currentContract.wage_deposit_amount.toLocaleString()}</Text>
                  {currentContract.deposit_paid ? (
                    <Tag color="green" icon={<PayCircleOutlined />}>已缴纳</Tag>
                  ) : (
                    <Tag color="red" icon={<ExclamationCircleOutlined />}>未缴纳</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="申请人数">{currentContract.application_count} 人</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#f5222d', fontSize: 24 }} />
            <div>
              <Text strong style={{ fontSize: 16 }}>标记合同异常</Text>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>{currentContract?.title}</div>
            </div>
          </Space>
        }
        open={markAbnormalOpen}
        onOk={submitMarkAbnormal}
        onCancel={() => {
          setMarkAbnormalOpen(false)
          setCurrentContract(null)
        }}
        confirmLoading={abnormalLoading}
        okText="确认标记"
        okType="danger"
        cancelText="取消"
        width={480}
      >
        <Alert
          type="warning"
          showIcon
          message="标记异常后将触发风控预警"
          description="请确保异常标记的准确性，标记后该合同将被重点监控"
          style={{ marginBottom: 16 }}
        />
        <Form form={abnormalForm} layout="vertical">
          <Form.Item
            name="reason"
            label="异常原因"
            rules={[{ required: true, message: '请填写异常原因' }]}
          >
            <TextArea rows={4} placeholder="请详细描述合同异常情况..." maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

export default JobAudit
