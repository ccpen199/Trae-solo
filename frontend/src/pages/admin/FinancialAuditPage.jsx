import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, Typography, Spin, Descriptions, Tag, Space, Alert, Table, InputNumber, Button, Modal, message } from 'antd'
import {
  AuditOutlined, CheckCircleOutlined, SafetyCertificateOutlined, DollarOutlined,
  RiseOutlined, FallOutlined, WarningOutlined, BankOutlined
} from '@ant-design/icons'
import request from '../../utils/request'

const { Title, Text } = Typography

export default function FinancialAuditPage() {
  const [stats, setStats] = useState({
    withdrawalSuccessRate: 0,
    abnormalInterceptionRate: 0,
    fundPool: { totalFee: 0, totalTax: 0, totalPaid: 0, pendingAmount: 0, balance: 0 },
    recentFundFlows: []
  })
  const [loading, setLoading] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState(null)
  const [withdrawing, setWithdrawing] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await request.get('/admin/financial-audit')
      const data = res.data || res
      setStats({
        withdrawalSuccessRate: data.withdrawalSuccessRate || data.withdrawal_success_rate || 0,
        abnormalInterceptionRate: data.abnormalInterceptionRate || data.abnormal_interception_rate || 0,
        fundPool: data.fundPool || data.fund_pool || { totalFee: 0, totalTax: 0, totalPaid: 0, pendingAmount: 0, balance: 0 },
        recentFundFlows: data.recentFundFlows || data.recent_fund_flows || []
      })
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      message.warning('请输入提现金额')
      return
    }
    if (withdrawAmount > (stats.fundPool.balance || 0)) {
      message.warning('提现金额不能超过资金池余额')
      return
    }
    setWithdrawing(true)
    try {
      await request.post('/admin/financial-audit/withdraw', { amount: withdrawAmount })
      message.success('提现申请已提交')
      setWithdrawModalOpen(false)
      setWithdrawAmount(null)
      fetchStats()
    } catch (e) {
    } finally {
      setWithdrawing(false)
    }
  }

  const fundFlowColumns = [
    { title: '结算ID', dataIndex: 'id', key: 'id', render: (v) => `JS${String(v).padStart(8, '0')}` },
    { title: '订单ID', dataIndex: 'order_id', key: 'order_id', render: (v) => `DD${String(v).padStart(8, '0')}` },
    { title: '结算金额', dataIndex: 'amount', key: 'amount', render: (v) => <Text strong>{v}元</Text> },
    { title: '服务费', dataIndex: 'fee', key: 'fee', render: (v) => <Text type="success">+{v}元</Text> },
    { title: '个税', dataIndex: 'tax', key: 'tax', render: (v) => <Text type="warning">-{v}元</Text> },
    { title: '实际到账', dataIndex: 'amount_paid', key: 'amount_paid', render: (v) => <Text type="success" strong>{v}元</Text> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={v === 'completed' ? 'green' : v === 'pending' ? 'orange' : 'red'}>{v === 'completed' ? '已完成' : v === 'pending' ? '待结算' : '异常'}</Tag>
    },
    { title: '通道', dataIndex: 'channel', key: 'channel', render: (v) => <Tag color="blue">{v === 'T0' ? 'T+0' : v}</Tag> },
    {
      title: '交易流水号',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      render: (v) => v ? <Text copyable style={{ fontSize: 11 }}>{v.substring(0, 12)}...</Text> : <Text type="secondary">-</Text>
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-'
    }
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        <AuditOutlined /> 资金安全审计中心
      </Title>

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
      ) : (
        <>
          <Alert
            message="资金安全状态"
            description={
              <Space>
                <BankOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                <span>银行托管 · 资金隔离 · 100%安全保障</span>
                <Tag color="green">正常</Tag>
              </Space>
            }
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>提现成功率</Text>
                  <Statistic
                    value={stats.withdrawalSuccessRate}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ fontSize: 28, color: stats.withdrawalSuccessRate >= 95 ? '#52c41a' : '#faad14' }}
                  />
                  <Progress
                    percent={stats.withdrawalSuccessRate}
                    status={stats.withdrawalSuccessRate >= 95 ? 'success' : 'normal'}
                    strokeColor={stats.withdrawalSuccessRate >= 95 ? '#52c41a' : '#faad14'}
                  />
                  <Space>
                    <RiseOutlined style={{ color: '#52c41a' }} />
                    <Text type="success" style={{ fontSize: 12 }}>较上周提升 2%</Text>
                  </Space>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>异常交易拦截率</Text>
                  <Statistic
                    value={stats.abnormalInterceptionRate}
                    suffix="%"
                    prefix={<SafetyCertificateOutlined />}
                    valueStyle={{ fontSize: 28, color: stats.abnormalInterceptionRate >= 90 ? '#52c41a' : '#faad14' }}
                  />
                  <Progress
                    percent={stats.abnormalInterceptionRate}
                    status={stats.abnormalInterceptionRate >= 90 ? 'success' : 'normal'}
                    strokeColor={stats.abnormalInterceptionRate >= 90 ? '#52c41a' : '#faad14'}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>实时风控引擎拦截</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>资金池余额</Text>
                  <Statistic
                    value={stats.fundPool.balance || 0}
                    prefix={<DollarOutlined />}
                    precision={2}
                    valueStyle={{ fontSize: 28, color: '#1677ff' }}
                  />
                  <Button type="primary" size="small" onClick={() => setWithdrawModalOpen(true)}>
                    申请提现
                  </Button>
                  <Tag color="blue" style={{ marginLeft: 0 }}>
                    T+1 到账
                  </Tag>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card title={<><BankOutlined /> 资金池详情</>} style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ background: '#f6ffed' }}>
                  <Statistic
                    title="累计服务费收入"
                    value={stats.fundPool.totalFee || 0}
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ background: '#fff7e6' }}>
                  <Statistic
                    title="累计代扣个税"
                    value={stats.fundPool.totalTax || 0}
                    precision={2}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ background: '#e6f7ff' }}>
                  <Statistic
                    title="累计支出"
                    value={stats.fundPool.totalPaid || 0}
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ background: '#f9f0ff' }}>
                  <Statistic
                    title="待结算金额"
                    value={stats.fundPool.pendingAmount || 0}
                    precision={2}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>

          <Card title="资金流水">
            <Table
              rowKey="id"
              columns={fundFlowColumns}
              dataSource={stats.recentFundFlows || []}
              pagination={false}
              size="small"
            />
          </Card>
        </>
      )}

      <Modal
        title="资金池提现"
        open={withdrawModalOpen}
        onOk={handleWithdraw}
        onCancel={() => setWithdrawModalOpen(false)}
        okText="提交申请"
        okButtonProps={{ type: 'primary' }}
        confirmLoading={withdrawing}
      >
        <Alert
          message="提现说明"
          description="提现申请将在T+1工作日内处理，资金将转入公司对公账户"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="可提现余额">
            <Text strong type="success" style={{ fontSize: 18 }}>
              {stats.fundPool.balance?.toFixed(2) || '0.00'} 元
            </Text>
          </Descriptions.Item>
        </Descriptions>
        <div>
          <Text type="secondary">提现金额：</Text>
          <InputNumber
            style={{ width: '100%', marginTop: 8 }}
            value={withdrawAmount}
            onChange={setWithdrawAmount}
            placeholder="请输入提现金额"
            min={0}
            max={stats.fundPool.balance || 0}
            precision={2}
          />
        </div>
      </Modal>
    </div>
  )
}
