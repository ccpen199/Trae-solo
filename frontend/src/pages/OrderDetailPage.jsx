import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { orderApi } from '../api'

function OrderDetailPage() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showAfterSaleModal, setShowAfterSaleModal] = useState(false)
  const [afterSaleType, setAfterSaleType] = useState('refund')
  const [afterSaleReason, setAfterSaleReason] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const result = await orderApi.getDetail(orderId)
      if (result.success) {
        setOrder(result.data)
      } else {
        showToast(result.message || '获取订单详情失败')
      }
    } catch (error) {
      showToast(error.message || '获取订单详情失败')
    } finally {
      setLoading(false)
    }
  }, [orderId, showToast])
  
  useEffect(() => {
    fetchOrderDetail()
  }, [fetchOrderDetail])
  
  const handlePay = async () => {
    if (!order) return
    try {
      const result = await orderApi.pay({ order_id: order.id })
      if (result.success) {
        showToast('支付成功')
        fetchOrderDetail()
      } else {
        showToast(result.message || '支付失败')
      }
    } catch (error) {
      showToast(error.message || '支付失败')
    }
  }
  
  const handleCancel = async () => {
    if (!order) return
    try {
      const result = await orderApi.cancel({ order_id: order.id })
      if (result.success) {
        showToast('订单已取消')
        fetchOrderDetail()
      } else {
        showToast(result.message || '取消失败')
      }
    } catch (error) {
      showToast(error.message || '取消失败')
    }
  }
  
  const handleConfirm = async () => {
    if (!order) return
    try {
      const result = await orderApi.confirmReceipt({ order_id: order.id })
      if (result.success) {
        showToast('已确认收货')
        fetchOrderDetail()
      } else {
        showToast(result.message || '确认失败')
      }
    } catch (error) {
      showToast(error.message || '确认失败')
    }
  }
  
  const handleApplyAfterSale = async () => {
    if (!afterSaleReason.trim()) {
      showToast('请填写售后原因')
      return
    }
    
    try {
      const result = await orderApi.applyAfterSale({
        order_id: order.id,
        order_item_id: selectedItem?.id,
        type: afterSaleType,
        reason: afterSaleReason
      })
      
      if (result.success) {
        showToast('售后申请已提交')
        setShowAfterSaleModal(false)
      } else {
        showToast(result.message || '提交失败')
      }
    } catch (error) {
      showToast(error.message || '提交失败')
    }
  }
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'order-status-pending'
      case 'paid': return 'order-status-paid'
      case 'shipped': return 'order-status-shipped'
      case 'delivered': return 'order-status-shipped'
      case 'completed': return 'order-status-completed'
      case 'cancelled': return 'order-status-cancelled'
      default: return ''
    }
  }
  
  const renderOrderActions = () => {
    if (!order) return null
    switch (order.status) {
      case 'pending':
        return (
          <div className="settlement-footer">
            <div style={{ flex: 1 }}></div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-outline btn-lg"
                onClick={handleCancel}
              >
                取消订单
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handlePay}
              >
                去支付
              </button>
            </div>
          </div>
        )
      case 'paid':
        return (
          <div className="settlement-footer">
            <div style={{ flex: 1 }}></div>
            <span className="order-status-badge order-status-paid" style={{ fontSize: '16px' }}>
              待发货
            </span>
          </div>
        )
      case 'shipped':
      case 'delivered':
        return (
          <div className="settlement-footer">
            <div style={{ flex: 1 }}></div>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleConfirm}
            >
              确认收货
            </button>
          </div>
        )
      case 'completed':
        return (
          <div className="settlement-footer">
            <div style={{ flex: 1 }}></div>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => {
                setSelectedItem(null)
                setShowAfterSaleModal(true)
              }}
            >
              申请售后
            </button>
          </div>
        )
      default:
        return null
    }
  }
  
  if (loading) {
    return (
      <div className="page-container" style={{ paddingBottom: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
          <div className="flex-between">
            <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px' }}>
              ←
            </button>
            <span style={{ color: 'white', fontWeight: 500 }}>订单详情</span>
            <div style={{ width: '20px' }}></div>
          </div>
        </div>
        <div className="loading" style={{ marginTop: '100px' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }
  
  if (!order) {
    return (
      <div className="page-container" style={{ paddingBottom: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
          <div className="flex-between">
            <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px' }}>
              ←
            </button>
            <span style={{ color: 'white', fontWeight: 500 }}>订单详情</span>
            <div style={{ width: '20px' }}></div>
          </div>
        </div>
        <div className="empty-state" style={{ marginTop: '100px' }}>
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">订单不存在</div>
          <button
            className="btn btn-primary mt-md"
            onClick={() => navigate('/orders')}
          >
            返回订单列表
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
        <div className="flex-between">
          <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px' }}>
            ←
          </button>
          <span style={{ color: 'white', fontWeight: 500 }}>订单详情</span>
          <div style={{ width: '20px' }}></div>
        </div>
      </div>
      
      <div style={{ paddingBottom: '80px' }}>
        <div className="card">
          <div className="flex-between">
            <span className={`order-status-badge ${getStatusClass(order.status)}`} style={{ fontSize: '18px' }}>
              {order.status_text}
            </span>
            {order.delivery_type === 'pickup' && (
              <span className="tag tag-new">门店自提</span>
            )}
          </div>
          
          {order.status === 'shipped' || order.status === 'delivered' ? (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🚚</span>
                <span className="font-bold">配送中</span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                骑手正在配送中，预计30分钟内送达
              </div>
            </div>
          ) : null}
        </div>
        
        {order.address && (
          <div className="card">
            <div className="card-title">
              <div className="card-title-text">
                <span>📍</span>
                <span>{order.delivery_type === 'pickup' ? '自提地址' : '收货地址'}</span>
              </div>
            </div>
            <div>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span className="font-bold">{order.address.name}</span>
                <span>{order.address.phone}</span>
              </div>
              <div className="text-muted">
                {order.address.province} {order.address.city} {order.address.district} {order.address.detail}
              </div>
            </div>
          </div>
        )}
        
        <div className="card">
          <div className="card-title">
            <div className="card-title-text">
              <span>🛒</span>
              <span>商品清单</span>
            </div>
          </div>
          
          {order.items && order.items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex-row"
              style={{ gap: '12px', padding: '12px 0', borderBottom: idx < order.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}
            >
              <img
                src={item.product_image}
                alt={item.product_name}
                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div className="flex-1" style={{ minWidth: 0 }}>
                <div className="product-name" style={{ marginBottom: '8px', fontSize: '14px' }}>
                  {item.product_name}
                </div>
                <div className="flex-between" style={{ alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ color: 'var(--primary-color)', fontSize: '16px', fontWeight: 600 }}>
                      ¥{item.price}
                    </span>
                    <span className="text-muted" style={{ fontSize: '12px', marginLeft: '4px' }}>
                      /{item.unit}
                    </span>
                  </div>
                  <span className="text-muted">x{item.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="card">
          <div className="card-title">
            <div className="card-title-text">
              <span>📝</span>
              <span>订单信息</span>
            </div>
          </div>
          
          <div style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-between">
              <span className="text-muted">订单编号</span>
              <span>{order.order_no}</span>
            </div>
            <div className="flex-between">
              <span className="text-muted">创建时间</span>
              <span>{order.created_at?.slice(0, 19).replace('T', ' ')}</span>
            </div>
            <div className="flex-between">
              <span className="text-muted">支付方式</span>
              <span>{order.payment_method === 'alipay' ? '支付宝' : order.payment_method === 'wechat' ? '微信支付' : '在线支付'}</span>
            </div>
            {order.paid_at && (
              <div className="flex-between">
                <span className="text-muted">支付时间</span>
                <span>{order.paid_at?.slice(0, 19).replace('T', ' ')}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="card">
          <div className="flex-between" style={{ padding: '8px 0' }}>
            <span className="text-muted">商品金额</span>
            <span>¥{order.total_amount}</span>
          </div>
          <div className="flex-between" style={{ padding: '8px 0' }}>
            <span className="text-muted">配送费</span>
            <span className="text-success">免费</span>
          </div>
          <div className="divider"></div>
          <div className="flex-between">
            <span className="font-bold">实付金额</span>
            <span className="product-price-current" style={{ fontSize: '20px' }}>¥{order.pay_amount}</span>
          </div>
        </div>
      </div>
      
      {renderOrderActions()}
      
      {showAfterSaleModal && (
        <div className="modal-overlay" onClick={() => setShowAfterSaleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">申请售后</span>
              <button onClick={() => setShowAfterSaleModal(false)} style={{ fontSize: '24px', color: 'var(--text-muted)' }}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">售后类型</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className={`btn ${afterSaleType === 'refund' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAfterSaleType('refund')}
                  >
                    退款
                  </button>
                  <button
                    className={`btn ${afterSaleType === 'exchange' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAfterSaleType('exchange')}
                  >
                    换货
                  </button>
                </div>
              </div>
              
              <div className="input-group">
                <label className="input-label">售后原因</label>
                <textarea
                  className="input-field"
                  placeholder="请填写售后原因..."
                  rows={4}
                  value={afterSaleReason}
                  onChange={(e) => setAfterSaleReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={handleApplyAfterSale}
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default OrderDetailPage
