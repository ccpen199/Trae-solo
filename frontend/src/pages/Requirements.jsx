import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Requirements() {
  const [requirements, setRequirements] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    api.get('/skills/categories').then(res => setCategories(res.data))
    loadRequirements()
  }, [selectedCategory])

  const loadRequirements = () => {
    const params = { status: 'open' }
    if (selectedCategory) params.category = selectedCategory
    api.get('/requirements/all', { params }).then(res => setRequirements(res.data))
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>需求广场</h1>
        <Link to="/post-requirement" className="btn btn-primary">发布需求</Link>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedCategory('')}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid">
        {requirements.map(req => (
          <Link to={`/requirements/${req.id}`} key={req.id} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="requirement-card">
              <div className="requirement-title">{req.title}</div>
              <div className="requirement-meta">
                <span>{req.category}</span>
                <span>📍 {req.location || '未指定'}</span>
              </div>
              <p style={{ color: 'var(--gray-600)', fontSize: '14px', margin: '12px 0', lineHeight: '1.5' }}>
                {req.description?.length > 100 ? req.description.slice(0, 100) + '...' : req.description}
              </p>
              <div className="requirement-budget">
                预算: ¥{req.budget_fixed || `${req.budget_min}-${req.budget_max}`}
              </div>
              {req.delivery_deadline && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  ⏰ 截止日期: {new Date(req.delivery_deadline).toLocaleDateString()}
                </div>
              )}
              {req.deliverables && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  📦 交付物: {req.deliverables?.length > 25 ? req.deliverables.slice(0, 25) + '...' : req.deliverables}
                </div>
              )}
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`status-badge status-${req.status}`}>
                  {req.status === 'open' ? '待接单' : req.status === 'matched' ? '已匹配' : req.status}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {requirements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          暂无需求
        </div>
      )}
    </div>
  )
}
