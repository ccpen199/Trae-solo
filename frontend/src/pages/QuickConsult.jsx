import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { consultApi } from '../api'

const QuickConsult = ({ showToast }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const typeId = searchParams.get('typeId')
  
  const [questionTypes, setQuestionTypes] = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [isFree, setIsFree] = useState(false)
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    loadTypes()
  }, [])

  useEffect(() => {
    if (typeId && questionTypes.length > 0) {
      const type = questionTypes.find(t => t.id === parseInt(typeId))
      if (type) setSelectedType(type)
    }
  }, [typeId, questionTypes])

  useEffect(() => {
    if (waiting && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (waiting && countdown === 0) {
      setIsFree(true)
      setTimeout(() => {
        navigate(`/consult/${orderId}`)
      }, 1000)
    }
  }, [waiting, countdown, orderId, navigate])

  const loadTypes = async () => {
    try {
      const res = await consultApi.getQuestionTypes()
      if (res.success) setQuestionTypes(res.data)
    } catch (error) {
      showToast('加载失败')
    }
  }

  const handleConfirm = async () => {
    if (!selectedType) {
      showToast('请选择问题类型')
      return
    }

    setLoading(true)
    try {
      const res = await consultApi.createQuick(selectedType.id)
      if (res.success) {
        setOrderId(res.data.orderId)
        setWaiting(true)
      } else {
        showToast(res.message || '创建失败')
      }
    } catch (error) {
      showToast('网络错误')
    } finally {
      setLoading(false)
    }
  }

  if (waiting) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>⏳</div>
        <h2 style={{ color: '#333', marginBottom: 16 }}>正在为您匹配律师</h2>
        <p style={{ color: '#666', textAlign: 'center' }}>
          {isFree ? '由于等待超时，本次咨询免费!' : `预计等待 ${countdown} 秒`}
        </p>
        {isFree && (
          <p style={{ color: '#52c41a', marginTop: 16, fontWeight: 600 }}>
            🎉 正在进入咨询...
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
          <h1>快速咨询</h1>
        </div>
      </div>

      <h3 style={{ marginBottom: 16, color: '#333' }}>选择问题类型</h3>
      <div className="grid-2">
        {questionTypes.map((type) => (
          <div
            key={type.id}
            className="card"
            style={{
              cursor: 'pointer',
              border: selectedType?.id === type.id ? '2px solid #667eea' : '2px solid transparent'
            }}
            onClick={() => setSelectedType(type)}
          >
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 32 }}>{type.icon}</span>
              <p style={{ marginTop: 8, fontWeight: 500 }}>{type.name}</p>
              <p style={{ color: '#667eea', fontSize: 14, marginTop: 4 }}>¥{type.base_price}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedType && (
        <div className="card" style={{ marginTop: 24 }}>
          <h4 style={{ marginBottom: 16, color: '#333' }}>订单确认</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#666' }}>咨询类型</span>
            <span>{selectedType.icon} {selectedType.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#666' }}>服务时长</span>
            <span>30分钟</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#666' }}>超时保障</span>
            <span style={{ color: '#52c41a' }}>5秒未接单免费咨询</span>
          </div>
          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #eee' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>应付金额</span>
            <span style={{ color: '#667eea', fontSize: 20, fontWeight: 600 }}>¥{selectedType.base_price}</span>
          </div>
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ marginTop: 24 }}
        onClick={handleConfirm}
        disabled={loading || !selectedType}
      >
        {loading ? '处理中...' : '确认下单并支付'}
      </button>
    </div>
  )
}

export default QuickConsult
