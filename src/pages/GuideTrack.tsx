import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { apiFetch, mapCase } from '@/utils/api'
import type { CaseRecord, ProcessStep } from '@/types'

const statusMap: Record<string, { label: string; cls: string }> = {
  submitted: { label: '已提交', cls: 'bg-blue-100 text-blue-700' },
  processing: { label: '办理中', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-700' },
  completed: { label: '已完成', cls: 'bg-convenience/10 text-convenience' },
}

const mockSteps: ProcessStep[] = [
  { step: 1, title: '材料审核', description: '审核提交材料', department: '政务服务科', estimatedDays: 1 },
  { step: 2, title: '部门受理', description: '受理并分配办理', department: '业务科室', estimatedDays: 2 },
  { step: 3, title: '审批决定', description: '做出审批决定', department: '审批科', estimatedDays: 3 },
  { step: 4, title: '结果送达', description: '通知办理结果', department: '发证中心', estimatedDays: 1 },
]

function CaseCard({ record }: { record: CaseRecord }) {
  const [expanded, setExpanded] = useState(false)
  const st = statusMap[record.status] || statusMap.submitted

  const stepStatus = (step: number): 'done' | 'current' | 'pending' => {
    const statusOrder = { submitted: 1, processing: 2, approved: 3, completed: 4, rejected: 2 }
    const current = statusOrder[record.status] || 1
    if (step < current) return 'done'
    if (step === current) return 'current'
    return 'pending'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gov-blue-50 rounded-lg flex items-center justify-center">
            <span className="text-gov-blue-500 font-medium text-sm">{record.serviceName.charAt(0)}</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-800">{record.serviceName}</h4>
            <p className="text-xs text-gray-400 mt-0.5">提交时间: {record.createdAt}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-50">
          <div className="space-y-0">
            {mockSteps.map((step, i) => {
              const ss = stepStatus(step.step)
              return (
                <div key={step.step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        ss === 'done'
                          ? 'bg-green-500 text-white'
                          : ss === 'current'
                          ? 'bg-gov-blue-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {ss === 'done' ? '✓' : step.step}
                    </div>
                    {i < mockSteps.length - 1 && (
                      <div className={`w-0.5 h-8 ${ss === 'done' ? 'bg-green-200' : 'bg-gray-100'}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm ${ss === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.department} · {step.estimatedDays}个工作日</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function GuideTrack() {
  const [cases, setCases] = useState<CaseRecord[]>([])

  useEffect(() => {
    apiFetch<Array<Record<string, unknown>>>('/api/guide/cases?userId=user-001')
      .then((d) => setCases(d.map(mapCase) as CaseRecord[]))
      .catch(() => setCases([]))
  }, [])

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-lg">暂无办件记录</p>
        <p className="text-sm mt-1">您可以前往服务大厅提交申请</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {cases.map((c) => (
        <CaseCard key={c.id} record={c} />
      ))}
    </div>
  )
}
