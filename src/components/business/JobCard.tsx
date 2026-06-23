import { useState } from 'react'
import {
  ShieldCheck,
  AlertCircle,
  AlertOctagon,
  MapPin,
  Clock,
  Briefcase,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  EyeOff,
  FileText,
  FileCheck,
  Zap
} from 'lucide-react'
import type { Job, WorkHours } from '../../../shared/types'
import { cn } from '@/lib/utils'
import {
  formatSalary,
  getMatchScoreColor,
  getRiskLevelColor,
  getStatusLabel,
  formatWorkHours,
  formatWorkHoursStructured,
  matchMomNightShift,
  estimateCommute,
  checkQualifications,
  enhanceMatchReasons,
  formatDateTime,
} from '@/utils/helpers'
import Tag from '@/components/ui/Tag'
import { mockVerificationRecords } from '@/mock/data'

interface JobCardProps {
  job: Job
  companyVerification?: { status: string; riskLevel?: string }
  matchScore?: number
  matchReasons?: string[]
  userPreferences?: {
    commuteRadius: number
    workHours: WorkHours[]
    salaryMin?: number
    salaryMax?: number
    preferredCerts?: string[]
  }
  userCertNames?: string[]
  userAge?: number
  userLng?: number
  userLat?: number
  onApply?: () => void
  showApplyButton?: boolean
  showMatchDetails?: boolean
}

const getCompanyVerification = (companyId: string) => {
  const record = mockVerificationRecords.find(r => r.companyId === companyId)
  if (!record) return { status: 'pending_ocr', riskLevel: 'low' as const }
  return {
    status: record.status,
    riskLevel: record.riskData?.level || 'low',
  }
}

const getVerificationBadge = (status: string) => {
  switch (status) {
    case 'approved':
    case 'verified':
      return {
        icon: ShieldCheck,
        label: '已认证企业',
        bgClass: 'bg-success/10',
        textClass: 'text-success',
        borderClass: 'border-success/30',
      }
    case 'pending_ocr':
    case 'ocr_done':
    case 'scanning':
    case 'pending_review':
      return {
        icon: AlertCircle,
        label: '认证中',
        bgClass: 'bg-accent/10',
        textClass: 'text-accent',
        borderClass: 'border-accent/30',
      }
    case 'rejected':
    case 'risk_detected':
      return {
        icon: AlertOctagon,
        label: '认证失败',
        bgClass: 'bg-danger/10',
        textClass: 'text-danger',
        borderClass: 'border-danger/30',
      }
    default:
      return {
        icon: AlertCircle,
        label: '待认证',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-600',
        borderClass: 'border-gray-200',
      }
  }
}

const getRiskLevelLabel = (level?: string) => {
  const map: Record<string, string> = {
    none: '无风险',
    low: '低风险',
    medium: '中风险',
    high: '高风险',
  }
  return map[level || 'low'] || '低风险'
}

const getRiskBadgeClass = (level?: string) => {
  switch (level) {
    case 'none':
      return 'bg-success/10 text-success border-success/30'
    case 'low':
      return 'bg-info/10 text-info border-info/30'
    case 'medium':
      return 'bg-accent/10 text-accent border-accent/30 animate-pulse-slow'
    case 'high':
      return 'bg-danger/10 text-danger border-danger/30 animate-pulse-slow'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

const getReviewStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-success/10 text-success'
    case 'pending':
      return 'bg-accent/10 text-accent'
    case 'rejected':
      return 'bg-danger/10 text-danger'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const isCertRequirement = (req: string): boolean => {
  const certKeywords = ['健康证', '证书', '资格证', '执业证', '许可证', '上岗证', '安全员', '育婴师', '月嫂']
  return certKeywords.some(kw => req.includes(kw))
}

function MatchScoreRing({ score }: { score: number }) {
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const colorClass = getMatchScoreColor(score)

  return (
    <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-gray-200"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={cn('transition-all duration-500', colorClass)}
        />
      </svg>
      <div className={cn('absolute text-sm font-bold', colorClass)}>
        {score}
      </div>
    </div>
  )
}

export default function JobCard({
  job,
  companyVerification,
  matchScore,
  matchReasons: externalMatchReasons,
  userPreferences,
  userCertNames = [],
  userAge,
  userLng,
  userLat,
  onApply,
  showApplyButton = true,
  showMatchDetails = true,
}: JobCardProps) {
  const [showAllRequirements, setShowAllRequirements] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const verification = companyVerification || getCompanyVerification(job.companyId)
  const verificationBadge = getVerificationBadge(verification.status)
  const VerifyIcon = verificationBadge.icon

  const commute = estimateCommute(
    job.longitude,
    job.latitude,
    userLng,
    userLat,
    userPreferences?.commuteRadius || 10
  )

  const momShift = matchMomNightShift(job.workHours)
  const workHoursStructured = formatWorkHoursStructured(job.workHours)

  const qualifications = checkQualifications(
    job.requirements,
    userCertNames,
    userAge
  )

  const displayRequirements = showAllRequirements
    ? job.requirements
    : job.requirements.slice(0, 3)
  const hasMoreRequirements = job.requirements.length > 3

  const enhancedMatchReasons = userPreferences
    ? enhanceMatchReasons({
        jobSalaryMin: job.salaryMin,
        jobSalaryMax: job.salaryMax,
        jobSalaryType: job.salaryType,
        userSalaryMin: userPreferences.salaryMin,
        userSalaryMax: userPreferences.salaryMax,
        commute,
        radiusKm: userPreferences.commuteRadius,
        momShift,
        qualifications,
      })
    : externalMatchReasons || []

  const finalMatchReasons = externalMatchReasons && externalMatchReasons.length > 0
    ? externalMatchReasons
    : enhancedMatchReasons

  const verificationRecord = mockVerificationRecords.find(r => r.companyId === job.companyId)

  return (
    <>
      <div className="glass rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                  verificationBadge.bgClass,
                  verificationBadge.textClass,
                  verificationBadge.borderClass
                )}
              >
                <VerifyIcon className="h-3.5 w-3.5" />
                {verificationBadge.label}
              </span>

              {(verification.riskLevel === 'medium' || verification.riskLevel === 'high') && (
                <span className="relative">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                      getRiskBadgeClass(verification.riskLevel)
                    )}
                  >
                    {getRiskLevelLabel(verification.riskLevel)}
                  </span>
                </span>
              )}
              {(verification.riskLevel === 'none' || verification.riskLevel === 'low') && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                    getRiskBadgeClass(verification.riskLevel)
                  )}
                >
                  {getRiskLevelLabel(verification.riskLevel)}
                </span>
              )}

              <span
                className={cn(
                  'ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                  getReviewStatusBadge(job.reviewStatus)
                )}
              >
                岗位审核:{getStatusLabel(job.reviewStatus)}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xl font-bold text-gray-900">
                  {job.title}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <Briefcase className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{job.companyName}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-accent whitespace-nowrap">
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryType)}
                </div>
              </div>
            </div>
          </div>

          {matchScore !== undefined && (
            <MatchScoreRing score={matchScore} />
          )}
        </div>

        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Zap className="h-4 w-4 text-accent" />
            任职条件（透明展示）
          </div>
          <div className="flex flex-wrap gap-2">
            {displayRequirements.map((req, idx) => {
              const isCert = isCertRequirement(req)
              const isSatisfied = qualifications.satisfied.includes(req)
              const certInfo = qualifications.certRequirements.find(c => c.name === req)

              return (
                <span
                  key={idx}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                    isCert
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : isSatisfied
                        ? 'border-success/20 bg-success/5 text-success'
                        : 'border-gray-200 bg-white text-gray-700'
                  )}
                >
                  {isCert ? (
                    <span className="text-sm">🔰</span>
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  {req}
                  {certInfo && !certInfo.hasCert && (
                    <X className="h-3 w-3 text-danger" />
                  )}
                </span>
              )
            })}
          </div>
          {hasMoreRequirements && (
            <button
              onClick={() => setShowAllRequirements(!showAllRequirements)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-accent transition-colors"
            >
              <span className="border-b border-dashed border-current">
                {showAllRequirements ? '收起' : `查看全部要求(${job.requirements.length}项)`}
              </span>
              {showAllRequirements ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div
            className={cn(
              'rounded-xl border p-4 transition-all',
              commute.withinRadius
                ? 'border-success/20 bg-success/5'
                : 'border-accent/20 bg-accent/5'
            )}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <MapPin className="h-4 w-4 text-info" />
              通勤匹配
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {commute.displayWithMode}
              </span>
              {commute.withinRadius ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                  <Check className="h-3 w-3" />
                  半径内
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                  <AlertCircle className="h-3 w-3" />
                  超出
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {job.location.length > 20 ? job.location.slice(0, 20) + '...' : job.location}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-orange-50/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Clock className="h-4 w-4 text-accent" />
              时段匹配
            </div>
            <div className="mt-2 space-y-1">
              {momShift.matched && (
                <div className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                  <span>🌙</span>
                  宝妈时段匹配{momShift.coverageHours}h·{momShift.coveragePercent >= 100 ? '完全覆盖' : `${momShift.coveragePercent}%覆盖`}
                </div>
              )}
              {!momShift.matched && momShift.coverageHours > 0 && (
                <div className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                  <span>🌙</span>
                  部分覆盖{momShift.coverageHours}h
                </div>
              )}
              <div className="text-sm text-gray-600">
                {formatWorkHours(job.workHours)}
              </div>
              {showMatchDetails && workHoursStructured.details.length > 0 && (
                <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                  {workHoursStructured.details.slice(0, 2).map((d, i) => (
                    <div key={i}>
                      {d.dayName}{' '}
                      {d.shifts.map(s => `${s.startTime}-${s.endTime}`).join('、')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {job.benefits && job.benefits.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <span>🏷</span>
              福利标签
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.benefits.map((benefit, idx) => (
                <Tag key={idx} label={benefit} color={idx % 3 === 0 ? 'green' : idx % 3 === 1 ? 'blue' : 'orange'} />
              ))}
            </div>
          </div>
        )}

        {showMatchDetails && finalMatchReasons.length > 0 && (
          <div className="mt-4 rounded-xl border border-success/20 bg-gradient-to-br from-success/5 to-info/5 p-4">
            <div className="mb-2 text-xs font-semibold text-success">
              匹配详情分析
            </div>
            <ul className="space-y-1">
              {finalMatchReasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-success" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={() => setShowVerificationModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-info/30 hover:bg-info/5 hover:text-info"
          >
            <FileCheck className="h-3.5 w-3.5" />
            查看企业核验报告
          </button>

          <button
            onClick={() => setShowReviewModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-success/30 hover:bg-success/5 hover:text-success"
          >
            <FileText className="h-3.5 w-3.5" />
            查看岗位审核详情
          </button>

          {showApplyButton && onApply && (
            <button
              onClick={onApply}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-accent/90 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-accent/20 transition-all hover:shadow-lg hover:shadow-accent/30 hover:brightness-105 active:scale-95"
            >
              <EyeOff className="h-4 w-4" />
              立即投递 · 脱敏
            </button>
          )}
        </div>
      </div>

      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowVerificationModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">企业核验报告</h3>
              <button onClick={() => setShowVerificationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <VerifyIcon className={cn('h-5 w-5', verificationBadge.textClass)} />
                  <span className={cn('font-semibold', verificationBadge.textClass)}>
                    {verificationBadge.label}
                  </span>
                  <span className={cn('ml-auto rounded-full border px-2 py-0.5 text-xs font-medium', getRiskBadgeClass(verification.riskLevel))}>
                    {getRiskLevelLabel(verification.riskLevel)}
                  </span>
                </div>
                {verificationRecord && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">企业名称</span>
                      <span className="font-medium text-gray-800">{verificationRecord.ocrData?.companyName || job.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">统一社会信用代码</span>
                      <span className="font-medium text-gray-800">{verificationRecord.ocrData?.licenseNo || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">OCR识别置信度</span>
                      <span className="font-medium text-success">{verificationRecord.ocrData?.confidence ? Math.round(verificationRecord.ocrData.confidence * 100) + '%' : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">注册资本</span>
                      <span className="font-medium text-gray-800">{verificationRecord.ocrData?.registeredCapital || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">成立日期</span>
                      <span className="font-medium text-gray-800">{verificationRecord.ocrData?.establishmentDate || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">法定代表人</span>
                      <span className="font-medium text-gray-800">{verificationRecord.ocrData?.legalPerson || '-'}</span>
                    </div>
                  </div>
                )}
              </div>

              {verificationRecord?.riskData && (
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="mb-3 text-sm font-semibold text-gray-800">风险扫描摘要</div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <div className="text-lg font-bold text-gray-800">{verificationRecord.riskData.lawsuitCount}</div>
                      <div className="text-xs text-gray-500">诉讼</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <div className="text-lg font-bold text-gray-800">{verificationRecord.riskData.executionCount}</div>
                      <div className="text-xs text-gray-500">执行</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <div className="text-lg font-bold text-gray-800">{verificationRecord.riskData.dishonestCount}</div>
                      <div className="text-xs text-gray-500">失信</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <div className="text-lg font-bold text-gray-800">{verificationRecord.riskData.administrativePenaltyCount}</div>
                      <div className="text-xs text-gray-500">行政处罚</div>
                    </div>
                  </div>
                  {verificationRecord.riskData.details.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-medium text-gray-600">风险明细：</div>
                      {verificationRecord.riskData.details.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="rounded-lg bg-danger/5 p-2 text-xs">
                          <div className="font-medium text-danger">{item.title}</div>
                          <div className="mt-0.5 text-gray-500">{item.date} · {item.status} {item.amount ? `· ${item.amount}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                提交时间：{verificationRecord ? formatDateTime(verificationRecord.submittedAt) : '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowReviewModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">岗位审核详情</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">岗位名称</span>
                  <span className="font-semibold text-gray-800">{job.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">所属企业</span>
                  <span className="font-medium text-gray-700">{job.companyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">审核状态</span>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-medium', getReviewStatusBadge(job.reviewStatus))}>
                    {getStatusLabel(job.reviewStatus)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">审核员</span>
                  <span className="font-medium text-gray-700">王管理（AI辅助）</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">AI风险评分</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full w-1/6 rounded-full bg-success"></div>
                    </div>
                    <span className="text-sm font-semibold text-success">低风险</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">发布时间</span>
                  <span className="text-sm text-gray-700">{formatDateTime(job.createdAt)}</span>
                </div>
              </div>
              <div className="rounded-lg bg-success/5 border border-success/20 p-3">
                <div className="text-xs font-semibold text-success mb-1">✓ 审核通过要点</div>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>· 企业资质已通过核验</li>
                  <li>· 岗位信息真实完整</li>
                  <li>· 薪资符合行业标准</li>
                  <li>· 未检测到违规关键词</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
