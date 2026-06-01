import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { user } from '../api'
import Header from '../components/Header'
import Loading from '../components/Loading'

function HousingFund() {
  const { showToast, setLoading } = useAppStore()
  const [fundInfo, setFundInfo] = useState(null)
  const [formData, setFormData] = useState({
    city: '',
    account_number: ''
  })
  const [isQuerying, setIsQuerying] = useState(false)

  useEffect(() => {
    fetchFundInfo()
  }, [])

  const fetchFundInfo = async () => {
    try {
      const res = await user.getHousingFund()
      if (res.success && res.data) {
        setFundInfo(res.data)
        setFormData({
          city: res.data.city || '',
          account_number: res.data.account_number || ''
        })
      }
    } catch (error) {
      // 静默失败
    }
  }

  const handleQuery = async () => {
    if (!formData.city) {
      showToast('请输入城市', 'error')
      return
    }
    if (!formData.account_number) {
      showToast('请输入账号', 'error')
      return
    }

    try {
      setLoading(true)
      setIsQuerying(true)
      const res = await user.queryHousingFund(formData)
      if (res.success) {
        setFundInfo(res.data)
        showToast('查询成功', 'success')
      } else {
        showToast(res.message || '查询失败', 'error')
      }
    } catch (error) {
      showToast('查询失败', 'error')
    } finally {
      setLoading(false)
      setIsQuerying(false)
    }
  }

  return (
    <div className="page">
      <Header title="公积金查询" />
      <div style={{ padding: '20px' }}>
        {fundInfo ? (
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              marginBottom: '20px'
            }}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '12px' }}>
                公积金余额（元）
              </p>
              <p style={{ fontSize: '40px', fontWeight: '600' }}>
                ¥{(fundInfo.balance || 0).toFixed(2)}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '40px',
                marginTop: '24px'
              }}>
                <div>
                  <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>城市</p>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>{fundInfo.city || '-'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>月缴额</p>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>
                    ¥{(fundInfo.monthly_payment || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              {fundInfo.last_updated && (
                <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '20px' }}>
                  更新时间: {fundInfo.last_updated}
                </p>
              )}
            </div>
          </div>
        ) : null}

        <div className="card">
          <h3 className="section-title">查询公积金</h3>
          <div className="input-group">
            <label>城市</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="请输入城市名称"
            />
          </div>
          <div className="input-group">
            <label>公积金账号</label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              placeholder="请输入公积金账号"
            />
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={handleQuery}
            disabled={isQuerying}
          >
            {isQuerying ? '查询中...' : '立即查询'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HousingFund
