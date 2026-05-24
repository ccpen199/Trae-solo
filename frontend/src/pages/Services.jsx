import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { serviceAPI } from '../api'

export default function Services({ user }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [services, setServices] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'grooming', name: '洗护', icon: '🛁' },
    { id: 'beauty', name: '美容', icon: '✂️' },
    { id: 'boarding', name: '寄养', icon: '🏠' },
    { id: 'transport', name: '接送', icon: '🚗' }
  ]

  useEffect(() => {
    fetchServices()
  }, [activeCategory])

  const fetchServices = async () => {
    setLoading(true)
    setError('')
    try {
      const params = activeCategory !== 'all' ? { type: activeCategory } : {}
      const res = await serviceAPI.getServices(params)
      setServices(res.data.items || res.data || [])
    } catch (err) {
      setError('加载服务列表失败')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryInfo = (type) => {
    const info = {
      grooming: { icon: '🛁', label: '洗护', color: 'var(--info-color)' },
      beauty: { icon: '✂️', label: '美容', color: 'var(--primary-color)' },
      boarding: { icon: '🏠', label: '寄养', color: 'var(--success-color)' },
      transport: { icon: '🚗', label: '接送', color: 'var(--warning-color)' }
    }
    return info[type] || { icon: '📋', label: '其他', color: 'var(--text-secondary)' }
  }

  const getPriceDisplay = (service) => {
    if (service.price_type === 'fixed') {
      return `¥${service.price}`
    }
    if (service.price_type === 'range') {
      return `¥${service.min_price} - ¥${service.max_price}`
    }
    if (service.price_type === 'hourly') {
      return `¥${service.price}/小时`
    }
    if (service.price_type === 'daily') {
      return `¥${service.price}/天`
    }
    return '价格面议'
  }

  const getDurationDisplay = (service) => {
    if (!service.duration_minutes) return null
    if (service.duration_minutes < 60) {
      return `${service.duration_minutes}分钟`
    }
    const hours = Math.floor(service.duration_minutes / 60)
    const minutes = service.duration_minutes % 60
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>服务预约</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {services.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
            <h3>暂无可用服务</h3>
            <p>该分类下暂无服务，请选择其他分类</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-3">
          {services.map((service) => {
            const catInfo = getCategoryInfo(service.type)
            const duration = getDurationDisplay(service)
            return (
              <div key={service.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '48px',
                      width: '80px',
                      height: '80px',
                      borderRadius: '12px',
                      background: `${catInfo.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {catInfo.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '18px' }}>{service.name}</h3>
                      <span className="badge badge-info" style={{ fontSize: '11px' }}>
                        {catInfo.label}
                      </span>
                    </div>
                    {service.store_name && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        🏪 {service.store_name}
                      </p>
                    )}
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-color)' }}>
                      {getPriceDisplay(service)}
                    </div>
                    {duration && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        ⏱ 约{duration}
                      </p>
                    )}
                  </div>
                </div>

                {service.description && (
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '16px',
                      lineHeight: 1.6
                    }}
                  >
                    {service.description}
                  </p>
                )}

                {service.features && service.features.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      {service.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="badge badge-secondary"
                          style={{ fontSize: '12px' }}
                        >
                          ✓ {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {service.availability && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px',
                      padding: '8px 12px',
                      background: '#f0fdf4',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#166534'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>📅</span>
                    <span>{service.availability}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => navigate(`/book/${service.id}`)}
                  >
                    立即预约
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
