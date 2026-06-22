import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Slider,
  Checkbox,
  Button,
  List,
  Tag,
  Space,
  Typography,
  Modal,
  Pagination,
  Badge,
  Avatar,
  message,
  Spin,
  Divider,
  Descriptions,
} from 'antd'
import {
  SearchOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  WalletOutlined,
  HomeOutlined,
  CoffeeOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  StarOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../App'
import jobApi, { type JobPostWithEnterprise } from '../../api/job'
import type { Enterprise } from '../../types'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input

const SKILL_OPTIONS = [
  { value: '', label: '全部工种' },
  { value: '钢筋工', label: '钢筋工' },
  { value: '木工', label: '木工' },
  { value: '泥瓦工', label: '泥瓦工' },
  { value: '电工', label: '电工' },
  { value: '水管工', label: '水管工' },
  { value: '架子工', label: '架子工' },
  { value: '油漆工', label: '油漆工' },
  { value: '焊工', label: '焊工' },
  { value: '普工', label: '普工' },
  { value: '装修工', label: '装修工' },
]

function JobList() {
  const { user, worker } = useAuth()
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [skill, setSkill] = useState('')
  const [wageRange, setWageRange] = useState<[number, number]>([0, 1000])
  const [accommodation, setAccommodation] = useState(false)
  const [meals, setMeals] = useState(false)
  const [insurance, setInsurance] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(8)
  const [total, setTotal] = useState(0)
  const [jobs, setJobs] = useState<JobPostWithEnterprise[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentJob, setCurrentJob] = useState<JobPostWithEnterprise | null>(null)
  const [applyLoading, setApplyLoading] = useState(false)

  const mockJobs: JobPostWithEnterprise[] = [
    {
      id: 201,
      enterprise_id: 50,
      title: '某商业大厦精装修电工班组',
      skill_required: '电工',
      workers_needed: 8,
      start_date: dayjs().add(5, 'day').format('YYYY-MM-DD'),
      end_date: dayjs().add(65, 'day').format('YYYY-MM-DD'),
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
      description: '商业大厦精装修项目，主要负责室内电路布线、照明系统安装、配电箱安装等工作。要求持有电工证，有3年以上精装修经验。工资月结，每月15日发放上月工资。',
      status: 'open',
      wage_deposit_amount: 200000,
      deposit_paid: 1,
      created_at: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise: {
        id: 50,
        user_id: 0,
        company_name: '北京城建集团有限公司',
        unified_social_code: '91110000100012345X',
        company_address: '北京市海淀区中关村大街1号',
        company_phone: '010-88888888',
        verified: 1,
        verified_at: dayjs().subtract(365, 'day').format('YYYY-MM-DD'),
        credit_score: 98,
        total_projects: 156,
        total_workers_hired: 2340,
        created_at: '',
        updated_at: '',
      } as Enterprise,
      application_count: 23,
    },
    {
      id: 202,
      enterprise_id: 51,
      title: '住宅小区主体结构钢筋工',
      skill_required: '钢筋工',
      workers_needed: 12,
      start_date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      end_date: dayjs().add(120, 'day').format('YYYY-MM-DD'),
      daily_wage: 400,
      work_location: '北京市通州区新华大街100号',
      geofence_radius: 300,
      accommodation_provided: 1,
      accommodation_detail: '提供6人间宿舍',
      meals_provided: 0,
      insurance_provided: 1,
      insurance_detail: '购买工伤保险',
      work_hours: '上午7:00-11:30, 下午13:00-17:30',
      description: '大型住宅小区项目，30栋高层住宅，需要大量钢筋工。要求能看懂图纸，有大型项目经验。日结或半月结均可。',
      status: 'open',
      wage_deposit_amount: 500000,
      deposit_paid: 1,
      created_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      enterprise: {
        id: 51,
        user_id: 0,
        company_name: '中国建筑第八工程局',
        unified_social_code: '91310000100067890Y',
        company_address: '上海市浦东新区世纪大道100号',
        company_phone: '021-66666666',
        verified: 1,
        credit_score: 99,
        total_projects: 520,
        total_workers_hired: 8500,
        created_at: '',
        updated_at: '',
      } as Enterprise,
      application_count: 56,
    },
    {
      id: 203,
      enterprise_id: 52,
      title: '地铁车站装修木工班组',
      skill_required: '木工',
      workers_needed: 6,
      start_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      end_date: dayjs().add(90, 'day').format('YYYY-MM-DD'),
      daily_wage: 420,
      work_location: '北京市西城区复兴门站',
      geofence_radius: 150,
      accommodation_provided: 0,
      meals_provided: 1,
      meals_detail: '提供两餐',
      insurance_provided: 1,
      work_hours: '上午8:30-12:00, 下午13:30-18:00',
      description: '地铁车站精装修，木工作业包括吊顶龙骨安装、墙面基层处理等。要求5年以上木工经验，有地铁或大型公装项目经验优先。',
      status: 'open',
      wage_deposit_amount: 120000,
      deposit_paid: 1,
      created_at: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise: {
        id: 52,
        user_id: 0,
        company_name: '北京建工集团有限责任公司',
        unified_social_code: '91110000100024680Z',
        company_address: '北京市西城区广安门南街42号',
        verified: 1,
        credit_score: 96,
        total_projects: 280,
        total_workers_hired: 4200,
        created_at: '',
        updated_at: '',
      } as Enterprise,
      application_count: 18,
    },
    {
      id: 204,
      enterprise_id: 53,
      title: '工业园厂房泥瓦工',
      skill_required: '泥瓦工',
      workers_needed: 10,
      start_date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
      end_date: dayjs().add(45, 'day').format('YYYY-MM-DD'),
      daily_wage: 380,
      work_location: '北京市大兴区亦庄经济开发区',
      geofence_radius: 250,
      accommodation_provided: 1,
      meals_provided: 1,
      insurance_provided: 1,
      work_hours: '上午7:30-11:30, 下午13:00-17:30',
      description: '工业园区厂房建设，砌墙、抹灰、贴地砖等工作。工期短，完工即结。',
      status: 'open',
      wage_deposit_amount: 80000,
      deposit_paid: 1,
      created_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise: {
        id: 53,
        user_id: 0,
        company_name: '大兴建筑工程有限公司',
        verified: 1,
        credit_score: 92,
        total_projects: 85,
        total_workers_hired: 1200,
        created_at: '',
        updated_at: '',
      } as Enterprise,
      application_count: 34,
    },
    {
      id: 205,
      enterprise_id: 54,
      title: '商业综合体架子工',
      skill_required: '架子工',
      workers_needed: 4,
      start_date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      end_date: dayjs().add(30, 'day').format('YYYY-MM-DD'),
      daily_wage: 500,
      work_location: '北京市朝阳区三里屯',
      geofence_radius: 200,
      accommodation_provided: 0,
      meals_provided: 0,
      insurance_provided: 1,
      insurance_detail: '高额意外险',
      work_hours: '上午8:00-12:00, 下午14:00-18:00',
      description: '商业综合体改造外脚手架搭设与拆除。要求持有特种作业操作证（架子工），2年以上高空作业经验。',
      status: 'open',
      wage_deposit_amount: 60000,
      deposit_paid: 1,
      created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      enterprise: {
        id: 54,
        user_id: 0,
        company_name: '北京脚手架工程专业公司',
        verified: 1,
        credit_score: 90,
        total_projects: 45,
        total_workers_hired: 680,
        created_at: '',
        updated_at: '',
      } as Enterprise,
      application_count: 8,
    },
    {
      id: 206,
      enterprise_id: 55,
      title: '住宅区给排水水管工',
      skill_required: '水管工',
      workers_needed: 5,
      start_date: dayjs().add(10, 'day').format('YYYY-MM-DD'),
      end_date: dayjs().add(70, 'day').format('YYYY-MM-DD'),
      daily_wage: 430,
      work_location: '北京市昌平区回龙观',
      geofence_radius: 200,
      accommodation_provided: 1,
      meals_provided: 1,
      insurance_provided: 1,
      description: '新建住宅区给排水管道安装工程。要求持有管道工证，熟悉PPR、PE、镀锌管等材料施工。',
      status: 'open',
      wage_deposit_amount: 100000,
      deposit_paid: 1,
      created_at: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise: {
        id: 55,
        user_id: 0,
        company_name: '昌平市政工程公司',
        verified: 1,
        credit_score: 94,
        total_projects: 120,
        total_workers_hired: 1800,
        created_at: '',
        updated_at: '',
      } as Enterprise,
      application_count: 15,
    },
    {
      id: 207,
      enterprise_id: 56,
      title: '写字楼外墙油漆工',
      skill_required: '油漆工',
      workers_needed: 7,
      start_date: dayjs().add(4, 'day').format('YYYY-MM-DD'),
      end_date: dayjs().add(55, 'day').format('YYYY-MM-DD'),
      daily_wage: 420,
      work_location: '北京市海淀区中关村',
      geofence_radius: 180,
      accommodation_provided: 1,
      meals_provided: 0,
      insurance_provided: 1,
      work_hours: '上午8:00-12:00, 下午14:00-18:00',
      description: '写字楼外墙翻新喷漆作业，需高空作业。要求3年以上外墙喷漆经验，有高空作业证优先。',
      status: 'open',
      wage_deposit_amount: 90000,
      deposit_paid: 1,
      created_at: dayjs().subtract(6, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise: {
        id: 56,
        user_id: 0,
        company_name: '中关村装饰工程有限公司',
        verified: 1,
        credit_score: 91,
        total_projects: 68,
        total_workers_hired: 950,
        created_at: '',
        updated_at: '',
      } as Enterprise,
      application_count: 21,
    },
    {
      id: 208,
      enterprise_id: 57,
      title: '钢结构厂房焊工',
      skill_required: '焊工',
      workers_needed: 4,
      start_date: dayjs().add(6, 'day').format('YYYY-MM-DD'),
      end_date: dayjs().add(40, 'day').format('YYYY-MM-DD'),
      daily_wage: 480,
      work_location: '北京市顺义区空港工业区',
      geofence_radius: 220,
      accommodation_provided: 1,
      meals_provided: 1,
      insurance_provided: 1,
      work_hours: '上午7:30-11:30, 下午13:30-17:30',
      description: '钢结构厂房焊接工程。要求持有焊工证，二保焊、氩弧焊熟练，可独立完成焊接作业。',
      status: 'open',
      wage_deposit_amount: 75000,
      deposit_paid: 1,
      created_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      enterprise: {
        id: 57,
        user_id: 0,
        company_name: '顺义钢结构工程公司',
        verified: 1,
        credit_score: 93,
        total_projects: 52,
        total_workers_hired: 780,
        created_at: '',
        updated_at: '',
      } as Enterprise,
      application_count: 12,
    },
  ]

  const fetchJobs = async () => {
    setLoading(true)
    try {
      setJobs(mockJobs)
      setTotal(mockJobs.length * 3)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleSearch = () => {
    setPage(1)
    fetchJobs()
  }

  const handleApply = async () => {
    if (!user?.face_verified) {
      Modal.warning({
        title: '请先完成人脸识别验证',
        content: '为保障您的权益和工资安全，申请工作前需先完成人脸识别验证。',
        okText: '去验证',
        onOk: () => {
          window.location.href = '/worker/settings'
        },
      })
      return
    }
    setApplyLoading(true)
    try {
      message.success(`已成功申请「${currentJob?.title}」！请在"我的申请"中查看进度`)
      setDetailVisible(false)
    } catch {
      message.error('申请失败')
    } finally {
      setApplyLoading(false)
    }
  }

  const openDetail = (job: JobPostWithEnterprise) => {
    setCurrentJob(job)
    setDetailVisible(true)
  }

  const filteredJobs = jobs.filter((job) => {
    if (keyword && !job.title.includes(keyword) && !job.work_location.includes(keyword)) return false
    if (skill && job.skill_required !== skill) return false
    if (wageRange[0] > 0 && job.daily_wage < wageRange[0]) return false
    if (wageRange[1] < 1000 && job.daily_wage > wageRange[1]) return false
    if (accommodation && !job.accommodation_provided) return false
    if (meals && !job.meals_provided) return false
    if (insurance && !job.insurance_provided) return false
    return true
  })

  return (
    <div>
      <Card
        style={{ borderRadius: 12, marginBottom: 24 }}
        styles={{ body: { padding: 20 } }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={24} md={10}>
              <Search
                placeholder="搜索职位名称或工作地点"
                prefix={<SearchOutlined />}
                allowClear
                enterButton="搜索"
                size="large"
                onSearch={handleSearch}
                onChange={(e) => setKeyword(e.target.value)}
                value={keyword}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="选择工种"
                size="large"
                style={{ width: '100%' }}
                value={skill || undefined}
                onChange={(v) => setSkill(v || '')}
                allowClear
              >
                {SKILL_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  日薪范围：¥{wageRange[0]} - ¥{wageRange[1]}
                </Text>
                <Slider
                  range
                  min={0}
                  max={1000}
                  step={50}
                  value={wageRange}
                  onChange={setWageRange}
                  style={{ margin: 0 }}
                />
              </Space>
            </Col>
          </Row>

          <Row gutter={[16, 8]} align="middle">
            <Col>
              <Text type="secondary" style={{ fontSize: 13 }}>
                <FilterOutlined style={{ marginRight: 4 }} /> 食宿条件：
              </Text>
            </Col>
            <Col>
              <Checkbox checked={accommodation} onChange={(e) => setAccommodation(e.target.checked)}>
                <HomeOutlined style={{ marginRight: 4 }} /> 提供住宿
              </Checkbox>
            </Col>
            <Col>
              <Checkbox checked={meals} onChange={(e) => setMeals(e.target.checked)}>
                <CoffeeOutlined style={{ marginRight: 4 }} /> 提供餐饮
              </Checkbox>
            </Col>
            <Col>
              <Checkbox checked={insurance} onChange={(e) => setInsurance(e.target.checked)}>
                <SafetyCertificateOutlined style={{ marginRight: 4 }} /> 提供保险
              </Checkbox>
            </Col>
            <Col flex="auto" style={{ textAlign: 'right' }}>
              <Button
                onClick={() => {
                  setKeyword('')
                  setSkill('')
                  setWageRange([0, 1000])
                  setAccommodation(false)
                  setMeals(false)
                  setInsurance(false)
                }}
              >
                重置筛选
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text type="secondary">
          共找到 <Text strong style={{ color: '#1677ff' }}>{filteredJobs.length}</Text> 条用工需求
        </Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary">暂无符合条件的用工需求，请调整筛选条件</Text>
        </Card>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
          dataSource={filteredJobs}
          renderItem={(job) => (
            <List.Item>
              <Card
                hoverable
                style={{ borderRadius: 12, height: '100%' }}
                styles={{ body: { padding: 20 } }}
                onClick={() => openDetail(job)}
              >
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div>
                    <Title level={5} style={{ margin: 0, marginBottom: 6, lineHeight: 1.4 }}>
                      {job.title}
                    </Title>
                    <Space size={8} align="center">
                      <Avatar
                        size={24}
                        style={{ background: '#1677ff', fontSize: 12 }}
                        icon={<BankOutlined />}
                      />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {job.enterprise?.company_name}
                      </Text>
                      {job.enterprise?.verified ? (
                        <Badge status="success" text={<span style={{ fontSize: 12, color: '#52c41a' }}>已认证</span>} />
                      ) : null}
                    </Space>
                  </div>

                  <Space wrap split={<span style={{ color: '#e8e8e8' }}>|</span>} size={10}>
                    <Tag color="blue" style={{ margin: 0 }}>{job.skill_required}</Tag>
                    <Text style={{ fontSize: 13 }}>
                      <CalendarOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                      {dayjs(job.start_date).format('MM/DD')} - {dayjs(job.end_date).format('MM/DD')}
                    </Text>
                  </Space>

                  <div>
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>日薪</Text>
                    <Text strong style={{ color: '#cf1322', fontSize: 26, fontWeight: 700, marginLeft: 8 }}>
                      ¥{job.daily_wage}
                    </Text>
                    <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>/天</span>
                  </div>

                  <Space wrap size={6}>
                    {job.accommodation_provided ? (
                      <Tag color="geekblue" style={{ fontSize: 12 }} icon={<HomeOutlined />}>包住宿</Tag>
                    ) : null}
                    {job.meals_provided ? (
                      <Tag color="green" style={{ fontSize: 12 }} icon={<CoffeeOutlined />}>包餐饮</Tag>
                    ) : null}
                    {job.insurance_provided ? (
                      <Tag color="purple" style={{ fontSize: 12 }} icon={<SafetyCertificateOutlined />}>有保险</Tag>
                    ) : null}
                    {job.deposit_paid ? (
                      <Tag color="gold" style={{ fontSize: 12 }} icon={<WalletOutlined />}>工资担保</Tag>
                    ) : null}
                  </Space>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8c8c8c', fontSize: 13 }}>
                    <EnvironmentOutlined />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {job.work_location}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: 10,
                      borderTop: '1px dashed #f0f0f0',
                    }}
                  >
                    <Space size={4} style={{ color: '#8c8c8c', fontSize: 13 }}>
                      <TeamOutlined />
                      招{job.workers_needed}人 · 已申请{job.application_count || 0}人
                    </Space>
                    <Space size={4} style={{ color: '#faad14', fontSize: 13 }}>
                      <StarOutlined />
                      信用{job.enterprise?.credit_score || 0}分
                    </Space>
                  </div>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}

      {filteredJobs.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger={false}
            onChange={(p) => setPage(p)}
          />
        </div>
      )}

      <Modal
        title={currentJob?.title}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          <Button
            key="apply"
            type="primary"
            size="large"
            loading={applyLoading}
            onClick={handleApply}
          >
            立即申请
          </Button>,
        ]}
      >
        {currentJob && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space align="center" size={10}>
                <Avatar size={40} style={{ background: '#1677ff' }} icon={<BankOutlined />} />
                <div>
                  <Text strong style={{ fontSize: 15 }}>{currentJob.enterprise?.company_name}</Text>
                  <div>
                    {currentJob.enterprise?.verified ? (
                      <Tag color="success" style={{ marginRight: 6 }}>企业已认证</Tag>
                    ) : null}
                    <Tag color="gold" style={{ marginRight: 6 }}>
                      信用{currentJob.enterprise?.credit_score}分
                    </Tag>
                    <Tag color="blue" style={{ margin: 0 }}>
                      累计项目{currentJob.enterprise?.total_projects}个
                    </Tag>
                  </div>
                </div>
              </Space>
            </Space>

            <Divider style={{ margin: 0 }} />

            <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c' }}>
              <Descriptions.Item label="工种">
                <Tag color="blue">{currentJob.skill_required}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="招聘人数">
                {currentJob.workers_needed}人
              </Descriptions.Item>
              <Descriptions.Item label="工期">
                <CalendarOutlined style={{ marginRight: 4 }} />
                {dayjs(currentJob.start_date).format('YYYY/MM/DD')} - {dayjs(currentJob.end_date).format('YYYY/MM/DD')}
                <Text type="secondary" style={{ marginLeft: 6 }}>
                  （{dayjs(currentJob.end_date).diff(currentJob.start_date, 'day')}天）
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="日薪">
                <Text strong style={{ color: '#cf1322', fontSize: 18 }}>
                  ¥{currentJob.daily_wage}
                </Text>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}> /天</span>
              </Descriptions.Item>
              <Descriptions.Item label="工作时间" span={2}>
                {currentJob.work_hours || '面议'}
              </Descriptions.Item>
              <Descriptions.Item label="工作地点" span={2}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {currentJob.work_location}
              </Descriptions.Item>
            </Descriptions>

            <Card
              size="small"
              title={<Space><StarOutlined style={{ color: '#faad14' }} /> 福利保障</Space>}
              style={{ borderRadius: 8 }}
            >
              <Row gutter={[16, 12]}>
                <Col span={8}>
                  <Space size={6}>
                    <HomeOutlined style={{ color: currentJob.accommodation_provided ? '#52c41a' : '#d9d9d9' }} />
                    <Text delete={!currentJob.accommodation_provided} style={{ fontSize: 13 }}>
                      {currentJob.accommodation_provided ? '住宿：' + (currentJob.accommodation_detail || '提供住宿') : '不提供住宿'}
                    </Text>
                  </Space>
                </Col>
                <Col span={8}>
                  <Space size={6}>
                    <CoffeeOutlined style={{ color: currentJob.meals_provided ? '#52c41a' : '#d9d9d9' }} />
                    <Text delete={!currentJob.meals_provided} style={{ fontSize: 13 }}>
                      {currentJob.meals_provided ? '餐饮：' + (currentJob.meals_detail || '提供餐饮') : '不提供餐饮'}
                    </Text>
                  </Space>
                </Col>
                <Col span={8}>
                  <Space size={6}>
                    <SafetyCertificateOutlined style={{ color: currentJob.insurance_provided ? '#52c41a' : '#d9d9d9' }} />
                    <Text delete={!currentJob.insurance_provided} style={{ fontSize: 13 }}>
                      {currentJob.insurance_provided ? '保险：' + (currentJob.insurance_detail || '提供保险') : '不提供保险'}
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              title="项目描述"
              style={{ borderRadius: 8 }}
            >
              <Text style={{ fontSize: 14, lineHeight: 1.8 }}>
                {currentJob.description || '暂无详细描述'}
              </Text>
            </Card>

            <Alert
              type="info"
              showIcon
              message="工资担保保障"
              description={`该项目已缴纳工资担保金 ¥${(currentJob.wage_deposit_amount || 0).toLocaleString()}，您的劳动报酬有平台保障。申请成功后签订电子合同，工资将按月从担保金中发放。`}
              style={{ borderRadius: 8 }}
            />
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default JobList
