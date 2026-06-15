import React, { useState } from 'react'
import {
  Typography,
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Row,
  Col,
  Statistic,
  Drawer,
  Descriptions,
  Timeline,
  List,
  Avatar,
  Rate,
  Progress,
  DatePicker,
  Menu,
  Divider,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  RollbackOutlined,
  ArrowRightOutlined,
  StarOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
  InboxOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  PaperClipOutlined,
  MessageOutlined,
  ReloadOutlined,
  HistoryOutlined,
  SolutionOutlined,
  SendOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { MenuProps } from 'antd'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const menuItems: MenuProps['items'] = [
  { key: 'list', icon: <FileTextOutlined />, label: '工单列表' },
  { key: 'mine', icon: <InboxOutlined />, label: '待我处理' },
  { key: 'done', icon: <CheckSquareOutlined />, label: '我已办结' },
  { key: 'satisfaction', icon: <StarOutlined />, label: '满意度评价' },
  { key: 'stats', icon: <BarChartOutlined />, label: '工单统计' }
]

const mockTickets = [
  {
    key: '1',
    ticketNo: '2024061400001',
    title: '关于兴庆区某小区周边道路破损的维修诉求',
    category: '城市建设',
    type: '投诉建议',
    source: '12345热线',
    priority: '一般',
    dept: '银川市住建局',
    status: '待受理',
    submitTime: '2024-06-14 09:30:25',
    submitter: '张先生',
    phone: '138****5678',
    address: '银川市兴庆区XX路XX小区北门'
  },
  {
    key: '2',
    ticketNo: '2024061400002',
    title: '营业执照办理进度查询及咨询',
    category: '市场监管',
    type: '咨询',
    source: '网上办事大厅',
    priority: '一般',
    dept: '银川市市场监督管理局',
    status: '处理中',
    submitTime: '2024-06-14 10:15:42',
    submitter: '李女士',
    phone: '139****1234',
    address: '银川市金凤区XX街XX号'
  },
  {
    key: '3',
    ticketNo: '2024061400003',
    title: '反映西夏区某工地夜间施工噪音扰民问题',
    category: '环境保护',
    type: '投诉',
    source: '12345热线',
    priority: '紧急',
    dept: '银川市生态环境局',
    status: '处理中',
    submitTime: '2024-06-14 11:20:18',
    submitter: '王女士',
    phone: '137****8765',
    address: '银川市西夏区XX路XX工地'
  },
  {
    key: '4',
    ticketNo: '2024061400004',
    title: '申请低保待遇相关政策咨询',
    category: '民政服务',
    type: '咨询',
    source: '12345热线',
    priority: '一般',
    dept: '银川市民政局',
    status: '已办结',
    submitTime: '2024-06-13 14:30:00',
    submitter: '赵先生',
    phone: '136****4321',
    address: '银川市兴庆区XX街道'
  },
  {
    key: '5',
    ticketNo: '2024061400005',
    title: '紧急求助：金凤区某小区突发停水',
    category: '水务服务',
    type: '求助',
    source: '12345热线',
    priority: '特急',
    dept: '银川市水务局',
    status: '处理中',
    submitTime: '2024-06-14 08:00:15',
    submitter: '孙先生',
    phone: '135****9876',
    address: '银川市金凤区XX小区'
  },
  {
    key: '6',
    ticketNo: '2024061400006',
    title: '表扬兴庆区政务服务中心窗口工作人员',
    category: '表扬感谢',
    type: '表扬',
    source: '网上办事大厅',
    priority: '一般',
    dept: '银川市审批服务管理局',
    status: '已办结',
    submitTime: '2024-06-13 16:45:30',
    submitter: '周女士',
    phone: '134****5678',
    address: '银川市兴庆区'
  },
  {
    key: '7',
    ticketNo: '2024061400007',
    title: '医保报销相关问题咨询',
    category: '医疗卫生',
    type: '咨询',
    source: '12345热线',
    priority: '一般',
    dept: '银川市医疗保障局',
    status: '已转办',
    submitTime: '2024-06-14 09:00:00',
    submitter: '吴先生',
    phone: '133****2345',
    address: '银川市西夏区'
  },
  {
    key: '8',
    ticketNo: '2024061400008',
    title: '反映某公交站牌设置不合理问题',
    category: '交通运输',
    type: '建议',
    source: '12345热线',
    priority: '一般',
    dept: '银川市交通运输局',
    status: '待受理',
    submitTime: '2024-06-14 10:30:00',
    submitter: '郑女士',
    phone: '132****3456',
    address: '银川市金凤区XX路'
  },
  {
    key: '9',
    ticketNo: '2024061400009',
    title: '小区物业费收取标准咨询',
    category: '价格监管',
    type: '咨询',
    source: '网上办事大厅',
    priority: '一般',
    dept: '银川市发展和改革委员会',
    status: '已撤销',
    submitTime: '2024-06-12 15:00:00',
    submitter: '冯先生',
    phone: '131****4567',
    address: '银川市兴庆区XX小区'
  },
  {
    key: '10',
    ticketNo: '2024061400010',
    title: '建议增加公园健身器材数量',
    category: '文化体育',
    type: '建议',
    source: '12345热线',
    priority: '一般',
    dept: '银川市体育局',
    status: '已办结',
    submitTime: '2024-06-11 11:20:00',
    submitter: '陈女士',
    phone: '130****5678',
    address: '银川市西夏区XX公园'
  }
]

const mockSatisfactionList = [
  { key: '1', ticketNo: '2024061000005', title: '关于小区周边道路维修的诉求', category: '城市建设', stars: 5, content: '处理速度快，工作人员态度好，问题得到了圆满解决，非常满意！', time: '2024-06-14 10:30', isPublic: true, dept: '银川市住建局' },
  { key: '2', ticketNo: '2024060800012', title: '营业执照办理进度查询', category: '市场监管', stars: 4, content: '整体服务不错，就是办理周期稍长，希望能够进一步优化流程。', time: '2024-06-13 15:20', isPublic: true, dept: '银川市市场监督管理局' },
  { key: '3', ticketNo: '2024060500023', title: '反映某街道噪音污染问题', category: '环境保护', stars: 2, content: '处理效果一般，噪音问题没有得到根本解决，希望后续跟进。', time: '2024-06-12 09:45', isPublic: false, dept: '银川市生态环境局' },
  { key: '4', ticketNo: '2024060300015', title: '申请低保待遇咨询', category: '民政服务', stars: 5, content: '工作人员非常耐心，详细解答了所有疑问，服务态度一级棒！', time: '2024-06-10 14:10', isPublic: true, dept: '银川市民政局' },
  { key: '5', ticketNo: '2024060100008', title: '关于停水的紧急求助', category: '水务服务', stars: 3, content: '响应速度还可以，但修复时间比预期长，希望能提高应急处理效率。', time: '2024-06-08 11:30', isPublic: false, dept: '银川市水务局' },
  { key: '6', ticketNo: '2024052800020', title: '表扬社区工作人员', category: '表扬感谢', stars: 5, content: '社区工作人员热心周到，真正做到了为人民服务，为他们点赞！', time: '2024-06-05 16:00', isPublic: true, dept: '银川市民政局' },
  { key: '7', ticketNo: '2024052500018', title: '教育入学政策咨询', category: '教育服务', stars: 4, content: '政策解释清晰，但希望能有更多线上咨询渠道，方便市民。', time: '2024-06-02 10:15', isPublic: true, dept: '银川市教育局' },
  { key: '8', ticketNo: '2024052000025', title: '反映小区物业管理问题', category: '住房保障', stars: 1, content: '多次反映都没有实质性进展，对处理结果很不满意。', time: '2024-05-28 15:40', isPublic: false, dept: '银川市住建局' }
]

const mockFlowRecords = [
  { time: '2024-06-14 09:30:25', action: '工单提交', user: '张先生', desc: '市民通过12345热线提交诉求' },
  { time: '2024-06-14 09:35:10', action: '工单受理', user: '话务员-小李', desc: '已受理工单，分配至银川市住建局' },
  { time: '2024-06-14 10:00:00', action: '部门签收', user: '住建局-王科长', desc: '已签收工单，安排工作人员现场核实' },
  { time: '2024-06-14 14:30:00', action: '现场核实', user: '住建局-李工', desc: '已到现场核实，情况属实，计划下周进行维修' },
  { time: '2024-06-14 16:00:00', action: '计划安排', user: '住建局-张工', desc: '已纳入本周维修计划，预计3个工作日内完成' }
]

const TicketStatusTag = ({ status }: { status: string }) => {
  const statusMap: Record<string, { color: string; icon: any }> = {
    待受理: { color: 'orange', icon: <ClockCircleOutlined /> },
    处理中: { color: 'blue', icon: <PlayCircleOutlined /> },
    已转办: { color: 'purple', icon: <ArrowRightOutlined /> },
    已办结: { color: 'green', icon: <CheckCircleOutlined /> },
    已撤销: { color: 'default', icon: <CloseCircleOutlined /> }
  }
  const config = statusMap[status] || statusMap['待受理']
  return <Tag icon={config.icon} color={config.color}>{status}</Tag>
}

const PriorityTag = ({ priority }: { priority: string }) => {
  const colorMap: Record<string, string> = {
    一般: 'default',
    紧急: 'orange',
    特急: 'red'
  }
  return <Tag color={colorMap[priority] || 'default'}>{priority}</Tag>
}

const Tickets: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('list')
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const handleViewDetail = (ticket: any) => {
    setSelectedTicket(ticket)
    setDetailVisible(true)
  }

  const getTicketColumns = () => [
    { title: '工单号', dataIndex: 'ticketNo', key: 'ticketNo', width: 150 },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: any) => (
        <a onClick={() => handleViewDetail(record)}>{text}</a>
      )
    },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    { title: '来源', dataIndex: 'source', key: 'source', width: 110 },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (text: string) => <PriorityTag priority={text} />
    },
    { title: '指派部门', dataIndex: 'dept', key: 'dept', width: 160 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (text: string) => <TicketStatusTag status={text} />
    },
    { title: '提交时间', dataIndex: 'submitTime', key: 'submitTime', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<MessageOutlined />}>
            办理
          </Button>
        </Space>
      )
    }
  ]

  const renderTicketList = (tickets: any[]) => (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <div style={{ marginBottom: 6, color: '#666', fontSize: 12 }}>工单编号</div>
            <Input placeholder="请输入工单编号" allowClear />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 6, color: '#666', fontSize: 12 }}>标题关键词</div>
            <Input placeholder="请输入标题关键词" allowClear />
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: 6, color: '#666', fontSize: 12 }}>工单分类</div>
            <Select placeholder="请选择" style={{ width: '100%' }} allowClear>
              <Option value="1">城市建设</Option>
              <Option value="2">市场监管</Option>
              <Option value="3">环境保护</Option>
              <Option value="4">民政服务</Option>
              <Option value="5">医疗卫生</Option>
            </Select>
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: 6, color: '#666', fontSize: 12 }}>优先级</div>
            <Select placeholder="请选择" style={{ width: '100%' }} allowClear>
              <Option value="normal">一般</Option>
              <Option value="urgent">紧急</Option>
              <Option value="emergency">特急</Option>
            </Select>
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: 6, color: '#666', fontSize: 12 }}>状态</div>
            <Select placeholder="请选择" style={{ width: '100%' }} allowClear>
              <Option value="pending">待受理</Option>
              <Option value="processing">处理中</Option>
              <Option value="transferred">已转办</Option>
              <Option value="done">已办结</Option>
              <Option value="canceled">已撤销</Option>
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 6, color: '#666', fontSize: 12 }}>来源</div>
            <Select placeholder="请选择" style={{ width: '100%' }} allowClear>
              <Option value="hotline">12345热线</Option>
              <Option value="online">网上办事大厅</Option>
              <Option value="app">APP</Option>
              <Option value="wechat">微信公众号</Option>
            </Select>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 6, color: '#666', fontSize: 12 }}>时间范围</div>
            <RangePicker style={{ width: '100%' }} />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 6, color: '#666', fontSize: 12 }}>指派部门</div>
            <Select placeholder="请选择部门" style={{ width: '100%' }} allowClear>
              <Option value="1">银川市住建局</Option>
              <Option value="2">银川市市场监督管理局</Option>
              <Option value="3">银川市生态环境局</Option>
              <Option value="4">银川市民政局</Option>
            </Select>
          </Col>
          <Col span={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />}>查询</Button>
              <Button icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card style={{ background: '#fff7e6' }}>
            <Statistic
              title="待处理"
              value={23}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: '#e6f4ff' }}>
            <Statistic
              title="处理中"
              value={45}
              valueStyle={{ color: '#0958d9' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: '#f6ffed' }}>
            <Statistic
              title="已办结"
              value={1256}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: '#f5f5f5' }}>
            <Statistic
              title="已撤销"
              value={32}
              valueStyle={{ color: '#8c8c8c' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: '#fff0f6' }}>
            <Statistic
              title="今日新增"
              value={28}
              valueStyle={{ color: '#eb2f96' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: '#f9f0ff' }}>
            <Statistic
              title="超期预警"
              value={5}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={`工单列表（共 1,356 条）`}
        extra={
          <Space>
            <Button type="primary" icon={<RollbackOutlined />} disabled={selectedRowKeys.length === 0}>
              批量转办
            </Button>
            <Button icon={<SendOutlined />} disabled={selectedRowKeys.length === 0}>
              批量分派
            </Button>
          </Space>
        }
      >
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys
          }}
          columns={getTicketColumns()}
          dataSource={tickets}
          pagination={{ pageSize: 10, total: 1356, showSizeChanger: true }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )

  const renderSatisfactionTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 'bold', color: '#faad14', marginBottom: 4 }}>
              96.5%
            </div>
            <div style={{ color: '#666' }}>综合满意度</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#666' }}>响应速度</span>
              <span style={{ color: '#0958d9', fontWeight: 500 }}>4.6 分</span>
            </div>
            <Progress percent={92} strokeColor="#0958d9" size="small" showInfo={false} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#666' }}>处理态度</span>
              <span style={{ color: '#52c41a', fontWeight: 500 }}>4.8 分</span>
            </div>
            <Progress percent={96} strokeColor="#52c41a" size="small" showInfo={false} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#666' }}>解决效果</span>
              <span style={{ color: '#fa8c16', fontWeight: 500 }}>4.5 分</span>
            </div>
            <Progress percent={90} strokeColor="#fa8c16" size="small" showInfo={false} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="好评率趋势" style={{ marginBottom: 16 }}>
            <ReactECharts
              option={{
                tooltip: { trigger: 'axis' },
                legend: { data: ['好评率', '参评人数'], top: 0, right: 0 },
                grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
                xAxis: {
                  type: 'category',
                  data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周']
                },
                yAxis: [
                  { type: 'value', name: '好评率(%)', min: 80, max: 100 },
                  { type: 'value', name: '参评人数' }
                ],
                series: [
                  {
                    name: '好评率',
                    type: 'line',
                    smooth: true,
                    data: [94.2, 95.1, 95.8, 96.3, 96.0, 96.5],
                    itemStyle: { color: '#0958d9' },
                    areaStyle: {
                      color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                          { offset: 0, color: 'rgba(9, 88, 217, 0.3)' },
                          { offset: 1, color: 'rgba(9, 88, 217, 0.05)' }
                        ]
                      }
                    }
                  },
                  {
                    name: '参评人数',
                    type: 'bar',
                    yAxisIndex: 1,
                    data: [120, 150, 180, 210, 190, 230],
                    itemStyle: { color: '#91caff' }
                  }
                ]
              }}
              style={{ height: 280 }}
            />
          </Card>

          <Card title="评价列表">
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Select placeholder="评价星级" style={{ width: 120 }} allowClear>
                  <Option value="5">5星</Option>
                  <Option value="4">4星</Option>
                  <Option value="3">3星</Option>
                  <Option value="2">2星</Option>
                  <Option value="1">1星</Option>
                </Select>
                <Select placeholder="工单分类" style={{ width: 150 }} allowClear>
                  <Option value="1">城市建设</Option>
                  <Option value="2">市场监管</Option>
                </Select>
                <Button type="primary" icon={<SearchOutlined />}>查询</Button>
              </Space>
            </div>
            <List
              dataSource={mockSatisfactionList}
              renderItem={(item) => (
                <List.Item key={item.key}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 500, marginRight: 12 }}>{item.title}</span>
                          <Tag color="blue">{item.category}</Tag>
                        </div>
                        <Rate disabled value={item.stars} style={{ fontSize: 14 }} />
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ color: '#666', marginBottom: 8 }}>
                          工单编号：{item.ticketNo} | 处理部门：{item.dept} | 评价时间：{item.time}
                          {item.isPublic && <Tag color="green" style={{ marginLeft: 8 }}>公开</Tag>}
                        </div>
                        <div style={{ color: '#333' }}>{item.content}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
              pagination={{ pageSize: 5, total: 256 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="差评工单（需重点关注）">
            {mockSatisfactionList.filter((item) => item.stars <= 2).map((item) => (
              <Card key={item.key} size="small" style={{ marginBottom: 12, background: '#fff2f0' }}>
                <div style={{ fontWeight: 500, color: '#262626', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                  工单号：{item.ticketNo} | {item.dept}
                </div>
                <Rate disabled value={item.stars} style={{ fontSize: 12 }} />
                <div style={{ fontSize: 12, color: '#595959', marginTop: 6 }}>{item.content}</div>
              </Card>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  )

  const renderStatsTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card style={{ textAlign: 'center', background: '#e6f4ff' }}>
            <Statistic
              title="工单总量"
              value={12580}
              valueStyle={{ color: '#0958d9' }}
              suffix={<span style={{ fontSize: 14 }}>件</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ textAlign: 'center', background: '#f6ffed' }}>
            <Statistic
              title="按时办结率"
              value={98.5}
              precision={1}
              valueStyle={{ color: '#52c41a' }}
              suffix={<span style={{ fontSize: 14 }}>%</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ textAlign: 'center', background: '#fff7e6' }}>
            <Statistic
              title="平均处理时长"
              value={2.3}
              precision={1}
              valueStyle={{ color: '#fa8c16' }}
              suffix={<span style={{ fontSize: 14 }}>工作日</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ textAlign: 'center', background: '#fff0f6' }}>
            <Statistic
              title="群众满意度"
              value={96.5}
              precision={1}
              valueStyle={{ color: '#eb2f96' }}
              suffix={<span style={{ fontSize: 14 }}>%</span>}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title="近30天工单量趋势">
            <ReactECharts
              option={{
                tooltip: { trigger: 'axis' },
                legend: { data: ['受理量', '办结量'], top: 0, right: 0 },
                grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
                xAxis: {
                  type: 'category',
                  data: Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
                },
                yAxis: { type: 'value' },
                series: [
                  {
                    name: '受理量',
                    type: 'line',
                    smooth: true,
                    data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330, 310, 280, 250, 270, 300, 320, 290, 260, 240, 280, 310, 295, 285, 275, 265, 255, 245, 235],
                    itemStyle: { color: '#0958d9' },
                    areaStyle: {
                      color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                          { offset: 0, color: 'rgba(9, 88, 217, 0.3)' },
                          { offset: 1, color: 'rgba(9, 88, 217, 0.05)' }
                        ]
                      }
                    }
                  },
                  {
                    name: '办结量',
                    type: 'line',
                    smooth: true,
                    data: [100, 120, 90, 120, 80, 200, 190, 170, 180, 220, 270, 310, 290, 260, 230, 250, 280, 300, 270, 240, 220, 260, 290, 275, 265, 255, 245, 235, 225, 215],
                    itemStyle: { color: '#52c41a' }
                  }
                ]
              }}
              style={{ height: 300 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="工单来源分布">
            <ReactECharts
              option={{
                tooltip: { trigger: 'item' },
                legend: { orient: 'vertical', left: 'left', top: 'center' },
                series: [
                  {
                    name: '来源',
                    type: 'pie',
                    radius: ['45%', '65%'],
                    center: ['65%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
                    label: { show: false },
                    emphasis: {
                      label: { show: true, fontSize: 14, fontWeight: 'bold' }
                    },
                    labelLine: { show: false },
                    data: [
                      { value: 5230, name: '12345热线' },
                      { value: 3120, name: '网上办事大厅' },
                      { value: 2450, name: 'APP' },
                      { value: 1280, name: '微信公众号' },
                      { value: 500, name: '其他' }
                    ],
                    color: ['#0958d9', '#4096ff', '#69b1ff', '#91caff', '#bfdbfe']
                  }
                ]
              }}
              style={{ height: 300 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="各部门工单量排行">
        <ReactECharts
          option={{
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
            xAxis: { type: 'value' },
            yAxis: {
              type: 'category',
              data: ['市住建局', '市市场监管局', '市生态环境局', '市民政局', '市医保局', '市教育局', '市交通局', '市水务局']
            },
            series: [
              {
                name: '工单量',
                type: 'bar',
                data: [2156, 1890, 1567, 1234, 1089, 987, 876, 765],
                itemStyle: {
                  color: {
                    type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: '#0958d9' },
                      { offset: 1, color: '#91caff' }
                    ]
                  },
                  borderRadius: [0, 4, 4, 0]
                },
                barWidth: 24
              }
            ]
          }}
          style={{ height: 350 }}
        />
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeMenu) {
      case 'list':
        return renderTicketList(mockTickets)
      case 'mine':
        return renderTicketList(mockTickets.filter((t) => t.status === '处理中'))
      case 'done':
        return renderTicketList(mockTickets.filter((t) => t.status === '已办结'))
      case 'satisfaction':
        return renderSatisfactionTab()
      case 'stats':
        return renderStatsTab()
      default:
        return renderTicketList(mockTickets)
    }
  }

  return (
    <div>
      <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
        12345工单系统
      </Title>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 200, flexShrink: 0, marginRight: 16 }}>
          <Card bodyStyle={{ padding: 0 }}>
            <Menu
              mode="inline"
              selectedKeys={[activeMenu]}
              items={menuItems}
              onClick={({ key }) => setActiveMenu(key)}
              style={{ borderRight: 'none' }}
            />
          </Card>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderContent()}
        </div>
      </div>

      <Drawer
        title="工单详情"
        placement="right"
        width={720}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedTicket && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{selectedTicket.title}</h3>
                <Space>
                  <Tag color="blue">{selectedTicket.category}</Tag>
                  <TicketStatusTag status={selectedTicket.status} />
                  <PriorityTag priority={selectedTicket.priority} />
                </Space>
              </div>
            </div>

            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="工单号">{selectedTicket.ticketNo}</Descriptions.Item>
              <Descriptions.Item label="工单类型">{selectedTicket.type}</Descriptions.Item>
              <Descriptions.Item label="提交人">{selectedTicket.submitter}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedTicket.phone}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{selectedTicket.submitTime}</Descriptions.Item>
              <Descriptions.Item label="工单来源">{selectedTicket.source}</Descriptions.Item>
              <Descriptions.Item label="指派部门">{selectedTicket.dept}</Descriptions.Item>
              <Descriptions.Item label="事发地点">{selectedTicket.address}</Descriptions.Item>
              <Descriptions.Item label="诉求内容" span={2}>
                {selectedTicket.title}。市民希望相关部门能够尽快处理解决，感谢政府的关心和支持。
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12 }}>流转记录</h4>
              <Card size="small">
                <Timeline
                  items={mockFlowRecords.map((record, index) => ({
                    color: index === mockFlowRecords.length - 1 ? 'blue' : 'gray',
                    children: (
                      <div>
                        <div style={{ fontWeight: 500, color: '#262626' }}>{record.action}</div>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>
                          {record.time} · {record.user}
                        </div>
                        <div style={{ color: '#595959' }}>{record.desc}</div>
                      </div>
                    )
                  }))}
                />
              </Card>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12 }}>
                附件 <Text type="secondary" style={{ fontSize: 12 }}>（共 2 个）</Text>
              </h4>
              <List
                size="small"
                dataSource={[
                  { name: '现场照片1.jpg', size: '2.3 MB' },
                  { name: '现场照片2.jpg', size: '1.8 MB' }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <PaperClipOutlined style={{ color: '#0958d9', marginRight: 8 }} />
                      <span>{item.name}</span>
                      <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>{item.size}</Text>
                    </div>
                  </List.Item>
                )}
              />
            </div>

            <Divider />

            <div>
              <h4 style={{ marginBottom: 12 }}>操作</h4>
              <Space wrap>
                {selectedTicket.status === '待受理' && (
                  <Button type="primary" icon={<CheckCircleOutlined />}>受理工单</Button>
                )}
                <Button icon={<ArrowRightOutlined />}>转办</Button>
                <Button icon={<MessageOutlined />}>回复</Button>
                <Button icon={<ClockCircleOutlined />}>申请延期</Button>
                {selectedTicket.status !== '已办结' && selectedTicket.status !== '已撤销' && (
                  <Button type="primary" icon={<SolutionOutlined />}>办结</Button>
                )}
                <Button icon={<HistoryOutlined />}>查看历史</Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default Tickets
