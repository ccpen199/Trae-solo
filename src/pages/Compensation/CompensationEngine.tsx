import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  Input,
  InputNumber,
  Select,
  Space,
  Row,
  Col,
  Typography,
  Alert,
  Switch,
  Form,
  Tabs,
  Divider,
  message,
  Statistic,
} from 'antd'
import {
  DollarOutlined,
  SettingOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalculatorOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { compensationRules, compensationClaims, replacementRequests } from '@/mock/data'
import type { CompensationClaim, CompensationRule, ReplacementRequest } from '@/types'
import { useState } from 'react'

const { TextArea } = Input
const { Title } = Typography

const claimStatusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待审核' },
  approved: { color: 'blue', label: '已批准' },
  rejected: { color: 'red', label: '已驳回' },
  paid: { color: 'green', label: '已支付' },
}

const calcMethodMap: Record<string, { color: string; label: string }> = {
  fixed: { color: 'blue', label: '固定金额' },
  percentage: { color: 'orange', label: '按比例' },
  tiered: { color: 'purple', label: '阶梯计算' },
}

const replacementStatusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待调度' },
  auto_dispatched: { color: 'blue', label: '自动调度' },
  manual_assigned: { color: 'cyan', label: '手动指派' },
  completed: { color: 'green', label: '已完成' },
}

const categoryOptions = [
  { label: '服务质量', value: '服务质量' },
  { label: '服务时效', value: '服务时效' },
  { label: '服务纪律', value: '服务纪律' },
  { label: '劳动权益', value: '劳动权益' },
  { label: '财产损失', value: '财产损失' },
]

const calcMethodOptions = [
  { label: '固定金额 (fixed)', value: 'fixed' },
  { label: '按比例 (percentage)', value: 'percentage' },
  { label: '阶梯计算 (tiered)', value: 'tiered' },
]

const workerPool = ['赵小丽', '刘芳', '周桂兰', '王美华', '孙伟']

const CompensationEngine: React.FC = () => {
  const [claims, setClaims] = useState<CompensationClaim[]>([...compensationClaims])
  const [rules, setRules] = useState<CompensationRule[]>([...compensationRules])
  const [replacements, setReplacements] = useState<ReplacementRequest[]>([...replacementRequests])

  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentClaim, setCurrentClaim] = useState<CompensationClaim | null>(null)
  const [approvedAmount, setApprovedAmount] = useState<number>(0)

  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [editRule, setEditRule] = useState<CompensationRule | null>(null)
  const [ruleForm] = Form.useForm()

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [dispatchDetailModalOpen, setDispatchDetailModalOpen] = useState(false)
  const [currentReplacement, setCurrentReplacement] = useState<ReplacementRequest | null>(null)
  const [dispatchResult, setDispatchResult] = useState<{ name: string; time: string } | null>(null)

  const pendingCount = claims.filter((c) => c.status === 'pending').length
  const approvedCount = claims.filter((c) => c.status === 'approved').length
  const paidCount = claims.filter((c) => c.status === 'paid').length

  const pendingReplaceCount = replacements.filter((r) => r.status === 'pending').length
  const dispatchedReplaceCount = replacements.filter(
    (r) => r.status === 'auto_dispatched' || r.status === 'manual_assigned',
  ).length

  const openAuditModal = (claim: CompensationClaim) => {
    setCurrentClaim(claim)
    setApprovedAmount(claim.amount)
    setAuditModalOpen(true)
  }

  const handleApprove = () => {
    if (!currentClaim) return
    setClaims((prev) =>
      prev.map((c) =>
        c.id === currentClaim.id
          ? { ...c, status: 'approved' as const, approvedAmount, processedAt: new Date().toISOString() }
          : c,
      ),
    )
    setAuditModalOpen(false)
    message.success(`赔付单 ${currentClaim.id} 已批准，批准金额 ¥${approvedAmount}`)
  }

  const handleReject = () => {
    if (!currentClaim) return
    setClaims((prev) =>
      prev.map((c) =>
        c.id === currentClaim.id
          ? { ...c, status: 'rejected' as const, processedAt: new Date().toISOString() }
          : c,
      ),
    )
    setAuditModalOpen(false)
    message.error(`赔付单 ${currentClaim.id} 已驳回`)
  }

  const openDetailModal = (claim: CompensationClaim) => {
    setCurrentClaim(claim)
    setDetailModalOpen(true)
  }

  const toggleRuleActive = (ruleId: string, checked: boolean) => {
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, isActive: checked } : r)))
    message.info(`规则 ${ruleId} 已${checked ? '启用' : '停用'}`)
  }

  const openAddRuleModal = () => {
    setEditRule(null)
    ruleForm.resetFields()
    setRuleModalOpen(true)
  }

  const openEditRuleModal = (rule: CompensationRule) => {
    setEditRule(rule)
    ruleForm.setFieldsValue(rule)
    setRuleModalOpen(true)
  }

  const handleRuleSubmit = () => {
    ruleForm.validateFields().then((values) => {
      if (editRule) {
        setRules((prev) =>
          prev.map((r) => (r.id === editRule.id ? { ...r, ...values } : r)),
        )
        message.success(`规则 ${editRule.id} 已更新`)
      } else {
        const newRule: CompensationRule = {
          id: `RULE${String(rules.length + 1).padStart(3, '0')}`,
          ...values,
          isActive: true,
        }
        setRules((prev) => [...prev, newRule])
        message.success(`规则 ${newRule.id} 已创建`)
      }
      setRuleModalOpen(false)
    })
  }

  const openDispatchModal = (req: ReplacementRequest) => {
    setCurrentReplacement(req)
    const randomWorker = workerPool[Math.floor(Math.random() * workerPool.length)]
    setDispatchResult({
      name: randomWorker,
      time: new Date().toLocaleString('zh-CN'),
    })
    setDispatchModalOpen(true)
  }

  const handleConfirmDispatch = () => {
    if (!currentReplacement || !dispatchResult) return
    setReplacements((prev) =>
      prev.map((r) =>
        r.id === currentReplacement.id
          ? {
              ...r,
              status: 'auto_dispatched' as const,
              newWorkerName: dispatchResult.name,
              dispatchedAt: new Date().toISOString(),
            }
          : r,
      ),
    )
    setDispatchModalOpen(false)
    message.success(`请求 ${currentReplacement.id} 已自动调度至 ${dispatchResult.name}`)
  }

  const openDispatchDetailModal = (req: ReplacementRequest) => {
    setCurrentReplacement(req)
    setDispatchDetailModalOpen(true)
  }

  const claimColumns = [
    { title: '赔付ID', dataIndex: 'id', key: 'id' },
    { title: '工单号', dataIndex: 'orderId', key: 'orderId' },
    { title: '雇主', dataIndex: 'employerName', key: 'employerName' },
    { title: '劳动者', dataIndex: 'workerName', key: 'workerName' },
    { title: '赔付原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '申请金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '批准金额',
      dataIndex: 'approvedAmount',
      key: 'approvedAmount',
      render: (v: number | undefined) => (v != null ? `¥${v.toLocaleString()}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const tag = claimStatusMap[status] || { color: 'default', label: status }
        return <Tag color={tag.color}>{tag.label}</Tag>
      },
    },
    {
      title: '适用规则',
      dataIndex: 'appliedRules',
      key: 'appliedRules',
      render: (rules: string[]) =>
        rules.map((r) => <Tag key={r}>{r}</Tag>),
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: CompensationClaim) =>
        record.status === 'pending' ? (
          <Button type="link" size="small" onClick={() => openAuditModal(record)}>
            审核
          </Button>
        ) : (
          <Button type="link" size="small" onClick={() => openDetailModal(record)}>
            详情
          </Button>
        ),
    },
  ]

  const ruleColumns = [
    { title: '规则ID', dataIndex: 'id', key: 'id' },
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    {
      title: '适用条件',
      dataIndex: 'condition',
      key: 'condition',
      ellipsis: true,
    },
    {
      title: '赔付类别',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '最大金额',
      dataIndex: 'maxAmount',
      key: 'maxAmount',
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '计算方式',
      dataIndex: 'calculationMethod',
      key: 'calculationMethod',
      render: (v: string) => {
        const tag = calcMethodMap[v] || { color: 'default', label: v }
        return <Tag color={tag.color}>{tag.label}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean, record: CompensationRule) => (
        <Switch checked={v} onChange={(checked) => toggleRuleActive(record.id, checked)} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: CompensationRule) => (
        <Button type="link" size="small" onClick={() => openEditRuleModal(record)}>
          编辑
        </Button>
      ),
    },
  ]

  const replacementColumns = [
    { title: '请求ID', dataIndex: 'id', key: 'id' },
    { title: '工单号', dataIndex: 'orderId', key: 'orderId' },
    { title: '雇主', dataIndex: 'employerName', key: 'employerName' },
    { title: '原劳动者', dataIndex: 'originalWorkerName', key: 'originalWorkerName' },
    {
      title: '新劳动者',
      dataIndex: 'newWorkerName',
      key: 'newWorkerName',
      render: (v: string | undefined) => v || '-',
    },
    { title: '更换原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const tag = replacementStatusMap[status] || { color: 'default', label: status }
        return <Tag color={tag.color}>{tag.label}</Tag>
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '调度时间',
      dataIndex: 'dispatchedAt',
      key: 'dispatchedAt',
      render: (v: string | undefined) => (v ? new Date(v).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ReplacementRequest) =>
        record.status === 'pending' ? (
          <Button type="link" size="small" onClick={() => openDispatchModal(record)}>
            自动调度
          </Button>
        ) : (
          <Button type="link" size="small" onClick={() => openDispatchDetailModal(record)}>
            详情
          </Button>
        ),
    },
  ]

  return (
    <div className="page-container">
      <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>
        赔付规则引擎与理赔管理
      </Title>

      <Tabs
        defaultActiveKey="claims"
        items={[
          {
            key: 'claims',
            label: '赔付工单',
            icon: <FileTextOutlined />,
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="待审核"
                        value={pendingCount}
                        prefix={<CalculatorOutlined style={{ color: '#fa8c16' }} />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="已批准"
                        value={approvedCount}
                        prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="已支付"
                        value={paidCount}
                        prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card>
                  <Table
                    columns={claimColumns}
                    dataSource={claims}
                    rowKey="id"
                    size="small"
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'rules',
            label: '赔付规则配置',
            icon: <SettingOutlined />,
            children: (
              <Card
                title="规则列表"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={openAddRuleModal}>
                    新增规则
                  </Button>
                }
              >
                <Table
                  columns={ruleColumns}
                  dataSource={rules}
                  rowKey="id"
                  size="small"
                />
              </Card>
            ),
          },
          {
            key: 'replacement',
            label: '更换服务调度',
            icon: <DollarOutlined />,
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="待调度"
                        value={pendingReplaceCount}
                        prefix={<CloseCircleOutlined style={{ color: '#fa8c16' }} />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="已调度"
                        value={dispatchedReplaceCount}
                        prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card>
                  <Table
                    columns={replacementColumns}
                    dataSource={replacements}
                    rowKey="id"
                    size="small"
                  />
                </Card>
              </>
            ),
          },
        ]}
      />

      <Modal
        title="赔付审核"
        open={auditModalOpen}
        onCancel={() => setAuditModalOpen(false)}
        footer={null}
        width={640}
      >
        {currentClaim && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="赔付ID">{currentClaim.id}</Descriptions.Item>
              <Descriptions.Item label="工单号">{currentClaim.orderId}</Descriptions.Item>
              <Descriptions.Item label="雇主">{currentClaim.employerName}</Descriptions.Item>
              <Descriptions.Item label="劳动者">{currentClaim.workerName}</Descriptions.Item>
              <Descriptions.Item label="赔付原因" span={2}>{currentClaim.reason}</Descriptions.Item>
              <Descriptions.Item label="申请金额">¥{currentClaim.amount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {new Date(currentClaim.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="适用规则" span={2}>
                {currentClaim.appliedRules.map((r) => <Tag key={r}>{r}</Tag>)}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <span style={{ marginRight: 8 }}>批准金额：</span>
              <InputNumber
                value={approvedAmount}
                onChange={(v) => setApprovedAmount(v ?? 0)}
                min={0}
                max={currentClaim.amount}
                prefix="¥"
                style={{ width: 200 }}
              />
            </div>

            <Space>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApprove}>
                批准
              </Button>
              <Button danger icon={<CloseCircleOutlined />} onClick={handleReject}>
                驳回
              </Button>
            </Space>
          </>
        )}
      </Modal>

      <Modal
        title="赔付详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={640}
      >
        {currentClaim && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="赔付ID">{currentClaim.id}</Descriptions.Item>
            <Descriptions.Item label="工单号">{currentClaim.orderId}</Descriptions.Item>
            <Descriptions.Item label="雇主">{currentClaim.employerName}</Descriptions.Item>
            <Descriptions.Item label="劳动者">{currentClaim.workerName}</Descriptions.Item>
            <Descriptions.Item label="赔付原因" span={2}>{currentClaim.reason}</Descriptions.Item>
            <Descriptions.Item label="申请金额">¥{currentClaim.amount.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="批准金额">
              {currentClaim.approvedAmount != null ? `¥${currentClaim.approvedAmount.toLocaleString()}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={claimStatusMap[currentClaim.status]?.color}>
                {claimStatusMap[currentClaim.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="申请时间">
              {new Date(currentClaim.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="适用规则" span={2}>
              {currentClaim.appliedRules.map((r) => <Tag key={r}>{r}</Tag>)}
            </Descriptions.Item>
            {currentClaim.processedAt && (
              <Descriptions.Item label="处理时间" span={2}>
                {new Date(currentClaim.processedAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={editRule ? '编辑规则' : '新增规则'}
        open={ruleModalOpen}
        onCancel={() => setRuleModalOpen(false)}
        onOk={handleRuleSubmit}
        width={600}
      >
        <Form form={ruleForm} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="condition" label="适用条件" rules={[{ required: true, message: '请输入适用条件' }]}>
            <TextArea rows={3} placeholder="请输入适用条件" />
          </Form.Item>
          <Form.Item name="category" label="赔付类别" rules={[{ required: true, message: '请选择赔付类别' }]}>
            <Select options={categoryOptions} placeholder="请选择赔付类别" />
          </Form.Item>
          <Form.Item name="maxAmount" label="最大金额" rules={[{ required: true, message: '请输入最大金额' }]}>
            <InputNumber min={0} prefix="¥" style={{ width: '100%' }} placeholder="请输入最大金额" />
          </Form.Item>
          <Form.Item name="calculationMethod" label="计算方式" rules={[{ required: true, message: '请选择计算方式' }]}>
            <Select options={calcMethodOptions} placeholder="请选择计算方式" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="自动调度"
        open={dispatchModalOpen}
        onCancel={() => setDispatchModalOpen(false)}
        footer={null}
        width={600}
      >
        {currentReplacement && dispatchResult && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="请求ID">{currentReplacement.id}</Descriptions.Item>
              <Descriptions.Item label="工单号">{currentReplacement.orderId}</Descriptions.Item>
              <Descriptions.Item label="雇主">{currentReplacement.employerName}</Descriptions.Item>
              <Descriptions.Item label="原劳动者">{currentReplacement.originalWorkerName}</Descriptions.Item>
              <Descriptions.Item label="更换原因" span={2}>{currentReplacement.reason}</Descriptions.Item>
            </Descriptions>

            <Alert
              message="模拟调度结果"
              description={
                <div>
                  <p>推荐劳动者：<strong>{dispatchResult.name}</strong></p>
                  <p>预计调度时间：{dispatchResult.time}</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Space>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleConfirmDispatch}>
                确认调度
              </Button>
              <Button onClick={() => setDispatchModalOpen(false)}>取消</Button>
            </Space>
          </>
        )}
      </Modal>

      <Modal
        title="调度详情"
        open={dispatchDetailModalOpen}
        onCancel={() => setDispatchDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {currentReplacement && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="请求ID">{currentReplacement.id}</Descriptions.Item>
            <Descriptions.Item label="工单号">{currentReplacement.orderId}</Descriptions.Item>
            <Descriptions.Item label="雇主">{currentReplacement.employerName}</Descriptions.Item>
            <Descriptions.Item label="原劳动者">{currentReplacement.originalWorkerName}</Descriptions.Item>
            <Descriptions.Item label="新劳动者">
              {currentReplacement.newWorkerName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={replacementStatusMap[currentReplacement.status]?.color}>
                {replacementStatusMap[currentReplacement.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="更换原因" span={2}>{currentReplacement.reason}</Descriptions.Item>
            <Descriptions.Item label="申请时间">
              {new Date(currentReplacement.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="调度时间">
              {currentReplacement.dispatchedAt
                ? new Date(currentReplacement.dispatchedAt).toLocaleString('zh-CN')
                : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default CompensationEngine
