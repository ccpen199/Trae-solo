import { useEffect, useState } from 'react'
import {
  Card,
  Tabs,
  List,
  Tag,
  Space,
  Typography,
  Button,
  Modal,
  Descriptions,
  message,
  Spin,
  Avatar,
  Badge,
  Alert,
  Result,
  Row,
  Col,
  Timeline,
} from 'antd'
import {
  FileTextOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  WalletOutlined,
  HomeOutlined,
  CoffeeOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
  EyeOutlined,
  SendOutlined,
  TeamOutlined,
  StarOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../App'
import jobApi, { type ApplicationDetail, type ContractDetail } from '../../api/job'
import type { JobApplicationStatus } from '../../types'

const { Title, Text } = Typography

type TabKey = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected'

const TAB_ITEMS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'pending', label: '待审核', icon: <HourglassOutlined /> },
  { key: 'accepted', label: '已录用', icon: <CheckCircleOutlined /> },
  { key: 'in_progress', label: '进行中', icon: <TeamOutlined /> },
  { key: 'completed', label: '已完成', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
  { key: 'rejected', label: '已拒绝', icon: <CloseCircleOutlined /> },
]

const statusColor: Record<JobApplicationStatus, string> = {
  pending: 'gold',
  accepted: 'blue',
  withdrawn: 'default',
  rejected: 'red',
  completed: 'green',
}

const statusText: Record<JobApplicationStatus, string> = {
  pending: '待审核',
  accepted: '已录用',
  withdrawn: '已撤回',
  rejected: '已拒绝',
  completed: '已完成',
}

function Applications() {
  const { worker } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [applications, setApplications] = useState<ApplicationDetail[]>([])
  const [contractVisible, setContractVisible] = useState(false)
  const [currentContract, setCurrentContract] = useState<ContractDetail | null>(null)
  const [signLoading, setSignLoading] = useState(false)

  const mockApplications: ApplicationDetail[] = [
    {
      id: 201,
      job_post_id: 301,
      worker_id: worker?.id || 1,
      application_status: 'pending',
      applied_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      worker_signoff: 0,
      enterprise_confirm: 0,
      job_post: {
        id: 301,
        enterprise_id: 58,
        title: '市政道路改造工程钢筋工',
        skill_required: '钢筋工',
        workers_needed: 15,
        start_date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().add(60, 'day').format('YYYY-MM-DD'),
        daily_wage: 420,
        work_location: '北京市东城区东长安街',
        geofence_radius: 250,
        accommodation_provided: 1,
        meals_provided: 1,
        insurance_provided: 1,
        status: 'open',
        wage_deposit_amount: 300000,
        deposit_paid: 1,
        created_at: '',
        updated_at: '',
      },
      enterprise: {
        id: 58,
        user_id: 0,
        company_name: '北京市政建设集团',
        verified: 1,
        credit_score: 97,
        total_projects: 230,
        total_workers_hired: 3600,
        created_at: '',
        updated_at: '',
      },
    },
    {
      id: 202,
      job_post_id: 302,
      worker_id: worker?.id || 1,
      application_status: 'pending',
      applied_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      worker_signoff: 0,
      enterprise_confirm: 0,
      job_post: {
        id: 302,
        enterprise_id: 59,
        title: '大型商场精装修电工班组',
        skill_required: '电工',
        workers_needed: 6,
        start_date: dayjs().add(5, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().add(45, 'day').format('YYYY-MM-DD'),
        daily_wage: 460,
        work_location: '北京市西城区西单北大街',
        geofence_radius: 180,
        accommodation_provided: 0,
        meals_provided: 1,
        insurance_provided: 1,
        status: 'open',
        wage_deposit_amount: 120000,
        deposit_paid: 1,
        created_at: '',
        updated_at: '',
      },
      enterprise: {
        id: 59,
        user_id: 0,
        company_name: '西城区装饰工程公司',
        verified: 1,
        credit_score: 94,
        total_projects: 120,
        total_workers_hired: 1800,
        created_at: '',
        updated_at: '',
      },
    },
    {
      id: 199,
      job_post_id: 299,
      worker_id: worker?.id || 1,
      application_status: 'accepted',
      applied_at: dayjs().subtract(8, 'day').format('YYYY-MM-DD HH:mm:ss'),
      reviewed_at: dayjs().subtract(6, 'day').format('YYYY-MM-DD HH:mm:ss'),
      hire_date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
      worker_signoff: 0,
      enterprise_confirm: 0,
      job_post: {
        id: 299,
        enterprise_id: 60,
        title: '住宅小区室内装修泥瓦工',
        skill_required: '泥瓦工',
        workers_needed: 8,
        start_date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().add(35, 'day').format('YYYY-MM-DD'),
        daily_wage: 390,
        work_location: '北京市丰台区方庄小区',
        geofence_radius: 200,
        accommodation_provided: 1,
        meals_provided: 0,
        insurance_provided: 1,
        status: 'in_progress',
        wage_deposit_amount: 90000,
        deposit_paid: 1,
        created_at: '',
        updated_at: '',
      },
      enterprise: {
        id: 60,
        user_id: 0,
        company_name: '方庄建筑装饰公司',
        verified: 1,
        credit_score: 93,
        total_projects: 78,
        total_workers_hired: 1100,
        created_at: '',
        updated_at: '',
      },
    },
    {
      id: 198,
      job_post_id: 298,
      worker_id: worker?.id || 1,
      application_status: 'accepted',
      applied_at: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
      reviewed_at: dayjs().subtract(8, 'day').format('YYYY-MM-DD HH:mm:ss'),
      hire_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
      worker_signoff: 1,
      worker_signoff_at: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise_confirm: 0,
      job_post: {
        id: 298,
        enterprise_id: 61,
        title: '写字楼消防系统改造管道工',
        skill_required: '水管工',
        workers_needed: 4,
        start_date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().add(28, 'day').format('YYYY-MM-DD'),
        daily_wage: 440,
        work_location: '北京市朝阳区国贸CBD',
        geofence_radius: 150,
        accommodation_provided: 0,
        meals_provided: 0,
        insurance_provided: 1,
        status: 'in_progress',
        wage_deposit_amount: 60000,
        deposit_paid: 1,
        created_at: '',
        updated_at: '',
      },
      enterprise: {
        id: 61,
        user_id: 0,
        company_name: '北京消防工程专业公司',
        verified: 1,
        credit_score: 96,
        total_projects: 156,
        total_workers_hired: 2200,
        created_at: '',
        updated_at: '',
      },
    },
    {
      id: 195,
      job_post_id: 295,
      worker_id: worker?.id || 1,
      application_status: 'in_progress',
      applied_at: dayjs().subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'),
      reviewed_at: dayjs().subtract(18, 'day').format('YYYY-MM-DD HH:mm:ss'),
      hire_date: dayjs().subtract(15, 'day').format('YYYY-MM-DD'),
      worker_signoff: 1,
      worker_signoff_at: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise_confirm: 0,
      job_post: {
        id: 295,
        enterprise_id: 50,
        title: '商业大厦精装修电工班组',
        skill_required: '电工',
        workers_needed: 8,
        start_date: dayjs().subtract(15, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().add(45, 'day').format('YYYY-MM-DD'),
        daily_wage: 450,
        work_location: '北京市朝阳区建国路88号',
        geofence_radius: 200,
        accommodation_provided: 1,
        accommodation_detail: '提供4人间宿舍，空调热水器',
        meals_provided: 1,
        meals_detail: '提供一日三餐，工作餐',
        insurance_provided: 1,
        insurance_detail: '购买工伤保险和意外险',
        work_hours: '上午8:00-12:00, 下午14:00-18:00',
        status: 'in_progress',
        wage_deposit_amount: 200000,
        deposit_paid: 1,
        created_at: '',
        updated_at: '',
      },
      enterprise: {
        id: 50,
        user_id: 0,
        company_name: '北京城建集团有限公司',
        verified: 1,
        credit_score: 98,
        total_projects: 156,
        total_workers_hired: 2340,
        created_at: '',
        updated_at: '',
      },
    },
    {
      id: 188,
      job_post_id: 288,
      worker_id: worker?.id || 1,
      application_status: 'completed',
      applied_at: dayjs().subtract(60, 'day').format('YYYY-MM-DD HH:mm:ss'),
      reviewed_at: dayjs().subtract(58, 'day').format('YYYY-MM-DD HH:mm:ss'),
      hire_date: dayjs().subtract(55, 'day').format('YYYY-MM-DD'),
      completion_date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
      worker_signoff: 1,
      worker_signoff_at: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise_confirm: 1,
      enterprise_confirm_at: dayjs().subtract(9, 'day').format('YYYY-MM-DD HH:mm:ss'),
      job_post: {
        id: 288,
        enterprise_id: 62,
        title: '科技园区厂房钢结构焊工',
        skill_required: '焊工',
        workers_needed: 6,
        start_date: dayjs().subtract(55, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
        daily_wage: 470,
        work_location: '北京市亦庄经济开发区',
        geofence_radius: 200,
        accommodation_provided: 1,
        meals_provided: 1,
        insurance_provided: 1,
        status: 'completed',
        wage_deposit_amount: 150000,
        deposit_paid: 1,
        created_at: '',
        updated_at: '',
      },
      enterprise: {
        id: 62,
        user_id: 0,
        company_name: '亦庄钢结构工程公司',
        verified: 1,
        credit_score: 95,
        total_projects: 98,
        total_workers_hired: 1500,
        created_at: '',
        updated_at: '',
      },
    },
    {
      id: 185,
      job_post_id: 285,
      worker_id: worker?.id || 1,
      application_status: 'completed',
      applied_at: dayjs().subtract(90, 'day').format('YYYY-MM-DD HH:mm:ss'),
      reviewed_at: dayjs().subtract(88, 'day').format('YYYY-MM-DD HH:mm:ss'),
      hire_date: dayjs().subtract(85, 'day').format('YYYY-MM-DD'),
      completion_date: dayjs().subtract(25, 'day').format('YYYY-MM-DD'),
      worker_signoff: 1,
      worker_signoff_at: dayjs().subtract(25, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise_confirm: 1,
      enterprise_confirm_at: dayjs().subtract(24, 'day').format('YYYY-MM-DD HH:mm:ss'),
      job_post: {
        id: 285,
        enterprise_id: 63,
        title: '学校教学楼改造木工班组',
        skill_required: '木工',
        workers_needed: 5,
        start_date: dayjs().subtract(85, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().subtract(25, 'day').format('YYYY-MM-DD'),
        daily_wage: 400,
        work_location: '北京市海淀区学院路',
        geofence_radius: 220,
        accommodation_provided: 0,
        meals_provided: 1,
        insurance_provided: 1,
        status: 'completed',
        wage_deposit_amount: 80000,
        deposit_paid: 1,
        created_at: '',
        updated_at: '',
      },
      enterprise: {
        id: 63,
        user_id: 0,
        company_name: '海淀区教育基建公司',
        verified: 1,
        credit_score: 96,
        total_projects: 85,
        total_workers_hired: 1300,
        created_at: '',
        updated_at: '',
      },
    },
    {
      id: 197,
      job_post_id: 297,
      worker_id: worker?.id || 1,
      application_status: 'rejected',
      applied_at: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
      reviewed_at: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
      worker_signoff: 0,
      enterprise_confirm: 0,
      notes: '该岗位已招满，感谢您的申请，期待下次合作',
      job_post: {
        id: 297,
        enterprise_id: 64,
        title: '医院病房楼架子工',
        skill_required: '架子工',
        workers_needed: 3,
        start_date: dayjs().add(10, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().add(50, 'day').format('YYYY-MM-DD'),
        daily_wage: 520,
        work_location: '北京市朝阳区和平里',
        geofence_radius: 200,
        accommodation_provided: 1,
        meals_provided: 1,
        insurance_provided: 1,
        status: 'in_progress',
        wage_deposit_amount: 70000,
        deposit_paid: 1,
        created_at: '',
        updated_at: '',
      },
      enterprise: {
        id: 64,
        user_id: 0,
        company_name: '朝阳区医院基建工程组',
        verified: 1,
        credit_score: 95,
        total_projects: 56,
        total_workers_hired: 850,
        created_at: '',
        updated_at: '',
      },
    },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      setApplications(mockApplications)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = applications.filter((app) => {
    if (activeTab === 'in_progress') {
      return app.application_status === 'accepted' && (app.worker_signoff === 1 || app.hire_date)
    }
    if (activeTab === 'accepted') {
      return app.application_status === 'accepted' && app.worker_signoff === 0
    }
    return app.application_status === activeTab
  })

  const handleViewContract = async (app: ApplicationDetail) => {
    try {
      setCurrentContract({
        id: app.id,
        job_application_id: app.id,
        contract_no: `CT${dayjs().format('YYYYMMDD')}${String(app.id).padStart(6, '0')}`,
        start_date: app.job_post?.start_date || '',
        end_date: app.job_post?.end_date || '',
        daily_wage: app.job_post?.daily_wage || 0,
        work_hours: app.job_post?.work_hours || '上午8:00-12:00, 下午14:00-18:00',
        accommodation_detail: app.job_post?.accommodation_detail || '无',
        meals_detail: app.job_post?.meals_detail || '无',
        insurance_detail: app.job_post?.insurance_detail || '无',
        worker_sign: app.worker_signoff,
        worker_sign_at: app.worker_signoff_at,
        enterprise_sign: 1,
        enterprise_sign_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        created_at: app.applied_at,
      })
      setContractVisible(true)
    } catch {
      message.error('合同加载失败')
    }
  }

  const handleSignContract = async () => {
    if (!currentContract) return
    setSignLoading(true)
    try {
      message.success('电子合同签署成功！')
      setCurrentContract({
        ...currentContract,
        worker_sign: 1,
        worker_sign_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      })
      setApplications((prev) =>
        prev.map((app) =>
          app.id === currentContract.job_application_id
            ? { ...app, worker_signoff: 1, worker_signoff_at: dayjs().format('YYYY-MM-DD HH:mm:ss') }
            : app
        )
      )
    } catch {
      message.error('签署失败')
    } finally {
      setSignLoading(false)
    }
  }

  const handleSignoff = async (app: ApplicationDetail) => {
    Modal.confirm({
      title: '确认完工签收',
      content: `确认对项目「${app.job_post?.title}」进行完工签收？签收后工资结算将进入最终流程。`,
      okText: '确认签收',
      cancelText: '取消',
      onOk: async () => {
        try {
          message.success('完工签收成功！等待企业确认')
          setApplications((prev) =>
            prev.map((a) =>
              a.id === app.id
                ? {
                    ...a,
                    worker_signoff: 1,
                    worker_signoff_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                    completion_date: dayjs().format('YYYY-MM-DD'),
                    application_status: 'completed',
                  }
                : a
            )
          )
        } catch {
          message.error('操作失败')
        }
      },
    })
  }

  const handleConfirm = async (app: ApplicationDetail) => {
    Modal.confirm({
      title: '确认完工',
      content: `确认项目「${app.job_post?.title}」已全部完成，工资结算无误？`,
      okText: '确认完成',
      cancelText: '取消',
      onOk: async () => {
        try {
          message.success('项目已确认完成！')
          setApplications((prev) =>
            prev.map((a) =>
              a.id === app.id
                ? { ...a, enterprise_confirm: 1, enterprise_confirm_at: dayjs().format('YYYY-MM-DD HH:mm:ss') }
                : a
            )
          )
        } catch {
          message.error('操作失败')
        }
      },
    })
  }

  const renderActions = (app: ApplicationDetail) => {
    const status = app.application_status
    const buttons: React.ReactNode[] = []

    if (status === 'pending') {
      buttons.push(
        <Button
          key="withdraw"
          size="small"
          danger
          onClick={() =>
            Modal.confirm({
              title: '撤回申请',
              content: '确定要撤回该申请吗？',
              onOk: () => {
                message.success('已撤回申请')
                setApplications((prev) => prev.filter((a) => a.id !== app.id))
              },
            })
          }
        >
          撤回申请
        </Button>
      )
    }

    if (status === 'accepted' && app.worker_signoff === 0) {
      buttons.push(
        <Button key="contract" size="small" type="primary" onClick={() => handleViewContract(app)}>
          <FileTextOutlined /> 查看合同
        </Button>
      )
    }

    if (status === 'accepted' && app.worker_signoff === 1) {
      buttons.push(
        <Button key="contract" size="small" onClick={() => handleViewContract(app)}>
          <EyeOutlined /> 查看合同
        </Button>
      )
      buttons.push(
        <Button key="attendance" size="small" type="primary">
          <ClockCircleOutlined /> 去打卡
        </Button>
      )
    }

    if (activeTab === 'in_progress') {
      buttons.push(
        <Button key="contract" size="small" onClick={() => handleViewContract(app)}>
          <EyeOutlined /> 合同
        </Button>
      )
      buttons.push(
        <Button key="signoff" size="small" type="primary" onClick={() => handleSignoff(app)}>
          <SendOutlined /> 完工签收
        </Button>
      )
    }

    if (status === 'completed') {
      buttons.push(
        <Button key="contract" size="small" onClick={() => handleViewContract(app)}>
          <EyeOutlined /> 合同
        </Button>
      )
      if (app.worker_signoff === 1 && app.enterprise_confirm === 0) {
        buttons.push(
          <Button key="tip" size="small" disabled>
            等待企业确认
          </Button>
        )
      }
      if (app.enterprise_confirm === 0 && app.completion_date) {
        buttons.push(
          <Button key="confirm" size="small" type="primary" onClick={() => handleConfirm(app)}>
            <CheckCircleOutlined /> 确认完工
          </Button>
        )
      }
      if (app.worker_signoff === 1 && app.enterprise_confirm === 1) {
        buttons.push(
          <Tag color="green" style={{ border: 'none' }}>
            <CheckCircleOutlined /> 双方已确认
          </Tag>
        )
      }
    }

    if (status === 'rejected') {
      buttons.push(
        <Button key="reason" size="small" type="text">
          <QuestionCircleOutlined /> 查看原因
        </Button>
      )
    }

    return <Space wrap size={8}>{buttons}</Space>
  }

  const getTimelineItems = (app: ApplicationDetail) => {
    const items = [
      {
        color: 'green',
        dot: <CheckCircleOutlined />,
        children: (
          <div>
            <Text strong>提交申请</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(app.applied_at).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
          </div>
        ),
      },
    ]
    if (app.reviewed_at) {
      items.push({
        color: app.application_status === 'rejected' ? 'red' : 'green',
        dot: app.application_status === 'rejected' ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
        children: (
          <div>
            <Text strong>
              {app.application_status === 'rejected' ? '申请被拒绝' : '企业审核通过'}
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(app.reviewed_at).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
          </div>
        ),
      })
    }
    if (app.worker_signoff_at && app.application_status !== 'rejected') {
      items.push({
        color: 'green',
        dot: <CheckCircleOutlined />,
        children: (
          <div>
            <Text strong>
              {app.application_status === 'completed' ? '完工签收' : '签署电子合同'}
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(app.worker_signoff_at).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
          </div>
        ),
      })
    }
    if (app.enterprise_confirm_at) {
      items.push({
        color: 'green',
        dot: <CheckCircleOutlined />,
        children: (
          <div>
            <Text strong>企业确认完工</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(app.enterprise_confirm_at).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
          </div>
        ),
      })
    }
    if (app.application_status === 'pending') {
      items.push({
        color: 'gray',
        dot: <HourglassOutlined />,
        children: (
          <div>
            <Text type="secondary">等待企业审核...</Text>
          </div>
        ),
      })
    }
    return items
  }

  return (
    <div>
      <Card
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
        tabBarExtraContent={
          <Text type="secondary" style={{ paddingRight: 16 }}>
            共 {applications.length} 条申请记录
          </Text>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as TabKey)}
          items={TAB_ITEMS.map((tab) => ({
            key: tab.key,
            label: (
              <Space>
                {tab.icon}
                {tab.label}
                <Badge
                  count={
                    applications.filter((a) => {
                      if (tab.key === 'in_progress') {
                        return a.application_status === 'accepted' && a.worker_signoff === 1
                      }
                      if (tab.key === 'accepted') {
                        return a.application_status === 'accepted' && a.worker_signoff === 0
                      }
                      return a.application_status === tab.key
                    }).length
                  }
                  size="small"
                  style={{ marginLeft: 4 }}
                />
              </Space>
            ),
          }))}
          size="large"
          style={{ padding: '0 24px' }}
        />
      </Card>

      <div style={{ marginTop: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Card style={{ borderRadius: 12 }}>
            <Result
              icon={<FileTextOutlined style={{ color: '#d9d9d9', fontSize: 64 }} />}
              title="暂无申请记录"
              subTitle="当前分类下还没有申请，去逛逛找合适的工作吧"
              extra={
                <Button type="primary" href="/worker/jobs">
                  去找工作
                </Button>
              }
            />
          </Card>
        ) : (
          filtered.map((app) => (
            <Card
              key={app.id}
              style={{ borderRadius: 12, marginBottom: 16 }}
              bodyStyle={{ padding: 20 }}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} lg={16}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <Title level={5} style={{ margin: 0, marginBottom: 6 }}>
                          {app.job_post?.title}
                        </Title>
                        <Space align="center" size={8} wrap>
                          <Avatar
                            size={24}
                            style={{ background: '#1677ff', fontSize: 12 }}
                            icon={<BankOutlined />}
                          />
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {app.enterprise?.company_name}
                          </Text>
                          {app.enterprise?.verified && (
                            <Tag color="success" style={{ margin: 0 }}>
                              已认证
                            </Tag>
                          )}
                        </Space>
                      </div>
                      <Tag
                        color={statusColor[app.application_status]}
                        style={{ fontSize: 13, padding: '4px 12px', borderRadius: 16 }}
                      >
                        {statusText[app.application_status]}
                      </Tag>
                    </div>

                    <Space wrap split={<span style={{ color: '#e8e8e8' }}>|</span>} size={10}>
                      <Tag color="blue" style={{ margin: 0 }}>
                        {app.job_post?.skill_required}
                      </Tag>
                      <Text style={{ fontSize: 13 }}>
                        <CalendarOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                        {dayjs(app.job_post?.start_date).format('MM/DD')} - {dayjs(app.job_post?.end_date).format('MM/DD')}
                      </Text>
                      <Text style={{ fontSize: 13 }}>
                        <TeamOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                        招{app.job_post?.workers_needed}人
                      </Text>
                    </Space>

                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>日薪</Text>
                      <Text strong style={{ color: '#cf1322', fontSize: 22, fontWeight: 700, marginLeft: 8 }}>
                        ¥{app.job_post?.daily_wage}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>/天</Text>
                    </div>

                    <Space wrap size={6}>
                      {app.job_post?.accommodation_provided ? (
                        <Tag color="geekblue" style={{ fontSize: 12 }} icon={<HomeOutlined />}>
                          住宿
                        </Tag>
                      ) : null}
                      {app.job_post?.meals_provided ? (
                        <Tag color="green" style={{ fontSize: 12 }} icon={<CoffeeOutlined />}>
                          餐饮
                        </Tag>
                      ) : null}
                      {app.job_post?.insurance_provided ? (
                        <Tag color="purple" style={{ fontSize: 12 }} icon={<SafetyCertificateOutlined />}>
                          保险
                        </Tag>
                      ) : null}
                    </Space>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8c8c8c', fontSize: 13 }}>
                      <EnvironmentOutlined />
                      <span>{app.job_post?.work_location}</span>
                    </div>

                    {app.notes && (
                      <Alert
                        type="warning"
                        showIcon
                        message="审核说明"
                        description={app.notes}
                        style={{ borderRadius: 8 }}
                      />
                    )}

                    <div>{renderActions(app)}</div>
                  </Space>
                </Col>

                <Col xs={24} lg={8}>
                  <Card
                    size="small"
                    title={<Text style={{ fontSize: 13 }}>申请进度</Text>}
                    style={{ borderRadius: 8, background: '#fafafa' }}
                  >
                    <Timeline
                      items={getTimelineItems(app)}
                      style={{ fontSize: 13 }}
                    />
                  </Card>

                  {app.enterprise && (
                    <Card
                      size="small"
                      title={<Text style={{ fontSize: 13 }}>企业信息</Text>}
                      style={{ borderRadius: 8, marginTop: 12 }}
                    >
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>信用评分</Text>
                          <Text strong style={{ color: '#faad14', fontSize: 13 }}>
                            <StarOutlined /> {app.enterprise.credit_score}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>累计项目</Text>
                          <Text style={{ fontSize: 13 }}>{app.enterprise.total_projects} 个</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>累计雇佣</Text>
                          <Text style={{ fontSize: 13 }}>{app.enterprise.total_workers_hired} 人</Text>
                        </div>
                      </Space>
                    </Card>
                  )}
                </Col>
              </Row>
            </Card>
          ))
        )}
      </div>

      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>电子劳务合同</span>
            <Tag color="blue">{currentContract?.contract_no}</Tag>
          </Space>
        }
        open={contractVisible}
        onCancel={() => setContractVisible(false)}
        width={720}
        okText={currentContract?.worker_sign ? '关闭' : '签署合同'}
        cancelText="取消"
        confirmLoading={signLoading}
        onOk={() => {
          if (currentContract?.worker_sign) {
            setContractVisible(false)
          } else {
            handleSignContract()
          }
        }}
        okButtonProps={currentContract?.worker_sign ? { type: 'default' } : { type: 'primary' }}
      >
        {currentContract && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message="平台保障提示"
              description="本合同由「匠信工易」平台监管，工资从已缴担保金中发放。请仔细阅读合同条款后签署。"
              style={{ borderRadius: 8 }}
            />

            <Card size="small" style={{ borderRadius: 8 }}>
              <Descriptions column={1} size="small" labelStyle={{ width: 120, color: '#8c8c8c' }}>
                <Descriptions.Item label="合同编号">{currentContract.contract_no}</Descriptions.Item>
                <Descriptions.Item label="项目名称">
                  {filtered.find((a) => a.id === currentContract.job_application_id)?.job_post?.title}
                </Descriptions.Item>
                <Descriptions.Item label="甲方（企业）">
                  {filtered.find((a) => a.id === currentContract.job_application_id)?.enterprise?.company_name}
                </Descriptions.Item>
                <Descriptions.Item label="乙方（工人）">
                  {worker?.primary_skill || '工人师傅'}
                </Descriptions.Item>
                <Descriptions.Item label="工种">
                  {filtered.find((a) => a.id === currentContract.job_application_id)?.job_post?.skill_required}
                </Descriptions.Item>
                <Descriptions.Item label="工期">
                  {dayjs(currentContract.start_date).format('YYYY年MM月DD日')} 至 {dayjs(currentContract.end_date).format('YYYY年MM月DD日')}
                </Descriptions.Item>
                <Descriptions.Item label="日薪">
                  <Text strong style={{ color: '#cf1322' }}>¥{currentContract.daily_wage}</Text> /天
                </Descriptions.Item>
                <Descriptions.Item label="工作时间">{currentContract.work_hours}</Descriptions.Item>
                <Descriptions.Item label="住宿">{currentContract.accommodation_detail}</Descriptions.Item>
                <Descriptions.Item label="餐饮">{currentContract.meals_detail}</Descriptions.Item>
                <Descriptions.Item label="保险">{currentContract.insurance_detail}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              size="small"
              title="签署状态"
              style={{ borderRadius: 8 }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Badge status={currentContract.enterprise_sign ? 'success' : 'default'} />
                    <div>
                      <Text strong>甲方（企业）</Text>
                      <div>
                        {currentContract.enterprise_sign ? (
                          <Space>
                            <Tag color="success" style={{ margin: 0 }}>已签署</Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(currentContract.enterprise_sign_at).format('YYYY-MM-DD HH:mm')}
                            </Text>
                          </Space>
                        ) : (
                          <Text type="secondary">待签署</Text>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Badge status={currentContract.worker_sign ? 'success' : 'warning'} />
                    <div>
                      <Text strong>乙方（您）</Text>
                      <div>
                        {currentContract.worker_sign ? (
                          <Space>
                            <Tag color="success" style={{ margin: 0 }}>已签署</Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(currentContract.worker_sign_at).format('YYYY-MM-DD HH:mm')}
                            </Text>
                          </Space>
                        ) : (
                          <Tag color="warning">待签署</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {currentContract.worker_sign ? (
              <Alert
                type="success"
                showIcon
                message="合同已生效"
                description="您与企业均已签署本合同，即日起生效。请按合同要求开始工作。"
                style={{ borderRadius: 8 }}
              />
            ) : null}
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default Applications
