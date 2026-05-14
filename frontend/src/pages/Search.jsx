import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productApi } from '../api'
import ProductCard from '../components/ProductCard'

const Search = () => {
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || ''
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

  useEffect(() => {
    if (keyword) {
      loadProducts()
    }
  }, [keyword, pagination.page])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await productApi.search({ 
        keyword, 
        page: pagination.page, 
        pageSize: pagination.pageSize 
      })
      if (res.success) {
        setProducts(res.data)
        setPagination(res.pagination)
      }
    } catch (e) {
      console.error('搜索失败', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>
        🔍 搜索：<span style={{ color: '#ff4d4f' }}>{keyword}</span>
        <span style={{ fontSize: 14, fontWeight: 400, color: '#999', marginLeft: 12 }}>
          共找到 {pagination.total} 件商品
        </span>
      </h1>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : products.length === 0 ? (
        <div className="empty">未找到相关商品</div>
      ) : (
        <div className="grid-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`btn ${pagination.page === page ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPagination(p => ({ ...p, page }))}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Search
