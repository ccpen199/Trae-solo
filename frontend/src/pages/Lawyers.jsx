import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { lawyerApi, consultApi } from '../api'

const Lawyers = ({ showToast }) => {
  const navigate = useNavigate()
  const [lawyers, setLawyers] = useState([])
  const [questionTypes, setQuestionTypes] = useState([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadLawyers()
  }, [selectedSpecialty])

  const loadData = async () => {
    try {
      const [typesRes, lawyersRes] = await Promise.all([
        consultApi.getQuestionTypes(),
        lawyerApi.getList({})
      ])

      if (typesRes.success) setQuestionTypes(typesRes.data)
      if (lawyersRes.success) setLawyers(lawyersRes.data)
    } catch (error) {
      showToast('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadLawyers = async () => {
    try {
      const params = selectedSpecialty ? { specialty: selectedSpecialty } : {}
      const res = await lawyerApi.getList(params)
      if (res.success) setLawyers(res.data)
    } catch (error) {
      showToast('加载失败')
    }
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
        <h1>本地律师</h1>
        <p style={{ opacity: 0.9, marginTop: 8, fontSize: 14 }}>
          选择您身边的专业律师
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <span
          className={`card`}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            cursor: 'pointer',
            background: !selectedSpecialty ? '#667eea' : 'white',
            color: !selectedSpecialty ? 'white' : '#333'
          }}
          onClick={() => setSelectedSpecialty('')}
        >
          全部
        </span>
        {questionTypes.map((type) => (
          <span
            key={type.id}
            className={`card`}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              cursor: 'pointer',
              background: selectedSpecialty === type.name ? '#667eea' : 'white',
              color: selectedSpecialty === type.name ? 'white' : '#333'
            }}
            onClick={() => setSelectedSpecialty(type.name)}
          >
            {type.icon} {type.name}
          </span>
        ))}
      </div>

      {lawyers.map((lawyer) => (
        <div
          key={lawyer.id}
          className="card"
          style={{ cursor: 'pointer', marginBottom: 12 }}
          onClick={() => navigate(`/lawyers/${lawyer.id}`)}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="lawyer-avatar">
              {lawyer.name?.charAt(0) || '律'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ color: '#333' }}>{lawyer.name}</h4>
                <span className="rating">⭐ {lawyer.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                {lawyer.specialty} · {lawyer.location}
              </p>
              <p style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
                从业{lawyer.experience_years}年
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 8px',
                  background: '#f0f5ff',
                  color: '#667eea',
                  borderRadius: 4,
                  fontSize: 12
                }}>
                  图文 ¥{lawyer.text_consult_price}
                </span>
                <span style={{
                  padding: '4px 8px',
                  background: '#fff7e6',
                  color: '#fa8c16',
                  borderRadius: 4,
                  fontSize: 12
                }}>
                  线下 ¥{lawyer.offline_price}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {lawyers.length === 0 && (
        <div className="empty">
          <p>暂无符合条件的律师</p>
        </div>
      )}
    </div>
  )
}

export default Lawyers
