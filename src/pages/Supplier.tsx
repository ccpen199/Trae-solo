import { useState } from 'react'
import { Package, Plus, Search, QrCode, ArrowRight, AlertTriangle, CheckCircle, Box, Truck, Wrench, Factory } from 'lucide-react'
import { mockParts } from '@/mocks/data'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'parts' | 'inventory' | 'trace'

const categoryMap: Record<string, string> = {
  air_conditioner: '空调', water_heater: '热水器',
  washing_machine: '洗衣机', refrigerator: '冰箱', tv: '电视', other: '其他',
}

const stockColor = (s: number) => s > 20 ? 'text-cyber-400' : s >= 10 ? 'text-warm-500' : 'text-red-400'
const stockBg = (s: number) => s > 20 ? 'bg-cyber-400/20' : s >= 10 ? 'bg-warm-500/20' : 'bg-red-400/20'

const traceNodes = [
  { icon: Package, label: '原材料', status: 'done' },
  { icon: Factory, label: '生产', status: 'done' },
  { icon: CheckCircle, label: '质检', status: 'done' },
  { icon: Box, label: '仓储', status: 'active' },
  { icon: Truck, label: '配送', status: 'pending' },
  { icon: Wrench, label: '安装', status: 'pending' },
]

const traceRecords = [
  { time: '2026-06-11 14:30', action: '入库', part: '空调压缩机', id: 'p1' },
  { time: '2026-06-11 10:15', action: '质检通过', part: '制冷剂R410A', id: 'p2' },
  { time: '2026-06-10 16:00', action: '出库', part: '洗衣机轴承', id: 'p4' },
  { time: '2026-06-10 09:30', action: '入库', part: '冰箱温控器', id: 'p5' },
]

export default function Supplier() {
  const [tab, setTab] = useState<Tab>('parts')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtered = mockParts.filter(p => p.name.includes(search))
  const totalParts = mockParts.reduce((s, p) => s + p.stock, 0)
  const totalValue = mockParts.reduce((s, p) => s + p.price * p.stock, 0)
  const lowStock = mockParts.filter(p => p.stock < 10).length

  const tabs: { key: Tab; label: string }[] = [
    { key: 'parts', label: '配件列表' },
    { key: 'inventory', label: '库存管理' },
    { key: 'trace', label: '溯源追踪' },
  ]

  return (
    <div className="min-h-screen p-4 pb-8">
      <div className="flex items-center gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'btn-primary' : 'text-navy-200/60 hover:text-cyber-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'parts' && (
          <motion.div key="parts" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-200/40" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="搜索配件名称..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-700/60 border border-cyber-400/15
                    text-sm text-navy-50 placeholder:text-navy-200/30 focus:outline-none focus:border-cyber-400/40" />
              </div>
              <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
                <Plus className="w-4 h-4" />上架配件
              </button>
            </div>

            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="glass-card p-5 mb-5 cyber-border">
                <div className="grid grid-cols-2 gap-4">
                  {['配件名称', '分类', '价格', '库存数量'].map(l => (
                    <div key={l}>
                      <label className="text-xs text-navy-200/60 mb-1 block">{l}</label>
                      <input className="w-full px-3 py-2 rounded-lg bg-navy-700/60 border border-cyber-400/15
                        text-sm text-navy-50 focus:outline-none focus:border-cyber-400/40" placeholder={`输入${l}`} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4 gap-3">
                  <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">取消</button>
                  <button className="btn-primary text-sm">提交</button>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <motion.div key={p.id} layout whileHover={{ y: -4, boxShadow: '0 0 25px rgba(46,242,165,0.15)' }}
                  className="glass-card glass-card-hover p-4 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-navy-50">{p.name}</h3>
                    {p.verified && <CheckCircle className="w-4 h-4 text-cyber-400 shrink-0" />}
                  </div>
                  <span className="tag-cyber mb-3 inline-block">{categoryMap[p.category] || p.category}</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-lg font-bold text-cyber-400">¥{p.price}</span>
                    <span className={`text-xs px-2 py-1 rounded ${stockBg(p.stock)} ${stockColor(p.stock)}`}>
                      库存 {p.stock}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === 'inventory' && (
          <motion.div key="inventory" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: '配件总数', value: totalParts, icon: Package, color: 'text-cyber-400' },
                { label: '库存总值', value: `¥${totalValue.toLocaleString()}`, icon: Box, color: 'text-cyber-400' },
                { label: '低库存预警', value: lowStock, icon: AlertTriangle, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="glass-card p-4 cyber-border">
                  <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                  <p className="text-xs text-navy-200/60">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color} mt-1`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyber-400/10">
                    {['配件名称', '分类', '价格', '库存', '状态', 'QR码'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-navy-200/60 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockParts.map(p => (
                    <tr key={p.id} className="border-b border-cyber-400/5 hover:bg-cyber-400/5 transition-colors">
                      <td className="px-4 py-3 text-navy-50">{p.name}</td>
                      <td className="px-4 py-3"><span className="tag-cyber">{categoryMap[p.category]}</span></td>
                      <td className="px-4 py-3 text-cyber-400">¥{p.price}</td>
                      <td className="px-4 py-3"><span className={`${stockColor(p.stock)}`}>{p.stock}</span></td>
                      <td className="px-4 py-3">
                        {p.verified
                          ? <span className="text-cyber-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />已认证</span>
                          : <span className="text-navy-200/40 text-xs">待认证</span>}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <span className="text-navy-200/40 text-xs font-mono">{p.qrCode}</span>
                        <button className="btn-secondary text-xs py-1 px-3">入库</button>
                        <button className="btn-secondary text-xs py-1 px-3">出库</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === 'trace' && (
          <motion.div key="trace" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="glass-card p-5 cyber-border mb-5">
              <h3 className="text-sm font-medium text-navy-100 mb-5">溯源链路</h3>
              <div className="flex items-center justify-between">
                {traceNodes.map((n, i) => (
                  <div key={n.label} className="flex items-center">
                    <div className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl border transition-colors ${
                      n.status === 'active' ? 'border-cyber-400/40 bg-cyber-400/10' :
                      n.status === 'done' ? 'border-cyber-400/15 bg-navy-700/40' :
                      'border-navy-200/10 bg-navy-700/20 opacity-50'}`}>
                      <n.icon className={`w-5 h-5 ${n.status === 'active' ? 'text-cyber-400' : n.status === 'done' ? 'text-cyber-400/60' : 'text-navy-200/30'}`} />
                      <span className={`text-xs ${n.status === 'active' ? 'text-cyber-400' : 'text-navy-200/50'}`}>{n.label}</span>
                    </div>
                    {i < traceNodes.length - 1 && <ArrowRight className="w-4 h-4 text-cyber-400/20 mx-1 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 mb-5">
              <h3 className="text-sm font-medium text-navy-100 mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyber-400" />QR码查询
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {mockParts.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-navy-700/40 border border-cyber-400/10">
                    <QrCode className="w-8 h-8 text-cyber-400/40" />
                    <div>
                      <p className="text-xs text-navy-50">{p.name}</p>
                      <p className="text-xs text-navy-200/40 font-mono">{p.qrCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-navy-100 mb-3">最近溯源记录</h3>
              <div className="space-y-3">
                {traceRecords.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-navy-700/30 border border-cyber-400/5">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${r.action === '入库' ? 'bg-cyber-400' : r.action === '出库' ? 'bg-warm-500' : 'bg-blue-400'}`} />
                      <div>
                        <p className="text-sm text-navy-50">{r.part}</p>
                        <p className="text-xs text-navy-200/40">{r.action}</p>
                      </div>
                    </div>
                    <span className="text-xs text-navy-200/30">{r.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
