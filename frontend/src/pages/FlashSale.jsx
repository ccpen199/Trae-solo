import React, { useEffect, useState } from 'react'
import { promotionApi } from '../api'
import ProductCard from '../components/ProductCard'

const FlashSale = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const res = await promotionApi.getFlashSale()
      if (res.success) {
        setProducts(res.data)
      }
    } catch (e) {
      console.error('加载限时购失败', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>⏰ 限时购</h1>
        <div style={{ padding: '8px 16px', background: '#ff4d4f', color: '#fff', borderRadius: 4 }}>
          限时优惠
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty">暂无限时商品</div>
      ) : (
        <div className="grid-4">
          {products.map(product => (
            <div key={product.id} style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 10,
                background: '#ff4d4f',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600
              }}>
                -{product.discount}%
              </div>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FlashSale
