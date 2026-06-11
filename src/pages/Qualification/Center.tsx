import { useState } from 'react'
import {
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  Star,
  MapPin,
  Plus,
  X,
  AlertTriangle,
  ShieldCheck,
  GraduationCap,
  TrendingUp,
  Building2,
  FileCheck,
  User,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import { formatDate, caseTypeMap } from '@/utils/format'
import type { Lawyer, LegalCaseType } from '@/types'

interface CircleProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
}

function CircleProgress({ value, max, size = 120, strokeWidth = 10 }: CircleProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / max, 1)
  const offset = circumference * (1 - progress)

  const getColor = () => {
    if (progress >= 1) return '#10b981'
    if (progress >= 0.6) return '#3b82f6'
    if (progress >= 0.3) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        <span className="text-xs text-slate-500">/ {max} 学分</span>
      </div>
    </div>
  )
}

interface TimelineItemProps {
  icon: React.ElementType
  title: string
  date: string
  description: string
  isLast?: boolean
}

function TimelineItem({ icon: Icon, title, date, description, isLast }: TimelineItemProps) {
  return (
    <div className="relative pl-8">
      {!isLast && <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-slate-200" />}
      <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
        <Icon className="h-3 w-3 text-blue-600" />
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-slate-900">{title}</h4>
          <span className="text-xs text-slate-400">{date}</span>
        </div>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}

export default function QualificationCenter() {
  const { currentUser } = useAuthStore()
  const lawyer = currentUser as Lawyer
  const isLawyer = currentUser?.role === 'lawyer'

  const [showAddExpertise, setShowAddExpertise] = useState(false)
  const [newExpertise, setNewExpertise] = useState<LegalCaseType | ''>('')

  const availableExpertise = Object.entries(caseTypeMap).filter(
    ([key]) => !lawyer?.expertise.includes(key as LegalCaseType)
  ) as [LegalCaseType, string][]

  const handleAddExpertise = () => {
    if (!newExpertise) return
    console.log('Adding expertise:', newExpertise)
    setNewExpertise('')
    setShowAddExpertise(false)
  }

  const handleRemoveExpertise = (type: LegalCaseType) => {
    console.log('Removing expertise:', type)
  }

  const getCreditRating = (score: number): { grade: string; color: string; bgColor: string } => {
    if (score >= 950) return { grade: 'A+', color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
    if (score >= 900) return { grade: 'A', color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
    if (score >= 850) return { grade: 'B+', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (score >= 800) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (score >= 700) return { grade: 'C+', color: 'text-amber-600', bgColor: 'bg-amber-100' }
    return { grade: 'C', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const creditRating = lawyer ? getCreditRating(lawyer.creditScore) : null

  const hasZeroResponseWarning = lawyer && lawyer.responseRate < 60

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">资质中心</h1>
          <p className="text-slate-500 mt-1">管理您的执业资质和专业信息</p>
        </div>

        {hasZeroResponseWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">零响应警告</p>
              <p className="text-sm text-red-700">
                您的响应率为 {lawyer.responseRate}%，低于60%阈值。请及时处理用户咨询，
                否则将影响您的信用评级和抢单权限。
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">资质档案</h2>
                {lawyer?.licenseVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    司法部API已核验
                  </span>
                )}
              </div>

              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                  {lawyer?.avatar && (
                    <img src={lawyer.avatar} alt={lawyer.realName} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-slate-900">{lawyer?.realName}</h3>
                    {creditRating && (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold',
                          creditRating.bgColor,
                          creditRating.color
                        )}
                      >
                        <Star className="h-3 w-3 mr-0.5 fill-current" />
                        {creditRating.grade}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm mb-3">{lawyer?.lawFirm}</p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <User className="h-4 w-4" />
                      {lawyer?.practiceYears} 年执业经验
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <FileCheck className="h-4 w-4" />
                      {lawyer?.completedCases} 件已结案
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      {lawyer?.avgRating} 平均评分
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">执业证号</p>
                  <p className="font-mono text-sm text-slate-900">{lawyer?.licenseNumber}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">发证机关</p>
                  <p className="text-sm text-slate-900">北京市司法局</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">执业年限</p>
                  <p className="text-sm text-slate-900">{lawyer?.practiceYears} 年</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">执业地区</p>
                  <div className="flex flex-wrap items-center gap-1">
                    {lawyer?.regions.map((region) => (
                      <span
                        key={region}
                        className="inline-flex items-center gap-0.5 text-sm text-slate-700"
                      >
                        <MapPin className="h-3 w-3" />
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-slate-900">专业专长</p>
                  <button
                    onClick={() => setShowAddExpertise(true)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lawyer?.expertise.map((exp) => (
                    <span
                      key={exp}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
                    >
                      {caseTypeMap[exp]}
                      <button
                        onClick={() => handleRemoveExpertise(exp)}
                        className="hover:text-blue-900 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {showAddExpertise && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    className="flex gap-2"
                  >
                    <select
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value as LegalCaseType)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">选择专长领域</option>
                      {availableExpertise.map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddExpertise}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      添加
                    </button>
                    <button
                      onClick={() => setShowAddExpertise(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      取消
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">资质时间线</h2>
              <div>
                <TimelineItem
                  icon={ShieldCheck}
                  title="首次注册"
                  date={lawyer ? formatDate(lawyer.createdAt) : ''}
                  description="完成平台账号注册，提交基本信息"
                />
                <TimelineItem
                  icon={Award}
                  title="首次核验通过"
                  date={lawyer ? formatDate(lawyer.createdAt + 86400000) : ''}
                  description="司法部执业证信息核验通过，正式入驻平台"
                />
                <TimelineItem
                  icon={GraduationCap}
                  title="最近继续教育"
                  date="2026-03-15"
                  description="完成《民法典》最新司法解释培训，获得8学分"
                />
                <TimelineItem
                  icon={TrendingUp}
                  title="信用评分提升"
                  date="2026-05-20"
                  description="信用评分提升至A级，获得优先抢单权限"
                  isLast
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">继续教育学分</h3>
                <GraduationCap className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex flex-col items-center">
                <CircleProgress value={lawyer?.continuingEducationCredits || 0} max={40} />
                <p className="text-sm text-slate-500 mt-4">年度目标：40学分</p>
                <p className="text-xs text-slate-400 mt-1">
                  {lawyer?.continuingEducationCredits
                    ? lawyer.continuingEducationCredits >= 40
                      ? '已完成年度目标'
                      : `还差 ${40 - lawyer.continuingEducationCredits} 学分`
                    : ''}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">信用评级</h3>
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-center">
                {creditRating && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      'w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-3',
                      creditRating.bgColor
                    )}
                  >
                    <span className={cn('text-3xl font-bold', creditRating.color)}>
                      {creditRating.grade}
                    </span>
                  </motion.div>
                )}
                <p className="text-2xl font-bold text-slate-900">{lawyer?.creditScore}</p>
                <p className="text-sm text-slate-500 mt-1">信用分 (满分1000)</p>
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">响应率</span>
                    <span className={cn(
                      'font-medium',
                      (lawyer?.responseRate || 0) >= 90 ? 'text-emerald-600' :
                      (lawyer?.responseRate || 0) >= 70 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {lawyer?.responseRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">用户评分</span>
                    <span className="font-medium text-slate-900">{lawyer?.avgRating} / 5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">完成率</span>
                    <span className="font-medium text-emerald-600">
                      {lawyer
                        ? Math.round((lawyer.completedCases / (lawyer.totalCases || 1)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">执业数据</h3>
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">累计接案</p>
                    <p className="text-xl font-bold text-slate-900">{lawyer?.totalCases || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">已结案</p>
                    <p className="text-xl font-bold text-emerald-600">{lawyer?.completedCases || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">执业时间</p>
                    <p className="text-xl font-bold text-slate-900">{lawyer?.practiceYears || 0} 年</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">最后活跃</p>
                    <p className="text-sm font-medium text-slate-900">
                      {lawyer ? formatDate(lawyer.lastActiveAt) : ''}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
