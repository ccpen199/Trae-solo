import React, { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Row, Col, Tag, Divider, List, Statistic, message, Radio, Checkbox, Modal, Table, Drawer, Space, Descriptions, Progress, Alert } from 'antd'
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
  ArrowUpOutlined,
  ArrowLeftOutlined,
  RobotOutlined,
  GiftOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { orderApi, platformApi } from '../api'
import { useNavigate, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

function PriceCompare() {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [createdOrder, setCreatedOrder] = useState(null)
  const [fromMerchant, setFromMerchant] = useState(false)

  useEffect(() => {
    loadPlatforms()
    const state = location.state
    if (state?.from === 'merchant') {
      setFromMerchant(true)
      if (state.merchantId) {
        form.setFieldsValue({ merchant_id: state.merchantId })
      }
    }
  }, [location])

  const loadPlatforms = async () => {
    try {
      const res = await platformApi.list({ status: 'active' })
      if (res.success) setPlatforms(res.data)
    } catch (e) { console.error(e) }
  }

  const handleQuote = async () => {
    try {
      const values = await form.validateFields()
      if (!values.distance || values.distance <= 0) {
        message.warning('请输入有效的配送距离')
        return
      }

      setLoading(true)
      const res = await orderApi.quote({
        distance: values.distance,
        weight: values.weight || 0,
        urgency: values.urgency || 'normal',
        expected_time: values.expected_time
      })
      if (res.success) {
        setQuoteResult(res.data)
      }
    } catch (err) {
      if (err.errorFields) {
        message.warning('请先填写完整的配送信息')
      } else {
        message.error('获取报价失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlatform = (item) => {
    setSelectedPlatform(item)
    setCreatedOrder(null)
    orderForm.resetFields()
    const formValues = form.getFieldsValue()
    orderForm.setFieldsValue({
      platform_id: item.platform.id,
      distance: formValues.distance,
      weight: formValues.weight,
      urgency: formValues.urgency,
      expected_time: formValues.expected_time,
      expected_fee: item.fee,
      goods_name: formValues.goods_name,
      receiver_name: formValues.receiver_name,
      receiver_phone: formValues.receiver_phone,
      receiver_address: formValues.receiver_address
    })
    setOrderModal(true)
  }

  const handleQuickOrder = async () => {
    try {
      const values = await form.validateFields()
      setOrderModal(true)
      setCreatedOrder(null)
      orderForm.resetFields()
      orderForm.setFieldsValue({
        receiver_name: values.receiver_name,
        receiver_phone: values.receiver_phone,
        receiver_address: values.receiver_address,
        goods_name: values.goods_name,
        weight: values.weight || 0,
        distance: values.distance,
        urgency: values.urgency,
        expected_time: values.expected_time,
        quick_order: true
      })
      setSelectedPlatform({
        platform: { id: null, name: '系统智能路由', logo: '🤖' },
        fee: quoteResult?.recommendation?.fee || 0,
        delivery_time: quoteResult?.recommendation?.delivery_time || 60,
        reason: quoteResult?.recommendation?.reason || '综合最优方案（自动路由）',
        score_detail: quoteResult?.recommendation?.score_detail,
        score: quoteResult?.recommendation?.score || 0.8,
        auto_route: true
      })
    } catch (e) {
      if (e?.errorFields) {
        message.warning('请先填写完整的收件人、物品和配送距离信息')
      }
    }
  }

  const submitOrder = async (values) => {
    try {
      const isAuto = selectedPlatform?.auto_route || !selectedPlatform?.platform?.id
      const res = await orderApi.create({
        merchant_id: 1,
        platform_id: isAuto ? undefined : selectedPlatform.platform.id,
        goods_name: values.goods_name,
        goods_weight: values.weight,
        distance: values.distance,
        receiver_name: values.receiver_name,
        receiver_phone: values.receiver_phone,
        receiver_address: values.receiver_address,
        urgency: values.urgency,
        expected_delivery_time: values.expected_time,
        expected_fee: values.expected_fee,
        auto_route: isAuto
      })
      if (res.success) {
        setCreatedOrder(res.data)
        message.success('订单创建成功，已通知' + (isAuto ? '最优运力' : selectedPlatform.platform.name) + '接单，路由依据已存档')
        loadPlatforms()
      }
    } catch (e) {
      message.error(e.response?.data?.message || '下单失败')
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {fromMerchant && (
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/merchant')}>
              返回商户看板
            </Button>
          )}
          <h2 className="page-title">运费比价引擎</h2>
        </div>
        <Space>
          <Tag color={selectedPlatforms.length > 0 ? 'blue' : 'default'}>
            对比篮 {selectedPlatforms.length} 个平台
          </Tag>
          <Button size="small" disabled={selectedPlatforms.length === 0} onClick={() => setSelectedPlatforms([])}>
            清空对比
          </Button>
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
          {fromMerchant && (
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/merchant')}>
              回写商户看板
            </Button>
          )}
          <Tag color="blue">智能推荐 · 一键比价 · 多平台对比</Tag>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={8}>
          <Card title="配送信息" className="stat-card">
            <Form form={form} layout="vertical" initialValues={{ distance: 5, weight: 1, urgency: 'normal' }}>
              <div style={{ marginBottom: 8, fontSize: 13, color: '#666', fontWeight: 500 }}>收件人信息</div>
              <Form.Item name="receiver_name" label="收件人姓名" rules={[{ required: true, message: '请输入收件人姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
              <Form.Item name="receiver_phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
                <Input placeholder="请输入手机号码" />
              </Form.Item>
              <Form.Item name="receiver_address" label="收件地址" rules={[{ required: true, message: '请输入收件地址' }]}>
                <TextArea rows={2} placeholder="请输入详细收件地址" />
              </Form.Item>
              <div style={{ marginBottom: 8, fontSize: 13, color: '#666', fontWeight: 500 }}>物品信息</div>
              <Form.Item name="goods_name" label="物品名称" rules={[{ required: true, message: '请输入物品名称' }]}>
                <Input placeholder="如：奶茶、餐食、文件" />
              </Form.Item>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="distance" label="配送距离(km)" rules={[{ required: true, message: '请输入距离' }]}>
                    <InputNumber min={0.1} step={0.5} style={{ width: '100%' }} placeholder="公里数" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="weight" label="重量(kg)">
                    <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="公斤数" />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ marginBottom: 8, fontSize: 13, color: '#666', fontWeight: 500 }}>时效要求</div>
              <Form.Item name="urgency" label="时效">
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
              {quoteResult && (
                <>
                  <Alert
                    style={{ marginTop: 12 }}
                    type="success"
                    showIcon
                    message={
                      <Space>
                        <RobotOutlined style={{ color: '#52c41a' }} />
                        <span>已生成 {quoteResult.optimal?.length || 0} 个承运方方案，可点击下单或直接保存</span>
                      </Space>
                    }
                    description="配送参数已校验，可选择最低成本/最优时效/综合评分方案，也可直接走系统智能路由生成订单"
                  />
                  <Button
                    type="primary"
                    ghost
                    block
                    size="large"
                    icon={<CheckSquareOutlined />}
                    style={{ marginTop: 12 }}
                    onClick={handleQuickOrder}
                  >
                    保存新订单（系统智能路由 · 已选最低成本方案）
                  </Button>
                </>
              )}
            </Form>
          </Card>

          {quoteResult && (
            <>
              <Card title="三档推荐 · 一键下单" style={{ marginTop: 16 }}>
                <List size="small">
                  <List.Item
                    actions={[
                      <Button 
                        key="order" 
                        type="primary" 
                        size="small" 
                        icon={<ShoppingCartOutlined />}
                        onClick={() => bestScore && handleSelectPlatform(bestScore)}
                      >
                        立即下单
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<div style={{ fontSize: 24 }}>{bestScore?.platform?.logo}</div>}
                      title={
                        <div>
                          <Tag color="green">综合最优</Tag>
                          <span style={{ marginLeft: 8 }}>{bestScore?.platform?.name}</span>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{bestScore?.fee?.toFixed(2)}</span>
                            <span>{bestScore?.delivery_time}分钟</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{bestScore?.reason}</div>
                        </div>
                      }
                    />
                  </List.Item>
                  <List.Item
                    actions={[
                      <Button 
                        key="order" 
                        size="small" 
                        icon={<ShoppingCartOutlined />}
                        onClick={() => cheapest && handleSelectPlatform(cheapest)}
                      >
                        立即下单
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<div style={{ fontSize: 24 }}>{cheapest?.platform?.logo}</div>}
                      title={
                        <div>
                          <Tag color="orange">最低价格</Tag>
                          <span style={{ marginLeft: 8 }}>{cheapest?.platform?.name}</span>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <span style={{ color: '#fa8c16', fontWeight: 600 }}>¥{cheapest?.fee?.toFixed(2)}</span>
                            <span>{cheapest?.delivery_time}分钟</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{cheapest?.reason}</div>
                        </div>
                      }
                    />
                  </List.Item>
                  <List.Item
                    actions={[
                      <Button 
                        key="order" 
                        size="small" 
                        icon={<ShoppingCartOutlined />}
                        onClick={() => fastest && handleSelectPlatform(fastest)}
                      >
                        立即下单
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<div style={{ fontSize: 24 }}>{fastest?.platform?.logo}</div>}
                      title={
                        <div>
                          <Tag color="blue">最快送达</Tag>
                          <span style={{ marginLeft: 8 }}>{fastest?.platform?.name}</span>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <span>¥{fastest?.fee?.toFixed(2)}</span>
                            <span style={{ color: '#1677ff', fontWeight: 600 }}>{fastest?.delivery_time}分钟</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{fastest?.reason}</div>
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
          {quoteResult && (
            <Card 
              title={
                <Space>
                  <RobotOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                  <span>智能推荐方案 · 最低成本 + TOP3候选承运方对比</span>
                </Space>
              }
              style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f6ffed 0%, #e6f4ff 100%)', border: '2px solid #b7eb8f' }}
              bodyStyle={{ padding: 16 }}
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{
                    padding: 12,
                    background: '#fff',
                    borderRadius: 8,
                    border: '2px solid #52c41a',
                    position: 'relative',
                    height: '100%'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: -10,
                      left: 12,
                      background: '#52c41a',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      ⭐ 综合最优推荐
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 10 }}>
                      <div style={{ fontSize: 28 }}>{bestScore?.platform?.logo}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{bestScore?.platform?.name}</div>
                        <Tag color="green" style={{ fontSize: 10 }}>综合 {(bestScore?.score * 100).toFixed(0)}分</Tag>
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>配送费</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#f5222d' }}>¥{bestScore?.fee?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>预计送达</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1677ff' }}>{bestScore?.delivery_time}分钟</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>节省成本</span>
                      <span style={{ color: '#52c41a', fontWeight: 600 }}>
                        比最高价省 ¥{((getSortedResults()[getSortedResults().length - 1]?.fee || 0) - (bestScore?.fee || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5, marginBottom: 10, minHeight: 32 }}>
                      {bestScore?.reason}
                    </div>
                    {bestScore?.score_detail && (
                      <div style={{ fontSize: 10, color: '#999', marginBottom: 10 }}>
                        五维: 价格{(bestScore.score_detail.price_score * 100).toFixed(0)} · 
                        时效{(bestScore.score_detail.time_score * 100).toFixed(0)} · 
                        质量{(bestScore.score_detail.quality_score * 100).toFixed(0)} · 
                        运力{(bestScore.score_detail.saturation_score * 100).toFixed(0)}
                      </div>
                    )}
                    <Button 
                      type="primary" 
                      block 
                      icon={<ShoppingCartOutlined />}
                      onClick={() => bestScore && handleSelectPlatform(bestScore)}
                    >
                      一键下单
                    </Button>
                  </div>
                </Col>
                
                <Col span={8}>
                  <div style={{
                    padding: 12,
                    background: '#fff',
                    borderRadius: 8,
                    border: '2px solid #faad14',
                    position: 'relative',
                    height: '100%'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: -10,
                      left: 12,
                      background: '#faad14',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      💰 最低成本方案
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 10 }}>
                      <div style={{ fontSize: 28 }}>{cheapest?.platform?.logo}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{cheapest?.platform?.name}</div>
                        <Tag color="orange" style={{ fontSize: 10 }}>最低价 ¥{cheapest?.fee?.toFixed(2)}</Tag>
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>配送费</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#fa8c16' }}>¥{cheapest?.fee?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>预计送达</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{cheapest?.delivery_time}分钟</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>比综合最优</span>
                      <span style={{ 
                        color: (bestScore?.fee || 0) >= (cheapest?.fee || 0) ? '#52c41a' : '#ff4d4f',
                        fontWeight: 600
                      }}>
                        {(bestScore?.fee || 0) >= (cheapest?.fee || 0) ? '省' : '贵'} 
                        ¥{Math.abs((bestScore?.fee || 0) - (cheapest?.fee || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5, marginBottom: 10, minHeight: 32 }}>
                      {cheapest?.reason}
                    </div>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 10 }}>
                      计费: 基础费¥{(cheapest?.platform?.base_price || 0).toFixed(2)} + 
                      里程费¥{(cheapest?.platform?.per_km_price || 0).toFixed(2)}/km × {(quoteResult.params?.distance || 0)}km
                      {cheapest?.platform?.per_kg_price > 0 && ` + 重量费¥${(cheapest?.platform?.per_kg_price || 0).toFixed(2)}/kg × ${(quoteResult.params?.weight || 0)}kg`}
                    </div>
                    <Button 
                      block
                      icon={<DollarOutlined />}
                      onClick={() => cheapest && handleSelectPlatform(cheapest)}
                    >
                      选最低价下单
                    </Button>
                  </div>
                </Col>
                
                <Col span={8}>
                  <div style={{
                    padding: 12,
                    background: '#fff',
                    borderRadius: 8,
                    border: '2px solid #1677ff',
                    position: 'relative',
                    height: '100%'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: -10,
                      left: 12,
                      background: '#1677ff',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      ⚡ 最快时效方案
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 10 }}>
                      <div style={{ fontSize: 28 }}>{fastest?.platform?.logo}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{fastest?.platform?.name}</div>
                        <Tag color="blue" style={{ fontSize: 10 }}>{fastest?.delivery_time}分钟速达</Tag>
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>配送费</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}>¥{fastest?.fee?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>预计送达</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1677ff' }}>{fastest?.delivery_time}分钟</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>准时率</span>
                      <span style={{ color: (fastest?.platform?.on_time_rate || 0) >= 0.95 ? '#52c41a' : '#faad14', fontWeight: 600 }}>
                        {((fastest?.platform?.on_time_rate || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5, marginBottom: 10, minHeight: 32 }}>
                      {fastest?.reason}
                    </div>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 10 }}>
                      运力饱和度: {((fastest?.platform?.capacity_saturation || 0) * 100).toFixed(0)}%
                      {(fastest?.platform?.capacity_saturation || 0) < 0.7 ? ' ✅运力充足' : ' ⚠需留意'}
                    </div>
                    <Button 
                      type="primary"
                      block
                      style={{ background: '#1677ff', borderColor: '#1677ff' }}
                      icon={<ThunderboltOutlined />}
                      onClick={() => fastest && handleSelectPlatform(fastest)}
                    >
                      选最快时效
                    </Button>
                  </div>
                </Col>
              </Row>
              
              <Divider style={{ margin: '16px 0 8px' }} />
              <div style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                💡 智能提示: 根据您的配送参数（距离 {(quoteResult.params?.distance || 0)}km · 重量 {(quoteResult.params?.weight || 0)}kg · 时效 {(quoteResult.params?.urgency === 'urgent' ? '加急⚡' : quoteResult.params?.urgency === 'economy' ? '经济🐢' : '普通🚚')}），
                系统推荐 <b style={{ color: '#52c41a' }}>{bestScore?.platform?.name}</b> 作为承运方，
                {cheapest?.fee && bestScore?.fee && cheapest.fee < bestScore.fee ? (
                  <span> 如需控制成本可选择 <b style={{ color: '#fa8c16' }}>{cheapest.platform?.name}</b>（节省 ¥{(bestScore.fee - cheapest.fee).toFixed(2)}）</span>
                ) : null}
              </div>
            </Card>
          )}

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

                      <div style={{ marginTop: 10, minHeight: 54, fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                        <InfoCircleOutlined style={{ marginRight: 4, color: '#1677ff' }} />
                        {item.reason}
                      </div>

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
            <>
              <Card 
                title={
                  <Space>
                    <span>各平台报价对比</span>
                    <Tag color="green">
                      最低成本: {cheapest?.platform?.logo} {cheapest?.platform?.name} ¥{cheapest?.fee?.toFixed(2)}
                    </Tag>
                    <Tag color="blue">
                      最快时效: {fastest?.platform?.logo} {fastest?.platform?.name} {fastest?.delivery_time}分钟
                    </Tag>
                  </Space>
                } 
                style={{ marginTop: 16 }} 
                size="small"
              >
                <Table
                  dataSource={getSortedResults()}
                  rowKey="platform.id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 800 }}
                >
                  <Table.Column
                    title="排序"
                    key="rank"
                    width={60}
                    render={(_, __, idx) => (
                      <Tag color={idx === 0 ? 'green' : idx === 1 ? 'blue' : 'default'}>
                        #{idx + 1}
                      </Tag>
                    )}
                  />
                  <Table.Column
                    title="承运平台"
                    key="platform"
                    width={140}
                    render={(_, record) => (
                      <Space>
                        <span style={{ fontSize: 18 }}>{record.platform.logo}</span>
                        <span>{record.platform.name}</span>
                      </Space>
                    )}
                  />
                  <Table.Column
                    title="运费(元)"
                    dataIndex="fee"
                    key="fee"
                    width={100}
                    sorter={(a, b) => a.fee - b.fee}
                    render={(val, record) => (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: val === cheapest?.fee ? '#52c41a' : '#333', 
                          fontWeight: val === cheapest?.fee ? 700 : 500,
                          fontSize: val === cheapest?.fee ? 16 : 14
                        }}>
                          ¥{val?.toFixed(2)}
                        </span>
                        {val === cheapest?.fee && (
                          <div style={{ fontSize: 10, color: '#52c41a' }}>最低</div>
                        )}
                        {val > cheapest?.fee && (
                          <div style={{ fontSize: 10, color: '#ff4d4f' }}>
                            +¥{(val - cheapest.fee).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  />
                  <Table.Column
                    title="时效(分钟)"
                    dataIndex="delivery_time"
                    key="time"
                    width={110}
                    sorter={(a, b) => a.delivery_time - b.delivery_time}
                    render={(val, record) => (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: val === fastest?.delivery_time ? '#1677ff' : '#333', 
                          fontWeight: val === fastest?.delivery_time ? 700 : 500
                        }}>
                          {val}
                        </span>
                        {val === fastest?.delivery_time && (
                          <div style={{ fontSize: 10, color: '#1677ff' }}>最快</div>
                        )}
                      </div>
                    )}
                  />
                  <Table.Column
                    title="综合评分"
                    key="score"
                    width={100}
                    sorter={(a, b) => b.score - a.score}
                    render={(_, record) => (
                      <div style={{ textAlign: 'center' }}>
                        <Progress
                          percent={Math.round(record.score * 100)}
                          size="small"
                          format={(p) => <span style={{ fontSize: 11 }}>{p}分</span>}
                          strokeColor={record.score >= 0.8 ? '#52c41a' : record.score >= 0.6 ? '#faad14' : '#ff4d4f'}
                        />
                      </div>
                    )}
                  />
                  <Table.Column
                    title="时效满足"
                    key="deadline"
                    width={90}
                    render={(_, record) => (
                      <Tag color={record.meets_deadline ? 'green' : 'orange'} style={{ width: '100%', textAlign: 'center' }}>
                        {record.meets_deadline ? '✓ 满足' : '⚠ 可能超时'}
                      </Tag>
                    )}
                  />
                  <Table.Column
                    title="最低成本依据"
                    key="reason"
                    render={(_, record) => (
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {record.fee === cheapest?.fee ? (
                          <span style={{ color: '#52c41a' }}>
                            ✅ 基础费{(record.platform.base_price || 0).toFixed(2)} + 里程费{(record.platform.per_km_price || 0).toFixed(2)}/km × {(quoteResult.params?.distance || 0)}km
                            {record.platform.per_kg_price > 0 && ` + 重量费${(record.platform.per_kg_price || 0).toFixed(2)}/kg × ${(quoteResult.params?.weight || 0)}kg`}
                          </span>
                        ) : (
                          <span>
                            基础费{(record.platform.base_price || 0).toFixed(2)} + 里程费{(record.platform.per_km_price || 0).toFixed(2)}/km
                          </span>
                        )}
                      </div>
                    )}
                  />
                  <Table.Column
                    title="操作"
                    key="action"
                    width={100}
                    render={(_, record) => (
                      <Button type="primary" size="small" icon={<ShoppingCartOutlined />} onClick={() => handleSelectPlatform(record)}>
                        下单
                      </Button>
                    )}
                  />
                </Table>
              </Card>

              <Card 
                title={
                  <Space>
                    <RobotOutlined style={{ color: '#722ed1' }} />
                    <span>智能比价说明</span>
                  </Space>
                } 
                style={{ marginTop: 16 }} 
                size="small"
              >
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
                      valueStyle={{ fontSize: 20, color: '#52c41a' }}
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
                <div style={{ marginTop: 12, fontSize: 12, color: '#666', lineHeight: 1.8 }}>
                  <p><strong style={{ color: '#52c41a' }}>📊 最低成本选取依据：</strong></p>
                  <p>• 运费 = 基础费 + 里程费 × 配送距离 + 重量费 × 物品重量（如有）</p>
                  <p>• 当前配送参数：距离 {(quoteResult.params?.distance || 0)}km，重量 {(quoteResult.params?.weight || 0)}kg，时效 {(quoteResult.params?.urgency === 'urgent' ? '加急' : quoteResult.params?.urgency === 'economy' ? '经济' : '普通')}</p>
                  <p>• 最低成本平台：{cheapest?.platform?.logo} {cheapest?.platform?.name}，运费 ¥{cheapest?.fee?.toFixed(2)}，相比最高价节省 ¥{((getSortedResults()[getSortedResults().length - 1]?.fee || 0) - (cheapest?.fee || 0)).toFixed(2)}</p>
                  <p style={{ marginTop: 8 }}><strong style={{ color: '#722ed1' }}>🤖 综合评分算法：</strong></p>
                  <p>• 价格权重 15-50%，时效权重 15-40%，服务质量权重 25%，运力饱和度权重 15%</p>
                  <p>• 时效要求越高，时效权重越大；时效要求越低，价格权重越大</p>
                  <p>• 运力饱和度超过 85% 的平台会被降级，避免高峰期拒单</p>
                </div>
              </Card>
            </>
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
                  <div>配送距离: {selectedPlatform.distance || form.getFieldValue('distance')}km</div>
                  <div>推荐理由: {selectedPlatform.reason}</div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {createdOrder ? (
              <div>
                <Alert
                  message="✅ 配送订单已创建成功"
                  description={
                    <div>
                      <p>方案类型：<b style={{ color: '#1677ff' }}>{selectedPlatform?.auto_route ? '🤖 系统智能路由（自动选择最低成本）' : (selectedPlatform?.platform?.name === cheapest?.platform?.name ? '💰 最低成本方案' : selectedPlatform?.platform?.name === bestScore?.platform?.name ? '🥇 综合最优方案' : selectedPlatform?.platform?.name === fastest?.platform?.name ? '⚡ 最快送达方案' : '🎯 用户指定平台')}</b></p>
                      <p>订单已同步至 <strong>{createdOrder.platform_name}</strong> 平台，平台已确认接单</p>
                      <p>骑手正在赶来取货，预计 <b>{createdOrder.estimated_arrival_time ? dayjs(createdOrder.estimated_arrival_time).format('HH:mm') : '-'}</b> 送达</p>
                      <p>订单数据已回写商户看板，可实时追踪配送状态</p>
                      <p style={{ color: '#1677ff', marginTop: 4 }}>
                        📍 五维路由依据已永久存档（距离{createdOrder.distance}km · 重量{createdOrder.goods_weight}kg · {createdOrder.urgency === 'urgent' ? '加急' : createdOrder.urgency === 'economy' ? '经济' : '普通'}时效），可在 <b>订单管理 → 路由依据</b> 追溯，与结算/赔付形成闭环
                      </p>
                    </div>
                  }
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="订单号">
                    <span style={{ fontFamily: 'monospace' }}>{createdOrder.order_no}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="承运平台">
                    {createdOrder.platform_logo} {createdOrder.platform_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="配送状态">
                    <Tag color="processing">{createdOrder.delivery_status === 'pending' ? '待分配' : '已分配'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="预计送达">
                    {createdOrder.estimated_arrival_time ? dayjs(createdOrder.estimated_arrival_time).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="收件人">
                    {createdOrder.receiver_name} ({createdOrder.receiver_phone})
                  </Descriptions.Item>
                  <Descriptions.Item label="收件地址">
                    {createdOrder.receiver_address}
                  </Descriptions.Item>
                  <Descriptions.Item label="物品 / 重量">
                    {createdOrder.goods_name || '-'} ({createdOrder.goods_weight}kg) · {createdOrder.distance}km
                  </Descriptions.Item>
                  <Descriptions.Item label="配送费用">
                    <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{createdOrder.total_fee?.toFixed(2)}</span>
                    <span style={{ color: '#999', marginLeft: 8, fontSize: 11 }}>
                      (基础费¥{(createdOrder.platform_fee || 0).toFixed(2)} + 佣金¥{(createdOrder.total_fee - createdOrder.platform_fee).toFixed(2)})
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="抽佣率">
                    <span style={{ color: '#52c41a', fontWeight: 500 }}>
                      {createdOrder.total_fee ? (((createdOrder.total_fee - createdOrder.platform_fee) / createdOrder.total_fee) * 100).toFixed(1) : 0}%
                    </span>
                    <span style={{ color: '#999', marginLeft: 8, fontSize: 11 }}>结算时自动计算抽佣</span>
                  </Descriptions.Item>
                </Descriptions>
                <Alert
                  message="智能路由选择说明"
                  description={
                    <div>
                      <div><b>五维评分依据</b>：{selectedPlatform?.reason || '综合最优'}</div>
                      {selectedPlatform?.score_detail && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                          价格{(selectedPlatform.score_detail.price_score * 100).toFixed(1)}分 · 
                          时效{(selectedPlatform.score_detail.time_score * 100).toFixed(1)}分 · 
                          质量{(selectedPlatform.score_detail.quality_score * 100).toFixed(1)}分 · 
                          运力{(selectedPlatform.score_detail.saturation_score * 100).toFixed(1)}分 · 
                          综合 <b>{(selectedPlatform.score * 100).toFixed(1)}分</b>
                        </div>
                      )}
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
                  {fromMerchant && (
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/merchant')}>
                      返回商户看板
                    </Button>
                  )}
                  <Button icon={<EyeOutlined />} onClick={() => navigate('/orders')}>
                    查看订单（路由依据）
                  </Button>
                  <Button icon={<GiftOutlined />} onClick={() => navigate('/compensation')}>
                    SLA赔付追溯
                  </Button>
                  <Button icon={<FileTextOutlined />} onClick={() => navigate('/settlement')}>
                    结算对账入口
                  </Button>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { setCreatedOrder(null); setOrderModal(false); }}>
                    ✔ 完成，回写看板
                  </Button>
                </Space>
              </div>
            ) : (
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
            )}
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
