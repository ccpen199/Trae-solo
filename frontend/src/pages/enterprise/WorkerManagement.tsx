import { useState } from 'react'
import {
  Card,
  Select,
  Input,
  Button,
  Row,
  Col,
  Space,
  Tag,
  Avatar,
  Modal,
  Rate,
  Progress,
  List,
  Statistic,
  Table,
  Badge,
  Divider,
  Typography,
  Empty,
  Form,
  InputNumber,
  message,
  Tooltip,
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { TextArea } = Input

interface WorkerItem {
  id: number
  real_name: string
  avatar_url?: string
  primary_skill: string
  craftsman_level: number
  craftsman_score: number
  work_years: number
  attendance_days: number
  total_hours: number
  attendance_rate: number
  phone: string
  quality_score: number
  peer_score: number
  join_date: string
  certificates: Array<{ name: string; verified: boolean }>
  attendance_records: Array<{ date: string; status: string; hours: number }>
  quality_records: Array<{ date: string; score: number; items: string }>
  peer_reviews: Array<{ reviewer: string; score: number; content: string; date: string }>
}

const mockWorkers: WorkerItem[] = [
  {
    id: 1,
    real_name: '张伟',
    primary_skill: '木工',
    craftsman_level: 3,
    craftsman_score: 4.6,
    work_years: 8,
    attendance_days: 22,
    total_hours: 176,
    attendance_rate: 95,
    phone: '138****1234',
    quality_score: 4.7,
    peer_score: 4.5,
    join_date: '2026-05-01',
    certificates: [
      { name: '高级木工证书', verified: true },
      { name: '安全生产培训证', verified: true },
    ],
    attendance_records: [
      { date: '2026-06-20', status: '正常', hours: 8 },
      { date: '2026-06-19', status: '正常', hours: 8 },
      { date: '2026-06-18', status: '迟到', hours: 7.5 },
      { date: '2026-06-17', status: '正常', hours: 8 },
      { date: '2026-06-16', status: '正常', hours: 8 },
    ],
    quality_records: [
      { date: '2026-06-15', score: 4.8, items: '吊顶安装平整、阴阳角顺直' },
      { date: '2026-06-10', score: 4.5, items: '门窗套安装牢固、缝隙均匀' },
    ],
    peer_reviews: [
      { reviewer: '李强', score: 5, content: '技术过硬，配合默契', date: '2026-06-18' },
      { reviewer: '王强', score: 4, content: '干活认真，值得信任', date: '2026-06-12' },
    ],
  },
  {
    id: 2,
    real_name: '李强',
    primary_skill: '木工',
    craftsman_level: 2,
    craftsman_score: 4.2,
    work_years: 5,
    attendance_days: 20,
    total_hours: 156,
    attendance_rate: 88,
    phone: '139****5678',
    quality_score: 4.3,
    peer_score: 4.4,
    join_date: '2026-05-10',
    certificates: [
      { name: '中级木工证书', verified: true },
    ],
    attendance_records: [
      { date: '2026-06-20', status: '正常', hours: 8 },
      { date: '2026-06-19', status: '正常', hours: 8 },
      { date: '2026-06-18', status: '正常', hours: 8 },
    ],
    quality_records: [
      { date: '2026-06-14', score: 4.3, items: '隔断施工质量合格' },
    ],
    peer_reviews: [
      { reviewer: '张伟', score: 4, content: '配合度不错', date: '2026-06-16' },
    ],
  },
  {
    id: 3,
    real_name: '王强',
    primary_skill: '瓦工',
    craftsman_level: 4,
    craftsman_score: 4.8,
    work_years: 12,
    attendance_days: 25,
    total_hours: 200,
    attendance_rate: 100,
    phone: '136****9012',
    quality_score: 4.9,
    peer_score: 4.8,
    join_date: '2026-04-20',
    certificates: [
      { name: '高级瓦工证书', verified: true },
      { name: '特种作业操作证', verified: true },
      { name: '安全生产培训证', verified: true },
    ],
    attendance_records: [
      { date: '2026-06-20', status: '正常', hours: 8 },
      { date: '2026-06-19', status: '正常', hours: 8 },
      { date: '2026-06-18', status: '正常', hours: 8 },
      { date: '2026-06-17', status: '正常', hours: 8 },
    ],
    quality_records: [
      { date: '2026-06-18', score: 5, items: '地面砖铺设平整、空鼓率0.5%以下' },
      { date: '2026-06-12', score: 4.9, items: '墙面抹灰垂直度符合标准' },
    ],
    peer_reviews: [
      { reviewer: '张伟', score: 5, content: '老师傅，技术没得说', date: '2026-06-17' },
    ],
  },
  {
    id: 4,
    real_name: '赵六',
    primary_skill: '电工',
    craftsman_level: 3,
    craftsman_score: 4.5,
    work_years: 7,
    attendance_days: 18,
    total_hours: 144,
    attendance_rate: 90,
    phone: '137****3456',
    quality_score: 4.4,
    peer_score: 4.3,
    join_date: '2026-05-15',
    certificates: [
      { name: '电工特种作业操作证', verified: true },
      { name: '高压电工证', verified: false },
    ],
    attendance_records: [
      { date: '2026-06-20', status: '正常', hours: 8 },
      { date: '2026-06-19', status: '请假', hours: 0 },
    ],
    quality_records: [
      { date: '2026-06-16', score: 4.5, items: '线路排布规范、标识清晰' },
    ],
    peer_reviews: [],
  },
]

const projectOptions = [
  { value: 'all', label: '全部项目' },
  { value: 'cbd', label: 'CBD办公楼装修项目' },
  { value: 'street', label: '商业步行街改造项目' },
  { value: 'residential', label: '住宅小区配套工程' },
]

const skillOptions = [
  { value: 'all', label: '全部工种' },
  { value: '木工', label: '木工' },
  { value: '瓦工', label: '瓦工' },
  { value: '电工', label: '电工' },
  { value: '水暖工', label: '水暖工' },
  { value: '油漆工', label: '油漆工' },
]

const levelOptions = [
  { value: 'all', label: '全部匠级' },
  { value: '5', label: 'Lv.5 大师级' },
  { value: '4', label: 'Lv.4 高级' },
  { value: '3', label: 'Lv.3 中级' },
  { value: '2', label: 'Lv.2 初级' },
  { value: '1', label: 'Lv.1 入门' },
]

function WorkerManagement() {
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedSkill, setSelectedSkill] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [currentWorker, setCurrentWorker] = useState<WorkerItem | null>(null)
  const [reviewForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState('attendance')

  const filteredWorkers = mockWorkers.filter((w) => {
    if (selectedSkill !== 'all' && w.primary_skill !== selectedSkill) return false
    if (selectedLevel !== 'all' && String(w.craftsman_level) !== selectedLevel) return false
    if (keyword && !w.real_name.includes(keyword)) return false
    return true
  })

  const openDetailModal = (worker: WorkerItem) => {
    setCurrentWorker(worker)
    setActiveTab('attendance')
    setDetailModalOpen(true)
  }

  const openReviewModal = (worker: WorkerItem) => {
    setCurrentWorker(worker)
    reviewForm.resetFields()
    setReviewModalOpen(true)
  }

  const handleReviewSubmit = async () => {
    try {
      const values = await reviewForm.validateFields()
      console.log('submit review:', values)
      message.success('评价提交成功')
      setReviewModalOpen(false)
    } catch {}
  }

  const columns: ColumnsType<WorkerItem> = [
    {
      title: '工人信息',
      dataIndex: 'real_name',
      key: 'name',
      width: 280,
      render: (text, record) => (
        <Space size={12}>
          <Avatar
            size={52}
            style={{
              background: 'linear-gradient(135deg, #1890ff, #722ed1)',
              fontSize: 20,
              fontWeight: 600,
            }}
            icon={<UserOutlined />}
          >
            {text[0]}
          </Avatar>
          <Space direction="vertical" size={4}>
            <Space size={8}>
              <Text strong style={{ fontSize: 16 }}>{text}</Text>
              <Badge
                count={`Lv.${record.craftsman_level}`}
                style={{
                  background: 'linear-gradient(135deg, #faad14, #fa8c16)',
                  boxShadow: 'none',
                  fontSize: 12,
                  padding: '0 8px',
                  minWidth: 'auto',
                  height: 20,
                  lineHeight: '20px',
                }}
              />
              <Rate
                disabled
                allowHalf
                value={record.craftsman_score}
                style={{ fontSize: 12 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{record.craftsman_score}</Text>
            </Space>
            <Space size={8}>
              <Tag color="geekblue">{record.primary_skill}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.work_years}年经验
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                · 入职 {dayjs(record.join_date).format('YYYY-MM-DD')}
              </Text>
            </Space>
          </Space>
        </Space>
      ),
    },
    {
      title: '出勤天数',
      dataIndex: 'attendance_days',
      key: 'days',
      width: 120,
      align: 'center',
      render: (days, record) => (
        <Space direction="vertical" size={4}>
          <Text strong style={{ fontSize: 20, color: '#52c41a' }}>{days}</Text>
          <Progress
            percent={record.attendance_rate}
            size={[80, 6]}
            showInfo={false}
            strokeColor={
              record.attendance_rate >= 95 ? '#52c41a'
              : record.attendance_rate >= 85 ? '#1890ff' : '#faad14'
            }
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            出勤率 {record.attendance_rate}%
          </Text>
        </Space>
      ),
    },
    {
      title: '累计工时',
      dataIndex: 'total_hours',
      key: 'hours',
      width: 120,
      align: 'center',
      render: (hours) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 20, color: '#1890ff' }}>
            {hours}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined /> 小时
          </Text>
        </Space>
      ),
    },
    {
      title: '综合评分',
      key: 'score',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Row gutter={12}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>技能</Text>
              <Progress
                percent={Math.round(record.craftsman_score * 20)}
                size={[60, 4]}
                showInfo={false}
                strokeColor="#1890ff"
              />
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>质量</Text>
              <Progress
                percent={Math.round(record.quality_score * 20)}
                size={[60, 4]}
                showInfo={false}
                strokeColor="#52c41a"
              />
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>出勤</Text>
              <Progress
                percent={record.attendance_rate}
                size={[60, 4]}
                showInfo={false}
                strokeColor="#722ed1"
              />
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>协作</Text>
              <Progress
                percent={Math.round(record.peer_score * 20)}
                size={[60, 4]}
                showInfo={false}
                strokeColor="#faad14"
              />
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetailModal(record)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<StarOutlined />}
            onClick={() => openReviewModal(record)}
          >
            评价
          </Button>
          <Button type="link" size="small" icon={<CalendarOutlined />}>
            考勤
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>工人管理</Title>
        <Space>
          <Text type="secondary">
            <TeamOutlined style={{ marginRight: 4 }} />
            当前项目共 {filteredWorkers.length} 名工人
          </Text>
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              value={selectedProject}
              onChange={setSelectedProject}
              options={projectOptions}
              style={{ width: '100%' }}
              size="large"
              prefix={<EnvironmentOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={selectedSkill}
              onChange={setSelectedSkill}
              options={skillOptions}
              style={{ width: '100%' }}
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={selectedLevel}
              onChange={setSelectedLevel}
              options={levelOptions}
              style={{ width: '100%' }}
              size="large"
              prefix={<SafetyCertificateOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              size="large"
              placeholder="搜索工人姓名"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center' }}>
          <FilterOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            筛选条件：
            {selectedProject === 'all' ? '全部项目' : projectOptions.find((p) => p.value === selectedProject)?.label}
            {' / '}
            {selectedSkill === 'all' ? '全部工种' : selectedSkill}
            {' / '}
            {selectedLevel === 'all' ? '全部匠级' : `Lv.${selectedLevel}`}
          </Text>
        </div>
      </Card>

      <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Table<WorkerItem>
          rowKey="id"
          columns={columns}
          dataSource={filteredWorkers}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 名工人`,
          }}
          locale={{ emptyText: <Empty description="暂无工人数据" /> }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={
          currentWorker ? (
            <Space>
              <Avatar
                size={40}
                style={{ background: 'linear-gradient(135deg, #1890ff, #722ed1)' }}
              >
                {currentWorker.real_name[0]}
              </Avatar>
              <Space direction="vertical" size={0}>
                <Text strong style={{ fontSize: 16 }}>{currentWorker.real_name}</Text>
                <Space size={8}>
                  <Tag color="geekblue">{currentWorker.primary_skill}</Tag>
                  <Tag color="gold">匠级 Lv.{currentWorker.craftsman_level}</Tag>
                </Space>
              </Space>
            </Space>
          ) : null
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={880}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
          <Button
            key="review"
            type="primary"
            icon={<StarOutlined />}
            onClick={() => {
              if (currentWorker) openReviewModal(currentWorker)
              setDetailModalOpen(false)
            }}
          >
            评价工人
          </Button>,
        ]}
      >
        {currentWorker && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Card bordered={false} style={{ background: '#e6f7ff', borderRadius: 8, textAlign: 'center' }}>
                  <Statistic
                    title="出勤天数"
                    value={currentWorker.attendance_days}
                    suffix="天"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8, textAlign: 'center' }}>
                  <Statistic
                    title="累计工时"
                    value={currentWorker.total_hours}
                    suffix="小时"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 8, textAlign: 'center' }}>
                  <Statistic
                    title="综合评分"
                    value={currentWorker.craftsman_score}
                    precision={1}
                    suffix="/5"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card
              bordered={false}
              style={{ borderRadius: 8 }}
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
                  技能证书
                </Space>
              }
              size="small"
            >
              <Space size={8} wrap>
                {currentWorker.certificates.length > 0 ? (
                  currentWorker.certificates.map((c, i) => (
                    <Tag
                      key={i}
                      icon={c.verified ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      color={c.verified ? 'success' : 'warning'}
                      style={{ padding: '4px 12px', fontSize: 13 }}
                    >
                      {c.name}
                      {c.verified ? ' 已认证' : ' 待审核'}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">暂无证书信息</Text>
                )}
              </Space>
            </Card>

            <Card
              bordered={false}
              style={{ borderRadius: 8 }}
              size="small"
              tabList={[
                { key: 'attendance', tab: '考勤统计' },
                { key: 'quality', tab: '质检记录' },
                { key: 'peer', tab: '工友评价' },
              ]}
              activeTabKey={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === 'attendance' && (
                <Table
                  rowKey="date"
                  size="small"
                  dataSource={currentWorker.attendance_records}
                  pagination={false}
                  columns={[
                    { title: '日期', dataIndex: 'date', width: 140 },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      width: 120,
                      render: (status) => (
                        <Tag
                          color={
                            status === '正常' ? 'success'
                            : status === '迟到' || status === '早退' ? 'warning'
                            : status === '请假' ? 'default' : 'error'
                          }
                        >
                          {status}
                        </Tag>
                      ),
                    },
                    { title: '工时（小时）', dataIndex: 'hours', width: 120, align: 'center' },
                  ]}
                />
              )}
              {activeTab === 'quality' && (
                <List
                  dataSource={currentWorker.quality_records}
                  locale={{ emptyText: '暂无质检记录' }}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<StarOutlined style={{ color: '#faad14', fontSize: 20 }} />}
                        title={
                          <Space>
                            <Text strong>{item.date}</Text>
                            <Rate disabled allowHalf value={item.score} style={{ fontSize: 14 }} />
                            <Tag color="geekblue">{item.score}分</Tag>
                          </Space>
                        }
                        description={item.items}
                      />
                    </List.Item>
                  )}
                />
              )}
              {activeTab === 'peer' && (
                <List
                  dataSource={currentWorker.peer_reviews}
                  locale={{ emptyText: '暂无工友评价' }}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ background: 'linear-gradient(135deg, #722ed1, #531dab)' }}>
                            {item.reviewer[0]}
                          </Avatar>
                        }
                        title={
                          <Space>
                            <Text strong>{item.reviewer}</Text>
                            <Rate disabled allowHalf value={item.score} style={{ fontSize: 12 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.date}</Text>
                          </Space>
                        }
                        description={item.content}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Space>
        )}
      </Modal>

      <Modal
        title={
          currentWorker ? (
            <Space>
              <StarOutlined style={{ color: '#faad14' }} />
              评价 {currentWorker.real_name}
            </Space>
          ) : null
        }
        open={reviewModalOpen}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModalOpen(false)}
        okText="提交评价"
        cancelText="取消"
        width={560}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            label="技能评分"
            name="skill_score"
            rules={[{ required: true, message: '请给出技能评分' }]}
          >
            <Rate style={{ fontSize: 28 }} />
          </Form.Item>
          <Form.Item
            label="工作态度"
            name="attitude_score"
            rules={[{ required: true, message: '请给出态度评分' }]}
          >
            <Rate style={{ fontSize: 28 }} />
          </Form.Item>
          <Form.Item
            label="团队协作"
            name="teamwork_score"
            rules={[{ required: true, message: '请给出协作评分' }]}
          >
            <Rate style={{ fontSize: 28 }} />
          </Form.Item>
          <Form.Item label="评价内容" name="content">
            <TextArea rows={4} placeholder="请输入评价内容，帮助其他企业了解该工人" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default WorkerManagement
