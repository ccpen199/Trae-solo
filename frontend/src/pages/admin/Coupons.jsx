import React, { useEffect, useState } from 'react'
import { promotionApi } from '../../api'

const Coupons = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    discount_value: '',
    min_amount: '',
    start_time: '',
    end_time: '',
    total_count: ''
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      const res = await promotionApi.getCoupons()
      if (res.success) {
        setCoupons(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return
    try {
      await promotionApi.deleteCoupon(id)
      loadCoupons()
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async () => {
    try {
      await promotionApi.createCoupon(form)
      alert('创建成功')
      setForm({ name: '', discount_value: '', min_amount: '', start_time: '', end_time: '', total_count: '' })
      loadCoupons()
    } catch (e) {
      alert(e.error || '创建失败')
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>🎫 优惠券管理</h1>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>创建优惠券</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">名称</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="新用户专享券" />
          </div>
          <div className="form-group">
            <label className="form-label">优惠金额</label>
            <input type="number" className="form-input" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder="10" />
          </div>
          <div className="form-group">
            <label className="form-label">满减门槛</label>
            <input type="number" className="form-input" value={form.min_amount} onChange={e => setForm({ ...form, min_amount: e.target.value })} placeholder="100" />
          </div>
          <div className="form-group">
            <label className="form-label">开始时间</label>
            <input type="datetime-local" className="form-input" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">结束时间</label>
            <input type="datetime-local" className="form-input" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">发行数量</label>
            <input type="number" className="form-input" value={form.total_count} onChange={e => setForm({ ...form, total_count: e.target.value })} placeholder="1000" />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>创建优惠券</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>名称</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>优惠</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>发行/剩余</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>有效期</th>
              <th style={{ textAlign: 'right', padding: 16, fontSize: 13, color: '#666' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => (
              <tr key={coupon.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: 16, fontWeight: 500 }}>{coupon.name}</td>
                <td style={{ padding: 16 }}>
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{coupon.discount_value}</span>
                  <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>满{coupon.min_amount}可用</span>
                </td>
                <td style={{ padding: 16 }}>
                  {coupon.total_count} / {coupon.remaining_count}
                </td>
                <td style={{ padding: 16, color: '#999', fontSize: 13 }}>
                  {coupon.start_time} ~ {coupon.end_time}
                </td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12 }}
                    onClick={() => handleDelete(coupon.id)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无优惠券</div>
        )}
      </div>
    </div>
  )
}

export default Coupons
