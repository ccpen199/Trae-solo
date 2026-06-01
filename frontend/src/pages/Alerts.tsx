import { useState, useEffect } from 'react'
import { alertsApi } from '../api.js'

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([])

  const load = () => {
    alertsApi.list().then(r => setAlerts(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const handleResolve = (id: number) => {
    alertsApi.resolve(id).then(() => load()).catch(() => {})
  }

  const unresolvedCount = alerts.filter(a => !a.resolved).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">告警中心</h1>
          <p className="page-subtitle">
            快照过期、低频制品、违规删除和异常下载告警
            {unresolvedCount > 0 && <span style={{ color: '#ef4444', marginLeft: 12 }}>{unresolvedCount} 条未处理</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderColor: unresolvedCount > 0 ? '#ef4444' : undefined }}>
          <div className="stat-value" style={{ color: unresolvedCount > 0 ? '#ef4444' : '#22c55e' }}>{unresolvedCount}</div>
          <div className="stat-label">未处理告警</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{alerts.filter(a => a.severity === 'critical').length}</div>
          <div className="stat-label">严重 (Critical)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{alerts.filter(a => a.severity === 'warning').length}</div>
          <div className="stat-label">警告 (Warning)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{alerts.length}</div>
          <div className="stat-label">告警总数</div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>类型</th>
              <th>级别</th>
              <th>实体</th>
              <th>消息</th>
              <th>状态</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.id} style={a.resolved ? { opacity: 0.5 } : {}}>
                <td><span className="badge badge-info">{a.type}</span></td>
                <td><span className={`badge badge-${a.severity}`}>{a.severity}</span></td>
                <td style={{ fontSize: 12 }}>{a.entity_type}#{a.entity_id}</td>
                <td style={{ fontSize: 12 }}>{a.message}</td>
                <td>{a.resolved ? <span style={{ color: '#64748b' }}>已处理</span> : <span style={{ color: '#ef4444' }}>待处理</span>}</td>
                <td style={{ color: '#64748b', fontSize: 12 }}>{a.created_at}</td>
                <td>
                  {!a.resolved && (
                    <button className="btn btn-sm btn-ghost" onClick={() => handleResolve(a.id)}>标记已处理</button>
                  )}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && <tr><td colSpan={7} className="empty">暂无告警</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}