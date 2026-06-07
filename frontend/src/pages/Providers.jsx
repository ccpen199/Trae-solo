import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api'

export default function Providers() {
  const [providers, setProviders] = useState([])
  const [categories, setCategories] = useState([])
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || '')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    minRating: '',
    maxResponseTime: '',
    serviceRadius: '',
    sortBy: 'rating',
    skill: ''
  })
  const [expandedCard, setExpandedCard] = useState(null)

  useEffect(() => {
    api.get('/skills/categories').then(res => setCategories(res.data))
  }, [])

  useEffect(() => {
    loadProviders()
  }, [selectedCategory, filters])

  const loadProviders = () => {
    const params = {}
    if (selectedCategory) params.category = selectedCategory
    if (filters.minRating) params.minRating = filters.minRating
    if (filters.maxResponseTime) params.maxResponseTime = filters.maxResponseTime
    if (filters.serviceRadius) params.serviceRadius = filters.serviceRadius
    if (filters.sortBy) params.sortBy = filters.sortBy
    if (filters.skill) params.skill = filters.skill
    api.get('/users/providers', { params }).then(res => setProviders(res.data))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({ minRating: '', maxResponseTime: '', serviceRadius: '', sortBy: 'rating', skill: '' })
  }

  const hasActiveFilters = filters.minRating || filters.maxResponseTime || filters.serviceRadius || filters.skill || filters.sortBy !== 'rating'

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>寻找服务者</h1>
        <button
          className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? '收起筛选' : '高级筛选'} {hasActiveFilters ? `(${[filters.minRating && '好评率', filters.maxResponseTime && '响应速度', filters.serviceRadius && '服务半径', filters.skill && '技能'].filter(Boolean).length}项)` : ''}
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
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

      {showFilters && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: '600', fontSize: '16px' }}>组合筛选</span>
            {hasActiveFilters && (
              <button className="btn btn-outline" style={{ fontSize: '13px', padding: '4px 12px' }} onClick={resetFilters}>
                重置筛选
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                🔍 技能关键词
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="如：搬家、宠物照料"
                value={filters.skill}
                onChange={(e) => handleFilterChange('skill', e.target.value)}
                style={{ fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                ⭐ 最低好评率
              </label>
              <select
                className="form-input"
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                style={{ fontSize: '14px' }}
              >
                <option value="">不限</option>
                <option value="4.5">4.5分以上</option>
                <option value="4.0">4.0分以上</option>
                <option value="3.5">3.5分以上</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                ⚡ 最长响应时间
              </label>
              <select
                className="form-input"
                value={filters.maxResponseTime}
                onChange={(e) => handleFilterChange('maxResponseTime', e.target.value)}
                style={{ fontSize: '14px' }}
              >
                <option value="">不限</option>
                <option value="15">15分钟内</option>
                <option value="30">30分钟内</option>
                <option value="60">1小时内</option>
                <option value="120">2小时内</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                📍 服务半径 ≥
              </label>
              <select
                className="form-input"
                value={filters.serviceRadius}
                onChange={(e) => handleFilterChange('serviceRadius', e.target.value)}
                style={{ fontSize: '14px' }}
              >
                <option value="">不限</option>
                <option value="5">5km+</option>
                <option value="10">10km+</option>
                <option value="20">20km+</option>
                <option value="50">50km+</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                📊 排序方式
              </label>
              <select
                className="form-input"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                style={{ fontSize: '14px' }}
              >
                <option value="rating">按好评率</option>
                <option value="response_time">按响应速度</option>
                <option value="reviews">按评价数量</option>
                <option value="portfolios">按作品数量</option>
                <option value="distance">按距离最近</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {filters.skill && (
                <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                  技能: {filters.skill} ×
                </span>
              )}
              {filters.minRating && (
                <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                  {filters.minRating}分以上 ×
                </span>
              )}
              {filters.maxResponseTime && (
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                  {filters.maxResponseTime}分钟内 ×
                </span>
              )}
              {filters.serviceRadius && (
                <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                  {filters.serviceRadius}km+ ×
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
        {providers.map(provider => (
          <div
            key={provider.id}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'box-shadow 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: '700', flexShrink: 0
                }}>
                  {(provider.real_name || provider.username).charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Link to={`/providers/${provider.id}`} style={{ fontWeight: '600', fontSize: '16px', color: '#1e293b', textDecoration: 'none' }}>
                      {provider.real_name || provider.username}
                    </Link>
                    {provider.is_verified ? (
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '500' }}>
                        ✓ 已认证
                      </span>
                    ) : (
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                        认证中
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b' }}>
                    <span>⭐ {provider.rating?.toFixed(1) || '5.0'}</span>
                    <span>({provider.review_summary?.total || provider.rating_count || 0}评价)</span>
                    <span>📍 {provider.location || '未设置'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {provider.skills?.split(',').slice(0, 5).map((skill, i) => (
                  <span key={i} style={{
                    background: '#eff6ff', color: '#2563eb',
                    padding: '3px 10px', borderRadius: '14px', fontSize: '12px'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '4px', fontSize: '12px', color: '#64748b',
                padding: '10px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                    {provider.rating?.toFixed(1) || '5.0'}
                  </div>
                  <div>好评率</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                    {provider.response_time || 30}分
                  </div>
                  <div>响应</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                    {provider.service_radius || 5}km
                  </div>
                  <div>半径</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                    {provider.portfolio_count || 0}
                  </div>
                  <div>作品</div>
                </div>
              </div>

              {(provider.portfolios_preview?.length > 0 || provider.review_summary?.snippets?.length > 0) && (
                <div style={{ marginTop: '12px' }}>
                  {provider.portfolios_preview?.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>作品集预览</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {provider.portfolios_preview.slice(0, 3).map((p, i) => (
                          <div key={i} style={{
                            flex: 1, background: '#f1f5f9', borderRadius: '6px',
                            padding: '8px', fontSize: '11px', color: '#475569',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            📁 {p.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {provider.review_summary?.snippets?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>客户评价</div>
                      {provider.review_summary.snippets.slice(0, 2).map((s, i) => (
                        <div key={i} style={{
                          fontSize: '12px', color: '#475569',
                          padding: '4px 0', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          💬 {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                <Link
                  to={`/providers/${provider.id}`}
                  className="btn btn-primary"
                  style={{ flex: 1, textAlign: 'center', padding: '8px', fontSize: '14px' }}
                >
                  查看完整档案
                </Link>
                <Link
                  to={`/providers/${provider.id}`}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  资质核验
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无符合条件的服务者</div>
          <div style={{ fontSize: '14px' }}>试试调整筛选条件或切换分类</div>
        </div>
      )}
    </div>
  )
}
