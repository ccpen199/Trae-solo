import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, ScanLine, FileText, MapPin, User, Phone, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { mockWorkOrders, mockParts } from '@/mocks/data'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = [
  { key: 'kanban', label: 'Dispatch Kanban', icon: ClipboardList },
  { key: 'scan', label: 'Parts Scan', icon: ScanLine },
  { key: 'orders', label: 'Work Orders', icon: FileText },
]

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: '待接单', cls: 'tag-warm' },
  in_progress: { label: '进行中', cls: 'tag-cyber' },
  signed: { label: '已完成', cls: 'bg-cyber-400/20 text-cyber-400 text-xs px-2 py-0.5 rounded-full' },
}

const columns: { key: string; label: string; status: string }[] = [
  { key: 'pending', label: '待接单', status: 'pending' },
  { key: 'progress', label: '进行中', status: 'in_progress' },
  { key: 'done', label: '已完成', status: 'signed' },
]

function OrderCard({ order, onClick }: { order: typeof mockWorkOrders[0]; onClick: () => void }) {
  const st = statusMap[order.status]
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className="glass-card glass-card-hover cyber-border p-4 cursor-pointer flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-navy-300 font-mono">{order.orderId}</span>
        <span className={st.cls}>{st.label}</span>
      </div>
      <span className="tag-cyber text-[10px] self-start">{order.categoryLabel}</span>
      <p className="text-sm text-navy-100 leading-snug">{order.faultDescription}</p>
      <div className="flex items-center gap-1 text-xs text-navy-300">
        <User className="w-3 h-3" />{order.customerName}
      </div>
      <div className="flex items-center gap-1 text-xs text-navy-300">
        <MapPin className="w-3 h-3" />{order.customerAddress}
      </div>
      <div className="flex items-center gap-1 text-xs text-navy-400">
        <Clock className="w-3 h-3" />{order.createdAt}
      </div>
    </motion.div>
  )
}

function DispatchKanban() {
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map(col => {
        const orders = mockWorkOrders.filter(o => o.status === col.status)
        return (
          <div key={col.key} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-navy-100 font-semibold">{col.label}</h3>
              <span className="bg-cyber-400/20 text-cyber-400 text-xs px-2 py-0.5 rounded-full font-bold">{orders.length}</span>
            </div>
            <div className="flex flex-col gap-3 min-h-[120px]">
              {orders.map(o => (
                <OrderCard key={o.id} order={o} onClick={() => navigate(`/engineer/order/${o.id}`)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PartsScan() {
  const [scanned, setScanned] = useState(false)
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-56 h-56 border-2 border-dashed border-cyber-400/50 rounded-lg flex items-center justify-center">
          <div className="absolute inset-x-4 h-0.5 bg-cyber-400/70 animate-scan-line" />
          <ScanLine className="w-10 h-10 text-cyber-400/40" />
        </div>
        <button onClick={() => setScanned(true)} className="btn-primary flex items-center gap-2">
          <ScanLine className="w-4 h-4" />扫码验真
        </button>
      </div>
      <AnimatePresence>
        {scanned && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card cyber-border p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-cyber-400 font-semibold">
              <CheckCircle className="w-5 h-5" />验真结果
            </div>
            <p className="text-sm text-navy-200">配件来源可追溯，QR编码匹配成功</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div>
        <h3 className="text-navy-100 font-semibold mb-3">近期扫码配件</h3>
        <div className="flex flex-col gap-3">
          {mockParts.map(part => (
            <motion.div
              key={part.id}
              whileHover={{ scale: 1.01 }}
              className="glass-card glass-card-hover cyber-border p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-navy-50 font-medium text-sm">{part.name}</span>
                  <span className="tag-cyber text-[10px]">{part.category}</span>
                </div>
                <span className="text-xs text-navy-400 font-mono">{part.qrCode}</span>
                <div className="flex items-center gap-3 text-xs text-navy-300">
                  <span>¥{part.price}</span>
                  <span>库存 {part.stock}</span>
                </div>
              </div>
              {part.verified ? (
                <div className="flex items-center gap-1 text-cyber-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">已验真</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-warm-400">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">待验真</span>
                </div>
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
  const filters = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'in_progress', label: '进行中' },
    { key: 'signed', label: '已完成' },
  ]
  const filtered = filter === 'all' ? mockWorkOrders : mockWorkOrders.filter(o => o.status === filter)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'btn-primary text-xs py-1 px-3' : 'btn-secondary text-xs py-1 px-3'}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {filtered.map(o => {
          const st = statusMap[o.status]
          return (
            <motion.div
              key={o.id}
              whileHover={{ x: 4 }}
              onClick={() => navigate(`/engineer/order/${o.id}`)}
              className="glass-card glass-card-hover cyber-border p-4 flex items-center gap-4 cursor-pointer"
            >
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-navy-50 font-medium text-sm font-mono">{o.orderId}</span>
                  <span className={st.cls}>{st.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-navy-300">
                  <span className="tag-cyber text-[10px]">{o.categoryLabel}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{o.customerName}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{o.customerPhone}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-navy-400 flex items-center gap-1"><Clock className="w-3 h-3" />{o.createdAt}</span>
                <ChevronRight className="w-4 h-4 text-navy-400" />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default function Engineer() {
  const [activeTab, setActiveTab] = useState('kanban')
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold gradient-text-cyber mb-6">工程师工作台</h1>
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? 'btn-primary flex items-center gap-2' : 'btn-secondary flex items-center gap-2'}
            >
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          )
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'kanban' && <DispatchKanban />}
          {activeTab === 'scan' && <PartsScan />}
          {activeTab === 'orders' && <WorkOrdersTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
