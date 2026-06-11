import { useState, useEffect } from 'react'
import { UserCircle, Search, Tag, Target, X, Download, Gift, CheckSquare, Square } from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts'

const MOCK_USERS = [
  { id: 'U1001', name: '张伟', phone: '138****2261', charges: 156, spend: 4230.5, tags: ['高频用户', '快充偏好'], regDate: '2024-03-12', radar: [92, 78, 85, 40, 20] },
  { id: 'U1002', name: '李娜', phone: '139****8834', charges: 43, spend: 890.0, tags: ['价格敏感', '夜间充电'], regDate: '2024-06-01', radar: [35, 25, 20, 72, 10] },
  { id: 'U1003', name: '王强', phone: '136****5517', charges: 89, spend: 3120.8, tags: ['V2G活跃', '高频用户'], regDate: '2023-11-20', radar: [70, 82, 45, 30, 90] },
  { id: 'U1004', name: '赵敏', phone: '158****3390', charges: 12, spend: 210.0, tags: ['新用户'], regDate: '2025-01-15', radar: [10, 8, 15, 5, 3] },
  { id: 'U1005', name: '孙磊', phone: '137****7742', charges: 201, spend: 5680.3, tags: ['高频用户', '快充偏好', '夜间充电'], regDate: '2023-08-05', radar: [95, 90, 88, 65, 35] },
  { id: 'U1006', name: '周雪', phone: '155****1128', charges: 67, spend: 1540.6, tags: ['价格敏感', 'V2G活跃'], regDate: '2024-09-18', radar: [50, 42, 30, 55, 75] },
  { id: 'U1007', name: '吴昊', phone: '186****4456', charges: 110, spend: 3890.2, tags: ['快充偏好', '夜间充电', '高频用户'], regDate: '2023-05-22', radar: [80, 72, 90, 78, 25] },
  { id: 'U1008', name: '陈静', phone: '133****6689', charges: 28, spend: 520.4, tags: ['新用户', '价格敏感'], regDate: '2025-02-10', radar: [22, 15, 12, 18, 5] },
  { id: 'U1009', name: '黄鹏', phone: '159****9923', charges: 178, spend: 4950.0, tags: ['V2G活跃', '高频用户', '快充偏好'], regDate: '2023-02-14', radar: [88, 85, 82, 48, 88] },
  { id: 'U1010', name: '林芳', phone: '152****3351', charges: 55, spend: 1230.7, tags: ['夜间充电', '价格敏感'], regDate: '2024-07-30', radar: [42, 38, 25, 80, 15] },
]

const RADAR_DIMS = ['充电频率', '消费能力', '快充偏好', '夜间充电', 'V2G参与度']
const TAG_COLORS: Record<string, string> = {
  '高频用户': '#00E599', '价格敏感': '#FF8C00', '快充偏好': '#4FC3F7',
  '夜间充电': '#A78BFA', 'V2G活跃': '#00E599', '新用户': '#94A3B8',
}
const PIE_DATA = [
  { name: '高频用户', value: 35, color: '#00E599' }, { name: '价格敏感', value: 25, color: '#FF8C00' },
  { name: '快充偏好', value: 18, color: '#4FC3F7' }, { name: '夜间充电', value: 12, color: '#A78BFA' },
  { name: 'V2G活跃', value: 10, color: '#00E599' },
]
const TAG_CATEGORIES = ['行为标签', '消费标签', '设备偏好', '时段偏好', 'V2G标签']

const CHARGING_FREQ = [
  { day: '周一', 次数: 3 }, { day: '周二', 次数: 2 }, { day: '周三', 次数: 4 },
  { day: '周四', 次数: 1 }, { day: '周五', 次数: 3 }, { day: '周六', 次数: 5 }, { day: '周日', 次数: 2 },
]
const PERIOD_PIE = [
  { name: '日间', value: 40, color: '#4FC3F7' }, { name: '夜间', value: 60, color: '#A78BFA' },
]
const BATCH_TAGS = ['高频用户', '价格敏感', '快充偏好', '夜间充电', 'V2G活跃', '新用户', 'VIP用户', '流失风险']

export default function UserProfile() {
  const [users, setUsers] = useState(MOCK_USERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [couponOpen, setCouponOpen] = useState(false)
  const [couponForm, setCouponForm] = useState({ type: 'discount', amount: '', period: '30' })
  const [newTag, setNewTag] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [batchModal, setBatchModal] = useState(false)
  const [batchTags, setBatchTags] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/admin/user-profiles').then(r => r.json()).then(d => { if (Array.isArray(d)) setUsers(d) }).catch(() => {})
  }, [])

  const selected = users.find(u => u.id === selectedId) || null
  const filtered = users.filter(u => u.name.includes(filter) || u.id.includes(filter) || u.phone.includes(filter))

  const removeTag = (tag: string) => { if (!selected) return; setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, tags: u.tags.filter(t => t !== tag) } : u)) }
  const addTag = () => { if (!selected || !newTag.trim()) return; setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, tags: [...u.tags, newTag.trim()] } : u)); setNewTag('') }

  const toggleSelect = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const applyBatchTags = () => {
    if (!batchTags.length) return
    setUsers(prev => prev.map(u => {
      if (!selectedUsers.has(u.id)) return u
      const merged = [...new Set([...u.tags, ...batchTags])]
      return { ...u, tags: merged }
    }))
    setBatchModal(false)
    setBatchTags([])
    setSelectedUsers(new Set())
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="section-title flex items-center gap-2">
        <UserCircle className="w-5 h-5 text-amber-orange" />用户画像
        <button className="ml-auto btn-secondary flex items-center gap-1 text-sm" onClick={() => alert('导出用户数据中...')}>
          <Download className="w-4 h-4" />导出用户数据
        </button>
      </h2>

      <div className="flex gap-4">
        <div className="w-[60%]">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" />
                <input className="input-field w-full pl-8" placeholder="搜索用户ID/姓名/手机号" value={filter} onChange={e => setFilter(e.target.value)} />
              </div>
              {selectedUsers.size > 0 && (
                <button onClick={() => setBatchModal(true)} className="btn-primary flex items-center gap-1 text-xs whitespace-nowrap">
                  <Tag className="w-3.5 h-3.5" />批量打标 ({selectedUsers.size})
                </button>
              )}
            </div>
            <div className="overflow-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-white/5">
                  <th className="text-left py-2 px-2 w-8"></th>
                  <th className="text-left py-2 px-2">用户ID</th><th className="text-left py-2 px-2">手机号</th>
                  <th className="text-right py-2 px-2">充电次数</th><th className="text-right py-2 px-2">总消费</th><th className="text-right py-2 px-2">标签数</th>
                </tr></thead>
                <tbody>{filtered.map(u => (
                  <tr key={u.id} className={`cursor-pointer border-b border-white/5 transition-colors ${selectedId === u.id ? 'bg-electric-green/10 text-electric-green' : 'hover:bg-white/5 text-gray-300'}`} onClick={() => setSelectedId(u.id)}>
                    <td className="py-2 px-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(u.id)}>
                        {selectedUsers.has(u.id) ? <CheckSquare className="w-4 h-4 text-electric-green" /> : <Square className="w-4 h-4 text-gray-600" />}
                      </button>
                    </td>
                    <td className="py-2 px-2 data-text">{u.id}</td><td className="py-2 px-2">{u.phone}</td>
                    <td className="py-2 px-2 text-right data-text">{u.charges}</td><td className="py-2 px-2 text-right data-text">¥{u.spend.toFixed(1)}</td>
                    <td className="py-2 px-2 text-right">{u.tags.length}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-[40%] space-y-4">
          {selected ? (
            <>
              <div className="glass-card p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-electric-green/20 flex items-center justify-center border border-electric-green/30">
                    <UserCircle className="w-8 h-8 text-electric-green" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-100">{selected.name}</div>
                    <div className="text-xs text-gray-500 data-text">{selected.id}</div>
                  </div>
                  <button className="ml-auto btn-primary flex items-center gap-1 text-xs" onClick={() => setCouponOpen(true)}>
                    <Gift className="w-3.5 h-3.5" />发送优惠券
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="stat-card text-center"><div className="text-xs text-gray-400 mb-1">充电次数</div><div className="data-text text-electric-green text-lg font-bold">{selected.charges}</div></div>
                  <div className="stat-card text-center"><div className="text-xs text-gray-400 mb-1">总消费</div><div className="data-text text-amber-orange text-lg font-bold">¥{selected.spend.toFixed(0)}</div></div>
                  <div className="stat-card text-center"><div className="text-xs text-gray-400 mb-1">注册时间</div><div className="data-text text-ice-blue text-sm font-bold">{selected.regDate.slice(5)}</div></div>
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-2">用户画像雷达</div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={RADAR_DIMS.map((dim, i) => ({ dimension: dim, value: selected.radar[i] }))}>
                    <PolarGrid stroke="#1E2D45" /><PolarAngleAxis dataKey="dimension" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <Radar dataKey="value" stroke="#00E599" fill="#00E599" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />标签云</div>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map(t => (
                    <span key={t} className="px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1"
                      style={{ color: TAG_COLORS[t] || '#94A3B8', borderColor: `${TAG_COLORS[t] || '#94A3B8'}40`, backgroundColor: `${TAG_COLORS[t] || '#94A3B8'}15` }}>
                      {t}<button onClick={() => removeTag(t)} className="hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input className="bg-transparent border border-white/10 rounded px-2 py-0.5 text-xs text-gray-300 w-16 focus:outline-none focus:border-electric-green/40" placeholder="新标签" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} />
                    <button onClick={addTag} className="text-electric-green hover:text-electric-green/80 text-xs">+</button>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-2">充电行为分析</div>
                <div className="h-[140px] mb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CHARGING_FREQ} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                      <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#111D33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="次数" fill="#00E599" radius={[3, 3, 0, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">充电偏好</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="data-text text-ice-blue">快充 78%</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-ice-blue rounded-full" style={{ width: '78%' }} /></div>
                      <span className="data-text text-purple-400">慢充 22%</span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1.5">常用时段</div>
                    <div className="flex items-center gap-1">
                      <ResponsiveContainer width={60} height={40}>
                        <PieChart><Pie data={PERIOD_PIE} dataKey="value" cx="50%" cy="50%" outerRadius={18} innerRadius={10} strokeWidth={0}>
                          {PERIOD_PIE.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.8} />)}
                        </Pie></PieChart>
                      </ResponsiveContainer>
                      <div className="text-[10px] space-y-0.5">
                        <div className="text-ice-blue">日间 40%</div>
                        <div className="text-purple-400">夜间 60%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center text-gray-500">
              <UserCircle className="w-10 h-10 mx-auto mb-2 text-gray-600" />请选择左侧用户查看画像
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-gray-400 mb-3 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />标签管理</div>
          <div className="space-y-2">
            {TAG_CATEGORIES.map((cat, i) => (
              <div key={cat} className="flex items-center justify-between py-2 px-3 rounded bg-white/5 hover:bg-white/8 transition-colors cursor-pointer">
                <span className="text-sm text-gray-300">{cat}</span>
                <span className="text-xs text-gray-500 data-text">{[28, 15, 12, 9, 6][i]}个标签</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-gray-400 mb-2">用户分群</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={PIE_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2} strokeWidth={0}>
              {PIE_DATA.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.8} />)}
            </Pie></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {PIE_DATA.map(d => (<div key={d.name} className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name} {d.value}%</div>))}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-gray-400 mb-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" />精准营销</div>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-500 mb-1 block">目标标签</label>
              <select className="input-field w-full">{Object.keys(TAG_COLORS).map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">优惠券类型</label>
              <select className="input-field w-full"><option value="discount">折扣券</option><option value="cash">现金券</option><option value="free">免费充电券</option></select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">金额 (元)</label><input type="number" className="input-field w-full" placeholder="输入金额" /></div>
            <button className="btn-primary w-full text-sm">发送</button>
          </div>
        </div>
      </div>

      {couponOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCouponOpen(false)}>
          <div className="glass-card p-6 w-[400px] space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-gray-100 font-medium">发送优惠券 — {selected.name}</h3><button onClick={() => setCouponOpen(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-200" /></button></div>
            <div><label className="text-xs text-gray-400 mb-1 block">优惠券类型</label>
              <select value={couponForm.type} onChange={e => setCouponForm(f => ({ ...f, type: e.target.value }))} className="input-field w-full">
                <option value="discount">折扣券</option><option value="cash">现金券</option><option value="free">免费充电券</option>
              </select></div>
            <div><label className="text-xs text-gray-400 mb-1 block">金额 (元)</label>
              <input type="number" value={couponForm.amount} onChange={e => setCouponForm(f => ({ ...f, amount: e.target.value }))} className="input-field w-full" placeholder="输入金额" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">有效期 (天)</label>
              <select value={couponForm.period} onChange={e => setCouponForm(f => ({ ...f, period: e.target.value }))} className="input-field w-full">
                <option value="7">7天</option><option value="15">15天</option><option value="30">30天</option><option value="90">90天</option>
              </select></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setCouponOpen(false)} className="btn-secondary text-sm">取消</button>
              <button onClick={() => setCouponOpen(false)} className="btn-primary text-sm">确认发送</button>
            </div>
          </div>
        </div>
      )}

      {batchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBatchModal(false)}>
          <div className="glass-card p-6 w-[400px] space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-gray-100 font-medium">批量打标 — 已选 {selectedUsers.size} 人</h3><button onClick={() => setBatchModal(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-200" /></button></div>
            <div><label className="text-xs text-gray-400 mb-2 block">选择标签</label>
              <div className="flex flex-wrap gap-2">
                {BATCH_TAGS.map(t => (
                  <button key={t} onClick={() => setBatchTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                    className={`px-3 py-1.5 rounded text-xs border transition-all ${batchTags.includes(t) ? 'border-electric-green/50 bg-electric-green/15 text-electric-green' : 'border-white/10 text-gray-400 hover:text-gray-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setBatchModal(false)} className="btn-secondary text-sm">取消</button>
              <button onClick={applyBatchTags} className={`btn-primary text-sm ${!batchTags.length ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!batchTags.length}>确认打标</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
