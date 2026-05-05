import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { cartApi } from '../api'
import { useUserStore, useCartStore } from '../store'

function CartPage() {
  const navigate = useNavigate()
  const { user, token } = useUserStore()
  const { cartItems, totalCount, totalAmount, setCart, updateItem, removeItem } = useCartStore()
  
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [selectAll, setSelectAll] = useState(false)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  useEffect(() => {
    fetchCart()
  }, [])
  
  const fetchCart = async () => {
    setLoading(true)
    try {
      const result = await cartApi.getList()
      if (result.success) {
        setCart(result.data.list, result.data.total_count, result.data.total_amount)
        const allSelected = result.data.list.length > 0 && result.data.list.every(item => item.selected)
        setSelectAll(allSelected)
      }
    } catch (error) {
      console.error('获取购物车失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleQuantityChange = async (cartId, quantity) => {
    if (quantity < 1) return
    
    try {
      const result = await cartApi.update({ cart_id: cartId, quantity })
      if (result.success) {
        updateItem(cartId, quantity)
        await fetchCart()
      } else {
        showToast(result.message || '更新失败')
      }
    } catch (error) {
      showToast(error.message || '更新失败')
    }
  }
  
  const handleSelect = async (cartId, selected) => {
    try {
      const result = await cartApi.update({ cart_id: cartId, selected })
      if (result.success) {
        updateItem(cartId, undefined, selected)
        await fetchCart()
      }
    } catch (error) {
      showToast(error.message || '更新失败')
    }
  }
  
  const handleSelectAll = async (selected) => {
    try {
      for (const item of cartItems) {
        await cartApi.update({ cart_id: item.id, selected })
      }
      await fetchCart()
    } catch (error) {
      showToast(error.message || '更新失败')
    }
  }
  
  const handleRemove = async (cartId) => {
    try {
      const result = await cartApi.remove({ cart_id: cartId })
      if (result.success) {
        removeItem(cartId)
        showToast('已移除')
        await fetchCart()
      }
    } catch (error) {
      showToast(error.message || '移除失败')
    }
  }
  
  const handleCheckout = () => {
    if (!token) {
      navigate('/login')
      return
    }
    
    if (totalCount === 0) {
      showToast('请选择商品')
      return
    }
    
    navigate('/settlement')
  }
  
  if (loading) {
    return (
      <div className="page-container">
        <Header showSearch={true} showLocation={true} />
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="page-container">
      <Header showSearch={true} showLocation={true} />
      
      {cartItems.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '100px' }}>
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-text">购物车空空如也</div>
          <button
            className="btn btn-primary mt-md"
            onClick={() => navigate('/')}
          >
            去逛逛
          </button>
        </div>
      ) : (
        <div style={{ paddingBottom: '120px' }}>
          {cartItems.map(item => (
            <div key={item.id} className="card">
              <div className="flex-row" style={{ gap: '12px' }}>
                <div
                  className={`checkbox ${item.selected ? 'checked' : ''}`}
                  onClick={() => handleSelect(item.id, !item.selected)}
                >
                  {item.selected && '✓'}
                </div>
                
                <div
                  style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-gray)' }}
                  onClick={() => navigate(`/product/${item.product_id}`)}
                >
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <div
                    className="product-name"
                    style={{ marginBottom: '8px' }}
                    onClick={() => navigate(`/product/${item.product_id}`)}
                  >
                    {item.name}
                  </div>
                  
                  <div className="flex-between">
                    <div className="product-price">
                      <span className="product-price-current">¥{item.show_price}</span>
                      <span className="product-unit">/{item.unit}</span>
                    </div>
                    
                    <div className="stepper">
                      <button
                        className="stepper-btn"
                        disabled={item.quantity <= 1}
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="stepper-value">{item.quantity}</span>
                      <button
                        className="stepper-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  className="text-muted"
                  onClick={() => handleRemove(item.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {cartItems.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '60px',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-primary)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
        }}>
          <div
            className={`checkbox ${selectAll ? 'checked' : ''}`}
            onClick={() => handleSelectAll(!selectAll)}
            style={{ marginRight: '8px' }}
          >
            {selectAll && '✓'}
          </div>
          <span style={{ marginRight: 'auto' }}>全选</span>
          
          <div style={{ marginRight: '12px' }}>
            <span className="text-muted">合计:</span>
            <span className="product-price-current" style={{ fontSize: '18px' }}>¥{totalAmount}</span>
          </div>
          
          <button
            className={`btn btn-primary ${totalCount === 0 ? '' : 'btn-round'}`}
            style={{ padding: '10px 24px' }}
            onClick={handleCheckout}
            disabled={totalCount === 0}
          >
            结算({totalCount})
          </button>
        </div>
      )}
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default CartPage
