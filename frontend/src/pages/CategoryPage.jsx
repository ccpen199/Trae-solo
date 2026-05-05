import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import { productApi, cartApi } from '../api'
import { useUserStore, useCartStore } from '../store'

function CategoryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useUserStore()
  const { setCart } = useCartStore()
  
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  useEffect(() => {
    fetchCategories()
  }, [])
  
  useEffect(() => {
    const categoryId = searchParams.get('category_id')
    if (categoryId && categories.length > 0) {
      const cat = categories.find(c => c.id === parseInt(categoryId))
      if (cat) {
        setActiveCategory(cat)
        setPage(1)
        setProducts([])
        fetchProducts(cat.id, 1)
      }
    }
  }, [searchParams, categories])
  
  const fetchCategories = async () => {
    try {
      const result = await productApi.getCategories()
      if (result.success) {
        setCategories(result.data)
        if (result.data.length > 0 && !searchParams.get('category_id')) {
          setActiveCategory(result.data[0])
          setPage(1)
          fetchProducts(result.data[0].id, 1)
        }
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }
  
  const fetchProducts = async (categoryId, pageNum) => {
    if (loading) return
    
    setLoading(true)
    try {
      const result = await productApi.getList({
        category_id: categoryId,
        page: pageNum,
        page_size: 20
      })
      
      if (result.success) {
        const newProducts = pageNum === 1 ? result.data.list : [...products, ...result.data.list]
        setProducts(newProducts)
        setHasMore(newProducts.length < result.data.total)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('获取商品列表失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCategoryClick = (category) => {
    setActiveCategory(category)
    setPage(1)
    setProducts([])
    navigate(`/category?category_id=${category.id}`)
    fetchProducts(category.id, 1)
  }
  
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
  
  const loadMore = () => {
    if (hasMore && !loading && activeCategory) {
      fetchProducts(activeCategory.id, page + 1)
    }
  }
  
  return (
    <div className="page-container" style={{ display: 'flex' }}>
      <div style={{ width: '90px', backgroundColor: 'var(--bg-secondary)', overflowY: 'auto', position: 'fixed', left: 0, top: 0, bottom: 0, paddingTop: '60px' }}>
        {categories.map(category => (
          <div
            key={category.id}
            style={{
              padding: '16px 8px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: activeCategory?.id === category.id ? 'var(--bg-primary)' : 'transparent',
              borderLeft: activeCategory?.id === category.id ? '3px solid var(--primary-color)' : 'none'
            }}
            onClick={() => handleCategoryClick(category)}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{category.icon}</div>
            <div style={{ fontSize: '12px', color: activeCategory?.id === category.id ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
              {category.name}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ flex: 1, marginLeft: '90px', paddingBottom: '60px' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <Header showSearch={true} showLocation={true} />
        </div>
        
        {activeCategory && (
          <div className="card" style={{ margin: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '32px' }}>{activeCategory.icon}</div>
              <div>
                <h3 style={{ marginBottom: '4px' }}>{activeCategory.name}</h3>
                <p className="text-muted text-sm">共 {products.length} 件商品</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="product-grid">
          {products.map(product => (
            <div
              key={product.id}
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
          ))}
        </div>
        
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {hasMore && !loading && products.length > 0 && (
          <div className="text-center text-muted p-md" onClick={loadMore} style={{ cursor: 'pointer' }}>
            加载更多
          </div>
        )}
        
        {!loading && products.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <div className="empty-state-text">暂无商品</div>
          </div>
        )}
      </div>
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default CategoryPage
