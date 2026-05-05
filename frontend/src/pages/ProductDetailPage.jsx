import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { productApi, cartApi } from '../api'
import { useUserStore, useCartStore } from '../store'

function ProductDetailPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const { user, token } = useUserStore()
  const { setCart } = useCartStore()
  
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  useEffect(() => {
    fetchProductDetail()
  }, [productId])
  
  const fetchProductDetail = async () => {
    setLoading(true)
    try {
      const result = await productApi.getDetail(productId)
      if (result.success) {
        setProduct(result.data.product)
        setRelatedProducts(result.data.related || [])
      }
    } catch (error) {
      console.error('获取商品详情失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const addToCart = async () => {
    try {
      const result = await cartApi.add({ product_id: productId, quantity })
      if (result.success) {
        showToast('已添加到购物车')
        const cartRes = await cartApi.getList()
        if (cartRes.success) {
          setCart(cartRes.data.list, cartRes.data.total_count, cartRes.data.total_amount)
        }
      } else {
        showToast(result.message || '添加失败')
      }
    } catch (error) {
      showToast(error.message || '添加失败')
    }
  }
  
  const handleBuyNow = () => {
    if (!token) {
      navigate('/login')
      return
    }
    addToCart().then(() => {
      setTimeout(() => navigate('/settlement'), 500)
    })
  }
  
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading" style={{ marginTop: '100px' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }
  
  if (!product) {
    return (
      <div className="page-container">
        <div className="empty-state" style={{ marginTop: '100px' }}>
          <div className="empty-state-icon">😕</div>
          <div className="empty-state-text">商品不存在</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="page-container" style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
        <div className="flex-between">
          <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px' }}>
            ←
          </button>
          <span style={{ color: 'white', fontWeight: 500 }}>商品详情</span>
          <button style={{ color: 'white', fontSize: '20px' }} onClick={() => navigate('/cart')}>
            🛒
          </button>
        </div>
      </div>
      
      <div>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
        />
      </div>
      
      <div className="card">
        <div className="flex-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="product-price">
              <span className="product-price-current" style={{ fontSize: '24px' }}>
                ¥{product.show_price || product.price}
              </span>
              {product.member_price && user?.is_member && (
                <span className="tag tag-member">会员价</span>
              )}
            </div>
            {product.member_price && !user?.is_member && (
              <p className="text-muted text-sm mt-xs">会员价: ¥{product.member_price}</p>
            )}
          </div>
          <div className="stepper">
            <button
              className="stepper-btn"
              disabled={quantity <= 1}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
            >
              -
            </button>
            <span className="stepper-value">{quantity}</span>
            <button
              className="stepper-btn"
              onClick={() => setQuantity(q => q + 1)}
            >
              +
            </button>
          </div>
        </div>
        
        <h2 style={{ fontSize: '18px', marginTop: '12px' }}>{product.name}</h2>
        <p className="text-muted mt-sm">{product.description}</p>
        
        <div className="flex-between mt-md" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>销量: {product.sales}</span>
          <span>库存: {product.stock}</span>
          <span>单位: {product.unit}</span>
        </div>
        
        <div className="mt-md">
          {product.is_hot && <span className="tag tag-hot mr-sm">热销</span>}
          {product.is_new && <span className="tag tag-new mr-sm">新品</span>}
          {product.is_member_only && <span className="tag tag-member">会员专享</span>}
        </div>
      </div>
      
      {product.price !== product.member_price && product.member_price && (
        <div className="member-card">
          <div className="member-card-header">
            <span className="member-title">开通会员更优惠</span>
            <button
              className="btn btn-sm"
              style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
              onClick={() => navigate('/member')}
            >
              立即开通
            </button>
          </div>
          <div>
            <p>开通会员立省 ¥{product.price - product.member_price}</p>
          </div>
        </div>
      )}
      
      {relatedProducts.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-title-text">
              <span>💡</span>
              <span>相关推荐</span>
            </div>
          </div>
          <div className="product-grid" style={{ padding: 0 }}>
            {relatedProducts.map(item => (
              <div
                key={item.id}
                className="product-card"
                onClick={() => navigate(`/product/${item.id}`)}
              >
                <img src={item.image} alt={item.name} className="product-image" />
                <div className="product-info">
                  <div className="product-name">{item.name}</div>
                  <div className="product-price">
                    <span className="product-price-current">¥{item.show_price || item.price}</span>
                    <span className="product-unit">/{item.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-primary)',
        padding: '12px 16px',
        display: 'flex',
        gap: '12px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}>
        <button
          className="btn btn-outline btn-lg"
          style={{ flex: 1 }}
          onClick={addToCart}
        >
          加入购物车
        </button>
        <button
          className="btn btn-primary btn-lg"
          style={{ flex: 1 }}
          onClick={handleBuyNow}
        >
          立即购买
        </button>
      </div>
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default ProductDetailPage
