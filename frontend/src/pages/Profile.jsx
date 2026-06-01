import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useAppStore } from '../store'
import { user } from '../api'
import Header from '../components/Header'
import Loading from '../components/Loading'

function Profile() {
  const navigate = useNavigate()
  const { user: authUser, logout } = useAuthStore()
  const { showToast, setLoading } = useAppStore()
  const [profile, setProfile] = useState(null)
  const [overview, setOverview] = useState(null)

  useEffect(() => {
    fetchProfile()
    fetchOverview()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await user.getProfile()
      if (res.success) {
        setProfile(res.data)
      }
    } catch (error) {
      showToast('获取用户信息失败', 'error')
    }
  }

  const fetchOverview = async () => {
    try {
      const res = await user.getOverview()
      if (res.success) {
        setOverview(res.data)
      }
    } catch (error) {
      // 静默失败
    }
  }

  const handleLogout = () => {
    logout()
    showToast('已退出登录', 'success')
    navigate('/login')
  }

  const menuItems = [
    { icon: '💳', label: '信用卡管理', path: '/credit-cards' },
    { icon: '🧧', label: '我的红包', path: '/red-packets' },
    { icon: '🎫', label: '优惠券', path: '/coupons' },
    { icon: '📊', label: '公积金查询', path: '/housing-fund' },
  ]

  if (!profile) {
    return <Loading />
  }

  return (
    <div className="page">
      <Header title="个人中心" />
      <div style={{ padding: '20px' }}>
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px'
              }}
            >
              👤
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                {profile.nickname || authUser?.nickname || '用户'}
              </h3>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>
                {profile.phone || ''}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <span style={{
                  padding: '2px 8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  Lv.{profile.level || 1}
                </span>
                <span style={{
                  padding: '2px 8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  成长值 {profile.growth_value || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {overview && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 className="section-title">资产概览</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>总额度</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: '#333' }}>
                  ¥{(overview.total_credit_limit || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>已使用</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: '#ff6b6b' }}>
                  ¥{(overview.total_used_limit || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>待还款</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: '#faad14' }}>
                  {overview.unpaid_bill_count || 0}笔
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="section-title">常用功能</h3>
          {menuItems.map((item) => (
            <div
              key={item.path}
              className="list-item"
              onClick={() => navigate(item.path)}
              style={{ cursor: 'pointer' }}
            >
              <div className="flex-between" style={{ width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                  <span style={{ fontSize: '14px', color: '#333' }}>{item.label}</span>
                </div>
                <span style={{ color: '#ccc' }}>›</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            className="btn btn-outline"
            style={{ width: '100%', color: '#ff6b6b', borderColor: '#ff6b6b' }}
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
