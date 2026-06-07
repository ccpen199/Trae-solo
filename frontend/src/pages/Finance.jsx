import React, { useState, useEffect } from 'react'
import {
  Row, Col, Card, Button, Statistic, Table, Tag, Modal, Form, InputNumber,
  message, Tabs, Progress, Alert, Space, Descriptions, Timeline, Divider,
  Steps, Radio, Result
} from 'antd'
import {
  RiseOutlined, FundOutlined, SafetyOutlined, ArrowUpOutlined,
  ArrowDownOutlined, CheckCircleOutlined, WarningOutlined, ClockCircleOutlined,
  FileTextOutlined, TrophyOutlined
} from '@ant-design/icons'
import api from '../utils/api'
import dayjs from 'dayjs'

const { TabPane } = Tabs
const { Step } = Steps
const { TextArea } = InputNumber

const Finance = () => {
  const [products, setProducts] = useState([])
  const [investments, setInvestments] = useState([])
  const [incomeRecords, setIncomeRecords] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('products')
  const [riskModalVisible, setRiskModalVisible] = useState(false)
  const [riskStep, setRiskStep] = useState(0)
  const [riskAnswers, setRiskAnswers] = useState([])
  const [riskResult, setRiskResult] = useState(null)
  const [redeemModalVisible, setRedeemModalVisible] = useState(false)
  const [selectedInvestment, setSelectedInvestment] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  const riskLevelNames = { 1: '保守型', 2: '稳健型', 3: '进取型' }
  const riskLevelColors = { 1: '#52c41a', 2: '#faad14', 3: '#ff4d4f' }
  const riskLevelDesc = {
    1: '适合追求本金安全、风险承受能力较低的投资者，主要投资于低风险固定收益类产品',
    2: '适合追求稳健收益、能承受一定波动的投资者，投资于平衡型混合产品',
    3: '适合追求高收益、能承受较大波动的投资者，投资于权益类产品'
  }

  const riskQuestions = [
    {
      id: 1,
      question: '您的投资经验如何？',
      options: [
        { label: '无任何投资经验', score: 10 },
        { label: '有1-3年投资经验', score: 20 },
        { label: '有3-5年投资经验', score: 30 },
        { label: '5年以上丰富投资经验', score: 40 }
      ]
    },
    {
      id: 2,
      question: '如果您的投资在短期内出现20%的亏损，您会：',
      options: [
        { label: '立即全部卖出，不再投资', score: 5 },
        { label: '部分卖出，减少风险', score: 15 },
        { label: '继续持有，等待反弹', score: 25 },
        { label: '加仓买入，摊低成本', score: 35 }
      ]
    },
    {
      id: 3,
      question: '您计划的投资期限是：',
      options: [
        { label: '1年以内', score: 10 },
        { label: '1-3年', score: 20 },
        { label: '3-5年', score: 30 },
        { label: '5年以上', score: 40 }
      ]
    },
    {
      id: 4,
      question: '您的家庭年收入水平：',
      options: [
        { label: '10万元以下', score: 10 },
        { label: '10-30万元', score: 20 },
        { label: '30-50万元', score: 30 },
        { label: '50万元以上', score: 40 }
      ]
    },
    {
      id: 5,
      question: '您对投资收益的预期是：',
      options: [
        { label: '保本即可，略高于银行存款', score: 10 },
        { label: '年化5%-10%的稳健收益', score: 20 },
        { label: '年化10%-20%的较高收益', score: 30 },
        { label: '年化20%以上的高收益', score: 40 }
      ]
    }
  ]

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchProducts()
    fetchInvestments()
    generateIncomeRecords()
  }, [])

  const fetchProducts = async () => {
    try {
      const data = await api.get('/finance/products')
      setProducts(data)
    } catch (error) {
      message.error('获取理财产品失败')
    }
  }

  const fetchInvestments = async () => {
    try {
      const data = await api.get('/finance/investments')
      setInvestments(data)
    } catch (error) {
      console.error('获取投资记录失败', error)
    }
  }

  const generateIncomeRecords = () => {
    const records = []
    for (let i = 0; i < 12; i++) {
      records.push({
        month: dayjs().subtract(i, 'month').format('YYYY-MM'),
        income: Math.round(Math.random() * 500 + 100),
        principal: Math.round(Math.random() * 10000 + 5000)
      })
    }
    setIncomeRecords(records.reverse())
  }

  const handleInvest = async (values) => {
    if (!selectedProduct) return

    setLoading(true)
    try {
      const data = await api.post('/finance/invest', {
        product_id: selectedProduct.id,
        amount: values.amount
      })
      message.success('申购成功')
      setModalVisible(false)
      form.resetFields()
      fetchInvestments()
    } catch (error) {
      message.error(error.response?.data?.error || '申购失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!selectedInvestment) return

    setLoading(true)
    try {
      await api.post(`/finance/redeem/${selectedInvestment.id}`)
      message.success('赎回申请已提交，T+1日到账')
      setRedeemModalVisible(false)
      fetchInvestments()
    } catch (error) {
      message.error(error.response?.data?.error || '赎回失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRiskAnswer = (questionId, score) => {
    const newAnswers = [...riskAnswers]
    const idx = newAnswers.findIndex(a => a.question_id === questionId)
    if (idx >= 0) {
      newAnswers[idx].score = score
    } else {
      newAnswers.push({ question_id: questionId, score })
    }
    setRiskAnswers(newAnswers)
  }

  const handleNextRiskStep = () => {
    if (riskStep < riskQuestions.length - 1) {
      setRiskStep(riskStep + 1)
    } else {
      submitRiskAssessment()
    }
  }

  const submitRiskAssessment = async () => {
    try {
      const data = await api.post('/finance/risk-assessment', { answers: riskAnswers })
      setRiskResult(data)
      setRiskStep(riskQuestions.length)
      const updatedUser = { ...user, risk_level: data.risk_level }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch (error) {
      message.error('评估失败')
    }
  }

  const handleResetRisk = () => {
    setRiskStep(0)
    setRiskAnswers([])
    setRiskResult(null)
  }

  const getRiskLevelName = (level) => riskLevelNames[level] || '保守型'
  const getRiskLevelColor = (level) => riskLevelColors[level] || '#52c41a'

  const productColumns = [
    {
      title: '产品信息',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.description}</div>
        </div>
      )
    },
    {
      title: '预期年化',
      dataIndex: 'expected_yield',
      key: 'expected_yield',
      render: (yield_) => <strong style={{ color: '#ff4d4f', fontSize: 20 }}>{yield_}%</strong>
    },
    {
      title: '投资期限',
      dataIndex: 'term_days',
      key: 'term_days',
      render: (days) => days ? `${days}天` : '活期'
    },
    {
      title: '起购金额',
      dataIndex: 'min_amount',
      key: 'min_amount',
      render: (amount) => `¥${amount.toLocaleString()}`
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level) => (
        <Tag color={level === 1 ? 'green' : level === 2 ? 'orange' : 'red'}>
          {getRiskLevelName(level)}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const canBuy = (user?.risk_level || 1) >= record.risk_level
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              disabled={!canBuy}
              onClick={() => {
                setSelectedProduct(record)
                setModalVisible(true)
              }}
            >
              申购
            </Button>
            {!canBuy && (
              <Button
                type="link"
                size="small"
                onClick={() => setRiskModalVisible(true)}
              >
                提升风险等级
              </Button>
            )}
          </Space>
        )
      }
    }
  ]

  const investmentColumns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <Tag color={record.risk_level === 1 ? 'green' : record.risk_level === 2 ? 'orange' : 'red'} style={{ marginTop: 4 }}>
            {getRiskLevelName(record.risk_level)}
          </Tag>
        </div>
      )
    },
    {
      title: '持有金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <strong style={{ fontSize: 16 }}>¥{amount.toLocaleString()}</strong>
    },
    {
      title: '预期收益',
      dataIndex: 'expected_income',
      key: 'expected_income',
      render: (income) => income ? (
        <span style={{ color: '#52c41a' }}>+¥{parseFloat(income).toFixed(2)}</span>
      ) : '-'
    },
    {
      title: '实际收益',
      dataIndex: 'actual_income',
      key: 'actual_income',
      render: (income) => income ? (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>+¥{parseFloat(income).toFixed(2)}</span>
      ) : '-'
    },
    {
      title: '持有状态',
      key: 'status',
      render: (_, record) => {
        if (record.status === 'holding') {
          const purchaseDate = dayjs(record.purchase_date)
          const termDays = record.term_days
          const elapsed = dayjs().diff(purchaseDate, 'day')
          const progress = termDays ? Math.min(100, Math.round((elapsed / termDays) * 100)) : 100

          return (
            <div>
              <Tag color="blue">持有中</Tag>
              {termDays && (
                <div style={{ marginTop: 8, width: 120 }}>
                  <Progress percent={progress} size="small" />
                  <span style={{ fontSize: 12, color: '#999' }}>
                    {elapsed}/{termDays}天
                  </span>
                </div>
              )}
            </div>
          )
        }
        return <Tag color="green">已赎回</Tag>
      }
    },
    {
      title: '购买时间',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => {
              setSelectedInvestment(record)
              setDetailModalVisible(true)
            }}
          >
            详情
          </Button>
          {record.status === 'holding' && (
            <Button
              size="small"
              danger
              onClick={() => {
                setSelectedInvestment(record)
                setRedeemModalVisible(true)
              }}
            >
              赎回
            </Button>
          )}
        </Space>
      )
    }
  ]

  const totalInvestment = investments.filter(i => i.status === 'holding').reduce((sum, i) => sum + i.amount, 0)
  const totalExpectedIncome = investments.filter(i => i.status === 'holding').reduce((sum, i) => sum + (parseFloat(i.expected_income) || 0), 0)
  const totalActualIncome = investments.filter(i => i.status === 'redeemed').reduce((sum, i) => sum + (parseFloat(i.actual_income) || 0), 0)

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="我的风险等级"
              value={getRiskLevelName(user?.risk_level || 1)}
              valueStyle={{ color: getRiskLevelColor(user?.risk_level || 1) }}
              prefix={<SafetyOutlined />}
            />
            <Button type="link" onClick={() => { handleResetRisk(); setRiskModalVisible(true) }} style={{ padding: 0 }}>
              {user?.risk_level ? '重新评估' : '立即评估'}
            </Button>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="持有本金"
              value={totalInvestment}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
              prefix={<FundOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预期收益"
              value={totalExpectedIncome}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#faad14' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已实现收益"
              value={totalActualIncome}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
              prefix={<TrophyOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>(已到账)</span>}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="理财产品" key="products">
            <Alert
              message={
                <Space>
                  <SafetyOutlined />
                  <span>您当前的风险等级为 <b style={{ color: getRiskLevelColor(user?.risk_level || 1) }}>{getRiskLevelName(user?.risk_level || 1)}</b>，仅可购买匹配或更低风险等级的产品</span>
                  {!user?.risk_level && (
                    <Button type="link" size="small" onClick={() => { handleResetRisk(); setRiskModalVisible(true) }}>
                      完成风险评估
                    </Button>
                  )}
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={productColumns}
              dataSource={products}
              rowKey="id"
              pagination={false}
            />
          </TabPane>

          <TabPane tab="我的持仓" key="investments">
            {investments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <FundOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <p style={{ marginTop: 16, color: '#999' }}>暂无持仓记录</p>
                <Button type="primary" onClick={() => setActiveTab('products')}>
                  去选购
                </Button>
              </div>
            ) : (
              <Table
                columns={investmentColumns}
                dataSource={investments}
                rowKey="id"
                pagination={false}
              />
            )}
          </TabPane>

          <TabPane tab="收益明细" key="income">
            <Card title="近12个月收益情况" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                {incomeRecords.map((record, idx) => (
                  <Col span={4} key={idx}>
                    <Card size="small">
                      <Statistic
                        title={record.month}
                        value={record.income}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: '#52c41a', fontSize: 16 }}
                      />
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        本金：¥{record.principal.toLocaleString()}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>

            <Card title="收益追踪" size="small">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="累计投资本金">¥{investments.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="累计预期收益">¥{totalExpectedIncome.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="已赎回收益">¥{totalActualIncome.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="持仓产品数">{investments.filter(i => i.status === 'holding').length} 个</Descriptions.Item>
                <Descriptions.Item label="首次投资时间" span={2}>
                  {investments.length > 0 ? dayjs(investments[investments.length - 1].purchase_date).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="申购产品"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={600}
        footer={null}
      >
        {selectedProduct && (
          <div>
            <Alert
              message={selectedProduct.name}
              description={
                <Space>
                  <Tag color={selectedProduct.risk_level === 1 ? 'green' : selectedProduct.risk_level === 2 ? 'orange' : 'red'}>
                    {getRiskLevelName(selectedProduct.risk_level)}
                  </Tag>
                  <span>预期年化：<strong style={{ color: '#ff4d4f' }}>{selectedProduct.expected_yield}%</strong></span>
                </Space>
              }
              type="info"
              showIcon
              icon={<FundOutlined />}
              style={{ marginBottom: 16 }}
            />

            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="产品类型">{selectedProduct.type || '固定收益'}</Descriptions.Item>
              <Descriptions.Item label="投资期限">{selectedProduct.term_days ? `${selectedProduct.term_days}天` : '活期'}</Descriptions.Item>
              <Descriptions.Item label="起购金额">¥{selectedProduct.min_amount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="最高限额">{selectedProduct.max_amount ? `¥${selectedProduct.max_amount.toLocaleString()}` : '无限制'}</Descriptions.Item>
              <Descriptions.Item label="计息规则" span={2}>T+1日开始计息，到期一次性还本付息</Descriptions.Item>
              <Descriptions.Item label="赎回规则" span={2}>到期自动赎回，提前赎回收取0.5%手续费</Descriptions.Item>
            </Descriptions>

            <Timeline
              items={[
                { color: 'blue', children: '提交申购申请（T日）' },
                { color: 'blue', children: '确认份额（T+1日）' },
                { color: 'blue', children: '开始计息（T+1日）' },
                { color: 'green', children: '到期还本付息' }
              ]}
            />

            <Divider />

            <Form form={form} layout="vertical" onFinish={handleInvest}>
              <Form.Item
                name="amount"
                label="申购金额"
                rules={[
                  { required: true, message: '请输入申购金额' },
                  { type: 'number', min: selectedProduct.min_amount, message: `最低起购金额为${selectedProduct.min_amount}元` }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={selectedProduct.min_amount}
                  max={selectedProduct.max_amount}
                  addonBefore="¥"
                  placeholder={`请输入金额，最低${selectedProduct.min_amount}元`}
                />
              </Form.Item>

              <Form.Item
                label="预期收益测算"
              >
                <div style={{ padding: '12px 16px', background: '#f6ffed', borderRadius: 6 }}>
                  预计到期收益：<strong style={{ color: '#52c41a', fontSize: 18 }}>
                    ¥{form.getFieldValue('amount')
                      ? ((form.getFieldValue('amount') * selectedProduct.expected_yield / 100) * (selectedProduct.term_days || 365) / 365).toFixed(2)
                      : '0.00'}
                  </strong>
                  <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                    （仅供参考，以实际收益为准）
                  </span>
                </div>
              </Form.Item>

              <Alert
                message="风险提示：理财非存款，产品有风险，投资须谨慎。本产品不保本，收益可能波动。"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  确认申购
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="风险承受能力评估"
        open={riskModalVisible}
        onCancel={() => { setRiskModalVisible(false); handleResetRisk() }}
        width={600}
        footer={null}
        maskClosable={false}
      >
        {riskStep < riskQuestions.length ? (
          <div>
            <Steps current={riskStep} size="small" style={{ marginBottom: 24 }}>
              {riskQuestions.map((q, idx) => (
                <Step key={idx} title={`Q${idx + 1}`} />
              ))}
            </Steps>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16 }}>
                问题 {riskStep + 1}/{riskQuestions.length}：{riskQuestions[riskStep].question}
              </h3>
              <Radio.Group
                value={riskAnswers.find(a => a.question_id === riskQuestions[riskStep].id)?.score}
                onChange={(e) => handleRiskAnswer(riskQuestions[riskStep].id, e.target.value)}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {riskQuestions[riskStep].options.map((opt, idx) => (
                    <Radio key={idx} value={opt.score} style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 6 }}>
                      {opt.label}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>

            <div style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={handleNextRiskStep}
                disabled={!riskAnswers.find(a => a.question_id === riskQuestions[riskStep].id)}
              >
                {riskStep < riskQuestions.length - 1 ? '下一题' : '提交评估'}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Result
              status="success"
              title="风险评估完成"
              subTitle={`您的风险承受能力等级为：${getRiskLevelName(riskResult?.risk_level || 1)}`}
              extra={[
                <Card key="desc" style={{ textAlign: 'left', marginTop: 16 }}>
                  <p style={{ color: '#666' }}>{riskLevelDesc[riskResult?.risk_level || 1]}</p>
                  <div style={{ marginTop: 16 }}>
                    <Progress
                      type="dashboard"
                      percent={riskResult?.risk_level === 1 ? 33 : riskResult?.risk_level === 2 ? 66 : 100}
                      strokeColor={getRiskLevelColor(riskResult?.risk_level || 1)}
                      width={120}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Tag color={getRiskLevelColor(riskResult?.risk_level || 1)} style={{ fontSize: 16, padding: '4px 16px' }}>
                        {getRiskLevelName(riskResult?.risk_level || 1)}投资者
                      </Tag>
                    </div>
                  </div>
                </Card>,
                <Button
                  key="close"
                  type="primary"
                  style={{ marginTop: 16 }}
                  onClick={() => { setRiskModalVisible(false); handleResetRisk() }}
                >
                  完成
                </Button>
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="赎回确认"
        open={redeemModalVisible}
        onCancel={() => setRedeemModalVisible(false)}
        width={500}
        footer={[
          <Button key="cancel" onClick={() => setRedeemModalVisible(false)}>取消</Button>,
          <Button key="confirm" type="primary" danger loading={loading} onClick={handleRedeem}>
            确认赎回
          </Button>
        ]}
      >
        {selectedInvestment && (
          <div>
            <Alert
              message="赎回须知"
              description="赎回申请提交后，资金将在T+1日到账。持有不满7天赎回将收取0.5%手续费。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="产品名称">{selectedInvestment.name}</Descriptions.Item>
              <Descriptions.Item label="赎回金额">¥{selectedInvestment.amount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="预期收益">¥{parseFloat(selectedInvestment.expected_income || 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="预计到账">T+1日 24:00前</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="持仓详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
      >
        {selectedInvestment && (
          <div>
            <Descriptions bordered size="small" column={2} title="基本信息">
              <Descriptions.Item label="产品名称">{selectedInvestment.name}</Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={selectedInvestment.risk_level === 1 ? 'green' : selectedInvestment.risk_level === 2 ? 'orange' : 'red'}>
                  {getRiskLevelName(selectedInvestment.risk_level)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="持有金额">¥{selectedInvestment.amount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="购买时间">{dayjs(selectedInvestment.purchase_date).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="预期收益">¥{parseFloat(selectedInvestment.expected_income || 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="实际收益">
                {selectedInvestment.actual_income ? `¥${parseFloat(selectedInvestment.actual_income).toFixed(2)}` : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedInvestment.status === 'holding' && (
              <div style={{ marginTop: 16 }}>
                <Card size="small" title="收益进度">
                  <Progress
                    percent={Math.min(100, Math.round((dayjs().diff(dayjs(selectedInvestment.purchase_date), 'day') / (selectedInvestment.term_days || 365)) * 100))}
                    strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                  />
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: 12 }}>
                    <span>起息日：{dayjs(selectedInvestment.purchase_date).add(1, 'day').format('YYYY-MM-DD')}</span>
                    <span>到期日：{dayjs(selectedInvestment.purchase_date).add(selectedInvestment.term_days || 365, 'day').format('YYYY-MM-DD')}</span>
                  </div>
                </Card>
              </div>
            )}

            <Timeline
              style={{ marginTop: 16 }}
              items={[
                { color: 'green', children: `申购成功 - ${dayjs(selectedInvestment.purchase_date).format('YYYY-MM-DD HH:mm')}` },
                { color: 'green', children: '确认份额 - T+1日' },
                { color: selectedInvestment.status === 'redeemed' ? 'green' : 'blue', children: selectedInvestment.status === 'redeemed' ? `已赎回 - ${dayjs(selectedInvestment.redeem_date).format('YYYY-MM-DD')}` : '持有中...' }
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Finance
