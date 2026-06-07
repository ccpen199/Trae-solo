import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'

export default function ProviderDetail() {
  const { id } = useParams()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('portfolios')

  useEffect(() => {
    api.get(`/users/${id}`).then(res => {
      setProvider(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading || !provider) {
    return <div className="container" style={{ padding: '40px' }}>加载中...</div>
  }

  const statusText = {
    'pending_confirm': '待确认', 'confirmed': '已确认', 'in_progress': '进行中',
    'pending_delivery': '待交付', 'pending_accept': '待验收', 'completed': '已完成',
    'disputed': '纠纷中', 'cancelled': '已取消'
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px', fontWeight: '600', color: 'white', flexShrink: 0
          }}>
            {(provider.real_name || provider.username).charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '28px', margin: 0 }}>{provider.real_name || provider.username}</h1>
              {provider.is_verified ? (
                <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>✓ 已实名认证</span>
              ) : (
                <span style={{ padding: '4px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '12px', fontSize: '12px' }}>⏳ 认证中</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', color: 'var(--gray-600)', fontSize: '14px' }}>
              <span>⭐ {provider.rating?.toFixed(1) || '5.0'} ({provider.rating_count || 0}评价)</span>
              <span>📍 {provider.location || '未设置位置'}</span>
              <span>🎯 服务半径 {provider.service_radius || 5}km</span>
              <span>⚡ 响应 {provider.response_time || 30}分钟</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {provider.skills?.map((skill, i) => (
                <span key={i} style={{ padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '12px', fontSize: '13px' }}>
                  {skill.name} · {skill.years_experience}年 · ¥{skill.hourly_rate}/时
                  {skill.is_certified && <span style={{ color: '#10b981', marginLeft: '4px' }}>✓认证</span>}
                </span>
              ))}
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: '13px', margin: 0 }}>
              加入时间: {new Date(provider.created_at).toLocaleDateString()} · 信用分: {provider.credit_score || 100}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid var(--gray-200)' }}>
        {[
          { key: 'portfolios', label: `作品集 (${provider.portfolios?.length || 0})` },
          { key: 'reviews', label: `客户评价 (${provider.reviews?.length || 0})` },
          { key: 'credentials', label: '资质核验' },
          { key: 'history', label: `服务记录 (${provider.service_history?.length || 0})` },
          { key: 'growth', label: '成长路径' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 20px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: '15px', fontWeight: activeTab === tab.key ? '600' : '400',
              color: activeTab === tab.key ? '#2563eb' : '#6b7280',
              borderBottom: activeTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: '-2px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'portfolios' && (
        <div className="card">
          {provider.portfolios?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {provider.portfolios.map(item => (
                <div key={item.id} style={{ border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{
                    height: '160px',
                    background: `linear-gradient(${135 + item.id * 30}deg, #667eea 0%, #764ba2 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '16px', fontWeight: '500'
                  }}>
                    {item.title}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '15px' }}>{item.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: '1.5', marginBottom: '8px' }}>{item.description}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                      {item.completion_date ? `完成于 ${new Date(item.completion_date).toLocaleDateString()}` : `发布于 ${new Date(item.created_at).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-600)' }}>暂无作品集</div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="card">
          {provider.reviews?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {provider.reviews.map(review => (
                <div key={review.id} style={{ padding: '20px', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#4338ca' }}>
                        {(review.reviewer_name || '匿名').charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{review.reviewer_name || '匿名用户'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{review.order_title || ''}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#f59e0b' }}>{'⭐'.repeat(review.rating)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{new Date(review.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--gray-700)', margin: 0, lineHeight: '1.6' }}>{review.content || '暂无评价内容'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-600)' }}>暂无评价</div>
          )}
        </div>
      )}

      {activeTab === 'credentials' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>身份核验</h3>
            {provider.is_verified ? (
              <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✓</span>
                  <span style={{ fontWeight: '600', color: '#15803d', fontSize: '16px' }}>已通过实名认证</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#166534' }}>
                  <div>✓ 身份证信息已核验</div>
                  <div>✓ 手机号已验证</div>
                  <div>✓ 银行卡已绑定</div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '12px', fontSize: '12px' }}>身份证认证</span>
                  <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '12px', fontSize: '12px' }}>手机认证</span>
                  <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '12px', fontSize: '12px' }}>银行卡认证</span>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '600', color: '#92400e' }}>⏳ 认证审核中</span>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>技能认证</h3>
            {provider.skills?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {provider.skills.map((skill, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{skill.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{skill.category} · {skill.years_experience}年经验 · 熟练度 {skill.proficiency_level}/5</div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', background: skill.is_certified ? '#dcfce7' : '#fef3c7', color: skill.is_certified ? '#15803d' : '#92400e' }}>
                      {skill.is_certified ? '✓ 已认证' : '⏳ 待认证'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--gray-600)', textAlign: 'center', padding: '20px' }}>暂无技能认证</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>历史服务记录</h3>
          {provider.service_history?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {provider.service_history.map(order => (
                <Link to={`/orders/${order.id}`} key={order.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', background: 'var(--gray-50)', borderRadius: '8px',
                    border: '1px solid var(--gray-100)', transition: 'background 0.2s'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{order.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                        📍 {order.service_address || '未指定'} · 📅 {new Date(order.service_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>¥{order.total_amount}</div>
                      <span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '12px',
                        background: order.status === 'completed' ? '#dcfce7' : order.status === 'disputed' ? '#fef2f2' : '#fef3c7',
                        color: order.status === 'completed' ? '#15803d' : order.status === 'disputed' ? '#dc2626' : '#92400e'
                      }}>
                        {statusText[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-600)' }}>暂无服务记录</div>
          )}
        </div>
      )}

      {activeTab === 'growth' && (
        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>成长路径</h3>
          <div style={{ position: 'relative' }}>
            {[
              { icon: '🏠', title: '入驻平台', desc: '完成注册并填写基本信息', done: true, date: new Date(provider.created_at).toLocaleDateString() },
              { icon: '✓', title: '实名认证', desc: '通过身份验证和手机绑定', done: provider.is_verified, date: provider.is_verified ? '已完成' : '待完成' },
              { icon: '⭐', title: '技能认证', desc: '至少一项技能通过平台认证', done: provider.skills?.some(s => s.is_certified), date: provider.skills?.some(s => s.is_certified) ? '已完成' : '待完成' },
              { icon: '10', title: '10单达标', desc: '完成10单服务获得信誉标识', done: (provider.rating_count || 0) >= 10, date: `${provider.rating_count || 0}/10` },
              { icon: '💎', title: '精英服务商', desc: '完成30单且好评率≥95%', done: (provider.rating_count || 0) >= 30, date: `${Math.min(provider.rating_count || 0, 30)}/30` },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '24px', position: 'relative' }}>
                {i < 4 && (
                  <div style={{ position: 'absolute', left: '19px', top: '40px', width: '2px', height: '24px', background: step.done ? '#10b981' : '#e5e7eb' }} />
                )}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: step.done ? '#10b981' : '#e5e7eb',
                  color: step.done ? 'white' : '#9ca3af',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: '600', flexShrink: 0, zIndex: 1
                }}>
                  {step.icon}
                </div>
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', color: step.done ? '#15803d' : 'var(--gray-600)' }}>{step.title}</span>
                    <span style={{ fontSize: '12px', color: step.done ? '#10b981' : 'var(--gray-400)' }}>{step.date}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
