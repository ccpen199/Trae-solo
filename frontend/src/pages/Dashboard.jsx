import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await api.get('/dashboard/stats')
      setStats(res.data)
    } catch (err) {
      console.error('加载统计数据失败', err)
    }
  }

  if (!stats) return <div className="card">加载中...</div>

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>安全看板</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{stats.total}</div>
          <div className="label">事件总数</div>
        </div>
        <div className="stat-card warning">
          <div className="value">{stats.pending}</div>
          <div className="label">待处理</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.processing}</div>
          <div className="label">处理中</div>
        </div>
        <div className="stat-card success">
          <div className="value">{stats.closed}</div>
          <div className="label">已结案</div>
        </div>
        <div className="stat-card critical">
          <div className="value">{stats.overdue}</div>
          <div className="label">已超时</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>事件类型分布</h3>
          {stats.byType.map(item => (
            <div key={item.type} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{getTypeLabel(item.type)}</span>
                <span style={{ fontWeight: 600 }}>{item.count}</span>
              </div>
              <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: '#2d5a87', 
                    width: `${(item.count / stats.total) * 100}%`,
                    borderRadius: 4
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>紧急程度分布</h3>
          {stats.byUrgency.map(item => (
            <div key={item.urgency} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{getUrgencyLabel(item.urgency)}</span>
                <span style={{ fontWeight: 600 }}>{item.count}</span>
              </div>
              <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: getUrgencyColor(item.urgency), 
                    width: `${(item.count / stats.total) * 100}%`,
                    borderRadius: 4
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex-between">
          <h3 style={{ fontSize: 16 }}>最近事件</h3>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/incidents')}
          >
            查看全部
          </button>
        </div>
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>事件编号</th>
              <th>标题</th>
              <th>类型</th>
              <th>地点</th>
              <th>紧急程度</th>
              <th>状态</th>
              <th>上报时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent.map(incident => (
              <tr key={incident.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{incident.incident_no}</td>
                <td>{incident.title}</td>
                <td><span className="tag">{getTypeLabel(incident.type)}</span></td>
                <td>{incident.location}</td>
                <td>
                  <span className={`badge badge-${incident.urgency}`}>
                    {getUrgencyLabel(incident.urgency)}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${incident.status}`}>
                    {getStatusLabel(incident.status)}
                  </span>
                </td>
                <td style={{ fontSize: 12 }}>{formatDate(incident.created_at)}</td>
                <td>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                  >
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getTypeLabel(type) {
  const labels = {
    bullying: '校园欺凌',
    injury: '意外伤害',
    food_safety: '食品安全',
    facility: '设施故障',
    security: '治安事件',
    other: '其他'
  }
  return labels[type] || type
}

function getUrgencyLabel(urgency) {
  const labels = { critical: '紧急', high: '高', normal: '普通', low: '低' }
  return labels[urgency] || urgency
}

function getUrgencyColor(urgency) {
  const colors = { critical: '#dc3545', high: '#f59e0b', normal: '#2d5a87', low: '#28a745' }
  return colors[urgency] || '#ccc'
}

function getStatusLabel(status) {
  const labels = { pending: '待处理', processing: '处理中', closed: '已结案' }
  return labels[status] || status
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}