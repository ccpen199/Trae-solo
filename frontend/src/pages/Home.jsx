import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

const categories = [
  { name: '视频剪辑', icon: '🎬' },
  { name: '家居收纳', icon: '🏠' },
  { name: '陪诊服务', icon: '🏥' },
  { name: '家电维修', icon: '🔧' },
  { name: '家政保洁', icon: '🧹' },
  { name: '搬家服务', icon: '📦' },
  { name: '宠物照料', icon: '🐾' },
  { name: '家教辅导', icon: '📚' },
  { name: 'IT技术', icon: '💻' },
  { name: '设计创意', icon: '🎨' },
]

export default function Home() {
  const [providers, setProviders] = useState([])
  const [requirements, setRequirements] = useState([])
  const [stats, setStats] = useState({ users: 0, requirements: 0, orders: 0, goodRate: 95 })
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/users/providers?limit=6').then(res => setProviders(res.data))
    api.get('/requirements/all?limit=6').then(res => setRequirements(res.data))
    api.get('/stats').then(res => setStats(res.data))
  }, [])

  const handleCategoryClick = (category) => {
    navigate(`/providers?category=${encodeURIComponent(category)}`)
  }

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>专业技能，精准匹配</h1>
          <p>连接优质服务者与需求方，让专业的人做专业的事</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/post-requirement" className="btn btn-success" style={{ padding: '14px 32px', fontSize: '16px' }}>
              发布需求
            </Link>
            <Link to="/providers" className="btn" style={{ background: 'white', color: '#2563eb', padding: '14px 32px', fontSize: '16px' }}>
              寻找服务
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'white', padding: '40px 0' }}>
        <div className="container">
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div className="stat-card" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
              <div className="stat-value">{stats.users}+</div>
              <div className="stat-label">注册用户</div>
            </div>
            <div className="stat-card" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
              <div className="stat-value">{stats.requirements}+</div>
              <div className="stat-label">服务需求</div>
            </div>
            <div className="stat-card" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
              <div className="stat-value">{stats.orders}+</div>
              <div className="stat-label">完成订单</div>
            </div>
            <div className="stat-card" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
              <div className="stat-value">{stats.goodRate || 95}%</div>
              <div className="stat-label">好评率</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">服务分类</h2>
          <div className="categories-grid">
            {categories.map(cat => (
              <div key={cat.name} className="category-card" onClick={() => handleCategoryClick(cat.name)}>
                <div className="category-icon">{cat.icon}</div>
                <div className="category-name">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'white' }}>
        <div className="container">
          <h2 className="section-title">热门服务者</h2>
          <div className="providers-grid">
            {providers.map(provider => (
              <Link to={`/providers/${provider.id}`} key={provider.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="provider-card">
                  <div className="provider-header">
                    <div className="provider-avatar">
                      {provider.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="provider-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ margin: 0 }}>{provider.username}</h3>
                        {provider.is_verified ? (
                          <span title="已实名认证" style={{ color: '#10b981', fontSize: '14px' }}>✓ 已认证</span>
                        ) : (
                          <span title="未实名认证" style={{ color: '#f59e0b', fontSize: '14px' }}>⏳ 认证中</span>
                        )}
                      </div>
                      <div className="provider-rating">
                        ⭐ {provider.rating?.toFixed(1) || '5.0'}
                        <span style={{ color: '#6b7280' }}>({provider.rating_count || 0}评价)</span>
                      </div>
                    </div>
                  </div>
                  <div className="provider-skills">
                    {provider.skills?.split(',').slice(0, 3).map((skill, i) => (
                      <span key={i} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#6b7280', marginTop: '12px' }}>
                    <div>📍 {provider.location || '未设置位置'}</div>
                    <div>🎯 服务{provider.service_radius || 5}km</div>
                    <div>⚡ 响应{provider.response_time || 30}分钟</div>
                    <div>📁 {provider.portfolio_count || 0}个作品</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">最新需求</h2>
          <div className="grid">
            {requirements.map(req => (
              <Link to={`/requirements/${req.id}`} key={req.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="requirement-card">
                  <div className="requirement-title">{req.title}</div>
                  <div className="requirement-meta">
                    <span>{req.category}</span>
                    <span>📍 {req.location || '未指定'}</span>
                  </div>
                  <p style={{ color: 'var(--gray-600)', fontSize: '13px', margin: '8px 0', lineHeight: '1.5' }}>
                    {req.description?.length > 60 ? req.description.slice(0, 60) + '...' : req.description}
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
                      📦 交付物: {req.deliverables?.length > 20 ? req.deliverables.slice(0, 20) + '...' : req.deliverables}
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
        </div>
      </section>

      <section className="section" style={{ background: 'var(--gray-900)', color: 'white' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>加入我们，开启技能变现之旅</h2>
          <p style={{ opacity: 0.8, marginBottom: '32px', fontSize: '18px' }}>
            无论您是专业服务者还是有需求的客户，这里都是您的最佳选择
          </p>
          <Link to="/register" className="btn btn-success" style={{ padding: '14px 40px', fontSize: '16px' }}>
            立即注册
          </Link>
        </div>
      </section>
    </div>
  )
}
