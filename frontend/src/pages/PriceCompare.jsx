import React, { useState, useEffect } from 'react'
import { Card, Form, InputNumber, Select, Button, Row, Col, Tag, Divider, List, Statistic, message, Radio } from 'antd'
import {
  ThunderboltOutlined,
  DollarOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RocketOutlined
} from '@ant-design/icons'
import { orderApi, platformApi } from '../api'

const { Option } = Select

function PriceCompare() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [quoteResult, setQuoteResult] = useState(null)
  const [platforms, setPlatforms] = useState([])
  const [sortBy, setSortBy] = useState('score')

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

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">运费比价引擎</h2>
        <Tag color="blue">智能推荐 · 一键比价 · 多平台对比</Tag>
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
                        border: index === 0 && sortBy === 'score' ? '2px solid #52c41a' : undefined
                      }}
                    >
                      {index === 0 && sortBy === 'score' && <div className="recommend-badge">推荐</div>}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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

                      <Button 
                        type="primary" 
                        block 
                        size="small" 
                        style={{ marginTop: 12 }}
                        onClick={() => message.success(`已选择 ${item.platform.name}`)}
                      >
                        选择该平台
                      </Button>
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
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}

export default PriceCompare
