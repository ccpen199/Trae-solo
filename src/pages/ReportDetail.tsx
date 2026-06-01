import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  User,
  Pill,
  Activity,
  FileText,
  Edit2,
  Send,
  RotateCcw,
  FileCheck,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import type { Report, ProcessLog, Assessment, ReportStatus, FinalLevel, Severity } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { api } from '@/utils/request'

const statusLabels: Record<ReportStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  reviewing: '审核中',
  returned: '已退回',
  reported: '已上报',
  receipt: '已回执',
  archived: '已归档',
}

const statusColors: Record<ReportStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-primary-100 text-primary-600',
  reviewing: 'bg-warning-100 text-warning-600',
  returned: 'bg-danger-100 text-danger-600',
  reported: 'bg-purple-100 text-purple-600',
  receipt: 'bg-success-100 text-success-600',
  archived: 'bg-gray-100 text-gray-600',
}

const severityLabels: Record<Severity, string> = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
  'life-threatening': '危及生命',
  fatal: '致死',
}

const finalLevelLabels: Record<FinalLevel, string> = {
  definite: '肯定',
  probable: '很可能',
  possible: '可能',
  unlikely: '不太可能',
}

const finalLevelColors: Record<FinalLevel, string> = {
  definite: 'bg-danger-100 text-danger-600',
  probable: 'bg-warning-100 text-warning-600',
  possible: 'bg-primary-100 text-primary-600',
  unlikely: 'bg-gray-100 text-gray-600',
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentRole, userInfo, permissions } = useAppStore()

  const [report, setReport] = useState<Report | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [processLogs, setProcessLogs] = useState<ProcessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [remark, setRemark] = useState('')
  const [showRemarkModal, setShowRemarkModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const loadData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [reportRes, assessRes, logsRes] = await Promise.all([
        api.get<{ data: Report }>(`/reports/${id}`),
        api.get<{ data: Assessment[] }>(`/assessments/report/${id}`),
        api.get<{ data: ProcessLog[] }>(`/logs/report/${id}`),
      ])
      setReport((reportRes as any).data || null)
      setAssessments((assessRes as any).data || [])
      setProcessLogs((logsRes as any).data || [])
    } catch (err) {
      console.error('加载报告详情失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleAction = async (action: string) => {
    if (!report) return

    const actionConfirm: Record<string, string> = {
      submit: '确定要提交这份初报吗？\n\n提交后将进入质控复核流程，您将无法再编辑内容。',
      review: '确定要开始质控复核吗？\n\n请确认资料完整后开始审核。',
      return: '确定要退回这份报告吗？\n\n退回后需要医生补充完善信息。',
      report: '确定要正式上报至监管部门吗？\n\n此操作将同步至国家药品不良反应监测系统。',
      receipt: '确定要标记为监管回执已接收吗？',
    }

    const remarks: Record<string, string> = {
      submit: '提交初报，等待质控复核',
      review: '开始质控复核',
      return: '资料不完整，退回补充',
      report: '正式上报至监管部门',
      receipt: '监管回执已接收',
    }

    const needRemark = action === 'return' || action === 'receipt'

    if (needRemark) {
      setPendingAction(action)
      setRemark(remarks[action])
      setShowRemarkModal(true)
      return
    }

    if (!confirm(actionConfirm[action] || '确定执行此操作？')) {
      return
    }

    await executeAction(action, remarks[action])
  }

  const executeAction = async (action: string, remarkText: string) => {
    if (!report) return

    const actionToEndpoint: Record<string, string> = {
      submit: 'submit',
      review: 'review',
      return: 'return',
      report: 'report',
      receipt: 'receipt',
    }

    try {
      setActionLoading(action)
      const endpoint = actionToEndpoint[action]
      await api.post(`/reports/${report.id}/${endpoint}`, {
        operator: userInfo.name,
        remark: remarkText,
      })
      alert('操作成功')
      setShowRemarkModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmRemark = () => {
    if (pendingAction) {
      executeAction(pendingAction, remark)
    }
  }

  const getActions = () => {
    if (!report) return []
    const actions: {
      icon: any
      label: string
      onClick: () => void
      variant: string
      disabled?: boolean
    }[] = []

    if ((report.status === 'draft' || report.status === 'returned') && permissions.canCreateReport) {
      actions.push({
        icon: Edit2,
        label: '编辑',
        onClick: () => navigate(`/reports/${id}/edit`),
        variant: 'secondary',
      })
      actions.push({
        icon: Send,
        label: '提交初报',
        onClick: () => handleAction('submit'),
        variant: 'primary',
      })
    }

    if (report.status === 'submitted' && permissions.canAssessReport) {
      actions.push({
        icon: FileCheck,
        label: '质控复核',
        onClick: () => handleAction('review'),
        variant: 'primary',
      })
    }

    if (report.status === 'reviewing' && permissions.canAssessReport) {
      actions.push({
        icon: FileCheck,
        label: '因果评价',
        onClick: () => navigate(`/reports/${id}/assess`),
        variant: 'primary',
      })
      actions.push({
        icon: RotateCcw,
        label: '退回补充',
        onClick: () => handleAction('return'),
        variant: 'danger',
      })
      actions.push({
        icon: Send,
        label: '正式上报',
        onClick: () => handleAction('report'),
        variant: 'warning',
      })
    }

    if (report.status === 'reported' && currentRole === 'regulator') {
      actions.push({
        icon: FileCheck,
        label: '监管回执',
        onClick: () => handleAction('receipt'),
        variant: 'success',
      })
    }

    if (report.status === 'returned' && permissions.canCreateReport) {
      actions.push({
        icon: Edit2,
        label: '修改补充',
        onClick: () => navigate(`/reports/${id}/edit`),
        variant: 'warning',
      })
      actions.push({
        icon: Send,
        label: '重新提交',
        onClick: () => handleAction('submit'),
        variant: 'primary',
      })
    }

    return actions
  }

  const getStatusStep = (status: ReportStatus): number => {
    const steps: ReportStatus[] = ['draft', 'submitted', 'reviewing', 'reported', 'receipt']
    if (status === 'returned') return 1
    return steps.indexOf(status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-gray-300" />
        <div className="text-gray-400">报告不存在或已被删除</div>
        <button onClick={() => navigate('/reports')} className="btn-primary">
          返回列表
        </button>
      </div>
    )
  }

  const currentStep = getStatusStep(report.status)
  const workflowSteps = [
    { key: 'draft', label: '创建草稿', icon: FileText },
    { key: 'submitted', label: '提交初报', icon: Send },
    { key: 'reviewing', label: '质控复核', icon: FileCheck },
    { key: 'reported', label: '正式上报', icon: Send },
    { key: 'receipt', label: '监管回执', icon: CheckCircle },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/reports')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-800">报告详情</h1>
          <p className="text-sm text-gray-500">{report.reportNo}</p>
        </div>
        <span className={`badge ${statusColors[report.status]} px-3 py-1 text-sm`}>
          {statusLabels[report.status]}
        </span>
        {getActions().map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            disabled={actionLoading === action.label}
            className={`flex items-center gap-2 ${
              action.variant === 'primary'
                ? 'btn-primary'
                : action.variant === 'danger'
                ? 'btn-danger'
                : action.variant === 'warning'
                ? 'bg-warning-500 text-white hover:bg-warning-600 btn'
                : action.variant === 'success'
                ? 'btn-success'
                : 'btn-secondary'
            } ${actionLoading === action.label ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <action.icon className="w-4 h-4" />
            {actionLoading === action.label ? '处理中...' : action.label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-6">处理进度</h2>
        <div className="flex items-start justify-between">
          {workflowSteps.map((step, idx) => {
            const stepNum = getStatusStep(step.key as ReportStatus)
            const isCompleted = currentStep >= 0 && stepNum <= currentStep
            const isCurrent = step.key === report.status || (report.status === 'returned' && step.key === 'submitted')
            const StepIcon = step.icon

            return (
              <div key={step.key} className="flex flex-col items-center flex-1 relative">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                    isCurrent
                      ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                      : isCompleted
                      ? 'bg-success-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted && !isCurrent ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <p
                  className={`text-sm mt-2 font-medium text-center ${
                    isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                {idx < workflowSteps.length - 1 && (
                  <div
                    className={`absolute top-6 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                      stepNum < currentStep ? 'bg-success-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold">患者信息</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">姓名</p>
                <p className="font-medium">{report.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">性别</p>
                <p className="font-medium">{report.patientGender === 'male' ? '男' : '女'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">年龄</p>
                <p className="font-medium">{report.patientAge} 岁</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">患者ID</p>
                <p className="font-medium font-mono">{report.patientId}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold">用药信息</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">药品名称</p>
                <p className="font-medium">{report.drugName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">用法用量</p>
                <p className="font-medium">{report.dosage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">给药途径</p>
                <p className="font-medium">{report.route}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">开始用药日期</p>
                <p className="font-medium">{report.startDate}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-danger-500" />
              <h2 className="text-lg font-semibold">不良反应</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">反应开始时间</p>
                  <p className="font-medium">{report.reactionStart}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">严重程度</p>
                  <span
                    className={`badge ${
                      report.severity === 'mild'
                        ? 'bg-success-100 text-success-600'
                        : report.severity === 'moderate'
                        ? 'bg-warning-100 text-warning-600'
                        : 'bg-danger-100 text-danger-600'
                    }`}
                  >
                    {severityLabels[report.severity]}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">不良反应描述</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{report.reaction}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-success-500" />
              <h2 className="text-lg font-semibold">处理结果</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">处理措施</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{report.treatment}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">转归情况</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{report.outcome}</p>
              </div>
            </div>
          </div>

          {assessments.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-4">因果评价历史</h2>
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">
                      评价人：{assessment.assessedBy} · {assessment.assessedAt}
                    </span>
                    <span className={`badge ${finalLevelColors[assessment.finalLevel]}`}>
                      {finalLevelLabels[assessment.finalLevel]}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">时间关联</p>
                      <p className="font-bold text-primary-600">{assessment.temporalRelation}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">停药改善</p>
                      <p className="font-bold text-primary-600">{assessment.withdrawalImprovement}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">再激发</p>
                      <p className="font-bold text-primary-600">{assessment.rechallengeReaction}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">合并用药</p>
                      <p className="font-bold text-primary-600">{assessment.concomitantMedication}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">严重程度</p>
                      <p className="font-bold text-primary-600">{assessment.severityLevel}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <span className="font-medium">评价意见：</span>
                    {assessment.remark}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold">流程时间线</h2>
            </div>
            <div className="relative">
              {processLogs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无流程记录</p>
              ) : (
                processLogs.map((log, index) => (
                  <div key={log.id} className="flex gap-4 mb-6 last:mb-0">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          log.toStatus === 'receipt'
                            ? 'bg-success-500'
                            : log.toStatus === 'returned'
                            ? 'bg-danger-500'
                            : 'bg-primary-500'
                        }`}
                      />
                      {index < processLogs.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 absolute top-3" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {statusLabels[log.toStatus as ReportStatus]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {log.operateAt} · {log.operator}
                      </p>
                      {log.remark && (
                        <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded p-2">{log.remark}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">创建人</span>
                <span className="font-medium">{report.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间</span>
                <span>{report.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">更新时间</span>
                <span>{report.updatedAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRemarkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">
                {pendingAction === 'return' ? '退回补充' : '监管回执'}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {pendingAction === 'return' ? '退回原因' : '回执编号/说明'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder={
                    pendingAction === 'return'
                      ? '请详细说明需要补充的内容...'
                      : '请填写监管回执编号或说明...'
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowRemarkModal(false)
                  setPendingAction(null)
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRemark}
                disabled={!remark.trim()}
                className="btn-primary"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
