import React, { useState, useEffect } from 'react'

function CartPage({ currentUser }) {
  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    if (!currentUser) return

    fetch(`/api/cart?user_id=${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        setCartItems(data.data || [])
      })
  }, [currentUser])

  const handleRemove = (id) => {
    fetch(`/api/cart/${id}`, {
      method: 'DELETE'
    }).then(() => {
      setCartItems(cartItems.filter(item => item.id !== id))
    })
  }

  const handleCheckout = () => {
    if (!currentUser) return
    
    Promise.all(
      cartItems.map(item => 
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            book_id: item.book_id
          })
        })
      )
    ).then(() => {
      alert('下单成功！')
      setCartItems([])
    })
  }

  if (!currentUser) return <div className="container"><div style={{ padding: '40px 0' }}>加载中...</div></div>

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="container">
      <div className="book-list">
        <h1 className="page-title">购物袋</h1>
        
        {cartItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <p className="empty-state-text">购物袋是空的，快去挑几本好书吧</p>
          </div>
        ) : (
          <div className="tab-content" style={{ marginTop: '20px' }}>
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.cover} alt="" className="cart-book-cover" />
                <div className="cart-book-info">
                  <h3 className="cart-book-title">{item.title}</h3>
                  <p className="cart-book-author">{item.author}</p>
                  <p className="cart-book-price">¥{item.price.toFixed(2)}</p>
                </div>
                <button className="cart-remove-btn" onClick={() => handleRemove(item.id)}>
                  删除
                </button>
              </div>
            ))}
            
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', color: '#666' }}>
                  共 {cartItems.length} 件商品
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                    合计: ¥{total.toFixed(2)}
                  </span>
                  <button className="btn btn-primary" onClick={handleCheckout}>
                    结算
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage
