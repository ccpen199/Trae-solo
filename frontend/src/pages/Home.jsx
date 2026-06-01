import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { bill, admin } from '../api'
import Header from '../components/Header'
import Loading from '../components/Loading'

function Home() {
  const navigate = useNavigate()
  const { showToast, setLoading } = useAppStore()
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchHomeData()
    initSampleData()
  }, [])

  const initSampleData = async () => {
    try {
      await admin.initSampleData()
    } catch (error) {
      // 忽略错误，可能已经初始化过了
    }
  }

  const fetchHomeData = async () => {
    try {
      setLoading(true)
      const res = await bill.getHome()
      if (res.success) {
        setData(res.data)
      }
    } catch (error) {
      showToast('获取首页数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!data) {
    return <Loading />
  }

  return (
    <div className="page">
      <Header title="51信用卡管家" />
      <div style={{ padding: '20px' }}>
        {data.has_bill ? (
          <>
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
                color: 'white'
              }}
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                  待还账单（元）
                </p>
                <p style={{ fontSize: '36px', fontWeight: '600' }}>
                  {data.total_bill?.toFixed(2) || '0.00'}
                </p>
                <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                  共 {data.card_count} 张信用卡
                </p>
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">信用卡概览</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>总额度</p>
                  <p style={{ fontSize: '20px', fontWeight: '600', color: '#333' }}>
                    ¥{data.total_credit_limit?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>未还账单</p>
                  <p style={{ fontSize: '20px', fontWeight: '600', color: '#ff6b6b' }}>
                    {data.unpaid_bill_count || 0} 笔
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '60px 20px'
            }}
          >
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>💳</div>
            <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '12px' }}>
              您还没有导入信用卡账单
            </h3>
            <p style={{ fontSize: '14px', color: '#999', marginBottom: '24px' }}>
              导入账单后即可智能管理您的信用卡
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/bill')}
            >
              立即导入
            </button>
          </div>
        )}

        <div className="card">
          <h3 className="section-title">快捷入口</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {[
              { icon: '💳', label: '账单还款', path: '/bill' },
              { icon: '💰', label: '理财服务', path: '/wealth' },
              { icon: '💵', label: '借钱服务', path: '/loan' },
              { icon: '🎁', label: '红包优惠', path: '/red-packets' },
              { icon: '📊', label: '公积金', path: '/housing-fund' },
              { icon: '🎫', label: '优惠券', path: '/coupons' }
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: 'calc(33.33% - 11px)',
                  padding: '16px 8px',
                  border: 'none',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{item.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
