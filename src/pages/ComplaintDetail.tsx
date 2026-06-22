import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  MessageSquareWarning,
  Building2,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Phone,
} from 'lucide-react'
import type { Complaint } from '@/types'
import { api } from '@/utils/api'
import { cn } from '@/lib/utils'
import Loading from '@/components/Loading'

const STATUS_ORDER: string[] = ['pending', 'accepted', 'processing', 'resolved', 'closed']

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  accepted: '已受理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-400',
  accepted: 'bg-blue-500',
  processing: 'bg-orange-500',
  resolved: 'bg-emerald-500',
  closed: 'bg-gray-400',
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  processing: 'bg-orange-100 text-orange-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-600',
}

type TimelineNode = {
  status: string
  timestamp: string
  note: string
}

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [buildingName, setBuildingName] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api
      .getComplaint(id)
      .then((res) => {
        if (res.success && res.data) setComplaint(res.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!complaint?.buildingId) {
      setBuildingName('')
      return
    }

    api
      .getBuilding(complaint.buildingId)
      .then((res) => {
        setBuildingName(res.data?.name || '')
      })
      .catch(() => {
        setBuildingName('')
      })
  }, [complaint?.buildingId])

  const parseTimeline = (timelineStr: string): TimelineNode[] => {
    try {
      const parsed = JSON.parse(timelineStr)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          status: item?.status || complaint?.status || 'pending',
          timestamp: item?.timestamp || item?.time || complaint?.updatedAt || complaint?.createdAt || new Date().toISOString(),
          note: item?.note || item?.action || STATUS_LABELS[item?.status] || '状态更新',
        }))
      }
    } catch {}
    const currentStatus = complaint?.status || 'pending'
    const currentIdx = STATUS_ORDER.indexOf(currentStatus)
    return STATUS_ORDER.slice(0, currentIdx + 1).map((s, i) => ({
      status: s,
      timestamp:
        i === currentIdx
          ? complaint?.updatedAt || new Date().toISOString()
          : new Date(Date.now() - (currentIdx - i) * 86400000).toISOString(),
      note: STATUS_LABELS[s],
    }))
  }

  const handleUpdateStatus = async () => {
    if (!complaint || !id) return
    const currentIdx = STATUS_ORDER.indexOf(complaint.status)
    if (currentIdx >= STATUS_ORDER.length - 1) return
    const nextStatus = STATUS_ORDER[currentIdx + 1]
    setUpdating(true)
    try {
      const res = await api.updateComplaintStatus(id, nextStatus)
      if (res.success && res.data) {
        setComplaint(res.data)
      }
    } catch {} finally {
      setUpdating(false)
    }
  }

  if (loading) return <Loading text="加载投诉详情..." />

  if (!complaint) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <MessageSquareWarning size={48} className="mx-auto text-brand/20 mb-3" />
          <p className="text-charcoal/40">未找到投诉信息</p>
        </div>
      </div>
    )
  }

  const timeline = parseTimeline(complaint.timeline)
  const currentStatusIdx = STATUS_ORDER.indexOf(complaint.status)
  const isLastStatus = currentStatusIdx >= STATUS_ORDER.length - 1

  const timelineIcon = (status: string, isLast: boolean) => {
    if (status === 'resolved' || status === 'closed')
      return <CheckCircle2 size={18} className="text-emerald-600" />
    if (isLast) return <AlertCircle size={18} className="text-gold" />
    return <CheckCircle2 size={18} className="text-brand" />
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="card p-6 mb-6 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <h1 className="section-title text-xl flex items-center gap-3">
              <MessageSquareWarning className="text-brand" size={24} />
              {complaint.title}
            </h1>
            <span className={cn('badge shrink-0', STATUS_BADGE[complaint.status] || 'bg-gray-100 text-gray-500')}>
              {STATUS_LABELS[complaint.status] || complaint.status}
            </span>
          </div>
        </div>

        <div className="card p-6 mb-6 animate-fade-in-up">
          <h3 className="text-sm font-medium text-charcoal/50 mb-4">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-brand-50/50 rounded-lg p-3">
              <Building2 size={16} className="text-brand/50 shrink-0" />
              <div>
                <p className="text-xs text-charcoal/40">楼盘</p>
                <p className="text-sm font-medium text-charcoal">{buildingName || complaint.buildingId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-brand-50/50 rounded-lg p-3">
              <Tag size={16} className="text-brand/50 shrink-0" />
              <div>
                <p className="text-xs text-charcoal/40">类型</p>
                <p className="text-sm font-medium text-charcoal">{complaint.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-brand-50/50 rounded-lg p-3">
              <User size={16} className="text-brand/50 shrink-0" />
              <div>
                <p className="text-xs text-charcoal/40">提交人</p>
                <p className="text-sm font-medium text-charcoal">{complaint.submitterName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-brand-50/50 rounded-lg p-3">
              <Phone size={16} className="text-brand/50 shrink-0" />
              <div>
                <p className="text-xs text-charcoal/40">联系电话</p>
                <p className="text-sm font-medium text-charcoal">{complaint.submitterPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-brand-50/50 rounded-lg p-3">
              <Clock size={16} className="text-brand/50 shrink-0" />
              <div>
                <p className="text-xs text-charcoal/40">提交时间</p>
                <p className="text-sm font-medium text-charcoal">
                  {new Date(complaint.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-brand-50/50 rounded-lg p-3">
              <Clock size={16} className="text-brand/50 shrink-0" />
              <div>
                <p className="text-xs text-charcoal/40">更新时间</p>
                <p className="text-sm font-medium text-charcoal">
                  {new Date(complaint.updatedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-6 animate-fade-in-up">
          <h3 className="text-sm font-medium text-charcoal/50 mb-4">处理进度</h3>
          <div className="relative pl-6">
            {timeline.map((node, idx) => {
              const isLast = idx === timeline.length - 1
              return (
                <div key={idx} className="relative pb-6 last:pb-0">
                  {!isLast && (
                    <div className="absolute left-[-18px] top-[22px] bottom-0 w-0.5 bg-brand-100" />
                  )}
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm z-10',
                        STATUS_COLORS[node.status] || 'bg-gray-400'
                      )}
                    >
                      {timelineIcon(node.status, isLast)}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-charcoal">{node.note}</span>
                        <span className="text-xs text-charcoal/30">
                          {new Date(node.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-6 mb-6 animate-fade-in-up">
          <h3 className="text-sm font-medium text-charcoal/50 mb-3">投诉内容</h3>
          <p className="text-charcoal leading-relaxed whitespace-pre-wrap">{complaint.content}</p>
        </div>

        {!isLastStatus && (
          <div className="sticky bottom-4 z-10 animate-fade-in">
            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 shadow-lg disabled:opacity-50"
            >
              {updating ? (
                '更新中...'
              ) : (
                <>
                  更新状态为: {STATUS_LABELS[STATUS_ORDER[currentStatusIdx + 1]]}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
