import React, { useState, useEffect } from 'react'
import {
  Row, Col, Card, Button, List, message, Modal, Form, Input, Select,
  Tabs, Tag, Space, Radio, InputNumber, Steps, Timeline, Badge, Divider
} from 'antd'
import {
  ShoppingCartOutlined, PlusOutlined, MinusOutlined, GiftOutlined,
  UserOutlined, CarOutlined, ClockCircleOutlined, HomeOutlined,
  TeamOutlined, EnvironmentOutlined, SafetyOutlined, TagOutlined,
  ShopOutlined, PhoneOutlined, SettingOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

const { Option } = Select
const { Step } = Steps
const { TextArea } = Input

const RunningOutlined = () => <span style={{ fontSize: '16px' }}>🏃</span>

const deliveryOptions = [
  { type: 'delivery', name: '外卖配送', icon: <CarOutlined />, time: '30-45分钟', fee: 5, minAmount: 30 },
  { type: 'errand', name: '跑腿代购', icon: <RunningOutlined />, time: '45-60分钟', fee: 8, minAmount: 0 },
  { type: 'pickup', name: '到店自提', icon: <HomeOutlined />, time: '15分钟', fee: 0, minAmount: 0 },
  { type: 'warehouse', name: '自营仓配', icon: <ShopOutlined />, time: '60分钟', fee: 3, minAmount: 50 }
]

const MerchantDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [merchant, setMerchant] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [cartVisible, setCartVisible] = useState(false)
  const [addProductVisible, setAddProductVisible] = useState(false)
  const [checkoutVisible, setCheckoutVisible] = useState(false)
  const [coupons, setCoupons] = useState([])
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [deliveryType, setDeliveryType] = useState('delivery')
  const [orderType, setOrderType] = useState('single')
  const [groupBuyInfo, setGroupBuyInfo] = useState({ peopleCount: 2, needMore: 1 })
  const [form] = Form.useForm()
  const [checkoutForm] = Form.useForm()
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (savedUser) setUser(JSON.parse(savedUser))
    setIsLoggedIn(!!token)
    loadMerchant()
    loadCoupons()
  }, [id])

  const loadMerchant = async () => {
    try {
      const res = await api.get(`/merchants/${id}`)
      setMerchant(res.data)
      setProducts(res.data.products || [])
    } catch (error) {
      message.error('加载商户信息失败')
    }
  }

  const loadCoupons = async () => {
    try {
      const allCoupons = await api.get('/coupons', { params: { merchant_id: id } })
      const myCoupons = localStorage.getItem('token')
        ? await api.get('/coupons/my').catch(() => ({ data: [] }))
        : { data: [] }
      setCoupons(allCoupons.data)
      setAvailableCoupons(myCoupons.data || [])
    } catch (error) {
      console.error('加载优惠券失败', error)
    }
  }

  const addToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: {
        ...product,
        quantity: (prev[product.id]?.quantity || 0) + 1
      }
    }))
  }

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[productId]?.quantity > 1) {
        newCart[productId].quantity -= 1
      } else {
        delete newCart[productId]
      }
      return newCart
    })
  }

  const getCartTotal = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const getCartCount = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
  }

  const getDeliveryFee = () => {
    const option = deliveryOptions.find(o => o.type === deliveryType)
    return option?.fee || 0
  }

  const getDiscountAmount = () => {
    if (!selectedCoupon) return 0
    const coupon = availableCoupons.find(c => c.id === selectedCoupon)
    if (!coupon) return 0
    
    const total = getCartTotal()
    if (total < coupon.min_amount) return 0
    
    if (coupon.type === 'fixed') {
      return coupon.value
    } else if (coupon.type === 'percent') {
      return total * (1 - coupon.value / 100)
    }
    return 0
  }

  const getFinalAmount = () => {
    return Math.max(0, getCartTotal() + getDeliveryFee() - getDiscountAmount())
  }

  const handleReceiveCoupon = async (couponId) => {
    if (!localStorage.getItem('token')) {
      message.warning('请先登录后领取优惠券')
      navigate('/login')
      return
    }

    try {
      await api.post(`/coupons/${couponId}/receive`)
      message.success('领取成功')
      loadCoupons()
    } catch (error) {
      message.error(error.response?.data?.error || '领取失败')
    }
  }

  const handleCheckout = () => {
    if (!user) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    if (getCartCount() === 0) {
      message.warning('请先选择商品')
      return
    }
    const deliveryOption = deliveryOptions.find(o => o.type === deliveryType)
    if (deliveryOption && getCartTotal() < deliveryOption.minAmount) {
      message.warning(`${deliveryOption.name}最低消费¥${deliveryOption.minAmount}`)
      return
    }
    setCheckoutVisible(true)
  }

  const handleSubmitOrder = async () => {
    const items = Object.values(cart).map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }))

    try {
      const values = await checkoutForm.validateFields()
      const res = await api.post('/orders', {
        merchant_id: merchant.id,
        business_domain: merchant.business_domain,
        items,
        address: values.address,
        phone: values.phone,
        remark: values.remark,
        coupon_id: selectedCoupon,
        delivery_type: deliveryType,
        order_type: orderType,
        group_people_count: orderType === 'group' ? groupBuyInfo.peopleCount : null
      })
      message.success(orderType === 'group' ? '拼单发起成功！等待小伙伴加入' : '下单成功！')
      setCart({})
      setCheckoutVisible(false)
      setCartVisible(false)
      navigate(`/orders/${res.data.id}`)
    } catch (error) {
      message.error(error.response?.data?.error || '下单失败')
    }
  }

  const handleAddProduct = async (values) => {
    try {
      await api.post('/products', {
        ...values,
        merchant_id: merchant.id
      })
      message.success('商品添加成功')
      setAddProductVisible(false)
      form.resetFields()
      loadMerchant()
    } catch (error) {
      message.error(error.response?.data?.error || '添加失败')
    }
  }

  if (!merchant) {
    return <Card loading />
  }

  const currentDelivery = deliveryOptions.find(o => o.type === deliveryType)

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col span={4}>
            <div style={{ height: 120, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', borderRadius: '8px' }}>
              {merchant.business_domain === 'takeout' ? '🍔' :
               merchant.business_domain === 'instore' ? '🏬' :
               merchant.business_domain === 'travel' ? '🚗' : '🏨'}
            </div>
          </Col>
          <Col span={14}>
            <h2 style={{ marginBottom: '8px' }}>{merchant.name}</h2>
            <p style={{ color: '#666', marginBottom: '8px' }}>{merchant.description || '暂无描述'}</p>
            <Space wrap style={{ marginBottom: '8px' }}>
              <Tag color="blue">
                {merchant.business_domain === 'takeout' ? '🍔 外卖' :
                 merchant.business_domain === 'instore' ? '🏬 到店' :
                 merchant.business_domain === 'travel' ? '🚗 出行' : '🏨 旅游'}
              </Tag>
              <Tag icon={<ClockCircleOutlined />} color="green">
                {currentDelivery?.time || '30分钟'}送达
              </Tag>
              <Tag icon={<SafetyOutlined />}>
                已认证商户
              </Tag>
              <Tag icon={<TagOutlined />} color="orange">
                月售 1000+
              </Tag>
            </Space>
            <Space wrap>
              <span style={{ color: '#999' }}><EnvironmentOutlined /> {merchant.address || '地址待更新'}</span>
              <span style={{ color: '#999' }}><PhoneOutlined /> {merchant.phone || '暂无电话'}</span>
            </Space>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {currentDelivery && (
                <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                  <div style={{ color: '#1890ff', fontSize: '14px', fontWeight: 'bold' }}>
                    <ClockCircleOutlined /> 预计 {currentDelivery.time}
                  </div>
                  <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                    配送费 ¥{currentDelivery.fee} · 满¥{currentDelivery.minAmount}起送
                  </div>
                </div>
              )}
              {(user?.role === 'admin' || (user?.role === 'merchant' && user?.merchant_id === merchant.id)) && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddProductVisible(true)}>
                  添加商品
                </Button>
              )}
              {user?.role === 'merchant' && user?.merchant_id === merchant.id && (
                <Button icon={<SettingOutlined />} onClick={() => navigate('/merchant/dashboard')}>
                  商户工作台
                </Button>
              )}
              {user?.role === 'rider' && (
                <Button icon={<RunningOutlined />} onClick={() => navigate('/rider/dashboard')}>
                  骑手工作台
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="products"
          items={[
            {
              key: 'products',
              label: merchant.business_domain === 'takeout' ? '菜品' :
                     merchant.business_domain === 'instore' ? '服务' :
                     merchant.business_domain === 'travel' ? '出行' : '产品',
              children: (
                <div>
                  {merchant.business_domain === 'takeout' && (
                    <Card type="inner" size="small" style={{ marginBottom: '16px' }}>
                      <Row gutter={[8, 8]}>
                        <Col span={6}>
                          <Button block icon={<CarOutlined />} type="primary">立即配送</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<HomeOutlined />}>到店自提</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<RunningOutlined />}>跑腿代购</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<TeamOutlined />}>拼单更省</Button>
                        </Col>
                      </Row>
                    </Card>
                  )}
                  {merchant.business_domain === 'instore' && (
                    <Card type="inner" size="small" style={{ marginBottom: '16px' }}>
                      <Row gutter={[8, 8]}>
                        <Col span={6}>
                          <Button block icon={<ClockCircleOutlined />} type="primary">立即预约</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<GiftOutlined />}>团购套餐</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<ShopOutlined />}>会员卡</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<SafetyOutlined />}>到店核销</Button>
                        </Col>
                      </Row>
                    </Card>
                  )}
                  {merchant.business_domain === 'travel' && (
                    <Card type="inner" size="small" style={{ marginBottom: '16px' }}>
                      <Row gutter={[8, 8]}>
                        <Col span={6}>
                          <Button block icon={<CarOutlined />} type="primary">立即叫车</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<EnvironmentOutlined />}>扫码用车</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<ClockCircleOutlined />}>公交查询</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<TagOutlined />}>火车票预订</Button>
                        </Col>
                      </Row>
                    </Card>
                  )}
                  {merchant.business_domain === 'tourism' && (
                    <Card type="inner" size="small" style={{ marginBottom: '16px' }}>
                      <Row gutter={[8, 8]}>
                        <Col span={6}>
                          <Button block icon={<HomeOutlined />} type="primary">预订酒店</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<TagOutlined />}>景点门票</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<EnvironmentOutlined />}>旅游攻略</Button>
                        </Col>
                        <Col span={6}>
                          <Button block icon={<GiftOutlined />}>套餐优惠</Button>
                        </Col>
                      </Row>
                    </Card>
                  )}
                  <Tabs
                    defaultActiveKey="all"
                    items={[
                      {
                        key: 'all',
                        label: '全部',
                        children: products.length > 0 ? (
                          <List
                            grid={{ gutter: 16, column: 4 }}
                            dataSource={products}
                            renderItem={product => (
                              <List.Item>
                                <Card
                                  hoverable
                                  cover={
                                    <div style={{ height: 120, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', position: 'relative' }}>
                                      {product.original_price && product.price < product.original_price && (
                                        <Badge.Ribbon text={merchant.business_domain === 'tourism' ? '限时' : '特价'} color="red">
                                          <span>{merchant.business_domain === 'takeout' ? '🍔' :
                                                 merchant.business_domain === 'instore' ? '🎫' :
                                                 merchant.business_domain === 'travel' ? '�' : '🏨'}</span>
                                        </Badge.Ribbon>
                                      )}
                                      {!product.original_price && <span>{merchant.business_domain === 'takeout' ? '🍔' :
                                                 merchant.business_domain === 'instore' ? '🎫' :
                                                 merchant.business_domain === 'travel' ? '�' : '🏨'}</span>}
                                    </div>
                                  }
                                  actions={[
                                    <div key="cart-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                      {merchant.business_domain === 'tourism' || merchant.business_domain === 'instore' ? (
                                        <Button type="primary" size="small" onClick={() => addToCart(product)}>
                                          {merchant.business_domain === 'tourism' ? '预订' : '预约'}
                                        </Button>
                                      ) : (
                                        <>
                                          {cart[product.id]?.quantity > 0 && (
                                            <>
                                              <Button icon={<MinusOutlined />} size="small" onClick={() => removeFromCart(product.id)} />
                                              <span style={{ minWidth: '24px', textAlign: 'center' }}>{cart[product.id].quantity}</span>
                                            </>
                                          )}
                                          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => addToCart(product)} />
                                        </>
                                      )}
                                    </div>
                                  ]}
                                >
                                  <Card.Meta
                                    title={product.name}
                                    description={
                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                          <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '18px' }}>¥{product.price}</span>
                                          {product.original_price && (
                                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '12px' }}>¥{product.original_price}</span>
                                          )}
                                        </div>
                                        <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                          {merchant.business_domain === 'takeout' ? `月售 ${Math.floor(Math.random() * 500) + 100} 单` :
                                           merchant.business_domain === 'instore' ? `${Math.floor(Math.random() * 200) + 50} 人已预约` :
                                           merchant.business_domain === 'travel' ? `${Math.floor(Math.random() * 1000) + 500} 次服务` :
                                           `${Math.floor(Math.random() * 300) + 100} 份已售`}
                                        </div>
                                        {product.stock !== undefined && (
                                          <div style={{ color: product.stock < 20 ? '#ff4d4f' : '#52c41a', fontSize: '12px' }}>
                                            库存: {product.stock} {merchant.business_domain === 'tourism' ? '间' : '件'}
                                          </div>
                                        )}
                                      </div>
                                    }
                                  />
                                </Card>
                              </List.Item>
                            )}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            <p>暂无{merchant.business_domain === 'takeout' ? '菜品' :
                                 merchant.business_domain === 'instore' ? '服务' :
                                 merchant.business_domain === 'travel' ? '出行服务' : '产品'}</p>
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              )
            },
            {
              key: 'coupons',
              label: '优惠券',
              children: coupons.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {coupons.map(coupon => {
                    const received = availableCoupons.some(c => c.coupon_id === coupon.id || c.id === coupon.id)
                    const canUse = getCartTotal() >= coupon.min_amount
                    return (
                      <Col span={8} key={coupon.id}>
                        <Card
                          style={{
                            background: received ? '#f5f5f5' : 'linear-gradient(135deg, #ff4d4f 0%, #ff7a45 100%)',
                            color: received ? '#999' : '#fff',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: canUse && !received ? 'pointer' : 'default'
                          }}
                          bodyStyle={{ padding: '16px' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <span style={{ fontSize: '28px', fontWeight: 'bold' }}>
                                  {coupon.type === 'fixed' ? `¥${coupon.value}` : `${coupon.value}折`}
                                </span>
                                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                                  {coupon.business_domain === 'takeout' ? '外卖专享' :
                                   coupon.business_domain === 'instore' ? '到店专享' :
                                   coupon.business_domain === 'travel' ? '出行专享' :
                                   coupon.business_domain === 'tourism' ? '旅游专享' : '通用'}
                                </span>
                              </div>
                              <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>{coupon.name}</div>
                              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                                <div>📅 有效期: {coupon.valid_days ? `领取后${coupon.valid_days}天内有效` : '长期有效'}</div>
                                <div>💰 {coupon.min_amount > 0 ? `满${coupon.min_amount}元可用` : '无门槛使用'}</div>
                                <div>🏪 适用: {coupon.scope === 'all' ? '全店通用' : '指定商品可用'}</div>
                              </div>
                              {!canUse && (
                                <div style={{ fontSize: '12px', marginTop: '8px', color: '#ff4d4f' }}>
                                  还差 ¥{(coupon.min_amount - getCartTotal()).toFixed(2)} 可用
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'center', minWidth: '60px' }}>
                              {received ? (
                                <Tag color="green">已领取</Tag>
                              ) : (
                                <Button
                                  size="small"
                                  type="primary"
                                  ghost
                                  onClick={() => handleReceiveCoupon(coupon.id)}
                                  disabled={!isLoggedIn}
                                >
                                  {isLoggedIn ? '领取' : '登录领券'}
                                </Button>
                              )}
                              {received && (
                                <div style={{ fontSize: '11px', marginTop: '4px', color: '#52c41a' }}>
                                  可用 {coupon.usage_limit || 1} 次
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无优惠券
                </div>
              )
            },
            {
              key: 'detail',
              label: '商家详情',
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="商家信息" size="small">
                      <p><strong>营业时间:</strong> 09:00 - 22:00</p>
                      <p><strong>商家地址:</strong> {merchant.address}</p>
                      <p><strong>联系电话:</strong> {merchant.phone}</p>
                      <p><strong>商家介绍:</strong> {merchant.description}</p>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="配送信息" size="small">
                      <List
                        dataSource={deliveryOptions}
                        renderItem={option => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<span style={{ fontSize: '24px' }}>{option.icon}</span>}
                              title={option.name}
                              description={
                                <div>
                                  <span><ClockCircleOutlined /> {option.time} | </span>
                                  <span>配送费 ¥{option.fee} | </span>
                                  <span>满¥{option.minAmount}起送</span>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]}
        />
      </Card>

      {getCartCount() > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          padding: '16px 24px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Badge count={getCartCount()} size="small">
              <Button
                type="primary"
                shape="circle"
                icon={<ShoppingCartOutlined />}
                size="large"
                onClick={() => setCartVisible(true)}
              />
            </Badge>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
                ¥{getCartTotal().toFixed(2)}
                {selectedCoupon && getDiscountAmount() > 0 && (
                  <span style={{ fontSize: '14px', color: '#52c41a', marginLeft: '8px' }}>
                    已减¥{getDiscountAmount().toFixed(2)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                另需配送费 ¥{getDeliveryFee()}
              </div>
            </div>
          </div>
          <Space>
            <Radio.Group value={orderType} onChange={(e) => setOrderType(e.target.value)}>
              <Radio.Button value="single"><UserOutlined /> 单人</Radio.Button>
              <Radio.Button value="group"><TeamOutlined /> 拼单</Radio.Button>
            </Radio.Group>
            <Button type="primary" size="large" onClick={handleCheckout}>
              {orderType === 'group' ? '发起拼单' : '去结算'}
            </Button>
          </Space>
        </div>
      )}

      <Modal
        title="购物车"
        open={cartVisible}
        onCancel={() => setCartVisible(false)}
        footer={null}
        width={600}
      >
        <Card type="inner" title="配送方式" style={{ marginBottom: '16px' }}>
          <Radio.Group value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {deliveryOptions.map(option => (
                <Radio.Button key={option.type} value={option.type} style={{ width: '100%', padding: '12px', textAlign: 'left' }}>
                  <Space>
                    <span style={{ fontSize: '20px' }}>{option.icon}</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{option.name}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {option.time} · 配送费¥{option.fee} · 满¥{option.minAmount}起送
                      </div>
                    </div>
                  </Space>
                </Radio.Button>
              ))}
            </Space>
          </Radio.Group>
        </Card>

        {orderType === 'group' && (
          <Card type="inner" title="拼单设置" style={{ marginBottom: '16px' }}>
            <Space>
              <span>拼单人数:</span>
              <Radio.Group value={groupBuyInfo.peopleCount} onChange={(e) => setGroupBuyInfo(prev => ({ ...prev, peopleCount: e.target.value }))}>
                <Radio.Button value={2}>2人团</Radio.Button>
                <Radio.Button value={3}>3人团</Radio.Button>
                <Radio.Button value={4}>4人团</Radio.Button>
                <Radio.Button value={5}>5人团</Radio.Button>
              </Radio.Group>
            </Space>
            <div style={{ marginTop: '8px', color: '#52c41a' }}>
              <TeamOutlined /> 还需 {groupBuyInfo.peopleCount - 1} 人即可成团
            </div>
          </Card>
        )}

        {availableCoupons.length > 0 && (
          <Card type="inner" title="选择优惠券" style={{ marginBottom: '16px' }}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择可用优惠券"
              value={selectedCoupon}
              onChange={setSelectedCoupon}
              allowClear
            >
              {availableCoupons.map(coupon => {
                const available = getCartTotal() >= coupon.min_amount
                return (
                  <Option key={coupon.id} value={coupon.id} disabled={!available}>
                    {coupon.name} - {coupon.type === 'fixed' ? `减¥${coupon.value}` : `${coupon.value}折`}
                    {available ? '' : ' (不满足使用条件)'}
                  </Option>
                )
              })}
            </Select>
          </Card>
        )}

        <List
          dataSource={Object.values(cart)}
          renderItem={item => (
            <List.Item
              actions={[
                <Button icon={<MinusOutlined />} size="small" onClick={() => removeFromCart(item.id)} />,
                <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>,
                <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => addToCart(item)} />
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={
                  <div>
                    <span>¥{item.price} × {item.quantity}</span>
                    <span style={{ marginLeft: '16px', fontWeight: 'bold' }}>
                      = ¥{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                }
              />
            </List.Item>
          )}
        />

        <Divider />
        <Row justify="space-between">
          <Col>
            <div>商品金额: ¥{getCartTotal().toFixed(2)}</div>
            <div>配送费: ¥{getDeliveryFee().toFixed(2)}</div>
            {getDiscountAmount() > 0 && (
              <div style={{ color: '#52c41a' }}>优惠券抵扣: -¥{getDiscountAmount().toFixed(2)}</div>
            )}
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '8px' }}>
              实付: ¥{getFinalAmount().toFixed(2)}
            </div>
          </Col>
          <Col>
            <Button type="primary" size="large" onClick={handleCheckout}>
              {orderType === 'group' ? '发起拼单' : '提交订单'}
            </Button>
          </Col>
        </Row>
      </Modal>

      <Modal
        title="确认订单"
        open={checkoutVisible}
        onCancel={() => setCheckoutVisible(false)}
        footer={null}
        width={600}
      >
        <Card type="inner" title="商品清单" style={{ marginBottom: '16px' }}>
          <List
            dataSource={Object.values(cart)}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={item.name}
                  description={`¥${item.price} × ${item.quantity}`}
                />
                <div>¥{(item.price * item.quantity).toFixed(2)}</div>
              </List.Item>
            )}
          />
        </Card>

        <Form form={checkoutForm} layout="vertical">
          <Form.Item
            name="address"
            label="配送地址"
            rules={[{ required: true, message: '请输入配送地址' }]}
            initialValue={user?.nickname ? `${user.nickname}的收货地址` : ''}
          >
            <Input prefix={<EnvironmentOutlined />} placeholder="请输入详细地址" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
            initialValue={user?.phone || ''}
          >
            <Input prefix={<PhoneOutlined />} placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="如有特殊要求请备注" />
          </Form.Item>
        </Form>

        <Card type="inner" style={{ marginBottom: '16px' }}>
          <Row justify="space-between">
            <Col>
              <div style={{ fontSize: '14px' }}>
                <div>商品金额: ¥{getCartTotal().toFixed(2)}</div>
                <div>配送方式: {currentDelivery?.name} (¥{getDeliveryFee()})</div>
                {selectedCoupon && (
                  <div style={{ color: '#52c41a' }}>
                    <GiftOutlined /> 优惠券抵扣: -¥{getDiscountAmount().toFixed(2)}
                  </div>
                )}
              </div>
            </Col>
            <Col>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                实付: ¥{getFinalAmount().toFixed(2)}
              </div>
            </Col>
          </Row>
        </Card>

        <Steps size="small" current={0} style={{ marginBottom: '16px' }}>
          <Step title="提交订单" />
          <Step title="商家确认" />
          <Step title="配送中" />
          <Step title="已完成" />
        </Steps>

        <Row justify="end">
          <Space>
            <Button onClick={() => setCheckoutVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmitOrder}>
              确认支付 ¥{getFinalAmount().toFixed(2)}
            </Button>
          </Space>
        </Row>
      </Modal>

      <Modal
        title="添加商品"
        open={addProductVisible}
        onCancel={() => setAddProductVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddProduct} layout="vertical">
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item name="description" label="商品描述">
            <TextArea rows={2} placeholder="请输入商品描述" />
          </Form.Item>
          <Form.Item name="price" label="售价" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入售价" />
          </Form.Item>
          <Form.Item name="original_price" label="原价">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入原价" />
          </Form.Item>
          <Form.Item name="stock" label="库存">
            <InputNumber style={{ width: '100%' }} min={0} defaultValue={100} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>添加商品</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MerchantDetail
