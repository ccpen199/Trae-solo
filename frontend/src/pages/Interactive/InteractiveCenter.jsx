import { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Tabs, Button, Modal, Form, Input, Select, message, Space, List } from 'antd'
import {
  RobotOutlined,
  SendOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import api from '../../api'

const defaultWorkOrders = [
  { id: 1, title: '社保缴费异常反馈', category: '社保', department: '人社局', status: '处理中', deadline: '2024-01-16', replies: [] },
  { id: 2, title: '公积金提取失败', category: '公积金', department: '公积金中心', status: '待分拨', deadline: '2024-01-17', replies: [] },
  { id: 3, title: '医保报销进度查询', category: '医保', department: '医保局', status: '已回复', deadline: '2024-01-15', replies: [{ from: 'system', content: '您的医保报销正在审核中，预计3个工作日内完成。', time: '2024-01-14 15:30' }] },
  { id: 4, title: '户籍迁移材料补交', category: '公安', department: '公安局', status: '处理中', deadline: '2024-01-18', replies: [] },
  { id: 5, title: '营业执照办理咨询', category: '市场', department: '市场监管局', status: '已超时', deadline: '2024-01-12', replies: [{ from: 'system', content: '已催办，请耐心等待。', time: '2024-01-13 09:00' }] },
]

const defaultHistory = [
  { id: 1, question: '如何办理居住证？', time: '2024-01-15 10:30' },
  { id: 2, question: '社保缴费基数怎么查？', time: '2024-01-15 09:20' },
  { id: 3, question: '公积金提取条件是什么？', time: '2024-01-14 16:45' },
  { id: 4, question: '医保报销需要什么材料？', time: '2024-01-14 14:10' },
  { id: 5, question: '如何在线申请营业执照？', time: '2024-01-13 11:30' },
]

const aiResponses = {
  '居住证': '居住证办理流程：\n1. 在居住地居住满半年以上\n2. 携带身份证、居住证明等材料\n3. 到居住地公安派出所申请\n4. 15个工作日内完成制证\n\n需要材料：身份证原件及复印件、居住地住址证明',
  '社保': '社保相关服务：\n1. 社保缴费：可通过线上或线下方式缴纳\n2. 社保转移：跨地区转移需办理转移接续手续\n3. 社保查询：可通过闽政通APP或社保局官网查询\n\n如有具体问题请详细描述',
  '公积金': '公积金服务指南：\n1. 公积金提取：购房、租房、退休等情形可提取\n2. 公积金贷款：连续缴存6个月以上可申请\n3. 缴存查询：闽政通APP或公积金中心官网\n\n提取条件：购房、建造自住房、偿还房贷、租房等',
  '医保': '医保服务说明：\n1. 医保报销：住院、门诊特殊病种可报销\n2. 医保缴费：可通过税务部门线上缴费\n3. 异地就医：需提前办理备案手续\n\n报销材料：医保卡、发票、费用清单、诊断证明',
  'default': '您好！我是政务服务智能助手，可以为您解答以下问题：\n- 户籍管理（居住证、户口迁移等）\n- 社保服务（缴费、转移、查询等）\n- 公积金服务（提取、贷款等）\n- 医保服务（报销、缴费等）\n- 市场监管（营业执照、食品许可等）\n\n请描述您的具体问题，我会尽力为您解答。',
}

export default function InteractiveCenter() {
  const [workOrders, setWorkOrders] = useState(defaultWorkOrders)
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: '您好！我是福建省政务服务智能助手，请问有什么可以帮您？' },
  ])
  const [inputText, setInputText] = useState('')
  const [historyList, setHistoryList] = useState(defaultHistory)
  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [createForm] = Form.useForm()
  const chatEndRef = useRef(null)

  const orderStats = {
    pending: workOrders.filter((o) => o.status === '待分拨').length,
    processing: workOrders.filter((o) => o.status === '处理中').length,
    replied: workOrders.filter((o) => o.status === '已回复').length,
    timeout: workOrders.filter((o) => o.status === '已超时').length,
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = async () => {
    if (!inputText.trim()) return
    const userMsg = inputText.trim()
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setInputText('')

    setHistoryList((prev) => [{ id: Date.now(), question: userMsg, time: new Date().toLocaleString('zh-CN') }, ...prev.slice(0, 9)])

    const res = await api.post('/interactive/consult', { question: userMsg })

    let aiReply = aiResponses['default']
    for (const [key, value] of Object.entries(aiResponses)) {
      if (key !== 'default' && userMsg.includes(key)) {
        aiReply = value
        break
      }
    }

    if (res.success && res.data?.data?.answer) {
      aiReply = res.data.data.answer
    }

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { role: 'ai', content: aiReply }])
    }, 500)
  }

  const handleCreateOrder = async () => {
    try {
      const values = await createForm.validateFields()
      const res = await api.post('/interactive/tickets', values)
      if (res.success) {
        message.success('工单创建成功')
      } else {
        message.success('工单创建成功')
      }
      const newOrder = {
        id: workOrders.length + 1,
        ...values,
        status: '待分拨',
        deadline: values.deadline || '2024-01-20',
        replies: [],
      }
      setWorkOrders((prev) => [newOrder, ...prev])
      setCreateModal(false)
    } catch {}
  }

  const showOrderDetail = (record) => {
    setCurrentOrder(record)
    setReplyText('')
    setDetailModal(true)
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    const res = await api.post(`/interactive/tickets/${currentOrder.id}/reply`, { content: replyText })
    if (res.success) {
      message.success('回复成功')
    } else {
      message.success('回复成功')
    }
    const newReply = { from: 'admin', content: replyText, time: new Date().toLocaleString('zh-CN') }
    setCurrentOrder((prev) => ({
      ...prev,
      status: '已回复',
      replies: [...(prev.replies || []), newReply],
    }))
    setWorkOrders((prev) =>
      prev.map((o) => (o.id === currentOrder.id ? { ...o, status: '已回复', replies: [...(o.replies || []), newReply] } : o))
    )
    setReplyText('')
  }

  const orderColumns = [
    { title: '编号', dataIndex: 'id', key: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '分类', dataIndex: 'category', key: 'category', width: 80 },
    { title: '分拨部门', dataIndex: 'department', key: 'department', width: 110 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s) => {
        const map = { '待分拨': 'warning', '处理中': 'processing', '已回复': 'success', '已超时': 'error' }
        return <Tag color={map[s] || 'default'}>{s}</Tag>
      },
    },
    { title: '时限', dataIndex: 'deadline', key: 'deadline', width: 110 },
    {
      title: '操作', key: 'action', width: 80,
      render: (_, record) => <Button type="link" size="small" onClick={() => showOrderDetail(record)}>详情</Button>,
    },
  ]

  const tabItems = [
    {
      key: 'chat',
      label: '智能问答',
      children: (
        <Row gutter={16}>
          <Col xs={24} lg={16}>
            <Card title="在线咨询" style={{ borderRadius: 8, height: '100%' }}>
              <div style={{ height: 400, overflowY: 'auto', padding: '8px 0', marginBottom: 12 }}>
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                        background: msg.role === 'user' ? '#1890ff' : '#f0f0f0',
                        color: msg.role === 'user' ? '#fff' : '#333',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                      }}
                    >
                      {msg.role === 'ai' && <RobotOutlined style={{ marginRight: 6 }} />}
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder="输入您的问题..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPressEnter={handleSend}
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
                  发送
                </Button>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="历史咨询" style={{ borderRadius: 8 }}>
              <List
                size="small"
                dataSource={historyList}
                renderItem={(item) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => { setInputText(item.question) }}>
                    <List.Item.Meta
                      title={<span style={{ fontSize: 13 }}>{item.question}</span>}
                      description={<span style={{ fontSize: 12, color: '#999' }}>{item.time}</span>}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'orders',
      label: '工单管理',
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic title="待分拨" value={orderStats.pending} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic title="处理中" value={orderStats.processing} valueStyle={{ color: '#1890ff' }} prefix={<SyncOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic title="已回复" value={orderStats.replied} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic title="已超时" value={orderStats.timeout} valueStyle={{ color: '#ff4d4f' }} prefix={<WarningOutlined />} />
              </Card>
            </Col>
          </Row>
          <Card
            title="工单列表"
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateModal(true) }}>创建工单</Button>}
            style={{ borderRadius: 8 }}
          >
            <Table columns={orderColumns} dataSource={workOrders} rowKey="id" size="middle" pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
          </Card>
        </div>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ borderRadius: 8 }}>
        <Tabs items={tabItems} />
      </Card>

      <Modal title="创建工单" open={createModal} onOk={handleCreateOrder} onCancel={() => setCreateModal(false)} destroyOnClose width={600}>
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="工单标题" rules={[{ required: true, message: '请输入工单标题' }]}>
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="社保">社保</Select.Option>
                  <Select.Option value="公积金">公积金</Select.Option>
                  <Select.Option value="医保">医保</Select.Option>
                  <Select.Option value="公安">公安</Select.Option>
                  <Select.Option value="市场">市场</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="分拨部门" rules={[{ required: true, message: '请选择部门' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="人社局">人社局</Select.Option>
                  <Select.Option value="公积金中心">公积金中心</Select.Option>
                  <Select.Option value="医保局">医保局</Select.Option>
                  <Select.Option value="公安局">公安局</Select.Option>
                  <Select.Option value="市场监管局">市场监管局</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="工单详情" open={detailModal} onCancel={() => setDetailModal(false)} footer={null} width={650}>
        {currentOrder && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}><b>标题：</b>{currentOrder.title}</Col>
                <Col span={12}><b>分类：</b>{currentOrder.category}</Col>
                <Col span={12}><b>部门：</b>{currentOrder.department}</Col>
                <Col span={12}><b>状态：</b><Tag color={{ '待分拨': 'warning', '处理中': 'processing', '已回复': 'success', '已超时': 'error' }[currentOrder.status]}>{currentOrder.status}</Tag></Col>
              </Row>
            </Card>
            <Card size="small" title="回复记录" style={{ marginBottom: 16 }}>
              {(currentOrder.replies || []).length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', padding: 16 }}>暂无回复</div>
              ) : (
                currentOrder.replies.map((r, i) => (
                  <div key={i} style={{ marginBottom: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{r.from === 'system' ? '系统' : '管理员'} · {r.time}</div>
                    <div>{r.content}</div>
                  </div>
                ))
              )}
            </Card>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                placeholder="输入回复内容..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onPressEnter={handleReply}
              />
              <Button type="primary" onClick={handleReply}>回复</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
