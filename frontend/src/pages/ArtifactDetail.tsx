import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { artifactsApi, versionsApi } from '../api.js'

export default function ArtifactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [artifact, setArtifact] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])

  useEffect(() => {
    artifactsApi.get(Number(id)).then(r => setArtifact(r.data)).catch(() => {})
    versionsApi.list(Number(id)).then(r => setVersions(r.data)).catch(() => {})
  }, [id])

  if (!artifact) return <div className="empty">加载中...</div>

  return (
    <div>
      <div className="breadcrumb">
        <a onClick={() => navigate('/repositories')}>仓库管理</a>
        <span className="breadcrumb-sep">/</span>
        <a onClick={() => navigate(`/repositories/${artifact.repo_id}`)}>{artifact.repo_name}</a>
        <span className="breadcrumb-sep">/</span>
        <span>{artifact.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{artifact.name}</h1>
          <p className="page-subtitle">
            <span className={`badge badge-${artifact.repo_type}`} style={{ marginRight: 8 }}>{artifact.repo_type}</span>
            命名空间: <span className="code">{artifact.namespace_name}</span>
            {artifact.description && <span style={{ marginLeft: 12, color: '#64748b' }}>{artifact.description}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-value">{versions.length}</div><div className="stat-label">版本总数</div></div>
        <div className="stat-card"><div className="stat-value">{versions.filter(v => v.status === 'released').length}</div><div className="stat-label">已发布</div></div>
        <div className="stat-card"><div className="stat-value">{artifact.latest_version || '-'}</div><div className="stat-label">最新版本</div></div>
        <div className="stat-card"><div className="stat-value">{artifact.download_count}</div><div className="stat-label">累计下载</div></div>
      </div>

      <div className="card">
        <div className="card-title">版本列表</div>
        <table>
          <thead>
            <tr>
              <th>版本</th>
              <th>状态</th>
              <th>上传者</th>
              <th>构建来源</th>
              <th>漏洞</th>
              <th>大小</th>
              <th>上传时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {versions.map(v => (
              <tr key={v.id}>
                <td style={{ fontWeight: 600 }}>
                  <a style={{ color: '#60a5fa', cursor: 'pointer' }} onClick={() => navigate(`/versions/${v.id}`)}>
                    {v.version}
                  </a>
                  {v.is_snapshot ? <span className="tag" style={{ marginLeft: 6 }}>SNAPSHOT</span> : null}
                </td>
                <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                <td>{v.uploader}</td>
                <td style={{ fontSize: 11, color: '#64748b' }}>{v.build_source || '-'}</td>
                <td>
                  {v.vulnerabilities > 0 ? <span style={{ color: '#ef4444' }}>{v.vulnerabilities}</span> : <span style={{ color: '#22c55e' }}>0</span>}
                </td>
                <td>{(v.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                <td style={{ color: '#64748b', fontSize: 12 }}>{v.created_at}</td>
                <td>
                  <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/versions/${v.id}`)}>详情</button>
                </td>
              </tr>
            ))}
            {versions.length === 0 && <tr><td colSpan={8} className="empty">暂无版本</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}