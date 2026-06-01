import { useState, useEffect } from 'react'
import { retentionApi, repositoriesApi } from '../api.js'

export default function Retention() {
  const [policies, setPolicies] = useState<any[]>([])
  const [repos, setRepos] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ repoId: '', name: '', type: 'snapshot_expiry', params: { days: 30 } })

  const load = () => {
    retentionApi.list().then(r => setPolicies(r.data)).catch(() => {})
    repositoriesApi.list().then(r => setRepos(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const handleCreate = () => {
    if (!form.repoId || !form.name.trim()) return
    retentionApi.create(form).then(() => {
      load()
      setShowCreate(false)
      setForm({ repoId: '', name: '', type: 'snapshot_expiry', params: { days: 30 } })
    }).catch(e => alert(e.response?.data?.error))
  }

  const handleToggle = (id: number) => {
    retentionApi.toggle(id).then(() => load()).catch(() => {})
  }

  const handleRemove = (id: number, name: string) => {
    if (!confirm('确定删除策略 ' + name + '？')) return
    retentionApi.remove(id).then(() => load()).catch(() => {})
  }

  const handleExecute = (id: number, name: string) => {
    if (!confirm('确定立即执行策略 ' + name + '？此操作将清理符合条件的版本。')) return
    retentionApi.execute(id).then(r => {
      alert(`清理完成，共清理 ${r.data.cleaned} 个版本`)
      load()
    }).catch(e => alert(e.response?.data?.error))
  }

  const typeLabels: Record<string, string> = {
    snapshot_expiry: '快照过期', low_frequency: '低频清理', size_based: '大小策略', count_based: '版本数量',
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">清理策略</h1>
          <p className="page-subtitle">配置快照过期、低频制品清理等保留策略，避免仓库无限膨胀</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 新建策略</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>策略名称</th>
              <th>仓库</th>
              <th>类型</th>
              <th>参数</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {policies.map(p => {
              const params = JSON.parse(p.params || '{}')
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.repo_name}</td>
                  <td><span className="badge badge-info">{typeLabels[p.type] || p.type}</span></td>
                  <td style={{ fontSize: 12 }}>
                    {params.days && `${params.days} 天`}
                    {params.count && `保留最近 ${params.count} 个版本`}
                  </td>
                  <td>{p.enabled ? <span style={{ color: '#22c55e' }}>✓ 启用</span> : <span style={{ color: '#64748b' }}>○ 禁用</span>}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{p.created_at}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={() => handleExecute(p.id, p.name)}>执行</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => handleToggle(p.id)}>{p.enabled ? '禁用' : '启用'}</button>
                    <button className="btn btn-sm btn-ghost" style={{ color: '#ef4444' }} onClick={() => handleRemove(p.id, p.name)}>删除</button>
                  </td>
                </tr>
              )
            })}
            {policies.length === 0 && <tr><td colSpan={7} className="empty">暂无策略</td></tr>}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">新建清理策略</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">策略名称 *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例如 快照30天过期" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">仓库 *</label>
                  <select className="form-select" value={form.repoId} onChange={e => setForm({ ...form, repoId: e.target.value })}>
                    <option value="">选择仓库...</option>
                    {repos.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">类型 *</label>
                  <select className="form-select" value={form.type} onChange={e => {
                    const type = e.target.value
                    const newParams = type === 'count_based' ? { count: 20 } : { days: 30 }
                    setForm({ ...form, type, params: newParams })
                  }}>
                    <option value="snapshot_expiry">快照过期</option>
                    <option value="low_frequency">低频清理</option>
                    <option value="count_based">版本数量</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                {form.type === 'count_based' ? (
                  <>
                    <label className="form-label">保留最近 N 个版本</label>
                    <input className="form-input" type="number" value={form.params.count}
                      onChange={e => setForm({ ...form, params: { count: Number(e.target.value) } })} />
                  </>
                ) : (
                  <>
                    <label className="form-label">过期天数</label>
                    <input className="form-input" type="number" value={form.params.days}
                      onChange={e => setForm({ ...form, params: { days: Number(e.target.value) } })} />
                  </>
                )}
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