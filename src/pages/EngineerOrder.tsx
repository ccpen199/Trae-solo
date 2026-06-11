import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, CheckCircle, Circle, Loader, Upload, Pen, ArrowLeft } from 'lucide-react'
import { mockWorkOrders } from '@/mocks/data'
import { motion } from 'framer-motion'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-orange-500/20 text-orange-400 border-orange-400/30' },
  in_progress: { label: '进行中', color: 'bg-cyber-400/20 text-cyber-400 border-cyber-400/30' },
  completed: { label: '已完成', color: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
  signed: { label: '已签字', color: 'bg-green-500/20 text-green-400 border-green-400/30' },
}

export default function EngineerOrder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState(() => mockWorkOrders.find(o => o.id === id))
  const [signed, setSigned] = useState(false)

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <div className="text-center">
          <p className="text-navy-200 text-lg mb-4">工单不存在</p>
          <button onClick={() => navigate('/engineer')} className="btn-secondary">
            <ArrowLeft size={16} className="inline mr-1" />返回
          </button>
        </div>
      </div>
    )
  }

  const status = statusConfig[order.status]

  const handleSign = () => {
    setSigned(true)
    setOrder(prev => prev ? { ...prev, status: 'signed' as const } : prev)
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 grid-bg">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/engineer')} className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5">
            <ArrowLeft size={16} />返回
          </button>
          <span className="text-navy-300 text-sm">{order.orderId}</span>
        </div>

        <div className="glass-card cyber-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-navy-50">工单详情</h1>
            <span className={`px-3 py-1 text-xs rounded-full border ${status.color}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="tag-cyber">{order.categoryLabel}</span>
            <span className="text-navy-300">创建时间: {order.createdAt}</span>
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-3">客户信息</h2>
          <div className="space-y-2 text-sm">
            <p className="text-navy-50">{order.customerName}</p>
            <p className="flex items-center gap-2 text-navy-200">
              <MapPin size={14} className="text-cyber-400" />{order.customerAddress}
            </p>
            <p className="flex items-center gap-2 text-navy-200">
              <Phone size={14} className="text-cyber-400" />{order.customerPhone}
            </p>
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-3">故障描述</h2>
          <p className="text-sm text-navy-100">{order.faultDescription}</p>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4 flex items-center gap-2">
            <Loader size={16} /> 工作步骤
          </h2>
          <div className="space-y-0">
            {order.steps.map((step, i) => (
              <motion.div
                key={step.index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  {step.status === 'done' ? (
                    <CheckCircle size={22} className="text-cyber-400 shrink-0" />
                  ) : step.status === 'doing' ? (
                    <div className="relative shrink-0">
                      <Circle size={22} className="text-cyber-400 animate-pulse" />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-cyber-400 animate-ping" />
                      </span>
                    </div>
                  ) : (
                    <Circle size={22} className="text-navy-300 shrink-0" />
                  )}
                  {i < order.steps.length - 1 && (
                    <div className={`w-px h-8 mt-1 ${step.status === 'done' ? 'bg-cyber-400/60' : 'bg-navy-300/30'}`} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-medium ${step.status === 'pending' ? 'text-navy-300' : 'text-navy-50'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-navy-200 mt-0.5">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4">照片对比</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-navy-300/30 rounded-lg p-6 flex flex-col items-center justify-center gap-2 min-h-[140px] hover:border-cyber-400/40 transition-colors cursor-pointer">
              <Upload size={28} className="text-navy-300" />
              <span className="text-sm text-navy-300">维修前</span>
            </div>
            <div className="border-2 border-dashed border-navy-300/30 rounded-lg p-6 flex flex-col items-center justify-center gap-2 min-h-[140px] hover:border-cyber-400/40 transition-colors cursor-pointer">
              <Upload size={28} className="text-navy-300" />
              <span className="text-sm text-navy-300">维修后</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4 flex items-center gap-2">
            <Pen size={16} /> 签字确认
          </h2>
          <div className="bg-white rounded-lg min-h-[120px] flex items-center justify-center mb-4">
            <span className="text-gray-400 text-sm">
              {signed ? '✓ 已签字确认' : '用户签字确认'}
            </span>
          </div>
          <button
            onClick={handleSign}
            disabled={signed}
            className={`btn-primary w-full ${signed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {signed ? '已确认' : '确认签字'}
          </button>
        </div>

        <div className="flex gap-3 pb-6">
          <button onClick={() => navigate('/engineer')} className="btn-secondary flex-1">返回</button>
          <button className="btn-primary flex-1">提交工单</button>
        </div>
      </div>
    </div>
  )
}
