import React from 'react'
import { X, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck, ShieldAlert, User, Calendar, FileText, MapPin, Building2, BadgeCheck } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToastStore } from '@/store'

interface JobDetail {
  id: string
  title: string
  department: string
  required_title: string
  required_category: string
  location: string
  salary_min: number
  salary_max: number
  description: string
  requirements: string
  status: string
  ai_risk_score: number
  created_at: string
  approved_by: number
  approved_at: string
  approved_by_name: string
  closed_reason: string
  closed_at: string
  closed_by_name: string
  review_note: string
  institution_name: string
  institution_type: string
  verified_level: number
  verified_level_text: string
  license_expiry: string
  review_status: string
}

interface JobDetailModalProps {
  open: boolean
  onClose: () => void
  jobId: string | null
}

const riskColor = (score: number) => {
  if (score >= 80) return 'text-red-600 bg-red-100'
  if (score >= 50) return 'text-amber-600 bg-amber-100'
  return 'text-green-600 bg-green-100'
}

const verifiedLevelColor = (level: number) => {
  if (level >= 2) return 'bg-green-100 text-green-700 border-green-200'
  if (level === 1) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

const statusTextMap: Record<string, string> = {
  pending: '待审核',
  active: '已上架',
  rejected: '已驳回',
  closed: '已下架',
}

const statusColorMap: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  closed: 'bg-stone-100 text-stone-600',
}

function formatSalary(min: number, max: number) {
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)
  return `${fmt(min)}-${fmt(max)}`
}

function formatDate(iso: string) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function JobDetailModal({ open, onClose, jobId }: JobDetailModalProps) {
  const { toast } = useToastStore()
  const [job, setJob] = React.useState<JobDetail | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open && jobId) {
      const fetchJob = async () => {
        setLoading(true)
        try {
          const res = await apiFetch(`/jobs/${jobId}`)
          if (res.success) setJob(res.data)
        } catch (err: any) {
          toast('error', err.message || '加载失败')
        } finally {
          setLoading(false)
        }
      }
      fetchJob()
    }
  }, [open, jobId, toast])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold">职位合规详情</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
          </div>
        ) : !job ? (
          <div className="flex-1 flex items-center justify-center py-12 text-stone-500">数据加载失败</div>
        ) : (
          <div className="flex-1 overflow-auto space-y-5">
            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-teal-50 to-amber-50 rounded-lg border border-teal-100">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-xl text-stone-800">{job.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColorMap[job.status]}`}>{statusTextMap[job.status]}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-stone-600">
                  <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.institution_name}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                  <span className="flex items-center gap-1"><BadgeCheck className="w-4 h-4" /> {job.department} · {job.required_title || '不限'}</span>
                  <span className="text-teal-700 font-semibold">{formatSalary(job.salary_min, job.salary_max)}/月</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${verifiedLevelColor(job.verified_level)}`}>
                  {job.verified_level >= 2 ? <ShieldCheck className="w-3.5 h-3.5 inline mr-1" /> : <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />}
                  {job.verified_level_text}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${riskColor(job.ai_risk_score)}`}>
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />风险评分 {job.ai_risk_score}/100
                </span>
              </div>
            </div>

            {job.closed_reason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1 text-red-700 font-medium">
                  <XCircle className="w-5 h-5" /> 下架原因
                </div>
                <p className="text-sm text-red-600">{job.closed_reason}</p>
                {job.closed_at && (
                  <p className="text-xs text-red-500 mt-2">下架操作人：{job.closed_by_name || '-'} · {formatDate(job.closed_at)}</p>
                )}
              </div>
            )}

            {job.review_note && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1 text-teal-700 font-medium">
                  <FileText className="w-5 h-5" /> 审核备注
                </div>
                <p className="text-sm text-teal-600">{job.review_note}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 rounded-lg">
                <h5 className="font-medium text-stone-700 mb-3 text-sm">机构资质校验</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">机构类型</span>
                    <span className="text-stone-700">{job.institution_type || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">认证等级</span>
                    <span className={`font-medium ${job.verified_level >= 2 ? 'text-green-600' : job.verified_level === 1 ? 'text-amber-600' : 'text-red-600'}`}>{job.verified_level_text}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">资质有效期</span>
                    <span className="text-stone-700">{job.license_expiry || '长期'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">审核状态</span>
                    <span className="text-stone-700">{job.review_status === 'approved' ? '已通过' : job.review_status === 'pending' ? '待审核' : '已驳回'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 rounded-lg">
                <h5 className="font-medium text-stone-700 mb-3 text-sm">审核追踪记录</h5>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-stone-400 mt-0.5" />
                    <div>
                      <div className="text-stone-600">提交发布</div>
                      <div className="text-xs text-stone-400">{formatDate(job.created_at)}</div>
                    </div>
                  </div>
                  {job.approved_at && (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <div className="text-stone-600">审核通过 · {job.approved_by_name || '系统'}</div>
                        <div className="text-xs text-stone-400">{formatDate(job.approved_at)}</div>
                      </div>
                    </div>
                  )}
                  {job.closed_at && (
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      <div>
                        <div className="text-stone-600">职位下架 · {job.closed_by_name || '系统'}</div>
                        <div className="text-xs text-stone-400">{formatDate(job.closed_at)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {job.ai_risk_score >= 30 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h5 className="font-medium text-amber-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> AI风险识别详情
                </h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {job.salary_max - job.salary_min > 30000 && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">薪资范围异常</span>
                  )}
                  {job.salary_max > 80000 && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">最高薪资偏高</span>
                  )}
                  {(!job.description || job.description.length < 20) && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">职位描述过短</span>
                  )}
                  {(!job.requirements || job.requirements.length < 10) && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">任职要求过短</span>
                  )}
                  {!job.required_title && !job.required_category && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">资质要求模糊</span>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 bg-stone-50 rounded-lg">
              <h5 className="font-medium text-stone-700 mb-2 text-sm">职位描述</h5>
              <p className="text-sm text-stone-600 whitespace-pre-wrap">{job.description || '暂无描述'}</p>
            </div>

            <div className="p-4 bg-stone-50 rounded-lg">
              <h5 className="font-medium text-stone-700 mb-2 text-sm">任职要求</h5>
              <p className="text-sm text-stone-600 whitespace-pre-wrap">{job.requirements || '暂无要求'}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5 pt-4 border-t border-stone-200">
          <button onClick={onClose} className="flex-1 py-2 border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">关闭</button>
        </div>
      </div>
    </div>
  )
}
