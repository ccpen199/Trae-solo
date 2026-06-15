import React, { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Row, Col, Tag, Divider, List, Statistic, message, Radio, Checkbox, Modal, Table, Drawer, Space, Descriptions, Progress } from 'antd'
import {
  ThunderboltOutlined,
  DollarOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  EyeOutlined,
  CheckSquareOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined
} from '@ant-design/icons'
import { orderApi, platformApi } from '../api'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { TextArea } = Input

function PriceCompare() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [orderForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [quoteResult, setQuoteResult] = useState(null)
  const [platforms, setPlatforms] = useState([])
  const [sortBy, setSortBy] = useState('score')
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [orderModal, setOrderModal] = useState(false)
  const [compareDrawer, setCompareDrawer] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)

  useEffect(() => {
    loadPlatforms()
    handleQuote()
  }, [])

  const loadPlatforms = async () => {
    try {
      const res = await platformApi.list({ status: 'active' })
      if (res.success) setPlatforms(res.data)
    } catch (e) { console.error(e) }
  }

  const handleQuote = async () => {
    const values = form.getFieldsValue()
    if (!values.distance || values.distance <= 0) {
      message.warning('请输入有效的配送距离')
      return
    }

    setLoading(true)
    try {
      const res = await orderApi.quote({
        distance: values.distance,
        weight: values.weight || 0,
        urgency: values.urgency || 'normal',
        expected_time: values.expected_time
      })
      if (res.success) {
        setQuoteResult(res.data)
      }
    } catch (e) {
      message.error('获取报价失败')
    } finally {
      setLoading(false)
    }
  }

  const getSortedResults = () => {
    if (!quoteResult?.optimal) return []
    const results = [...quoteResult.optimal]
    switch (sortBy) {
      case 'price':
        return results.sort((a, b) => a.fee - b.fee)
      case 'time':
        return results.sort((a, b) => a.delivery_time - b.delivery_time)
      case 'score':
      default:
        return results.sort((a, b) => b.score - a.score)
    }
  }

  const cheapest = quoteResult?.cheapest?.[0]
  const fastest = quoteResult?.optimal?.slice().sort((a, b) => a.delivery_time - b.delivery_time)[0]
  const bestScore = quoteResult?.optimal?.[0]

  const handleSelectPlatform = (item) => {
    setSelectedPlatform(item)
    orderForm.resetFields()
    const formValues = form.getFieldsValue()
    orderForm.setFieldsValue({
      platform_id: item.platform.id,
      distance: formValues.distance,
      weight: formValues.weight,
      urgency: formValues.urgency,
      expected_fee: item.fee
    })
    setOrderModal(true)
  }

  const submitOrder = async (values) => {
    try {
      const res = await orderApi.create({
        merchant_id: 1,
        platform_id: selectedPlatform.platform.id,
        goods_name: values.goods_name,
        goods_weight: values.weight,
        distance: values.distance,
        receiver_name: values.receiver_name,
        receiver_phone: values.receiver_phone,
        receiver_address: values.receiver_address,
        urgency: values.urgency,
        expected_time: values.expected_time,
        expected_fee: values.expected_fee
      })
      if (res.success) {
        message.success('订单创建成功，已通知平台接单')
        setOrderModal(false)
        setTimeout(() => navigate('/orders'), 1000)
      }
    } catch (e) {
      message.error(e.response?.data?.message || '下单失败')
    }
  }

  const toggleCompare = (platformId) => {
    const next = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter(id => id !== platformId)
      : [...selectedPlatforms, platformId]
    if (next.length > 3) {
      message.warning('最多选择3个平台进行对比')
      return
    }
    setSelectedPlatforms(next)
  }

  const startCompare = () => {
    if (selectedPlatforms.length < 2) {
      message.warning('请至少选择2个平台进行对比')
      return
    }
    setCompareDrawer(true)
  }

  const getCompareData = () => {
    if (!quoteResult?.optimal) return []
    return quoteResult.optimal.filter(item => selectedPlatforms.includes(item.platform.id))
  }

  const renderCompareBar = (a, b, label, isHigherBetter = true) => {
    const max = Math.max(a, b)
    const aPct = max > 0 ? (a / max) * 100 : 0
    const bPct = max > 0 ? (b / max) * 100 : 0
    const aWins = isHigherBetter ? a > b : a < b
    const bWins = isHigherBetter ? b > a : b < a
    return (
      <Row gutter={16} align="middle" style={{ marginBottom: 12 }}>
        <Col span={5} style={{ textAlign: 'right', color: aWins ? '#52c41a' : '#666', fontWeight: aWins ? 600 : 400 }}>
          {typeof a === 'number' ? (label.includes('率') ? `${(a*100).toFixed(1)}%` : a) : a}
        </Col>
        <Col span={6}>
          <Progress percent={aPct} showInfo={false} size="small" strokeColor={aWins ? '#52c41a' : '#d9d9d9'} />
        </Col>
        <Col span={6} style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>{label}</Col>
        <Col span={6}>
          <Progress percent={bPct} showInfo={false} size="small" strokeColor={bWins ? '#52c41a' : '#d9d9d9'} />
        </Col>
        <Col span={1} style={{ color: bWins ? '#52c41a' : '#666', fontWeight: bWins ? 600 : 400 }}>
          {typeof b === 'number' ? (label.includes('率') ? `${(b*100).toFixed(1)}%` : b) : b}
        </Col>
      </Row>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">运费比价引擎</h2>
        <Space>
          <Checkbox 
            checked={selectedPlatforms.length > 0} 
            onChange={() => setSelectedPlatforms([])}
            disabled={selectedPlatforms.length === 0}
          >
            已选 {selectedPlatforms.length} 个平台对比
          </Checkbox>
          <Button 
            icon={<BarChartOutlined />} 
            onClick={startCompare}
            disabled={selectedPlatforms.length < 2}
            type={selectedPlatforms.length >= 2 ? 'primary' : 'default'}
          >
            开始对比
          </Button>
          <Button icon={<ShoppingCartOutlined />} onClick={() => navigate('/orders')}>
            订单管理
          </Button>
          <Tag color="blue">智能推荐 · 一键比价 · 多平台对比</Tag>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={8}>
          <Card title="配送参数" className="stat-card">
            <Form form={form} layout="vertical" initialValues={{ distance: 5, weight: 1, urgency: 'normal' }}>
              <Form.Item name="distance" label="配送距离(公里)" rules={[{ required: true, message: '请输入配送距离' }]}>
                <InputNumber min={0.1} step={0.5} style={{ width: '100%' }} placeholder="输入公里数" />
              </Form.Item>
              <Form.Item name="weight" label="物品重量(公斤)">
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="输入公斤数" />
              </Form.Item>
              <Form.Item name="urgency" label="时效要求">
                <Radio.Group>
                  <Radio value="economy">经济</Radio>
                  <Radio value="normal">普通</Radio>
                  <Radio value="urgent">加急</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="expected_time" label="期望送达时间(分钟)">
                <InputNumber min={10} step={10} style={{ width: '100%' }} placeholder="选填，用于评估时效" />
              </Form.Item>
              <Button type="primary" block size="large" icon={<ThunderboltOutlined />} loading={loading} onClick={handleQuote}>
                智能比价
              </Button>
            </Form>
          </Card>

          {quoteResult && (
            <>
              <Card title="三档推荐" style={{ marginTop: 16 }}>
                <List size="small">
                  <List.Item>
                    <List.Item.Meta
                      avatar={<div style={{ fontSize: 24 }}>{bestScore?.platform?.logo}</div>}
                      title={
                        <div>
                          <Tag color="green">综合最优</Tag>
                          <span style={{ marginLeft: 8 }}>{bestScore?.platform?.name}</span>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{bestScore?.fee?.toFixed(2)}</span>
                          <span>{bestScore?.delivery_time}分钟</span>
                        </div>
                      }
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      avatar={<div style={{ fontSize: 24 }}>{cheapest?.platform?.logo}</div>}
                      title={
                        <div>
                          <Tag color="orange">最低价格</Tag>
                          <span style={{ marginLeft: 8 }}>{cheapest?.platform?.name}</span>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ color: '#fa8c16', fontWeight: 600 }}>¥{cheapest?.fee?.toFixed(2)}</span>
                          <span>{cheapest?.delivery_time}分钟</span>
                        </div>
                      }
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      avatar={<div style={{ fontSize: 24 }}>{fastest?.platform?.logo}</div>}
                      title={
                        <div>
                          <Tag color="blue">最快送达</Tag>
                          <span style={{ marginLeft: 8 }}>{fastest?.platform?.name}</span>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span>¥{fastest?.fee?.toFixed(2)}</span>
                          <span style={{ color: '#1677ff', fontWeight: 600 }}>{fastest?.delivery_time}分钟</span>
                        </div>
                      }
                    />
                  </List.Item>
                </List>
              </Card>
            </>
          )}
        </Col>

        <Col span={16}>
          <Card 
            title="全部平台比价" 
            extra={
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#666' }}>排序：</span>
                <Select size="small" value={sortBy} onChange={setSortBy} style={{ width: 120 }}>
                  <Option value="score">综合评分</Option>
                  <Option value="price">价格最低</Option>
                  <Option value="time">时效最快</Option>
                </Select>
              </div>
            }
          >
            {quoteResult ? (
              <Row gutter={[16, 16]}>
                {getSortedResults().map((item, index) => (
                  <Col span={8} key={item.platform.id}>
                    <div 
                      className={`price-card ${index === 0 && sortBy === 'score' ? 'recommended' : ''}`}
                      style={{ 
                        border: index === 0 && sortBy === 'score' ? '2px solid #52c41a' : undefined,
                        opacity: selectedPlatforms.includes(item.platform.id) ? 1 : undefined
                      }}
                    >
                      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                        <Checkbox 
                          checked={selectedPlatforms.includes(item.platform.id)}
                          onChange={() => toggleCompare(item.platform.id)}
                        />
                      </div>
                      {index === 0 && sortBy === 'score' && <div className="recommend-badge">推荐</div>}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingLeft: 28 }}>
                        <div style={{ fontSize: 32 }}>{item.platform.logo}</div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 600 }}>{item.platform.name}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>综合评分 {(item.score * 100).toFixed(0)}分</div>
                        </div>
                      </div>

                      <Divider style={{ margin: '12px 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#666' }}>配送费</span>
                        <span style={{ fontSize: 22, fontWeight: 700, color: '#f5222d' }}>
                          ¥{item.fee.toFixed(2)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#666' }}><ClockCircleOutlined /> 预计时间</span>
                        <span style={{ fontWeight: 500 }}>{item.delivery_time}分钟</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#666' }}><SafetyOutlined /> 准时率</span>
                        <span style={{ color: (item.platform.on_time_rate >= 0.95) ? '#52c41a' : '#faad14' }}>
                          {(item.platform.on_time_rate * 100).toFixed(1)}%
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ color: '#666' }}><RocketOutlined /> 运力饱和度</span>
                        <span style={{ 
                          color: item.platform.capacity_saturation < 0.5 ? '#52c41a' : 
                                 item.platform.capacity_saturation < 0.8 ? '#faad14' : '#ff4d4f'
                        }}>
                          {(item.platform.capacity_saturation * 100).toFixed(0)}%
                        </span>
                      </div>

                      {item.meets_deadline ? (
                        <Tag color="green" icon={<CheckCircleOutlined />}>满足时效要求</Tag>
                      ) : (
                        <Tag color="orange">可能超时</Tag>
                      )}

                      <Space style={{ marginTop: 12, width: '100%' }}>
                        <Button 
                          type="primary" 
                          block 
                          size="small"
                          icon={<ShoppingCartOutlined />}
                          onClick={() => handleSelectPlatform(item)}
                        >
                          立即下单
                        </Button>
                      </Space>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                <DollarOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ddd' }} />
                <div>请输入配送参数，点击"智能比价"查看各平台报价</div>
              </div>
            )}
          </Card>

          {quoteResult && (
            <Card title="比价说明" style={{ marginTop: 16 }} size="small">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title="参与比价平台"
                    value={quoteResult.optimal?.length || 0}
                    suffix="家"
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="最低价格"
                    value={cheapest?.fee || 0}
                    prefix="¥"
                    valueStyle={{ fontSize: 20, color: '#fa8c16' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="最快送达"
                    value={fastest?.delivery_time || 0}
                    suffix="分钟"
                    valueStyle={{ fontSize: 20, color: '#1677ff' }}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 12, fontSize: 12, color: '#999', lineHeight: 1.8 }}>
                <p>• 综合评分基于价格、时效、运力饱和度、历史履约率等多维度加权计算</p>
                <p>• 价格包含基础费、里程费、重量费，实际费用以平台接单后为准</p>
                <p>• 运力饱和度实时更新，高峰期部分平台可能溢价或拒单</p>
                <p>• 勾选左侧复选框可选择多个平台进行详细对比</p>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title={`下单 - ${selectedPlatform?.platform?.name}`}
        open={orderModal}
        onCancel={() => setOrderModal(false)}
        footer={null}
        width={600}
        destroyOnHidden
      >
        {selectedPlatform && (
          <div>
            <Alert
              message="报价信息"
              description={
                <div>
                  <div>预计费用: <span style={{ color: '#f5222d', fontSize: 16, fontWeight: 600 }}>¥{selectedPlatform.fee.toFixed(2)}</span></div>
                  <div>预计时间: {selectedPlatform.delivery_time}分钟</div>
                  <div>配送距离: {selectedPlatform.distance}km</div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={orderForm} layout="vertical" onFinish={submitOrder}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="goods_name" label="物品名称" rules={[{ required: true }]}>
                    <Input placeholder="如：奶茶、餐食、文件" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="weight" label="重量(kg)" rules={[{ required: true }]}>
                    <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="urgency" label="时效" rules={[{ required: true }]}>
                    <Select>
                      <Option value="economy">经济</Option>
                      <Option value="normal">普通</Option>
                      <Option value="urgent">加急</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="receiver_name" label="收件人" rules={[{ required: true }]}>
                    <Input placeholder="姓名" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="receiver_phone" label="联系电话" rules={[{ required: true }]}>
                    <Input placeholder="手机号" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="expected_time" label="期望送达(分钟)">
                    <InputNumber min={10} step={5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="receiver_address" label="收件地址" rules={[{ required: true }]}>
                <TextArea rows={2} placeholder="请输入详细地址" />
              </Form.Item>
              <Form.Item name="expected_fee" label="预估费用" hidden>
                <Input />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button onClick={() => setOrderModal(false)} style={{ marginRight: 8 }}>取消</Button>
                <Button type="primary" htmlType="submit" icon={<ShoppingCartOutlined />}>
                  确认下单
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      <Drawer
        title="平台对比分析"
        placement="right"
        width={700}
        open={compareDrawer}
        onClose={() => setCompareDrawer(false)}
      >
        {getCompareData().length >= 2 && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              {getCompareData().map((item, idx) => (
                <Col span={24 / getCompareData().length} key={item.platform.id}>
                  <Card style={{ textAlign: 'center', background: idx === 0 ? '#f6ffed' : '#fafafa', border: idx === 0 ? '1px solid #b7eb8f' : undefined }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{item.platform.logo}</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{item.platform.name}</div>
                    {idx === 0 && <Tag color="green" style={{ marginTop: 8 }}>综合最优</Tag>}
                  </Card>
                </Col>
              ))}
            </Row>

            {getCompareData().length === 2 ? (
              <div>
                <Card title="核心指标对比" size="small" style={{ marginBottom: 16 }}>
                  {renderCompareBar(getCompareData()[0].fee, getCompareData()[1].fee, '配送费(¥)', false)}
                  {renderCompareBar(getCompareData()[1].delivery_time, getCompareData()[0].delivery_time, '配送时效(分钟)', false)}
                  {renderCompareBar(getCompareData()[0].platform.on_time_rate, getCompareData()[1].platform.on_time_rate, '准时率')}
                  {renderCompareBar(getCompareData()[0].platform.completion_rate, getCompareData()[1].platform.completion_rate, '履约率')}
                  {renderCompareBar(getCompareData()[1].platform.capacity_saturation, getCompareData()[0].platform.capacity_saturation, '运力饱和度(%)', false)}
                  {renderCompareBar((getCompareData()[0].score * 100).toFixed(0), (getCompareData()[1].score * 100).toFixed(0), '综合评分(分)')}
                </Card>

                <Card title="优缺点分析" size="small">
                  <Row gutter={16}>
                    {getCompareData().map((item, idx) => (
                      <Col span={12} key={item.platform.id}>
                        <div style={{ fontWeight: 500, marginBottom: 12 }}>{item.platform.name}</div>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 12, color: '#52c41a', marginBottom: 4 }}>优势</div>
                          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                            {item.fee === cheapest?.fee && <li>价格最低，节省成本</li>}
                            {item.delivery_time === fastest?.delivery_time && <li>配送时效最快</li>}
                            {item.platform.on_time_rate >= 0.96 && <li>准时率极高，服务稳定</li>}
                            {item.platform.capacity_saturation < 0.5 && <li>运力充足，接单响应快</li>}
                            {item.score === bestScore?.score && <li>综合评分最高，推荐选择</li>}
                          </ul>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: '#ff4d4f', marginBottom: 4 }}>劣势</div>
                          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                            {item.fee > cheapest?.fee * 1.1 && <li>价格偏高，比最低价贵{((item.fee / cheapest.fee - 1) * 100).toFixed(0)}%</li>}
                            {item.delivery_time > fastest?.delivery_time * 1.2 && <li>时效偏慢，比最慢速慢{((item.delivery_time / fastest.delivery_time - 1) * 100).toFixed(0)}%</li>}
                            {item.platform.on_time_rate < 0.92 && <li>准时率较低，存在超时风险</li>}
                            {item.platform.capacity_saturation > 0.8 && <li>运力紧张，高峰期可能拒单</li>}
                          </ul>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={() => { setCompareDrawer(false); handleSelectPlatform(getCompareData()[0]); }}>
                    选择 {getCompareData()[0].platform.name} 下单
                  </Button>
                </div>
              </div>
            ) : (
              <Table
                dataSource={[
                  { key: 'fee', name: '配送费', render: (item) => `¥${item.fee.toFixed(2)}`, isBetter: (a, b) => a < b },
                  { key: 'time', name: '预计时间', render: (item) => `${item.delivery_time}分钟`, isBetter: (a, b) => a < b },
                  { key: 'on_time', name: '准时率', render: (item) => `${(item.platform.on_time_rate * 100).toFixed(1)}%`, isBetter: (a, b) => a > b },
                  { key: 'completion', name: '履约率', render: (item) => `${(item.platform.completion_rate * 100).toFixed(1)}%`, isBetter: (a, b) => a > b },
                  { key: 'saturation', name: '运力饱和度', render: (item) => `${(item.platform.capacity_saturation * 100).toFixed(0)}%`, isBetter: (a, b) => a < b },
                  { key: 'score', name: '综合评分', render: (item) => `${(item.score * 100).toFixed(0)}分`, isBetter: (a, b) => a > b },
                ]}
                pagination={false}
                size="middle"
                columns={[
                  { title: '指标', dataIndex: 'name', width: 120 },
                  ...getCompareData().map(item => ({
                    title: `${item.platform.logo} ${item.platform.name}`,
                    dataIndex: item.platform.id,
                    render: (_, row) => {
                      const value = row.render(item)
                      const values = getCompareData().map(i => row.render(i))
                      const isBest = values.every((v, idx) => 
                        idx === getCompareData().indexOf(item) || row.isBetter(
                          parseFloat(item[item.fee ? 'fee' : 'delivery_time'] || item.score),
                          parseFloat(getCompareData()[idx][getCompareData()[idx].fee ? 'fee' : 'delivery_time'] || getCompareData()[idx].score)
                        )
                      )
                      return isBest ? <span style={{ color: '#52c41a', fontWeight: 600 }}>{value} <ArrowUpOutlined /></span> : value
                    }
                  }))
                ]}
              />
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default PriceCompare
