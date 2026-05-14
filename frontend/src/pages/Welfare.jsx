import React, { useEffect, useState } from 'react'
import { productApi, promotionApi } from '../api'
import ProductCard from '../components/ProductCard'

const Welfare = () => {
  const [products, setProducts] = useState([])
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsRes, couponsRes] = await Promise.all([
        productApi.getRecommend({ limit: 20 }),
        promotionApi.getCoupons()
      ])
      if (productsRes.success) setProducts(productsRes.data)
      if (couponsRes.success) setCoupons(couponsRes.data)
    } catch (e) {
      console.error('加载福利社数据失败', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>🎁 福利社</h1>

      {coupons.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>优惠券</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {coupons.map(coupon => (
              <div
                key={coupon.id}
                style={{
                  background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
                  border: '1px solid #ffccc7',
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex'
                }}
              >
                <div style={{ textAlign: 'center', paddingRight: 16, borderRight: '1px dashed #ffccc7' }}>
                  <div style={{ color: '#ff4d4f', fontSize: 28, fontWeight: 700 }}>¥{coupon.discount_value}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>满{coupon.min_amount}可用</div>
                </div>
                <div style={{ flex: 1, paddingLeft: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{coupon.name}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>剩余 {coupon.remaining_count} 张</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>精选好物</h2>
        <div className="grid-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Welfare
