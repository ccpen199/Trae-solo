import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { consultApi } from '../api'

const ConsultDetail = ({ showToast }) => {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [data, setData] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewContent, setReviewContent] = useState('')
  const [complaint, setComplaint] = useState('')
  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    loadDetail()
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [orderId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (data?.consultation?.status === 'waiting') {
      pollIntervalRef.current = setInterval(() => {
        loadDetail(true)
      }, 2000)
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [data?.consultation?.status])

  const loadDetail = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await consultApi.getDetail(orderId)
      if (res.success) {
        setData(res.data)
        setMessages(res.data.messages || [])
      } else {
        if (res.message === '未登录' || res.message === '登录已过期') {
          navigate('/login')
          return
        }
        setError(res.message || '加载失败')
      }
    } catch (error) {
      const status = error.response?.status
      if (status === 401) {
        navigate('/login')
        return
      }
      setError('网络错误，请重试')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    if (!data?.consultation?.id) return

    setSending(true)
    try {
      const res = await consultApi.sendMessage(data.consultation.id, input.trim())
      if (res.success) {
        setMessages(prev => [...prev, res.data])
        setInput('')
        
        setTimeout(() => {
          if (data?.lawyer) {
            setMessages(prev => [...prev, {
              id: Date.now(),
              sender_type: 'lawyer',
              content: '感谢您的提问，我正在分析您的问题，稍后为您详细解答。',
              created_at: new Date().toISOString()
            }])
          }
        }, 2000)
      }
    } catch (error) {
      showToast('发送失败')
    } finally {
      setSending(false)
    }
  }

  const submitReview = async () => {
    if (rating === 0) {
      showToast('请选择评分')
      return
    }

    try {
      const res = await consultApi.submitReview(orderId, {
        rating,
        content: reviewContent,
        complaint
      })
      if (res.success) {
        showToast('评价提交成功')
        setShowReview(false)
        loadDetail()
      }
    } catch (error) {
      showToast('提交失败')
    }
  }

  if (loading) {
    return (
      <div className="loading" style={{ paddingTop: 100 }}>
        <div className="spinner"></div>
        <p style={{ marginTop: 16, color: '#666' }}>正在加载咨询信息...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 100, minHeight: '100vh', background: '#f5f7fa' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>😕</div>
        <h3 style={{ color: '#333', marginBottom: 12 }}>加载失败</h3>
        <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>{error}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => loadDetail()}>
            重试
          </button>
          <button className="btn" style={{ width: 'auto', background: '#e8e8e8', color: '#333' }} onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
        <p style={{ color: '#666', marginBottom: 24 }}>咨询不存在</p>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    )
  }

  const { order, consultation, lawyer, questionType } = data

  if (showReview) {
    return (
      <div className="page">
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setShowReview(false)}>←</span>
            <h1>服务评价</h1>
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', marginTop: 24 }}>
          <div className="lawyer-avatar" style={{ margin: '0 auto 16px' }}>
            {lawyer?.name?.charAt(0) || '律'}
          </div>
          <h3>{lawyer?.name || '专业律师'}</h3>
          <p style={{ color: '#666', marginTop: 4 }}>{questionType?.name || '法律咨询'}</p>
        </div>

        <h3 style={{ margin: '24px 0 16px', textAlign: 'center', color: '#333' }}>
          对本次服务打个分吧
        </h3>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${rating >= star ? 'active' : ''}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          className="input"
          style={{ minHeight: 100, marginTop: 24 }}
          placeholder="请输入您的评价内容（选填）"
          value={reviewContent}
          onChange={(e) => setReviewContent(e.target.value)}
        />

        <h4 style={{ margin: '24px 0 12px', color: '#666' }}>投诉建议（选填）</h4>
        <textarea
          className="input"
          style={{ minHeight: 80 }}
          placeholder="如有任何问题，请在此说明..."
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
        />

        <button
          className="btn btn-primary"
          style={{ marginTop: 24 }}
          onClick={submitReview}
        >
          提交评价
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="header" style={{ margin: 0, borderRadius: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
          <div>
            <h1 style={{ fontSize: 18 }}>{lawyer?.name || '专业律师'}</h1>
            <p style={{ fontSize: 12, opacity: 0.9 }}>
              {lawyer?.specialty || questionType?.name || '在线咨询'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px', background: '#f5f7fa', fontSize: 13, color: '#666' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>订单号: {order.id.slice(0, 8)}...</span>
          {order.is_free && <span style={{ color: '#52c41a', fontWeight: 600 }}>免费咨询</span>}
        </div>
      </div>

      <div className="messages" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {consultation.status === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h3 style={{ color: '#333', marginBottom: 8 }}>正在为您匹配律师</h3>
            <p style={{ color: '#666', fontSize: 14 }}>请稍候，律师即将接入...</p>
            <p style={{ color: '#52c41a', fontSize: 12, marginTop: 8 }}>5秒未接单自动升级免费咨询</p>
          </div>
        )}
        {consultation.status !== 'waiting' && messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <p>开始您的法律咨询吧</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.sender_type === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 16
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: msg.sender_type === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.sender_type === 'user' ? '#667eea' : 'white',
                color: msg.sender_type === 'user' ? 'white' : '#333',
                border: msg.sender_type !== 'user' ? '1px solid #e8e8e8' : 'none'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {consultation.status !== 'completed' ? (
        <div style={{ display: 'flex', padding: 12, background: 'white', gap: 8 }}>
          <input
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #e8e8e8',
              borderRadius: 20,
              outline: 'none'
            }}
            placeholder="请输入您的问题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: '#667eea',
              color: 'white',
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.7 : 1
            }}
            onClick={sendMessage}
            disabled={sending}
          >
            ↑
          </button>
        </div>
      ) : (
        <div style={{ padding: 16, background: 'white' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowReview(true)}
          >
            评价服务
          </button>
        </div>
      )}
    </div>
  )
}

export default ConsultDetail
