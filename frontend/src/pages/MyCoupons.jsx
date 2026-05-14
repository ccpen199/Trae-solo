import React, { useEffect, useState } from 'react'
import { promotionApi } from '../api'

const statusTabs = [
  { key: '', label: '全部' },
  { key: 'available', label: '可使用' },
  { key: 'used', label: '已使用' },
]

const MyCoupons = () => {
  const [activeTab, setActiveTab] = useState('available')
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCoupons()
  }, [activeTab])

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const params = {}
      if (activeTab) params.status = activeTab
      const res = await promotionApi.getMyCoupons(params)
      if (res.success) {
        setCoupons(res.data)
      }
    } catch (e) {
      console.error('加载优惠券失败', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>🎫 我的优惠券</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : coupons.length === 0 ? (
        <div className="empty">暂无优惠券</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {coupons.map(coupon => (
            <div
              key={coupon.id}
              className="card"
              style={{
                padding: 16,
                background: coupon.status === 'available' ? 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)' : '#f5f5f5',
                border: `1px solid ${coupon.status === 'available' ? '#ffccc7' : '#e8e8e8'}`,
                display: 'flex'
              }}
            >
              <div style={{
                textAlign: 'center',
                paddingRight: 16,
                borderRight: `1px dashed ${coupon.status === 'available' ? '#ffccc7' : '#e8e8e8'}`,
                color: coupon.status === 'available' ? '#ff4d4f' : '#ccc'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700 }}>¥{coupon.discount_value}</div>
                <div style={{ fontSize: 12 }}>满{coupon.min_amount}可用</div>
              </div>
              <div style={{ flex: 1, paddingLeft: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{coupon.name}</div>
                <div style={{ color: '#999', fontSize: 12 }}>
                  {coupon.status === 'available' ? `有效期至 ${coupon.end_time}` : coupon.status === 'used' ? '已使用' : '已过期'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyCoupons
