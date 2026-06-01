import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { user } from '../api'
import Header from '../components/Header'
import Loading from '../components/Loading'

function Coupon() {
  const { showToast, setLoading } = useAppStore()
  const [coupons, setCoupons] = useState([])
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchCoupons()
  }, [activeTab])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const params = activeTab === 'all' ? {} : { type: activeTab }
      const res = await user.getCoupons(params)
      if (res.success) {
        setCoupons(res.data || [])
      }
    } catch (error) {
      showToast('获取优惠券列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      repayment: '还款券',
      investment: '投资券',
      loan: '借款券'
    }
    return labels[type] || type
  }

  const getTypeColor = (type) => {
    const colors = {
      repayment: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: '还款' },
      investment: { bg: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)', label: '投资' },
      loan: { bg: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)', label: '借款' }
    }
    return colors[type] || colors.repayment
  }

  return (
    <div className="page">
      <Header title="我的优惠券" />
      <div style={{ padding: '20px' }}>
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            全部
          </div>
          <div
            className={`tab ${activeTab === 'repayment' ? 'active' : ''}`}
            onClick={() => setActiveTab('repayment')}
          >
            还款券
          </div>
          <div
            className={`tab ${activeTab === 'investment' ? 'active' : ''}`}
            onClick={() => setActiveTab('investment')}
          >
            投资券
          </div>
          <div
            className={`tab ${activeTab === 'loan' ? 'active' : ''}`}
            onClick={() => setActiveTab('loan')}
          >
            借款券
          </div>
        </div>

        {coupons.length > 0 ? (
          coupons.map((coupon) => {
            const colorConfig = getTypeColor(coupon.type)
            return (
              <div
                key={coupon.id}
                className="card"
                style={{
                  display: 'flex',
                  padding: 0,
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: '100px',
                    background: colorConfig.bg,
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                  }}
                >
                  <p style={{ fontSize: '28px', fontWeight: '600' }}>¥{coupon.value}</p>
                  <p style={{ fontSize: '12px', opacity: 0.9 }}>{colorConfig.label}</p>
                </div>
                <div style={{ flex: 1, padding: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                    {coupon.name}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#999' }}>
                    满{coupon.min_use_amount}元可用
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="card empty-state">
            <div className="icon">🎫</div>
            <p>暂无优惠券</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Coupon
