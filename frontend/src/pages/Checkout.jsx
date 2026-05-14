import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import useStore from '../store'
import { orderApi, promotionApi } from '../api'
import './Checkout.css'

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useStore(state => state.user)
  
  const [checkoutData, setCheckoutData] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [address, setAddress] = useState('')
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const cartIds = location.state?.cartIds || []

  useEffect(() => {
    if (cartIds.length === 0) {
      navigate('/cart')
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [checkoutRes, couponsRes] = await Promise.all([
        orderApi.checkout({ cartIds }),
        promotionApi.getMyCoupons({ status: 'available' })
      ])
      
      if (checkoutRes.success) {
        setCheckoutData(checkoutRes.data)
        if (checkoutRes.data.selected_coupon) {
          setSelectedCoupon(checkoutRes.data.selected_coupon)
        }
      }
      if (couponsRes.success) {
        setCoupons(couponsRes.data)
      }
    } catch (e) {
      console.error('加载结算数据失败', e)
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = checkoutData?.total_amount || 0
  const discountAmount = selectedCoupon?.discount_value || 0
  const payAmount = Math.max(0, totalAmount - discountAmount)

  const handleSubmit = async () => {
    if (!address) {
      alert('请填写收货地址')
      return
    }

    setSubmitting(true)
    try {
      const res = await orderApi.create({
        cartIds,
        address,
        remark,
        couponId: selectedCoupon?.id
      })
      if (res.success) {
        alert('订单创建成功！')
        navigate(`/orders/${res.data.order_id}`)
      }
    } catch (e) {
      alert(e.error || '创建订单失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  if (!checkoutData) {
    return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>加载失败</div>
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">确认订单</h1>

        <div className="checkout-content">
          <div className="checkout-main">
            <div className="checkout-section">
              <h2 className="section-title">收货地址</h2>
              <div className="address-form">
                <textarea
                  className="form-input"
                  placeholder="请输入详细收货地址（省市区、街道、门牌号等）"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="checkout-section">
              <h2 className="section-title">商品清单</h2>
              <div className="order-items">
                {checkoutData.items.map(item => (
                  <div key={item.cart_id} className="order-item">
                    <Link to={`/product/${item.product_id}`} className="item-image">
                      <span>📦</span>
                    </Link>
                    <div className="item-info">
                      <Link to={`/product/${item.product_id}`} className="item-name">
                        {item.name}
                      </Link>
                      {item.spec && <div className="item-spec">{item.spec}</div>}
                    </div>
                    <div className="item-price">
                      <span>¥{item.unit_price.toFixed(2)}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                    </div>
                    <div className="item-subtotal">¥{item.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {coupons.length > 0 && (
              <div className="checkout-section">
                <h2 className="section-title">优惠券</h2>
                <div className="coupon-list">
                  {coupons.map(coupon => {
                    const canUse = totalAmount >= coupon.min_amount
                    const isSelected = selectedCoupon?.id === coupon.id
                    return (
                      <div
                        key={coupon.id}
                        className={`coupon-item ${!canUse ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => canUse && setSelectedCoupon(isSelected ? null : coupon)}
                      >
                        <div className="coupon-value">
                          <span className="currency">¥</span>
                          <span className="amount">{coupon.discount_value}</span>
                        </div>
                        <div className="coupon-info">
                          <div className="coupon-name">{coupon.name}</div>
                          <div className="coupon-condition">
                            满{coupon.min_amount}元可用
                          </div>
                          <div className="coupon-time">
                            有效期至 {coupon.end_time}
                          </div>
                        </div>
                        {isSelected && <div className="coupon-check">✓</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="checkout-section">
              <h2 className="section-title">订单备注</h2>
              <textarea
                className="form-input"
                placeholder="选填，可填写您的特殊需求"
                value={remark}
                onChange={e => setRemark(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="checkout-sidebar">
            <div className="order-summary">
              <h3>订单摘要</h3>
              <div className="summary-row">
                <span>商品金额</span>
                <span>¥{totalAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="summary-row discount">
                  <span>优惠券优惠</span>
                  <span>-¥{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-total">
                <span>实付金额</span>
                <span className="total-price">¥{payAmount.toFixed(2)}</span>
              </div>
              <button
                className="btn btn-primary btn-block btn-lg submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交订单'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
