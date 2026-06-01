import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { repositoriesApi, namespacesApi, artifactsApi } from '../api.js'

export default function RepositoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [repo, setRepo] = useState<any>(null)
  const [namespaces, setNamespaces] = useState<any[]>([])
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [activeNs, setActiveNs] = useState<number | null>(null)
  const [showNsModal, setShowNsModal] = useState(false)
  const [nsForm, setNsForm] = useState({ name: '', description: '' })

  useEffect(() => {
    repositoriesApi.get(Number(id)).then(r => setRepo(r.data)).catch(() => {})
    namespacesApi.list(Number(id)).then(r => {
      setNamespaces(r.data)
      if (r.data.length > 0) setActiveNs(r.data[0].id)
    }).catch(() => {})
  }, [id])

  useEffect(() => {
    if (activeNs) {
      artifactsApi.list({ namespace_id: activeNs }).then(r => setArtifacts(r.data)).catch(() => {})
    }
  }, [activeNs])

  if (!repo) return <div className="empty">加载中...</div>

  const handleCreateNs = () => {
    if (!nsForm.name.trim()) return
    namespacesApi.create(repo.id, nsForm).then(() => {
      namespacesApi.list(repo.id).then(r => setNamespaces(r.data))
      setShowNsModal(false)
      setNsForm({ name: '', description: '' })
    }).catch(e => alert(e.response?.data?.error))
  }

  return (
    <div>
      <div className="breadcrumb">
        <a onClick={() => navigate('/repositories')}>仓库管理</a>
        <span className="breadcrumb-sep">/</span>
        <span>{repo.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{repo.name}</h1>
          <p className="page-subtitle">
            <span className={`badge badge-${repo.type}`} style={{ marginRight: 8 }}>{repo.type}</span>
            <span className={`badge badge-${repo.format}`}>{repo.format}</span>
            <span style={{ marginLeft: 12, color: '#64748b' }}>{repo.description}</span>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowNsModal(true)}>+ 新建命名空间</button>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: 13, flexShrink: 0 }}>仓库地址:</span>
          <input
            value={repo.url}
            readOnly
            style={{ flex: 1, fontFamily: 'SF Mono, Monaco, Menlo, monospace', fontSize: 12 }}
          />
          <button className="btn btn-sm btn-primary"
            onClick={() => { navigator.clipboard.writeText(repo.url); alert('已复制到剪贴板'); }}>
            📋 复制
          </button>
        </div>
        {repo.type === 'maven' && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #334155' }}>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Maven settings.xml 配置:</div>
            <pre style={{ background: '#0f172a', padding: 10, borderRadius: 4, fontSize: 11, overflow: 'auto' }}>{
`<repository>
  <id>${repo.name}</id>
  <url>${repo.url}</url>
</repository>`
            }</pre>
          </div>
        )}
        {repo.type === 'npm' && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #334155' }}>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>NPM registry 配置:</div>
            <pre style={{ background: '#0f172a', padding: 10, borderRadius: 4, fontSize: 11, overflow: 'auto' }}>{
`npm config set @example:registry ${repo.url}`
            }</pre>
          </div>
        )}
        {repo.type === 'docker' && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #334155' }}>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Docker 拉取镜像:</div>
            <pre style={{ background: '#0f172a', padding: 10, borderRadius: 4, fontSize: 11, overflow: 'auto' }}>{
`docker pull ${repo.url?.replace(/^https?:\/\//, '')}/library/<image>:<tag>`
            }</pre>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-value">{namespaces.length}</div><div className="stat-label">命名空间</div></div>
        <div className="stat-card"><div className="stat-value">{artifacts.length}</div><div className="stat-label">制品数</div></div>
        <div className="stat-card"><div className="stat-value">{repo.id}</div><div className="stat-label">仓库 ID</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">命名空间</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {namespaces.map(ns => (
            <button
              key={ns.id}
              className={`btn ${activeNs === ns.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveNs(ns.id)}
            >
              {ns.name} <span style={{ opacity: 0.6, fontSize: 11 }}>({ns.artifact_count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">制品列表 {activeNs && namespaces.find(n => n.id === activeNs)?.name}</div>
        <table>
          <thead>
            <tr>
              <th>制品名称</th>
              <th>最新版本</th>
              <th>下载次数</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>
                  <a style={{ color: '#60a5fa', cursor: 'pointer' }} onClick={() => navigate(`/artifacts/${a.id}`)}>
                    {a.name}
                  </a>
                </td>
                <td>{a.latest_version || '-'}</td>
                <td>{a.download_count}</td>
                <td style={{ color: '#64748b', fontSize: 12 }}>{a.updated_at}</td>
                <td>
                  <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/artifacts/${a.id}`)}>详情</button>
                </td>
              </tr>
            ))}
            {artifacts.length === 0 && <tr><td colSpan={5} className="empty">暂无制品</td></tr>}
          </tbody>
        </table>
      </div>

      {showNsModal && (
        <div className="modal-overlay" onClick={() => setShowNsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">新建命名空间</span>
              <button className="modal-close" onClick={() => setShowNsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">命名空间名称 *</label>
                <input className="form-input" value={nsForm.name} onChange={e => setNsForm({ ...nsForm, name: e.target.value })} placeholder="例如 com.example 或 @scope" />
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <input className="form-input" value={nsForm.description} onChange={e => setNsForm({ ...nsForm, description: e.target.value })} placeholder="命名空间描述" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNsModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateNs}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}