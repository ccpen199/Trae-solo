import React, { useState, useEffect } from 'react'
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Descriptions,
  Upload,
  Empty,
  Drawer
} from 'antd'
import {
  UploadOutlined,
  CloudUploadOutlined,
  SafetyOutlined,
  BugOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SendOutlined,
  UserOutlined,
  DesktopOutlined,
  ApiOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import {
  getCodeVersions,
  createCodeVersion,
  pushOTA,
  getOTAPushStatus,
  getDeviceBindingGraph,
  getErrorClusters,
  getErrorDetails,
  getFeedbackTickets,
  updateFeedbackStatus,
  getHighFrequencyErrors
} from '../api/admin.js'
import { logOperation } from '../api/operationLog.js'
import dayjs from 'dayjs'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

const mockVersions = [
  {
    id: 'v1',
    version: '2.1.0',
    description: '新增空调支持，优化红外解码算法',
    deviceType: 'all',
    codeCount: 1256,
    status: 'published',
    publishedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    userCount: 1256,
    successRate: 98.5
  },
  {
    id: 'v2',
    version: '2.0.5',
    description: '修复小米电视部分指令不兼容问题',
    deviceType: 'tv',
    codeCount: 456,
    status: 'published',
    publishedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    userCount: 986,
    successRate: 97.2
  },
  {
    id: 'v3',
    version: '2.0.0',
    description: '首个正式版本，支持电视、空调、灯光',
    deviceType: 'all',
    codeCount: 892,
    status: 'archived',
    publishedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    userCount: 2341,
    successRate: 95.8
  },
  {
    id: 'v4',
    version: '2.2.0-beta',
    description: '新增投影仪支持，测试版本',
    deviceType: 'projector',
    codeCount: 156,
    status: 'testing',
    publishedAt: new Date().toISOString(),
    userCount: 25,
    successRate: 0
  }
]

const mockOTAPushes = [
  { id: 'p1', versionId: 'v1', version: '2.1.0', targetUsers: 500, successCount: 492, failedCount: 8, status: 'completed', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'p2', versionId: 'v1', version: '2.1.0', targetUsers: 756, successCount: 756, failedCount: 0, status: 'completed', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'p3', versionId: 'v4', version: '2.2.0-beta', targetUsers: 25, successCount: 12, failedCount: 0, status: 'pushing', createdAt: new Date().toISOString() }
]

const mockErrorClusters = [
  {
    id: 'e1',
    pattern: 'NEC format decode error',
    count: 256,
    affectedUsers: 45,
    affectedDevices: 12,
    severity: 'high',
    firstSeen: new Date(Date.now() - 86400000 * 7).toISOString(),
    lastSeen: new Date().toISOString(),
    sampleCodes: [
      '0001 0001 0020 0020 0040 0020 0020 0040...',
      '0001 0001 0020 0020 0040 0020 0020 0040...'
    ]
  },
  {
    id: 'e2',
    pattern: '空调温度指令无响应',
    count: 128,
    affectedUsers: 23,
    affectedDevices: 8,
    severity: 'medium',
    firstSeen: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
    sampleCodes: []
  },
  {
    id: 'e3',
    pattern: '学习模式超时',
    count: 89,
    affectedUsers: 15,
    affectedDevices: 5,
    severity: 'low',
    firstSeen: new Date(Date.now() - 86400000 * 1).toISOString(),
    lastSeen: new Date(Date.now() - 7200000).toISOString(),
    sampleCodes: []
  }
]

const mockHighFreqErrors = [
  { command: 'power', count: 45, deviceType: 'tv', brand: '小米', errorRate: 12.5 },
  { command: 'temp_up', count: 38, deviceType: 'ac', brand: '格力', errorRate: 8.3 },
  { command: 'volume_up', count: 32, deviceType: 'tv', brand: '海信', errorRate: 6.7 },
  { command: 'input', count: 28, deviceType: 'tv', brand: 'TCL', errorRate: 15.2 }
]

const mockFeedbacks = [
  {
    id: 'f1',
    userId: 'u1',
    userName: '张三',
    title: '小米电视电源键不工作',
    content: '我的小米电视L55M5-AD，电源键按下后没有反应，其他按键正常。',
    deviceType: 'tv',
    deviceBrand: '小米',
    deviceModel: 'L55M5-AD',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    replies: []
  },
  {
    id: 'f2',
    userId: 'u2',
    userName: '李四',
    title: '建议新增支持索尼电视',
    content: '家里有一台索尼KD-65X9500H，希望能支持红外学习。',
    deviceType: 'tv',
    deviceBrand: '索尼',
    deviceModel: 'KD-65X9500H',
    status: 'processing',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    replies: [
      { id: 'r1', content: '感谢您的反馈，我们正在测试索尼电视的兼容性，预计下个版本支持。', createdAt: new Date(Date.now() - 3600000).toISOString(), isAdmin: true }
    ]
  },
  {
    id: 'f3',
    userId: 'u3',
    userName: '王五',
    title: '空调模式切换失败',
    content: '格力KFR-35GW空调，从制冷切换到制热时经常失败，需要多次操作。',
    deviceType: 'ac',
    deviceBrand: '格力',
    deviceModel: 'KFR-35GW',
    status: 'resolved',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    replies: [
      { id: 'r2', content: '问题已定位，是红外码间隔时间不够，已在v2.1.0版本修复。', createdAt: new Date(Date.now() - 43200000).toISOString(), isAdmin: true }
    ]
  }
]

const mockBindingData = {
  nodes: [
    { id: 'user1', name: '用户A', category: 'user', symbolSize: 50 },
    { id: 'user2', name: '用户B', category: 'user', symbolSize: 50 },
    { id: 'user3', name: '用户C', category: 'user', symbolSize: 50 },
    { id: 'dev1', name: '客厅电视', category: 'device', symbolSize: 40 },
    { id: 'dev2', name: '客厅空调', category: 'device', symbolSize: 40 },
    { id: 'dev3', name: '主卧空调', category: 'device', symbolSize: 40 },
    { id: 'dev4', name: '投影仪', category: 'device', symbolSize: 40 },
    { id: 'dev5', name: '客厅灯光', category: 'device', symbolSize: 40 },
    { id: 'hub1', name: '红外网关A', category: 'hub', symbolSize: 30 },
    { id: 'hub2', name: '红外网关B', category: 'hub', symbolSize: 30 }
  ],
  links: [
    { source: 'user1', target: 'hub1' },
    { source: 'user1', target: 'dev1' },
    { source: 'user1', target: 'dev2' },
    { source: 'user1', target: 'dev5' },
    { source: 'user2', target: 'hub1' },
    { source: 'user2', target: 'dev3' },
    { source: 'user3', target: 'hub2' },
    { source: 'user3', target: 'dev4' },
    { source: 'hub1', target: 'dev1' },
    { source: 'hub1', target: 'dev2' },
    { source: 'hub1', target: 'dev3' },
    { source: 'hub1', target: 'dev5' },
    { source: 'hub2', target: 'dev4' }
  ],
  categories: [
    { name: '用户', itemStyle: { color: '#1890ff' } },
    { name: '设备', itemStyle: { color: '#52c41a' } },
    { name: '网关', itemStyle: { color: '#faad14' } }
  ]
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('versions')
  const [versions, setVersions] = useState(mockVersions)
  const [otaPushes, setOTAPushes] = useState(mockOTAPushes)
  const [errorClusters, setErrorClusters] = useState(mockErrorClusters)
  const [highFreqErrors, setHighFreqErrors] = useState(mockHighFreqErrors)
  const [feedbacks, setFeedbacks] = useState(mockFeedbacks)
  const [bindingData, setBindingData] = useState(mockBindingData)
  const [loading, setLoading] = useState(false)
  const [versionModal, setVersionModal] = useState(false)
  const [otaModal, setOTAModal] = useState(false)
  const [feedbackDrawer, setFeedbackDrawer] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [replyForm] = Form.useForm()
  const [versionForm] = Form.useForm()
  const [otaForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'versions') {
        const data = await getCodeVersions().catch(() => mockVersions)
        setVersions(data?.data || data || mockVersions)
      } else if (activeTab === 'errors') {
        const [clusters, highFreq] = await Promise.all([
          getErrorClusters().catch(() => mockErrorClusters),
          getHighFrequencyErrors().catch(() => mockHighFreqErrors)
        ])
        setErrorClusters(clusters?.data || clusters || mockErrorClusters)
        setHighFreqErrors(highFreq?.data || highFreq || mockHighFreqErrors)
      } else if (activeTab === 'binding') {
        const data = await getDeviceBindingGraph().catch(() => mockBindingData)
        setBindingData(data?.data || data || mockBindingData)
      } else if (activeTab === 'feedback') {
        const data = await getFeedbackTickets().catch(() => mockFeedbacks)
        setFeedbacks(data?.data || data || mockFeedbacks)
      }
    } catch (error) {
      console.error('Load admin data failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVersion = async (values) => {
    try {
      await createCodeVersion(values).catch(() => ({ success: true }))
      message.success('版本创建成功')
      logOperation('admin_version_create', values)
      setVersionModal(false)
      loadData()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handlePushOTA = async (values) => {
    try {
      await pushOTA(values.versionId, values.targetUsers).catch(() => ({ success: true }))
      message.success('OTA推送已启动')
      logOperation('admin_ota_push', values)
      setOTAModal(false)
      loadData()
    } catch (error) {
      message.error('推送失败')
    }
  }

  const handleUpdateFeedbackStatus = async (ticketId, status, reply) => {
    try {
      await updateFeedbackStatus(ticketId, status, reply).catch(() => ({ success: true }))
      message.success('状态更新成功')
      logOperation('admin_feedback_update', { ticketId, status, reply })
      loadData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleReplySubmit = async (values) => {
    if (!selectedFeedback) return
    await handleUpdateFeedbackStatus(selectedFeedback.id, 'processing', values.reply)
    replyForm.resetFields()
    setFeedbackDrawer(false)
  }

  const getStatusTag = (status) => {
    const statusMap = {
      published: { color: 'success', text: '已发布' },
      testing: { color: 'processing', text: '测试中' },
      archived: { color: 'default', text: '已归档' },
      pending: { color: 'warning', text: '待处理' },
      processing: { color: 'processing', text: '处理中' },
      resolved: { color: 'success', text: '已解决' },
      completed: { color: 'success', text: '已完成' },
      pushing: { color: 'processing', text: '推送中' }
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getSeverityTag = (severity) => {
    const map = {
      high: { color: 'red', text: '高' },
      medium: { color: 'orange', text: '中' },
      low: { color: 'blue', text: '低' }
    }
    const info = map[severity] || { color: 'default', text: severity }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const graphCategories = bindingData.categories?.length ? bindingData.categories : mockBindingData.categories
  const getCategoryIndex = (node) => {
    const category = node.category || (node.type === 'user' ? '用户' : node.type === 'device' ? '设备' : '网关')
    const index = graphCategories.findIndex(c => c.name === category || c.name === node.type)
    return index >= 0 ? index : 0
  }

  const bindingGraphOption = {
    tooltip: {
      formatter: function (x) {
        return x.data.name
      }
    },
    legend: [{
      data: graphCategories.map(c => c.name)
    }],
    series: [{
      type: 'graph',
      layout: 'force',
      animation: false,
      label: {
        show: true,
        position: 'right',
        formatter: '{b}'
      },
      draggable: true,
      data: (bindingData.nodes || mockBindingData.nodes).map(d => ({ ...d, category: getCategoryIndex(d) })),
      categories: graphCategories,
      force: {
        edgeLength: 150,
        repulsion: 500,
        gravity: 0.1
      },
      edges: (bindingData.links || mockBindingData.links).map(l => ({ ...l, lineStyle: { width: 2, color: '#ccc' } }))
    }]
  }

  const versionColumns = [
    { title: '版本号', dataIndex: 'version', key: 'version', width: 120, render: (v) => <strong>{v}</strong> },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '设备类型', dataIndex: 'deviceType', key: 'deviceType', width: 100, render: (v) => v === 'all' ? '全部' : v },
    { title: '红外码数量', dataIndex: 'codeCount', key: 'codeCount', width: 100 },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount', width: 100 },
    { title: '成功率', dataIndex: 'successRate', key: 'successRate', width: 120, render: (v) => `${v}%` },
    { title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt', width: 180, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v) => getStatusTag(v) },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<CloudUploadOutlined />} onClick={() => {
            otaForm.setFieldsValue({ versionId: record.id, version: record.version })
            setOTAModal(true)
          }}>
            OTA推送
          </Button>
          <Button size="small" icon={<EditOutlined />}>编辑</Button>
        </Space>
      )
    }
  ]

  const feedbackColumns = [
    { title: '用户', dataIndex: 'userName', key: 'userName', width: 100 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '设备', dataIndex: 'deviceBrand', key: 'deviceBrand', width: 150, render: (v, r) => `${v} ${r.deviceModel}` },
    { title: '类型', dataIndex: 'deviceType', key: 'deviceType', width: 80 },
    { title: '提交时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v) => getStatusTag(v) },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => {
            setSelectedFeedback(record)
            setFeedbackDrawer(true)
          }}>查看</Button>
          {record.status === 'pending' && (
            <Button size="small" type="primary" icon={<MessageOutlined />} onClick={() => {
              setSelectedFeedback(record)
              setFeedbackDrawer(true)
            }}>回复</Button>
          )}
          {record.status !== 'resolved' && (
            <Button size="small" type="primary" ghost icon={<CheckCircleOutlined />} onClick={() => handleUpdateFeedbackStatus(record.id, 'resolved', '')}>
              标记解决
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>管理后台</h2>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><CloudUploadOutlined /> 代码版本管理</span>} key="versions">
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="总版本数" value={versions.length} prefix={<SafetyOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="已发布版本" value={versions.filter(v => v.status === 'published').length} prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="覆盖用户" value={versions.reduce((s, v) => s + v.userCount, 0)} prefix={<UserOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="红外码总数" value={versions.reduce((s, v) => s + v.codeCount, 0)} prefix={<DesktopOutlined />} />
              </Card>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>版本列表</h3>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => {
              versionForm.resetFields()
              setVersionModal(true)
            }}>
              创建新版本
            </Button>
          </div>

          <Table
            columns={versionColumns}
            dataSource={versions}
            rowKey="id"
            loading={loading}
          />

          <Card title="OTA推送记录" style={{ marginTop: 24 }}>
            <List
              dataSource={otaPushes}
              renderItem={item => (
                <List.Item
                  actions={[
                    getStatusTag(item.status),
                    <span>成功率: {((item.successCount / item.targetUsers) * 100).toFixed(1)}%</span>
                  ]}
                >
                  <List.Item.Meta
                    title={`v${item.version} - 推送至 ${item.targetUsers} 用户`}
                    description={
                      <Space>
                        <span>成功: {item.successCount}</span>
                        <span>失败: {item.failedCount}</span>
                        <span>·</span>
                        <span>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                      </Space>
                    }
                  />
                  <Progress percent={Math.round((item.successCount / item.targetUsers) * 100)} size="small" style={{ width: 150 }} />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><ApiOutlined /> 设备绑定关系图</span>} key="binding">
          <Card title="用户-设备-网关绑定关系" loading={loading}>
            <div className="binding-graph">
              <ReactECharts option={bindingGraphOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic title="总用户数" value={(bindingData.nodes || []).filter(n => n.category === '用户' || n.category === 'user' || n.type === 'user').length} prefix={<UserOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic title="总设备数" value={(bindingData.nodes || []).filter(n => n.category === '设备' || n.category === 'device' || n.type === 'device').length} prefix={<DesktopOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic title="网关节点数" value={(bindingData.nodes || []).filter(n => n.category === '网关' || n.category === 'hub' || n.type === 'hub').length} prefix={<ApiOutlined />} />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><BugOutlined /> 错误分析</span>} key="errors">
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="错误总数" value={errorClusters.reduce((s, e) => s + e.count, 0)} prefix={<BugOutlined />} valueStyle={{ color: '#f5222d' }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="受影响用户" value={errorClusters.reduce((s, e) => s + e.affectedUsers, 0)} prefix={<UserOutlined />} valueStyle={{ color: '#fa8c16' }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="严重错误" value={errorClusters.filter(e => e.severity === 'high').length} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#f5222d' }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="错误聚类" value={errorClusters.length} prefix={<SafetyOutlined />} />
              </Card>
            </Col>
          </Row>

          <h3 style={{ marginBottom: 16 }}>错误聚类</h3>
          {errorClusters.map(cluster => (
            <div key={cluster.id} className="error-cluster">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Space>
                  <span className="error-count">{cluster.count}</span>
                  <span>次错误</span>
                  {getSeverityTag(cluster.severity)}
                </Space>
                <Space>
                  <Tag>影响 {cluster.affectedUsers} 用户</Tag>
                  <Tag>影响 {cluster.affectedDevices} 设备</Tag>
                </Space>
              </div>
              <h4 style={{ marginBottom: 8 }}>{cluster.pattern}</h4>
              <Descriptions size="small" column={2} style={{ marginBottom: 12 }}>
                <Descriptions.Item label="首次出现">{dayjs(cluster.firstSeen).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                <Descriptions.Item label="最近出现">{dayjs(cluster.lastSeen).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              </Descriptions>
              {cluster.sampleCodes.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>样本红外码:</div>
                  {cluster.sampleCodes.map((code, i) => (
                    <div key={i} className="learning-display" style={{ fontSize: '11px', padding: '8px', margin: '4px 0' }}>
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Card title="高频错误指令 TOP10" style={{ marginTop: 24 }}>
            <List
              dataSource={highFreqErrors}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Tag color="red">错误率 {item.errorRate}%</Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px' }}>#{index + 1}</Tag>}
                    title={`${item.command} - ${item.brand} ${item.deviceType}`}
                    description={`${item.count} 次错误`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><MessageOutlined /> 反馈工单</span>} key="feedback">
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="待处理" value={feedbacks.filter(f => f.status === 'pending').length} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="处理中" value={feedbacks.filter(f => f.status === 'processing').length} prefix={<MessageOutlined />} valueStyle={{ color: '#1890ff' }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="已解决" value={feedbacks.filter(f => f.status === 'resolved').length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="总数" value={feedbacks.length} prefix={<MessageOutlined />} />
              </Card>
            </Col>
          </Row>

          <Table
            columns={feedbackColumns}
            dataSource={feedbacks}
            rowKey="id"
            loading={loading}
          />
        </TabPane>
      </Tabs>

      <Modal
        title="创建新版本"
        open={versionModal}
        onCancel={() => setVersionModal(false)}
        footer={null}
        destroyOnHidden
        forceRender
      >
        <Form form={versionForm} layout="vertical" onFinish={handleCreateVersion}>
          <Form.Item name="version" label="版本号" rules={[{ required: true }]}>
            <Input placeholder="例如: 2.2.0" />
          </Form.Item>
          <Form.Item name="description" label="版本描述" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="描述此版本包含的更新内容" />
          </Form.Item>
          <Form.Item name="deviceType" label="适用设备" rules={[{ required: true }]}>
            <Select>
              <Option value="all">全部设备</Option>
              <Option value="tv">电视</Option>
              <Option value="ac">空调</Option>
              <Option value="light">灯光</Option>
              <Option value="projector">投影仪</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setVersionModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="OTA推送"
        open={otaModal}
        onCancel={() => setOTAModal(false)}
        footer={null}
        destroyOnHidden
        forceRender
      >
        <Form form={otaForm} layout="vertical" onFinish={handlePushOTA}>
          <Form.Item name="version" label="版本">
            <Input disabled />
          </Form.Item>
          <Form.Item name="targetUsers" label="目标用户数" rules={[{ required: true }]}>
            <Input type="number" placeholder="输入推送用户数量" />
          </Form.Item>
          <Form.Item name="pushType" label="推送方式" rules={[{ required: true }]} initialValue="gradual">
            <Select>
              <Option value="all">全量推送</Option>
              <Option value="gradual">灰度推送</Option>
              <Option value="beta">测试用户</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SendOutlined />} htmlType="submit">开始推送</Button>
              <Button onClick={() => setOTAModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="反馈详情"
        placement="right"
        width={500}
        open={feedbackDrawer}
        onClose={() => setFeedbackDrawer(false)}
        destroyOnHidden
      >
        {selectedFeedback && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="用户">{selectedFeedback.userName}</Descriptions.Item>
              <Descriptions.Item label="标题">{selectedFeedback.title}</Descriptions.Item>
              <Descriptions.Item label="设备">{selectedFeedback.deviceBrand} {selectedFeedback.deviceModel}</Descriptions.Item>
              <Descriptions.Item label="类型">{selectedFeedback.deviceType}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedFeedback.status)}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{dayjs(selectedFeedback.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>

            <Card title="反馈内容" size="small" style={{ marginBottom: 16 }}>
              <p>{selectedFeedback.content}</p>
            </Card>

            {selectedFeedback.replies && selectedFeedback.replies.length > 0 && (
              <Card title="回复记录" size="small" style={{ marginBottom: 16 }}>
                <List
                  dataSource={selectedFeedback.replies}
                  renderItem={reply => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={reply.isAdmin ? <SafetyOutlined /> : <UserOutlined />}
                        title={reply.isAdmin ? '管理员回复' : '用户'}
                        description={
                          <div>
                            <p>{reply.content}</p>
                            <div style={{ color: '#999', fontSize: '12px' }}>
                              {dayjs(reply.createdAt).format('YYYY-MM-DD HH:mm')}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {selectedFeedback.status !== 'resolved' && (
              <Form form={replyForm} layout="vertical" onFinish={handleReplySubmit}>
                <Form.Item name="reply" label="回复内容" rules={[{ required: true, message: '请输入回复内容' }]}>
                  <TextArea rows={4} placeholder="输入回复内容..." />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                      发送回复
                    </Button>
                    <Button type="primary" ghost icon={<CheckCircleOutlined />} onClick={() => handleUpdateFeedbackStatus(selectedFeedback.id, 'resolved', '')}>
                      标记已解决
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default AdminPanel
