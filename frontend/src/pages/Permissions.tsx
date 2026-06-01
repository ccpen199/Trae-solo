import { useState, useEffect } from 'react'
import { permissionsApi, repositoriesApi, usersApi } from '../api.js'

export default function Permissions() {
  const [perms, setPerms] = useState<any[]>([])
  const [repos, setRepos] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ repoId: '', subject: '', action: 'download' })

  const load = () => {
    permissionsApi.list().then(r => setPerms(r.data)).catch(() => {})
    repositoriesApi.list().then(r => setRepos(r.data)).catch(() => {})
    usersApi.list().then(r => setUsers(r.data)).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const handleCreate = () => {
    if (!form.repoId || !form.subject || !form.action) return
    permissionsApi.create(form).then(() => {
      load()
      setShowCreate(false)
      setForm({ repoId: '', subject: '', action: 'download' })
    }).catch(e => alert(e.response?.data?.error))
  }

  const handleRemove = (id: number) => {
    if (!confirm('确定撤销此权限？')) return
    permissionsApi.remove(id).then(() => load()).catch(() => {})
  }

  const actionLabels: Record<string, string> = {
    upload: '上传', download: '下载', delete: '删除', promote: '晋级', manage: '管理',
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">权限控制</h1>
          <p className="page-subtitle">管理各仓库的上传、下载、删除、晋级和管理操作权限</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 授权</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>仓库</th>
              <th>主体</th>
              <th>操作</th>
              <th>状态</th>
              <th>授权时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {perms.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.repo_name}</td>
                <td>
                  {users.find(u => u.username === p.subject) ? (
                    <span>👤 {p.subject} <span className="tag">{users.find(u => u.username === p.subject)?.role}</span></span>
                  ) : (
                    <span>{p.subject}</span>
                  )}
                </td>
                <td><span className="badge badge-info">{actionLabels[p.action] || p.action}</span></td>
                <td>{p.granted ? <span style={{ color: '#22c55e' }}>✓ 已授权</span> : <span style={{ color: '#ef4444' }}>✗ 已撤销</span>}</td>
                <td style={{ color: '#64748b', fontSize: 12 }}>{p.created_at}</td>
                <td>
                  <button className="btn btn-sm btn-ghost" style={{ color: '#ef4444' }} onClick={() => handleRemove(p.id)}>撤销</button>
                </td>
              </tr>
            ))}
            {perms.length === 0 && <tr><td colSpan={6} className="empty">暂无权限记录</td></tr>}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">新建权限</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">仓库 *</label>
                <select className="form-select" value={form.repoId} onChange={e => setForm({ ...form, repoId: e.target.value })}>
                  <option value="">选择仓库...</option>
                  {repos.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">主体 (用户名/角色) *</label>
                <input className="form-input" list="user-list" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="例如 admin 或 developer" />
                <datalist id="user-list">
                  {users.map(u => <option key={u.id} value={u.username}>{u.role}</option>)}
                </datalist>
              </div>
              <div className="form-group">
                <label className="form-label">操作类型 *</label>
                <select className="form-select" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
                  <option value="upload">上传</option>
                  <option value="download">下载</option>
                  <option value="delete">删除</option>
                  <option value="promote">晋级</option>
                  <option value="manage">管理</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>授权</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}