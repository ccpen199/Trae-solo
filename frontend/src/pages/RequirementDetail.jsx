import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import api from '../api'

export default function RequirementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useStore()
  const [requirement, setRequirement] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = () => {
    api.get(`/requirements/${id}`).then(res => {
      setRequirement(res.data)
      if (user && user.id === res.data.client_id) {
        api.get(`/requirements/${id}/matches`).then(mRes => setMatches(mRes.data))
      }
      setLoading(false)
    })
  }

  const handleAcceptMatch = async (matchId) => {
    try {
      await api.post(`/requirements/${id}/accept-match/${matchId}`)
      loadData()
    } catch (err) {
      alert('操作失败')
    }
  }

  const handleCreateOrder = async () => {
    try {
      const res = await api.post(`/orders/from-requirement/${id}`)
      navigate(`/orders/${res.data.id}`)
    } catch (err) {
      alert('创建订单失败')
    }
  }

  if (loading || !requirement) {
    return <div className="container" style={{ padding: '40px' }}>加载中...</div>
  }

  const isOwner = user && user.id === requirement.client_id

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>{requirement.title}</h1>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--gray-600)' }}>
                  <span>{requirement.category}</span>
                  <span>📍 {requirement.location || '未指定'}</span>
                  <span>📅 {requirement.service_date ? new Date(requirement.service_date).toLocaleDateString() : '未指定'}</span>
                </div>
              </div>
              <span className={`status-badge status-${requirement.status}`}>{requirement.status}</span>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--gray-50)',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '4px' }}>预算</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>
                ¥{requirement.budget_fixed || `${requirement.budget_min} - ${requirement.budget_max}`}
              </div>
            </div>

            <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>需求描述</h3>
            <p style={{ color: 'var(--gray-700)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              {requirement.description}
            </p>

            {requirement.deliverables && (
              <>
                <h3 style={{ fontSize: '18px', margin: '24px 0 12px' }}>交付物</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {JSON.parse(requirement.deliverables || '[]').map((item, i) => (
                    <span key={i} className="skill-tag">{item}</span>
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--gray-200)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {requirement.client_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: '500' }}>{requirement.client_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                    发布于 {new Date(requirement.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isOwner && matches.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>智能匹配结果</h2>
              {matches.map(match => (
                <div key={match.id} className="match-card">
                  <div className="match-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--gray-200)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: '600'
                      }}>
                        {match.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{match.username}</div>
                        <div style={{ fontSize: '14px', color: 'var(--warning)' }}>
                          ⭐ {match.rating?.toFixed(1) || '5.0'} ({match.rating_count}评价)
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="match-score">{match.match_score.toFixed(0)}分</div>
                      <div className="match-score-label">匹配度</div>
                    </div>
                  </div>
                  <div className="match-details">
                    <div className="match-detail-item">
                      <div className="match-detail-value">{match.skill_match?.toFixed(0)}</div>
                      <div className="match-detail-label">技能匹配</div>
                    </div>
                    <div className="match-detail-item">
                      <div className="match-detail-value">{match.distance_match?.toFixed(0)}</div>
                      <div className="match-detail-label">距离匹配</div>
                    </div>
                    <div className="match-detail-item">
                      <div className="match-detail-value">{match.rating_match?.toFixed(0)}</div>
                      <div className="match-detail-label">评分匹配</div>
                    </div>
                    <div className="match-detail-item">
                      <div className="match-detail-value">{match.response_match?.toFixed(0)}</div>
                      <div className="match-detail-label">响应匹配</div>
                    </div>
                  </div>
                  {requirement.status === 'open' && (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => handleAcceptMatch(match.id)}
                    >
                      选择此服务者
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card">
            {isOwner && requirement.status === 'matched' && (
              <button
                className="btn btn-success"
                style={{ width: '100%', marginBottom: '12px' }}
                onClick={handleCreateOrder}
              >
                创建订单
              </button>
            )}
            {!isOwner && (
              <button className="btn btn-primary" style={{ width: '100%' }}>
                投标接单
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
