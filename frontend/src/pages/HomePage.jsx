import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { productApi, cartApi } from '../api'
import { useUserStore, useCartStore } from '../store'

function HomePage() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { setCart } = useCartStore()
  
  const [categories, setCategories] = useState([])
  const [flashSales, setFlashSales] = useState([])
  const [hotProducts, setHotProducts] = useState([])
  const [newProducts, setNewProducts] = useState([])
  const [recommendProducts, setRecommendProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  const fetchData = async () => {
    setLoading(true)
    try {
      const [catRes, flashRes, hotRes, newRes, recRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getFlashSales(),
        productApi.getHot(8),
        productApi.getNew(6),
        productApi.getRecommend(10)
      ])
      
      if (catRes.success) setCategories(catRes.data)
      if (flashRes.success) setFlashSales(flashRes.data)
      if (hotRes.success) setHotProducts(hotRes.data)
      if (newRes.success) setNewProducts(newRes.data)
      if (recRes.success) setRecommendProducts(recRes.data)
    } catch (error) {
      console.error('获取首页数据失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const addToCart = async (productId, quantity = 1) => {
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
  
  const ProductCard = ({ product }) => (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <img src={product.image} alt={product.name} className="product-image" />
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="flex-between">
          <div className="product-price">
            <span className="product-price-current">¥{product.show_price || product.price}</span>
            {product.member_price && user?.is_member && (
              <span className="tag tag-member">会员价</span>
            )}
          </div>
          <button
            className="btn btn-primary btn-sm btn-round"
            onClick={(e) => {
              e.stopPropagation()
              addToCart(product.id)
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
  
  if (loading) {
    return (
      <div className="page-container">
        <Header />
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="page-container">
      <Header />
      
      <div className="banner-swiper">
        <div className="banner-item">
          <div>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🥬 新鲜直达</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>半小时配送 · 新鲜每一天</div>
          </div>
        </div>
      </div>
      
      {categories.length > 0 && (
        <div className="category-grid">
          {categories.slice(0, 8).map(cat => (
            <div
              key={cat.id}
              className="category-item"
              onClick={() => navigate(`/category?category_id=${cat.id}`)}
            >
              <div className="category-icon">{cat.icon}</div>
              <span className="category-name">{cat.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {flashSales.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-title-text">
              <span>⚡</span>
              <span>限时抢购</span>
              <span className="tag tag-flash">限时</span>
            </div>
            <button className="text-muted text-sm" onClick={() => navigate('/flash-sales')}>
              更多 →
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {flashSales.map(item => (
              <div
                key={item.id}
                style={{ flexShrink: 0, width: '120px' }}
                onClick={() => navigate(`/product/${item.product_id}`)}
              >
                <img src={item.image} alt={item.name} style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ fontSize: '12px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                  <span style={{ color: 'var(--danger-color)', fontSize: '16px', fontWeight: 600 }}>¥{item.flash_price}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', textDecoration: 'line-through' }}>¥{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {hotProducts.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-title-text">
              <span>🔥</span>
              <span>热销商品</span>
            </div>
          </div>
          <div className="product-grid" style={{ padding: 0 }}>
            {hotProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
      
      {newProducts.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-title-text">
              <span>✨</span>
              <span>新品上市</span>
            </div>
          </div>
          <div className="product-grid" style={{ padding: 0 }}>
            {newProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
      
      {recommendProducts.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-title-text">
              <span>💡</span>
              <span>为你推荐</span>
            </div>
          </div>
          <div className="product-grid" style={{ padding: 0 }}>
            {recommendProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default HomePage
