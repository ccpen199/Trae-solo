import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderApi, cartApi } from '../api'
import { useCartStore } from '../store'

function SettlementPage() {
  const navigate = useNavigate()
  const { cartItems, totalAmount, setCart, clearCart } = useCartStore()
  
  const [checkoutInfo, setCheckoutInfo] = useState(null)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [deliveryType, setDeliveryType] = useState('delivery')
  const [selectedStore, setSelectedStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  useEffect(() => {
    fetchCheckoutInfo()
  }, [])
  
  const fetchCheckoutInfo = async () => {
    setLoading(true)
    try {
      const result = await orderApi.getCheckoutInfo()
      if (result.success) {
        setCheckoutInfo(result.data)
        setSelectedAddress(result.data.default_address)
        if (result.data.stores && result.data.stores.length > 0) {
          setSelectedStore(result.data.stores[0])
        }
      } else {
        showToast(result.message || '获取结算信息失败')
        setTimeout(() => navigate('/cart'), 1000)
      }
    } catch (error) {
      showToast(error.message || '获取结算信息失败')
      setTimeout(() => navigate('/cart'), 1000)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async () => {
    if (deliveryType === 'delivery' && !selectedAddress) {
      showToast('请选择配送地址')
      return
    }
    if (deliveryType === 'pickup' && !selectedStore) {
      showToast('请选择门店')
      return
    }
    
    setSubmitting(true)
    try {
      const result = await orderApi.create({
        address_id: selectedAddress?.id || null,
        store_id: selectedStore?.id || null,
        delivery_type: deliveryType
      })
      
      if (result.success) {
        showToast('订单创建成功')
        clearCart()
        setTimeout(() => navigate(`/orders`), 1000)
      } else {
        showToast(result.message || '创建订单失败')
      }
    } catch (error) {
      showToast(error.message || '创建订单失败')
    } finally {
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="settlement-page">
        <div className="loading" style={{ marginTop: '100px' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }
  
  if (!checkoutInfo || checkoutInfo.items.length === 0) {
    return (
      <div className="settlement-page">
        <div className="empty-state" style={{ marginTop: '100px' }}>
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-text">购物车为空</div>
          <button
            className="btn btn-primary mt-md"
            onClick={() => navigate('/')}
          >
            去逛逛
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="settlement-page">
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
        <div className="flex-between">
          <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px' }}>
            ←
          </button>
          <span style={{ color: 'white', fontWeight: 500 }}>确认订单</span>
          <div style={{ width: '20px' }}></div>
        </div>
      </div>
      
      <div className="settlement-content">
        <div className="card">
          <div className="card-title">
            <div className="card-title-text">
              <span>📍</span>
              <span>{deliveryType === 'delivery' ? '配送地址' : '自提门店'}</span>
            </div>
          </div>
          
          <div className="tab-bar" style={{ marginBottom: '12px' }}>
            <div
              className={`tab-item ${deliveryType === 'delivery' ? 'active' : ''}`}
              onClick={() => setDeliveryType('delivery')}
            >
              半小时达配送
            </div>
            <div
              className={`tab-item ${deliveryType === 'pickup' ? 'active' : ''}`}
              onClick={() => setDeliveryType('pickup')}
            >
              门店自提
            </div>
          </div>
          
          {deliveryType === 'delivery' ? (
            checkoutInfo.addresses && checkoutInfo.addresses.length > 0 ? (
              checkoutInfo.addresses.map(addr => (
                <div
                  key={addr.id}
                  className="address-card"
                  style={{
                    border: selectedAddress?.id === addr.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)'
                  }}
                  onClick={() => setSelectedAddress(addr)}
                >
                  <div className="address-header">
                    <div>
                      <span className="address-name">{addr.name}</span>
                      <span className="text-muted" style={{ marginLeft: '12px' }}>{addr.phone}</span>
                      {addr.is_default && <span className="address-default-tag">默认</span>}
                    </div>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: selectedAddress?.id === addr.id ? '6px solid var(--primary-color)' : '2px solid var(--border-color)'
                    }}></div>
                  </div>
                  <div className="address-detail">
                    {addr.province} {addr.city} {addr.district} {addr.detail}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted p-lg" onClick={() => navigate('/addresses/add')}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>+</div>
                <div>添加收货地址</div>
              </div>
            )
          ) : (
            checkoutInfo.stores && checkoutInfo.stores.length > 0 ? (
              checkoutInfo.stores.map(store => (
                <div
                  key={store.id}
                  className="address-card"
                  style={{
                    border: selectedStore?.id === store.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)'
                  }}
                  onClick={() => setSelectedStore(store)}
                >
                  <div className="flex-between">
                    <div>
                      <div className="address-name">{store.name}</div>
                      <div className="address-detail">{store.address}</div>
                    </div>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: selectedStore?.id === store.id ? '6px solid var(--primary-color)' : '2px solid var(--border-color)'
                    }}></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted p-lg">
                暂无可选自提门店
              </div>
            )
          )}
        </div>
        
        <div className="card">
          <div className="card-title">
            <div className="card-title-text">
              <span>🛒</span>
              <span>商品清单</span>
            </div>
          </div>
          
          {checkoutInfo.items.map(item => (
            <div key={item.id} className="flex-row" style={{ gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <img
                src={item.image}
                alt={item.name}
                style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div className="flex-1" style={{ minWidth: 0 }}>
                <div className="product-name" style={{ marginBottom: '4px' }}>{item.name}</div>
                <div className="flex-between">
                  <div className="product-price">
                    <span className="product-price-current">¥{item.show_price}</span>
                    <span className="product-unit">/{item.unit}</span>
                  </div>
                  <span className="text-muted">x{item.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="card">
          <div className="flex-between" style={{ padding: '8px 0' }}>
            <span className="text-muted">商品金额</span>
            <span>¥{checkoutInfo.total_amount}</span>
          </div>
          <div className="flex-between" style={{ padding: '8px 0' }}>
            <span className="text-muted">配送费</span>
            <span className="text-success">免费</span>
          </div>
          <div className="divider"></div>
          <div className="flex-between">
            <span className="font-bold">实付金额</span>
            <span className="product-price-current" style={{ fontSize: '20px' }}>¥{checkoutInfo.total_amount}</span>
          </div>
        </div>
      </div>
      
      <div className="settlement-footer">
        <div>
          <span className="text-muted">合计: </span>
          <span className="settlement-total-price">¥{checkoutInfo.total_amount}</span>
        </div>
        <button
          className="btn btn-primary btn-lg btn-round"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '去支付'}
        </button>
      </div>
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default SettlementPage
