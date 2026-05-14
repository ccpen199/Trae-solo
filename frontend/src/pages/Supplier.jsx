import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { productApi } from '../api'
import ProductCard from '../components/ProductCard'

const Supplier = () => {
  const { name } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [name])

  const loadProducts = async () => {
    try {
      const res = await productApi.getSupplier(decodeURIComponent(name))
      if (res.success) {
        setProducts(res.data.products)
      }
    } catch (e) {
      console.error('加载供应商商品失败', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>🏭 {decodeURIComponent(name)}</h1>
        <p style={{ color: '#999', marginTop: 8 }}>品牌制造商直供</p>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : products.length === 0 ? (
        <div className="empty">该供应商暂无商品</div>
      ) : (
        <div className="grid-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Supplier
