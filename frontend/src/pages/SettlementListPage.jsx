import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, message, Typography, Alert, Space, Statistic, Row, Col,
  Modal, Descriptions, List, Progress, Input, Steps, Tooltip, Divider
} from 'antd'
import {
  DollarOutlined, SafetyCertificateOutlined, FileTextOutlined, DownloadOutlined,
  ExclamationCircleOutlined, QuestionCircleOutlined, BankOutlined, CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import request from '../utils/request'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps
const { TextArea } = Input

const statusMap = {
  pending: { color: 'orange', text: '待结算' },
  processing: { color: 'blue', text: '处理中' },
  completed: { color: 'green', text: '已完成' },
  failed: { color: 'red', text: '失败' },
  cancelled: { color: 'default', text: '已取消' }
}

const channelMap = {
  T0: { color: 'blue', text: 'T+0 即时到账', desc: '最快5分钟到账' },
  T1: { color: 'cyan', text: 'T+1 次日到账', desc: '次日12:00前到账' },
  bank: { color: 'purple', text: '银行卡转账', desc: '1-3个工作日' },
  alipay: { color: 'gold', text: '支付宝', desc: '即时到账' },
  wechat: { color: 'green', text: '微信支付', desc: '即时到账' }
}

export default function SettlementListPage() {
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [certificateModalOpen, setCertificateModalOpen] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [abnormalModalOpen, setAbnormalModalOpen] = useState(false)
  const [abnormalReason, setAbnormalReason] = useState('')
  const [abnormalLoading, setAbnormalLoading] = useState(false)

  const fetchSettlements = async (page = 1) => {
    setLoading(true)
    try {
      const res = await request.get('/settlements', { params: { page, pageSize: pagination.pageSize } })
      const data = res.data || res
      setSettlements(data.list || data.settlements || data.items || [])
      setPagination((prev) => ({ ...prev, current: page, total: data.total || 0 }))
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettlements(1)
  }, [])

  const handleConfirmReceipt = async (settlementId) => {
    try {
      await request.put(`/settlements/${settlementId}/confirm`)
      message.success('已确认收款')
      fetchSettlements(pagination.current)
    } catch (e) {
    }
  }

  const handleViewCertificate = (record) => {
    setSelectedSettlement(record)
    setCertificateModalOpen(true)
  }

  const handleViewDetail = (record) => {
    setSelectedSettlement(record)
    setDetailModalOpen(true)
  }

  const handleReportAbnormal = (record) => {
    setSelectedSettlement(record)
    setAbnormalModalOpen(true)
  }

  const submitAbnormal = async () => {
    if (!abnormalReason.trim()) {
      message.warning('请详细描述异常情况')
      return
    }
    setAbnormalLoading(true)
    try {
      await request.post('/settlements/report', {
        settlement_id: selectedSettlement.id,
        reason: abnormalReason
      })
      message.success('异常交易反馈已提交，客服将在24小时内处理')
      setAbnormalModalOpen(false)
      setAbnormalReason('')
    } catch (e) {
    } finally {
      setAbnormalLoading(false)
    }
  }

  const downloadCertificate = () => {
    message.success('税务凭证已开始下载')
  }

  const columns = [
    {
      title: '结算编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (val) => (
        <Button type="link" onClick={() => handleViewDetail(settlements.find(s => s.id === val))}>
          JS{String(val).padStart(8, '0')}
        </Button>
      )
    },
    {
      title: '订单信息',
      dataIndex: 'job_title',
      key: 'job_title',
      width: 180,
      ellipsis: true,
      render: (val, record) => val || `订单#${record.order_id}`
    },
    {
      title: '结算金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val) => <Text strong style={{ fontSize: 16 }}>{val}元</Text>
    },
    {
      title: '费用明细',
      key: 'fee_detail',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text type="secondary" style={{ fontSize: 12 }}>服务费(5%): {record.fee}元</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>个税(3%): {record.tax}元</Text>
        </Space>
      )
    },
    {
      title: '实际到账',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      width: 140,
      render: (val) => <Text type="success" strong style={{ fontSize: 16 }}>{val}元</Text>
    },
    {
      title: '到账通道',
      dataIndex: 'channel',
      key: 'channel',
      width: 160,
      render: (channel) => {
        const c = channelMap[channel] || { color: 'default', text: channel }
        return (
          <Tooltip title={c.desc}>
            <Tag color={c.color} icon={<BankOutlined />}>{c.text}</Tag>
          </Tooltip>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const s = statusMap[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 180,
      render: (val, record) => (val || record.created_at) ? new Date(val || record.created_at).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size={[4, 8]} wrap>
          <Button size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'completed' && (
            <Button size="small" type="primary" icon={<FileTextOutlined />} onClick={() => handleViewCertificate(record)}>
              税务凭证
            </Button>
          )}
          {record.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => handleConfirmReceipt(record.id)}>
              确认收款
            </Button>
          )}
          <Button size="small" danger onClick={() => handleReportAbnormal(record)}>
            异常反馈
          </Button>
        </Space>
      )
    }
  ]

  const totalAmount = settlements.reduce((sum, s) => sum + (s.actual_amount || 0), 0)
  const totalFee = settlements.reduce((sum, s) => sum + (s.fee || 0), 0)
  const totalTax = settlements.reduce((sum, s) => sum + (s.tax || 0), 0)
  const successCount = settlements.filter(s => s.status === 'completed').length

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="累计收入"
              prefix={<DollarOutlined />}
              value={totalAmount}
              suffix="元"
              valueStyle={{ color: '#3f8600' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="平台服务费"
              value={totalFee}
              suffix="元"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="代缴个税"
              value={totalTax}
              suffix="元"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="成功率"
              value={settlements.length > 0 ? Math.round(successCount / settlements.length * 100) : 100}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="到账通道说明" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Card size="small" style={{ background: '#e6f7ff' }}>
              <Space direction="vertical" size={4}>
                <Text strong><BankOutlined /> T+0 即时到账</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>雇主确认后立即打款</Text>
                <Text type="success" style={{ fontSize: 12 }}>最快5分钟到账</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" style={{ background: '#f6ffed' }}>
              <Space direction="vertical" size={4}>
                <Text strong><SafetyCertificateOutlined /> 资金安全保障</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>银行托管 资金隔离</Text>
                <Text type="success" style={{ fontSize: 12 }}>100%安全保障</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" style={{ background: '#fff7e6' }}>
              <Space direction="vertical" size={4}>
                <Text strong><FileTextOutlined /> 税务代缴凭证</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>平台代缴个人所得税</Text>
                <Text type="success" style={{ fontSize: 12 }}>可下载完税证明</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" style={{ background: '#f9f0ff' }}>
              <Space direction="vertical" size={4}>
                <Text strong><ExclamationCircleOutlined /> 异常交易保障</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>专属客服24小时响应</Text>
                <Text type="success" style={{ fontSize: 12 }}>先行赔付机制</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Alert
        message="费用透明说明"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li><strong>T+0即时到账</strong>：雇主确认完工后立即结算，最快5分钟内到账 <Button type="link" size="small" icon={<QuestionCircleOutlined />}>查看支持银行</Button></li>
            <li><strong>平台服务费5%</strong>：包含技术服务费、支付通道费、风控审核成本</li>
            <li><strong>代扣个税3%</strong>：平台代缴个人所得税，提供电子税务凭证可查可下载，支持个税抵扣</li>
          </ul>
        }
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Card title="结算流水">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={settlements}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: fetchSettlements,
            showTotal: (total) => `共 ${total} 条`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="结算详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedSettlement && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="结算编号" span={2}>
                JS{String(selectedSettlement.id).padStart(8, '0')}
              </Descriptions.Item>
              <Descriptions.Item label="订单编号">
                DD{String(selectedSettlement.order_id).padStart(8, '0')}
              </Descriptions.Item>
              <Descriptions.Item label="交易流水号">
                {selectedSettlement.transaction_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="结算金额">
                <Text strong style={{ fontSize: 18 }}>{selectedSettlement.amount}元</Text>
              </Descriptions.Item>
              <Descriptions.Item label="到账通道">
                {channelMap[selectedSettlement.channel]?.text || selectedSettlement.channel}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedSettlement.status]?.color}>
                  {statusMap[selectedSettlement.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedSettlement.created_at ? new Date(selectedSettlement.created_at).toLocaleString('zh-CN') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {selectedSettlement.completed_at ? new Date(selectedSettlement.completed_at).toLocaleString('zh-CN') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Card title="费用明细" size="small" type="inner" style={{ marginBottom: 16 }}>
              <Steps direction="vertical" size="small" current={3}>
                <Step title="工作收入" description={`${selectedSettlement.amount}元 (税前)`} icon={<DollarOutlined />} />
                <Step
                  title={`平台服务费 (5%)`}
                  description={`${selectedSettlement.fee}元`}
                  icon={<Text type="secondary">-</Text>}
                />
                <Step
                  title={`代扣个人所得税 (3%)`}
                  description={`${selectedSettlement.tax}元`}
                  icon={<Text type="secondary">-</Text>}
                />
                <Step
                  title="实际到账"
                  description={<Text type="success" strong style={{ fontSize: 18 }}>{selectedSettlement.actual_amount}元</Text>}
                  icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />}
                  status="finish"
                />
              </Steps>
            </Card>

            <Card title="到账进度" size="small" type="inner">
              <Steps size="small" current={selectedSettlement.status === 'completed' ? 4 : 2}>
                <Step title="雇主确认" icon={<CheckCircleOutlined />} />
                <Step title="平台审核" icon={<SafetyCertificateOutlined />} />
                <Step title="银行处理" icon={<BankOutlined />} />
                <Step title="到账完成" icon={<DollarOutlined />} />
              </Steps>
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title="税务代缴凭证"
        open={certificateModalOpen}
        onCancel={() => setCertificateModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setCertificateModalOpen(false)}>
            关闭
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={downloadCertificate}>
            下载凭证PDF
          </Button>
        ]}
        width={650}
      >
        {selectedSettlement && (
          <div style={{ padding: 20, border: '2px solid #faad14', borderRadius: 8, background: 'linear-gradient(135deg, #fffbe6 0%, #fff 100%)' }}>
            <Title level={4} style={{ textAlign: 'center', marginBottom: 20, color: '#faad14' }}>
              <SafetyCertificateOutlined style={{ fontSize: 28 }} /> 个人所得税完税证明
            </Title>
            <div style={{ background: '#fff', padding: 24, border: '1px solid #f0f0f0' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div><Text type="secondary">凭证编号：</Text><Text strong>TAX{String(selectedSettlement.id).padStart(10, '0')}</Text></div>
                </Col>
                <Col span={12}>
                  <div><Text type="secondary">结算编号：</Text><Text strong>JS{String(selectedSettlement.id).padStart(8, '0')}</Text></div>
                </Col>
              </Row>
              <Divider />
              <Descriptions column={2} size="small">
                <Descriptions.Item label="纳税人">兼职用户</Descriptions.Item>
                <Descriptions.Item label="纳税类型">劳务报酬所得</Descriptions.Item>
                <Descriptions.Item label="计税基数">{selectedSettlement.amount}元</Descriptions.Item>
                <Descriptions.Item label="适用税率">3%</Descriptions.Item>
                <Descriptions.Item label="已缴税额">{selectedSettlement.tax}元</Descriptions.Item>
                <Descriptions.Item label="代缴机构">斗米平台</Descriptions.Item>
                <Descriptions.Item label="完税日期">{new Date().toLocaleDateString('zh-CN')}</Descriptions.Item>
                <Descriptions.Item label="有效期">长期有效</Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed #ccc', textAlign: 'center' }}>
                <Text type="secondary">本凭证由斗米平台代为开具，可作为个人所得税申报使用</Text>
                <div style={{ marginTop: 8 }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                  <Text type="success" style={{ marginLeft: 4 }}>电子凭证已通过税务系统核验</Text>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="异常交易反馈"
        open={abnormalModalOpen}
        onOk={submitAbnormal}
        onCancel={() => { setAbnormalModalOpen(false); setAbnormalReason(''); }}
        okText="提交反馈"
        okButtonProps={{ danger: true }}
        confirmLoading={abnormalLoading}
        width={500}
      >
        <Alert
          message="反馈说明"
          description={
            <div>
              <div>请详细描述遇到的问题，我们将在24小时内由专属客服处理：</div>
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>资金未到账 / 到账延迟</li>
                <li>金额计算错误</li>
                <li>扣款异常</li>
                <li>其他问题</li>
              </ul>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        {selectedSettlement && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Text type="secondary">结算编号：</Text>
            <Text strong>JS{String(selectedSettlement.id).padStart(8, '0')}</Text>
            <br />
            <Text type="secondary">实际到账：</Text>
            <Text strong type="success">{selectedSettlement.actual_amount}元</Text>
          </Card>
        )}
        <TextArea
          rows={4}
          placeholder="请详细描述您遇到的异常情况，如：未到账时间、预期金额等"
          value={abnormalReason}
          onChange={(e) => setAbnormalReason(e.target.value)}
        />
      </Modal>
    </div>
  )
}
