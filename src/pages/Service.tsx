import { useState } from 'react'
import { useStore } from '@/store/useStore'
import type { ServiceType, ServiceUrgency, ServiceProvider } from '@/types'
import {
  Wrench, Droplets, Zap, Tv, Home, MoreHorizontal, Star, Send, Clock,
  CheckCircle, Truck, Shield, TrendingUp, User,
} from 'lucide-react'

const serviceTypes: { type: ServiceType; label: string; icon: typeof Droplets }[] = [
  { type: 'plumbing', label: '水管维修', icon: Droplets },
  { type: 'electrical', label: '电路维修', icon: Zap },
  { type: 'appliance', label: '家电维修', icon: Tv },
  { type: 'structural', label: '房屋结构', icon: Home },
  { type: 'other', label: '其他', icon: MoreHorizontal },
]

const urgencyConfig: Record<ServiceUrgency, { label: string; badge: string; border: string; ring: string }> = {
  high: { label: '紧急', badge: 'bg-red-500 text-white', border: 'border-l-4 border-l-red-500', ring: 'ring-red-500' },
  medium: { label: '中等', badge: 'bg-amber-500 text-white', border: 'border-l-4 border-l-amber-500', ring: 'ring-amber-500' },
  low: { label: '一般', badge: 'bg-green-500 text-white', border: 'border-l-4 border-l-green-500', ring: 'ring-green-500' },
}

const statusInfo: Record<string, { label: string; actor: string; action: string }> = {
  submitted: { label: '已提交', actor: '租户', action: '提交了报修请求' },
  dispatched: { label: '已派单', actor: '系统', action: '匹配服务商并派单' },
  in_progress: { label: '处理中', actor: '服务商', action: '开始处理维修' },
  completed: { label: '已完成', actor: '服务商', action: '完成维修' },
}

const ratingLabels = ['', '很不满意', '不满意', '一般', '满意', '非常满意']

const providers: ServiceProvider[] = [
  { id: 'SP001', name: '万达物业维修', rating: 4.5, completionRate: 96, avgResponseTime: '2h' },
  { id: 'SP002', name: '中建物业', rating: 4.7, completionRate: 98, avgResponseTime: '1.5h' },
  { id: 'SP003', name: '安居快修', rating: 4.3, completionRate: 94, avgResponseTime: '2.5h' },
  { id: 'SP004', name: '鑫诚服务', rating: 4.8, completionRate: 99, avgResponseTime: '1h' },
]

function matchProvider(urgency: ServiceUrgency): ServiceProvider {
  if (urgency === 'high') return providers.reduce((a, b) => (a.rating > b.rating ? a : b))
  return providers[Math.floor(Math.random() * (providers.length - 1))]
}

function getTypeIcon(type: ServiceType) {
  return serviceTypes.find((s) => s.type === type)?.icon ?? Wrench
}

function getTypeLabel(type: ServiceType) {
  return serviceTypes.find((s) => s.type === type)?.label ?? '其他'
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Service() {
  const { serviceRequests, submitServiceRequest, dispatchServiceRequest, rateService } = useStore()
  const [selectedType, setSelectedType] = useState<ServiceType>('plumbing')
  const [urgency, setUrgency] = useState<ServiceUrgency>('medium')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [dispatching, setDispatching] = useState(false)
  const [dispatchResult, setDispatchResult] = useState<{ requestId: string; provider: ServiceProvider } | null>(null)
  const [ratingMap, setRatingMap] = useState<Record<string, { score: number; comment: string }>>({})
  const [ratedConfirm, setRatedConfirm] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!description.trim()) return
    submitServiceRequest({
      contractId: 'C001',
      type: selectedType,
      urgency,
      description: description.trim(),
      images,
      assignedProvider: { id: '', name: '', rating: 0, completionRate: 0, avgResponseTime: '' },
      dispatchHistory: [{ status: 'submitted', timestamp: new Date().toISOString() }],
    })
    setDescription('')
    setImages([])
    setDispatching(true)
    setDispatchResult(null)
    const matched = matchProvider(urgency)
    setTimeout(() => {
      const newReq = useStore.getState().serviceRequests.find((r) => r.status === 'submitted' && !r.assignedProvider.name)
      if (newReq) {
        dispatchServiceRequest(newReq.id, matched)
        setDispatchResult({ requestId: newReq.id, provider: matched })
      }
      setDispatching(false)
    }, 2000)
  }

  const handleAddImage = () => {
    if (images.length < 6) setImages([...images, `photo_${Date.now()}.jpg`])
  }

  const handleRate = (requestId: string) => {
    const r = ratingMap[requestId]
    if (!r || r.score === 0) return
    rateService(requestId, r.score, r.comment || '')
    setRatingMap((prev) => {
      const next = { ...prev }
      delete next[requestId]
      return next
    })
    setRatedConfirm(requestId)
    setTimeout(() => setRatedConfirm(null), 3000)
  }

  const getRating = (id: string) => ratingMap[id] ?? { score: 0, comment: '' }
  const updateRating = (id: string, patch: Partial<{ score: number; comment: string }>) =>
    setRatingMap((prev) => ({ ...prev, [id]: { ...getRating(id), ...patch } }))

  const unrated = serviceRequests.filter((r) => r.status === 'completed' && !r.rating)

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-serif font-semibold text-ccb-500 flex items-center gap-2">
        <Wrench className="w-6 h-6" />
        租后报修服务
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-space-100 p-6 space-y-5">
        <h3 className="font-semibold text-space-800">报修类型</h3>
        <div className="grid grid-cols-5 gap-3">
          {serviceTypes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                selectedType === type
                  ? 'border-ccb-500 bg-ccb-50 text-ccb-500'
                  : 'border-space-100 text-space-400 hover:border-ccb-200'
              }`}
            >
              <Icon className="w-7 h-7" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <h3 className="font-semibold text-space-800">紧急程度</h3>
        <div className="flex gap-3">
          {(['low', 'medium', 'high'] as ServiceUrgency[]).map((level) => (
            <button
              key={level}
              onClick={() => setUrgency(level)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                urgency === level
                  ? `${urgencyConfig[level].badge} ring-2 ring-offset-2 ${urgencyConfig[level].ring}`
                  : 'bg-space-50 text-space-400'
              }`}
            >
              {urgencyConfig[level].label}
            </button>
          ))}
        </div>

        <div>
          <h3 className="font-semibold text-space-800 mb-2">问题描述</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述您遇到的问题..."
            className="w-full h-28 border border-space-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ccb-500 focus:border-transparent"
          />
        </div>

        <div>
          <h3 className="font-semibold text-space-800 mb-2">现场照片</h3>
          <div className="grid grid-cols-4 gap-3">
            {images.map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-space-50 flex items-center justify-center text-xs text-space-400 border border-space-200">
                已上传
              </div>
            ))}
            {images.length < 6 && (
              <button
                onClick={handleAddImage}
                className="aspect-square rounded-lg border-2 border-dashed border-space-200 flex items-center justify-center text-space-300 hover:border-ccb-500 hover:text-ccb-500 transition-colors"
              >
                + 上传
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!description.trim() || dispatching}
          className="w-full py-3 rounded-lg bg-ccb-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-ccb-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          提交报修
        </button>
      </div>

      {dispatching && (
        <div className="bg-ccb-50 border border-ccb-200 rounded-xl p-6 text-center animate-pulse">
          <Truck className="w-10 h-10 text-ccb-500 mx-auto mb-2 animate-bounce" />
          <p className="text-ccb-500 font-semibold">系统智能匹配中...</p>
          {urgency === 'high' && <p className="text-sm text-red-500 mt-1">⚡ 紧急工单，优先派单</p>}
        </div>
      )}

      {dispatchResult && !dispatching && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <p className="font-semibold text-green-700">已为您匹配服务商</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-space-400">服务商：</span><span className="font-medium">{dispatchResult.provider.name}</span></div>
            <div><span className="text-space-400">评分：</span><span className="font-medium">{dispatchResult.provider.rating}</span></div>
            <div><span className="text-space-400">完工率：</span><span className="font-medium">{dispatchResult.provider.completionRate}%</span></div>
            <div><span className="text-space-400">平均响应：</span><span className="font-medium">{dispatchResult.provider.avgResponseTime}</span></div>
          </div>
        </div>
      )}

      <h3 className="text-xl font-serif font-semibold text-space-800 flex items-center gap-2">
        <Clock className="w-5 h-5 text-ccb-500" />
        报修进度
      </h3>

      <div className="space-y-4">
        {serviceRequests.map((req) => {
          const Icon = getTypeIcon(req.type)
          const uc = urgencyConfig[req.urgency]
          return (
            <div key={req.id} className={`bg-white rounded-xl shadow-sm border border-space-100 ${uc.border} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-ccb-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-ccb-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-space-800">{getTypeLabel(req.type)}</p>
                      {req.urgency === 'high' && <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white">紧急</span>}
                    </div>
                    <p className="text-sm text-space-400">{req.description}</p>
                  </div>
                </div>
              </div>

              <div className="border-l-2 border-space-100 ml-2 pl-4 space-y-3 mb-4">
                {req.dispatchHistory.map((entry, i) => {
                  const info = statusInfo[entry.status]
                  return (
                    <div key={i} className="relative">
                      <div
                        className={`absolute -left-[1.35rem] top-1 w-2.5 h-2.5 rounded-full ${
                          i === req.dispatchHistory.length - 1 ? 'bg-ccb-500 ring-2 ring-ccb-200' : 'bg-space-300'
                        }`}
                      />
                      <div className="flex items-baseline gap-2 text-sm flex-wrap">
                        <span className="font-medium text-space-700">{info?.label}</span>
                        <span className="text-space-400">{info?.actor} {info?.action}</span>
                        <span className="text-space-300 text-xs ml-auto">{fmtTime(entry.timestamp)}</span>
                      </div>
                      {entry.status === 'dispatched' && req.assignedProvider?.name && (
                        <p className="text-xs text-ccb-600 mt-0.5">
                          匹配服务商：{req.assignedProvider.name}（评分 {req.assignedProvider.rating}）
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {req.assignedProvider?.name && (
                <div className="bg-space-50 rounded-lg p-4 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-ccb-500" />
                    <span className="font-semibold text-space-800 text-sm">服务商信息</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <div className="text-space-500">{req.assignedProvider.name}</div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(req.assignedProvider.rating)
                              ? 'text-gold-500 fill-gold-500'
                              : 'text-space-200'
                          }`}
                        />
                      ))}
                      <span className="text-space-600 ml-1">{req.assignedProvider.rating}</span>
                    </div>
                    <div className="text-space-500">
                      完工率 <span className="font-medium text-space-700">{req.assignedProvider.completionRate}%</span>
                    </div>
                    <div className="text-space-500">
                      平均响应 <span className="font-medium text-space-700">{req.assignedProvider.avgResponseTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-space-200 text-xs">
                    <div className="flex items-center gap-1 text-green-600">
                      <Shield className="w-3.5 h-3.5" />
                      服务标准契约合规
                    </div>
                    <div className="flex items-center gap-1 text-ccb-600">
                      <TrendingUp className="w-3.5 h-3.5" />
                      近期评价: ↑4.5 → 4.7
                    </div>
                  </div>
                </div>
              )}

              {req.rating && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-space-500">评价：</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < req.rating!.score ? 'text-gold-500 fill-gold-500' : 'text-space-200'
                      }`}
                    />
                  ))}
                  <span className="text-space-600">{req.rating.score}分</span>
                  {ratedConfirm === req.id && (
                    <span className="text-green-600 text-xs">评价已提交，将纳入供应商考核体系</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {unrated.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-semibold text-space-800 flex items-center gap-2">
            <Star className="w-5 h-5 text-gold-500" />
            服务评价
          </h3>
          {unrated.map((req) => {
            const r = getRating(req.id)
            return (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-space-100 p-5 space-y-3">
                <p className="font-semibold text-space-800">
                  {getTypeLabel(req.type)} - {req.description}
                </p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => updateRating(req.id, { score: n })}>
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          n <= r.score ? 'text-gold-500 fill-gold-500' : 'text-space-200'
                        }`}
                      />
                    </button>
                  ))}
                  {r.score > 0 && (
                    <span className="ml-2 text-sm text-gold-600 font-medium">{ratingLabels[r.score]}</span>
                  )}
                </div>
                <textarea
                  value={r.comment}
                  onChange={(e) => updateRating(req.id, { comment: e.target.value })}
                  placeholder="请输入您的评价..."
                  className="w-full h-20 border border-space-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleRate(req.id)}
                  disabled={r.score === 0}
                  className="px-6 py-2 rounded-lg bg-gold-500 text-white font-semibold hover:bg-gold-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  提交评价
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
