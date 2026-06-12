import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { MapPin, Building2, Clock, Briefcase, Award, Send, ArrowLeft, X, CheckCircle2, Clock as ClockIcon, AlertTriangle, FileText, ShieldCheck, HelpCircle, XCircle, Ban, UserCheck, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AuditRecord {
  id: string
  action: string
  reviewer_name: string
  review_note?: string
  created_at: string
}

interface JobData {
  id: string
  title: string
  department: string
  institution_name: string
  institution_type: string
  institution_id: string
  verified_level?: number
  verified_level_text?: string
  location: string
  salary_min: number
  salary_max: number
  required_title: string
  required_category: string
  description: string
  requirements: string
  publishedAt: string
  created_at: string
  status: string
  closed_reason?: string
  closed_at?: string
  closed_by_name?: string
  approved_by?: string
  approved_by_name?: string
  approved_at?: string
  review_note?: string
  ai_risk_score?: number
  submitted_at?: string
}

interface SimilarJob {
  id: string
  title: string
  department: string
  institution_name: string
  location: string
  salary_min: number
  salary_max: number
}

const verifyLevelMap: Record<number, { label: string; color: string; icon: any; desc: string }> = {
  2: { label: '高级认证', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: ShieldCheck, desc: '已通过完整资质审核，包含营业执照、执业许可证、医疗机构等级认证' },
  1: { label: '基础认证', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: CheckCircle2, desc: '已通过基础资质审核，包含营业执照和基本身份验证' },
  0: { label: '未认证', color: 'bg-stone-100 text-stone-600 border-stone-200', icon: AlertTriangle, desc: '尚未提交资质认证，信息真实性请自行核实' },
  3: { label: '认证过期', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, desc: '认证已过期，请提醒机构重新提交认证' },
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: '已上架', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: ClockIcon },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  closed: { label: '已下架', color: 'bg-stone-100 text-stone-600 border-stone-200', icon: Ban },
}

const actionLabelMap: Record<string, { label: string; icon: any; color: string }> = {
  create: { label: '创建职位', icon: FileText, color: 'bg-stone-100 text-stone-600' },
  submit: { label: '提交审核', icon: Send, color: 'bg-blue-100 text-blue-600' },
  ai_review: { label: 'AI风险评估', icon: ShieldCheck, color: 'bg-purple-100 text-purple-600' },
  approve: { label: '审核通过', icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
  reject: { label: '审核驳回', icon: XCircle, color: 'bg-red-100 text-red-600' },
  close: { label: '下架职位', icon: Ban, color: 'bg-stone-100 text-stone-600' },
}

function formatSalary(min: number, max: number) {
  return `${Math.round(min / 1000)}K-${Math.round(max / 1000)}K`
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function getVerifyBadge(level?: number) {
  const key = level ?? 0
  return verifyLevelMap[key] || verifyLevelMap[0]
}

export default function JobDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [job, setJob] = useState<JobData | null>(null)
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [closing, setClosing] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [showVerifyTooltip, setShowVerifyTooltip] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await apiFetch(`/jobs/${id}`)
        if (res.success) {
          setJob(res.data)
          if (res.data.department) {
            const similarRes = await apiFetch(`/jobs?pageSize=4&department=${encodeURIComponent(res.data.department)}`)
            if (similarRes.success) {
              setSimilarJobs(
                (similarRes.data.items || [])
                  .filter((j: SimilarJob) => String(j.id) !== String(id))
                  .slice(0, 3)
              )
            }
          }
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleApply = async () => {
    if (!user) { navigate('/login'); return }
    setApplying(true)
    try {
      await apiFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId: id }),
      })
      setApplied(true)
    } catch {
      setApplied(true)
    } finally {
      setApplying(false)
    }
  }

  const handleCloseJob = async () => {
    if (!closeReason.trim()) return
    setClosing(true)
    try {
      const res = await apiFetch(`/jobs/${id}/close`, {
        method: 'PUT',
        body: JSON.stringify({ close_reason: closeReason }),
      })
      if (res.success) {
        setJob(res.data)
        setShowCloseModal(false)
        setCloseReason('')
      }
    } catch (err: any) {
      alert(err.message || '下架失败')
    } finally {
      setClosing(false)
    }
  }

  const handleReview = async (status: 'active' | 'rejected') => {
    setReviewing(true)
    try {
      const res = await apiFetch(`/admin/jobs/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ status, review_note: reviewNote }),
      })
      if (res.success) {
        setJob(res.data.job)
        setShowReviewModal(false)
        setReviewNote('')
      }
    } catch (err: any) {
      alert(err.message || '审核失败')
    } finally {
      setReviewing(false)
    }
  }

  const isInstitutionOwner = user?.role === 'institution' && job && user.institutionName === job.institution_name
  const isAdmin = user?.role === 'admin'

  const buildAuditRecords = (): AuditRecord[] => {
    if (!job) return []
    const records: AuditRecord[] = []
    records.push({
      id: '1',
      action: 'create',
      reviewer_name: job.institution_name,
      review_note: '创建职位草稿',
      created_at: job.created_at || job.publishedAt || '',
    })
    records.push({
      id: '2',
      action: 'submit',
      reviewer_name: job.institution_name,
      review_note: '提交审核',
      created_at: job.submitted_at || job.created_at || '',
    })
    if (job.ai_risk_score !== undefined) {
      records.push({
        id: '3',
        action: 'ai_review',
        reviewer_name: 'AI系统',
        review_note: `风险评分: ${job.ai_risk_score}/100`,
        created_at: job.submitted_at || job.created_at || '',
      })
    }
    if (job.status === 'active' || job.status === 'rejected') {
      records.push({
        id: '4',
        action: job.status === 'active' ? 'approve' : 'reject',
        reviewer_name: job.approved_by_name || '管理员',
        review_note: job.review_note || (job.status === 'active' ? '信息完整，符合发布要求' : '不符合发布规范'),
        created_at: job.approved_at || '',
      })
    }
    if (job.status === 'closed') {
      records.push({
        id: '5',
        action: 'close',
        reviewer_name: job.closed_by_name || job.institution_name,
        review_note: job.closed_reason || '职位下架',
        created_at: job.closed_at || '',
      })
    }
    return records.filter(r => r.created_at)
  }

  const renderStatusBadge = () => {
    if (!job) return null
    const config = statusConfig[job.status] || statusConfig.pending
    const StatusIcon = config.icon

    let detailText = ''
    if (job.status === 'active') {
      detailText = `审核人: ${job.approved_by_name || '-'} · 审核时间: ${formatDate(job.approved_at)}`
    } else if (job.status === 'pending') {
      detailText = `AI风险分: ${job.ai_risk_score ?? '-'}/100 · 提交时间: ${formatDate(job.submitted_at || job.created_at)}`
    } else if (job.status === 'rejected') {
      detailText = `驳回原因: ${job.review_note || '-'} · 驳回时间: ${formatDate(job.approved_at)}`
    } else if (job.status === 'closed') {
      detailText = `下架原因: ${job.closed_reason || '-'} · 下架时间: ${formatDate(job.closed_at)}`
    }

    return (
      <div className="space-y-1">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-xs font-medium ${config.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </span>
        <div className="text-xs text-stone-500">{detailText}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-stone-500 py-20">加载中...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-stone-500 py-20">职位不存在</div>
      </div>
    )
  }

  const verifyBadge = getVerifyBadge(job.verified_level)
  const VerifyIcon = verifyBadge.icon
  const auditRecords = buildAuditRecords()

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-teal-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-heading text-2xl font-bold text-stone-800">{job.title}</h1>
                  <div className="relative">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded text-xs font-medium cursor-help ${verifyBadge.color}`}
                      onMouseEnter={() => setShowVerifyTooltip(true)}
                      onMouseLeave={() => setShowVerifyTooltip(false)}
                    >
                      <VerifyIcon className="w-3 h-3" /> {verifyBadge.label}
                      <HelpCircle className="w-3 h-3 opacity-60" />
                    </span>
                    {showVerifyTooltip && (
                      <div className="absolute left-0 top-full mt-1 w-64 p-3 bg-stone-800 text-white text-xs rounded-lg shadow-lg z-10">
                        <div className="font-medium mb-1">{verifyBadge.label}</div>
                        <div className="text-stone-300">{verifyBadge.desc}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm">{job.department}</span>
                  <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-sm">{job.required_title}</span>
                  <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-sm">{job.required_category}</span>
                </div>
                <div className="mt-4">{renderStatusBadge()}</div>
              </div>
              <span className="text-amber-600 font-bold text-2xl ml-4">{job.salary_min / 1000}K-{job.salary_max / 1000}K</span>
            </div>
            <div className="flex items-center gap-5 mt-4 text-sm text-stone-500">
              <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.institution_name}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.publishedAt}</span>
            </div>

            {(isInstitutionOwner || isAdmin) && (
              <div className="mt-4 pt-4 border-t border-stone-200 flex gap-2">
                {isInstitutionOwner && job.status === 'active' && (
                  <button onClick={() => setShowCloseModal(true)} className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors flex items-center gap-2">
                    <Ban className="w-4 h-4" /> 下架职位
                  </button>
                )}
                {isAdmin && job.status === 'pending' && (
                  <>
                    <button onClick={() => { setReviewNote(''); setShowReviewModal(true) }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> 通过
                    </button>
                    <button onClick={() => { setReviewNote(''); setShowReviewModal(true) }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> 驳回
                    </button>
                  </>
                )}
                <button onClick={() => setShowAuditModal(true)} className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors flex items-center gap-2 ml-auto">
                  <FileText className="w-4 h-4" /> 查看审核记录
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 mb-6">
            <h2 className="font-heading text-lg font-bold mb-3">岗位描述</h2>
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 mb-6">
            <h2 className="font-heading text-lg font-bold mb-3">任职要求</h2>
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">{job.requirements}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
            <h2 className="font-heading text-lg font-bold mb-4">相似职位</h2>
            <div className="grid grid-cols-3 gap-4">
              {similarJobs.map((sj) => (
                <Link key={sj.id} to={`/jobs/${sj.id}`} className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-stone-800">{sj.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs">{sj.department}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-stone-500">{sj.institution_name}</span>
                    <span className="text-amber-600 font-medium">{formatSalary(sj.salary_min, sj.salary_max)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="w-72 shrink-0">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h3 className="font-medium text-stone-800">{job.institution_name}</h3>
                <p className="text-sm text-stone-500">{job.institution_type}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-stone-600 mb-6">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-stone-400" />{job.location}</div>
              <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-stone-400" />{job.institution_type}</div>
              <div className="flex items-center gap-2"><Award className="w-4 h-4 text-stone-400" />三级甲等</div>
            </div>
            <button
              onClick={handleApply}
              disabled={applying || applied || job.status !== 'active'}
              className={`w-full h-11 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                applied
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : job.status !== 'active'
                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              <Send className="w-4 h-4" />
              {applied ? '已投递' : applying ? '投递中...' : job.status !== 'active' ? '不可投递' : '立即投递'}
            </button>
          </div>
        </div>
      </div>

      {showAuditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold">审核记录</h3>
              <button onClick={() => setShowAuditModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              {auditRecords.map((record, index) => {
                const actionConfig = actionLabelMap[record.action] || actionLabelMap.create
                const ActionIcon = actionConfig.icon
                return (
                  <div key={record.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${actionConfig.color}`}>
                        <ActionIcon className="w-4 h-4" />
                      </div>
                      {index < auditRecords.length - 1 && (
                        <div className="w-px h-full bg-stone-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-stone-800 text-sm">{actionConfig.label}</span>
                        <span className="text-xs text-stone-400">{formatDate(record.created_at)}</span>
                      </div>
                      <div className="text-xs text-stone-500 mt-1">操作人: {record.reviewer_name}</div>
                      {record.review_note && (
                        <div className="text-sm text-stone-600 mt-2 p-2.5 bg-stone-50 rounded-lg">{record.review_note}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowAuditModal(false)} className="w-full mt-4 py-2 border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">
              关闭
            </button>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold">下架职位</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-stone-600 mb-4">请填写下架原因，下架后职位将不再对外展示。</p>
            <textarea
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="请输入下架原因..."
              className="w-full h-28 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCloseJob}
                disabled={!closeReason.trim() || closing}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                {closing ? '下架中...' : '确认下架'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold">职位审核</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {job.ai_risk_score !== undefined && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-medium">AI风险评分: {job.ai_risk_score}/100</span>
                </div>
                <div className="mt-2 h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${job.ai_risk_score >= 50 ? 'bg-red-500' : job.ai_risk_score >= 30 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${job.ai_risk_score}%` }}
                  />
                </div>
              </div>
            )}
            <p className="text-sm text-stone-600 mb-2">审核备注</p>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="请输入审核意见..."
              className="w-full h-28 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleReview('rejected')}
                disabled={reviewing}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                驳回
              </button>
              <button
                onClick={() => handleReview('active')}
                disabled={reviewing}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
