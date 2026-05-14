import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryApi } from '../api'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getList()
      if (res.success) {
        setCategories(res.data)
        if (res.data.length > 0) {
          setActiveCategory(res.data[0])
          loadProducts(res.data[0].id)
        }
      }
    } catch (e) {
      console.error('加载分类失败', e)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async (categoryId) => {
    setProductsLoading(true)
    try {
      const res = await categoryApi.getProducts(categoryId, { pageSize: 20 })
      if (res.success) {
        setProducts(res.data)
      }
    } catch (e) {
      console.error('加载商品失败', e)
    } finally {
      setProductsLoading(false)
    }
  }

  const handleCategoryClick = (category) => {
    setActiveCategory(category)
    loadProducts(category.id)
  }

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>📂 商品分类</h1>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="card" style={{ padding: 0 }}>
            {categories.map(category => (
              <div key={category.id}>
                <div
                  style={{
                    padding: 12,
                    cursor: 'pointer',
                    borderLeft: activeCategory?.id === category.id ? '3px solid #ff4d4f' : '3px solid transparent',
                    background: activeCategory?.id === category.id ? '#fff5f5' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: activeCategory?.id === category.id ? 600 : 400
                  }}
                  onClick={() => handleCategoryClick(category)}
                >
                  <span style={{ fontSize: 20 }}>{category.icon}</span>
                  <span>{category.name}</span>
                </div>
                {category.children && category.children.length > 0 && (
                  <div style={{ paddingLeft: 20 }}>
                    {category.children.map(child => (
                      <div
                        key={child.id}
                        style={{
                          padding: '8px 12px',
                          fontSize: 13,
                          color: '#666',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleCategoryClick(child)}
                      >
                        {child.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              {activeCategory?.icon} {activeCategory?.name}
            </h2>
            
            {productsLoading ? (
              <div className="loading">加载中...</div>
            ) : products.length === 0 ? (
              <div className="empty">该分类暂无商品</div>
            ) : (
              <div className="grid-4">
                {products.map(product => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="product-card"
                  >
                    <div className="product-card-img" style={{ position: 'relative' }}>
                      <span>📦</span>
                      {!product.can_buy && (
                        <div className="product-card-sold-out">已售罄</div>
                      )}
                    </div>
                    <div className="product-card-body">
                      <div className="product-card-name">{product.name}</div>
                      <div className="product-card-price">
                        <span className="product-card-price-current">¥{product.display_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Categories
