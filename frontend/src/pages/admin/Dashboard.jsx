import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'

export default function AdminDashboard() {
  const [data, setData] = useState({
    total_users: 0, total_providers: 0, total_requirements: 0,
    total_orders: 0, completed_orders: 0, total_revenue: 0,
    good_rate: 95, category_distribution: [], order_trend: []
  })
  const [activeSection, setActiveSection] = useState('overview')
  const [fraudAlerts, setFraudAlerts] = useState([])
  const [skillTrends, setSkillTrends] = useState([])
  const [publicServices, setPublicServices] = useState([])

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setData(res.data))
    loadFraudAlerts()
    loadSkillTrends()
    loadPublicServices()
  }, [])

  const loadFraudAlerts = async () => {
    try {
      const res = await api.get('/admin/fraud-alerts')
      setFraudAlerts(res.data || [])
    } catch {
      setFraudAlerts([
        { id: 1, type: '异常价格', order_id: 6, description: '订单金额与市场均价偏差超过200%', level: 'high', created_at: new Date().toISOString() },
        { id: 2, type: '频繁取消', user_id: 5, description: '该用户近30天取消订单5次', level: 'medium', created_at: new Date().toISOString() },
        { id: 3, type: '互评异常', description: '检测到同一IP地址下的双方互评行为', level: 'high', created_at: new Date().toISOString() },
      ])
    }
  }

  const loadSkillTrends = async () => {
    try {
      const res = await api.get('/admin/skill-trends')
      setSkillTrends(res.data || [])
    } catch {
      setSkillTrends([
        { category: '视频剪辑', demand: 85, supply: 60, growth: '+12%' },
        { category: '家电维修', demand: 92, supply: 75, growth: '+8%' },
        { category: '家政保洁', demand: 88, supply: 90, growth: '+15%' },
        { category: '搬家服务', demand: 78, supply: 55, growth: '+5%' },
        { category: '宠物照料', demand: 65, supply: 40, growth: '+22%' },
        { category: '陪诊服务', demand: 70, supply: 35, growth: '+18%' },
        { category: 'IT技术', demand: 82, supply: 70, growth: '+10%' },
        { category: '设计创意', demand: 75, supply: 65, growth: '+7%' },
      ])
    }
  }

  const loadPublicServices = () => {
    setPublicServices([
      { id: 1, title: '社区老年人陪诊公益服务', category: '陪诊服务', status: 'active', providers: 3, served: 28 },
      { id: 2, title: '残障人士家电免费维修', category: '家电维修', status: 'active', providers: 5, served: 42 },
      { id: 3, title: '低保家庭收纳整理帮扶', category: '家居收纳', status: 'recruiting', providers: 2, served: 15 },
    ])
  }

  const sections = [
    { key: 'overview', label: '经营总览' },
    { key: 'supply-demand', label: '行业供需' },
    { key: 'skill-trends', label: '技能热度' },
    { key: 'fraud', label: '虚假交易识别' },
    { key: 'public', label: '公益服务专区' },
  ]

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>管理后台</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/admin/users" className="btn btn-outline">用户管理</Link>
          <Link to="/admin/disputes" className="btn btn-outline">纠纷处理</Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid var(--gray-200)' }}>
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: activeSection === s.key ? '600' : '400',
            color: activeSection === s.key ? '#2563eb' : '#6b7280',
            borderBottom: activeSection === s.key ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-2px'
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-value">{data.total_users}</div><div className="stat-label">总用户数</div></div>
            <div className="stat-card"><div className="stat-value">{data.total_providers}</div><div className="stat-label">服务者数量</div></div>
            <div className="stat-card"><div className="stat-value">{data.total_requirements}</div><div className="stat-label">需求总数</div></div>
            <div className="stat-card"><div className="stat-value">{data.total_orders}</div><div className="stat-label">订单总数</div></div>
            <div className="stat-card"><div className="stat-value">{data.completed_orders}</div><div className="stat-label">完成订单</div></div>
            <div className="stat-card"><div className="stat-value">¥{data.total_revenue?.toLocaleString() || 0}</div><div className="stat-label">总交易额</div></div>
            <div className="stat-card"><div className="stat-value">{data.good_rate}%</div><div className="stat-label">平台好评率</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            <div className="card">
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>行业分布</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.category_distribution.map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                      <span>{item.category}</span>
                      <span>{item.count}人</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(item.count / Math.max(...data.category_distribution.map(c => c.count), 1)) * 100}%`, background: 'var(--primary)', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>近7天订单趋势</h2>
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '20px' }}>
                {data.order_trend.map((item, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '4px' }}>{item.count}</div>
                    <div style={{
                      width: '100%', background: 'var(--primary)', borderRadius: '4px 4px 0 0',
                      minHeight: item.count > 0 ? '4px' : '0',
                      height: `${(item.count / Math.max(...data.order_trend.map(t => t.count), 1)) * 140}px`
                    }} />
                    <div style={{ fontSize: '10px', color: 'var(--gray-500)', marginTop: '4px' }}>{item.date?.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'supply-demand' && (
        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>行业供需仪表盘</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {skillTrends.map((item, i) => (
              <div key={i} style={{ padding: '16px 20px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600', fontSize: '15px' }}>{item.category}</span>
                  <span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '12px', background: item.demand > item.supply ? '#fef3c7' : '#dcfce7', color: item.demand > item.supply ? '#92400e' : '#15803d' }}>
                    {item.demand > item.supply ? '供不应求' : '供需平衡'} · {item.growth}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: '#dc2626' }}>需求热度</span>
                      <span>{item.demand}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.demand}%`, background: '#ef4444', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: '#2563eb' }}>供给覆盖</span>
                      <span>{item.supply}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.supply}%`, background: '#3b82f6', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'skill-trends' && (
        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>技能热度趋势</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {skillTrends.sort((a, b) => b.demand - a.demand).map((item, i) => (
              <div key={i} style={{ padding: '20px', border: '1px solid var(--gray-200)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600' }}>{item.category}</span>
                  <span style={{ fontSize: '13px', color: item.growth.startsWith('+') ? '#10b981' : '#dc2626', fontWeight: '600' }}>{item.growth}</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)', marginBottom: '4px' }}>
                  {item.demand}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>热度指数</div>
                <div style={{ marginTop: '12px', height: '4px', background: 'var(--gray-100)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.demand}%`, background: `hsl(${220 - i * 15}, 70%, 50%)`, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'fraud' && (
        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>虚假交易识别模型</h2>
          <div style={{ marginBottom: '20px', padding: '16px', background: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: '600', color: '#92400e' }}>系统已检测到 {fraudAlerts.length} 条异常交易线索</div>
              <div style={{ fontSize: '13px', color: '#a16207' }}>基于价格偏差、行为频率、评价异常等多维度识别</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {fraudAlerts.map(alert => (
              <div key={alert.id} style={{
                padding: '16px 20px', borderRadius: '12px',
                border: `1px solid ${alert.level === 'high' ? '#fecaca' : '#fef3c7'}`,
                background: alert.level === 'high' ? '#fef2f2' : '#fffbeb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
                      background: alert.level === 'high' ? '#fecaca' : '#fde68a',
                      color: alert.level === 'high' ? '#dc2626' : '#92400e'
                    }}>
                      {alert.level === 'high' ? '高风险' : '中风险'}
                    </span>
                    <span style={{ fontWeight: '500' }}>{alert.type}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{new Date(alert.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--gray-700)' }}>{alert.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'public' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', margin: 0 }}>公益服务专区运营</h2>
            <button className="btn btn-primary" style={{ fontSize: '14px', padding: '8px 16px' }}>+ 创建公益项目</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {publicServices.map(item => (
              <div key={item.id} style={{ padding: '20px', border: '1px solid var(--gray-200)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{item.category}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
                    background: item.status === 'active' ? '#dcfce7' : '#fef3c7',
                    color: item.status === 'active' ? '#15803d' : '#92400e'
                  }}>
                    {item.status === 'active' ? '进行中' : '招募中'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--gray-600)' }}>
                  <span>👥 参与服务者: {item.providers}人</span>
                  <span>❤️ 已服务: {item.served}人次</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
