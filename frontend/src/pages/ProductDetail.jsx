import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useStore from '../store'
import { productApi, cartApi } from '../api'
import './ProductDetail.css'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useStore(state => state.user)
  const updateCartCount = useStore(state => state.updateCartCount)
  
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    try {
      const res = await productApi.getDetail(id)
      if (res.success) {
        setProduct(res.data)
      }
    } catch (e) {
      console.error('加载商品详情失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCart = async () => {
    if (!product.can_buy) {
      alert('该商品暂时无法购买')
      return
    }

    setAdding(true)
    try {
      const res = await cartApi.add({
        productId: product.id,
        quantity
      })
      if (res.success) {
        updateCartCount(res.data.cart_count)
        alert('已加入购物车')
      }
    } catch (e) {
      alert(e.error || '加入购物车失败')
    } finally {
      setAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/product/${id}` } })
      return
    }

    if (!product.can_buy) {
      alert('该商品暂时无法购买')
      return
    }

    setAdding(true)
    try {
      const addRes = await cartApi.add({
        productId: product.id,
        quantity
      })
      if (addRes.success) {
        updateCartCount(addRes.data.cart_count)
        
        const cartRes = await cartApi.getList()
        const cartItem = cartRes.data.items.find(i => i.product_id === product.id)
        
        if (cartItem) {
          navigate('/checkout', { state: { cartIds: [cartItem.id] } })
        }
      }
    } catch (e) {
      alert(e.error || '操作失败')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  if (!product) {
    return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>商品不存在</div>
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">首页</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="product-detail">
          <div className="product-gallery">
            <div className="main-image">
              <span>📦</span>
            </div>
          </div>

          <div className="product-info">
            <h1 className="product-name">{product.name}</h1>
            {product.subtitle && (
              <p className="product-subtitle">{product.subtitle}</p>
            )}

            <div className="product-tags">
              {product.is_hot && <span className="tag tag-hot">热卖</span>}
              {product.is_new && <span className="tag tag-new">新品</span>}
              {product.price_type === 'member' && <span className="tag tag-member">会员专享</span>}
              {product.price_type === 'activity' && <span className="tag tag-activity">活动价</span>}
            </div>

            <div className="price-section">
              <div className="price-row">
                <span className="price-label">价格</span>
                <span className="price-current">¥{product.display_price.toFixed(2)}</span>
                {product.display_price < product.original_price && (
                  <span className="price-original">¥{product.original_price.toFixed(2)}</span>
                )}
              </div>
              
              {user && product.member_price && (
                <div className="price-row">
                  <span className="price-label">会员价</span>
                  <span className="price-member">¥{product.member_price.toFixed(2)}</span>
                  {!user.is_vip && <span className="member-tip">开通会员享受优惠</span>}
                </div>
              )}
              
              {product.activity_price && (
                <div className="price-row">
                  <span className="price-label">活动价</span>
                  <span className="price-activity">¥{product.activity_price.toFixed(2)}</span>
                </div>
              )}
            </div>

            {product.brand && (
              <div className="info-row">
                <span className="info-label">品牌</span>
                <span>{product.brand}</span>
              </div>
            )}

            {product.supplier && (
              <div className="info-row">
                <span className="info-label">供应商</span>
                <Link to={`/supplier/${encodeURIComponent(product.supplier)}`} className="supplier-link">
                  {product.supplier} →
                </Link>
              </div>
            )}

            <div className="info-row">
              <span className="info-label">库存</span>
              {product.stock_warning !== null && product.stock_warning !== undefined ? (
                <span className="stock-warning">仅剩 {product.stock_warning} 件</span>
              ) : (
                <span>{product.stock} 件</span>
              )}
              <span className="sales-info">已售 {product.sales_count}</span>
            </div>

            <div className="info-row">
              <span className="info-label">数量</span>
              <div className="quantity-selector">
                <button 
                  className="quantity-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={product.stock}
                />
                <button 
                  className="quantity-btn"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className={`btn btn-outline btn-lg ${!product.can_buy ? 'disabled' : ''}`}
                onClick={handleAddCart}
                disabled={adding || !product.can_buy}
              >
                {adding ? '加入中...' : '加入购物车'}
              </button>
              <button 
                className={`btn btn-primary btn-lg ${!product.can_buy ? 'disabled' : ''}`}
                onClick={handleBuyNow}
                disabled={adding || !product.can_buy}
              >
                {!product.can_buy ? '暂时无法购买' : '立即购买'}
              </button>
            </div>

            <div className="share-actions">
              <button className="share-btn">
                <span>📤</span> 分享商品
              </button>
            </div>
          </div>
        </div>

        <div className="product-comments">
          <h3>商品评价 ({product.comments?.length || 0})</h3>
          {product.comments && product.comments.length > 0 ? (
            <div className="comments-list">
              {product.comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-user">
                      <span className="user-avatar">{comment.user?.avatar || '👤'}</span>
                      <span className="user-name">{comment.user?.nickname || '匿名用户'}</span>
                    </div>
                    <div className="comment-rating">
                      {'⭐'.repeat(comment.rating)}
                    </div>
                  </div>
                  <div className="comment-content">{comment.content}</div>
                  <div className="comment-time">{comment.created_at}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">暂无评价</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
