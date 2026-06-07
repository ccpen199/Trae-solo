import { useEffect, useState } from 'react'
import { Wallet, Plus, Pencil, X, Check, DollarSign } from 'lucide-react'
import { api } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'

interface IncomeSummary {
  rider_id: number
  rider_name: string
  order_count: number
  total_delivery_fee: number
  total_tier_surcharge: number
  total_time_subsidy: number
  total_referral_bonus: number
  total_amount: number
}

interface IncomeRecord {
  id: number
  rider_id: number
  order_id: number
  delivery_fee: number
  tier_surcharge: number
  time_subsidy: number
  referral_bonus: number
  total_amount: number
  settle_status: string
  created_at: string
}

interface PricingRule {
  id: number
  name: string
  type: string
  base_distance: number
  base_fee: number
  extra_per_km: number
  time_start: string
  time_end: string
  subsidy_rate: number
  tier_thresholds: string
  is_active: number
}

type TabKey = 'overview' | 'rules'

const emptyRule = {
  name: '',
  type: 'base',
  base_distance: 3,
  base_fee: 5,
  extra_per_km: 1.5,
  time_start: '',
  time_end: '',
  subsidy_rate: 0,
  tier_thresholds: '',
  is_active: 1,
}

export default function SettlementCenter() {
  const addToast = useAppStore((s) => s.addToast)
  const [tab, setTab] = useState<TabKey>('overview')
  const [summary, setSummary] = useState<IncomeSummary[]>([])
  const [overallTotal, setOverallTotal] = useState(0)
  const [rules, setRules] = useState<PricingRule[]>([])
  const [editingRule, setEditingRule] = useState<typeof emptyRule | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [riderIncomes, setRiderIncomes] = useState<IncomeRecord[]>([])
  const [selectedRiderId, setSelectedRiderId] = useState('')
  const [settling, setSettling] = useState(false)

  useEffect(() => {
    setLoading(true)
    api<{ summary: IncomeSummary[]; overall_total: number }>('/api/settlement/income').then((r) => {
      if (r.success) {
        setSummary(r.data!.summary)
        setOverallTotal(r.data!.overall_total)
      }
      setLoading(false)
    })
    api<PricingRule[]>('/api/settlement/rules').then((r) => {
      if (r.success) setRules(r.data!)
    })
  }, [])

  async function loadRiderIncomes(riderId: string) {
    if (!riderId) {
      setRiderIncomes([])
      return
    }
    const res = await api<IncomeRecord[]>(`/api/riders/${riderId}/income`)
    if (res.success) setRiderIncomes(res.data!)
  }

  function handleSelectRider(riderId: string) {
    setSelectedRiderId(riderId)
    loadRiderIncomes(riderId)
  }

  async function handleSettleIncome(incomeId: number) {
    const res = await api(`/api/settlement/settle/${incomeId}`, { method: 'PUT' })
    if (res.success) {
      addToast('结算成功', 'success')
      setRiderIncomes((prev) =>
        prev.map((r) => (r.id === incomeId ? { ...r, settle_status: 'settled' } : r))
      )
    } else {
      addToast(res.error || '结算失败', 'error')
    }
  }

  async function handleBatchSettle() {
    if (!selectedRiderId) {
      addToast('请先选择骑手', 'error')
      return
    }
    const pendingIds = riderIncomes
      .filter((r) => r.settle_status === 'pending')
      .map((r) => r.id)
    if (pendingIds.length === 0) {
      addToast('没有待结算记录', 'info')
      return
    }
    setSettling(true)
    let successCount = 0
    for (const incomeId of pendingIds) {
      const res = await api(`/api/settlement/settle/${incomeId}`, { method: 'PUT' })
      if (res.success) successCount++
    }
    setSettling(false)
    addToast(`已结算 ${successCount}/${pendingIds.length} 条记录`, 'success')
    loadRiderIncomes(selectedRiderId)
  }

  const pendingTotal = summary.reduce((s, r) => s + r.total_amount, 0)

  function startEdit(rule?: PricingRule) {
    if (rule) {
      setEditId(rule.id)
      setEditingRule({
        name: rule.name,
        type: rule.type,
        base_distance: rule.base_distance,
        base_fee: rule.base_fee,
        extra_per_km: rule.extra_per_km,
        time_start: rule.time_start,
        time_end: rule.time_end,
        subsidy_rate: rule.subsidy_rate,
        tier_thresholds: rule.tier_thresholds,
        is_active: rule.is_active,
      })
    } else {
      setEditId(null)
      setEditingRule({ ...emptyRule })
    }
  }

  function cancelEdit() {
    setEditId(null)
    setEditingRule(null)
  }

  async function saveRule() {
    if (!editingRule || !editingRule.name || !editingRule.type) {
      addToast('请填写规则名称和类型', 'error')
      return
    }
    const url = editId ? `/api/settlement/rules/${editId}` : '/api/settlement/rules'
    const method = editId ? 'PUT' : 'POST'
    const res = await api(url, {
      method,
      body: JSON.stringify(editingRule),
    })
    if (res.success) {
      addToast(editId ? '规则更新成功' : '规则添加成功', 'success')
      cancelEdit()
      const r = await api<PricingRule[]>('/api/settlement/rules')
      if (r.success) setRules(r.data!)
    } else {
      addToast(res.error || '操作失败', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-3">
        <button
          onClick={() => setTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'overview' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Wallet size={16} /> 收入概览
        </button>
        <button
          onClick={() => setTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'rules' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          计价规则
        </button>
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="text-sm text-gray-500">总收入</div>
              <div className="text-2xl font-bold text-primary mt-1">¥{overallTotal.toFixed(2)}</div>
            </div>
            <div className="card p-5">
              <div className="text-sm text-gray-500">今日收入</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">¥{pendingTotal.toFixed(2)}</div>
            </div>
            <div className="card p-5">
              <div className="text-sm text-gray-500">活跃骑手</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{summary.length}</div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">骑手</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">订单数</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">配送费</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">阶梯加价</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">时段补贴</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">推荐奖金</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">合计</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">加载中...</td></tr>
                ) : summary.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">暂无数据</td></tr>
                ) : (
                  summary.map((s) => (
                    <tr key={s.rider_id} className={`border-b border-gray-50 ${selectedRiderId === String(s.rider_id) ? 'bg-primary/5' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.rider_name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{s.order_count}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">¥{s.total_delivery_fee?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">¥{s.total_tier_surcharge?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">¥{s.total_time_subsidy?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">¥{s.total_referral_bonus?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-sm font-bold text-primary">¥{s.total_amount?.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleSelectRider(String(s.rider_id))}
                          className="text-primary hover:text-primary-light text-sm flex items-center gap-1"
                        >
                          <DollarSign size={14} /> 结算
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedRiderId && riderIncomes.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign size={16} className="text-primary" /> 收入明细
                </h3>
                <button
                  onClick={handleBatchSettle}
                  disabled={settling || riderIncomes.filter((r) => r.settle_status === 'pending').length === 0}
                  className="btn-primary text-xs flex items-center gap-1"
                >
                  <Check size={12} /> {settling ? '结算中...' : '批量结算'}
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">ID</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">订单ID</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">配送费</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">阶梯加价</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">时段补贴</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">推荐奖金</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">合计</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">状态</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {riderIncomes.map((rec) => (
                    <tr key={rec.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm text-gray-600">#{rec.id}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">#{rec.order_id}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">¥{rec.delivery_fee}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">¥{rec.tier_surcharge}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">¥{rec.time_subsidy}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">¥{rec.referral_bonus}</td>
                      <td className="px-5 py-3 text-sm font-bold text-primary">¥{rec.total_amount}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rec.settle_status === 'settled' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {rec.settle_status === 'settled' ? '已结算' : '待结算'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {rec.settle_status === 'pending' && (
                          <button
                            onClick={() => handleSettleIncome(rec.id)}
                            className="text-emerald-600 hover:text-emerald-700 text-sm"
                          >
                            结算
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => startEdit()} className="btn-accent flex items-center gap-1">
              <Plus size={14} /> 添加规则
            </button>
          </div>

          {editingRule && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">{editId ? '编辑规则' : '添加规则'}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">规则名称</label>
                  <input className="input-base w-full" value={editingRule.name} onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">类型</label>
                  <select className="select-base w-full" value={editingRule.type} onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value })}>
                    <option value="base">基础计价</option>
                    <option value="peak">高峰时段</option>
                    <option value="weather">恶劣天气</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">基础距离(km)</label>
                  <input type="number" step="0.1" className="input-base w-full" value={editingRule.base_distance} onChange={(e) => setEditingRule({ ...editingRule, base_distance: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">基础费用(元)</label>
                  <input type="number" step="0.5" className="input-base w-full" value={editingRule.base_fee} onChange={(e) => setEditingRule({ ...editingRule, base_fee: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">超公里费(元/km)</label>
                  <input type="number" step="0.1" className="input-base w-full" value={editingRule.extra_per_km} onChange={(e) => setEditingRule({ ...editingRule, extra_per_km: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">补贴比例</label>
                  <input type="number" step="0.1" className="input-base w-full" value={editingRule.subsidy_rate} onChange={(e) => setEditingRule({ ...editingRule, subsidy_rate: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">时段开始</label>
                  <input className="input-base w-full" placeholder="如 11:00" value={editingRule.time_start} onChange={(e) => setEditingRule({ ...editingRule, time_start: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">时段结束</label>
                  <input className="input-base w-full" placeholder="如 13:00" value={editingRule.time_end} onChange={(e) => setEditingRule({ ...editingRule, time_end: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">启用</label>
                  <select className="select-base w-full" value={editingRule.is_active} onChange={(e) => setEditingRule({ ...editingRule, is_active: Number(e.target.value) })}>
                    <option value={1}>启用</option>
                    <option value={0}>禁用</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveRule} className="btn-primary flex items-center gap-1"><Check size={14} /> 保存</button>
                <button onClick={cancelEdit} className="btn-outline flex items-center gap-1"><X size={14} /> 取消</button>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">规则名称</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">类型</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">基础距离</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">基础费用</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">超公里费</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">时段</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">补贴</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">状态</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{rule.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{rule.type === 'base' ? '基础' : rule.type === 'peak' ? '高峰' : '天气'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{rule.base_distance}km</td>
                    <td className="px-5 py-3 text-sm text-gray-600">¥{rule.base_fee}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">¥{rule.extra_per_km}/km</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{rule.time_start && rule.time_end ? `${rule.time_start}-${rule.time_end}` : '全天'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{rule.subsidy_rate > 0 ? `${(rule.subsidy_rate * 100).toFixed(0)}%` : '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {rule.is_active ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => startEdit(rule)} className="text-primary hover:text-primary-light text-sm flex items-center gap-1">
                        <Pencil size={14} /> 编辑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
