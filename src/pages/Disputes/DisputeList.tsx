import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  Input,
  Select,
  Space,
  Row,
  Col,
  Typography,
  Alert,
  Steps,
  Progress,
  Badge,
  Tabs,
  Divider,
  Tooltip,
  message,
} from 'antd'
import {
  WarningOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  FileSearchOutlined,
} from '@ant-design/icons'
import { disputes } from '@/mock/data'
import type { Dispute, DisputeStatus } from '@/types'

const { Title, Paragraph } = Typography

const statusConfig: Record<DisputeStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  ai_judged: { label: 'AI已判定', color: 'cyan' },
  human_review: { label: '人工复核', color: 'blue' },
  resolved: { label: '已解决', color: 'green' },
}

const initiatorConfig: Record<string, { label: string; color: string }> = {
  employer: { label: '雇主', color: 'blue' },
  worker: { label: '服务人员', color: 'orange' },
}

function getConfidenceTag(confidence: number) {
  if (confidence >= 0.8) return <Tag color="green">高置信</Tag>
  if (confidence >= 0.5) return <Tag color="orange">中置信</Tag>
  return <Tag color="red">低置信</Tag>
}

function getCurrentStep(status: DisputeStatus) {
  const map: Record<DisputeStatus, number> = {
    pending: 0,
    ai_judged: 1,
    human_review: 2,
    resolved: 3,
  }
  return map[status]
}

function generateSimulatedJudgment(dispute: Dispute) {
  const confidence = +(0.6 + Math.random() * 0.3).toFixed(2)
  const resolutions = [
    '建议退还部分服务费用',
    '建议安排补服务一次',
    '建议双方协商调整服务内容',
    '建议补偿优惠券并致歉',
  ]
  const analyses = [
    `根据纠纷描述及关联工单数据分析，${dispute.initiatorName}提出的"${dispute.reason}"诉求具有一定合理性。综合考量服务记录、合同条款及双方评价，建议采用调解方式解决。`,
    `经AI引擎分析，该纠纷涉及"${dispute.reason}"，对比历史同类纠纷处理结果，当前情况属于常见争议范畴。建议优先保障双方权益，通过协商达成一致。`,
  ]
  const rulesPool = [
    '服务质量不达标赔偿',
    '服务超时补偿',
    '服务人员中途离场赔偿',
    '工作条件变更补偿',
  ]
  const relatedRules = rulesPool.slice(0, 1 + Math.floor(Math.random() * 2))

  return {
    suggestedResolution: resolutions[Math.floor(Math.random() * resolutions.length)],
    confidence,
    analysis: analyses[Math.floor(Math.random() * analyses.length)],
    relatedRules,
  }
}

export default function DisputeList() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('全部')
  const [initiatorFilter, setInitiatorFilter] = useState<string>('全部')
  const [modalOpen, setModalOpen] = useState(false)
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [localDisputes, setLocalDisputes] = useState<Dispute[]>(disputes)

  const filteredData = localDisputes.filter((d) => {
    const matchSearch =
      !searchText ||
      d.id.toLowerCase().includes(searchText.toLowerCase()) ||
      d.initiatorName.includes(searchText)
    const matchStatus = statusFilter === '全部' || d.status === statusFilter
    const matchInitiator = initiatorFilter === '全部' || d.initiatorType === initiatorFilter
    return matchSearch && matchStatus && matchInitiator
  })

  const handleOpenModal = (dispute: Dispute) => {
    setCurrentDispute(dispute)
    if (dispute.aiJudgment) {
      setAiLoading(false)
      setModalOpen(true)
    } else {
      setAiLoading(true)
      setModalOpen(true)
      setTimeout(() => {
        const judgment = generateSimulatedJudgment(dispute)
        setLocalDisputes((prev) =>
          prev.map((d) =>
            d.id === dispute.id
              ? { ...d, status: 'ai_judged' as DisputeStatus, aiJudgment: judgment }
              : d
          )
        )
        setCurrentDispute((prev) =>
          prev
            ? { ...prev, status: 'ai_judged' as DisputeStatus, aiJudgment: judgment }
            : prev
        )
        setAiLoading(false)
      }, 1500)
    }
  }

  const handleTransferReview = () => {
    if (!currentDispute) return
    setLocalDisputes((prev) =>
      prev.map((d) =>
        d.id === currentDispute.id ? { ...d, status: 'human_review' as DisputeStatus } : d
      )
    )
    setCurrentDispute((prev) =>
      prev ? { ...prev, status: 'human_review' as DisputeStatus } : prev
    )
    message.success('已转交人工复核')
  }

  const handleMarkResolved = () => {
    if (!currentDispute) return
    setLocalDisputes((prev) =>
      prev.map((d) =>
        d.id === currentDispute.id
          ? { ...d, status: 'resolved' as DisputeStatus, resolvedAt: new Date().toISOString() }
          : d
      )
    )
    setCurrentDispute((prev) =>
      prev
        ? { ...prev, status: 'resolved' as DisputeStatus, resolvedAt: new Date().toISOString() }
        : prev
    )
    message.success('已标记为已解决')
    setModalOpen(false)
  }

  const handleReset = () => {
    setSearchText('')
    setStatusFilter('全部')
    setInitiatorFilter('全部')
  }

  const columns = [
    {
      title: '纠纷ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '工单号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 100,
    },
    {
      title: '发起方',
      dataIndex: 'initiatorType',
      key: 'initiatorType',
      width: 90,
      render: (type: string) => (
        <Tag color={initiatorConfig[type]?.color}>{initiatorConfig[type]?.label}</Tag>
      ),
    },
    {
      title: '发起人',
      dataIndex: 'initiatorName',
      key: 'initiatorName',
      width: 100,
    },
    {
      title: '纠纷原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 160,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text.length > 10 ? `${text.slice(0, 10)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: DisputeStatus) => (
        <Tag color={statusConfig[status]?.color}>{statusConfig[status]?.label}</Tag>
      ),
    },
    {
      title: 'AI判定',
      key: 'aiJudgment',
      width: 90,
      render: (_: unknown, record: Dispute) =>
        record.aiJudgment ? getConfidenceTag(record.aiJudgment.confidence) : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_: unknown, record: Dispute) => (
        <Button
          type="link"
          icon={record.aiJudgment ? <FileSearchOutlined /> : <ThunderboltOutlined />}
          onClick={() => handleOpenModal(record)}
        >
          {record.aiJudgment ? 'AI判定详情' : '进行AI判定'}
        </Button>
      ),
    },
  ]

  const pendingCount = localDisputes.filter((d) => d.status === 'pending').length
  const aiJudgedCount = localDisputes.filter((d) => d.status === 'ai_judged').length
  const humanReviewCount = localDisputes.filter((d) => d.status === 'human_review').length
  const resolvedCount = localDisputes.filter((d) => d.status === 'resolved').length

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Input
              placeholder="纠纷号/发起人"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={[
                { label: '全部', value: '全部' },
                { label: '待处理', value: 'pending' },
                { label: 'AI已判定', value: 'ai_judged' },
                { label: '人工复核', value: 'human_review' },
                { label: '已解决', value: 'resolved' },
              ]}
            />
          </Col>
          <Col>
            <Select
              value={initiatorFilter}
              onChange={setInitiatorFilter}
              style={{ width: 140 }}
              options={[
                { label: '全部', value: '全部' },
                { label: '雇主', value: 'employer' },
                { label: '服务人员', value: 'worker' },
              ]}
            />
          </Col>
          <Col>
            <Button onClick={handleReset}>重置</Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: <Badge count={localDisputes.length} offset={[10, 0]} size="small">全部纠纷</Badge>,
            },
            {
              key: 'pending',
              label: <Badge count={pendingCount} offset={[10, 0]} size="small" color="orange">待处理</Badge>,
            },
            {
              key: 'ai_judged',
              label: <Badge count={aiJudgedCount} offset={[10, 0]} size="small" color="cyan">AI已判定</Badge>,
            },
            {
              key: 'human_review',
              label: <Badge count={humanReviewCount} offset={[10, 0]} size="small" color="blue">人工复核</Badge>,
            },
            {
              key: 'resolved',
              label: <Badge count={resolvedCount} offset={[10, 0]} size="small" color="green">已解决</Badge>,
            },
          ]}
          onChange={(key) => {
            setStatusFilter(key === 'all' ? '全部' : key)
          }}
        />
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>AI纠纷初判引擎</span>
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={720}
        footer={currentDispute?.aiJudgment && !aiLoading ? (
          <Space>
            {currentDispute.status === 'ai_judged' && (
              <Button type="primary" onClick={handleTransferReview}>
                转人工复核
              </Button>
            )}
            {currentDispute.status === 'human_review' && (
              <Button type="primary" onClick={handleMarkResolved}>
                标记已解决
              </Button>
            )}
            <Button onClick={() => setModalOpen(false)}>关闭</Button>
          </Space>
        ) : null}
      >
        {aiLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RobotOutlined spin style={{ fontSize: 48, color: '#1890ff', marginBottom: 24 }} />
            <div style={{ fontSize: 18, color: '#666' }}>AI分析中...</div>
            <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
              正在分析纠纷信息、关联工单与规则库
            </div>
          </div>
        ) : (
          currentDispute?.aiJudgment && (
            <>
              <Alert
                message="纠纷概要"
                type="info"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginBottom: 16 }}
              />
              <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
                <Descriptions.Item label="工单号">{currentDispute.orderId}</Descriptions.Item>
                <Descriptions.Item label="发起人">{currentDispute.initiatorName}</Descriptions.Item>
                <Descriptions.Item label="纠纷原因" span={2}>
                  {currentDispute.reason}
                </Descriptions.Item>
                <Descriptions.Item label="详细描述" span={2}>
                  {currentDispute.description}
                </Descriptions.Item>
              </Descriptions>

              <Card
                style={{
                  marginBottom: 24,
                  borderLeft: '4px solid #1890ff',
                }}
              >
                <Title level={5}>
                  <RobotOutlined style={{ marginRight: 8 }} />
                  AI分析结果
                </Title>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>建议解决方案</div>
                  <Paragraph>
                    {currentDispute.aiJudgment.suggestedResolution}
                  </Paragraph>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>置信度</div>
                  <Progress
                    percent={Math.round(currentDispute.aiJudgment.confidence * 100)}
                    strokeColor={
                      currentDispute.aiJudgment.confidence >= 0.8
                        ? '#52c41a'
                        : currentDispute.aiJudgment.confidence >= 0.5
                          ? '#faad14'
                          : '#ff4d4f'
                    }
                    format={(percent) => `${percent}%`}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>分析过程</div>
                  <Paragraph type="secondary">
                    {currentDispute.aiJudgment.analysis}
                  </Paragraph>
                </div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>关联规则</div>
                  <Space wrap>
                    {currentDispute.aiJudgment.relatedRules.map((rule) => (
                      <Tag key={rule} icon={<FileSearchOutlined />} color="blue">
                        {rule}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </Card>

              <Divider />

              <Title level={5}>处理流程</Title>
              <Steps
                current={getCurrentStep(currentDispute.status)}
                items={[
                  {
                    title: '提交纠纷',
                    icon: <ClockCircleOutlined />,
                  },
                  {
                    title: 'AI初判',
                    icon: <RobotOutlined />,
                  },
                  {
                    title: '人工复核',
                    icon: <SearchOutlined />,
                  },
                  {
                    title: '解决完成',
                    icon: <CheckCircleOutlined />,
                  },
                ]}
              />
            </>
          )
        )}
      </Modal>
    </div>
  )
}
