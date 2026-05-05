import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { orderApi } from '../api'

const statusTabMap = {
  all: { label: '全部', value: 'all' },
  pending: { label: '待支付', value: 'pending' },
  paid: { label: '待发货', value: 'paid' },
  shipped: { label: '配送中', value: 'shipped' },
  completed: { label: '已完成', value: 'completed' }
}

function OrderListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'all'
  
  const [activeTab, setActiveTab] = useState(initialStatus)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await orderApi.getList({
        status: activeTab === 'all' ? undefined : activeTab
      })
      if (result.success) {
        setOrders(result.data.list || [])
      } else {
        showToast(result.message || '获取订单列表失败')
      }
    } catch (error) {
      showToast(error.message || '获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }, [activeTab, showToast])
  
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])
  
  const handlePay = async (order) => {
    try {
      const result = await orderApi.pay({ order_id: order.id })
      if (result.success) {
        showToast('支付成功')
        fetchOrders()
      } else {
        showToast(result.message || '支付失败')
      }
    } catch (error) {
      showToast(error.message || '支付失败')
    }
  }
  
  const handleCancel = async (order) => {
    try {
      const result = await orderApi.cancel({ order_id: order.id })
      if (result.success) {
        showToast('订单已取消')
        fetchOrders()
      } else {
        showToast(result.message || '取消失败')
      }
    } catch (error) {
      showToast(error.message || '取消失败')
    }
  }
  
  const handleConfirm = async (order) => {
    try {
      const result = await orderApi.confirmReceipt({ order_id: order.id })
      if (result.success) {
        showToast('已确认收货')
        fetchOrders()
      } else {
        showToast(result.message || '确认失败')
      }
    } catch (error) {
      showToast(error.message || '确认失败')
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
  
  const renderOrderActions = (order) => {
    switch (order.status) {
      case 'pending':
        return (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => handleCancel(order)}
            >
              取消订单
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handlePay(order)}
            >
              去支付
            </button>
          </div>
        )
      case 'paid':
        return (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <span className="order-status-badge order-status-paid">待发货</span>
          </div>
        )
      case 'shipped':
      case 'delivered':
        return (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleConfirm(order)}
            >
              确认收货
            </button>
          </div>
        )
      case 'completed':
        return (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate(`/order/${order.id}/after-sale`)}
            >
              申请售后
            </button>
          </div>
        )
      default:
        return null
    }
  }
  
  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
        <div className="flex-between">
          <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px' }}>
            ←
          </button>
          <span style={{ color: 'white', fontWeight: 500 }}>我的订单</span>
          <div style={{ width: '20px' }}></div>
        </div>
      </div>
      
      <div className="tab-bar">
        {Object.values(statusTabMap).map(tab => (
          <div
            key={tab.value}
            className={`tab-item ${activeTab === tab.value ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      
      <div style={{ padding: '12px' }}>
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">暂无订单</div>
            <button
              className="btn btn-primary mt-md"
              onClick={() => navigate('/')}
            >
              去逛逛
            </button>
          </div>
        ) : (
          orders.map(order => (
            <div
              key={order.id}
              className="card"
              onClick={() => navigate(`/order/${order.id}`)}
            >
              <div className="flex-between" style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-muted" style={{ fontSize: '12px' }}>订单号: {order.order_no}</span>
                <span className={`order-status-badge ${getStatusClass(order.status)}`}>
                  {order.status_text}
                </span>
              </div>
              
              {order.items && order.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex-row"
                  style={{ gap: '12px', padding: '8px 0' }}
                >
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="product-name" style={{ marginBottom: '4px' }}>
                      {item.product_name}
                    </div>
                    <div className="flex-between">
                      <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>
                        ¥{item.price}
                      </span>
                      <span className="text-muted">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <div className="flex-between">
                  <span className="text-muted">共{order.items?.length || 0}件商品</span>
                  <span>
                    实付: <span style={{ color: 'var(--primary-color)', fontSize: '16px', fontWeight: 600 }}>
                      ¥{order.pay_amount}
                    </span>
                  </span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  {renderOrderActions(order)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default OrderListPage
