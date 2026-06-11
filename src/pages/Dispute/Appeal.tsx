import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  CheckCircle,
  User as UserIcon,
  Scale,
  MapPin,
  Clock,
  Send,
  AlertCircle,
  FileText,
  Gavel,
} from 'lucide-react'
import MainLayout from '@/components/layout/MainLayout'
import EvidenceUpload from '@/components/ui/EvidenceUpload'
import { mockApi } from '@/mock/api'
import { useAuthStore } from '@/store/useAuthStore'
import { formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { Consultation, LegalCaseType, Lawyer, User } from '@/types'

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

const appealTypes = [
  { value: 'service_attitude', label: '服务态度', icon: '😤' },
  { value: 'professional_ability', label: '专业能力', icon: '📚' },
  { value: 'response_timeout', label: '响应超时', icon: '⏰' },
  { value: 'other', label: '其他', icon: '❓' },
]

export default function Appeal() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [lawyer, setLawyer] = useState<Lawyer | null>(null)
  const [appellant, setAppellant] = useState<User | null>(null)
  const [appealType, setAppealType] = useState('')
  const [description, setDescription] = useState('')
  const [evidences, setEvidences] = useState<File[]>([])

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
        if (consult.userId) {
          const userInfo = await mockApi.getUserInfo(consult.userId)
          setAppellant(userInfo as User)
        }
      }
      setLoading(false)
    }
    loadData()
  }, [id])

  const minLength = 50
  const canSubmit =
    appealType &&
    description.length >= minLength &&
    currentUser &&
    consultation

  const handleSubmit = async () => {
    if (!canSubmit || !consultation || !currentUser || !lawyer) return

    setSubmitting(true)
    try {
      await mockApi.submitAppeal({
        consultationId: consultation.id,
        appellantId: currentUser.id,
        respondentId: lawyer.id,
        reason: appealTypes.find((t) => t.value === appealType)?.label || '',
        description: description.trim(),
        evidences: evidences.map((file) => ({
          fileName: file.name,
          fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
          fileSize: file.size,
          fileUrl: URL.createObjectURL(file),
        })),
      })
      setSubmitted(true)
    } catch (error) {
      console.error('提交申诉失败:', error)
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
            <h2 className="text-2xl font-semibold text-slate-800 mb-3">申诉已受理</h2>
            <p className="text-slate-500 mb-6">
              您的申诉已成功提交，我们将尽快处理。
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">处理时限</p>
                  <p className="text-sm text-amber-600 mt-1">
                    申诉处理时限为 3-5 个工作日，请您耐心等待。处理结果将通过系统消息通知您。
                  </p>
                </div>
              </div>
            </div>
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
          <h1 className="text-xl font-semibold text-slate-800">提交申诉</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              案件信息
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

          <div className="p-6 bg-slate-50 space-y-4">
            {appellant && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">申诉人</p>
                  <p className="text-sm font-medium text-slate-700">{appellant.nickname}</p>
                </div>
              </div>
            )}
            {lawyer && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Gavel className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">被申诉律师</p>
                  <p className="text-sm font-medium text-slate-700">
                    {lawyer.realName} 律师 · {lawyer.lawFirm}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-800 mb-4">申诉类型</h2>
          <div className="grid grid-cols-2 gap-3">
            {appealTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setAppealType(type.value)}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all text-left',
                  appealType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <span className="text-2xl mb-2 block">{type.icon}</span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    appealType === type.value ? 'text-blue-600' : 'text-slate-700'
                  )}
                >
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-800 mb-4">申诉原因描述</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述您的申诉原因，以便我们更好地处理您的问题..."
            rows={6}
            className={cn(
              'w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors',
              description.length > 0 && description.length < minLength
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100'
            )}
          />
          <div className="flex items-center justify-between mt-2">
            {description.length > 0 && description.length < minLength && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                至少需要 {minLength} 字，还差 {minLength - description.length} 字
              </span>
            )}
            <span
              className={cn(
                'text-xs ml-auto',
                description.length >= minLength ? 'text-green-500' : 'text-slate-400'
              )}
            >
              {description.length}/{minLength}+
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-800 mb-4">证据上传</h2>
          <EvidenceUpload
            maxFiles={9}
            accept="image/*"
            onFilesChange={setEvidences}
          />
          <p className="text-xs text-slate-400 mt-3">
            * 请上传聊天记录截图、证据材料等相关图片，最多9张
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">温馨提示</p>
              <p className="text-sm text-amber-600 mt-1">
                请如实填写申诉内容并提供相关证据。恶意申诉将影响您的信用评级。
              </p>
            </div>
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
              提交申诉
            </>
          )}
        </button>
      </div>
  )
}
