import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Copy, ChevronDown, ChevronRight, KeyRound } from 'lucide-react'
import { api } from '@/utils/api'
import { EmptyState, SkeletonList } from '@/components/StateFeedback'
import type { ApiKey } from '@/types'

const PERM_OPTIONS = ['posts', 'geo', 'stats'] as const
const PERM_LABEL: Record<string, string> = { posts: '内容查询', geo: '地理围栏', stats: '统计数据' }

const API_DOCS = [
  { group: '内容查询接口', endpoints: [{ method: 'GET', path: '/api/posts', desc: '获取信息列表', example: '{ "success": true, "data": { "posts": [], "total": 0 } }' }] },
  { group: '地理围栏接口', endpoints: [{ method: 'GET', path: '/api/geo/regions', desc: '获取行政区域', example: '{ "success": true, "data": [{ "code": "110000", "name": "北京市" }] }' }] },
  { group: '统计数据接口', endpoints: [{ method: 'GET', path: '/api/stats/traffic', desc: '获取流量趋势', example: '{ "success": true, "data": { "viewsTrend": [], "leadsTrend": [] } }' }] },
]

export default function Api() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formOrg, setFormOrg] = useState('')
  const [formPerms, setFormPerms] = useState<string[]>(['posts'])
  const [totalCalls, setTotalCalls] = useState(0)
  const [byOrg, setByOrg] = useState<{ org: string; calls: number }[]>([])
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [keysLoading, setKeysLoading] = useState(true)

  useEffect(() => {
    setKeysLoading(true)
    api.open.keys().then(d => { setKeys(d); setKeysLoading(false) }).catch(() => {
      setKeys([
        { id: '1', name: '融媒体数据接口', key: 'sk-a3f8d2e1b9c04f6e8d7a2b5c6f0e1d3a', org: '北京融媒体中心', permissions: ['posts', 'geo'], callCount: 12845, status: 'active' },
        { id: '2', name: '政务数据平台', key: 'sk-b7c9e4f2a1d03b5c8e7f6a4d2c0b9e1f', org: '上海数据局', permissions: ['posts', 'stats'], callCount: 8432, status: 'active' },
        { id: '3', name: '监测预警系统', key: 'sk-c1d3e5f7a9b0c2d4e6f8a0b2c4d6e8f0', org: '深圳网信办', permissions: ['posts', 'geo', 'stats'], callCount: 32156, status: 'suspended' },
      ])
      setKeysLoading(false)
    })
    api.open.stats().then(d => { setTotalCalls(d.totalCalls); setByOrg(d.byOrg) }).catch(() => {
      setTotalCalls(53433)
      setByOrg([{ org: '北京融媒体中心', calls: 12845 }, { org: '上海数据局', calls: 8432 }, { org: '深圳网信办', calls: 32156 }])
    })
  }, [])

  const handleCreate = () => {
    if (!formName || !formOrg) return
    api.open.createKey({ name: formName, org: formOrg, permissions: formPerms }).then(k => { setKeys(prev => [...prev, k]); resetForm() }).catch(() => {
      setKeys(prev => [...prev, { id: String(Date.now()), name: formName, key: 'sk-' + Math.random().toString(36).slice(2, 34), org: formOrg, permissions: formPerms, callCount: 0, status: 'active' as const }])
      resetForm()
    })
  }

  const resetForm = () => { setFormName(''); setFormOrg(''); setFormPerms(['posts']); setShowForm(false) }

  const handleDelete = (id: string) => {
    api.open.deleteKey(id).then(() => setKeys(prev => prev.filter(k => k.id !== id))).catch(() => {
      setKeys(prev => prev.filter(k => k.id !== id))
    })
  }

  const toggleSuspend = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: k.status === 'active' ? 'suspended' as const : 'active' as const } : k))
  }

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key).catch(() => {})
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleDoc = (group: string) => {
    setExpandedDocs(prev => { const next = new Set(prev); next.has(group) ? next.delete(group) : next.add(group); return next })
  }

  const maskKey = (key: string) => key.slice(0, 7) + '...' + key.slice(-4)
  const maxCalls = Math.max(...byOrg.map(o => o.calls), 1)

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Key className="w-8 h-8 text-navy-800" />
        <div>
          <h1 className="text-2xl font-bold text-navy-800">API开放管理</h1>
          <p className="text-sm text-slate-500">为政府融媒体中心提供数据接口</p>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-navy-800">API密钥管理</h2>
          <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> 创建Key
          </button>
        </div>
        {showForm && (
          <div className="p-3 bg-slate-50 rounded-lg mb-3 space-y-2">
            <input className="input-field" placeholder="名称" value={formName} onChange={e => setFormName(e.target.value)} />
            <input className="input-field" placeholder="机构" value={formOrg} onChange={e => setFormOrg(e.target.value)} />
            <div className="flex gap-3">
              {PERM_OPTIONS.map(p => (
                <label key={p} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={formPerms.includes(p)} onChange={e => setFormPerms(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))} />
                  {PERM_LABEL[p]}
                </label>
              ))}
            </div>
            <button className="btn-primary text-sm" onClick={handleCreate}>提交</button>
          </div>
        )}
        {keysLoading ? (
          <SkeletonList count={4} />
        ) : keys.length === 0 ? (
          <EmptyState
            icon={<KeyRound className="w-10 h-10 text-slate-300 mb-1" />}
            title="暂无API密钥"
            description="点击右上角创建按钮，为合作机构生成API密钥"
            className="py-8"
          />
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-slate-500"><th className="text-left py-2">名称</th><th className="text-left py-2">机构</th><th className="text-left py-2">密钥</th><th className="text-left py-2">权限</th><th className="text-left py-2">调用次数</th><th className="text-left py-2">状态</th><th className="text-left py-2">操作</th></tr></thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{k.name}</td>
                  <td className="py-2 text-slate-600">{k.org}</td>
                  <td className="py-2"><span className="font-mono text-xs">{maskKey(k.key)}</span><button className="ml-1 text-slate-400 hover:text-navy-800" onClick={() => copyKey(k.key, k.id)}><Copy className="w-3.5 h-3.5" /></button>{copiedKey === k.id && <span className="text-xs text-emerald-500 ml-1">已复制</span>}</td>
                  <td className="py-2">{k.permissions.map(p => <span key={p} className="badge badge-info mr-1">{PERM_LABEL[p]}</span>)}</td>
                  <td className="py-2">{k.callCount.toLocaleString()}</td>
                  <td className="py-2"><span className={`badge ${k.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{k.status === 'active' ? '启用' : '停用'}</span></td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <button className="btn-outline text-xs px-2 py-1" onClick={() => toggleSuspend(k.id)}>{k.status === 'active' ? '停用' : '启用'}</button>
                      <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(k.id)}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-4 mb-6">
        <h2 className="font-semibold text-navy-800 mb-3">调用统计</h2>
        <div className="text-3xl font-bold text-navy-800 mb-4">{totalCalls.toLocaleString()}<span className="text-sm text-slate-500 ml-2">总调用次数</span></div>
        <div className="space-y-2">
          {byOrg.map(o => (
            <div key={o.org} className="flex items-center gap-3">
              <span className="w-36 text-sm text-slate-600 truncate">{o.org}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div className="bg-navy-600 h-full rounded-full flex items-center px-3" style={{ width: `${(o.calls / maxCalls) * 100}%` }}>
                  <span className="text-white text-xs">{o.calls.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold text-navy-800 mb-3">接口文档</h2>
        <div className="space-y-2">
          {API_DOCS.map(doc => (
            <div key={doc.group} className="border rounded-lg">
              <button className="w-full flex items-center gap-2 p-3 text-left hover:bg-slate-50" onClick={() => toggleDoc(doc.group)}>
                {expandedDocs.has(doc.group) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium text-sm">{doc.group}</span>
              </button>
              {expandedDocs.has(doc.group) && (
                <div className="px-3 pb-3 space-y-2">
                  {doc.endpoints.map(ep => (
                    <div key={ep.path} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge bg-emerald-100 text-emerald-700 text-xs">{ep.method}</span>
                        <code className="text-sm font-mono">{ep.path}</code>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{ep.desc}</p>
                      <pre className="bg-navy-900 text-emerald-300 rounded p-2 text-xs overflow-x-auto">{ep.example}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
