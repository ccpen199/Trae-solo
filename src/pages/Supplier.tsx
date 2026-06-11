import { useState, useMemo } from 'react'
import { Package, Plus, Search, QrCode, ArrowRight, AlertTriangle, CheckCircle, Box, Truck, Wrench, Factory, Filter, Download, Clock, User, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { mockParts, mockInventoryBatches, mockStockFlows } from '@/mocks/data'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'parts' | 'batches' | 'flows'
type FlowFilter = 'all' | 'inbound' | 'outbound' | 'adjust'

const categoryMap: Record<string, string> = {
  air_conditioner: '空调', water_heater: '热水器',
  washing_machine: '洗衣机', refrigerator: '冰箱', tv: '电视', other: '其他',
}

const stockColor = (s: number) => s > 20 ? 'text-cyber-400' : s >= 10 ? 'text-warm-500' : 'text-red-400'
const stockBg = (s: number) => s > 20 ? 'bg-cyber-400/20' : s >= 10 ? 'bg-warm-500/20' : 'bg-red-400/20'

const flowTypeMap: Record<string, { label: string; color: string; bg: string; icon: typeof TrendingUp }> = {
  inbound: { label: '入库', color: 'text-cyber-400', bg: 'bg-cyber-400', icon: TrendingUp },
  outbound: { label: '出库', color: 'text-warm-500', bg: 'bg-warm-500', icon: TrendingDown },
  adjust: { label: '调整', color: 'text-blue-400', bg: 'bg-blue-400', icon: Wrench },
}

export default function Supplier() {
  const [tab, setTab] = useState<Tab>('parts')
  const [search, setSearch] = useState('')
  const [flowFilter, setFlowFilter] = useState<FlowFilter>('all')

  const filteredParts = useMemo(() =>
    mockParts.filter(p => p.name.includes(search) || p.qrCode.includes(search)),
    [search]
  )

  const pendingBatches = mockInventoryBatches.filter(b => !b.verified).length
  const totalInboundQty = mockInventoryBatches.reduce((s, b) => s + b.quantity, 0)
  const monthlyTotal = mockInventoryBatches.reduce((s, b) => {
    const part = mockParts.find(p => p.id === b.partId)
    return s + (part ? part.price * b.quantity : 0)
  }, 0)

  const filteredFlows = useMemo(() => {
    const flows = [...mockStockFlows].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    if (flowFilter === 'all') return flows
    return flows.filter(f => f.type === flowFilter)
  }, [flowFilter])

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: 'parts', label: '配件管理', icon: Package },
    { key: 'batches', label: '入库批次', icon: Box },
    { key: 'flows', label: '库存流转', icon: TrendingUp },
  ]

  const flowFilters: { key: FlowFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'inbound', label: '入库' },
    { key: 'outbound', label: '出库' },
    { key: 'adjust', label: '调整' },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen p-4 pb-8">
      <div className="flex items-center gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t.key ? 'btn-primary' : 'text-navy-200/60 hover:text-cyber-400 hover:bg-cyber-400/5'}`}>
            <t.icon className="w-4 h-4" />
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
                  placeholder="搜索配件名称或QR码..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-700/60 border border-cyber-400/15
                    text-sm text-navy-50 placeholder:text-navy-200/30 focus:outline-none focus:border-cyber-400/40" />
              </div>
              <button className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
                <Plus className="w-4 h-4" />新增配件
              </button>
            </div>

            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredParts.map(p => (
                <motion.div key={p.id} variants={item} whileHover={{ y: -4 }}
                  className="glass-card glass-card-hover p-4 group relative overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-navy-50 text-sm leading-tight">{p.name}</h3>
                    {p.verified && <CheckCircle className="w-4 h-4 text-cyber-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="tag-cyber">{categoryMap[p.category] || p.category}</span>
                    <span className="text-xs text-navy-200/40 font-mono flex items-center gap-1">
                      <QrCode className="w-3 h-3" />{p.qrCode}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-bold text-cyber-400">¥{p.price}</span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${stockBg(p.stock)} ${stockColor(p.stock)}`}>
                      库存 {p.stock}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="btn-secondary text-xs py-1.5 px-4">查看详情</button>
                    <button className="btn-primary text-xs py-1.5 px-4">入库</button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {tab === 'batches' && (
          <motion.div key="batches" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: '待质检批次', value: pendingBatches, icon: AlertTriangle, color: 'text-warm-500', bg: 'bg-warm-500/10' },
                { label: '已入库数量', value: totalInboundQty, icon: Box, color: 'text-cyber-400', bg: 'bg-cyber-400/10' },
                { label: '本月入库总额', value: `¥${monthlyTotal.toLocaleString()}`, icon: Factory, color: 'text-cyber-400', bg: 'bg-cyber-400/10' },
              ].map(s => (
                <div key={s.label} className="glass-card p-4 cyber-border">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-xs text-navy-200/60 mb-1">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-cyber-400/10 flex items-center justify-between">
                <h3 className="text-sm font-medium text-navy-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyber-400" />批次列表
                </h3>
                <button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />导出
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyber-400/10 bg-navy-800/30">
                      {['批次号', '配件名称', '数量', '供应商', '入库日期', '到期日期', '状态', '操作'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-navy-200/60 font-medium text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockInventoryBatches.map(b => (
                      <tr key={b.id} className="border-b border-cyber-400/5 hover:bg-cyber-400/5 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-cyber-400">{b.batchNo}</span>
                        </td>
                        <td className="px-4 py-3 text-navy-50">{b.partName}</td>
                        <td className="px-4 py-3 text-navy-50 font-medium">{b.quantity}</td>
                        <td className="px-4 py-3 text-navy-200/70 text-xs">{b.supplierName}</td>
                        <td className="px-4 py-3 text-navy-200/60 text-xs">{b.inboundDate}</td>
                        <td className="px-4 py-3 text-navy-200/60 text-xs">{b.expireDate}</td>
                        <td className="px-4 py-3">
                          {b.verified ? (
                            <div>
                              <span className="text-cyber-400 text-xs flex items-center gap-1 font-medium">
                                <CheckCircle className="w-3 h-3" />已验真
                              </span>
                              <p className="text-xs text-navy-200/40 mt-0.5">{b.verifiedBy} · {b.verifiedAt}</p>
                            </div>
                          ) : (
                            <span className="text-warm-500 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />待验真
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {!b.verified && (
                              <button className="btn-primary text-xs py-1 px-3">验真</button>
                            )}
                            <button className="btn-secondary text-xs py-1 px-3">查看详情</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'flows' && (
          <motion.div key="flows" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-navy-200/50" />
                {flowFilters.map(f => (
                  <button key={f.key} onClick={() => setFlowFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      flowFilter === f.key
                        ? 'bg-cyber-400/20 text-cyber-400 border border-cyber-400/30'
                        : 'text-navy-200/60 hover:text-cyber-400 border border-transparent'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />导出记录
              </button>
            </div>

            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              {filteredFlows.map((f, i) => {
                const typeInfo = flowTypeMap[f.type]
                const TypeIcon = typeInfo.icon
                const qtyPrefix = f.type === 'outbound' ? '-' : f.type === 'inbound' ? '+' : f.quantity > 0 ? '+' : ''
                return (
                  <motion.div key={f.id} variants={item}
                    className="glass-card p-4 flex items-center gap-4 hover:border-cyber-400/30 transition-colors">
                    <div className={`w-10 h-10 rounded-lg ${typeInfo.bg}/10 flex items-center justify-center shrink-0`}>
                      <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-navy-50 text-sm">{f.partName}</span>
                        <span className={`tag-${f.type === 'adjust' ? 'warm' : 'cyber'} text-xs`}>{typeInfo.label}</span>
                      </div>
                      <p className="text-xs text-navy-200/50">{f.reason}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-navy-200/40 flex items-center gap-1">
                          <User className="w-3 h-3" />{f.operator}
                        </span>
                        <span className="text-navy-200/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{f.timestamp}
                        </span>
                        {f.orderId && (
                          <span className="text-cyber-400/60 font-mono text-xs">{f.orderId}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-bold ${typeInfo.color}`}>
                        {qtyPrefix}{f.quantity}
                      </p>
                      <p className="text-xs text-navy-200/40 flex items-center gap-1 justify-end">
                        {f.beforeStock} <ArrowRight className="w-3 h-3" /> {f.afterStock}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
