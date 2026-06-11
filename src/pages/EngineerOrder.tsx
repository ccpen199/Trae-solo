import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, CheckCircle, Circle, Upload, PenTool, ArrowLeft, Clock, Package } from 'lucide-react'
import { motion } from 'framer-motion'
import { mockWorkOrders, mockParts } from '@/mocks/data'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-orange-500/20 text-orange-400 border-orange-400/30' },
  in_progress: { label: '进行中', color: 'bg-cyber-400/20 text-cyber-400 border-cyber-400/30' },
  completed: { label: '已完成', color: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
  signed: { label: '已签字', color: 'bg-green-500/20 text-green-400 border-green-400/30' },
}

const actionBtnText: Record<string, string> = {
  pending: '开始维修', in_progress: '完成维修', completed: '等待签字', signed: '已完成',
}

export default function EngineerOrder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState(() => mockWorkOrders.find(o => o.id === id))
  const [signed, setSigned] = useState(false)
  const [signTime, setSignTime] = useState('')

  const usedParts = useMemo(() => {
    if (!order) return []
    return mockParts.filter(p => p.category === order.category).slice(0, 3).map((p, i) => ({
      ...p, quantity: i + 1, subtotal: p.price * (i + 1),
    }))
  }, [order])

  const totalPartsCost = usedParts.reduce((sum, p) => sum + p.subtotal, 0)

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center grid-bg">
      <div className="text-center">
        <p className="text-navy-200 text-lg mb-4">工单不存在</p>
        <button onClick={() => navigate('/engineer')} className="btn-secondary">
          <ArrowLeft size={16} className="inline mr-1" />返回
        </button>
      </div>
    </div>
  )

  const status = statusConfig[order.status]

  const handleSign = () => {
    const now = new Date()
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    setSigned(true)
    setSignTime(timeStr)
    setOrder(prev => prev ? { ...prev, status: 'signed' as const, signedAt: timeStr } : prev)
  }

  const handlePrimaryAction = () => {
    if (order.status === 'pending') setOrder(prev => prev ? { ...prev, status: 'in_progress' as const } : prev)
    else if (order.status === 'in_progress') setOrder(prev => prev ? { ...prev, status: 'completed' as const } : prev)
  }

  const PhotoColumn = ({ label, photos }: { label: string; photos: string[] }) => (
    <div>
      <p className="text-xs text-navy-300 mb-2 font-medium">{label}</p>
      {photos.length > 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg overflow-hidden border border-navy-300/20">
          <img src={photos[0]} alt={label} className="w-full h-32 object-cover" />
        </motion.div>
      ) : (
        <div className="border-2 border-dashed border-navy-300/30 rounded-lg p-6 flex flex-col items-center justify-center gap-2 h-32 hover:border-cyber-400/40 transition-colors cursor-pointer">
          <Upload size={24} className="text-navy-400" />
          <span className="text-xs text-navy-400">点击上传</span>
        </div>
      )}
      <button className="btn-secondary w-full mt-2 py-1.5 text-xs flex items-center justify-center gap-1">
        <Upload size={12} /> 上传照片
      </button>
    </div>
  )

  return (
    <div className="min-h-screen grid-bg pb-28">
      <div className="max-w-3xl mx-auto p-4 lg:p-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <button onClick={() => navigate('/engineer')} className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5">
            <ArrowLeft size={16} />返回
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card cyber-border p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-black text-navy-50 tracking-wide">{order.orderId}</h1>
              <p className="text-navy-300 text-xs mt-1">创建于 {order.createdAt}</p>
            </div>
            <span className={`px-3 py-1.5 text-xs font-medium rounded-full border ${status.color}`}>
              {status.label}
            </span>
          </div>
          <span className="tag-cyber">{order.categoryLabel}</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-3 flex items-center gap-2"><MapPin size={16} /> 客户信息</h2>
          <div className="space-y-2.5">
            <p className="text-navy-50 font-bold text-lg">{order.customerName}</p>
            <p className="flex items-center gap-2 text-navy-200 text-sm">
              <MapPin size={14} className="text-cyber-400 shrink-0" />{order.customerAddress}
            </p>
            <p className="flex items-center gap-2 text-navy-200 text-sm">
              <Phone size={14} className="text-cyber-400 shrink-0" />{order.customerPhone}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-3">故障描述</h2>
          <p className="text-sm text-navy-100 mb-4">{order.faultDescription}</p>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-navy-300"><Clock size={13} className="text-cyber-400" />预计时长: 1-2小时</div>
            <div className="flex items-center gap-1.5 text-navy-300"><Package size={13} className="text-cyber-400" />服务品类: {order.categoryLabel}</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4">工作步骤</h2>
          <div className="space-y-0">
            {order.steps.map((step, i) => (
              <motion.div key={step.index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {step.status === 'done' ? <CheckCircle size={22} className="text-cyber-400 shrink-0" />
                    : step.status === 'doing' ? (
                    <div className="relative shrink-0">
                      <Circle size={22} className="text-cyber-400" />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-cyber-400 animate-ping" />
                      </span>
                    </div>
                  ) : <Circle size={22} className="text-navy-400 shrink-0" />}
                  {i < order.steps.length - 1 && (
                    <div className={`w-px h-8 mt-1 ${step.status === 'done' ? 'bg-cyber-400/60' : 'bg-navy-400/30'}`} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-medium ${step.status === 'pending' ? 'text-navy-400' : 'text-navy-50'}`}>{step.title}</p>
                  <p className="text-xs text-navy-300 mt-0.5">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4">照片对比</h2>
          <div className="grid grid-cols-2 gap-3">
            <PhotoColumn label="维修前" photos={order.beforePhotos} />
            <PhotoColumn label="维修后" photos={order.afterPhotos} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4 flex items-center gap-2"><Package size={16} /> 使用配件</h2>
          <div className="space-y-2">
            {usedParts.map(part => (
              <div key={part.id} className="flex items-center justify-between py-2 border-b border-navy-300/10 last:border-0">
                <div>
                  <p className="text-sm text-navy-100 font-medium">{part.name}</p>
                  <p className="text-xs text-navy-400">¥{part.price.toFixed(2)} × {part.quantity}</p>
                </div>
                <p className="text-sm text-cyber-400 font-medium">¥{part.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-navy-300/20 flex justify-between items-center">
            <span className="text-sm text-navy-200">配件合计</span>
            <span className="text-lg font-bold text-cyber-400">¥{totalPartsCost.toFixed(2)}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4 flex items-center gap-2"><PenTool size={16} /> 签字确认</h2>
          <div className="bg-white rounded-lg min-h-[140px] flex items-center justify-center mb-3 relative overflow-hidden">
            {signed ? (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <p className="text-gray-800 text-2xl" style={{ fontFamily: 'cursive' }}>{order.customerName}</p>
                <p className="text-gray-500 text-xs mt-1">已确认签字</p>
              </motion.div>
            ) : (
              <div className="text-center">
                <PenTool size={28} className="text-gray-300 mx-auto mb-1" />
                <span className="text-gray-400 text-sm">用户签字区域</span>
              </div>
            )}
          </div>
          {signed && signTime && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-navy-400 text-center mb-3">
              签字时间: {signTime}
            </motion.p>
          )}
          <button onClick={handleSign} disabled={signed}
            className={`btn-primary w-full ${signed ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {signed ? '已确认签字' : '确认签字'}
          </button>
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-navy-900/90 backdrop-blur-md border-t border-navy-300/20 p-3 z-50">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button onClick={() => navigate('/engineer')} className="btn-secondary flex-1 py-3">返回</button>
          <button onClick={handlePrimaryAction}
            disabled={order.status === 'signed' || order.status === 'completed'}
            className={`btn-primary flex-1 py-3 ${order.status === 'signed' || order.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {actionBtnText[order.status]}
          </button>
        </div>
      </div>
    </div>
  )
}
