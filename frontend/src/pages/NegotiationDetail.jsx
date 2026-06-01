import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Tag,
  Timeline,
  Row,
  Col,
  Divider,
  Steps,
  List,
  message,
  Modal,
  Form,
  Input,
  Progress,
  Alert
} from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  HistoryOutlined,
  StopOutlined,
  UnlockOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const API_BASE = '/api'

const NegotiationDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [priceResult, setPriceResult] = useState(null)
  const [riskResult, setRiskResult] = useState(null)
  const [strategyResult, setStrategyResult] = useState(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState('')
  const [exceptions, setExceptions] = useState([])
  const [unblockModal, setUnblockModal] = useState(false)
  const [form] = Form.useForm()
  const [unblockForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [res, exRes] = await Promise.all([
        axios.get(`${API_BASE}/negotiations/${id}`),
        axios.get(`${API_BASE}/exceptions`, { params: { negotiation_id: id } })
      ])
      setData(res.data.data)
      setExceptions(exRes.data.data || [])
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async () => {
    try {
      const values = await unblockForm.validateFields()
      await axios.post(`${API_BASE}/negotiations/${id}/unblock`, {
        operator_id: 'user_003',
        operator_name: '李经理',
        ...values
      })
      message.success('已人工解除拦截成功')
      setUnblockModal(false)
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const blockedExceptions = exceptions.filter(e => e.status === 'auto_blocked')
  const isBlocked = data?.status === 'blocked' || blockedExceptions.length > 0

  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    submitted: { text: '已提交', color: 'blue' },
    executing: { text: '执行中', color: 'orange' },
    reviewing: { text: '审核中', color: 'purple' },
    returned: { text: '已退回', color: 'red' },
    completed: { text: '已完成', color: 'green' },
    closed: { text: '已关闭', color: 'default' },
    blocked: { text: '已拦截', color: 'red' }
  }

  const actionMap = {
    create: '创建',
    submit: '提交',
    execute: '执行',
    review: '审核',
    return: '退回',
    close: '关闭',
    update: '更新',
    price_compare: '价格对比',
    risk_check: '风险检查',
    strategy_generate: '生成策略'
  }

  const getCurrentStepIndex = () => {
    const statusOrder = ['draft', 'submitted', 'executing', 'reviewing', 'completed']
    return statusOrder.indexOf(data?.status || 'draft')
  }

  const handlePriceCompare = async () => {
    try {
      const res = await axios.post(`${API_BASE}/negotiations/${id}/price-compare`, {
        operator_id: 'user_004',
        operator_name: '张三'
      })
      setPriceResult(res.data.data)
      message.success('价格对比完成')
      loadData()
    } catch (e) {
      message.error('价格对比失败')
    }
  }

  const handleRiskCheck = async () => {
    try {
      const res = await axios.post(`${API_BASE}/negotiations/${id}/risk-check`, {
        operator_id: 'user_004',
        operator_name: '张三'
      })
      setRiskResult(res.data.data)
      message.success('风险检查完成')
      loadData()
    } catch (e) {
      message.error('风险检查失败')
    }
  }

  const handleGenerateStrategy = async () => {
    try {
      const res = await axios.post(`${API_BASE}/negotiations/${id}/generate-strategy`, {
        operator_id: 'user_004',
        operator_name: '张三'
      })
      setStrategyResult(res.data.data)
      message.success('策略生成完成')
      loadData()
    } catch (e) {
      message.error('策略生成失败')
    }
  }

  const handleSubmit = async () => {
    try {
      await axios.post(`${API_BASE}/negotiations/${id}/submit`, {
        operator_id: 'user_004',
        operator_name: '张三',
        auditor_id: 'user_003'
      })
      message.success('提交成功')
      loadData()
    } catch (e) {
      message.error('提交失败')
    }
  }

  const handleReview = async (action) => {
    setReviewAction(action)
    setReviewModal(true)
    form.resetFields()
  }

  const submitReview = async () => {
    try {
      const values = await form.validateFields()
      await axios.post(`${API_BASE}/negotiations/${id}/review`, {
        operator_id: 'user_003',
        operator_name: '审核人员',
        action: reviewAction,
        ...values
      })
      message.success('操作成功')
      setReviewModal(false)
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const detailColumns = [
    { title: '品名', dataIndex: 'item_name' },
    { title: '规格', dataIndex: 'spec' },
    { title: '单位', dataIndex: 'unit', width: 80 },
    { title: '数量', dataIndex: 'quantity', width: 100 },
    { title: '报价单价', dataIndex: 'quoted_price', width: 120, render: v => `¥${v?.toLocaleString()}` },
    { title: '报价金额', dataIndex: 'quoted_amount', width: 120, render: v => `¥${v?.toLocaleString()}` },
    { title: '历史均价', dataIndex: 'historical_avg_price', width: 120, render: v => v ? `¥${v.toLocaleString()}` : '-' },
    { title: '偏差(%)', dataIndex: 'price_deviation', width: 100,
      render: (v, record) => {
        if (v === null || v === undefined) return '-'
        const color = Math.abs(v) > 5 ? 'red' : Math.abs(v) > 3 ? 'orange' : 'green'
        return <span style={{ color }}>{v}%</span>
      }
    },
    { title: '目标价', dataIndex: 'target_price', width: 120, render: v => v ? `¥${v.toLocaleString()}` : '-' }
  ]

  if (loading) return <Card loading />

  if (!data) return <Card><p>数据不存在</p></Card>

  return (
    <div>
      {isBlocked && (
        <Alert
          message="系统拦截通知"
          description={
            <Space direction="vertical" size="small">
              <div>此谈判项目因检测到 {blockedExceptions.length} 个严重异常，已被系统自动拦截。</div>
              <div>
                <Button 
                  type="primary" 
                  danger 
                  size="small"
                  icon={<UnlockOutlined />}
                  onClick={() => setUnblockModal(true)}
                >
                  人工介入解除拦截
                </Button>
              </div>
            </Space>
          }
          type="error"
          showIcon
          icon={<StopOutlined />}
          style={{ marginBottom: 16 }}
          action={
            <Button 
              size="small" 
              type="primary" 
              danger
              onClick={() => navigate('/exceptions')}
            >
              处理异常
            </Button>
          }
        />
      )}
      
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/negotiations')}>
            返回列表
          </Button>
          <h1 className="page-title">{data.title}</h1>
          <Tag color={statusMap[data.status]?.color}>
            {isBlocked && <StopOutlined style={{ marginRight: 4 }} />}
            {statusMap[data.status]?.text}
          </Tag>
        </Space>
        <Space>
          {data.status === 'draft' && !isBlocked && (
            <>
              <Button onClick={handlePriceCompare} icon={<FileTextOutlined />}>价格对比</Button>
              <Button onClick={handleRiskCheck} icon={<WarningOutlined />}>风险检查</Button>
              <Button onClick={handleGenerateStrategy} icon={<ThunderboltOutlined />}>生成策略</Button>
              <Button type="primary" onClick={handleSubmit} icon={<PlayCircleOutlined />}>提交审核</Button>
            </>
          )}
          {data.status === 'submitted' && !isBlocked && (
            <>
              <Button onClick={() => handleReview('approve')} type="primary" icon={<CheckCircleOutlined />}>审核通过</Button>
              <Button onClick={() => handleReview('return')} danger icon={<CloseCircleOutlined />}>审核退回</Button>
            </>
          )}
          {data.status === 'executing' && !isBlocked && (
            <Button type="primary" onClick={() => handleReview('complete')} icon={<CheckCircleOutlined />}>完成谈判</Button>
          )}
          {isBlocked && (
            <Tag color="red" icon={<StopOutlined />}>已拦截 - 请先处理异常</Tag>
          )}
        </Space>
      </div>

      <div className="traceability-info">
        <div className="traceability-title">可追溯信息</div>
        <div className="traceability-item">
          <div>
            <span className="traceability-label">来源：</span>
            由 {data.creator_name || '用户'} 于 {data.created_at} 创建
          </div>
          <div>
            <span className="traceability-label">当前处理人：</span>
            {data.owner_name || '待分配'}
          </div>
          <div>
            <span className="traceability-label">下一步：</span>
            {data.records?.slice(-1)[0]?.next_action || '等待处理'}
          </div>
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Steps current={getCurrentStepIndex()} items={[
          { title: '创建', description: data.created_at?.slice(0, 10) },
          { title: '提交', description: data.submitted_at ? data.submitted_at.slice(0, 10) : '待提交' },
          { title: '执行', description: data.status === 'executing' || data.status === 'reviewing' ? '进行中' : '待执行' },
          { title: '审核', description: data.reviewed_at ? data.reviewed_at.slice(0, 10) : '待审核' },
          { title: '完成', description: data.completed_at ? data.completed_at.slice(0, 10) : '待完成' }
        ]} />
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="基本信息" className="detail-section">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="编号">{data.code}</Descriptions.Item>
              <Descriptions.Item label="标题">{data.title}</Descriptions.Item>
              <Descriptions.Item label="采购品类">{data.category_name}</Descriptions.Item>
              <Descriptions.Item label="供应商">{data.supplier_name}</Descriptions.Item>
              <Descriptions.Item label="负责人">{data.owner_name}</Descriptions.Item>
              <Descriptions.Item label="审核人">{data.auditor_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="预算金额">¥{data.expected_amount?.toLocaleString() || 0}</Descriptions.Item>
              <Descriptions.Item label="最终金额">{data.final_amount ? `¥${data.final_amount.toLocaleString()}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="风险预警" span={2}>
                {data.risk_alerts ? (
                  <Tag color="red">{data.risk_alerts}</Tag>
                ) : <Tag color="green">无风险</Tag>}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="谈判明细" style={{ marginTop: 16 }} className="detail-section">
            <Table
              columns={detailColumns}
              dataSource={data.details}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>

          {data.negotiation_strategy && (
            <Card title="谈判策略" style={{ marginTop: 16 }} className="detail-section">
              <div className="strategy-content">
                {(() => {
                  try {
                    const strategy = JSON.parse(data.negotiation_strategy)
                    return (
                      <List
                        dataSource={[
                          `价格策略：${strategy.priceStrategy}`,
                          `风险控制：${strategy.riskControl}`,
                          `付款方式：${strategy.paymentTerms}`,
                          `交付条款：${strategy.deliveryTerms}`,
                          `建议：${strategy.suggestions?.join('；')}`
                        ]}
                        renderItem={item => <List.Item>{item}</List.Item>}
                      />
                    )
                  } catch {
                    return <pre>{data.negotiation_strategy}</pre>
                  }
                })()}
              </div>
            </Card>
          )}

          {data.exceptions?.length > 0 && (
            <Card title="异常处理记录" style={{ marginTop: 16 }} className="detail-section exception-card">
              <List
                dataSource={data.exceptions}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.exception_type}
                      description={item.description}
                    />
                    <Tag color={item.result_type === 'auto_blocked' ? 'red' : item.result_type === 'manual_review' ? 'orange' : 'blue'}>
                      {item.result_type}
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>

        <Col span={8}>
          <Card title="处理轨迹" extra={<HistoryOutlined />}>
            <Timeline>
              {data.records?.map((record, index) => (
                <Timeline.Item key={record.id}>
                  <div>
                    <strong>{actionMap[record.action] || record.action}</strong>
                    <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                      {record.operator_name} - {record.created_at}
                    </span>
                  </div>
                  <div className="timeline-item-content">
                    <div>{record.content}</div>
                    {record.reason && <div style={{ color: '#f5222d', marginTop: 4 }}>原因：{record.reason}</div>}
                    {record.next_action && <div style={{ color: '#1890ff', marginTop: 4 }}>下一步：{record.next_action}</div>}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>

          {data.versions?.length > 0 && (
            <Card title="历史版本" style={{ marginTop: 16 }}>
              <List
                size="small"
                dataSource={data.versions}
                renderItem={item => (
                  <List.Item>
                    <span>版本 {item.version}</span>
                    <span style={{ color: '#999' }}>{item.created_at}</span>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title={reviewAction === 'approve' ? '审核通过' : reviewAction === 'return' ? '审核退回' : '完成谈判'}
        open={reviewModal}
        onOk={submitReview}
        onCancel={() => setReviewModal(false)}
      >
        <Form form={form} layout="vertical">
          {reviewAction === 'return' && (
            <Form.Item name="reason" label="退回原因" rules={[{ required: true, message: '请填写退回原因' }]}>
              <Input.TextArea rows={4} placeholder="请填写退回原因" />
            </Form.Item>
          )}
          {reviewAction === 'complete' && (
            <>
              <Form.Item name="final_price" label="最终单价">
                <Input />
              </Form.Item>
              <Form.Item name="final_amount" label="最终金额">
                <Input />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="人工解除拦截"
        open={unblockModal}
        onOk={handleUnblock}
        onCancel={() => setUnblockModal(false)}
        okText="确认解除拦截"
        okButtonProps={{ danger: true }}
        width={600}
      >
        <Alert
          message="人工介入风险提示"
          description="解除拦截后，谈判流程将恢复正常。请确认已充分评估风险，并在下方说明解除原因。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={unblockForm} layout="vertical">
          <Form.Item name="reason" label="解除拦截原因" rules={[{ required: true, message: '请填写解除拦截原因' }]}>
            <Input.TextArea 
              rows={4} 
              placeholder="请说明：风险评估情况、解除理由、后续管控措施"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default NegotiationDetail
