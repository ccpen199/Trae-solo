import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { user } from '../api'
import Header from '../components/Header'
import Loading from '../components/Loading'

function RedPacket() {
  const { showToast, setLoading } = useAppStore()
  const [packets, setPackets] = useState([])
  const [activeTab, setActiveTab] = useState('unused')

  useEffect(() => {
    fetchRedPackets()
  }, [activeTab])

  const fetchRedPackets = async () => {
    try {
      setLoading(true)
      const res = await user.getRedPackets({ status: activeTab })
      if (res.success) {
        setPackets(res.data || [])
      }
    } catch (error) {
      showToast('获取红包列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Header title="我的红包" />
      <div style={{ padding: '20px' }}>
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'unused' ? 'active' : ''}`}
            onClick={() => setActiveTab('unused')}
          >
            未使用
          </div>
          <div
            className={`tab ${activeTab === 'used' ? 'active' : ''}`}
            onClick={() => setActiveTab('used')}
          >
            已使用
          </div>
          <div
            className={`tab ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            已过期
          </div>
        </div>

        {packets.length > 0 ? (
          packets.map((packet) => (
            <div
              key={packet.id}
              className="card"
              style={{
                background: activeTab === 'unused' ? 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)' : '#f5f5f5',
                color: activeTab === 'unused' ? 'white' : '#999'
              }}
            >
              <div className="flex-between" style={{ alignItems: 'center' }}>
                <div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '4px',
                    color: activeTab === 'unused' ? 'white' : '#666'
                  }}>
                    {packet.name}
                  </h4>
                  <p style={{ fontSize: '12px', opacity: 0.9 }}>
                    满{packet.min_use_amount}元可用
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    fontSize: '32px',
                    fontWeight: '600',
                    color: activeTab === 'unused' ? 'white' : '#999'
                  }}>
                    ¥{packet.amount}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card empty-state">
            <div className="icon">🧧</div>
            <p>暂无{activeTab === 'unused' ? '可用' : activeTab === 'used' ? '已使用' : '过期'}红包</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RedPacket
