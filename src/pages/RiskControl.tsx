import { useEffect, useState } from 'react'
import { Shield, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { api } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'

interface RiskRule {
  id: number
  name: string
  type: string
  condition_config: string
  action_config: string
  is_active: number
  priority: number
  created_at: string
}

const emptyForm = {
  name: '',
  type: 'trajectory',
  condition_config: '',
  action_config: '',
  is_active: 1,
  priority: 0,
}

const typeMap: Record<string, string> = {
  trajectory: '轨迹风控',
  health_code: '健康码风控',
  load: '负载风控',
  behavior: '行为风控',
}

export default function RiskControl() {
  const addToast = useAppStore((s) => s.addToast)
  const [rules, setRules] = useState<RiskRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  useEffect(() => {
    setLoading(true)
    api<RiskRule[]>('/api/risk/rules').then((r) => {
      if (r.success) setRules(r.data!)
      setLoading(false)
    })
  }, [])

  function startEdit(rule?: RiskRule) {
    if (rule) {
      setEditId(rule.id)
      setForm({
        name: rule.name,
        type: rule.type,
        condition_config: typeof rule.condition_config === 'string' ? rule.condition_config : JSON.stringify(rule.condition_config),
        action_config: typeof rule.action_config === 'string' ? rule.action_config : JSON.stringify(rule.action_config),
        is_active: rule.is_active,
        priority: rule.priority,
      })
    } else {
      setEditId(null)
      setForm({ ...emptyForm })
    }
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm({ ...emptyForm })
  }

  async function saveRule() {
    if (!form.name || !form.type || !form.condition_config || !form.action_config) {
      addToast('请填写所有必填项', 'error')
      return
    }
    let conditionConfig = form.condition_config
    let actionConfig = form.action_config
    try {
      conditionConfig = JSON.parse(conditionConfig)
    } catch { /* keep as string */ }
    try {
      actionConfig = JSON.parse(actionConfig)
    } catch { /* keep as string */ }

    const url = editId ? `/api/risk/rules/${editId}` : '/api/risk/rules'
    const method = editId ? 'PUT' : 'POST'
    const res = await api(url, {
      method,
      body: JSON.stringify({ ...form, condition_config: conditionConfig, action_config: actionConfig }),
    })
    if (res.success) {
      addToast(editId ? '规则更新成功' : '规则添加成功', 'success')
      cancelForm()
      const r = await api<RiskRule[]>('/api/risk/rules')
      if (r.success) setRules(r.data!)
    } else {
      addToast(res.error || '操作失败', 'error')
    }
  }

  async function deleteRule(id: number) {
    const res = await api(`/api/risk/rules/${id}`, { method: 'DELETE' })
    if (res.success) {
      addToast('规则已删除', 'success')
      setRules((prev) => prev.filter((r) => r.id !== id))
    } else {
      addToast(res.error || '删除失败', 'error')
    }
  }

  async function toggleActive(rule: RiskRule) {
    const newActive = rule.is_active ? 0 : 1
    const res = await api(`/api/risk/rules/${rule.id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: newActive }),
    })
    if (res.success) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_active: newActive } : r)))
      addToast(newActive ? '规则已启用' : '规则已禁用', 'success')
    } else {
      addToast(res.error || '操作失败', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield size={20} className="text-primary" /> 风控策略
        </h1>
        <button onClick={() => startEdit()} className="btn-accent flex items-center gap-1">
          <Plus size={14} /> 添加规则
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{editId ? '编辑规则' : '添加规则'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">规则名称 <span className="text-red-500">*</span></label>
              <input className="input-base w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如: 轨迹偏离预警" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">规则类型 <span className="text-red-500">*</span></label>
              <select className="select-base w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="trajectory">轨迹风控</option>
                <option value="health_code">健康码风控</option>
                <option value="load">负载风控</option>
                <option value="behavior">行为风控</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">条件配置 <span className="text-red-500">*</span></label>
              <textarea className="input-base w-full h-20 resize-none" value={form.condition_config} onChange={(e) => setForm({ ...form, condition_config: e.target.value })} placeholder='如: {"max_distance":500}' />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">动作配置 <span className="text-red-500">*</span></label>
              <textarea className="input-base w-full h-20 resize-none" value={form.action_config} onChange={(e) => setForm({ ...form, action_config: e.target.value })} placeholder='如: {"action":"alert","notify":"dispatcher"}' />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">优先级</label>
              <input type="number" className="input-base w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">启用状态</label>
              <select className="select-base w-full" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}>
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveRule} className="btn-primary flex items-center gap-1"><Check size={14} /> 保存</button>
            <button onClick={cancelForm} className="btn-outline flex items-center gap-1"><X size={14} /> 取消</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">规则名称</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">类型</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">条件</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">动作</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">优先级</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">状态</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">加载中...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">暂无规则</td></tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{rule.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{typeMap[rule.type] || rule.type}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 max-w-[200px] truncate font-mono">{typeof rule.condition_config === 'string' ? rule.condition_config : JSON.stringify(rule.condition_config)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 max-w-[200px] truncate font-mono">{typeof rule.action_config === 'string' ? rule.action_config : JSON.stringify(rule.action_config)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{rule.priority}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(rule)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors">
                      <span className={`inline-block h-4 w-4 transform rounded-full transition-transform ${rule.is_active ? 'bg-white translate-x-6' : 'bg-white translate-x-1'}`} style={{ backgroundColor: rule.is_active ? '#10B981' : '#D1D5DB' }} />
                      <span className={`absolute inset-0 rounded-full ${rule.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className={`relative inline-block h-4 w-4 rounded-full bg-white transform transition-transform ${rule.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(rule)} className="text-primary hover:text-primary-light text-sm flex items-center gap-1">
                        <Pencil size={14} /> 编辑
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1">
                        <Trash2 size={14} /> 删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
