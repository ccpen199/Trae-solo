import React from 'react'
import useStore from '../store'

const Points = () => {
  const user = useStore(state => state.user)

  if (!user) return null

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div className="card" style={{ padding: 40, marginBottom: 20, textAlign: 'center', background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💎</div>
        <h1 style={{ fontSize: 48, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          {user.points}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)' }}>可用积分</p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>积分说明</h2>
        <div style={{ color: '#666', lineHeight: 2 }}>
          <p>• 购物可获得积分，每消费1元获得1积分</p>
          <p>• 签到可获得积分奖励</p>
          <p>• 积分可在购物时抵扣现金（100积分=1元）</p>
          <p>• 积分有效期为1年</p>
        </div>
      </div>
    </div>
  )
}

export default Points
