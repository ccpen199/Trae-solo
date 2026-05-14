import React, { useEffect, useState } from 'react'
import { channelApi } from '../../api'

const Channels = () => {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      const res = await channelApi.getList()
      if (res.success) {
        setChannels(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (channel) => {
    try {
      const res = await channelApi.update(channel.id, { is_active: !channel.is_active })
      if (res.success) {
        loadChannels()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>📱 频道管理</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {channels.map(channel => (
          <div key={channel.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 32 }}>{channel.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{channel.name}</div>
                <div style={{ color: '#999', fontSize: 12 }}>{channel.code}</div>
              </div>
              <button
                className={`btn ${channel.is_active ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: 12 }}
                onClick={() => handleToggle(channel)}
              >
                {channel.is_active ? '已启用' : '已禁用'}
              </button>
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>排序：{channel.sort_order}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Channels
