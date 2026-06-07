import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, Button, Typography, Tag, message, Select, Result } from 'antd'
import { ShoppingCartOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { orderAPI, userAPI } from '../utils/api'
import MoviePoster from '../components/MoviePoster'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

function OrderConfirm() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state
  const [coupons, setCoupons] = useState([])
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [loading, setLoading] = useState(false)
  const [orderResult, setOrderResult] = useState(null)

  useEffect(() => {
    if (!state) {
      navigate('/')
      return
    }
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      const data = await userAPI.coupons()
      setCoupons(data || [])
    } catch (e) {}
  }

  const handleSubmitOrder = async () => {
    setLoading(true)
    try {
      const data = await orderAPI.create({
        session_id: state.sessionId,
        seats: JSON.stringify(state.seats),
        order_no: state.orderNo,
        coupon_id: selectedCoupon
      })
      setOrderResult(data)
      message.success('订单创建成功')
    } catch (e) {
      message.error(e.response?.data?.error || '订单创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    setLoading(true)
    try {
      await orderAPI.pay(orderResult.id || orderResult.order_no)
      message.success('支付成功')
      navigate('/user?tab=orders')
    } catch (e) {
      message.error('支付失败')
    } finally {
      setLoading(false)
    }
  }

  if (!state) return null

  const finalPrice = selectedCoupon 
    ? Math.max(0, state.price - (coupons.find(c => c.id === selectedCoupon)?.value || 0))
    : state.price

  if (orderResult) {
    return (
      <Card style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <Result
          status="success"
          title="订单创建成功"
          subTitle={`订单号：${orderResult.order_no}`}
          extra={[
            <div key="info" style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 8 }}>票面总价：¥{orderResult.total_amount}</div>
              <div style={{ marginBottom: 8, fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                实付金额：¥{orderResult.pay_amount}
              </div>
              <div>
                <Text type="secondary">核销码：{orderResult.verify_code}</Text>
              </div>
            </div>,
            <Button key="pay" type="primary" size="large" onClick={handlePay} loading={loading}>
              立即支付
            </Button>,
            <Button key="later" size="large" onClick={() => navigate('/user?tab=orders')}>
              稍后支付
            </Button>
          ]}
        />
      </Card>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>
          <ShoppingCartOutlined /> 确认订单
        </Title>

        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <MoviePoster movie={state.session} height={140} compact style={{ width: 100, flex: '0 0 100px', borderRadius: 4 }} />
          <div>
            <Title level={4} style={{ marginBottom: 8 }}>{state.session?.title}</Title>
            <div style={{ color: '#666', marginBottom: 4 }}>
              {dayjs(state.session?.start_time).format('YYYY-MM-DD HH:mm')} - {dayjs(state.session?.end_time).format('HH:mm')}
            </div>
            <div style={{ color: '#666', marginBottom: 4 }}>
              {state.session?.cinema_name} {state.session?.hall_name}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {state.seats.map(s => {
                const [r, c] = s.split('-')
                return <Tag key={s} color="orange">{parseInt(r) + 1}排{parseInt(c) + 1}座</Tag>
              })}
            </div>
          </div>
        </div>

        {coupons.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8 }}>使用优惠券：</div>
            <Select
              style={{ width: '100%' }}
              placeholder="选择优惠券（可选）"
              value={selectedCoupon}
              onChange={setSelectedCoupon}
              allowClear
            >
              {coupons.map(c => (
                <Option key={c.id} value={c.id} disabled={state.price < c.min_amount}>
                  {c.name} - 减¥{c.value}（满{c.min_amount}可用）
                </Option>
              ))}
            </Select>
          </div>
        )}

        <div style={{ borderTop: '1px solid #eee', paddingTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text type="secondary">共{state.seats.length}张票，合计：</Text>
              <span style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f', marginLeft: 8 }}>
                ¥{finalPrice}
              </span>
              {selectedCoupon && (
                <Text delete type="secondary" style={{ marginLeft: 8 }}>¥{state.price}</Text>
              )}
            </div>
            <Button 
              type="primary" 
              size="large" 
              onClick={handleSubmitOrder}
              loading={loading}
            >
              提交订单
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default OrderConfirm
