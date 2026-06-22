import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  Button,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Switch,
  Modal,
  Tabs,
  Table,
  Tag,
  Space,
  Row,
  Col,
  message,
  Divider,
  Typography,
  Tooltip,
  Statistic,
  Avatar,
  Empty,
  Skeleton,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  HomeOutlined,
  CoffeeOutlined,
  InsuranceOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import jobApi, {
  type CreateJobPostParams,
  type MyJobPostsResult,
  type JobApplicationWithWorker,
} from '../../api/job'
import type { ColumnsType } from 'antd/es/table'

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Title, Text } = Typography

const skillOptions = [
  { value: '木工', label: '木工' },
  { value: '瓦工', label: '瓦工' },
  { value: '钢筋工', label: '钢筋工' },
  { value: '电工', label: '电工' },
  { value: '水暖工', label: '水暖工' },
  { value: '油漆工', label: '油漆工' },
  { value: '架子工', label: '架子工' },
  { value: '普通工', label: '普通工' },
  { value: '焊工', label: '焊工' },
  { value: '装修工', label: '装修工' },
]

const statusConfig: Record<string, { color: string; text: string }> = {
  open: { color: 'blue', text: '招聘中' },
  in_progress: { color: 'green', text: '进行中' },
  completed: { color: 'default', text: '已完成' },
  cancelled: { color: 'red', text: '已取消' },
}

const mockApplications: JobApplicationWithWorker[] = [
  {
    id: 1,
    job_post_id: 1,
    worker_id: 101,
    application_status: 'pending',
    applied_at: '2026-06-20 09:30:00',
    worker_signoff: 0,
    enterprise_confirm: 0,
    worker: {
      id: 101,
      user_id: 201,
      real_name: '张伟',
      avatar_url: undefined,
      primary_skill: '木工',
      craftsman_level: 3,
      craftsman_score: 4.5,
      work_years: 8,
    },
    job_post: {
      id: 1,
      title: 'CBD办公楼装修项目',
      daily_wage: 350,
    },
  },
  {
    id: 2,
    job_post_id: 1,
    worker_id: 102,
    application_status: 'pending',
    applied_at: '2026-06-20 10:15:00',
    worker_signoff: 0,
    enterprise_confirm: 0,
    worker: {
      id: 102,
      user_id: 202,
      real_name: '李强',
      avatar_url: undefined,
      primary_skill: '木工',
      craftsman_level: 2,
      craftsman_score: 4.2,
      work_years: 5,
    },
    job_post: {
      id: 1,
      title: 'CBD办公楼装修项目',
      daily_wage: 350,
    },
  },
]

function JobManagement() {
  const [activeTab, setActiveTab] = useState('open')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [applicationsModalOpen, setApplicationsModalOpen] = useState(false)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [currentJob, setCurrentJob] = useState<MyJobPostsResult | null>(null)
  const [applications, setApplications] = useState<JobApplicationWithWorker[]>([])
  const [createForm] = Form.useForm<CreateJobPostParams>()
  const [editForm] = Form.useForm<CreateJobPostParams>()
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [jobList, setJobList] = useState<MyJobPostsResult[]>([])

  const watchCreateValues = Form.useWatch([
    'workers_needed',
    'daily_wage',
    'start_date',
    'end_date',
  ], createForm)

  useEffect(() => {
    loadJobList()
  }, [activeTab])

  const loadJobList = async () => {
    try {
      setLoading(true)
      const res = await jobApi.getMyJobPosts({ status: activeTab })
      if (res.code === 0 && res.data) {
        setJobList(res.data.list)
      }
    } catch {
      const now = dayjs()
      setJobList([
        {
          id: 1,
          enterprise_id: 1,
          title: 'CBD办公楼装修木工招聘',
          skill_required: '木工',
          workers_needed: 5,
          start_date: now.subtract(3, 'day').format('YYYY-MM-DD'),
          end_date: now.add(25, 'day').format('YYYY-MM-DD'),
          daily_wage: 350,
          work_location: '北京市朝阳区建国路88号',
          latitude: 39.9087,
          longitude: 116.4574,
          geofence_radius: 500,
          accommodation_provided: 1,
          accommodation_detail: '提供2人间宿舍，空调热水器齐全',
          meals_provided: 1,
          meals_detail: '三餐免费，营养均衡',
          insurance_provided: 1,
          insurance_detail: '购买工伤保险和意外险',
          work_hours: '8:00-12:00, 14:00-18:00',
          description: 'CBD办公楼室内精装修，需熟练木工，有相关经验优先',
          status: activeTab === 'all' ? 'open' : (activeTab as MyJobPostsResult['status']),
          wage_deposit_amount: 52500,
          deposit_paid: activeTab === 'completed' || activeTab === 'cancelled' ? 1 : 0,
          created_at: now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updated_at: now.format('YYYY-MM-DD HH:mm:ss'),
          application_count: 8,
          hired_count: 3,
        },
        {
          id: 2,
          enterprise_id: 1,
          title: '商业步行街改造项目',
          skill_required: '瓦工',
          workers_needed: 8,
          start_date: now.subtract(7, 'day').format('YYYY-MM-DD'),
          end_date: now.add(50, 'day').format('YYYY-MM-DD'),
          daily_wage: 420,
          work_location: '上海市黄浦区南京东路',
          latitude: 31.2304,
          longitude: 121.4737,
          geofence_radius: 500,
          accommodation_provided: 0,
          meals_provided: 1,
          meals_detail: '提供午餐和晚餐',
          insurance_provided: 1,
          insurance_detail: '工伤保险',
          work_hours: '7:30-11:30, 13:30-17:30',
          description: '商业街地面铺装、外墙翻新',
          status: activeTab === 'all' ? 'in_progress' : (activeTab as MyJobPostsResult['status']),
          wage_deposit_amount: 100800,
          deposit_paid: 1,
          created_at: now.subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updated_at: now.format('YYYY-MM-DD HH:mm:ss'),
          application_count: 15,
          hired_count: 6,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const calculateDeposit = useMemo(() => {
    const workers = watchCreateValues?.workers_needed || 0
    const wage = watchCreateValues?.daily_wage || 0
    let days = 0
    if (watchCreateValues?.start_date && watchCreateValues?.end_date) {
      days = Math.max(1, dayjs(watchCreateValues.end_date as unknown as string)
        .diff(dayjs(watchCreateValues.start_date as unknown as string), 'day') + 1)
    }
    return workers * wage * days * 0.3
  }, [watchCreateValues])

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields()
      setSubmitLoading(true)
      const res = await jobApi.createJobPost({
        ...values,
        start_date: dayjs(values.start_date).format('YYYY-MM-DD'),
        end_date: dayjs(values.end_date).format('YYYY-MM-DD'),
        geofence_radius: values.geofence_radius ?? 500,
        accommodation_provided: values.accommodation_provided ? 1 : 0,
        meals_provided: values.meals_provided ? 1 : 0,
        insurance_provided: values.insurance_provided ? 1 : 0,
        latitude: 39.9042,
        longitude: 116.4074,
      })
      if (res.code === 0) {
        message.success('用工需求发布成功')
        setCreateModalOpen(false)
        createForm.resetFields()
        loadJobList()
      } else {
        message.error(res.message || '发布失败')
      }
    } catch {
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      if (!currentJob) return
      setSubmitLoading(true)
      const res = await jobApi.updateJobPost(currentJob.id, {
        ...values,
        start_date: dayjs(values.start_date).format('YYYY-MM-DD'),
        end_date: dayjs(values.end_date).format('YYYY-MM-DD'),
        accommodation_provided: values.accommodation_provided ? 1 : 0,
        meals_provided: values.meals_provided ? 1 : 0,
        insurance_provided: values.insurance_provided ? 1 : 0,
      })
      if (res.code === 0) {
        message.success('修改成功')
        setEditModalOpen(false)
        loadJobList()
      } else {
        message.error(res.message || '修改失败')
      }
    } catch {
    } finally {
      setSubmitLoading(false)
    }
  }

  const openEditModal = (job: MyJobPostsResult) => {
    setCurrentJob(job)
    editForm.setFieldsValue({
      title: job.title,
      skill_required: job.skill_required,
      workers_needed: job.workers_needed,
      start_date: dayjs(job.start_date),
      end_date: dayjs(job.end_date),
      daily_wage: job.daily_wage,
      work_location: job.work_location,
      geofence_radius: job.geofence_radius,
      accommodation_provided: job.accommodation_provided === 1,
      accommodation_detail: job.accommodation_detail,
      meals_provided: job.meals_provided === 1,
      meals_detail: job.meals_detail,
      insurance_provided: job.insurance_provided === 1,
      insurance_detail: job.insurance_detail,
      work_hours: job.work_hours,
      description: job.description,
    })
    setEditModalOpen(true)
  }

  const openDetailModal = (job: MyJobPostsResult) => {
    setCurrentJob(job)
    setDetailModalOpen(true)
  }

  const openApplicationsModal = async (job: MyJobPostsResult) => {
    setCurrentJob(job)
    setApplications(mockApplications)
    setApplicationsModalOpen(true)
  }

  const openDepositModal = (job: MyJobPostsResult) => {
    setCurrentJob(job)
    setDepositModalOpen(true)
  }

  const handlePayDeposit = async () => {
    try {
      setSubmitLoading(true)
      if (!currentJob) return
      const res = await jobApi.payDeposit(currentJob.id, {
        payment_method: 'bank_transfer',
      })
      if (res.code === 0) {
        message.success('保证金支付成功')
        setDepositModalOpen(false)
        loadJobList()
      } else {
        message.error(res.message || '支付失败')
      }
    } catch {
      message.success('保证金支付成功（模拟）')
      setDepositModalOpen(false)
      loadJobList()
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReviewApplication = async (appId: number, status: 'accepted' | 'rejected') => {
    try {
      const res = await jobApi.reviewApplication(appId, status)
      if (res.code === 0) {
        message.success(status === 'accepted' ? '已通过申请' : '已拒绝申请')
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, application_status: status } : a))
        )
      }
    } catch {
      message.success(status === 'accepted' ? '已通过申请（模拟）' : '已拒绝申请（模拟）')
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, application_status: status } : a))
      )
    }
  }

  const columns: ColumnsType<MyJobPostsResult> = [
    {
      title: '需求信息',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      render: (text, record) => (
        <Space direction="vertical" size={4}>
          <Text strong style={{ fontSize: 15 }}>{text}</Text>
          <Space size={12}>
            <Tag color="geekblue" icon={<TeamOutlined />}>
              {record.skill_required}
            </Tag>
            <Tag color="cyan" icon={<EnvironmentOutlined />}>
              {record.work_location.slice(0, 12)}...
            </Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: '人数/日薪',
      key: 'wages',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text>
            <DollarOutlined style={{ color: '#1890ff', marginRight: 4 }} />
            ¥{record.daily_wage}/天
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            需 {record.workers_needed} 人
          </Text>
        </Space>
      ),
    },
    {
      title: '工期',
      key: 'period',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Space size={4}>
            <CalendarOutlined style={{ color: '#52c41a' }} />
            <Text>{record.start_date}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 18 }}>
            至 {record.end_date}
          </Text>
        </Space>
      ),
    },
    {
      title: '申请/已录',
      key: 'applications',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text>
            <span style={{ color: '#722ed1', fontWeight: 600 }}>{record.application_count}</span>
            <Text type="secondary"> 人申请</Text>
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            已录用 <Tag color="success" style={{ margin: 0 }}>{record.hired_count}</Tag>
          </Text>
        </Space>
      ),
    },
    {
      title: '保证金',
      key: 'deposit',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong style={{ color: '#fa8c16' }}>
            ¥{record.wage_deposit_amount.toLocaleString()}
          </Text>
          {record.deposit_paid === 1 ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>已支付</Tag>
          ) : (
            <Tag color="warning" icon={<InfoCircleOutlined />}>待支付</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusConfig[status]?.color || 'default'} style={{ fontSize: 13, padding: '2px 10px' }}>
          {statusConfig[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size={6} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(record)}>
            详情
          </Button>
          {(record.status === 'open' || record.status === 'in_progress') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
              编辑
            </Button>
          )}
          {record.deposit_paid === 0 && record.status === 'open' && (
            <Button
              type="link"
              size="small"
              icon={<SafetyCertificateOutlined />}
              onClick={() => openDepositModal(record)}
            >
              支付保证金
            </Button>
          )}
          <Button type="link" size="small" onClick={() => openApplicationsModal(record)}>
            查看申请
          </Button>
        </Space>
      ),
    },
  ]

  const renderJobForm = (form: typeof createForm, isEdit = false) => (
    <Form
      form={form}
      layout="vertical"
      style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}
    >
      <Divider orientation="left" orientationMargin={0} plain style={{ margin: '4px 0 12px' }}>
        <Text strong>基本信息</Text>
      </Divider>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="title"
            label="需求标题"
            rules={[{ required: true, message: '请输入需求标题' }]}
          >
            <Input placeholder="例如：CBD办公楼装修木工招聘" size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="skill_required"
            label="工种"
            rules={[{ required: true, message: '请选择工种' }]}
          >
            <Select placeholder="请选择工种" options={skillOptions} size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="workers_needed"
            label="招聘人数"
            rules={[{ required: true, message: '请输入招聘人数' }]}
          >
            <InputNumber
              min={1}
              max={500}
              placeholder="请输入人数"
              size="large"
              addonAfter="人"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            name={['start_date', 'end_date'] as unknown as string}
            label="工期（起止日期）"
            rules={[{ required: true, message: '请选择工期' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              size="large"
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="daily_wage"
            label="日薪（元/天）"
            rules={[{ required: true, message: '请输入日薪' }]}
          >
            <InputNumber
              min={100}
              step={10}
              placeholder="请输入日薪"
              size="large"
              addonAfter="元/天"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="geofence_radius"
            label="GPS围栏半径"
            initialValue={500}
            tooltip="工人打卡时需在该范围内才视为有效"
          >
            <InputNumber
              min={100}
              step={100}
              placeholder="默认500米"
              size="large"
              addonAfter="米"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            name="work_location"
            label="工作地点"
            rules={[{ required: true, message: '请输入工作地点' }]}
          >
            <Input
              prefix={<EnvironmentOutlined />}
              placeholder="详细地址，GPS坐标已自动获取模拟数据"
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin={0} plain style={{ margin: '12px 0' }}>
        <Text strong>食宿条件</Text>
      </Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="accommodation_provided"
            label="是否提供住宿"
            initialValue={false}
            valuePropName="checked"
          >
            <Switch checkedChildren="提供" unCheckedChildren="不提供" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="meals_provided"
            label="是否提供餐饮"
            initialValue={false}
            valuePropName="checked"
          >
            <Switch checkedChildren="提供" unCheckedChildren="不提供" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item noStyle shouldUpdate={(prev, cur) =>
            prev.accommodation_provided !== cur.accommodation_provided
          }>
            {({ getFieldValue }) =>
              getFieldValue('accommodation_provided') ? (
                <Form.Item name="accommodation_detail" label="住宿详情">
                  <TextArea rows={2} placeholder="请描述住宿条件，如房间人数、设施等" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item noStyle shouldUpdate={(prev, cur) =>
            prev.meals_provided !== cur.meals_provided
          }>
            {({ getFieldValue }) =>
              getFieldValue('meals_provided') ? (
                <Form.Item name="meals_detail" label="餐饮详情">
                  <TextArea rows={2} placeholder="请描述餐饮情况，如几餐、餐标等" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin={0} plain style={{ margin: '12px 0' }}>
        <Text strong>安全保险</Text>
      </Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="insurance_provided"
            label="是否购买保险"
            initialValue={true}
            valuePropName="checked"
          >
            <Switch checkedChildren="购买" unCheckedChildren="不购买" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item noStyle shouldUpdate={(prev, cur) =>
            prev.insurance_provided !== cur.insurance_provided
          }>
            {({ getFieldValue }) =>
              getFieldValue('insurance_provided') ? (
                <Form.Item name="insurance_detail" label="保险说明">
                  <TextArea rows={2} placeholder="请说明保险种类、保额等信息" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin={0} plain style={{ margin: '12px 0' }}>
        <Text strong>其他信息</Text>
      </Divider>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="work_hours" label="工作时间">
            <Input
              prefix={<ClockCircleOutlined />}
              placeholder="例如：8:00-12:00, 14:00-18:00"
              size="large"
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="description" label="项目描述">
            <TextArea rows={4} placeholder="请描述项目详情、要求、福利等" />
          </Form.Item>
        </Col>
      </Row>

      {!isEdit && (
        <Card
          bordered
          style={{
            background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
            borderColor: '#91caff',
            borderRadius: 8,
          }}
        >
          <Row align="middle">
            <Col flex="auto">
              <Space>
                <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>预计保证金金额（工资总额 × 30%）</Text>
                  <Text strong style={{ fontSize: 22, color: '#1890ff' }}>
                    ¥{Math.round(calculateDeposit).toLocaleString()}
                  </Text>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>
      )}
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>用工管理</Title>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => {
            createForm.resetFields()
            setCreateModalOpen(true)
          }}
          style={{
            background: 'linear-gradient(135deg, #1890ff, #096dd9)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(24,144,255,0.3)',
          }}
        >
          发布新用工需求
        </Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 24px' }}
          items={[
            { key: 'all', label: '全部' },
            { key: 'open', label: <Space><TeamOutlined />招聘中</Space> },
            { key: 'in_progress', label: <Space><CheckCircleOutlined />进行中</Space> },
            { key: 'completed', label: <Space><CheckCircleOutlined />已完成</Space> },
            { key: 'cancelled', label: <Space><CloseCircleOutlined />已取消</Space> },
          ]}
        />
        <Table<MyJobPostsResult>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={jobList}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条需求`,
          }}
          locale={{ emptyText: <Empty description="暂无用工需求" /> }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1890ff' }} />
            发布新用工需求
          </Space>
        }
        open={createModalOpen}
        onOk={handleCreateSubmit}
        onCancel={() => {
          setCreateModalOpen(false)
          createForm.resetFields()
        }}
        confirmLoading={submitLoading}
        width={800}
        okText="立即发布"
        cancelText="取消"
      >
        {renderJobForm(createForm)}
      </Modal>

      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#faad14' }} />
            编辑用工需求
          </Space>
        }
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalOpen(false)}
        confirmLoading={submitLoading}
        width={800}
        okText="保存修改"
        cancelText="取消"
      >
        {renderJobForm(editForm, true)}
      </Modal>

      <Modal
        title="需求详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
        ]}
        width={720}
      >
        {currentJob && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
                  <Statistic
                    title="日薪"
                    value={currentJob.daily_wage}
                    prefix="¥"
                    suffix="元/天"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} style={{ background: '#e6f7ff', borderRadius: 8 }}>
                  <Statistic
                    title="招聘人数"
                    value={currentJob.workers_needed}
                    suffix="人"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>
            <Divider style={{ margin: 0 }} />
            <Row gutter={16}>
              <Col span={8}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <CalendarOutlined /> 工期
                  </Text>
                  <Text strong>{currentJob.start_date} ~ {currentJob.end_date}</Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <EnvironmentOutlined /> 工作地点
                  </Text>
                  <Text strong>{currentJob.work_location}</Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <HomeOutlined /> 住宿
                  </Text>
                  <Text strong>
                    {currentJob.accommodation_provided === 1 ? '提供' : '不提供'}
                    {currentJob.accommodation_detail && ` · ${currentJob.accommodation_detail}`}
                  </Text>
                </Space>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <CoffeeOutlined /> 餐饮
                  </Text>
                  <Text strong>
                    {currentJob.meals_provided === 1 ? '提供' : '不提供'}
                    {currentJob.meals_detail && ` · ${currentJob.meals_detail}`}
                  </Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <InsuranceOutlined /> 保险
                  </Text>
                  <Text strong>
                    {currentJob.insurance_provided === 1 ? '购买' : '未购买'}
                    {currentJob.insurance_detail && ` · ${currentJob.insurance_detail}`}
                  </Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <ClockCircleOutlined /> 工作时间
                  </Text>
                  <Text strong>{currentJob.work_hours || '未设置'}</Text>
                </Space>
              </Col>
            </Row>
            {currentJob.description && (
              <>
                <Divider style={{ margin: 0 }} />
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ fontSize: 12 }}>项目描述</Text>
                  <Text>{currentJob.description}</Text>
                </Space>
              </>
            )}
          </Space>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <TeamOutlined style={{ color: '#722ed1' }} />
            {currentJob?.title} - 工人申请列表
          </Space>
        }
        open={applicationsModalOpen}
        onCancel={() => setApplicationsModalOpen(false)}
        width={880}
        footer={[
          <Button key="close" onClick={() => setApplicationsModalOpen(false)}>关闭</Button>,
        ]}
      >
        <Table<JobApplicationWithWorker>
          rowKey="id"
          size="middle"
          dataSource={applications}
          pagination={false}
          columns={[
            {
              title: '工人信息',
              key: 'worker',
              render: (_, record) => (
                <Space size={12}>
                  <Avatar size={44} style={{ background: 'linear-gradient(135deg, #1890ff, #722ed1)' }}>
                    {record.worker.real_name?.[0]}
                  </Avatar>
                  <Space direction="vertical" size={2}>
                    <Text strong style={{ fontSize: 15 }}>{record.worker.real_name}</Text>
                    <Space size={8}>
                      <Tag color="geekblue">{record.worker.primary_skill}</Tag>
                      <Tag color="gold">匠级 Lv.{record.worker.craftsman_level}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.worker.work_years}年经验 · 评分{record.worker.craftsman_score}
                      </Text>
                    </Space>
                  </Space>
                </Space>
              ),
            },
            {
              title: '申请时间',
              dataIndex: 'applied_at',
              width: 160,
              render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
            },
            {
              title: '期望日薪',
              key: 'wage',
              width: 120,
              render: (_, record) => (
                <Text strong style={{ color: '#52c41a' }}>
                  ¥{record.job_post.daily_wage}/天
                </Text>
              ),
            },
            {
              title: '状态',
              dataIndex: 'application_status',
              width: 100,
              render: (status) => {
                const map: Record<string, { color: string; text: string }> = {
                  pending: { color: 'orange', text: '待审核' },
                  accepted: { color: 'green', text: '已通过' },
                  rejected: { color: 'red', text: '已拒绝' },
                }
                return <Tag color={map[status]?.color}>{map[status]?.text}</Tag>
              },
            },
            {
              title: '操作',
              key: 'actions',
              width: 200,
              render: (_, record) => (
                record.application_status === 'pending' ? (
                  <Space>
                    <Popconfirm
                      title="确认通过该工人的申请？"
                      onConfirm={() => handleReviewApplication(record.id, 'accepted')}
                      okText="通过"
                      cancelText="取消"
                    >
                      <Button type="primary" size="small" icon={<CheckCircleOutlined />}>
                        通过
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title="确认拒绝该工人的申请？"
                      onConfirm={() => handleReviewApplication(record.id, 'rejected')}
                      okText="拒绝"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger size="small" icon={<CloseCircleOutlined />}>
                        拒绝
                      </Button>
                    </Popconfirm>
                  </Space>
                ) : (
                  <Tooltip title="已处理">
                    <Button size="small" disabled>已处理</Button>
                  </Tooltip>
                )
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#faad14' }} />
            支付工资保证金
          </Space>
        }
        open={depositModalOpen}
        onOk={handlePayDeposit}
        onCancel={() => setDepositModalOpen(false)}
        confirmLoading={submitLoading}
        width={560}
        okText="确认支付"
        cancelText="取消"
      >
        {currentJob && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message="保证金说明"
              description="工资保证金将由平台托管，项目完工后T+1日自动释放至工人账户。保证金为工资总额的30%。"
              style={{ borderRadius: 8 }}
            />
            <Card
              bordered
              style={{
                background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)',
                borderColor: '#ffd591',
                borderRadius: 12,
              }}
            >
              <Row align="middle">
                <Col flex="auto">
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">{currentJob.title}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {currentJob.workers_needed}人 × ¥{currentJob.daily_wage}/天 × 工期
                    </Text>
                  </Space>
                </Col>
                <Col>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#999' }}>应付保证金</div>
                    <div style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: '#fa8c16',
                      lineHeight: 1.2,
                    }}>
                      ¥{currentJob.wage_deposit_amount.toLocaleString()}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text type="secondary">支付方式</Text>
              <Select
                defaultValue="bank_transfer"
                size="large"
                options={[
                  { value: 'bank_transfer', label: '银企直连转账（推荐）' },
                  { value: 'alipay', label: '企业支付宝' },
                  { value: 'wechat', label: '企业微信支付' },
                ]}
              />
            </Space>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default JobManagement
