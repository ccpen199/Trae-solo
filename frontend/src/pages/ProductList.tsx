import React, { useEffect, useState } from 'react'
import { ShoppingBag, ShoppingCart, Package } from 'lucide-react'
import { productAPI } from '../api'

const categories = ['全部', '空调', '冰箱', '洗衣机', '热水器', '电视', '厨电', '其他']

const styles: Record<string, React.CSSProperties> = {
  container: {},
  tabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab: { padding: '6px 16px', border: '1px solid #d9d9d9', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: '#fff', transition: 'all 0.2s' },
  tabActive: { padding: '6px 16px', border: '1px solid #1890ff', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: '#e6f7ff', color: '#1890ff' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  card: { background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', transition: 'transform 0.2s' },
  image: { width: '100%', height: 160, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 16 },
  productName: { fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 },
  productBrand: { fontSize: 12, color: '#8c8c8c', marginBottom: 8 },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 20, fontWeight: 700, color: '#ff4d4f' },
  stock: { fontSize: 12, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 4 },
  stockLow: { fontSize: 12, color: '#faad14', display: 'flex', alignItems: 'center', gap: 4 },
  cartBtn: { padding: '8px 16px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, width: '100%', justifyContent: 'center' },
}

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('全部')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productAPI.list()
        setProducts(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
      } catch { setProducts([]) } finally { setLoading(false) }
    }
    fetchProducts()
  }, [])

  const filtered = activeCategory === '全部' ? products : products.filter(p => p.category === activeCategory || p.type === activeCategory)

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  return (
    <div style={styles.container}>
      <div style={styles.tabs}>
        {categories.map(c => (
          <div key={c} style={activeCategory === c ? styles.tabActive : styles.tab} onClick={() => setActiveCategory(c)}>
            {c}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无商品数据</div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(p => {
            const stock = p.erp_stock ?? p.stock ?? 0
            const isLow = stock > 0 && stock < 10
            return (
              <div key={p.id} style={styles.card}>
                <div style={styles.image}>
                  <ShoppingBag size={48} color="#bfbfbf" />
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.productName}>{p.name || p.product_name}</div>
                  <div style={styles.productBrand}>{p.brand || ''} {p.model || ''}</div>
                  <div style={styles.priceRow}>
                    <span style={styles.price}>¥{p.price || '0'}</span>
                    <span style={isLow ? styles.stockLow : styles.stock}>
                      <Package size={12} />
                      {stock > 0 ? (isLow ? `仅剩${stock}件` : `库存${stock}`) : '缺货'}
                    </span>
                  </div>
                  <button style={{ ...styles.cartBtn, opacity: stock > 0 ? 1 : 0.5 }} disabled={stock <= 0}>
                    <ShoppingCart size={14} /> 加入购物车
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
