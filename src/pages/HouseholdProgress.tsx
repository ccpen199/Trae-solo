import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Circle, Clock, FileText, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useUserStore } from '@/store/user'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { HouseholdBiz } from '../../shared/types'

const typeLabels: Record<string, string> = { settle: '落户申请', residence: '居住证申领', newborn: '新生儿入户' }

const defaultBiz: HouseholdBiz = {
  id: '', type: 'settle', title: '', status: 'submitted',
  steps: [
    { name: '提交申请', status: 'done', time: '2024-01-15 09:30', desc: '申请已提交成功' },
    { name: '材料审核', status: 'active', desc: '工作人员正在审核您的材料' },
    { name: '审批通过', status: 'pending' },
    { name: '办结领取', status: 'pending' },
  ],
  submittedAt: '2024-01-15 09:30', estimatedDays: 7,
  materials: [
    { name: '身份证正反面', required: true, uploaded: true, ocrPassed: true },
    { name: '户口簿', required: true, uploaded: true, ocrPassed: true },
    { name: '房产证/租赁合同', required: true, uploaded: false },
    { name: '社保证明', required: false, uploaded: false },
  ],
}

export default function HouseholdProgress() {
  const { id } = useParams<{ id: string }>()
  const [biz, setBiz] = useState<HouseholdBiz>(defaultBiz)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/household/${id}`)
      .then((res) => {
        const data = res.data?.data ?? res.data
        if (data && typeof data === 'object' && 'steps' in data) setBiz(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const hasMaterialIssue = biz.status === 'material' || biz.materials.some((m) => m.required && !m.uploaded)

  if (loading) {
    return (
      <div className="animate-fadeIn space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-100 animate-shimmer bg-[length:200%_100%]" />
        <div className="h-40 rounded-2xl bg-gray-100 animate-shimmer bg-[length:200%_100%]" />
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <Link to="/household" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />返回户籍业务
      </Link>

      <h1 className="text-xl font-bold text-text-dark mb-6">办理进度</h1>

      {hasMaterialIssue && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-200 mb-4 animate-slideUp">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
          <span className="text-sm text-orange-700">部分必需材料未上传，请尽快补充以免影响办理进度</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-text-dark mb-6">办理流程</h2>
            <div className="relative pl-8">
              {biz.steps.map((step, i) => {
                const isLast = i === biz.steps.length - 1
                return (
                  <div key={i} className={cn('relative pb-8', isLast && 'pb-0')}>
                    {!isLast && (
                      <div className={cn('absolute left-[-22px] top-6 w-0.5 h-full', step.status === 'done' ? 'bg-primary' : 'bg-gray-200')} />
                    )}
                    <div className={cn(
                      'absolute left-[-30px] top-0 w-7 h-7 rounded-full flex items-center justify-center',
                      step.status === 'done' && 'bg-primary text-white',
                      step.status === 'active' && 'bg-primary text-white animate-pulse-glow',
                      step.status === 'pending' && 'bg-gray-100 text-gray-400',
                    )}>
                      {step.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className={cn('font-medium', step.status === 'pending' ? 'text-text-muted' : 'text-text-dark')}>{step.name}</h3>
                      {step.time && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-text-muted">
                          <Clock className="w-3 h-3" />{step.time}
                        </div>
                      )}
                      {step.desc && <p className="text-sm text-text-muted mt-1">{step.desc}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-slideUp">
            <h3 className="font-semibold text-text-dark mb-3">业务信息</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">业务类型</span>
                <span className="text-text-dark font-medium">{typeLabels[biz.type] ?? biz.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">提交时间</span>
                <span className="text-text-dark">{biz.submittedAt ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">预计天数</span>
                <span className="text-text-dark font-medium">{biz.estimatedDays ? `${biz.estimatedDays}个工作日` : '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-slideUp" style={{ animationDelay: '100ms' }}>
            <h3 className="font-semibold text-text-dark mb-3">材料清单</h3>
            <div className="space-y-2">
              {biz.materials.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <FileText className={cn('w-4 h-4 shrink-0', m.uploaded ? 'text-green-500' : 'text-gray-300')} />
                  <span className={cn('flex-1', m.uploaded ? 'text-text-dark' : 'text-text-muted')}>{m.name}</span>
                  {m.required && !m.uploaded && <span className="text-xs text-orange-500">需补充</span>}
                  {m.uploaded && m.ocrPassed && <span className="text-xs text-green-600">已通过</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
