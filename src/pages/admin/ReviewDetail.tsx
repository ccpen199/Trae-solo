import { useParams, useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/stores/adminStore'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, User, CreditCard, Clock, AlertTriangle, Image } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentReviewOrder, fetchReviewOrder, submitReview, loading } = useAdminStore()
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) fetchReviewOrder(id)
  }, [id, fetchReviewOrder])

  const handleSubmit = async (action: string) => {
    if (!id) return
    setSubmitting(true)
    await submitReview(id, action, comment)
    setSubmitting(false)
    navigate('/admin/review')
  }

  if (loading && !currentReviewOrder) {
    return <div className="text-center text-gray-400 py-20">加载中...</div>
  }

  if (!currentReviewOrder) return null

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/review')}
        className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
      >
        <ArrowLeft size={16} />
        返回列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-card shadow-card p-6">
          <h3 className="text-lg font-bold text-primary mb-4">认证信息</h3>
          <div className="space-y-4">
            <InfoItem icon={User} label="姓名" value={currentReviewOrder.name} />
            <InfoItem icon={CreditCard} label="证件号" value={currentReviewOrder.idCard} />
            <InfoItem icon={CreditCard} label="社保号" value={currentReviewOrder.idCard} />
            <InfoItem icon={Clock} label="认证时间" value={currentReviewOrder.verifyTime} />
            <InfoItem icon={AlertTriangle} label="失败原因" value={currentReviewOrder.failureReason} />
          </div>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <h3 className="text-lg font-bold text-primary mb-4">截图记录</h3>
          <div className="grid grid-cols-3 gap-3">
            {(currentReviewOrder.screenshots || ['frame_001.jpg', 'frame_002.jpg', 'frame_003.jpg']).map((shot, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-gray-100 rounded-btn flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200"
              >
                <Image size={32} className="text-gray-300" />
                <span className="text-xs text-gray-400">截图 {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-card shadow-card p-6">
        <h3 className="text-lg font-bold text-primary mb-3">复核操作</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="请输入复核意见（选填）"
          className="w-full border border-gray-200 rounded-btn px-4 py-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => handleSubmit('approved')}
            disabled={submitting}
            className="px-8 py-3 bg-success text-white rounded-btn font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
          >
            通过
          </button>
          <button
            onClick={() => handleSubmit('rejected')}
            disabled={submitting}
            className="px-8 py-3 bg-error text-white rounded-btn font-medium hover:bg-error/90 transition-colors disabled:opacity-50"
          >
            驳回
          </button>
          <button
            onClick={() => handleSubmit('transferred')}
            disabled={submitting}
            className="px-8 py-3 bg-primary text-white rounded-btn font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            转办
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={18} className="text-gray-400 shrink-0" />
      <span className="text-sm text-gray-500 w-20 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
