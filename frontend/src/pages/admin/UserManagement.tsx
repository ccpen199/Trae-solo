import { useEffect, useState } from 'react'
import {
  Card,
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
  Avatar,
  Drawer,
  Descriptions,
  Rate,
  Tabs,
  Tooltip,
  Badge,
  Progress,
  Divider,
  Image,
  Row,
  Col,
  Slider,
} from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  IdcardOutlined,
  PhoneOutlined,
  CrownOutlined,
  StarOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  FieldTimeOutlined,
  SafetyOutlined,
  AuditOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  ApartmentOutlined,
  GlobalOutlined,
  MailOutlined,
  EnvironmentOutlined,
  SolutionOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { PaginationResult } from '../../types'
import type { WorkerWithUser, EnterpriseWithUser } from '../../api/admin'
import adminApi from '../../api/admin'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

const craftsmanLevelColors: Record<number, string> = {
  1: '#d9d9d9',
  2: '#91d5ff',
  3: '#40a9ff',
  4: '#faad14',
  5: '#f5222d',
}

const craftsmanLevelText: Record<number, string> = {
  1: 'Lv1 学徒',
  2: 'Lv2 熟练',
  3: 'Lv3 精通',
  4: 'Lv4 大师',
  5: 'Lv5 宗师',
}

function UserManagement() {
  const [activeTab, setActiveTab] = useState<string>('workers')
  const [workerLoading, setWorkerLoading] = useState(false)
  const [enterpriseLoading, setEnterpriseLoading] = useState(false)
  const [workers, setWorkers] = useState<PaginationResult<WorkerWithUser> | null>(null)
  const [enterprises, setEnterprises] = useState<PaginationResult<EnterpriseWithUser> | null>(null)
  const [workerPagination, setWorkerPagination] = useState({ page: 1, pageSize: 10 })
  const [enterprisePagination, setEnterprisePagination] = useState({ page: 1, pageSize: 10 })
  const [workerFilterForm] = Form.useForm()
  const [enterpriseFilterForm] = Form.useForm()
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [currentWorker, setCurrentWorker] = useState<WorkerWithUser | null>(null)
  const [currentEnterprise, setCurrentEnterprise] = useState<EnterpriseWithUser | null>(null)
  const [statusLoading, setStatusLoading] = useState<number | null>(null)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [verifyForm] = Form.useForm()
  const [verifyLoading, setVerifyLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'workers') {
      void loadWorkers()
    } else {
      void loadEnterprises()
    }
  }, [activeTab, workerPagination, enterprisePagination])

  const loadWorkers = async () => {
    setWorkerLoading(true)
    try {
      const values = workerFilterForm.getFieldsValue()
      const res = await adminApi.getWorkers({
        page: workerPagination.page,
        pageSize: workerPagination.pageSize,
        keyword: values.keyword,
        status: values.status,
        skill: values.skill,
        craftsman_level_min: values.level_range?.[0],
        craftsman_level_max: values.level_range?.[1],
      })
      if (res.code === 0 && res.data) {
        setWorkers(res.data)
      }
    } finally {
      setWorkerLoading(false)
    }
  }

  const loadEnterprises = async () => {
    setEnterpriseLoading(true)
    try {
      const values = enterpriseFilterForm.getFieldsValue()
      const res = await adminApi.getEnterprises({
        page: enterprisePagination.page,
        pageSize: enterprisePagination.pageSize,
        keyword: values.keyword,
        status: values.status,
      })
      if (res.code === 0 && res.data) {
        setEnterprises(res.data)
      }
    } finally {
      setEnterpriseLoading(false)
    }
  }

  const handleToggleUserStatus = (user: { user_id: number; status: string }, name: string) => {
    const willDisable = user.status === 'active'
    Modal.confirm({
      title: willDisable ? `确认禁用用户 ${name}？` : `确认启用用户 ${name}？`,
      content: willDisable ? '禁用后该用户将无法登录和使用平台功能' : '启用后该用户将恢复正常使用',
      okText: willDisable ? '确认禁用' : '确认启用',
      okType: willDisable ? 'danger' : 'primary',
      cancelText: '取消',
      onOk: async () => {
        setStatusLoading(user.user_id)
        try {
          const res = await adminApi.toggleUserStatus(user.user_id, willDisable ? 'disabled' : 'active')
          if (res.code === 0) {
            message.success(willDisable ? '已禁用' : '已启用')
            if (activeTab === 'workers') {
              await loadWorkers()
            } else {
              await loadEnterprises()
            }
          }
        } finally {
          setStatusLoading(null)
        }
      },
    })
  }

  const openWorkerDetail = (record: WorkerWithUser) => {
    setCurrentWorker(record)
    setCurrentEnterprise(null)
    setDetailDrawerOpen(true)
  }

  const openEnterpriseDetail = (record: EnterpriseWithUser) => {
    setCurrentEnterprise(record)
    setCurrentWorker(null)
    setDetailDrawerOpen(true)
  }

  const openVerifyModal = (record: EnterpriseWithUser) => {
    setCurrentEnterprise(record)
    verifyForm.resetFields()
    setVerifyModalOpen(true)
  }

  const submitVerify = async (approved: boolean) => {
    if (!currentEnterprise) return
    try {
      let values: { reject_reason?: string } = {}
      if (!approved) {
        values = await verifyForm.validateFields()
      }
      setVerifyLoading(true)
      const res = await adminApi.approveEnterprise(currentEnterprise.id, approved, values.reject_reason)
      if (res.code === 0) {
        message.success(approved ? '审核通过' : '已驳回')
        setVerifyModalOpen(false)
        await loadEnterprises()
      } else {
        message.error(res.message || '操作失败')
      }
    } catch {
    } finally {
      setVerifyLoading(false)
    }
  }

  const craftsmanLevelOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    color: ['#d9d9d9', '#91d5ff', '#40a9ff', '#faad14', '#f5222d'],
    series: [
      {
        type: 'pie',
        radius: ['30%', '55%'],
        center: ['50%', '45%'],
        label: { formatter: '{b}: {c}' },
        data: [
          { name: 'Lv1', value: 86 },
          { name: 'Lv2', value: 142 },
          { name: 'Lv3', value: 98 },
          { name: 'Lv4', value: 35 },
          { name: 'Lv5', value: 12 },
        ],
      },
    ],
  }

  const workerColumns: ColumnsType<WorkerWithUser> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (val: number) => <Text code>{val}</Text>,
    },
    {
      title: '姓名',
      dataIndex: ['user', 'real_name'],
      key: 'real_name',
      width: 110,
      render: (val: string | undefined, record) => (
        <Space>
          <Avatar
            size={32}
            src={record.user.avatar_url}
            style={{ backgroundColor: craftsmanLevelColors[record.craftsman_level] }}
            icon={<UserOutlined />}
          />
          <div>
            <Text strong>{val || '-'}</Text>
            <div>
              <Badge
                status={record.user.face_verified ? 'success' : 'default'}
                text={<span style={{ fontSize: 11, color: '#8c8c8c' }}>
                  {record.user.face_verified ? '已人脸' : '未人脸'}
                </span>}
              />
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '手机号',
      dataIndex: ['user', 'phone'],
      key: 'phone',
      width: 130,
      render: (val: string) => (
        <Space size={4}>
          <PhoneOutlined style={{ color: '#8c8c8c' }} />
          {val?.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1****$3')}
        </Space>
      ),
    },
    {
      title: '身份证号',
      dataIndex: ['user', 'id_card_number'],
      key: 'id_card_number',
      width: 170,
      render: (val: string | undefined) => (
        <Text code>
          {val ? val.replace(/^(.{6})(.+)(.{4})$/, '$1********$3') : '-'}
        </Text>
      ),
    },
    {
      title: '人脸识别',
      dataIndex: ['user', 'face_verified'],
      key: 'face_verified',
      width: 100,
      render: (val: number) => (
        val ? (
          <Tag color="green" icon={<SafetyCertificateOutlined />}>已认证</Tag>
        ) : (
          <Tag color="default" icon={<ExclamationCircleOutlined />}>未认证</Tag>
        )
      ),
    },
    {
      title: '匠级',
      dataIndex: 'craftsman_level',
      key: 'craftsman_level',
      width: 100,
      sorter: (a, b) => a.craftsman_level - b.craftsman_level,
      render: (val: number) => (
        <Tooltip title={`匠级评分 ${val}.0/5.0`}>
          <Tag color={craftsmanLevelColors[val]} style={{ backgroundColor: '#fff' }}>
            <CrownOutlined /> {craftsmanLevelText[val]}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '匠级评分',
      dataIndex: 'craftsman_score',
      key: 'craftsman_score',
      width: 140,
      sorter: (a, b) => a.craftsman_score - b.craftsman_score,
      render: (val: number, record) => (
        <Space direction="vertical" size={0}>
          <Rate disabled allowHalf value={val / 20} style={{ fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 11 }}>
            质量 {record.quality_score} · 互评 {record.peer_score} · 考勤 {record.attendance_score}
          </Text>
        </Space>
      ),
    },
    {
      title: '技能',
      dataIndex: 'primary_skill',
      key: 'primary_skill',
      width: 100,
      render: (val: string | undefined, record) => (
        <Space direction="vertical" size={0}>
          <Tag color="blue" icon={<ThunderboltOutlined />}>{val || '-'}</Tag>
          {record.secondary_skills && (
            <Text type="secondary" style={{ fontSize: 11 }}>{record.secondary_skills}</Text>
          )}
        </Space>
      ),
    },
    {
      title: '工龄',
      dataIndex: 'work_years',
      key: 'work_years',
      width: 80,
      sorter: (a, b) => a.work_years - b.work_years,
      render: (val: number) => `${val}年`,
    },
    {
      title: '状态',
      dataIndex: ['user', 'status'],
      key: 'status',
      width: 90,
      render: (val: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: '正常' },
          disabled: { color: 'red', text: '已禁用' },
          pending: { color: 'orange', text: '待审核' },
        }
        const s = statusMap[val] || { color: 'default', text: val }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '注册时间',
      dataIndex: ['user', 'created_at'],
      key: 'created_at',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.user.created_at).getTime() - new Date(b.user.created_at).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openWorkerDetail(record)}>详情</Button>
          {record.user.status === 'active' ? (
            <Button
              type="link"
              size="small"
              danger
              icon={<StopOutlined />}
              loading={statusLoading === record.user_id}
              onClick={() => handleToggleUserStatus({ user_id: record.user_id, status: record.user.status }, record.user.real_name || '用户')}
            >
              禁用
            </Button>
          ) : record.user.status === 'disabled' ? (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              loading={statusLoading === record.user_id}
              onClick={() => handleToggleUserStatus({ user_id: record.user_id, status: record.user.status }, record.user.real_name || '用户')}
            >
              启用
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  const enterpriseColumns: ColumnsType<EnterpriseWithUser> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (val: number) => <Text code>{val}</Text>,
    },
    {
      title: '企业名称',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 200,
      ellipsis: true,
      render: (val: string, record) => (
        <Space>
          <Avatar
            size={36}
            style={{ backgroundColor: '#1890ff', borderRadius: 6 }}
            icon={<ApartmentOutlined />}
          />
          <Tooltip title={val}>
            <div>
              <Text strong>{val}</Text>
              <div style={{ color: '#8c8c8c', fontSize: 11 }}>
                <BankOutlined /> {record.industry_type || '-'}
              </div>
            </div>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'unified_social_code',
      key: 'unified_social_code',
      width: 180,
      render: (val: string | undefined) => val ? <Text code>{val}</Text> : '-',
    },
    {
      title: '法人',
      dataIndex: 'legal_person',
      key: 'legal_person',
      width: 100,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '联系手机',
      dataIndex: ['user', 'phone'],
      key: 'phone',
      width: 130,
      render: (val: string) => (
        <Space size={4}>
          <PhoneOutlined style={{ color: '#8c8c8c' }} />
          {val?.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1****$3')}
        </Space>
      ),
    },
    {
      title: '认证状态',
      dataIndex: 'verified',
      key: 'verified',
      width: 110,
      render: (val: number) => {
        if (val === 1) {
          return (
            <Tag color="green" icon={<SafetyOutlined />}>已认证</Tag>
          )
        }
        return (
          <Tag color="orange" icon={<AuditOutlined />}>待审核</Tag>
        )
      },
    },
    {
      title: '信用评分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      width: 160,
      sorter: (a, b) => a.credit_score - b.credit_score,
      render: (val: number) => {
        const level = val >= 900 ? 'AAA' : val >= 800 ? 'AA' : val >= 700 ? 'A' : val >= 600 ? 'BBB' : 'BB'
        const color = val >= 800 ? '#52c41a' : val >= 600 ? '#faad14' : '#f5222d'
        return (
          <Space direction="vertical" size={0}>
            <Space>
              <Text strong style={{ color, fontSize: 16 }}>{val}</Text>
              <Tag color={color} style={{ backgroundColor: '#fff' }}>{level}</Tag>
            </Space>
            <Progress percent={val / 10} showInfo={false} size="small" strokeColor={color} />
          </Space>
        )
      },
    },
    {
      title: '注册时间',
      dataIndex: ['user', 'created_at'],
      key: 'created_at',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.user.created_at).getTime() - new Date(b.user.created_at).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openEnterpriseDetail(record)}>详情</Button>
          {record.verified !== 1 ? (
            <Button
              type="link"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => openVerifyModal(record)}
            >
              审核
            </Button>
          ) : null}
          {record.user.status === 'active' ? (
            <Button
              type="link"
              size="small"
              danger
              icon={<StopOutlined />}
              loading={statusLoading === record.user_id}
              onClick={() => handleToggleUserStatus({ user_id: record.user_id, status: record.user.status }, record.company_name)}
            >
              禁用
            </Button>
          ) : record.user.status === 'disabled' ? (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              loading={statusLoading === record.user_id}
              onClick={() => handleToggleUserStatus({ user_id: record.user_id, status: record.user.status }, record.company_name)}
            >
              启用
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
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
              key: 'workers',
              label: (
                <Space>
                  <TeamOutlined style={{ color: '#faad14' }} />
                  工人管理
                  <Badge count={workers?.total ?? 0} showZero style={{ backgroundColor: '#faad14' }} />
                </Space>
              ),
            },
            {
              key: 'enterprises',
              label: (
                <Space>
                  <BankOutlined style={{ color: '#1890ff' }} />
                  企业管理
                  <Badge count={enterprises?.total ?? 0} showZero />
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {activeTab === 'workers' ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Card
                style={{ borderRadius: 8 }}
                styles={{ body: { paddingBottom: 0 } }}
              >
                <Form
                  form={workerFilterForm}
                  layout="inline"
                  onFinish={() => {
                    setWorkerPagination({ ...workerPagination, page: 1 })
                    void loadWorkers()
                  }}
                  style={{ rowGap: 12, marginBottom: 16 }}
                >
                  <Form.Item name="keyword">
                    <Input
                      prefix={<SearchOutlined />}
                      placeholder="姓名/手机号/身份证"
                      style={{ width: 200 }}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item name="level_range" label="匠级">
                    <Slider
                      range
                      min={1}
                      max={5}
                      marks={{ 1: 'L1', 2: 'L2', 3: 'L3', 4: 'L4', 5: 'L5' }}
                      style={{ width: 220, display: 'inline-block', margin: '0 8px' }}
                    />
                  </Form.Item>
                  <Form.Item name="skill" label="技能">
                    <Select allowClear placeholder="选择技能" style={{ width: 140 }}>
                      <Option value="泥瓦工">泥瓦工</Option>
                      <Option value="电工">电工</Option>
                      <Option value="木工">木工</Option>
                      <Option value="钢筋工">钢筋工</Option>
                      <Option value="油漆工">油漆工</Option>
                      <Option value="水暖工">水暖工</Option>
                      <Option value="架子工">架子工</Option>
                      <Option value="焊工">焊工</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="status" label="状态">
                    <Select allowClear placeholder="全部状态" style={{ width: 120 }}>
                      <Option value="active">正常</Option>
                      <Option value="disabled">已禁用</Option>
                      <Option value="pending">待审核</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">筛选</Button>
                      <Button onClick={() => { workerFilterForm.resetFields(); void loadWorkers() }}>重置</Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title={<Title level={5} style={{ margin: 0 }}>匠级分布</Title>} style={{ borderRadius: 8 }}>
                <ReactECharts option={craftsmanLevelOption} style={{ height: 160 }} />
              </Card>
            </Col>
          </Row>

          <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
            <Table<WorkerWithUser>
              rowKey="id"
              size="middle"
              loading={workerLoading}
              columns={workerColumns}
              dataSource={workers?.list ?? []}
              scroll={{ x: 1500 }}
              pagination={{
                current: workers?.page ?? workerPagination.page,
                pageSize: workers?.pageSize ?? workerPagination.pageSize,
                total: workers?.total ?? 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个工人`,
                onChange: (page, pageSize) => setWorkerPagination({ page, pageSize }),
              }}
            />
          </Card>
        </>
      ) : (
        <>
          <Card
            style={{ borderRadius: 8 }}
            styles={{ body: { paddingBottom: 0 } }}
          >
            <Form
              form={enterpriseFilterForm}
              layout="inline"
              onFinish={() => {
                setEnterprisePagination({ ...enterprisePagination, page: 1 })
                void loadEnterprises()
              }}
              style={{ rowGap: 12, marginBottom: 16 }}
            >
              <Form.Item name="keyword">
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="企业名称/法人/手机号/信用代码"
                  style={{ width: 240 }}
                  allowClear
                />
              </Form.Item>
              <Form.Item name="status" label="认证">
                <Select allowClear placeholder="全部" style={{ width: 120 }}>
                  <Option value="verified">已认证</Option>
                  <Option value="pending">待审核</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">筛选</Button>
                  <Button onClick={() => { enterpriseFilterForm.resetFields(); void loadEnterprises() }}>重置</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
            <Table<EnterpriseWithUser>
              rowKey="id"
              size="middle"
              loading={enterpriseLoading}
              columns={enterpriseColumns}
              dataSource={enterprises?.list ?? []}
              scroll={{ x: 1300 }}
              pagination={{
                current: enterprises?.page ?? enterprisePagination.page,
                pageSize: enterprises?.pageSize ?? enterprisePagination.pageSize,
                total: enterprises?.total ?? 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 家企业`,
                onChange: (page, pageSize) => setEnterprisePagination({ page, pageSize }),
              }}
            />
          </Card>
        </>
      )}

      <Drawer
        title={
          currentWorker ? (
            <Space>
              <Avatar
                size={40}
                style={{ backgroundColor: craftsmanLevelColors[currentWorker.craftsman_level] }}
                src={currentWorker.user.avatar_url}
                icon={<UserOutlined />}
              />
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {currentWorker.user.real_name || '工人详情'}
                </Text>
                <div>
                  <Tag color={craftsmanLevelColors[currentWorker.craftsman_level]} style={{ backgroundColor: '#fff' }}>
                    {craftsmanLevelText[currentWorker.craftsman_level]}
                  </Tag>
                  <Rate disabled allowHalf value={currentWorker.craftsman_score / 20} style={{ fontSize: 12 }} />
                </div>
              </div>
            </Space>
          ) : currentEnterprise ? (
            <Space>
              <Avatar size={40} style={{ backgroundColor: '#1890ff', borderRadius: 6 }} icon={<ApartmentOutlined />} />
              <div>
                <Text strong style={{ fontSize: 16 }}>{currentEnterprise.company_name}</Text>
                <div>
                  {currentEnterprise.verified === 1 ? (
                    <Tag color="green" icon={<SafetyOutlined />}>已认证</Tag>
                  ) : (
                    <Tag color="orange" icon={<AuditOutlined />}>待审核</Tag>
                  )}
                  <Tag color="blue">信用分 {currentEnterprise.credit_score}</Tag>
                </div>
              </div>
            </Space>
          ) : null
        }
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false)
          setCurrentWorker(null)
          setCurrentEnterprise(null)
        }}
        width={560}
      >
        {currentWorker ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} bordered size="small" title={<Space><IdcardOutlined /> 基本信息</Space>}>
              <Descriptions.Item label="用户ID">{currentWorker.user_id}</Descriptions.Item>
              <Descriptions.Item label="姓名">{currentWorker.user.real_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别">{currentWorker.gender === 'male' ? '男' : currentWorker.gender === 'female' ? '女' : '-'}</Descriptions.Item>
              <Descriptions.Item label="年龄">{currentWorker.age || '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">
                <Space>
                  <PhoneOutlined />
                  {currentWorker.user.phone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="身份证号">
                {currentWorker.user.id_card_number || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="人脸识别">
                {currentWorker.user.face_verified ? (
                  <Tag color="green" icon={<SafetyCertificateOutlined />}>已认证</Tag>
                ) : (
                  <Tag color="orange" icon={<ExclamationCircleOutlined />}>未认证</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="籍贯">{currentWorker.hometown || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前所在地">
                <Space><EnvironmentOutlined />{currentWorker.current_location || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="紧急联系人">{currentWorker.emergency_contact || '-'}</Descriptions.Item>
              <Descriptions.Item label="紧急联系电话">{currentWorker.emergency_phone || '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small" title={<Space><CrownOutlined style={{ color: '#faad14' }} /> 匠级与技能</Space>}>
              <Descriptions.Item label="匠级等级">
                <Tag color={craftsmanLevelColors[currentWorker.craftsman_level]}>
                  {craftsmanLevelText[currentWorker.craftsman_level]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="综合匠级评分">
                <Space>
                  <Rate disabled allowHalf value={currentWorker.craftsman_score / 20} />
                  <Text strong>{currentWorker.craftsman_score}/100</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="质量评分">{currentWorker.quality_score}/100</Descriptions.Item>
              <Descriptions.Item label="同行评分">{currentWorker.peer_score}/100</Descriptions.Item>
              <Descriptions.Item label="考勤评分">{currentWorker.attendance_score}/100</Descriptions.Item>
              <Descriptions.Item label="工龄">{currentWorker.work_years} 年</Descriptions.Item>
              <Descriptions.Item label="主技能">
                <Tag color="blue" icon={<ThunderboltOutlined />}>{currentWorker.primary_skill || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="副技能">{currentWorker.secondary_skills || '-'}</Descriptions.Item>
              <Descriptions.Item label="期望日薪">¥{currentWorker.daily_wage_expected}/天</Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small" title={<Space><FieldTimeOutlined /> 工作履历</Space>}>
              <Descriptions.Item label="参与项目数">{currentWorker.total_projects} 个</Descriptions.Item>
              <Descriptions.Item label="累计工日">{currentWorker.total_work_days} 天</Descriptions.Item>
              <Descriptions.Item label="个人简介">
                <Paragraph style={{ margin: 0 }}>{currentWorker.bio || '暂无简介'}</Paragraph>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small" title={<Space><CalendarOutlined /> 账号信息</Space>}>
              <Descriptions.Item label="账号状态">
                {currentWorker.user.status === 'active' ? (
                  <Tag color="green">正常</Tag>
                ) : currentWorker.user.status === 'disabled' ? (
                  <Tag color="red">已禁用</Tag>
                ) : (
                  <Tag color="orange">待审核</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {dayjs(currentWorker.user.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(currentWorker.user.updated_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        ) : currentEnterprise ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {currentEnterprise.business_license_url && (
              <Card
                type="inner"
                title={<Space><FileDoneOutlined /> 营业执照</Space>}
                size="small"
              >
                <Image src={currentEnterprise.business_license_url} alt="营业执照" />
              </Card>
            )}

            <Descriptions column={1} bordered size="small" title={<Space><ApartmentOutlined /> 企业信息</Space>}>
              <Descriptions.Item label="企业ID">{currentEnterprise.id}</Descriptions.Item>
              <Descriptions.Item label="企业名称">{currentEnterprise.company_name}</Descriptions.Item>
              <Descriptions.Item label="统一社会信用代码">
                <Text code>{currentEnterprise.unified_social_code || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="所属行业">{currentEnterprise.industry_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="注册资本">
                {currentEnterprise.registered_capital ? `¥${currentEnterprise.registered_capital.toLocaleString()}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="企业地址">
                <Space><HomeOutlined />{currentEnterprise.company_address || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <Space><PhoneOutlined />{currentEnterprise.company_phone || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="企业邮箱">
                <Space><MailOutlined />{currentEnterprise.company_email || '-'}</Space>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small" title={<Space><SolutionOutlined /> 法人信息</Space>}>
              <Descriptions.Item label="法人姓名">{currentEnterprise.legal_person || '-'}</Descriptions.Item>
              <Descriptions.Item label="法人身份证">
                {currentEnterprise.legal_person_id_card
                  ? currentEnterprise.legal_person_id_card.replace(/^(.{6})(.+)(.{4})$/, '$1********$3')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small" title={<Space><StarOutlined style={{ color: '#faad14' }} /> 信用与经营</Space>}>
              <Descriptions.Item label="信用评分">
                <Space>
                  <Text strong style={{ fontSize: 18, color: currentEnterprise.credit_score >= 800 ? '#52c41a' : '#faad14' }}>
                    {currentEnterprise.credit_score}
                  </Text>
                  <Progress percent={currentEnterprise.credit_score / 10} showInfo={false} size="small" />
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="认证状态">
                {currentEnterprise.verified === 1 ? (
                  <Space>
                    <Tag color="green" icon={<SafetyOutlined />}>已认证</Tag>
                    {currentEnterprise.verified_by && <Text type="secondary">审核人 #{currentEnterprise.verified_by}</Text>}
                    {currentEnterprise.verified_at && (
                      <Text type="secondary">{dayjs(currentEnterprise.verified_at).format('YYYY-MM-DD')}</Text>
                    )}
                  </Space>
                ) : (
                  <Tag color="orange" icon={<AuditOutlined />}>待审核</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="发布项目数">{currentEnterprise.total_projects} 个</Descriptions.Item>
              <Descriptions.Item label="累计雇佣工人">{currentEnterprise.total_workers_hired} 人次</Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small" title={<Space><CalendarOutlined /> 账号信息</Space>}>
              <Descriptions.Item label="账号状态">
                {currentEnterprise.user.status === 'active' ? (
                  <Tag color="green">正常</Tag>
                ) : currentEnterprise.user.status === 'disabled' ? (
                  <Tag color="red">已禁用</Tag>
                ) : (
                  <Tag color="orange">待审核</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="注册手机号">{currentEnterprise.user.phone}</Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {dayjs(currentEnterprise.user.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title={
          <Space>
            <Avatar size={36} style={{ backgroundColor: '#1890ff', borderRadius: 6 }} icon={<AuditOutlined />} />
            <div>
              <Text strong style={{ fontSize: 16 }}>企业认证审核</Text>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>{currentEnterprise?.company_name}</div>
            </div>
          </Space>
        }
        open={verifyModalOpen}
        onCancel={() => {
          setVerifyModalOpen(false)
          setCurrentEnterprise(null)
        }}
        footer={
          <Space>
            <Button onClick={() => setVerifyModalOpen(false)}>取消</Button>
            <Button danger onClick={() => void submitVerify(false)} loading={verifyLoading} icon={<CloseCircleOutlined />}>
              驳回
            </Button>
            <Button type="primary" onClick={() => void submitVerify(true)} loading={verifyLoading} icon={<CheckCircleOutlined />}>
              通过
            </Button>
          </Space>
        }
        width={560}
      >
        {currentEnterprise && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="企业名称" span={2}>{currentEnterprise.company_name}</Descriptions.Item>
              <Descriptions.Item label="统一信用代码">{currentEnterprise.unified_social_code || '-'}</Descriptions.Item>
              <Descriptions.Item label="所属行业">{currentEnterprise.industry_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="法人">{currentEnterprise.legal_person || '-'}</Descriptions.Item>
              <Descriptions.Item label="注册资本">
                {currentEnterprise.registered_capital ? `¥${currentEnterprise.registered_capital.toLocaleString()}` : '-'}
              </Descriptions.Item>
            </Descriptions>

            {currentEnterprise.business_license_url && (
              <Card size="small" title="营业执照">
                <Image src={currentEnterprise.business_license_url} />
              </Card>
            )}

            <Divider style={{ margin: '12px 0' }} />

            <Form form={verifyForm} layout="vertical">
              <Form.Item
                name="reject_reason"
                label="驳回原因（仅驳回时必填）"
                rules={[{ required: false }]}
              >
                <TextArea rows={3} placeholder="如驳回，请填写驳回原因..." maxLength={500} showCount />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </Space>
  )
}

export default UserManagement
