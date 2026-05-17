import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { consultApi } from '../api'

const TextConsult = ({ showToast }) => {
  const navigate = useNavigate()
  const [questionTypes, setQuestionTypes] = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTypes()
  }, [])

  const loadTypes = async () => {
    try {
      const res = await consultApi.getQuestionTypes()
      if (res.success) setQuestionTypes(res.data)
    } catch (error) {
      showToast('加载失败')
    }
  }

  const handleSubmit = async () => {
    if (!selectedType) {
      showToast('请选择问题类型')
      return
    }
    if (!description || description.length < 10) {
      showToast('请详细描述您的问题（至少10字）')
      return
    }

    setLoading(true)
    try {
      const res = await consultApi.createText({
        question_type_id: selectedType.id,
        description
      })
      if (res.success) {
        showToast('提交成功')
        navigate(`/consult/${res.data.orderId}`)
      } else {
        showToast(res.message || '提交失败')
      }
    } catch (error) {
      showToast('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
          <h1>图文咨询</h1>
        </div>
        <p style={{ opacity: 0.9, marginTop: 8, fontSize: 14 }}>
          详细描述您的问题，律师将为您专业解答
        </p>
      </div>

      <h3 style={{ marginBottom: 16, color: '#333' }}>选择问题类型</h3>
      <div className="grid-4">
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
              <span style={{ fontSize: 28 }}>{type.icon}</span>
              <p style={{ marginTop: 4, fontSize: 13 }}>{type.name}</p>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '24px 0 16px', color: '#333' }}>问题描述</h3>
      <textarea
        className="input"
        style={{ minHeight: 150, resize: 'vertical' }}
        placeholder="请详细描述您遇到的法律问题，包括时间、地点、经过等信息，以便律师更好地为您解答..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={1000}
      />
      <p style={{ textAlign: 'right', color: '#999', fontSize: 12, marginTop: -8 }}>
        {description.length}/1000
      </p>

      <div className="card" style={{ marginTop: 24 }}>
        <h4 style={{ marginBottom: 16, color: '#333' }}>费用说明</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#666' }}>基础费用</span>
          <span>¥{selectedType?.base_price || 49.9}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#666' }}>服务时长</span>
          <span>48小时不限次数</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#666' }}>服务内容</span>
          <span>图文解答 + 证据指导</span>
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ marginTop: 24 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? '提交中...' : '提交并支付'}
      </button>
    </div>
  )
}

export default TextConsult
