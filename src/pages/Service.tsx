import { useState } from 'react'
import { useStore } from '@/store/useStore'
import type { ServiceType, ServiceUrgency } from '@/types'
import { Wrench, Droplets, Zap, Tv, Home, MoreHorizontal, Star, Send, Clock, CheckCircle, Truck } from 'lucide-react'

const serviceTypes: { type: ServiceType; label: string; icon: typeof Droplets }[] = [
  { type: 'plumbing', label: '水管维修', icon: Droplets },
  { type: 'electrical', label: '电路维修', icon: Zap },
  { type: 'appliance', label: '家电维修', icon: Tv },
  { type: 'structural', label: '房屋结构', icon: Home },
  { type: 'other', label: '其他', icon: MoreHorizontal },
]

const urgencyConfig: { level: ServiceUrgency; label: string; color: string }[] = [
  { level: 'low', label: '低', color: 'bg-green-500 text-white' },
  { level: 'medium', label: '中', color: 'bg-amber-500 text-white' },
  { level: 'high', label: '高', color: 'bg-red-500 text-white' },
]

const statusMap: Record<string, { label: string; color: string }> = {
  submitted: { label: '已提交', color: 'bg-blue-100 text-ccb-500' },
  dispatched: { label: '已派单', color: 'bg-amber-100 text-amber-700' },
  in_progress: { label: '处理中', color: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
}

const timelineSteps = ['submitted', 'dispatched', 'in_progress', 'completed']

function getTypeIcon(type: ServiceType) {
  return serviceTypes.find((s) => s.type === type)?.icon ?? Wrench
}

function getTypeLabel(type: ServiceType) {
  return serviceTypes.find((s) => s.type === type)?.label ?? '其他'
}

export default function Service() {
  const { serviceRequests, submitServiceRequest, rateService } = useStore()
  const [selectedType, setSelectedType] = useState<ServiceType>('plumbing')
  const [urgency, setUrgency] = useState<ServiceUrgency>('medium')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [dispatching, setDispatching] = useState(false)
  const [dispatchResult, setDispatchResult] = useState<string | null>(null)
  const [ratingMap, setRatingMap] = useState<Record<string, { score: number; comment: string }>>({})

  const handleSubmit = () => {
    if (!description.trim()) return
    submitServiceRequest({
      contractId: 'C001',
      type: selectedType,
      urgency,
      description: description.trim(),
      images,
      assignedProvider: { id: '', name: '', rating: 0 },
    })
    setDescription('')
    setImages([])
    setDispatching(true)
    setDispatchResult(null)
    setTimeout(() => {
      setDispatching(false)
      setDispatchResult('万达物业维修')
    }, 2000)
  }

  const handleAddImage = () => {
    if (images.length < 6) {
      setImages([...images, `photo_${Date.now()}.jpg`])
    }
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
  }

  const getRating = (id: string) =>
    ratingMap[id] ?? { score: 0, comment: '' }

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
          {urgencyConfig.map(({ level, label, color }) => (
            <button
              key={level}
              onClick={() => setUrgency(level)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                urgency === level ? `${color} ring-2 ring-offset-2 ring-ccb-500` : 'bg-space-50 text-space-400'
              }`}
            >
              {label}
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
            {images.map((img, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-space-50 flex items-center justify-center text-xs text-space-400 border border-space-200"
              >
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
          disabled={!description.trim()}
          className="w-full py-3 rounded-lg bg-ccb-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-ccb-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          提交报修
        </button>
      </div>

      {dispatching && (
        <div className="bg-ccb-50 border border-ccb-200 rounded-xl p-6 text-center animate-pulse">
          <Truck className="w-10 h-10 text-ccb-500 mx-auto mb-2 animate-bounce" />
          <p className="text-ccb-500 font-semibold">系统正在智能匹配维修服务商...</p>
        </div>
      )}
      {dispatchResult && !dispatching && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <p className="font-semibold text-green-700">已为您匹配服务商</p>
            <p className="text-sm text-green-600">{dispatchResult}</p>
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
          const status = statusMap[req.status]
          const stepIdx = timelineSteps.indexOf(req.status)
          return (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-space-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-ccb-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-ccb-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-space-800">{getTypeLabel(req.type)}</p>
                    <p className="text-sm text-space-400">{req.description}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {timelineSteps.map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        i <= stepIdx ? 'bg-ccb-500' : 'bg-space-200'
                      }`}
                    />
                    {i < timelineSteps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          i < stepIdx ? 'bg-ccb-500' : 'bg-space-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {req.assignedProvider?.name && (
                <div className="flex items-center gap-2 text-sm text-space-500">
                  <span>服务商：{req.assignedProvider.name}</span>
                  <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                  <span>{req.assignedProvider.rating}</span>
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
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => updateRating(req.id, { score: n })}>
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          n <= r.score ? 'text-gold-500 fill-gold-500' : 'text-space-200'
                        }`}
                      />
                    </button>
                  ))}
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
