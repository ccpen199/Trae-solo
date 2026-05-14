import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Check } from 'lucide-react'
import useStore from '../store/useStore'
import api from '../utils/api'
import { showToast } from '../utils/toast'

function Cart() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [allSelected, setAllSelected] = useState(false)
  const [loading, setLoading] = useState(true)
  const fetchCartCount = useStore((state) => state.fetchCartCount)
  
  useEffect(() => {
    fetchCart()
  }, [])
  
  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await api.get('/cart')
      setItems(response.items || [])
      setTotalAmount(response.total_amount || 0)
      setAllSelected(response.items?.every(item => item.selected === 1) || false)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const toggleSelect = async (item) => {
    try {
      await api.put('/cart/update', { id: item.id, selected: item.selected === 1 ? 0 : 1 })
      fetchCart()
      fetchCartCount()
    } catch (error) {
      showToast('操作失败')
    }
  }
  
  const toggleSelectAll = async () => {
    try {
      await api.post('/cart/select-all', { selected: !allSelected })
      fetchCart()
    } catch (error) {
      showToast('操作失败')
    }
  }
  
  const updateQuantity = async (item, delta) => {
    const newQuantity = Math.max(1, item.quantity + delta)
    if (newQuantity === item.quantity) return
    
    try {
      await api.put('/cart/update', { id: item.id, quantity: newQuantity })
      fetchCart()
      fetchCartCount()
    } catch (error) {
      showToast('操作失败')
    }
  }
  
  const removeItem = async (item) => {
    try {
      await api.delete('/cart/remove', { data: { ids: [item.id] } })
      fetchCart()
      fetchCartCount()
    } catch (error) {
      showToast('删除失败')
    }
  }
  
  const removeSelected = async () => {
    const selectedIds = items.filter(item => item.selected === 1).map(item => item.id)
    if (selectedIds.length === 0) {
      showToast('请选择要删除的商品')
      return
    }
    
    try {
      await api.delete('/cart/remove', { data: { ids: selectedIds } })
      fetchCart()
      fetchCartCount()
    } catch (error) {
      showToast('删除失败')
    }
  }
  
  const goCheckout = () => {
    const selectedItems = items.filter(item => item.selected === 1)
    if (selectedItems.length === 0) {
      showToast('请选择要购买的商品')
      return
    }
    
    localStorage.setItem('checkoutData', JSON.stringify({
      items: selectedItems,
      cart_ids: selectedItems.map(item => item.id)
    }))
    navigate('/checkout')
  }
  
  if (loading) {
    return <div className="loading">加载中...</div>
  }
  
  return (
    <div className="cart-page">
      <div className="header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </div>
        <div className="header-title">购物车</div>
        <div className="back-btn" onClick={removeSelected}>
          <Trash2 size={20} />
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🛒</div>
          <p>购物车是空的</p>
          <button
            onClick={() => navigate('/')}
            style={{ marginTop: 20, padding: '10px 30px', backgroundColor: '#ff4d4f', color: '#fff', borderRadius: 20 }}
          >
            去逛逛
          </button>
        </div>
      ) : (
        <>
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <div
                className={`cart-checkbox ${item.selected === 1 ? 'checked' : ''}`}
                onClick={() => toggleSelect(item)}
              >
                {item.selected === 1 && <Check size={14} />}
              </div>
              <img
                src={item.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square_hd'}
                alt={item.name}
                className="cart-item-img"
                onClick={() => navigate(`/product/${item.product_id}`)}
              />
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">¥{item.price?.toFixed(2)}</div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item, -1)}
                    >
                      -
                    </button>
                    <span className="quantity-input">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item, 1)}
                    >
                      +
                    </button>
                  </div>
                  <button className="delete-btn" onClick={() => removeItem(item)}>
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
      
      <div className="cart-bottom">
        <div className="cart-bottom-left" onClick={toggleSelectAll}>
          <div className={`cart-checkbox ${allSelected ? 'checked' : ''}`}>
            {allSelected && <Check size={14} />}
          </div>
          <span>全选</span>
        </div>
        <div style={{ flex: 1, textAlign: 'right', marginRight: 12 }}>
          <div className="cart-total">
            合计: <span className="cart-total-price">¥{totalAmount?.toFixed(2)}</span>
          </div>
        </div>
        <button className="btn-checkout" onClick={goCheckout}>
          结算({items.filter(i => i.selected === 1).length})
        </button>
      </div>
    </div>
  )
}

export default Cart
