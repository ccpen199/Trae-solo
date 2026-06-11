import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, ScanLine, FileText, MapPin, User, Clock,
  CheckCircle, XCircle, ChevronRight, Target, Map, Award,
  TrendingUp, BadgeCheck, AlertCircle, QrCode, Wrench, ShieldCheck
} from 'lucide-react'
import { mockWorkOrders, mockParts, mockDispatchMatches } from '@/mocks/data'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = [
  { key: 'dispatch', label: '智能派单', icon: ClipboardList },
  { key: 'scan', label: '配件扫码', icon: ScanLine },
  { key: 'orders', label: '电子工单', icon: FileText },
]

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: '待处理', cls: 'tag-warm' },
  in_progress: { label: '进行中', cls: 'tag-cyber' },
  signed: { label: '已完成', cls: 'bg-cyber-400/20 text-cyber-400 text-xs px-2 py-0.5 rounded-full' },
}

const creditLevelMap: Record<number, string> = { 92: 'S', 90: 'A', 88: 'A', 86: 'B' }

function DispatchTab() {
  const navigate = useNavigate()
  const pendingOrders = mockWorkOrders.filter(o => o.status === 'pending')
  const dispatchList = useMemo(() => pendingOrders.slice(0, 4).map((order, idx) => ({
    order, match: mockDispatchMatches[idx % mockDispatchMatches.length],
  })).sort((a, b) => b.match.totalScore - a.match.totalScore), [pendingOrders])

  return (
    <div className="flex flex-col gap-5">
      <div className="glass-card cyber-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warm-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-warm-500" />
          </div>
          <div>
            <p className="text-sm text-navy-300">今日待接单</p>
            <p className="text-xl font-bold text-navy-50">{pendingOrders.length} 单</p>
          </div>
        </div>
        <span className="bg-warm-500/20 text-warm-500 text-xs px-3 py-1 rounded-full font-semibold">待处理</span>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-navy-100 font-semibold flex items-center gap-2">
          <Award className="w-4 h-4 text-cyber-400" />智能推荐
        </h3>
        {dispatchList.map(({ order, match }, idx) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.01, x: 4 }}
            className="glass-card glass-card-hover cyber-border p-4 flex flex-col gap-3 cursor-pointer"
            onClick={() => navigate(`/engineer/order/${order.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-navy-300 font-mono">{order.orderId}</span>
                  <span className="tag-cyber text-[10px]">{order.categoryLabel}</span>
                </div>
                <p className="text-sm text-navy-50 font-medium">{order.faultDescription}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold gradient-text-cyber">{match.totalScore}</span>
                  <span className="text-xs text-cyber-400">分</span>
                </div>
                <div className="w-20 h-1.5 bg-navy-600 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${match.totalScore}%` }}
                    transition={{ delay: idx * 0.1 + 0.3, duration: 0.6 }}
                    className="h-full bg-gradient-to-r from-cyber-400 to-cyber-300 rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-navy-300">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.customerName}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.customerAddress}</span>
              <span className="flex items-center gap-1 text-cyber-400"><Map className="w-3 h-3" />{match.distanceKm}km</span>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-navy-600/50 text-navy-200">位置匹配 <span className="text-cyber-400">{match.distanceScore}分</span></span>
              <span className="px-2 py-0.5 rounded bg-navy-600/50 text-navy-200">技能匹配 <span className="text-cyber-400">{match.skillScore}分</span></span>
              <span className="px-2 py-0.5 rounded bg-navy-600/50 text-navy-200">履约率 <span className="text-cyber-400">{match.performanceScore}分</span></span>
              <span className="px-2 py-0.5 rounded bg-navy-600/50 text-navy-200 flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-warm-400" />信用等级 <span className="text-warm-400">{creditLevelMap[match.creditScore] || 'B'}</span>
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button className="btn-primary text-sm py-2 flex-1 flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" />立即接单</button>
              <button className="btn-secondary text-sm py-2 flex-1">稍后处理</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PartsScanTab() {
  const [scanned, setScanned] = useState(false)
  const part = mockParts[0]
  const verifyInfo = [
    ['配件名称', part.name], ['批次号', part.qrCode],
    ['供应商', '格力原厂配件'], ['入库日期', '2026-06-01'],
    ['质检员', '质检员张工'], ['检验时间', '2026-06-02 10:30'],
    ['单价', `¥${part.price}`, 'text-cyber-400 font-semibold'],
    ['库存', `${part.stock} 件`],
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-60 h-60 border-2 border-dashed border-cyber-400/40 rounded-xl flex items-center justify-center overflow-hidden">
          <div className="absolute inset-x-6 top-0 h-0.5 bg-gradient-to-b from-cyber-400/80 to-transparent animate-scan-line" />
          <div className="flex flex-col items-center gap-2">
            <QrCode className="w-14 h-14 text-cyber-400/30" />
            <p className="text-xs text-navy-300">将二维码放入框内</p>
          </div>
        </div>
        <button onClick={() => setScanned(true)} className="btn-primary flex items-center gap-2"><ScanLine className="w-4 h-4" />扫码验真</button>
      </div>

      <AnimatePresence>
        {scanned && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="glass-card cyber-border p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyber-400/20 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-cyber-400" /></div>
                <div>
                  <p className="text-sm font-semibold text-cyber-400">验真通过</p>
                  <p className="text-xs text-navy-300">配件来源可追溯</p>
                </div>
              </div>
              <QrCode className="w-10 h-10 text-navy-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-navy-600/50">
              {verifyInfo.map(([label, value, cls = 'text-navy-100'], i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <span className="text-navy-400">{label}</span>
                  <span className={cls as string}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h3 className="text-navy-100 font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyber-400" />近期扫码配件</h3>
        <div className="flex flex-col gap-2">
          {mockParts.slice(0, 5).map(p => (
            <motion.div key={p.id} whileHover={{ x: 4 }} className="glass-card glass-card-hover cyber-border p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-navy-600/50 flex items-center justify-center"><QrCode className="w-5 h-5 text-navy-300" /></div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-navy-50 font-medium text-sm truncate">{p.name}</span>
                  <span className="tag-cyber text-[10px] shrink-0">{p.category}</span>
                </div>
                <span className="text-xs text-navy-400 font-mono">{p.qrCode}</span>
              </div>
              {p.verified ? (
                <div className="flex items-center gap-1 text-cyber-400"><CheckCircle className="w-4 h-4" /><span className="text-xs">已验真</span></div>
              ) : (
                <div className="flex items-center gap-1 text-warm-500"><XCircle className="w-4 h-4" /><span className="text-xs">待验真</span></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WorkOrdersTab() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(mockWorkOrders[0]?.id || null)
  const filters = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'in_progress', label: '进行中' },
    { key: 'signed', label: '已完成' },
  ]
  const filtered = filter === 'all'
    ? mockWorkOrders.slice(0, 5)
    : mockWorkOrders.filter(o => o.status === filter).slice(0, 5)

  const stepChecklist = (order: typeof mockWorkOrders[number]) => {
    const stepStatus = (idx: number) => {
      if (order.status === 'pending') return idx <= 1 ? 'done' : idx === 2 ? 'doing' : 'pending'
      if (order.status === 'in_progress') return idx <= 3 ? 'done' : idx === 4 ? 'doing' : 'pending'
      if (order.status === 'completed') return idx <= 5 ? 'done' : idx === 6 ? 'doing' : 'pending'
      if (order.status === 'cost_confirmed' || order.status === 'signed') return idx <= 6 ? 'done' : idx === 7 ? 'doing' : 'pending'
      if (order.status === 'archived') return 'done'
      return 'pending'
    }
    return [
      { label: '接单', icon: ClipboardList, idx: 0 },
      { label: '上门', icon: MapPin, idx: 1 },
      { label: '检测', icon: AlertCircle, idx: 2 },
      { label: '维修', icon: Wrench, idx: 3 },
      { label: '照片', icon: FileText, idx: 4 },
      { label: '费用', icon: BadgeCheck, idx: 5 },
      { label: '签字', icon: TrendingUp, idx: 6 },
      { label: '存证', icon: ShieldCheck, idx: 7 },
    ].map(s => ({ ...s, status: stepStatus(s.idx) }))
  }

  useEffect(() => {
    if (filtered.length > 0 && !expandedId) {
      setExpandedId(filtered[0].id)
    }
  }, [filter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={filter === f.key ? 'btn-primary text-xs py-1.5 px-4' : 'btn-secondary text-xs py-1.5 px-4'}>
            {f.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          {filtered.map((order, orderIdx) => {
            const st = statusMap[order.status]
            const isExpanded = expandedId === order.id
            const steps = stepChecklist(order)
            const doneCount = steps.filter(s => s.status === 'done').length

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: orderIdx * 0.06 }}
                className="glass-card glass-card-hover cyber-border overflow-hidden"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="p-4 flex items-center gap-4 cursor-pointer"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-navy-50 font-medium text-sm font-mono">{order.orderId}</span>
                      <span className={st.cls}>{st.label}</span>
                      <span className="tag-cyber text-[10px]">{order.categoryLabel}</span>
                      <span className="text-[10px] text-cyber-400/70 flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" />
                        闭环进度 {doneCount}/8
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-navy-300 flex-wrap">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.customerName}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.customerAddress}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {steps.slice(0, 4).map(s => {
                        const Icon = s.icon
                        return (
                          <div key={s.label} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                            s.status === 'done' ? 'bg-cyber-400/15 text-cyber-400' :
                            s.status === 'doing' ? 'bg-warm-500/15 text-warm-500' :
                            'bg-navy-600/30 text-navy-400'
                          }`}>
                            <Icon className="w-3 h-3" />
                            {s.label}
                            {s.status === 'done' && <CheckCircle className="w-2.5 h-2.5" />}
                          </div>
                        )
                      })}
                      <span className="text-navy-500 text-xs">...</span>
                      {steps.slice(4).map(s => {
                        const Icon = s.icon
                        return (
                          <div key={s.label} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                            s.status === 'done' ? 'bg-cyber-400/15 text-cyber-400' :
                            s.status === 'doing' ? 'bg-warm-500/15 text-warm-500' :
                            'bg-navy-600/30 text-navy-400'
                          }`}>
                            <Icon className="w-3 h-3" />
                            {s.label}
                            {s.status === 'done' && <CheckCircle className="w-2.5 h-2.5" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="w-20 h-1.5 bg-navy-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyber-400 to-cyber-300 rounded-full transition-all"
                          style={{ width: `${(doneCount / 8) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-navy-400 mt-1">{Math.round((doneCount / 8) * 100)}%</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-navy-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-cyber-400/10 space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { label: '维修前照片', status: order.beforePhotos.length > 0, count: order.beforePhotos.length, unit: '张', icon: FileText },
                            { label: '维修后照片', status: order.afterPhotos.length > 0, count: order.afterPhotos.length, unit: '张', icon: FileText },
                            { label: '费用确认', status: doneCount >= 6, count: doneCount >= 6 ? '¥520' : '待确认', unit: '', icon: BadgeCheck },
                            { label: '合同存证', status: doneCount >= 8, count: doneCount >= 8 ? '已上链' : '待完成', unit: '', icon: ShieldCheck },
                          ].map((info, i) => {
                            const Icon = info.icon
                            return (
                              <div key={i} className={`rounded-xl p-3 border ${
                                info.status
                                  ? 'bg-cyber-400/5 border-cyber-400/20'
                                  : 'bg-navy-600/20 border-navy-500/20'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon className={`w-3.5 h-3.5 ${info.status ? 'text-cyber-400' : 'text-navy-400'}`} />
                                  <span className={`text-xs font-medium ${info.status ? 'text-cyber-400' : 'text-navy-400'}`}>{info.label}</span>
                                </div>
                                <p className={`text-lg font-bold ${info.status ? 'text-navy-50' : 'text-navy-500'}`}>
                                  {info.count}{info.unit}
                                </p>
                              </div>
                            )
                          })}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/engineer/order/${order.id}`)
                            }}
                            className="btn-primary text-sm py-2 flex-1 flex items-center justify-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            查看完整工单
                          </button>
                          {doneCount < 8 && (
                            <button className="btn-secondary text-sm py-2 px-4 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              继续推进
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
          {filtered.length === 0 && (
            <div className="glass-card cyber-border p-8 flex flex-col items-center gap-2">
              <AlertCircle className="w-10 h-10 text-navy-500" /><p className="text-sm text-navy-400">暂无工单</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function Engineer() {
  const [activeTab, setActiveTab] = useState('dispatch')
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold gradient-text-cyber mb-5">工程师工作台</h1>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={activeTab === tab.key ? 'btn-primary flex items-center gap-2 whitespace-nowrap text-sm' : 'btn-secondary flex items-center gap-2 whitespace-nowrap text-sm'}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          )
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
          {activeTab === 'dispatch' && <DispatchTab />}
          {activeTab === 'scan' && <PartsScanTab />}
          {activeTab === 'orders' && <WorkOrdersTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
