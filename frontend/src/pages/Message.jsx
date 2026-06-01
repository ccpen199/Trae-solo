import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { message as messageApi } from '../api'
import Header from '../components/Header'
import Loading from '../components/Loading'

const categories = [
  { key: 'system', name: '系统通知', icon: '🔔' },
  { key: 'fresh', name: '新鲜事', icon: '🔥' },
  { key: 'announcement', name: '公告', icon: '📢' },
  { key: 'activity', name: '活动中心', icon: '🎁' },
  { key: 'interaction', name: '互动消息', icon: '💬' }
]

function Message() {
  const { showToast, setLoading } = useAppStore()
  const [activeCategory, setActiveCategory] = useState('system')
  const [messages, setMessages] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})

  useEffect(() => {
    fetchCategories()
    fetchMessages(activeCategory)
  }, [activeCategory])

  const fetchCategories = async () => {
    try {
      const res = await messageApi.getCategories()
      if (res.success) {
        const counts = {}
        res.data.forEach(item => {
          counts[item.key] = item.unread_count || 0
        })
        setUnreadCounts(counts)
      }
    } catch (error) {
      // 静默失败
    }
  }

  const fetchMessages = async (category) => {
    try {
      setLoading(true)
      const res = await messageApi.getList({ category })
      if (res.success) {
        setMessages(res.data?.list || [])
      }
    } catch (error) {
      showToast('获取消息失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await messageApi.markRead(id)
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, is_read: true } : msg
      ))
    } catch (error) {
      showToast('标记已读失败', 'error')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await messageApi.markAllRead(activeCategory)
      setMessages(messages.map(msg => ({ ...msg, is_read: true })))
      setUnreadCounts({
        ...unreadCounts,
        [activeCategory]: 0
      })
      showToast('全部已读', 'success')
    } catch (error) {
      showToast('标记失败', 'error')
    }
  }

  return (
    <div className="page">
      <Header 
        title="消息中心" 
        rightContent={
          <button 
            onClick={handleMarkAllRead}
            style={{
              color: 'white',
              fontSize: '14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            全部已读
          </button>
        }
      />
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '20px',
                background: activeCategory === cat.key ? 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)' : '#f0f0f0',
                color: activeCategory === cat.key ? 'white' : '#666',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <span style={{ marginRight: '4px' }}>{cat.icon}</span>
              {cat.name}
              {unreadCounts[cat.key] > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  background: '#ff4d4f',
                  color: 'white',
                  fontSize: '11px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCounts[cat.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="card"
              onClick={() => handleMarkRead(msg.id)}
              style={{
                cursor: 'pointer',
                opacity: msg.is_read ? 0.7 : 1
              }}
            >
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>
                  {!msg.is_read && (
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ff4d4f',
                      marginRight: '8px'
                    }} />
                  )}
                  {msg.title}
                </h4>
                <span style={{ fontSize: '12px', color: '#999' }}>
                  {msg.created_at}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                {msg.content}
              </p>
            </div>
          ))
        ) : (
          <div className="card empty-state">
            <div className="icon">📭</div>
            <p>暂无消息</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Message
