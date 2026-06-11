import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  User,
  Gavel,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Send,
  MessageSquare,
  Scale,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { mockApi } from '@/mock/api'
import { useAuthStore } from '@/store/useAuthStore'
import { formatDate, formatDateTime } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { Appeal, AppealStatus, User as UserType, Lawyer } from '@/types'

type TabType = 'pending' | 'processing' | 'resolved'

const tabConfig: Record<TabType, { label: string; status: AppealStatus[] }> = {
  pending: { label: '待处理', status: ['pending'] },
  processing: { label: '处理中', status: ['accepted'] },
  resolved: { label: '已裁决', status: ['rejected', 'resolved'] },
}

const statusMap: Record<AppealStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-amber-100 text-amber-700' },
  accepted: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  rejected: { label: '已驳回', color: 'bg-slate-100 text-slate-600' },
  resolved: { label: '已裁决', color: 'bg-green-100 text-green-700' },
}

interface AppealWithDetails extends Appeal {
  appellant?: UserType
  respondent?: Lawyer
  consultationTitle?: string
}

export default function Arbitrate() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [appeals, setAppeals] = useState<AppealWithDetails[]>([])
  const [selectedAppeal, setSelectedAppeal] = useState<AppealWithDetails | null>(null)
  const [arbitrationResult, setArbitrationResult] = useState('')

  useEffect(() => {
    loadAppeals()
  }, [])

  const loadAppeals = async () => {
    setLoading(true)
    try {
      const allAppeals = await mockApi.getMonitoringStats().then(() => {
        return import('@/mock/data').then((m) => m.appeals)
      })

      const appealsWithDetails: AppealWithDetails[] = []
      for (const appeal of allAppeals) {
        const [appellant, respondent, consultation] = await Promise.all([
          mockApi.getUserInfo(appeal.appellantId),
          mockApi.getUserInfo(appeal.respondentId),
          mockApi.getConsultationDetail(appeal.consultationId),
        ])
        appealsWithDetails.push({
          ...appeal,
          appellant: appellant as UserType,
          respondent: respondent as Lawyer,
          consultationTitle: consultation?.title,
        })
      }
      setAppeals(appealsWithDetails)
    } catch (error) {
      console.error('加载申诉列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppeals = appeals.filter((a) =>
    tabConfig[activeTab].status.includes(a.status)
  )

  const handleResolve = async (accepted: boolean) => {
    if (!selectedAppeal || !currentUser || !arbitrationResult.trim()) return

    setSubmitting(true)
    try {
      await mockApi.resolveAppeal({
        appealId: selectedAppeal.id,
        arbitratorId: currentUser.id,
        arbitrationResult: arbitrationResult.trim(),
        accepted,
      })

      if (accepted && selectedAppeal.respondent) {
        const lawyer = selectedAppeal.respondent
        const newCreditScore = Math.max(0, lawyer.creditScore - 50)
        console.log(`律师 ${lawyer.realName} 信用分从 ${lawyer.creditScore} 扣除至 ${newCreditScore}`)
      }

      await loadAppeals()
      setSelectedAppeal(null)
      setArbitrationResult('')
    } catch (error) {
      console.error('处理申诉失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestMoreInfo = async () => {
    if (!selectedAppeal || !currentUser || !arbitrationResult.trim()) return

    setSubmitting(true)
    try {
      console.log('要求补充材料:', {
        appealId: selectedAppeal.id,
        arbitratorId: currentUser.id,
        message: arbitrationResult.trim(),
      })
      alert('已通知双方补充材料')
      setSelectedAppeal(null)
      setArbitrationResult('')
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (selectedAppeal) {
    const statusInfo = statusMap[selectedAppeal.status]
    const isResolved = selectedAppeal.status === 'resolved' || selectedAppeal.status === 'rejected'

    return (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelectedAppeal(null)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">申诉详情</h1>
            <span className={cn('px-3 py-1 rounded-full text-xs font-medium', statusInfo.color)}>
              {statusInfo.label}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  申诉详情
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">相关案件</p>
                    <p className="text-slate-700">{selectedAppeal.consultationTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">申诉类型</p>
                    <p className="text-slate-700">{selectedAppeal.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">申诉内容</p>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-700 leading-relaxed">{selectedAppeal.description}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-2">证据材料</p>
                    {selectedAppeal.evidences.length > 0 ? (
                      <div className="grid grid-cols-4 gap-3">
                        {selectedAppeal.evidences.map((ev) => (
                          <div key={ev.id} className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                            <img src={ev.fileUrl} alt={ev.fileName} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">无证据材料</p>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    提交时间：{formatDateTime(selectedAppeal.createdAt)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  律师申辩
                </h2>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-slate-600 leading-relaxed">
                    （模拟申辩内容）律师认为自己已经按照规定提供了法律服务，不存在违规行为。
                    咨询过程中由于临时有紧急案件需要处理，导致回复稍有延迟，但已经在后续时间
                    内及时跟进并完成了咨询服务。
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  申辩时间：{formatDateTime(selectedAppeal.createdAt + 3600000)}
                </p>
              </div>

              {!isResolved && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-purple-500" />
                    仲裁裁决
                  </h2>
                  <textarea
                    value={arbitrationResult}
                    onChange={(e) => setArbitrationResult(e.target.value)}
                    placeholder="请输入仲裁裁决意见..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={() => handleResolve(false)}
                      disabled={!arbitrationResult.trim() || submitting}
                      className={cn(
                        'flex-1 min-w-[120px] py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                        arbitrationResult.trim() && !submitting
                          ? 'bg-slate-600 text-white hover:bg-slate-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      )}
                    >
                      <XCircle className="h-4 w-4" />
                      驳回申诉
                    </button>
                    <button
                      onClick={() => handleRequestMoreInfo()}
                      disabled={!arbitrationResult.trim() || submitting}
                      className={cn(
                        'flex-1 min-w-[120px] py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                        arbitrationResult.trim() && !submitting
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      )}
                    >
                      <AlertCircle className="h-4 w-4" />
                      要求补充材料
                    </button>
                    <button
                      onClick={() => handleResolve(true)}
                      disabled={!arbitrationResult.trim() || submitting}
                      className={cn(
                        'flex-1 min-w-[120px] py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                        arbitrationResult.trim() && !submitting
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      )}
                    >
                      <CheckCircle className="h-4 w-4" />
                      支持申诉
                    </button>
                  </div>
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-700">
                      <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                      注意：支持申诉将扣除律师信用分 50 分，可能影响律师的服务资格。
                    </p>
                  </div>
                </div>
              )}

              {isResolved && selectedAppeal.arbitrationResult && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-purple-500" />
                    裁决结果
                  </h2>
                  <div className={cn(
                    'rounded-xl p-4',
                    selectedAppeal.status === 'resolved' ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'
                  )}>
                    <p className="text-slate-700 leading-relaxed">{selectedAppeal.arbitrationResult}</p>
                  </div>
                  {selectedAppeal.status === 'resolved' && selectedAppeal.respondent && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-xs text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                        已扣除律师 {selectedAppeal.respondent.realName} 信用分 50 分
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-3">
                    裁决时间：{formatDateTime(selectedAppeal.resolvedAt || Date.now())}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-medium text-slate-700 mb-4">申诉人</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {selectedAppeal.appellant?.nickname || '未知用户'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedAppeal.appellant?.phone || ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-medium text-slate-700 mb-4">被申诉律师</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Gavel className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {selectedAppeal.respondent?.realName || '未知律师'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedAppeal.respondent?.lawFirm || ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        信用分：{selectedAppeal.respondent?.creditScore || 0}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {selectedAppeal.respondent?.practiceYears || 0}年执业
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  仲裁规则
                </h3>
                <ul className="space-y-2 text-xs text-slate-500">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    仲裁裁决为最终裁决，双方均需遵守
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    支持申诉将扣除律师 50 信用分
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    信用分低于 800 分将限制接单
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    恶意申诉将影响用户信用评级
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    )
  }

  return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-slate-800">仲裁处理</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="flex border-b border-slate-100">
            {(Object.keys(tabConfig) as TabType[]).map((tab) => {
              const count = appeals.filter((a) => tabConfig[tab].status.includes(a.status)).length
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-4 text-sm font-medium transition-colors relative',
                    activeTab === tab
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tabConfig[tab].label}
                  <span className={cn(
                    'ml-2 px-2 py-0.5 rounded-full text-xs',
                    activeTab === tab ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                  )}>
                    {count}
                  </span>
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : filteredAppeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm">
            <Scale className="h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500">暂无{tabConfig[activeTab].label}的申诉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppeals.map((appeal) => {
              const statusInfo = statusMap[appeal.status]
              return (
                <div
                  key={appeal.id}
                  onClick={() => setSelectedAppeal(appeal)}
                  className="bg-white rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(appeal.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-slate-800 mb-2">
                        {appeal.consultationTitle}
                      </h3>
                      <p className="text-sm text-slate-500 mb-3">
                        申诉类型：{appeal.reason}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <span className="text-slate-600">
                            申诉人：{appeal.appellant?.nickname || '未知'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gavel className="h-4 w-4 text-orange-500" />
                          <span className="text-slate-600">
                            被申诉：{appeal.respondent?.realName || '未知'}律师
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <ChevronLeft className="h-5 w-5 text-slate-300 rotate-180" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
  )
}
