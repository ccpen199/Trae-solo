import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../utils/api'
import { showToast } from '../utils/toast'

const STATUS_MAP = {
  pending: '待支付',
  paid: '待发货',
  shipped: '待收货',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
  expired: '已过期'
}

const STATUS_COLOR = {
  pending: '#ff4d4f',
  paid: '#ff9a00',
  shipped: '#1890ff',
  completed: '#52c41a',
  cancelled: '#999',
  refunded: '#999',
  expired: '#999'
}

function OrderList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  
  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待支付' },
    { key: 'paid', label: '待发货' },
    { key: 'shipped', label: '待收货' },
    { key: 'completed', label: '已完成' }
  ]
  
  useEffect(() => {
    fetchOrders()
  }, [activeTab])
  
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = {}
      if (activeTab !== 'all') {
        params.status = activeTab
      }
      const response = await api.get('/order', { params })
      setOrders(response.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePay = async (order) => {
    try {
      await api.post(`/order/${order.id}/pay`)
      showToast('支付成功')
      fetchOrders()
    } catch (error) {
      showToast(error.response?.data?.error || '支付失败')
    }
  }
  
  const handleCancel = async (order) => {
    try {
      await api.post(`/order/${order.id}/cancel`)
      showToast('取消成功')
      fetchOrders()
    } catch (error) {
      showToast(error.response?.data?.error || '取消失败')
    }
  }
  
  const handleRetryPurchase = async (order) => {
    try {
      await api.post('/order/retry-purchase', { order_id: order.id })
      showToast('已加入购物车')
      navigate('/cart')
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败')
    }
  }
  
  const handleAfterSale = async (order) => {
    try {
      await api.post(`/order/${order.id}/after-sale`, { type: 'refund', reason: '申请退款' })
      showToast('售后申请已提交')
      fetchOrders()
    } catch (error) {
      showToast(error.response?.data?.error || '申请失败')
    }
  }
  
  if (loading) {
    return <div className="loading">加载中...</div>
  }
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div className="header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </div>
        <div className="header-title">我的订单</div>
      </div>
      
      <div className="order-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`order-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      
      {orders.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📦</div>
          <p>暂无订单</p>
          <button
            onClick={() => navigate('/')}
            style={{ marginTop: 20, padding: '10px 30px', backgroundColor: '#ff4d4f', color: '#fff', borderRadius: 20 }}
          >
            去购物
          </button>
        </div>
      ) : (
        <div style={{ padding: 12 }}>
          {orders.map((order) => (
            <div
              key={order.id}
              className="order-card"
              onClick={() => navigate(`/order/${order.id}`)}
            >
              <div className="order-header">
                <span className="order-no">订单号: {order.order_no}</span>
                <span className="order-status" style={{ color: STATUS_COLOR[order.status] }}>
                  {STATUS_MAP[order.status]}
                </span>
              </div>
              
              <div className="order-items">
                {order.items?.map((item) => (
                  <div key={item.id} className="order-item">
                    <img
                      src={item.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square_hd'}
                      alt={item.name}
                      className="order-item-img"
                    />
                    <div className="order-item-info">
                      <div className="order-item-name">{item.name}</div>
                      <div className="order-item-price">
                        <span className="price">¥{item.price?.toFixed(2)}</span>
                        <span className="quantity">x{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-footer">
                <div className="order-total">
                  共 {order.items?.reduce((sum, item) => sum + item.quantity, 0)} 件商品，
                  实付: <span className="total-amount">¥{order.total_amount?.toFixed(2)}</span>
                </div>
                <div className="order-actions" onClick={(e) => e.stopPropagation()}>
                  {order.status === 'pending' && (
                    <>
                      <button className="btn-outline" onClick={() => handleCancel(order)}>
                        取消订单
                      </button>
                      <button className="btn-primary" onClick={() => handlePay(order)}>
                        立即支付
                      </button>
                    </>
                  )}
                  {(order.status === 'cancelled' || order.status === 'expired') && (
                    <button className="btn-outline" onClick={() => handleRetryPurchase(order)}>
                      再次购买
                    </button>
                  )}
                  {order.status === 'paid' && (
                    <button className="btn-outline" onClick={() => handleCancel(order)}>
                      取消订单
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button className="btn-primary" onClick={() => {}}>
                      确认收货
                    </button>
                  )}
                  {(order.status === 'paid' || order.status === 'completed') && (
                    <button className="btn-outline" onClick={() => handleAfterSale(order)}>
                      申请售后
                    </button>
                  )}
                  {order.is_group_buy === 1 && order.status === 'pending' && (
                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/group-buy/${order.group_buy_id}`)}
                    >
                      邀请好友
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderList
