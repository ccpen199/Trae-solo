import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { lawyerApi } from '../api'

const LawyerDetail = ({ showToast }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { token } = useStore()
  const [lawyer, setLawyer] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConsult, setShowConsult] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [consultLoading, setConsultLoading] = useState(false)

  useEffect(() => {
    loadDetail()
  }, [id])

  const loadDetail = async () => {
    try {
      const res = await lawyerApi.getDetail(id)
      if (res.success) {
        setLawyer(res.data.lawyer)
        setReviews(res.data.reviews || [])
      }
    } catch (error) {
      showToast('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleConsult = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    if (!selectedType) {
      showToast('请选择咨询类型')
      return
    }

    setConsultLoading(true)
    try {
      const res = await lawyerApi.createConsult({
        lawyer_id: id,
        consult_type: selectedType
      })
      if (res.success) {
        showToast('下单成功')
        setShowConsult(false)
        setSelectedType('')
        navigate(`/consult/${res.data.orderId}`)
      } else {
        showToast(res.message || '失败')
      }
    } catch (error) {
      showToast('网络错误')
    } finally {
      setConsultLoading(false)
    }
  }

  const consultTypes = [
    { key: 'quick', label: '快速咨询', price: lawyer?.quick_consult_price },
    { key: 'text', label: '图文咨询', price: lawyer?.text_consult_price },
    { key: 'offline', label: '线下约见', price: lawyer?.offline_price },
    { key: 'document', label: '文书起草', price: lawyer?.document_price }
  ]

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!lawyer) {
    return (
      <div className="empty">
        <p>律师不存在</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
          <h1>律师详情</h1>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', marginTop: -10 }}>
        <div className="lawyer-avatar" style={{ margin: '0 auto 16px', width: 80, height: 80, fontSize: 32 }}>
          {lawyer.name?.charAt(0) || '律'}
        </div>
        <h2>{lawyer.name}</h2>
        <p style={{ color: '#666', marginTop: 4 }}>{lawyer.specialty} · {lawyer.location}</p>
        <p style={{ color: '#999', marginTop: 8, fontSize: 14 }}>从业{lawyer.experience_years}年</p>
        <div style={{ marginTop: 12, color: '#faad14' }}>
          ⭐ {lawyer.rating?.toFixed(1) || '5.0'} 分
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h4 style={{ marginBottom: 12, color: '#333' }}>个人简介</h4>
        <p style={{ color: '#666', lineHeight: 1.6, fontSize: 14 }}>
          {lawyer.description || '专业资深律师，在各自领域有丰富的实践经验，擅长处理各类复杂案件，为当事人提供专业、高效的法律服务。'}
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 16, color: '#333' }}>服务项目</h4>
          {consultTypes.map((type) => (
            <div
              key={type.key}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                marginBottom: 8,
                cursor: 'pointer',
                border: selectedType === type.key ? '2px solid #667eea' : '2px solid transparent'
              }}
              onClick={() => {
                setSelectedType(type.key);
                setShowConsult(true);
              }}
            >
              <span>{type.label}</span>
              <span style={{ color: '#667eea', fontWeight: 600 }}>¥{type.price}</span>
            </div>
          ))}
        </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h4 style={{ marginBottom: 16, color: '#333' }}>用户评价 ({reviews.length})</h4>
        {reviews.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无评价</p>
        ) : (
          reviews.slice(0, 3).map((review) => (
            <div key={review.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#333' }}>{review.user_name || '用户'}</span>
                <span style={{ color: '#faad14' }}>⭐ {review.rating}分</span>
              </div>
              {review.content && (
                <p style={{ color: '#666', marginTop: 8, fontSize: 13 }}>{review.content}</p>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ height: 120 }} />

      <div style={{
        position: 'fixed',
        bottom: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 448,
        padding: 16,
        background: 'white',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        borderRadius: '16px 16px 0 0'
      }}>
        <button
          className="btn btn-primary"
          onClick={() => setShowConsult(true)}
        >
          立即咨询
        </button>
      </div>

      {showConsult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 1000
        }}>
          <div style={{
            width: '100%',
            maxWidth: 480,
            margin: '0 auto',
            background: 'white',
            borderRadius: '16px 16px 0 0',
            padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>选择咨询类型</h3>
              <span 
                style={{ cursor: 'pointer', fontSize: 24 }} 
                onClick={() => {
                  setShowConsult(false);
                  setSelectedType('');
                }}
              >×</span>
            </div>
            
            {consultTypes.map((type) => (
              <div
                key={type.key}
                className="card"
                style={{
                  cursor: 'pointer',
                  marginBottom: 12,
                  border: selectedType === type.key ? '2px solid #667eea' : '2px solid transparent'
                }}
                onClick={() => setSelectedType(type.key)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{type.label}</span>
                  <span style={{ color: '#667eea', fontWeight: 600 }}>¥{type.price}</span>
                </div>
              </div>
            ))}

            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={handleConsult}
              disabled={consultLoading}
            >
              {consultLoading ? '处理中...' : '确认下单'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LawyerDetail
