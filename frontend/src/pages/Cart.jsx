import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useStore from '../store'
import { cartApi } from '../api'
import './Cart.css'

const Cart = () => {
  const navigate = useNavigate()
  const user = useStore(state => state.user)
  const updateCartCount = useStore(state => state.updateCartCount)
  
  const [cart, setCart] = useState({ items: [], total_count: 0, total_amount: 0 })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const res = await cartApi.getList()
      if (res.success) {
        setCart(res.data)
        updateCartCount(res.data.total_count)
      }
    } catch (e) {
      console.error('加载购物车失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async (cartId, quantity) => {
    if (quantity < 1) return
    setUpdating(true)
    try {
      const res = await cartApi.update({ cartId, quantity })
      if (res.success) {
        setCart(res.data)
        updateCartCount(res.data.total_count)
      }
    } catch (e) {
      alert(e.error || '更新失败')
    } finally {
      setUpdating(false)
    }
  }

  const handleSelectChange = async (cartId, selected) => {
    setUpdating(true)
    try {
      const res = await cartApi.update({ cartId, selected })
      if (res.success) {
        setCart(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  const handleSelectAll = async (selected) => {
    setUpdating(true)
    try {
      const res = await cartApi.selectAll({ selected })
      if (res.success) {
        setCart(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  const handleRemove = async (cartId) => {
    if (!confirm('确定删除该商品？')) return
    setUpdating(true)
    try {
      const res = await cartApi.remove(cartId)
      if (res.success) {
        setCart(res.data)
        updateCartCount(res.data.total_count)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } })
      return
    }

    const validItems = cart.items.filter(i => i.selected && i.is_valid)
    if (validItems.length === 0) {
      alert('请选择要购买的商品')
      return
    }

    const cartIds = validItems.map(i => i.id)
    navigate('/checkout', { state: { cartIds } })
  }

  const allSelected = cart.items.length > 0 && cart.items.every(i => i.selected)
  const validSelectedCount = cart.items.filter(i => i.selected && i.is_valid).reduce((sum, i) => sum + i.quantity, 0)

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">购物车</h1>

        {cart.items.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <h3>购物车空空如也</h3>
            <p>去逛逛，发现更多好物</p>
            <Link to="/" className="btn btn-primary">去首页逛逛</Link>
          </div>
        ) : (
          <>
            <div className="cart-header">
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => handleSelectAll(e.target.checked)}
                />
                <span>全选</span>
              </label>
              <span className="header-info">商品信息</span>
              <span className="header-price">单价</span>
              <span className="header-quantity">数量</span>
              <span className="header-subtotal">小计</span>
              <span className="header-action">操作</span>
            </div>

            <div className="cart-list">
              {cart.items.map(item => (
                <div key={item.id} className={`cart-item ${!item.is_valid ? 'invalid' : ''}`}>
                  <label className="item-select">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={e => handleSelectChange(item.id, e.target.checked)}
                      disabled={!item.is_valid}
                    />
                  </label>
                  <Link to={`/product/${item.product_id}`} className="item-image">
                    <span>📦</span>
                  </Link>
                  <div className="item-info">
                    <Link to={`/product/${item.product_id}`} className="item-name">
                      {item.name}
                    </Link>
                    {item.spec && <div className="item-spec">{item.spec}</div>}
                    {item.supplier && <div className="item-supplier">供应商：{item.supplier}</div>}
                    {!item.is_valid && (
                      <div className="item-invalid-tip">
                        {item.is_on_sale === 0 ? '商品已下架' : '库存不足'}
                      </div>
                    )}
                  </div>
                  <div className="item-price">
                    <span className="price-current">¥{item.unit_price.toFixed(2)}</span>
                    {item.unit_price < item.original_price && (
                      <span className="price-original">¥{item.original_price.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="item-quantity">
                    <div className="quantity-selector">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updating || !item.is_valid}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        min="1"
                        disabled={updating || !item.is_valid}
                      />
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updating || !item.is_valid}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="item-subtotal">
                    <span className="subtotal-price">¥{item.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="item-action">
                    <button className="remove-btn" onClick={() => handleRemove(item.id)}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => handleSelectAll(e.target.checked)}
                />
                <span>全选</span>
              </label>
              <div className="footer-summary">
                <div className="summary-text">
                  已选择 <span className="count">{validSelectedCount}</span> 件商品
                </div>
                <div className="summary-total">
                  合计：<span className="total-price">¥{cart.total_amount.toFixed(2)}</span>
                </div>
              </div>
              <button
                className={`btn btn-primary btn-lg checkout-btn ${validSelectedCount === 0 ? 'disabled' : ''}`}
                onClick={handleCheckout}
                disabled={validSelectedCount === 0}
              >
                去结算
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Cart
