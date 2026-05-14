import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

function CategoryPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [activeSubCategory, setActiveSubCategory] = useState(null)
  const [hotProducts, setHotProducts] = useState([])
  const [categoryProducts, setCategoryProducts] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    fetchCategories()
    fetchHotProducts()
  }, [])
  
  useEffect(() => {
    if (activeCategory) {
      setActiveSubCategory(null)
      fetchCategoryProducts(activeCategory.id)
    }
  }, [activeCategory])
  
  useEffect(() => {
    if (activeCategory) {
      if (activeSubCategory) {
        fetchCategoryProducts(activeSubCategory.id)
      } else {
        fetchCategoryProducts(activeCategory.id)
      }
    }
  }, [activeSubCategory])
  
  const fetchCategories = async () => {
    try {
      const response = await api.get('/product/categories')
      setCategories(response.categories || [])
      if (response.categories?.length > 0) {
        setActiveCategory(response.categories[0])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }
  
  const fetchHotProducts = async () => {
    try {
      const response = await api.get('/product/hot-selling', { params: { limit: 6 } })
      setHotProducts(response.products || [])
    } catch (error) {
      console.error('Failed to fetch hot products:', error)
    }
  }
  
  const fetchCategoryProducts = async (categoryId) => {
    try {
      setLoading(true)
      const response = await api.get('/product/list', { params: { category_id: categoryId, page_size: 20 } })
      setCategoryProducts(response.products || [])
    } catch (error) {
      console.error('Failed to fetch category products:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getProductImage = (product) => {
    const images = product.images
    if (images && images.length > 0 && images[0]) {
      return images[0]
    }
    return `/images/categories/${getCategoryIcon(product.category_id)}.svg`
  }
  
  const getCategoryIcon = (categoryId) => {
    const iconMap = {
      1: 'clothing',
      2: 'electronics', 
      3: 'beauty',
      4: 'food',
      5: 'home',
      6: 'sports'
    }
    return iconMap[categoryId] || 'clothing'
  }
  
  return (
    <div className="category-page" style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      <div className="category-sidebar" style={{ width: 90, backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
        {categories.map((category) => (
          <div
            key={category.id}
            className="category-item"
            style={{
              padding: '16px 8px',
              fontSize: 13,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: activeCategory?.id === category.id ? '#fff' : 'transparent',
              borderLeft: activeCategory?.id === category.id ? '3px solid #ff4d4f' : '3px solid transparent',
              fontWeight: activeCategory?.id === category.id ? 600 : 400,
              color: activeCategory?.id === category.id ? '#ff4d4f' : '#333'
            }}
            onClick={() => {
              setActiveCategory(category)
              setActiveSubCategory(null)
            }}
          >
            {category.name}
          </div>
        ))}
      </div>
      
      <div className="category-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff', padding: 12 }}>
        {activeCategory?.children?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="category-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {activeCategory.children.map((sub) => (
                <div
                  key={sub.id}
                  className="category-sub-item"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: activeSubCategory?.id === sub.id ? '#fff1f0' : '#f5f5f5',
                    borderRadius: 15,
                    fontSize: 12,
                    cursor: 'pointer',
                    border: activeSubCategory?.id === sub.id ? '1px solid #ff4d4f' : 'none',
                    color: activeSubCategory?.id === sub.id ? '#ff4d4f' : '#666'
                  }}
                  onClick={() => setActiveSubCategory(sub)}
                >
                  {sub.name}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#333' }}>
            {activeSubCategory ? activeSubCategory.name : activeCategory?.name}
            <span style={{ fontWeight: 400, fontSize: 12, color: '#999', marginLeft: 8 }}>
              共 {categoryProducts.length} 件商品
            </span>
          </h4>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
          ) : categoryProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              暂无商品，去看看其他分类吧
            </div>
          ) : (
            <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div style={{ 
                    aspectRatio: '1',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `/images/categories/${getCategoryIcon(product.category_id)}.svg`
                      }}
                    />
                  </div>
                  <div className="product-info" style={{ padding: 8 }}>
                    <div className="product-name" style={{ 
                      fontSize: 13, 
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4,
                      height: 36
                    }}>
                      {product.name}
                    </div>
                    <div className="product-price" style={{ marginTop: 6 }}>
                      <span className="price-current" style={{ fontSize: 15, fontWeight: 600, color: '#ff4d4f' }}>
                        ¥{product.price?.toFixed(2)}
                      </span>
                    </div>
                    <div className="product-sales" style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                      已售 {product.sales || 0} 件
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {hotProducts.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#333' }}>
              🔥 热销榜
            </h4>
            <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {hotProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="product-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ 
                      aspectRatio: '1',
                      backgroundColor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `/images/categories/${getCategoryIcon(product.category_id)}.svg`
                        }}
                      />
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      backgroundColor: index < 3 ? '#ff4d4f' : '#ff9a00',
                      color: '#fff',
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontWeight: 600
                    }}>
                      TOP {index + 1}
                    </div>
                  </div>
                  <div className="product-info" style={{ padding: 8 }}>
                    <div className="product-name" style={{ 
                      fontSize: 13, 
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4,
                      height: 36
                    }}>
                      {product.name}
                    </div>
                    <div className="product-price" style={{ marginTop: 6 }}>
                      <span className="price-current" style={{ fontSize: 15, fontWeight: 600, color: '#ff4d4f' }}>
                        ¥{product.price?.toFixed(2)}
                      </span>
                    </div>
                    <div className="product-sales" style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                      已售 {product.sales || 0} 件
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryPage
export { CategoryPage as Category }
