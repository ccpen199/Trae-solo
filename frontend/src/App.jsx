import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'
import { Layout, Menu, Card, Statistic, Table, Button, Form, Input, Select, Progress, Tag, Modal, Tabs, Descriptions, Timeline, message } from 'antd'
import { PlusOutlined, FileTextOutlined, UserOutlined, DashboardOutlined, ArrowRightOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Header, Content, Sider } = Layout
const { Option } = Select
const { TabPane } = Tabs

const API_BASE = 'http://127.0.0.1:58796/api'

const statusMap = {
  pending: { text: '待处理', color: 'orange' },
  reviewing: { text: '审核中', color: 'blue' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' },
  manual_review: { text: '人工复核', color: 'purple' },
  screening_passed: { text: '初筛通过', color: 'cyan' },
  pending_supplement: { text: '待补件', color: 'warning' },
  authorization_failed: { text: '授权失败', color: 'error' },
  cancelled: { text: '已取消', color: 'default' }
}

function Dashboard() {
  const [stats, setStats] = useState({})
  const { currentUser } = React.useContext(UserContext)

  useEffect(() => {
    axios.get(`${API_BASE}/stats`, { params: { user: currentUser.username, role: currentUser.role } }).then(res => setStats(res.data))
  }, [currentUser])

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px' }}>数据概览</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <Card>
          <Statistic title="申请总数" value={stats.total || 0} prefix={<FileTextOutlined />} />
        </Card>
        <Card>
          <Statistic title="待处理" value={stats.pending || 0} valueStyle={{ color: '#fa8c16' }} />
        </Card>
        <Card>
          <Statistic title="审核中" value={stats.reviewing || 0} valueStyle={{ color: '#1890ff' }} />
        </Card>
        <Card>
          <Statistic title="已通过" value={stats.approved || 0} valueStyle={{ color: '#52c41a' }} />
        </Card>
        <Card>
          <Statistic title="已拒绝" value={stats.rejected || 0} valueStyle={{ color: '#ff4d4f' }} />
        </Card>
        <Card>
          <Statistic title="待补件" value={stats.supplement || 0} valueStyle={{ color: '#faad14' }} />
        </Card>
      </div>
    </div>
  )
}

function ApplicationList() {
  const [applications, setApplications] = useState([])
  const [filters, setFilters] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { currentUser } = React.useContext(UserContext)

  const loadApplications = () => {
    axios.get(`${API_BASE}/applications`, { params: { ...filters, user: currentUser.username, role: currentUser.role } }).then(res => setApplications(res.data))
  }

  useEffect(() => {
    loadApplications()
  }, [filters, currentUser])

  const handleCreate = (values) => {
    axios.post(`${API_BASE}/applications`, { ...values, created_by: currentUser.username }).then(() => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      loadApplications()
    })
  }

  const columns = [
    { title: '申请编号', dataIndex: 'application_no', key: 'application_no' },
    { title: '渠道', dataIndex: 'channel', key: 'channel' },
    { title: '产品', dataIndex: 'product', key: 'product' },
    { title: '客户经理', dataIndex: 'account_manager', key: 'account_manager' },
    { title: '申请人', dataIndex: 'applicant_name', key: 'applicant_name' },
    { title: '申请金额', dataIndex: 'application_amount', key: 'application_amount', render: v => `¥${v?.toLocaleString()}` },
    { title: '资料完整度', dataIndex: 'data_completeness', key: 'data_completeness', render: v => <Progress percent={v} size="small" /> },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={statusMap[v]?.color || 'default'}>{statusMap[v]?.text || v}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    { title: '操作', key: 'action', render: (_, record) => <Button type="link" onClick={() => navigate(`/applications/${record.id}`)}>查看详情</Button> }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>进件列表</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建申请</Button>
      </div>
      
      <Card style={{ marginBottom: '16px' }}>
        <Form layout="inline">
          <Form.Item label="状态">
            <Select style={{ width: 150 }} onChange={v => setFilters({ ...filters, status: v })} allowClear>
              <Option value="pending">待处理</Option>
              <Option value="reviewing">审核中</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已拒绝</Option>
              <Option value="pending_supplement">待补件</Option>
            </Select>
          </Form.Item>
          <Form.Item label="渠道">
            <Select style={{ width: 150 }} onChange={v => setFilters({ ...filters, channel: v })} allowClear>
              <Option value="线上渠道">线上渠道</Option>
              <Option value="线下门店">线下门店</Option>
              <Option value="合作机构">合作机构</Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Table columns={columns} dataSource={applications} rowKey="id" />

      <Modal title="新建进件申请" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="channel" label="渠道" rules={[{ required: true }]}>
            <Select>
              <Option value="线上渠道">线上渠道</Option>
              <Option value="线下门店">线下门店</Option>
              <Option value="合作机构">合作机构</Option>
            </Select>
          </Form.Item>
          <Form.Item name="product" label="产品" rules={[{ required: true }]}>
            <Select>
              <Option value="经营贷">经营贷</Option>
              <Option value="消费贷">消费贷</Option>
              <Option value="信用贷">信用贷</Option>
            </Select>
          </Form.Item>
          <Form.Item name="account_manager" label="客户经理" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="applicant_name" label="申请人姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="applicant_phone" label="申请人电话" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="application_amount" label="申请金额" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function ApplicationDetail() {
  const [detail, setDetail] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [supplementModal, setSupplementModal] = useState(false)
  const [transferModal, setTransferModal] = useState(false)
  const [users, setUsers] = useState([])
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams()
  const { currentUser } = React.useContext(UserContext)

  useEffect(() => {
    if (id) {
      axios.get(`${API_BASE}/applications/${id}`).then(res => setDetail(res.data))
    }
    axios.get(`${API_BASE}/users`).then(res => setUsers(res.data))
  }, [id, currentUser])

  const handleSupplement = (values) => {
    axios.post(`${API_BASE}/applications/${id}/supplement`, { ...values, supplemented_by: currentUser.username }).then(() => {
      message.success('补件成功')
      setSupplementModal(false)
      form.resetFields()
      axios.get(`${API_BASE}/applications/${id}`).then(res => setDetail(res.data))
    })
  }

  const handleAuthorize = () => {
    axios.post(`${API_BASE}/applications/${id}/authorize`, { authorization_scope: '征信,黑名单', query_type: 'credit', created_by: currentUser.username }).then(res => {
      if (res.data.query_result === 'success') {
        message.success('授权查询成功')
      } else {
        message.error(`授权查询失败: ${res.data.failure_reason}`)
      }
      axios.get(`${API_BASE}/applications/${id}`).then(res => setDetail(res.data))
    })
  }

  const handleScreen = () => {
    axios.post(`${API_BASE}/applications/${id}/screen`, { screened_by: currentUser.username }).then(res => {
      if (res.data.success) {
        message.info(res.data.handling_opinion)
      } else {
        message.warning(res.data.handling_opinion)
      }
      axios.get(`${API_BASE}/applications/${id}`).then(res => setDetail(res.data))
    })
  }

  const handleTransfer = (values) => {
    axios.post(`${API_BASE}/applications/${id}/transfer`, { ...values, from_user: currentUser.username, to_user: values.to_user || 'director1' }).then(() => {
      message.success('操作成功')
      setTransferModal(false)
      form.resetFields()
      axios.get(`${API_BASE}/applications/${id}`).then(res => setDetail(res.data))
    })
  }

  if (!detail) return <div style={{ padding: '24px' }}>加载中...</div>

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Button onClick={() => navigate('/applications')} style={{ marginRight: '16px' }}>返回列表</Button>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{detail.application.application_no}</span>
          <Tag color={statusMap[detail.application.status]?.color} style={{ marginLeft: '16px' }}>
            {statusMap[detail.application.status]?.text}
          </Tag>
        </div>
        <div>
          <Button onClick={() => setSupplementModal(true)} style={{ marginRight: '8px' }}>资料补件</Button>
          <Button onClick={handleAuthorize} style={{ marginRight: '8px' }}>授权查询</Button>
          <Button onClick={handleScreen} style={{ marginRight: '8px' }}>规则初筛</Button>
          <Button type="primary" onClick={() => setTransferModal(true)}>信审移交</Button>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="基本信息" key="info">
          <Card title="申请信息">
            <Descriptions column={2}>
              <Descriptions.Item label="申请编号">{detail.application.application_no}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMap[detail.application.status]?.color}>{statusMap[detail.application.status]?.text}</Tag></Descriptions.Item>
              <Descriptions.Item label="渠道">{detail.application.channel}</Descriptions.Item>
              <Descriptions.Item label="产品">{detail.application.product}</Descriptions.Item>
              <Descriptions.Item label="客户经理">{detail.application.account_manager}</Descriptions.Item>
              <Descriptions.Item label="申请金额">¥{detail.application.application_amount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="申请人">{detail.application.applicant_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.application.applicant_phone}</Descriptions.Item>
              <Descriptions.Item label="版本号">v{detail.application.version}</Descriptions.Item>
              <Descriptions.Item label="资料完整度"><Progress percent={detail.application.data_completeness} size="small" /></Descriptions.Item>
              {detail.application.risk_tags && <Descriptions.Item label="风险标签">{detail.application.risk_tags.split(',').map(tag => <Tag color="red" key={tag}>{tag}</Tag>)}</Descriptions.Item>}
            </Descriptions>
          </Card>

          <Card title="资料清单" style={{ marginTop: '16px' }}>
            <Descriptions column={2}>
              <Descriptions.Item label="身份证">{detail.application.id_card || <Tag color="red">缺失</Tag>}</Descriptions.Item>
              <Descriptions.Item label="银行卡">{detail.application.bank_card || <Tag color="red">缺失</Tag>}</Descriptions.Item>
              <Descriptions.Item label="联系人信息">{detail.application.contact_info || <Tag color="red">缺失</Tag>}</Descriptions.Item>
              <Descriptions.Item label="经营证明">{detail.application.business_proof || <Tag color="red">缺失</Tag>}</Descriptions.Item>
            </Descriptions>
          </Card>
        </TabPane>

        <TabPane tab="授权记录" key="auth">
          <Card>
            <Timeline>
              {detail.authorizations.map((auth, idx) => (
                <Timeline.Item key={idx} color={auth.query_result === 'success' ? 'green' : 'red'}>
                  <p><strong>{auth.query_type}</strong> - {auth.authorization_time}</p>
                  <p>授权范围: {auth.authorization_scope}</p>
                  <p>结果: {auth.query_result === 'success' ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />} {auth.query_result}</p>
                  {auth.failure_reason && <p style={{ color: 'red' }}>失败原因: {auth.failure_reason}</p>}
                </Timeline.Item>
              ))}
              {detail.authorizations.length === 0 && <p>暂无授权记录</p>}
            </Timeline>
          </Card>
        </TabPane>

        <TabPane tab="初筛规则" key="screen">
          <Card>
            <Table dataSource={detail.screenings} rowKey="id">
              <Table.Column title="规则名称" dataIndex="rule_name" />
              <Table.Column title="结果" dataIndex="rule_result" render={v => v === 'pass' ? <Tag color="green">通过</Tag> : <Tag color="red">不通过</Tag>} />
              <Table.Column title="风险等级" dataIndex="risk_level" render={v => v === 'low' ? <Tag color="green">低</Tag> : <Tag color="red">高</Tag>} />
              <Table.Column title="处理意见" dataIndex="handling_opinion" />
              <Table.Column title="时间" dataIndex="created_at" />
            </Table>
          </Card>
        </TabPane>

        <TabPane tab="补件记录" key="supplement">
          <Card>
            <Timeline>
              {detail.supplements.map((sup, idx) => (
                <Timeline.Item key={idx}>
                  <p><strong>{sup.document_type}</strong> - {sup.supplement_time}</p>
                  <p>操作人: {sup.supplemented_by}</p>
                  {sup.old_data && <p>旧数据: {sup.old_data}</p>}
                  <p>新数据: {sup.new_data}</p>
                  {sup.notes && <p>备注: {sup.notes}</p>}
                </Timeline.Item>
              ))}
              {detail.supplements.length === 0 && <p>暂无补件记录</p>}
            </Timeline>
          </Card>
        </TabPane>

        <TabPane tab="移交日志" key="transfer">
          <Card>
            <Timeline>
              {detail.transfers.map((trans, idx) => (
              <Timeline.Item key={idx}>
                <p><strong>{trans.transfer_type}</strong> - {trans.transfer_time}</p>
                <p>从 {trans.from_user} 移交至 {trans.to_user}</p>
                <p>版本号: v{trans.application_version}</p>
                {trans.notes && <p>备注: {trans.notes}</p>}
              </Timeline.Item>
            ))}
            {detail.transfers.length === 0 && <p>暂无移交记录</p>}
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>

      <Modal title="资料补件" open={supplementModal} onCancel={() => setSupplementModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSupplement}>
          <Form.Item name="document_type" label="资料类型" rules={[{ required: true }]}>
            <Select>
              <Option value="id_card">身份证</Option>
              <Option value="bank_card">银行卡</Option>
              <Option value="contact_info">联系人信息</Option>
              <Option value="business_proof">经营证明</Option>
            </Select>
          </Form.Item>
          <Form.Item name="new_data" label="补充内容" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>提交补件</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="信审移交" open={transferModal} onCancel={() => setTransferModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleTransfer}>
          <Form.Item name="transfer_type" label="操作类型" rules={[{ required: true }]}>
            <Select>
              <Option value="submit">提交审核</Option>
              <Option value="return">退回补件</Option>
              <Option value="approve">审核通过</Option>
              <Option value="reject">审核拒绝</Option>
              <Option value="cancel">取消申请</Option>
            </Select>
          </Form.Item>
          <Form.Item name="to_user" label="接收人" rules={[{ required: true }]}>
            <Select>
              {users.map(user => (
                <Option key={user.username} value={user.username}>
                  {user.name} ({user.role === 'manager' ? '客户经理' : user.role === 'officer' ? '业务员' : user.role === 'reviewer' ? '风控' : user.role === 'director' ? '主管' : '管理员'})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>确认提交</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

const UserContext = React.createContext()

function App() {
  const [currentUser, setCurrentUser] = useState({ username: 'manager1', name: '张经理', role: 'manager' })
  const [users, setUsers] = useState([])

  useEffect(() => {
    axios.get(`${API_BASE}/users`).then(res => setUsers(res.data))
  }, [])

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
            <h1 style={{ color: 'white', margin: 0, fontSize: '20px' }}>小额信贷系统</h1>
            <div style={{ marginLeft: 'auto', color: 'white', display: 'flex', alignItems: 'center' }}>
              <UserOutlined style={{ marginRight: '8px' }} />
              <Select
                value={currentUser.name}
                onChange={(value) => {
                  const user = users.find(u => u.name === value)
                  if (user) setCurrentUser(user)
                }}
                style={{ width: 150, color: '#000' }}
                size="small"
              >
                {users.map(user => (
                  <Option key={user.username} value={user.name}>
                    {user.name} ({user.role === 'manager' ? '客户经理' : user.role === 'officer' ? '业务员' : user.role === 'reviewer' ? '风控' : user.role === 'director' ? '主管' : '管理员'})
                  </Option>
                ))}
              </Select>
            </div>
          </Header>
        <Layout>
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu mode="inline" defaultSelectedKeys={['1']} style={{ height: '100%', borderRight: 0 }}>
              <Menu.Item key="1" icon={<DashboardOutlined />}>
                <Link to="/">数据概览</Link>
              </Menu.Item>
              <Menu.Item key="2" icon={<FileTextOutlined />}>
                <Link to="/applications">进件管理</Link>
              </Menu.Item>
            </Menu>
          </Sider>
          <Layout style={{ padding: 0 }}>
            <Content style={{ background: '#f0f2f5', minHeight: 280 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/applications" element={<ApplicationList />} />
                <Route path="/applications/:id" element={<ApplicationDetail />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </BrowserRouter>
    </UserContext.Provider>
  )
}

export default App
