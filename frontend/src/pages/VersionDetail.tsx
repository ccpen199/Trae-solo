import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { versionsApi } from '../api.js'

export default function VersionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [version, setVersion] = useState<any>(null)
  const [tab, setTab] = useState('info')

  useEffect(() => {
    versionsApi.get(Number(id)).then(r => setVersion(r.data)).catch(() => {})
  }, [id])

  if (!version) return <div className="empty">加载中...</div>

  const handlePromote = (status: string) => {
    if (!confirm('确定将此版本状态变更为 ' + status + '？')) return
    versionsApi.promote(Number(id), { status }).then(() => {
      versionsApi.get(Number(id)).then(r => setVersion(r.data))
    }).catch(e => alert(e.response?.data?.error))
  }

  const handleDownload = () => {
    versionsApi.download(Number(id), { downloader: 'admin' }).then(() => {
      versionsApi.get(Number(id)).then(r => setVersion(r.data))
    }).catch(e => alert(e.response?.data?.error))
  }

  return (
    <div>
      <div className="breadcrumb">
        <a onClick={() => navigate('/repositories')}>仓库管理</a>
        <span className="breadcrumb-sep">/</span>
        <span>{version.repo_name}</span>
        <span className="breadcrumb-sep">/</span>
        <a onClick={() => navigate(`/artifacts/${version.artifact_id}`)}>{version.artifact_name}</a>
        <span className="breadcrumb-sep">/</span>
        <span>{version.version}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            {version.artifact_name} <span style={{ color: '#64748b', fontSize: 16 }}>:</span>{' '}
            <span style={{ color: '#60a5fa' }}>{version.version}</span>
          </h1>
          <p className="page-subtitle">
            <span className={`badge badge-${version.repo_type}`} style={{ marginRight: 8 }}>{version.repo_type}</span>
            <span className={`badge badge-${version.status}`}>{version.status}</span>
            {version.is_snapshot && <span className="badge badge-snapshot" style={{ marginLeft: 4 }}>SNAPSHOT</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleDownload}>⬇️ 下载</button>
          {version.status !== 'released' && (
            <button className="btn btn-primary" onClick={() => handlePromote('released')}>✓ 发布</button>
          )}
          {version.status !== 'blocked' && version.status !== 'released' && (
            <button className="btn btn-ghost" style={{ color: '#ef4444' }} onClick={() => handlePromote('blocked')}>✗ 阻断</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-value">{(version.size_bytes / 1024 / 1024).toFixed(2)}</div><div className="stat-label">大小 (MB)</div></div>
        <div className="stat-card"><div className="stat-value">{version.downloaded_count}</div><div className="stat-label">下载次数</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: version.vulnerabilities > 0 ? '#ef4444' : '#22c55e' }}>{version.vulnerabilities}</div><div className="stat-label">漏洞数</div></div>
        <div className="stat-card"><div className="stat-value">{version.uploader}</div><div className="stat-label">上传者</div></div>
        <div className="stat-card"><div className="stat-value" style={{ fontSize: 14 }}>{version.created_at}</div><div className="stat-label">上传时间</div></div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>基本信息</div>
        <div className={`tab ${tab === 'deps' ? 'active' : ''}`} onClick={() => setTab('deps')}>依赖 ({version.dependencies?.length || 0})</div>
        <div className={`tab ${tab === 'refs' ? 'active' : ''}`} onClick={() => setTab('refs')}>引用项目 ({version.referenced_projects?.length || 0})</div>
        <div className={`tab ${tab === 'deploys' ? 'active' : ''}`} onClick={() => setTab('deploys')}>部署记录 ({version.deployments?.length || 0})</div>
        <div className={`tab ${tab === 'notes' ? 'active' : ''}`} onClick={() => setTab('notes')}>发布说明</div>
      </div>

      {tab === 'info' && (
        <div className="card">
          <table>
            <tbody>
              <tr><td style={{ width: 140, color: '#94a3b8' }}>版本号</td><td>{version.version}</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>状态</td><td><span className={`badge badge-${version.status}`}>{version.status}</span></td></tr>
              <tr><td style={{ color: '#94a3b8' }}>上传者</td><td>{version.uploader}</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>构建来源</td><td>{version.build_source || '-'}</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>签名校验</td><td>{version.signature_verified ? <span style={{ color: '#22c55e' }}>✓ 已验证</span> : <span style={{ color: '#ef4444' }}>✗ 未验证</span>}</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>安全扫描</td><td><span className={`badge badge-${version.scan_status}`}>{version.scan_status}</span></td></tr>
              <tr><td style={{ color: '#94a3b8' }}>漏洞数</td><td style={{ color: version.vulnerabilities > 0 ? '#ef4444' : '#22c55e' }}>{version.vulnerabilities}</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>文件大小</td><td>{(version.size_bytes / 1024 / 1024).toFixed(2)} MB</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>摘要 (Digest)</td><td><span className="code">{version.digest || '-'}</span></td></tr>
              <tr><td style={{ color: '#94a3b8' }}>是否快照</td><td>{version.is_snapshot ? '是' : '否'}</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>下载次数</td><td>{version.downloaded_count}</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>上传时间</td><td>{version.created_at}</td></tr>
              <tr><td style={{ color: '#94a3b8' }}>发布时间</td><td>{version.released_at || '-'}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'deps' && (
        <div className="card">
          {version.dependencies?.length > 0 ? (
            <table>
              <thead>
                <tr><th>依赖名称</th><th>版本</th><th>类型</th></tr>
              </thead>
              <tbody>
                {version.dependencies.map((d: any) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.dep_name}</td>
                    <td>{d.dep_version || '-'}</td>
                    <td>{d.dep_type || 'compile'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty">暂无依赖信息</div>}
        </div>
      )}

      {tab === 'refs' && (
        <div className="card">
          {version.referenced_projects?.length > 0 ? (
            <table>
              <thead>
                <tr><th>项目名称</th><th>项目地址</th></tr>
              </thead>
              <tbody>
                {version.referenced_projects.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.project_name}</td>
                    <td>{p.project_url || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty">暂无引用项目</div>}
        </div>
      )}

      {tab === 'deploys' && (
        <div className="card">
          {version.deployments?.length > 0 ? (
            <table>
              <thead>
                <tr><th>环境</th><th>部署者</th><th>状态</th><th>时间</th></tr>
              </thead>
              <tbody>
                {version.deployments.map((d: any) => (
                  <tr key={d.id}>
                    <td><span className="tag">{d.environment}</span></td>
                    <td>{d.deployed_by}</td>
                    <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{d.deployed_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty">暂无部署记录</div>}
        </div>
      )}

      {tab === 'notes' && (
        <div className="card">
          <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>
            {version.release_notes || '暂无发布说明'}
          </div>
        </div>
      )}
    </div>
  )
}