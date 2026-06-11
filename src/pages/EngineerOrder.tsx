import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Phone, CheckCircle, Circle, Upload, PenTool, ArrowLeft,
  Clock, Package, Receipt, FileText, ShieldCheck, DollarSign,
  QrCode, BadgeCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import { mockWorkOrders, mockParts } from '@/mocks/data'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-orange-500/20 text-orange-400 border-orange-400/30' },
  in_progress: { label: '进行中', color: 'bg-cyber-400/20 text-cyber-400 border-cyber-400/30' },
  completed: { label: '维修完成', color: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
  cost_confirmed: { label: '费用已确认', color: 'bg-purple-500/20 text-purple-400 border-purple-400/30' },
  signed: { label: '已签字', color: 'bg-green-500/20 text-green-400 border-green-400/30' },
  archived: { label: '已存证', color: 'bg-cyber-400/20 text-cyber-400 border-cyber-400/30' },
}

const actionBtnText: Record<string, string> = {
  pending: '开始维修',
  in_progress: '完成维修',
  completed: '确认费用',
  cost_confirmed: '等待用户签字',
  signed: '生成电子存证',
  archived: '工单已完结',
}

export default function EngineerOrder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState(() => mockWorkOrders.find(o => o.id === id))
  const [signed, setSigned] = useState(false)
  const [signTime, setSignTime] = useState('')
  const [showContract, setShowContract] = useState(false)

  const usedParts = useMemo(() => {
    if (!order) return []
    return mockParts.filter(p => p.category === order.category).slice(0, 3).map((p, i) => ({
      ...p, quantity: i + 1, subtotal: p.price * (i + 1),
    }))
  }, [order])

  const totalPartsCost = usedParts.reduce((sum, p) => sum + p.subtotal, 0)
  const visitFee = 50
  const laborFee = 120
  const totalCost = visitFee + laborFee + totalPartsCost

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

  const status = statusConfig[order.status] || statusConfig.pending

  const handleSign = () => {
    const now = new Date()
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    setSigned(true)
    setSignTime(timeStr)
    setOrder(prev => prev ? { ...prev, status: 'signed' as any, signedAt: timeStr } : prev)
  }

  const handlePrimaryAction = () => {
    if (order.status === 'pending') setOrder(prev => prev ? { ...prev, status: 'in_progress' as any } : prev)
    else if (order.status === 'in_progress') setOrder(prev => prev ? { ...prev, status: 'completed' as any } : prev)
    else if (order.status === 'completed') setOrder(prev => prev ? { ...prev, status: 'cost_confirmed' as any } : prev)
    else if (order.status === 'cost_confirmed') handleSign()
    else if (order.status === 'signed') setOrder(prev => prev ? { ...prev, status: 'archived' as any } : prev)
  }

  const allSteps = [
    { key: 'dispatch', title: '接单派单', desc: '系统智能派单，工程师接单', done: true },
    { key: 'arrive', title: '上门服务', desc: '工程师到达现场，开始检测', done: true },
    { key: 'diagnose', title: '故障检测', desc: '检测故障原因，确认维修方案', done: true },
    { key: 'repair', title: '维修施工', desc: '更换配件，完成维修作业', done: order.status !== 'pending' && order.status !== 'in_progress' },
    { key: 'photo', title: '照片留证', desc: '拍摄维修前后对比照片', done: order.status !== 'pending' && order.status !== 'in_progress' && order.status !== 'completed' },
    { key: 'cost', title: '费用确认', desc: '确认上门费、人工费、配件费', done: order.status === 'cost_confirmed' || order.status === 'signed' || order.status === 'archived' },
    { key: 'sign', title: '用户签字', desc: '用户电子签字确认完工', done: order.status === 'signed' || order.status === 'archived' },
    { key: 'archive', title: '合同存证', desc: '电子合同存证，区块链哈希上链', done: order.status === 'archived' },
  ]

  const currentStepIndex = allSteps.findIndex(s => !s.done)

  const PhotoColumn = ({ label, photos }: { label: string; photos: string[] }) => (
    <div>
      <p className="text-xs text-navy-300 mb-2 font-medium">{label}</p>
      {photos.length > 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg overflow-hidden border-2 border-cyber-400/30 relative group">
          <img src={photos[0]} alt={label} className="w-full h-32 object-cover" />
          <div className="absolute top-2 right-2 bg-cyber-400/80 text-navy-900 text-[10px] px-2 py-0.5 rounded font-bold">
            已上传
          </div>
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
            <ArrowLeft size={16} />返回工单列表
          </button>
          <span className={`px-3 py-1.5 text-xs font-medium rounded-full border ${status.color}`}>
            {status.label}
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card cyber-border p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-black text-navy-50 tracking-wide">{order.orderId}</h1>
              <p className="text-navy-300 text-xs mt-1">创建于 {order.createdAt}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="tag-cyber">{order.categoryLabel}</span>
            <span className="tag-warm flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" />
              第 {currentStepIndex === -1 ? allSteps.length : currentStepIndex} / {allSteps.length} 步
            </span>
          </div>
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
          <h2 className="text-cyber-400 font-semibold mb-4">工单进度</h2>
          <div className="space-y-0">
            {allSteps.map((step, i) => {
              const isCurrent = i === currentStepIndex
              return (
                <motion.div key={step.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.06 }} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {step.done ? (
                      <div className="relative">
                        <CheckCircle size={22} className="text-cyber-400 shrink-0" />
                      </div>
                    ) : isCurrent ? (
                      <div className="relative shrink-0">
                        <Circle size={22} className="text-cyber-400" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyber-400 animate-ping" />
                        </span>
                      </div>
                    ) : (
                      <Circle size={22} className="text-navy-400 shrink-0" />
                    )}
                    {i < allSteps.length - 1 && (
                      <div className={`w-px h-8 mt-1 ${step.done ? 'bg-cyber-400/60' : 'bg-navy-400/30'}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${step.done ? 'text-cyber-400' : isCurrent ? 'text-navy-50' : 'text-navy-400'}`}>
                      {step.title}
                      {isCurrent && <span className="ml-2 text-[10px] bg-cyber-400/20 text-cyber-400 px-1.5 py-0.5 rounded">进行中</span>}
                    </p>
                    <p className="text-xs text-navy-300 mt-0.5">{step.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4 flex items-center gap-2">
            <Package size={16} /> 费用明细
          </h2>
          <div className="space-y-2 bg-navy-800/30 rounded-xl p-4 border border-cyber-400/10">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyber-400/20 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-cyber-400" />
                </div>
                <span className="text-sm text-navy-100">上门费</span>
              </div>
              <span className="text-sm text-white">¥{visitFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyber-400/20 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-cyber-400" />
                </div>
                <span className="text-sm text-navy-100">人工费</span>
              </div>
              <span className="text-sm text-white">¥{laborFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyber-400/20 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-cyber-400" />
                </div>
                <span className="text-sm text-navy-100">配件费</span>
                <span className="text-xs text-navy-400">({usedParts.length}项)</span>
              </div>
              <span className="text-sm text-white">¥{totalPartsCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-cyber-400/20 flex justify-between items-center">
            <div>
              <span className="text-sm text-navy-200">总计</span>
              <p className="text-xs text-navy-400">根据《家庭服务业管理暂行办法》明码标价</p>
            </div>
            <span className="text-3xl font-bold text-cyber-400">¥{totalCost.toFixed(2)}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4 flex items-center gap-2">
            <Package size={16} /> 使用配件清单
          </h2>
          <div className="space-y-2">
            {usedParts.map(part => (
              <div key={part.id} className="flex items-center justify-between py-2.5 border-b border-navy-300/10 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-700/50 flex items-center justify-center">
                    <Package className="w-5 h-5 text-cyber-400/70" />
                  </div>
                  <div>
                    <p className="text-sm text-navy-100 font-medium">{part.name}</p>
                    <p className="text-xs text-navy-400">单价 ¥{part.price.toFixed(2)} × {part.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-cyber-400 font-medium">¥{part.subtotal.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4">维修前后对比</h2>
          <div className="grid grid-cols-2 gap-3">
            <PhotoColumn label="维修前照片" photos={order.beforePhotos} />
            <PhotoColumn label="维修后照片" photos={order.afterPhotos} />
          </div>
          <p className="text-[10px] text-navy-400 mt-3 text-center">
            照片将作为电子合同附件存入存证系统
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4 flex items-center gap-2">
            <PenTool size={16} /> 用户签字确认
          </h2>
          <div className="bg-white rounded-lg min-h-[140px] flex items-center justify-center mb-3 relative overflow-hidden border-2 border-dashed border-white/20">
            {signed ? (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <p className="text-gray-800 text-2xl" style={{ fontFamily: 'cursive' }}>{order.customerName}</p>
                <p className="text-gray-500 text-xs mt-1">已确认完工并签字</p>
              </motion.div>
            ) : (
              <div className="text-center">
                <PenTool size={28} className="text-gray-300 mx-auto mb-1" />
                <span className="text-gray-400 text-sm">用户签字区域</span>
                <p className="text-gray-300 text-xs mt-2">请用户在屏幕上签字确认</p>
              </div>
            )}
          </div>
          {signed && signTime && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-navy-400 text-center mb-3 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              签字时间: {signTime}
            </motion.p>
          )}
          {!signed && (
            <button onClick={handleSign} className="btn-primary w-full">
              确认签字
            </button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass-card p-5">
          <h2 className="text-cyber-400 font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck size={16} /> 电子合同存证
          </h2>
          <div className="bg-navy-800/40 rounded-xl p-4 border border-cyber-400/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyber-400/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-cyber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-50">《家庭维修服务合同》</p>
                <p className="text-xs text-navy-300 mt-0.5">
                  合同编号: HT-{order.orderId}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-navy-200">
              <div className="flex justify-between">
                <span className="text-navy-400">存证状态</span>
                <span className={order.status === 'archived' ? 'text-cyber-400' : 'text-warm-500'}>
                  {order.status === 'archived' ? '已存证' : '待存证'}
                </span>
              </div>
              {order.status === 'archived' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-navy-400">存证时间</span>
                    <span>{signTime || '2024-01-15 14:30'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">区块链哈希</span>
                    <span className="font-mono text-cyber-400/70">0x7a3f...c8e2</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-navy-400">证据附件</span>
                <span>前后照片 + 签字 + 费用明细</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowContract(!showContract)}
            className="btn-secondary w-full mt-4 text-sm py-2 flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            {showContract ? '收起合同预览' : '查看电子合同'}
          </button>
          {showContract && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-4 bg-white/[0.02] rounded-lg border border-white/10 text-xs text-navy-200 leading-relaxed"
            >
              <p className="text-center font-bold text-sm text-navy-50 mb-3">家庭维修服务合同</p>
              <p className="mb-2">甲方（用户）：{order.customerName}</p>
              <p className="mb-2">乙方（服务商）：家修互联平台</p>
              <p className="mb-2">服务项目：{order.categoryLabel} - {order.faultDescription}</p>
              <p className="mb-2">服务费用：人民币 ¥{totalCost.toFixed(2)} 元</p>
              <p className="mb-2">质保期限：自完工之日起 90 天</p>
              <p className="text-[10px] text-navy-400 mt-3">
                本合同符合《家庭服务业管理暂行办法》相关规定，电子签名与手写签名具有同等法律效力。
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-navy-900/95 backdrop-blur-md border-t border-cyber-400/20 p-3 z-50">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button onClick={() => navigate('/engineer')} className="btn-secondary flex-1 py-3">返回列表</button>
          <button onClick={handlePrimaryAction}
            disabled={order.status === 'archived'}
            className={`btn-warm flex-1 py-3 font-medium ${order.status === 'archived' ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {actionBtnText[order.status] || '开始维修'}
          </button>
        </div>
      </div>
    </div>
  )
}
