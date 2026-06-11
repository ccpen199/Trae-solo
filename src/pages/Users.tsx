import { useState } from 'react'
import { Users as UsersIcon, Search, Shield, Ban, TrendingDown } from 'lucide-react'
import { useStore } from '@/store'

const creditBarColor = (s: number) =>
  s >= 90 ? 'bg-green-400' : s >= 70 ? 'bg-green-300' : s >= 50 ? 'bg-orange-400' : s >= 30 ? 'bg-red-500' : 'bg-red-700'

const creditTextColor = (s: number) =>
  s >= 90 ? 'text-green-400' : s >= 70 ? 'text-green-300' : s >= 50 ? 'text-orange-400' : s >= 30 ? 'text-red-400' : 'text-red-600'

const statusBadge: Record<string, string> = {
  '正常': 'badge-success',
  '降权': 'badge-warning',
  '黑名单': 'badge-danger',
}

export default function Users() {
  const { users, creditRecords, updateUserStatus } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [creditMin, setCreditMin] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const total = users.length
  const good = users.filter((u) => u.credit_score >= 70).length
  const downgraded = users.filter((u) => u.status === '降权').length
  const blacklisted = users.filter((u) => u.status === '黑名单').length

  const filtered = users.filter((u) => {
    if (search && !u.phone.includes(search) && !u.nickname.includes(search)) return false
    if (statusFilter && u.status !== statusFilter) return false
    if (creditMin && u.credit_score < Number(creditMin)) return false
    return true
  })

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-electric" />
          用户与信用管理
        </h1>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '总用户', value: total, icon: UsersIcon, color: 'text-electric' },
          { label: '信用良好', value: good, icon: Shield, color: 'text-green-400' },
          { label: '降权中', value: downgraded, icon: TrendingDown, color: 'text-orange-400' },
          { label: '黑名单', value: blacklisted, icon: Ban, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.color} opacity-80`} />
            <div>
              <div className="text-xs text-slate-400">{s.label}</div>
              <div className="text-lg font-semibold text-white">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索手机号/昵称..."
              className="input-field pl-9"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-28">
            <option value="">全部状态</option>
            <option value="正常">正常</option>
            <option value="降权">降权</option>
            <option value="黑名单">黑名单</option>
          </select>
          <input
            type="number"
            value={creditMin}
            onChange={(e) => setCreditMin(e.target.value)}
            placeholder="最低信用分"
            className="input-field w-28"
          />
        </div>

        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                {['用户', '手机号', '信用分', '充电次数', '状态', '最近活跃', '操作'].map((h) => (
                  <th key={h} className="text-xs text-slate-400 uppercase tracking-wider py-3 px-4 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <>
                  <tr key={u.user_id} className="table-row cursor-pointer" onClick={() => toggleExpand(u.user_id)}>
                    <td className="text-sm py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-electric/20 text-electric flex items-center justify-center text-xs font-medium">
                          {u.nickname[0]}
                        </div>
                        <span className="text-slate-200">{u.nickname}</span>
                      </div>
                    </td>
                    <td className="text-sm py-3 px-4 text-slate-300 font-mono">{u.phone}</td>
                    <td className="text-sm py-3 px-4">
                      <div>
                        <span className={`font-mono text-xs ${creditTextColor(u.credit_score)}`}>{u.credit_score}</span>
                        <div className="w-20 h-1.5 bg-dark-500 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full ${creditBarColor(u.credit_score)} rounded-full`} style={{ width: `${u.credit_score}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="text-sm py-3 px-4 text-slate-300 font-mono">{u.charge_count}</td>
                    <td className="text-sm py-3 px-4"><span className={statusBadge[u.status]}>{u.status}</span></td>
                    <td className="text-sm py-3 px-4 text-slate-400">{u.last_active}</td>
                    <td className="text-sm py-3 px-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleExpand(u.user_id)} className="text-electric hover:text-electric-light text-xs transition-colors">详情</button>
                        {u.status === '正常' && (
                          <button onClick={() => updateUserStatus(u.user_id, '降权')} className="badge-warning cursor-pointer">降权</button>
                        )}
                        {u.status === '降权' && (
                          <button onClick={() => updateUserStatus(u.user_id, '正常')} className="badge-success cursor-pointer">恢复</button>
                        )}
                        {u.status === '黑名单' && (
                          <button onClick={() => updateUserStatus(u.user_id, '正常')} className="badge-info cursor-pointer">解除</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === u.user_id && (
                    <tr key={`${u.user_id}-detail`}>
                      <td colSpan={7} className="px-6 py-4 bg-dark-750">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="text-xs text-slate-400 mb-2">信用变动记录</div>
                            {creditRecords
                              .filter((r) => r.user_id === u.user_id)
                              .slice(0, 5)
                              .map((r) => (
                                <div key={r.record_id} className="flex items-center gap-3 py-1.5 text-xs">
                                  <span className={`font-mono font-medium ${r.score_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {r.score_change > 0 ? `+${r.score_change}` : r.score_change}
                                  </span>
                                  <span className="text-slate-300 flex-1">{r.reason}</span>
                                  <span className="text-slate-500">{r.created_at}</span>
                                </div>
                              ))}
                            {creditRecords.filter((r) => r.user_id === u.user_id).length === 0 && (
                              <div className="text-xs text-slate-500">暂无记录</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-2">快捷操作</div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const val = prompt('调整信用分（输入正负数）', '10')
                                  if (val) {
                                    const change = Number(val)
                                    if (!isNaN(change)) updateUserStatus(u.user_id, u.status)
                                  }
                                }}
                                className="px-3 py-1.5 text-xs rounded bg-electric/15 text-electric hover:bg-electric/25 transition-colors"
                              >
                                调整信用分
                              </button>
                              {u.status !== '黑名单' && (
                                <button
                                  onClick={() => updateUserStatus(u.user_id, '黑名单')}
                                  className="px-3 py-1.5 text-xs rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                                >
                                  拉黑用户
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
