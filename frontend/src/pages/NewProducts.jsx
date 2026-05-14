import React, { useEffect, useState } from 'react'
import { productApi } from '../api'
import ProductCard from '../components/ProductCard'

const NewProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

  useEffect(() => {
    loadProducts()
  }, [pagination.page])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await productApi.getNew({ page: pagination.page, pageSize: pagination.pageSize })
      if (res.success) {
        setProducts(res.data)
        setPagination(res.pagination)
      }
    } catch (e) {
      console.error('加载新品失败', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>✨ 新品上市</h1>
      
      {products.length === 0 ? (
        <div className="empty">暂无新品</div>
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

export default NewProducts
