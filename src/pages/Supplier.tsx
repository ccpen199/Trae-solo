import { useState, useMemo } from 'react'
import {
  Package, Plus, Search, QrCode, ArrowRight, AlertTriangle, CheckCircle, Box, Truck, Wrench, Factory,
  Filter, Download, Clock, User, FileText, TrendingUp, TrendingDown, X, ShieldCheck,
  BarChart3, History, BadgeCheck, Minus
} from 'lucide-react'
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
  const [selectedPart, setSelectedPart] = useState<typeof mockParts[number] | null>(null)

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

  const partBatches = useMemo(() =>
    selectedPart ? mockInventoryBatches.filter(b => b.partId === selectedPart.id) : [],
    [selectedPart]
  )
  const partFlows = useMemo(() =>
    selectedPart ? mockStockFlows.filter(f => f.partId === selectedPart.id) : [],
    [selectedPart]
  )

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
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

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
              {filteredParts.map(p => {
                const latestBatchNo = mockInventoryBatches.filter(b => b.partId === p.id).sort((a, b) => new Date(b.inboundDate).getTime() - new Date(a.inboundDate).getTime())[0]?.batchNo || '-'
                const flowCount = mockStockFlows.filter(f => f.partId === p.id).length
                const stockTrend = p.stock > 20 ? { label: '库存充足', color: 'text-cyber-400', bg: 'bg-cyber-400/10', icon: TrendingUp } : p.stock >= 10 ? { label: '正常', color: 'text-warm-500', bg: 'bg-warm-500/10', icon: Minus } : { label: '库存预警', color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertTriangle }
                const TrendIcon = stockTrend.icon
                return (
                  <motion.div key={p.id} variants={item} whileHover={{ y: -4 }} onClick={() => setSelectedPart(p)}
                    className="glass-card glass-card-hover p-4 group relative overflow-hidden cursor-pointer border-2 border-transparent hover:border-cyber-400/40">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-navy-50 text-sm leading-tight pr-2">{p.name}</h3>
                      <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded shrink-0 ${p.verified ? 'bg-cyber-400/10' : 'bg-warm-500/10'}`}>
                        {p.verified ? (<><CheckCircle className="w-3 h-3 text-cyber-400 shrink-0" /><span className="text-[10px] font-medium text-cyber-400">已验真</span></>)
                          : (<><AlertTriangle className="w-3 h-3 text-warm-500 shrink-0" /><span className="text-[10px] font-medium text-warm-500">待验真</span></>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="tag-cyber text-[10px]">{categoryMap[p.category] || p.category}</span>
                      <span className="text-[10px] text-navy-200/40 font-mono flex items-center gap-1"><QrCode className="w-2.5 h-2.5" />{p.qrCode}</span>
                    </div>
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center justify-between text-[10px]"><span className="text-navy-200/50">最近入库批次</span><span className="text-navy-200/70 font-mono">{latestBatchNo}</span></div>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${stockTrend.bg}`}>
                          <TrendIcon className={`w-3 h-3 ${stockTrend.color}`} /><span className={`text-[10px] font-medium ${stockTrend.color}`}>{stockTrend.label}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-navy-200/50"><History className="w-3 h-3" /><span>流转 {flowCount}</span></div>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-bold text-cyber-400">¥{p.price}</span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${stockBg(p.stock)} ${stockColor(p.stock)}`}>库存 {p.stock}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-4 gap-2">
                      <p className="text-xs text-cyber-400 mb-1">点击查看完整详情</p>
                      <div className="flex gap-2"><button className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1"><QrCode className="w-3 h-3" />扫码验真</button></div>
                    </div>
                  </motion.div>
                )
              })}
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
                    {mockInventoryBatches.map(b => {
                      const handleRowClick = () => {
                        const p = mockParts.find(pp => pp.id === b.partId)
                        if (p) setSelectedPart(p)
                      }
                      return (
                        <tr key={b.id} onClick={handleRowClick}
                          className="border-b border-cyber-400/5 hover:bg-cyber-400/5 transition-colors cursor-pointer">
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
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {!b.verified && (
                                <button className="btn-primary text-xs py-1 px-3">验真</button>
                              )}
                              <button
                                onClick={handleRowClick}
                                className="btn-secondary text-xs py-1 px-3"
                              >
                                查看详情
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
                const handleFlowClick = () => {
                  const p = mockParts.find(pp => pp.id === f.partId)
                  if (p) setSelectedPart(p)
                }
                return (
                  <motion.div key={f.id} variants={item} onClick={handleFlowClick}
                    className="glass-card p-4 flex items-center gap-4 hover:border-cyber-400/30 transition-colors cursor-pointer">
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

      <AnimatePresence>
        {selectedPart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm"
            onClick={() => setSelectedPart(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card cyber-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-cyber-400/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyber-400/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-cyber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedPart.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-navy-300">{categoryMap[selectedPart.category]}</span>
                      {selectedPart.verified && (
                        <span className="text-xs text-cyber-400 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" />已验真
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPart(null)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'QR码', value: selectedPart.qrCode, icon: QrCode, color: 'cyber' },
                    { label: '单价', value: `¥${selectedPart.price}`, icon: BarChart3, color: 'cyber' },
                    { label: '库存', value: selectedPart.stock, icon: Box, color: selectedPart.stock > 20 ? 'cyber' : 'warm' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-navy-800/40 rounded-xl p-3 border border-cyber-400/10">
                      <stat.icon className={`w-4 h-4 ${stat.color === 'cyber' ? 'text-cyber-400' : 'text-warm-500'} mb-2`} />
                      <p className="text-lg font-bold text-navy-50">{stat.value}</p>
                      <p className="text-xs text-navy-300">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-cyber-400 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> 验真信息
                  </h4>
                  <div className="bg-navy-800/40 rounded-xl p-4 border border-cyber-400/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedPart.verified ? 'bg-cyber-400/20' : 'bg-warm-500/20'}`}>
                        {selectedPart.verified ? (
                          <CheckCircle className={`w-5 h-5 text-cyber-400`} />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-warm-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${selectedPart.verified ? 'text-cyber-400' : 'text-warm-500'}`}>
                          {selectedPart.verified ? '配件验真通过' : '待验真'}
                        </p>
                        <p className="text-xs text-navy-300">
                          {selectedPart.verified
                            ? '原厂正品，符合质量标准'
                            : '请使用扫码枪或输入QR码进行验真'}
                        </p>
                      </div>
                    </div>
                    {selectedPart.verified && (
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-cyber-400/10">
                        <div>
                          <p className="text-xs text-navy-400 mb-0.5">质检员</p>
                          <p className="text-sm text-navy-100">李质检</p>
                        </div>
                        <div>
                          <p className="text-xs text-navy-400 mb-0.5">检验时间</p>
                          <p className="text-sm text-navy-100">2024-01-15 10:30</p>
                        </div>
                      </div>
                    )}
                    <button className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2">
                      <QrCode className="w-4 h-4" />
                      {selectedPart.verified ? '重新扫码验真' : '扫码验真'}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-cyber-400 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" /> 入库批次 ({partBatches.length}条)
                  </h4>
                  <div className="space-y-2">
                    {partBatches.length > 0 ? partBatches.map(b => (
                      <div key={b.id} className="bg-navy-800/40 rounded-lg p-3 border border-cyber-400/10 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-mono text-cyber-400">{b.batchNo}</p>
                          <p className="text-xs text-navy-300 mt-0.5">{b.supplierName} · 入库 {b.quantity}件</p>
                        </div>
                        <div className="text-right">
                          {b.verified ? (
                            <span className="text-cyber-400 text-xs flex items-center gap-1 justify-end">
                              <CheckCircle className="w-3 h-3" />已验真
                            </span>
                          ) : (
                            <span className="text-warm-500 text-xs">待验真</span>
                          )}
                          <p className="text-xs text-navy-400 mt-0.5">{b.inboundDate}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-navy-400 text-xs py-6">暂无入库批次记录</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-cyber-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> 库存流转记录 ({partFlows.length}条)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {partFlows.length > 0 ? partFlows.map(f => {
                      const typeInfo = flowTypeMap[f.type]
                      const TypeIcon = typeInfo.icon
                      const qtyPrefix = f.type === 'outbound' ? '-' : '+'
                      return (
                        <div key={f.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                          <div className={`w-8 h-8 rounded-lg ${typeInfo.bg}/10 flex items-center justify-center shrink-0`}>
                            <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-navy-100">{typeInfo.label}</p>
                            <p className="text-[10px] text-navy-400 truncate">{f.reason}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${typeInfo.color}`}>{qtyPrefix}{f.quantity}</p>
                            <p className="text-[10px] text-navy-400">{f.timestamp}</p>
                          </div>
                        </div>
                      )
                    }) : (
                      <p className="text-center text-navy-400 text-xs py-6">暂无流转记录</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-cyber-400/10 flex gap-3 shrink-0">
                <button className="btn-secondary flex-1 text-sm py-2">
                  编辑信息
                </button>
                <button className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" />
                  新增入库
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
