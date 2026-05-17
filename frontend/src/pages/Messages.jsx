import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { consultApi } from '../api'

const Messages = ({ showToast }) => {
  const navigate = useNavigate()
  const { token } = useStore()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      loadList()
    } else {
      setLoading(false)
    }
  }, [token])

  const loadList = async () => {
    try {
      const res = await consultApi.getList()
      if (res.success) {
        setConsultations(res.data)
      }
    } catch (error) {
      showToast('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status) => {
    const map = {
      waiting: '等待律师接单',
      in_progress: '咨询进行中',
      completed: '已完成'
    }
    return map[status] || status
  }

  const getStatusColor = (status) => {
    const map = {
      waiting: '#faad14',
      in_progress: '#52c41a',
      completed: '#999'
    }
    return map[status] || '#999'
  }

  if (!token) {
    return (
      <div className="page">
        <div className="header">
          <h1>消息</h1>
        </div>
        <div className="empty" style={{ marginTop: 60 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>💬</p>
          <p style={{ marginBottom: 20 }}>请先登录查看消息</p>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 32px' }}
            onClick={() => navigate('/login')}
          >
            去登录
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="header">
        <h1>消息</h1>
        <p style={{ opacity: 0.9, marginTop: 8, fontSize: 14 }}>
          您的咨询会话
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
          <p>暂无咨询记录</p>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 32px', marginTop: 20 }}
            onClick={() => navigate('/')}
          >
            去咨询
          </button>
        </div>
      ) : (
        consultations.map((item) => (
          <div
            key={item.id}
            className="card"
            style={{ cursor: 'pointer', marginBottom: 12 }}
            onClick={() => navigate(`/consult/${item.order_id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="lawyer-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                  {item.lawyer_name?.charAt(0) || '律'}
                </div>
                <div>
                  <h4 style={{ color: '#333' }}>{item.lawyer_name || '专业律师'}</h4>
                  <p style={{ fontSize: 13, color: '#999', marginTop: 2 }}>
                    {item.question_type_name || item.order_type || '法律咨询'}
                  </p>
                </div>
              </div>
              <span style={{ fontSize: 12, color: getStatusColor(item.status) }}>
                {getStatusText(item.status)}
              </span>
            </div>
            {item.is_free && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
                🎁 免费咨询
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default Messages
