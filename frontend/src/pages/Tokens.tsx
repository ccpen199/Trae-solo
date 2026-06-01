import { useState, useEffect } from 'react'
import { tokensApi } from '../api.js'

export default function Tokens() {
  const [tokens, setTokens] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', subject: '', scope: '', expiresAt: '' })

  const load = () => {
    tokensApi.list().then(r => setTokens(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const handleExpiryChange = (val: string) => {
    const formatted = val.replace('T', ' ') + ':00'
    setForm({ ...form, expiresAt: formatted })
  }

  const handleCreate = () => {
    if (!form.name.trim() || !form.subject.trim()) return
    tokensApi.create(form).then(r => {
      alert('Token 创建成功: ' + r.data.token)
      load()
      setShowCreate(false)
      setForm({ name: '', subject: '', scope: '', expiresAt: '' })
    }).catch(e => alert(e.response?.data?.error))
  }

  const handleRemove = (id: number, name: string) => {
    if (!confirm('确定删除 Token ' + name + '？')) return
    tokensApi.remove(id).then(() => load()).catch(() => {})
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">访问令牌</h1>
          <p className="page-subtitle">为外部项目或 CI/CD 系统创建带有效期和权限范围的 Token</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 新建 Token</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>Token</th>
              <th>主体</th>
              <th>权限范围</th>
              <th>过期时间</th>
              <th>最后使用</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(t => {
              const isExpired = t.expires_at && new Date(t.expires_at) < new Date()
              return (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td><span className="code">{t.token.slice(0, 12)}...</span></td>
                  <td>{t.subject}</td>
                  <td style={{ fontSize: 11, color: '#94a3b8' }}>{t.scope}</td>
                  <td style={{ color: isExpired ? '#ef4444' : '#22c55e' }}>
                    {t.expires_at || '永不过期'}
                  </td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{t.last_used_at || '-'}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{t.created_at}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost" style={{ color: '#ef4444' }} onClick={() => handleRemove(t.id, t.name)}>删除</button>
                  </td>
                </tr>
              )
            })}
            {tokens.length === 0 && <tr><td colSpan={8} className="empty">暂无 Token</td></tr>}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">新建访问令牌</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">名称 *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例如 生产部署 Token" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">主体 *</label>
                  <input className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="例如 ci-bot" />
                </div>
                <div className="form-group">
                  <label className="form-label">过期时间</label>
                  <input className="form-input" type="datetime-local" value={form.expiresAt} onChange={e => handleExpiryChange(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">权限范围 *</label>
                <input className="form-input" value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} placeholder="例如 maven-release:download,npm-release:download" />
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