import React from 'react'
import { Link } from 'react-router-dom'
import useStore from '../store'

const Member = () => {
  const user = useStore(state => state.user)

  if (!user) return null

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div className="card" style={{ padding: 40, marginBottom: 20, textAlign: 'center', background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👑</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          {user.is_vip ? 'VIP会员' : '立即开通会员'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 24 }}>
          {user.is_vip ? '尊享会员专属权益' : '开通会员享受专属优惠'}
        </p>
        {!user.is_vip && (
          <button className="btn" style={{ background: '#fff', color: '#faad14', fontWeight: 600 }}>
            开通会员
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>会员权益</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { icon: '💎', title: '专属折扣', desc: '全场商品9折起' },
            { icon: '🎁', title: '专属优惠券', desc: '每月领取专属券包' },
            { icon: '🚚', title: '免邮特权', desc: '每月免费配送' },
            { icon: '⚡', title: '优先客服', desc: '专属客服通道' },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 24, background: '#fafafa', borderRadius: 8 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{item.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ color: '#999', fontSize: 13 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Member
