import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { consultApi, dailyLawApi, lawyerApi } from '../api'

const Home = ({ showToast }) => {
  const navigate = useNavigate()
  const { user, token } = useStore()
  const [questionTypes, setQuestionTypes] = useState([])
  const [dailyLaw, setDailyLaw] = useState(null)
  const [lawyers, setLawyers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        consultApi.getQuestionTypes(),
        dailyLawApi.get(),
        lawyerApi.getList({ limit: 4 })
      ])

      const typesRes = results[0].status === 'fulfilled' ? results[0].value : null
      const lawRes = results[1].status === 'fulfilled' ? results[1].value : null
      const lawyersRes = results[2].status === 'fulfilled' ? results[2].value : null

      if (typesRes?.success) setQuestionTypes(typesRes.data)
      if (lawRes?.success) setDailyLaw(lawRes.data)
      if (lawyersRes?.success) setLawyers(lawyersRes.data)
    } catch (error) {
      console.error('加载数据出错:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickConsult = (typeId) => {
    if (!token) {
      navigate('/login')
      return
    }
    navigate(`/quick-consult?typeId=${typeId}`)
  }

  const handleTextConsult = () => {
    if (!token) {
      navigate('/login')
      return
    }
    navigate('/text-consult')
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
        <h1>快问律师</h1>
        <p style={{ opacity: 0.9, marginTop: 8 }}>
          {user ? `欢迎您，${user.nickname || '用户'}` : '专业律师在线解答法律问题'}
        </p>
      </div>

      {dailyLaw && (
        <div className="daily-law">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span>📖</span>
            <span style={{ fontWeight: 600 }}>每日一法</span>
          </div>
          <h4 style={{ marginBottom: 8 }}>{dailyLaw.title}</h4>
          <p style={{ fontSize: 14, opacity: 0.95, lineHeight: 1.6 }}>{dailyLaw.content}</p>
        </div>
      )}

      <h3 style={{ marginBottom: 16, color: '#333' }}>快速咨询</h3>
      <div className="grid-4">
        {questionTypes.slice(0, 4).map((type) => (
          <div
            key={type.id}
            className="menu-item"
            onClick={() => handleQuickConsult(type.id)}
          >
            <span className="menu-icon">{type.icon}</span>
            <span className="menu-text">{type.name}</span>
            <span style={{ fontSize: 12, color: '#667eea', marginTop: 4 }}>
              ¥{type.base_price}
            </span>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '24px 0 16px', color: '#333' }}>服务类型</h3>
      <div className="grid-2">
        <div className="menu-item" onClick={handleTextConsult}>
          <span className="menu-icon">📝</span>
          <span className="menu-text">图文咨询</span>
          <span style={{ fontSize: 12, color: '#999', marginTop: 4 }}>不限时详询</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/lawyers')}>
          <span className="menu-icon">👨‍⚖️</span>
          <span className="menu-text">本地律师</span>
          <span style={{ fontSize: 12, color: '#999', marginTop: 4 }}>专业律师服务</span>
        </div>
      </div>

      <h3 style={{ margin: '24px 0 16px', color: '#333' }}>推荐律师</h3>
      {lawyers.map((lawyer) => (
        <div
          key={lawyer.id}
          className="card"
          style={{ display: 'flex', gap: 12, cursor: 'pointer' }}
          onClick={() => navigate(`/lawyers/${lawyer.id}`)}
        >
          <div className="lawyer-avatar">
            {lawyer.name?.charAt(0) || '律'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: '#333' }}>{lawyer.name}</h4>
              <span className="rating">⭐ {lawyer.rating?.toFixed(1) || '5.0'}</span>
            </div>
            <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              {lawyer.specialty} · {lawyer.location} · {lawyer.experience_years}年经验
            </p>
            <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
              快速咨询 ¥{lawyer.quick_consult_price}起
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Home
