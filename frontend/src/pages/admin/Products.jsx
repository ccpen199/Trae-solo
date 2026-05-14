import React, { useEffect, useState } from 'react'
import { adminApi, productApi } from '../../api'

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '',
    subtitle: '',
    price: '',
    vip_price: '',
    activity_price: '',
    stock: '',
    category_id: '',
    supplier: '',
    brand: '',
    is_on_sale: 1
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const res = await productApi.getList({ pageSize: 100 })
      if (res.success) {
        setProducts(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditing(product.id)
    setForm({
      name: product.name,
      subtitle: product.subtitle || '',
      price: product.price,
      vip_price: product.vip_price || '',
      activity_price: product.activity_price || '',
      stock: product.stock,
      category_id: product.category_id || '',
      supplier: product.supplier || '',
      brand: product.brand || '',
      is_on_sale: product.is_on_sale
    })
  }

  const handleSave = async () => {
    try {
      const res = await adminApi.updateProduct(editing, form)
      if (res.success) {
        alert('保存成功')
        setEditing(null)
        loadProducts()
      }
    } catch (e) {
      alert(e.error || '保存失败')
    }
  }

  const handleToggleSale = async (id, currentStatus) => {
    try {
      const res = await adminApi.updateProduct(id, { is_on_sale: currentStatus ? 0 : 1 })
      if (res.success) {
        loadProducts()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>🏷️ 商品管理</h1>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>商品名称</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>价格</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>库存</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>供应商</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>状态</th>
              <th style={{ textAlign: 'right', padding: 16, fontSize: 13, color: '#666' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: 16 }}>
                  <div style={{ fontWeight: 500 }}>{product.name}</div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>{product.subtitle}</div>
                </td>
                <td style={{ padding: 16 }}>
                  <div style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{product.price}</div>
                  {product.vip_price && <div style={{ color: '#faad14', fontSize: 12 }}>VIP: ¥{product.vip_price}</div>}
                </td>
                <td style={{ padding: 16 }}>{product.stock}</td>
                <td style={{ padding: 16 }}>{product.supplier || '-'}</td>
                <td style={{ padding: 16 }}>
                  <span style={{
                    padding: '2px 8px',
                    background: product.is_on_sale ? '#f6ffed' : '#fff1f0',
                    color: product.is_on_sale ? '#52c41a' : '#ff4d4f',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    {product.is_on_sale ? '上架中' : '已下架'}
                  </span>
                </td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ marginRight: 8, fontSize: 12 }}
                    onClick={() => handleToggleSale(product.id, product.is_on_sale)}
                  >
                    {product.is_on_sale ? '下架' : '上架'}
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: 12 }}
                    onClick={() => handleEdit(product)}
                  >
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无商品</div>
        )}
      </div>

      {editing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setEditing(null)}>
          <div className="card" style={{ width: 500, padding: 24, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>编辑商品</h2>
            
            <div className="form-group">
              <label className="form-label">商品名称</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">副标题</label>
              <input className="form-input" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">原价</label>
              <input type="number" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">会员价</label>
              <input type="number" className="form-input" value={form.vip_price} onChange={e => setForm({ ...form, vip_price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">活动价</label>
              <input type="number" className="form-input" value={form.activity_price} onChange={e => setForm({ ...form, activity_price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">库存</label>
              <input type="number" className="form-input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">供应商</label>
              <input className="form-input" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">品牌</label>
              <input className="form-input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditing(null)}>取消</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
