import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Tabs, Tag, Modal, InputNumber, message, Badge, List, Avatar, Alert, Descriptions, Progress, Divider, Space, Result, Timeline } from 'antd'
import { ShoppingCartOutlined, GiftOutlined, PhoneOutlined, ThunderboltOutlined, ShopOutlined, CoffeeOutlined, WarningOutlined, SafetyCertificateOutlined, CheckCircleOutlined, FileTextOutlined, LockOutlined, GiftOutlined as DeliverIcon, SearchOutlined } from '@ant-design/icons'
import api from '../utils/api'
import dayjs from 'dayjs'

const Mall = () => {
  const [products, setProducts] = useState([])
  const [exchangeRecords, setExchangeRecords] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [resultModalVisible, setResultModalVisible] = useState(false)
  const [voucherModalVisible, setVoucherModalVisible] = useState(false)
  const [exchangeQuantity, setExchangeQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('mall')
  const [exchangeCheck, setExchangeCheck] = useState(null)
  const [exchangeResult, setExchangeResult] = useState(null)
  const [currentVoucher, setCurrentVoucher] = useState(null)
  const [checkLoading, setCheckLoading] = useState(false)

  const categoryIcons = {
    phone_card: <PhoneOutlined />,
    membership: <GiftOutlined />,
    electricity: <ThunderboltOutlined />,
    shopping: <ShopOutlined />,
    catering: <CoffeeOutlined />
  }

  const categoryNames = {
    phone_card: '话费充值',
    membership: '视频会员',
    electricity: '电费红包',
    shopping: '购物卡券',
    catering: '餐饮美食'
  }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchProducts()
    fetchExchangeRecords()
  }, [])

  const fetchProducts = async (category = '') => {
    try {
      const params = category ? `?category=${category}` : ''
      const data = await api.get(`/mall/products${params}`)
      setProducts(data.products)
    } catch (error) {
      message.error('获取商品列表失败')
    }
  }

  const fetchExchangeRecords = async () => {
    try {
      const data = await api.get('/mall/exchange-records')
      setExchangeRecords(data.records)
    } catch (error) {
      console.error('获取兑换记录失败', error)
    }
  }

  const handleOpenExchange = async (product) => {
    setSelectedProduct(product)
    setExchangeQuantity(1)
    setCheckLoading(true)
    setModalVisible(true)
    setExchangeCheck(null)

    try {
      const data = await api.get(`/mall/exchange-check?product_id=${product.id}`)
      setExchangeCheck(data)
    } catch (error) {
      console.error('获取兑换检查失败', error)
    } finally {
      setCheckLoading(false)
    }
  }

  const handleConfirmExchange = () => {
    setModalVisible(false)
    setConfirmModalVisible(true)
  }

  const handleExchange = async () => {
    if (!selectedProduct) return

    setLoading(true)
    try {
      const data = await api.post('/mall/exchange', {
        product_id: selectedProduct.id,
        quantity: exchangeQuantity
      })
      setExchangeResult(data)
      setConfirmModalVisible(false)
      setResultModalVisible(true)
      fetchProducts()
      fetchExchangeRecords()

      const updatedUser = { ...user, points: data.remaining_points }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch (error) {
      message.error(error.response?.data?.error || '兑换失败')
    } finally {
      setLoading(false)
    }
  }

  const openVoucher = (record) => {
    setCurrentVoucher(record)
    setVoucherModalVisible(true)
  }

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'normal': return 'green'
      case 'low': return 'orange'
      case 'high': return 'red'
      default: return 'default'
    }
  }

  const tabItems = [
    { key: 'mall', label: '积分商城' },
    { key: 'records', label: '兑换记录' }
  ]

  return (
    <div>
      <Card
        extra={
          <div style={{ fontSize: 16 }}>
            我的积分：<strong style={{ color: '#fa8c16', fontSize: 20 }}>{user?.points || 0}</strong>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        {activeTab === 'mall' && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {Object.entries(categoryNames).map(([key, name]) => (
                <Col span={4} key={key}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => fetchProducts(key)}
                    size="small"
                  >
                    <div style={{ fontSize: 24, color: '#1890ff', marginBottom: 4 }}>
                      {categoryIcons[key]}
                    </div>
                    <div style={{ fontSize: 12 }}>{name}</div>
                  </Card>
                </Col>
              ))}
              <Col span={4}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => fetchProducts()}
                  size="small"
                >
                  <div style={{ fontSize: 24, color: '#1890ff', marginBottom: 4 }}>
                    <GiftOutlined />
                  </div>
                  <div style={{ fontSize: 12 }}>全部</div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              {products.map(product => (
                <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                  <Badge.Ribbon text={product.stock > 0 ? '有货' : '缺货'} color={product.stock > 0 ? 'green' : 'red'}>
                    <Card
                      hoverable
                      cover={
                        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, background: '#f5f5f5' }}>
                          {categoryIcons[product.category] || <GiftOutlined />}
                        </div>
                      }
                      actions={[
                        <Button
                          key="exchange"
                          type="primary"
                          size="small"
                          disabled={product.stock <= 0}
                          onClick={() => handleOpenExchange(product)}
                        >
                          去兑换
                        </Button>
                      ]}
                    >
                      <Card.Meta
                        title={<span style={{ fontSize: 14 }}>{product.name}</span>}
                        description={
                          <div>
                            <Tag color="orange">{product.points} 积分</Tag>
                            {product.market_value > 0 && (
                              <Tag color="gold" style={{ marginLeft: 4 }}>¥{product.market_value.toFixed(2)}</Tag>
                            )}
                            {product.is_virtual && <Tag color="blue">虚拟商品</Tag>}
                            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                              库存：{product.stock} | 每日限兑：{product.daily_limit}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Badge.Ribbon>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {activeTab === 'records' && (
          <List
            itemLayout="horizontal"
            dataSource={exchangeRecords}
            renderItem={record => (
              <List.Item
                actions={[
                  record.risk_flag ? <Tag color="red" icon={<WarningOutlined />}>风控标记</Tag> : <Tag color="green" icon={<CheckCircleOutlined />}>正常</Tag>,
                  <Tag color={record.status === 'success' ? 'green' : 'orange'}>
                    {record.status === 'success' ? '兑换成功' : '处理中'}
                  </Tag>,
                  <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => openVoucher(record)}>
                    凭证
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<GiftOutlined />} />}
                  title={
                    <span>
                      {record.name}
                      {record.quantity > 1 && <Tag style={{ marginLeft: 8 }}>x{record.quantity}</Tag>}
                      {record.risk_flag >= 2 && <Tag color="red" style={{ marginLeft: 8 }}>疑似转售</Tag>}
                      {record.risk_flag === 1 && <Tag color="orange" style={{ marginLeft: 8 }}>风控提醒</Tag>}
                    </span>
                  }
                  description={
                    <span>
                      消耗 {record.points * record.quantity} 积分 |
                      {dayjs(record.created_at).format('YYYY-MM-DD HH:mm')}
                      {record.risk_reason && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>| 风险原因：{record.risk_reason}</span>}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="商品兑换"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="confirm" type="primary" disabled={!exchangeCheck?.can_exchange} onClick={handleConfirmExchange}>
            确认兑换
          </Button>
        ]}
      >
        {selectedProduct && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 100, height: 100, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, borderRadius: 8 }}>
                {categoryIcons[selectedProduct.category] || <GiftOutlined />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px' }}>{selectedProduct.name}</h3>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#999' }}>{selectedProduct.description}</p>
                <p style={{ margin: 0 }}>
                  <Tag color="orange" style={{ fontSize: 16, padding: '4px 12px' }}>{selectedProduct.points} 积分</Tag>
                  {selectedProduct.market_value > 0 && (
                    <Tag color="gold" style={{ fontSize: 14, marginLeft: 8 }}>市场价 ¥{selectedProduct.market_value.toFixed(2)}</Tag>
                  )}
                </p>
              </div>
            </div>

            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="商品类型">
                {selectedProduct.is_virtual ? <Tag color="blue">虚拟商品</Tag> : <Tag>实物商品</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="库存">{selectedProduct.stock} 件</Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <span style={{ marginRight: 8 }}>兑换数量：</span>
              <InputNumber
                min={1}
                max={Math.min(selectedProduct.daily_limit, selectedProduct.stock)}
                value={exchangeQuantity}
                onChange={setExchangeQuantity}
              />
            </div>

            <p>合计：<strong style={{ color: '#fa8c16' }}>{selectedProduct.points * exchangeQuantity}</strong> 积分</p>
            <p>当前积分：<strong>{user?.points || 0}</strong> 积分</p>

            {exchangeCheck && (
              <>
                <Divider orientation="left" plain>限兑与风控信息</Divider>

                <div style={{ marginBottom: 12 }}>
                  <span style={{ marginRight: 8 }}>今日限兑进度：</span>
                  <Progress
                    percent={Math.round((exchangeCheck.today_count / exchangeCheck.daily_limit) * 100)}
                    format={() => `${exchangeCheck.today_count}/${exchangeCheck.daily_limit}`}
                    status={exchangeCheck.today_count >= exchangeCheck.daily_limit ? 'exception' : 'active'}
                    style={{ display: 'inline-block', width: 200, marginLeft: 8 }}
                  />
                </div>

                {exchangeCheck.today_count >= exchangeCheck.daily_limit && (
                  <Alert
                    message="已达到今日限兑上限"
                    description={`该商品每日限兑${exchangeCheck.daily_limit}件，今日已兑${exchangeCheck.today_count}件，明日再来`}
                    type="error"
                    showIcon
                    icon={<WarningOutlined />}
                    style={{ marginBottom: 12 }}
                  />
                )}

                {exchangeCheck.remaining_today > 0 && exchangeCheck.remaining_today <= 2 && (
                  <Alert
                    message="限兑即将达到上限"
                    description={`今日剩余可兑${exchangeCheck.remaining_today}件，请合理安排`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                )}

                {selectedProduct.is_virtual && (
                  <Alert
                    message="虚拟商品防转售提醒"
                    description="该商品为虚拟商品，仅限自用。如发现转售行为，平台有权冻结账户积分并收回权益。本次兑换将记录溯源追踪ID。"
                    type="warning"
                    showIcon
                    icon={<SafetyCertificateOutlined />}
                    style={{ marginBottom: 12 }}
                  />
                )}

                {(selectedProduct.points * exchangeQuantity) > (user?.points || 0) && (
                  <Alert
                    message="积分不足"
                    description={`当前积分 ${user?.points || 0}，需要 ${selectedProduct.points * exchangeQuantity} 积分`}
                    type="error"
                    showIcon
                  />
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="确认兑换"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onOk={handleExchange}
        confirmLoading={loading}
        okText="立即兑换"
        cancelText="取消"
      >
        {selectedProduct && (
          <div>
            <Alert
              message="请确认兑换信息"
              description="兑换成功后积分将立即扣除，虚拟商品不可退换"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="商品">{selectedProduct.name}</Descriptions.Item>
              <Descriptions.Item label="数量">{exchangeQuantity} 件</Descriptions.Item>
              <Descriptions.Item label="消耗积分"><strong style={{ color: '#fa8c16' }}>{selectedProduct.points * exchangeQuantity}</strong></Descriptions.Item>
              <Descriptions.Item label="剩余积分">{(user?.points || 0) - selectedProduct.points * exchangeQuantity}</Descriptions.Item>
              <Descriptions.Item label="商品类型">
                {selectedProduct.is_virtual ? (
                  <Tag color="blue">虚拟商品（自动发货）</Tag>
                ) : (
                  <Tag>实物商品（3-5天发货）</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            {selectedProduct.is_virtual && (
              <Alert
                message="防转售承诺"
                description="我承诺本次兑换仅用于个人消费，不会以任何形式转售。违反承诺将承担相应责任。所有兑换记录已被风控系统追踪。"
                type="warning"
                showIcon
                icon={<LockOutlined />}
                style={{ marginTop: 12 }}
              />
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="兑换结果"
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        width={600}
        footer={[
          <Button key="voucher" icon={<FileTextOutlined />} onClick={() => { setResultModalVisible(false); if (exchangeResult?.voucher) { setCurrentVoucher(exchangeResult.voucher); setVoucherModalVisible(true) } }}>
            查看兑换凭证
          </Button>,
          <Button key="records" onClick={() => { setResultModalVisible(false); setActiveTab('records') }}>
            查看兑换记录
          </Button>,
          <Button key="close" type="primary" onClick={() => setResultModalVisible(false)}>
            完成
          </Button>
        ]}
      >
        {exchangeResult && (
          <div>
            <Result
              status={exchangeResult.risk_flag ? 'warning' : 'success'}
              title={exchangeResult.risk_flag ? '兑换成功（风控提醒）' : '兑换成功'}
              subTitle={`已成功兑换 ${exchangeResult.product_name} x${exchangeResult.quantity}，消耗 ${exchangeResult.points_used} 积分`}
            />

            {exchangeResult.benefit_delivery && (
              <Card title={<span><DeliverIcon /> 权益发放</span>} size="small" style={{ marginTop: 16 }}>
                <Timeline
                  size="small"
                  items={[
                    {
                      color: 'green',
                      children: (
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>兑换成功</p>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>{dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
                        </div>
                      )
                    },
                    {
                      color: exchangeResult.benefit_delivery.status === 'delivered' ? 'green' : 'blue',
                      children: (
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>
                            {exchangeResult.benefit_delivery.status === 'delivered' ? '权益已发放' : '权益发放中'}
                          </p>
                          {exchangeResult.benefit_delivery.benefit_code && (
                            <p style={{ margin: '8px 0 0', fontFamily: 'monospace', fontSize: 16, background: '#f6ffed', padding: '8px 12px', borderRadius: 4, color: '#52c41a', fontWeight: 'bold' }}>
                              {exchangeResult.benefit_delivery.benefit_code}
                            </p>
                          )}
                          {exchangeResult.benefit_delivery.expiry_date && (
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>
                              有效期至：{dayjs(exchangeResult.benefit_delivery.expiry_date).format('YYYY-MM-DD')}
                            </p>
                          )}
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{exchangeResult.benefit_delivery.delivery_note}</p>
                        </div>
                      )
                    }
                  ]}
                />
              </Card>
            )}

            {exchangeResult.risk_assessment && (
              <Card
                title={<span><SafetyCertificateOutlined /> 风控判定结果</span>}
                size="small"
                style={{ marginTop: 16 }}
              >
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="风险等级">
                    <Tag color={getRiskLevelColor(exchangeResult.risk_assessment.risk_level)}>
                      {exchangeResult.risk_assessment.risk_level === 'normal' ? '正常' :
                       exchangeResult.risk_assessment.risk_level === 'low' ? '低风险' : '高风险'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="转售风险评分">
                    <Progress
                      type="dashboard"
                      percent={exchangeResult.risk_assessment.resale_risk_score}
                      width={60}
                      status={exchangeResult.risk_assessment.resale_risk_score >= 80 ? 'exception' : exchangeResult.risk_assessment.resale_risk_score >= 50 ? 'warning' : 'normal'}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="风险因素" span={2}>
                    {exchangeResult.risk_assessment.risk_factors && exchangeResult.risk_assessment.risk_factors.length > 0 ? (
                      <div>
                        {exchangeResult.risk_assessment.risk_factors.map((f, i) => (
                          <Tag key={i} color="orange" style={{ marginBottom: 4 }}>{f}</Tag>
                        ))}
                      </div>
                    ) : (
                      <Tag color="green">无风险因素</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="溯源追踪ID" span={2}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{exchangeResult.risk_assessment.trace_id}</span>
                  </Descriptions.Item>
                </Descriptions>
                {exchangeResult.risk_assessment.resale_protection && (
                  <Alert
                    message="防转售保护"
                    description={exchangeResult.risk_assessment.resale_protection}
                    type="warning"
                    showIcon
                    icon={<LockOutlined />}
                    style={{ marginTop: 12 }}
                  />
                )}
              </Card>
            )}

            {exchangeResult.risk_flag > 0 && exchangeResult.risk_reason && (
              <Alert
                message="风控提醒"
                description={exchangeResult.risk_reason}
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginTop: 12 }}
              />
            )}

            {exchangeResult.warnings && exchangeResult.warnings.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, background: '#fffbe6', borderRadius: 4 }}>
                {exchangeResult.warnings.map((w, i) => (
                  <p key={i} style={{ margin: '4px 0', color: '#ad6800', fontSize: 13 }}>⚠️ {w}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={<span><FileTextOutlined /> 兑换凭证</span>}
        open={voucherModalVisible}
        onCancel={() => setVoucherModalVisible(false)}
        width={520}
        footer={[
          <Button key="close" type="primary" onClick={() => setVoucherModalVisible(false)}>关闭</Button>
        ]}
      >
        {currentVoucher && (
          <div>
            <Alert
              message="兑换凭证"
              description="本凭证是积分兑换权益的合法依据，所有兑换记录已被风控系统追踪"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="凭证编号">
                <span style={{ fontFamily: 'monospace' }}>{currentVoucher.voucher_no || `REC${String(currentVoucher.id).padStart(8, '0')}`}</span>
              </Descriptions.Item>
              <Descriptions.Item label="商品名称">{currentVoucher.product_name || currentVoucher.name}</Descriptions.Item>
              <Descriptions.Item label="商品类别">
                {categoryNames[currentVoucher.product_category] || currentVoucher.product_category || '其他'}
              </Descriptions.Item>
              <Descriptions.Item label="兑换数量">{currentVoucher.quantity || 1} 件</Descriptions.Item>
              <Descriptions.Item label="消耗积分">{(currentVoucher.points || 0) * (currentVoucher.quantity || 1)} 积分</Descriptions.Item>
              {currentVoucher.benefit_code && (
                <Descriptions.Item label="权益码">
                  <span style={{ fontFamily: 'monospace', fontSize: 16, color: '#52c41a', fontWeight: 'bold' }}>
                    {currentVoucher.benefit_code}
                  </span>
                </Descriptions.Item>
              )}
              {currentVoucher.expiry_date && (
                <Descriptions.Item label="有效期至">
                  {dayjs(currentVoucher.expiry_date).format('YYYY-MM-DD')}
                </Descriptions.Item>
              )}
              {currentVoucher.trace_id && (
                <Descriptions.Item label="溯源追踪ID">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{currentVoucher.trace_id}</span>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="风控状态">
                {currentVoucher.risk_flag ? (
                  <Tag color="red" icon={<WarningOutlined />}>
                    {currentVoucher.risk_flag >= 2 ? '高风险' : '风控提醒'}
                  </Tag>
                ) : (
                  <Tag color="green" icon={<CheckCircleOutlined />}>正常</Tag>
                )}
                {currentVoucher.risk_reason && <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>{currentVoucher.risk_reason}</span>}
              </Descriptions.Item>
              <Descriptions.Item label="兑换时间">
                {dayjs(currentVoucher.created_at || currentVoucher.delivered_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            {currentVoucher.resale_protection && (
              <Alert
                message="防转售保护"
                description={currentVoucher.resale_protection}
                type="warning"
                showIcon
                icon={<LockOutlined />}
                style={{ marginTop: 12 }}
              />
            )}

            <Divider style={{ margin: '16px 0 8px' }} />
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
              本凭证由国家电网综合能源服务门户积分商城系统自动生成，所有兑换行为已被风控系统追踪记录
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Mall
