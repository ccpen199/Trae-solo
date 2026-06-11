import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  CheckCircle,
  User,
  Scale,
  MapPin,
  Clock,
  Send,
  EyeOff,
} from 'lucide-react'
import StarRating from '@/components/ui/StarRating'
import { mockApi } from '@/mock/api'
import { useAuthStore } from '@/store/useAuthStore'
import { formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { Consultation, LegalCaseType, Lawyer } from '@/types'

const caseTypeMap: Record<LegalCaseType, { label: string; icon: string }> = {
  marriage: { label: '婚姻家庭', icon: '💍' },
  labor: { label: '劳动纠纷', icon: '💼' },
  debt: { label: '债务纠纷', icon: '💰' },
  property: { label: '房产纠纷', icon: '🏠' },
  contract: { label: '合同纠纷', icon: '📄' },
  traffic: { label: '交通事故', icon: '🚗' },
  criminal: { label: '刑事辩护', icon: '⚖️' },
  other: { label: '其他', icon: '❓' },
}

interface RatingDimensions {
  professionalism: number
  responseSpeed: number
  satisfaction: number
}

export default function Evaluate() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [lawyer, setLawyer] = useState<Lawyer | null>(null)
  const [ratings, setRatings] = useState<RatingDimensions>({
    professionalism: 0,
    responseSpeed: 0,
    satisfaction: 0,
  })
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const consult = await mockApi.getConsultationDetail(id)
      if (consult) {
        setConsultation(consult)
        if (consult.lawyerId) {
          const lawyerInfo = await mockApi.getUserInfo(consult.lawyerId)
          setLawyer(lawyerInfo as Lawyer)
        }
      }
      setLoading(false)
    }
    loadData()
  }, [id])

  const handleRatingChange = (dimension: keyof RatingDimensions, value: number) => {
    setRatings((prev) => ({ ...prev, [dimension]: value }))
  }

  const averageRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 3

  const canSubmit =
    ratings.professionalism > 0 &&
    ratings.responseSpeed > 0 &&
    ratings.satisfaction > 0 &&
    currentUser

  const handleSubmit = async () => {
    if (!canSubmit || !consultation || !currentUser) return

    setSubmitting(true)
    try {
      await mockApi.createEvaluation({
        consultationId: consultation.id,
        userId: currentUser.id,
        lawyerId: consultation.lawyerId || '',
        rating: Math.round(averageRating * 10) / 10,
        content: content.trim() || undefined,
      })
      setSubmitted(true)
    } catch (error) {
      console.error('提交评价失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
    )
  }

  if (!consultation) {
    return (
        <div className="flex flex-col items-center justify-center py-20">
          <Scale className="h-16 w-16 text-slate-300 mb-4" />
          <p className="text-slate-500 mb-4">咨询不存在或已被删除</p>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            返回上一页
          </button>
        </div>
    )
  }

  const caseInfo = caseTypeMap[consultation.caseType]

  if (submitted) {
    return (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-3">感谢您的评价！</h2>
            <p className="text-slate-500 mb-8">
              您的反馈对我们非常重要，我们会不断改进服务质量。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/consultations')}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                返回咨询列表
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
    )
  }

  return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-slate-800">服务评价</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-500" />
              案件基本信息
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-sm text-slate-400 w-20">标题</span>
                <span className="text-sm text-slate-700 flex-1">{consultation.title}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-sm text-slate-400 w-20">案由</span>
                <span className="text-sm text-slate-700">
                  {caseInfo.icon} {caseInfo.label}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-sm text-slate-400 w-20">地区</span>
                <span className="text-sm text-slate-700 inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {consultation.region}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-sm text-slate-400 w-20">时间</span>
                <span className="text-sm text-slate-700 inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(consultation.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {lawyer && (
            <div className="p-6 bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{lawyer.realName} 律师</p>
                  <p className="text-sm text-slate-500">{lawyer.lawFirm}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-800 mb-6">服务评分</h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">专业性</p>
                <p className="text-xs text-slate-400 mt-0.5">法律知识和专业能力</p>
              </div>
              <StarRating
                value={ratings.professionalism}
                onChange={(v) => handleRatingChange('professionalism', v)}
                size="lg"
              />
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">响应速度</p>
                <p className="text-xs text-slate-400 mt-0.5">消息回复的及时性</p>
              </div>
              <StarRating
                value={ratings.responseSpeed}
                onChange={(v) => handleRatingChange('responseSpeed', v)}
                size="lg"
              />
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">满意度</p>
                <p className="text-xs text-slate-400 mt-0.5">整体服务体验</p>
              </div>
              <StarRating
                value={ratings.satisfaction}
                onChange={(v) => handleRatingChange('satisfaction', v)}
                size="lg"
              />
            </div>
          </div>

          {canSubmit && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">综合评分</span>
                <div className="flex items-center gap-2">
                  <StarRating value={averageRating} readOnly size="md" />
                  <span className="text-lg font-semibold text-amber-500">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-800 mb-4">文字评价</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请分享您的服务体验，帮助其他用户做出更好的选择（选填）"
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <p className="text-xs text-slate-400 mt-2 text-right">{content.length}/500</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <EyeOff className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">匿名评价</p>
                <p className="text-xs text-slate-400">开启后评价将不显示您的身份信息</p>
              </div>
            </div>
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors',
                isAnonymous ? 'bg-blue-500' : 'bg-slate-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  isAnonymous ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={cn(
            'w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
            canSubmit && !submitting
              ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          )}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              提交中...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              提交评价
            </>
          )}
        </button>
      </div>
  )
}
