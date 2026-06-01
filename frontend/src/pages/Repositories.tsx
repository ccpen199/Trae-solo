import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { repositoriesApi, namespacesApi } from '../api.js'

export default function Repositories() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [repos, setRepos] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'maven', description: '', format: 'release' })
  const [selectedRepo, setSelectedRepo] = useState<number | null>(null)
  const [namespaces, setNamespaces] = useState<any[]>([])

  const loadData = () => {
    repositoriesApi.list().then(r => setRepos(r.data)).catch(() => {})
  }
  useEffect(() => { loadData() }, [])

  const handleCreate = () => {
    if (!form.name.trim()) return
    repositoriesApi.create(form).then(() => {
      loadData()
      setShowCreate(false)
      setForm({ name: '', type: 'maven', description: '', format: 'release' })
    }).catch(e => alert(e.response?.data?.error || '创建失败'))
  }

  const handleDelete = (id: number, name: string) => {
    if (!confirm('确定删除仓库 "' + name + '"？此操作将删除所有命名空间和制品数据。')) return
    repositoriesApi.remove(id).then(() => { loadData(); setSelectedRepo(null) }).catch(e => alert(e.response?.data?.error))
  }

  const handleSelectRepo = (id: number) => {
    setSelectedRepo(id)
    namespacesApi.list(id).then(r => setNamespaces(r.data)).catch(() => {})
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">仓库管理</h1>
          <p className="page-subtitle">管理 Maven、npm、Docker、二进制等类型的制品仓库</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 新建仓库</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>仓库名称</th>
              <th>类型</th>
              <th>格式</th>
              <th>仓库地址</th>
              <th>描述</th>
              <th>制品数</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {repos.map(r => (
              <tr key={r.id} style={selectedRepo === r.id ? { background: 'rgba(59,130,246,0.08)' } : {}}>
                <td>
                  <a style={{ color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => navigate(`/repositories/${r.id}`)}>{r.name}</a>
                </td>
                <td><span className={`badge badge-${r.type}`}>{r.type}</span></td>
                <td><span className={`badge badge-${r.format}`}>{r.format}</span></td>
                <td style={{ fontSize: 11 }}>
                  <span className="code" style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    {r.url}
                  </span>
                  <button className="btn btn-sm btn-ghost" style={{ marginLeft: 6, padding: '1px 6px' }}
                    onClick={() => { navigator.clipboard.writeText(r.url); alert('已复制到剪贴板'); }}>
                    📋
                  </button>
                </td>
                <td>{r.description}</td>
                <td>{r.artifact_count}</td>
                <td style={{ color: '#64748b', fontSize: 12 }}>{r.created_at}</td>
                <td>
                  <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/repositories/${r.id}`)}>详情</button>
                  <button className="btn btn-sm btn-ghost" style={{ color: '#ef4444' }} onClick={() => handleDelete(r.id, r.name)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRepo && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">
            命名空间列表 ({repos.find(r => r.id === selectedRepo)?.name})
            <button className="btn btn-sm btn-ghost" style={{ float: 'right' }} onClick={() => setSelectedRepo(null)}>关闭</button>
          </div>
          <table>
            <thead>
              <tr><th>名称</th><th>描述</th><th>制品数</th></tr>
            </thead>
            <tbody>
              {namespaces.map(ns => (
                <tr key={ns.id}>
                  <td style={{ fontWeight: 600 }}>{ns.name}</td>
                  <td>{ns.description || '-'}</td>
                  <td>{ns.artifact_count}</td>
                </tr>
              ))}
              {namespaces.length === 0 && <tr><td colSpan={3} className="empty">暂无命名空间</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">新建仓库</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">仓库名称 *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例如 maven-release" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">类型 *</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="maven">Maven</option>
                    <option value="npm">NPM</option>
                    <option value="docker">Docker</option>
                    <option value="binary">Binary</option>
                    <option value="generic">Generic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">格式</label>
                  <select className="form-select" value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}>
                    <option value="release">Release</option>
                    <option value="snapshot">Snapshot</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="简要描述该仓库用途" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}