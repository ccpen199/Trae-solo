import React from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store'
import { cartApi } from '../api'
import './ProductCard.css'

const ProductCard = ({ product, showAddCart = true }) => {
  const navigate = useNavigate()
  const user = useStore(state => state.user)
  const updateCartCount = useStore(state => state.updateCartCount)

  const handleClick = () => {
    navigate(`/product/${product.id}`)
  }

  const handleAddCart = async (e) => {
    e.stopPropagation()
    if (!product.can_buy) return

    try {
      const res = await cartApi.add({
        productId: product.id,
        quantity: 1
      })
      if (res.success) {
        updateCartCount(res.data.cart_count)
        alert('已加入购物车')
      }
    } catch (e) {
      alert(e.error || '加入购物车失败')
    }
  }

  const getPrice = () => {
    return product.display_price || product.original_price
  }

  const getTags = () => {
    const tags = []
    if (product.is_hot) tags.push({ text: '热卖', class: 'tag-hot' })
    if (product.is_new) tags.push({ text: '新品', class: 'tag-new' })
    if (product.price_type === 'member') tags.push({ text: '会员价', class: 'tag-member' })
    if (product.price_type === 'activity') tags.push({ text: '活动价', class: 'tag-activity' })
    return tags
  }

  const tags = getTags()
  const price = getPrice()
  const hasDiscount = price < product.original_price

  return (
    <div className="product-card" onClick={handleClick}>
      <div className="product-card-img" style={{ position: 'relative' }}>
        <span>📦</span>
        {!product.can_buy && (
          <div className="product-card-sold-out">
            已售罄
          </div>
        )}
      </div>
      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        {product.subtitle && (
          <div className="product-card-subtitle">{product.subtitle}</div>
        )}
        <div className="product-card-price">
          <span className="product-card-price-current">¥{price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="product-card-price-original">¥{product.original_price.toFixed(2)}</span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="product-card-tags">
            {tags.map((tag, i) => (
              <span key={i} className={`tag ${tag.class}`}>{tag.text}</span>
            ))}
          </div>
        )}
        {product.stock_warning !== null && product.stock_warning !== undefined && (
          <div className="product-card-stock stock-warning">
            仅剩 {product.stock_warning} 件
          </div>
        )}
        {showAddCart && product.can_buy && (
          <button className="add-cart-btn" onClick={handleAddCart}>
            加入购物车
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductCard
