import { useState, useEffect } from 'react'
import { auditApi } from '../api.js'

export default function Audit() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState({ action: '', entityType: '' })

  const load = () => {
    const params: any = { limit: 200 }
    if (filter.action) params.action = filter.action
    if (filter.entityType) params.entityType = filter.entityType
    auditApi.list(params).then(r => setLogs(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [filter])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">审计日志</h1>
          <p className="page-subtitle">记录所有核心操作，支持按操作类型和实体类型过滤</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="form-group">
            <label className="form-label">操作类型</label>
            <select className="form-select" value={filter.action} onChange={e => setFilter({ ...filter, action: e.target.value })}>
              <option value="">全部</option>
              <option value="UPLOAD">上传</option>
              <option value="PROMOTE">晋级</option>
              <option value="DOWNLOAD">下载</option>
              <option value="CREATE_REPO">创建仓库</option>
              <option value="DELETE_REPO">删除仓库</option>
              <option value="GRANT_PERMISSION">授权</option>
              <option value="REVOKE_PERMISSION">撤权</option>
              <option value="CLEANUP_EXECUTE">清理执行</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">实体类型</label>
            <select className="form-select" value={filter.entityType} onChange={e => setFilter({ ...filter, entityType: e.target.value })}>
              <option value="">全部</option>
              <option value="repository">仓库</option>
              <option value="namespace">命名空间</option>
              <option value="version">版本</option>
              <option value="permission">权限</option>
              <option value="token">令牌</option>
              <option value="retention_policy">清理策略</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setFilter({ action: '', entityType: '' })}>重置</button>
          </div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作</th>
              <th>实体类型</th>
              <th>实体 ID</th>
              <th>操作者</th>
              <th>详情</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td style={{ color: '#64748b', fontSize: 12 }}>{l.created_at}</td>
                <td><span className="badge badge-info">{l.action}</span></td>
                <td>{l.entity_type}</td>
                <td>{l.entity_id || '-'}</td>
                <td>{l.actor}</td>
                <td style={{ fontSize: 12 }}>{l.details}</td>
                <td style={{ fontSize: 11, color: '#64748b' }}>{l.ip_address}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={7} className="empty">暂无审计日志</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}