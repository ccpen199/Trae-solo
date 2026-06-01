import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { statsApi, repositoriesApi, versionsApi } from '../api.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [recentRepos, setRecentRepos] = useState<any[]>([])

  useEffect(() => {
    statsApi.overview().then(r => setStats(r.data)).catch(() => {})
    repositoriesApi.list().then(r => setRecentRepos(r.data.slice(0, 5))).catch(() => {})
  }, [])

  if (!stats) return <div className="empty">加载中...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">系统总览</h1>
          <p className="page-subtitle">实时监控制品仓库的核心运营指标</p>
        </div>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats.repositoryCount}</div>
          <div className="stat-label">仓库总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{stats.artifactCount}</div>
          <div className="stat-label">制品总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔖</div>
          <div className="stat-value">{stats.versionCount}</div>
          <div className="stat-label">版本总数 ({stats.releasedCount} 已发布)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⬇️</div>
          <div className="stat-value">{stats.totalDownloads}</div>
          <div className="stat-label">累计下载次数</div>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderColor: stats.activeAlerts > 0 ? '#ef4444' : undefined }}>
          <div className="stat-icon">🚨</div>
          <div className="stat-value" style={{ color: stats.activeAlerts > 0 ? '#ef4444' : undefined }}>{stats.activeAlerts}</div>
          <div className="stat-label">未处理告警</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⬆️</div>
          <div className="stat-value">{stats.recentUploads}</div>
          <div className="stat-label">近7日上传</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{((stats.releasedCount / Math.max(stats.versionCount, 1)) * 100).toFixed(0)}%</div>
          <div className="stat-label">已发布占比</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">活跃仓库</div>
        <table>
          <thead>
            <tr>
              <th>仓库名称</th>
              <th>类型</th>
              <th>格式</th>
              <th>命名空间</th>
              <th>制品数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {recentRepos.map(r => (
              <tr key={r.id}>
                <td>
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{r.description}</div>
                </td>
                <td><span className={`badge badge-${r.type}`}>{r.type}</span></td>
                <td><span className={`badge badge-${r.format}`}>{r.format}</span></td>
                <td>{r.namespace_count}</td>
                <td>{r.artifact_count}</td>
                <td>
                  <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/repositories/${r.id}`)}>查看</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}