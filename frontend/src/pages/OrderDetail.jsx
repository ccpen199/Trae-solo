import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Truck, Package, Clock, CheckCircle, XCircle } from 'lucide-react'
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

const STATUS_ICONS = {
  pending: Clock,
  paid: Package,
  shipped: Truck,
  completed: CheckCircle,
  cancelled: XCircle,
  refunded: XCircle,
  expired: XCircle
}

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchOrder()
  }, [id])
  
  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/order/${id}`)
      setOrder(response.order)
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePay = async () => {
    try {
      await api.post(`/order/${order.id}/pay`)
      showToast('支付成功')
      fetchOrder()
    } catch (error) {
      showToast(error.response?.data?.error || '支付失败')
    }
  }
  
  const handleCancel = async () => {
    try {
      await api.post(`/order/${order.id}/cancel`)
      showToast('取消成功')
      fetchOrder()
    } catch (error) {
      showToast(error.response?.data?.error || '取消失败')
    }
  }
  
  const handleRetryPurchase = async () => {
    try {
      await api.post('/order/retry-purchase', { order_id: order.id })
      showToast('已加入购物车')
      navigate('/cart')
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败')
    }
  }
  
  const handleShareGroupBuy = () => {
    navigate(`/group-buy/${order.group_buy_id}`)
  }
  
  if (loading) {
    return <div className="loading">加载中...</div>
  }
  
  if (!order) {
    return <div className="empty">订单不存在</div>
  }
  
  const StatusIcon = STATUS_ICONS[order.status] || Clock
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: 80 }}>
      <div className="header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </div>
        <div className="header-title">订单详情</div>
      </div>
      
      <div style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4d4f 100%)',
        padding: 30,
        color: '#fff',
        textAlign: 'center'
      }}>
        <StatusIcon size={48} />
        <h2 style={{ marginTop: 12, fontSize: 20 }}>{STATUS_MAP[order.status]}</h2>
        {order.status === 'pending' && order.is_group_buy && (
          <p style={{ marginTop: 8, opacity: 0.9 }}>
            拼团中，还差 {order.group_buy?.min_members - order.group_buy?.current_members} 人成团
          </p>
        )}
      </div>
      
      <div style={{ backgroundColor: '#fff', marginBottom: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <MapPin size={22} color="#ff4d4f" />
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{order.receiver_name}</span>
              <span style={{ color: '#666' }}>{order.receiver_phone}</span>
            </div>
            <p style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
              {order.receiver_address}
            </p>
          </div>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#fff', marginBottom: 12 }}>
        {order.items?.map((item) => (
          <div
            key={item.id}
            style={{ display: 'flex', padding: 16, gap: 12, borderBottom: '1px solid #f0f0f0' }}
            onClick={() => navigate(`/product/${item.product_id}`)}
          >
            <img
              src={item.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square_hd'}
              alt={item.name}
              style={{ width: 72, height: 72, borderRadius: 6, objectFit: 'cover' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.name}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{item.price?.toFixed(2)}</span>
                <span style={{ color: '#999' }}>x{item.quantity}</span>
              </div>
            </div>
          </div>
        ))}
        
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
            <span>商品金额</span>
            <span>¥{order.total_amount?.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
            <span>运费</span>
            <span>¥0.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f0f0f0', marginTop: 8 }}>
            <span>实付款</span>
            <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 700 }}>¥{order.total_amount?.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#fff', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
          <span style={{ color: '#999' }}>订单编号</span>
          <span>{order.order_no}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
          <span style={{ color: '#999' }}>下单时间</span>
          <span>{order.created_at}</span>
        </div>
        {order.paid_at && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
            <span style={{ color: '#999' }}>支付时间</span>
            <span>{order.paid_at}</span>
          </div>
        )}
      </div>
      
      <div className="cart-bottom">
        <div style={{ flex: 1 }} />
        <div className="order-actions">
          {order.status === 'pending' && (
            <>
              <button className="btn-outline" onClick={handleCancel}>
                取消订单
              </button>
              <button className="btn-primary" onClick={handlePay}>
                立即支付
              </button>
            </>
          )}
          {(order.status === 'cancelled' || order.status === 'expired') && (
            <button className="btn-primary" onClick={handleRetryPurchase}>
              再次购买
            </button>
          )}
          {order.is_group_buy === 1 && order.status === 'pending' && (
            <button className="btn-primary" onClick={handleShareGroupBuy}>
              分享拼团
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
