import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Steps,
  Timeline,
  Modal,
  Input,
  Select,
  Table,
  Tabs,
  Descriptions,
  Statistic,
  Alert,
  message,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  SyncOutlined,
  DollarOutlined,
  SwapOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { transactionApi } from '../../services/api'
import { formatCurrency, formatDate, getStatusTag, NODE_NAMES, WORKFLOW_NODES, ACTION_NAMES } from '../../utils/constants'
import { useAuthStore } from '../../store'

const { TextArea } = Input
const { TabPane } = Tabs
const { Step } = Steps

const NODE_ICONS = {
  [WORKFLOW_NODES.CREATE_COLLECTION]: <DollarOutlined />,
  [WORKFLOW_NODES.WAITING_PAYMENT]: <DollarOutlined />,
  [WORKFLOW_NODES.EXCHANGE_RATE]: <SwapOutlined />,
  [WORKFLOW_NODES.COMPLIANCE_AUDIT]: <SafetyCertificateOutlined />,
  [WORKFLOW_NODES.WAITING_SETTLEMENT]: <BankOutlined />,
  [WORKFLOW_NODES.SETTLEMENT_COMPLETED]: <CheckCircleOutlined />,
  [WORKFLOW_NODES.EXCEPTION_HANDLE]: <ExclamationCircleOutlined />,
}

const STEP_NODES = [
  { code: WORKFLOW_NODES.CREATE_COLLECTION, name: '创建收款' },
  { code: WORKFLOW_NODES.WAITING_PAYMENT, name: '待支付' },
  { code: WORKFLOW_NODES.EXCHANGE_RATE, name: '汇率换算' },
  { code: WORKFLOW_NODES.COMPLIANCE_AUDIT, name: '合规审核' },
  { code: WORKFLOW_NODES.WAITING_SETTLEMENT, name: '待结算' },
  { code: WORKFLOW_NODES.SETTLEMENT_COMPLETED, name: '结算完成' },
]

function TransactionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [actionModal, setActionModal] = useState({
    visible: false,
    action: null,
    title: '',
  })
  const [actionComment, setActionComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadDetail()
    }
  }, [id])

  const loadDetail = async () => {
    setLoading(true)
    try {
      const res = await transactionApi.getDetail(id)
      if (res.data.success) {
        setData(res.data.data)
      }
    } catch (err) {
      console.error('Load detail error:', err)
      message.error('加载交易详情失败')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStep = () => {
    if (!data) return 0
    const currentNode = data.current_node
    const idx = STEP_NODES.findIndex((s) => s.code === currentNode)
    if (idx >= 0) return idx
    
    if (currentNode === WORKFLOW_NODES.EXCEPTION_HANDLE) {
      return -1
    }
    return 0
  }

  const getAvailableActions = () => {
    if (!data) return []
    const node = data.current_node
    const actions = []

    switch (node) {
      case WORKFLOW_NODES.CREATE_COLLECTION:
        if (user?.role_code === 'ADMIN' || user?.role_code === 'MERCHANT' || user?.role_code === 'MERCHANT_ADMIN') {
          actions.push({ key: 'submit_to_payment', label: '提交支付', type: 'primary', danger: false })
        }
        break

      case WORKFLOW_NODES.WAITING_PAYMENT:
        if (user?.role_code === 'ADMIN' || user?.role_code === 'PAYMENT_INSTITUTION') {
          actions.push({ key: 'process_payment_success', label: '支付成功', type: 'primary', danger: false })
          actions.push({ key: 'process_payment_fail', label: '支付失败', type: 'default', danger: true })
        }
        break

      case WORKFLOW_NODES.COMPLIANCE_AUDIT:
        if (user?.role_code === 'ADMIN' || user?.role_code === 'COMPLIANCE') {
          actions.push({ key: 'compliance_approve', label: '审核通过', type: 'primary', danger: false })
          actions.push({ key: 'compliance_reject', label: '审核驳回', type: 'default', danger: true })
          actions.push({ key: 'compliance_request_more', label: '要求补充资料', type: 'default', danger: false })
        }
        break

      case WORKFLOW_NODES.WAITING_SETTLEMENT:
        if (user?.role_code === 'ADMIN' || user?.role_code === 'FINANCE' || user?.role_code === 'BANK') {
          actions.push({ key: 'settlement_success', label: '结算完成', type: 'primary', danger: false })
          actions.push({ key: 'settlement_fail', label: '结算失败', type: 'default', danger: true })
        }
        break

      case WORKFLOW_NODES.EXCEPTION_HANDLE:
        if (user?.role_code === 'ADMIN' || user?.role_code === 'FINANCE' || user?.role_code === 'COMPLIANCE') {
          actions.push({ key: 'retry_payment', label: '重试支付', type: 'default', danger: false })
          actions.push({ key: 'retry_compliance', label: '重试合规审核', type: 'default', danger: false })
          actions.push({ key: 'retry_settlement', label: '重试结算', type: 'default', danger: false })
          actions.push({ key: 'cancel', label: '取消交易', type: 'default', danger: true })
        }
        break
    }

    return actions
  }

  const handleAction = (actionKey) => {
    let title = ''
    switch (actionKey) {
      case 'submit_to_payment':
        title = '确认提交支付'
        break
      case 'process_payment_success':
        title = '确认支付成功'
        break
      case 'process_payment_fail':
        title = '确认支付失败'
        break
      case 'compliance_approve':
        title = '确认审核通过'
        break
      case 'compliance_reject':
        title = '确认审核驳回'
        break
      case 'compliance_request_more':
        title = '要求补充资料'
        break
      case 'settlement_success':
        title = '确认结算完成'
        break
      case 'settlement_fail':
        title = '确认结算失败'
        break
      case 'retry_payment':
      case 'retry_compliance':
      case 'retry_settlement':
      case 'cancel':
        title = ACTION_NAMES[actionKey] || actionKey
        break
    }

    setActionModal({
      visible: true,
      action: actionKey,
      title,
    })
    setActionComment('')
  }

  const executeAction = async () => {
    setActionLoading(true)
    try {
      let res = null
      const { action } = actionModal

      switch (action) {
        case 'submit_to_payment':
          res = await transactionApi.transitionToPayment(id, {})
          break

        case 'process_payment_success':
          res = await transactionApi.processPayment(id, {
            success: true,
            comment: actionComment,
          })
          break

        case 'process_payment_fail':
          res = await transactionApi.processPayment(id, {
            success: false,
            reason: actionComment || '支付失败',
          })
          break

        case 'compliance_approve':
          res = await transactionApi.processCompliance(id, {
            action: 'approve',
            comment: actionComment,
          })
          break

        case 'compliance_reject':
          res = await transactionApi.processCompliance(id, {
            action: 'reject',
            comment: actionComment,
          })
          break

        case 'compliance_request_more':
          res = await transactionApi.processCompliance(id, {
            action: 'request_more',
            comment: actionComment,
          })
          break

        case 'settlement_success':
          res = await transactionApi.processSettlement(id, {
            success: true,
            remark: actionComment,
          })
          break

        case 'settlement_fail':
          res = await transactionApi.processSettlement(id, {
            success: false,
            reason: actionComment || '结算失败',
          })
          break

        case 'retry_payment':
        case 'retry_compliance':
        case 'retry_settlement':
        case 'cancel':
          res = await transactionApi.handleException(id, {
            action,
            resolution: actionComment,
          })
          break
      }

      if (res?.data?.success) {
        message.success('操作成功')
        setActionModal({ ...actionModal, visible: false })
        loadDetail()
      }
    } catch (err) {
      console.error('Execute action error:', err)
      message.error(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const actions = getAvailableActions()
  const currentStep = getCurrentStep()

  const detailColumns = [
    { title: '项目编号', dataIndex: 'item_no', key: 'item_no' },
    { title: '项目名称', dataIndex: 'item_name', key: 'item_name' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price' },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val, record) => formatCurrency(val, data?.currency),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag>{status || '待处理'}</Tag>,
    },
  ]

  if (!data && !loading) {
    return (
      <div>
        <div className="page-header">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">交易不存在</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/transactions')}
          style={{ marginRight: 12 }}
        >
          返回列表
        </Button>
        <span className="page-title" style={{ verticalAlign: 'middle' }}>
          交易详情 - {data?.order_no}
        </span>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Tag color={getStatusTag(data?.status)?.color} style={{ fontSize: 14, padding: '4px 12px' }}>
            {getStatusTag(data?.status)?.text}
          </Tag>
          <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
            {NODE_NAMES[data?.current_node] || data?.current_node}
          </Tag>
        </div>
      </div>

      {data?.is_exception === 1 && (
        <Alert
          message="异常处理中"
          description={data.exception_reason || '该交易处于异常处理状态'}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {actions.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontWeight: 500, marginRight: 16 }}>可用操作：</span>
              <Space>
                {actions.map((action) => (
                  <Button
                    key={action.key}
                    type={action.type}
                    danger={action.danger}
                    onClick={() => handleAction(action.key)}
                  >
                    {action.label}
                  </Button>
                ))}
              </Space>
            </div>
          </div>
        </Card>
      )}

      <div className="stepper-container" style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep >= 0 ? currentStep : 5}
          status={currentStep >= 0 ? 'process' : 'error'}
          items={STEP_NODES.map((node, idx) => ({
            title: node.name,
            icon: NODE_ICONS[node.code],
          }))}
        />
        {currentStep < 0 && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Tag color="red" icon={<ExclamationCircleOutlined />}>
              当前处于异常处理状态
            </Tag>
          </div>
        )}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="单号">{data?.order_no}</Descriptions.Item>
              <Descriptions.Item label="商户">{data?.merchant_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="买家">{data?.buyer_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="买家邮箱">{data?.buyer_email || '-'}</Descriptions.Item>
              <Descriptions.Item label="原币金额">
                <span style={{ fontWeight: 600, fontSize: 16 }}>
                  {formatCurrency(data?.amount, data?.currency)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="目标币种金额">
                {data?.target_amount ? (
                  <span style={{ fontWeight: 600, fontSize: 16, color: '#1890ff' }}>
                    {formatCurrency(data?.target_amount, data?.target_currency)}
                  </span>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="汇率">{data?.exchange_rate || '-'}</Descriptions.Item>
              <Descriptions.Item label="手续费">
                {data?.fee_amount ? formatCurrency(data?.fee_amount, data?.fee_currency) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="净额">
                {data?.net_amount ? (
                  <span style={{ fontWeight: 600, color: '#52c41a' }}>
                    {formatCurrency(data?.net_amount, data?.target_currency)}
                  </span>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="描述">{data?.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="期望完成时间">
                {data?.expected_completion_time ? formatDate(data.expected_completion_time) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="责任人">{data?.responsible_user_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDate(data?.created_at)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDate(data?.updated_at)}</Descriptions.Item>
            </Descriptions>
          </Card>

          {data?.details?.length > 0 && (
            <Card title="明细项目" style={{ marginBottom: 24 }}>
              <Table
                columns={detailColumns}
                dataSource={data.details}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          )}

          <Card title="流转时间线">
            <Timeline mode="left">
              {(data?.nodes || []).slice().reverse().map((node, idx) => (
                <Timeline.Item
                  key={node.id || idx}
                  color={node.status === 'COMPLETED' ? 'green' : node.status === 'IN_PROGRESS' ? 'blue' : 'gray'}
                  dot={
                    node.status === 'COMPLETED' ? (
                      <CheckCircleOutlined style={{ fontSize: 16 }} />
                    ) : node.status === 'IN_PROGRESS' ? (
                      <ClockCircleOutlined style={{ fontSize: 16 }} />
                    ) : null
                  }
                >
                  <div className="timeline-node">
                    <div className="node-content">
                      <div className="node-header">
                        <span className="node-title">{node.node_name}</span>
                        <span className="node-time">{formatDate(node.entered_at)}</span>
                      </div>
                      {node.comment && <div className="node-body">{node.comment}</div>}
                      <div className="node-footer">
                        {node.processed_by_name && <span>处理人: {node.processed_by_name}</span>}
                        {node.processing_result && (
                          <Tag color={node.processing_result === 'SUCCESS' || node.processing_result === 'APPROVED' ? 'green' : 'orange'}>
                            {node.processing_result}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="统计概览" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="原币金额"
                  value={data?.amount || 0}
                  suffix={data?.currency}
                  valueStyle={{ fontSize: 18 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="目标金额"
                  value={data?.target_amount || 0}
                  suffix={data?.target_currency}
                  valueStyle={{ fontSize: 18, color: '#1890ff' }}
                />
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="手续费"
                  value={data?.fee_amount || 0}
                  valueStyle={{ fontSize: 14, color: '#ff4d4f' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="实收净额"
                  value={data?.net_amount || 0}
                  valueStyle={{ fontSize: 14, color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>

          {data?.exceptions?.length > 0 && (
            <Card title="异常记录" style={{ marginBottom: 24 }}>
              {data.exceptions.map((ex, idx) => (
                <div key={ex.id || idx} className="exception-card">
                  <div className="exception-title">
                    <Tag color={ex.status === 'RESOLVED' ? 'green' : 'red'}>
                      {ex.type}
                    </Tag>
                    {ex.status}
                  </div>
                  <div className="exception-content">{ex.message}</div>
                  {ex.details && <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>{ex.details}</div>}
                  {ex.resolution && <div style={{ fontSize: 12, color: '#52c41a', marginTop: 8 }}>处理结果: {ex.resolution}</div>}
                </div>
              ))}
            </Card>
          )}

          {data?.messages?.length > 0 && (
            <Card title="消息通知">
              {data.messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  style={{
                    padding: '8px 0',
                    borderBottom: idx < data.messages.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>{msg.title}</span>
                    {msg.is_read === 0 && <span className="badge-dot" />}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{msg.content}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{formatDate(msg.created_at)}</div>
                </div>
              ))}
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title={actionModal.title}
        open={actionModal.visible}
        onOk={executeAction}
        onCancel={() => setActionModal({ ...actionModal, visible: false })}
        confirmLoading={actionLoading}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <p>请确认执行此操作：</p>
          <p style={{ fontWeight: 500, color: '#1890ff' }}>{actionModal.title}</p>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>备注说明（可选）：</label>
          <TextArea
            rows={4}
            placeholder="请输入备注说明..."
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}

export default TransactionDetail
