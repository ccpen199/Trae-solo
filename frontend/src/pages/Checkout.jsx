import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, ChevronRight } from 'lucide-react'
import useStore from '../store/useStore'
import api from '../utils/api'
import { showToast } from '../utils/toast'

function Checkout() {
  const navigate = useNavigate()
  const user = useStore((state) => state.user)
  const [checkoutData, setCheckoutData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isGroupBuy, setIsGroupBuy] = useState(false)
  const [groupBuyId, setGroupBuyId] = useState(null)
  
  useEffect(() => {
    const data = localStorage.getItem('checkoutData')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        setCheckoutData(parsed)
      } catch (e) {
        navigate('/cart')
      }
    } else {
      navigate('/cart')
    }
    
    const gbId = localStorage.getItem('joinGroupBuyId')
    if (gbId) {
      setIsGroupBuy(true)
      setGroupBuyId(parseInt(gbId))
      localStorage.removeItem('joinGroupBuyId')
    }
  }, [])
  
  const getTotalAmount = () => {
    if (!checkoutData?.items) return 0
    return checkoutData.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }
  
  const submitOrder = async () => {
    if (!checkoutData) return
    
    setLoading(true)
    
    try {
      const address = {
        name: user?.nickname || '用户',
        phone: user?.phone || '13800000000',
        address: '测试地址（实际项目中需要地址管理功能）'
      }
      
      const orderData = {
        address,
        is_group_buy: isGroupBuy,
        group_buy_id: groupBuyId
      }
      
      if (checkoutData.cart_ids) {
        orderData.cart_ids = checkoutData.cart_ids
      } else if (checkoutData.items?.length === 1) {
        const item = checkoutData.items[0]
        orderData.product_id = item.product_id
        orderData.sku_id = item.sku_id
        orderData.quantity = item.quantity
      }
      
      const response = await api.post('/order/create', orderData)
      
      if (response.order?.id) {
        await api.post(`/order/${response.order.id}/pay`)
        localStorage.removeItem('checkoutData')
        showToast('下单成功')
        navigate(`/order/${response.order.id}`, { replace: true })
      }
    } catch (error) {
      showToast(error.response?.data?.error || '下单失败')
    } finally {
      setLoading(false)
    }
  }
  
  if (!checkoutData) {
    return <div className="loading">加载中...</div>
  }
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: 80 }}>
      <div className="header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </div>
        <div className="header-title">确认订单</div>
      </div>
      
      <div className="checkout-address">
        <div className="checkout-address-row">
          <MapPin size={22} color="#ff4d4f" />
          <div style={{ flex: 1, marginLeft: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{user?.nickname || '用户'}</span>
              <span style={{ color: '#666' }}>{user?.phone || '13800000000'}</span>
            </div>
            <p style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
              测试地址（实际项目中需要地址管理功能）
            </p>
          </div>
          <ChevronRight size={20} color="#999" />
        </div>
      </div>
      
      <div className="checkout-items">
        {checkoutData.items?.map((item, idx) => (
          <div key={idx} className="checkout-item">
            <img
              src={item.images?.[0] || item.product?.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square_hd'}
              alt={item.name || item.product?.name}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.name || item.product?.name}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                  ¥{item.price?.toFixed(2)}
                </span>
                <span style={{ color: '#999' }}>x{item.quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {isGroupBuy && (
        <div style={{ backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#ff4d4f', fontWeight: 600 }}>🎁 拼团模式</span>
          </div>
        </div>
      )}
      
      <div className="checkout-summary">
        <div className="checkout-summary-row">
          <span>商品金额</span>
          <span>¥{getTotalAmount().toFixed(2)}</span>
        </div>
        <div className="checkout-summary-row">
          <span>运费</span>
          <span>¥0.00</span>
        </div>
        <div className="checkout-summary-row">
          <span>优惠</span>
          <span style={{ color: '#ff4d4f' }}>-¥0.00</span>
        </div>
        <div className="checkout-summary-row total">
          <span>实付款</span>
          <span style={{ color: '#ff4d4f' }}>¥{getTotalAmount().toFixed(2)}</span>
        </div>
      </div>
      
      <div className="checkout-bottom">
        <div>
          <span style={{ fontSize: 14, color: '#666' }}>实付: </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>
            ¥{getTotalAmount().toFixed(2)}
          </span>
        </div>
        <button
          className="btn-submit-order"
          onClick={submitOrder}
          disabled={loading}
        >
          {loading ? '提交中...' : '提交订单'}
        </button>
      </div>
    </div>
  )
}

export default Checkout
