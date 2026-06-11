import { useState } from 'react'
import { ArrowRightLeft, Check, Info, Upload, ChevronDown, ChevronUp, Clock, FileCheck, AlertTriangle, UserCheck, Eye } from 'lucide-react'
import { mockTransferApplications } from '@/mock/data'
import type { TransferApplication, TransferStep } from '@/types'
import { useAuditLog } from '@/hooks/useAuditLog'

const PROVINCES = [
  '北京市', '上海市', '天津市', '重庆市', '广东省', '浙江省', '江苏省',
  '山东省', '四川省', '湖北省', '湖南省', '河南省', '河北省', '福建省',
  '安徽省', '陕西省', '辽宁省', '吉林省', '黑龙江省', '江西省',
]

const TRANSFER_TYPES = [
  { value: 'pension', label: '养老保险' },
  { value: 'medical', label: '医疗保险' },
]

const statusConfig: Record<TransferApplication['status'], { label: string; cls: string }> = {
  pending: { label: '待审核', cls: 'bg-gray-100 text-gray-600' },
  reviewing: { label: '审核中', cls: 'bg-blue-100 text-blue-700' },
  approved: { label: '已通过', cls: 'bg-green-100 text-green-700' },
  transferring: { label: '划转中', cls: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700' },
}

const typeLabel: Record<string, string> = { pension: '养老保险', medical: '医疗保险' }

interface ReviewRecord {
  time: string
  operator: string
  region: string
  action: string
  result: '通过' | '退回' | '待处理'
  note?: string
}

const mockReviewRecords: Record<string, ReviewRecord[]> = {
  TF20250001: [
    { time: '2025-04-10 09:15', operator: '系统', region: '全国平台', action: '申请受理', result: '通过', note: '材料齐全，予以受理' },
    { time: '2025-04-12 14:30', operator: '王建国', region: '北京市社保中心', action: '转出地初审', result: '通过', note: '缴费记录核对无误' },
    { time: '2025-04-15 10:00', operator: '李明华', region: '北京市社保中心', action: '转出地复审', result: '通过', note: '同意转出，已签章确认' },
    { time: '2025-04-18 16:20', operator: '陈卫东', region: '上海市社保中心', action: '转入地预审', result: '退回', note: '缺少上海市居住证复印件，需补正属地化材料' },
    { time: '2025-04-22 11:00', operator: '张明（本人）', region: '线上补正', action: '属地材料补正', result: '通过', note: '已上传上海市居住证正反面扫描件' },
    { time: '2025-04-25 09:30', operator: '陈卫东', region: '上海市社保中心', action: '转入地复审', result: '通过', note: '材料补正完成，同意接收' },
    { time: '2025-05-02 08:00', operator: '系统', region: '全国平台', action: '资金划转中', result: '待处理', note: '养老金个人账户资金划转处理中，预计5个工作日完成' },
  ],
  TF20250002: [
    { time: '2025-01-05 10:00', operator: '系统', region: '全国平台', action: '申请受理', result: '通过', note: '材料齐全' },
    { time: '2025-01-08 15:00', operator: '周磊', region: '广东省社保中心', action: '转出地审核', result: '通过', note: '医疗缴费记录完整' },
    { time: '2025-01-12 09:30', operator: '吴敏', region: '浙江省社保中心', action: '转入地审核', result: '通过', note: '同意接收' },
    { time: '2025-01-20 14:00', operator: '系统', region: '全国平台', action: '资金划转', result: '通过', note: '医保个人账户资金已划转' },
    { time: '2025-01-25 10:00', operator: '吴敏', region: '浙江省社保中心', action: '转入确认', result: '通过', note: '已确认入账' },
    { time: '2025-01-28 16:00', operator: '系统', region: '全国平台', action: '转移完成', result: '通过', note: '全部流程结束，归档' },
  ],
}

const mockTimeLimits: Record<string, { deadline: string; daysLeft: number; totalDays: number }> = {
  TF20250001: { deadline: '2025-05-15', daysLeft: 6, totalDays: 45 },
  TF20250002: { deadline: '2025-02-19', daysLeft: 0, totalDays: 45 },
}

const mockMaterials: Record<string, { name: string; status: '已提交' | '需补正' | '已补正' | '无需' }[]> = {
  TF20250001: [
    { name: '社保关系转移申请表', status: '已提交' },
    { name: '身份证正反面', status: '已提交' },
    { name: '北京市社保缴费凭证', status: '已提交' },
    { name: '上海市居住证', status: '已补正' },
    { name: '劳动合同或录用证明', status: '已提交' },
  ],
  TF20250002: [
    { name: '社保关系转移申请表', status: '已提交' },
    { name: '身份证正反面', status: '已提交' },
    { name: '广东省社保缴费凭证', status: '已提交' },
    { name: '浙江省社保接收函', status: '已提交' },
  ],
}

function StepTimeline({ steps }: { steps: TransferStep[] }) {
  return (
    <div className="pl-4 py-3 space-y-0">
      {steps.map((step, i) => {
        const isDone = step.status === 'done'
        const isCurrent = step.status === 'current'
        const isLast = i === steps.length - 1
        let lineColor = 'bg-gray-200'
        if (isDone) lineColor = 'bg-emerald-400'
        else if (isCurrent) lineColor = 'bg-amber-300'
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-gov-gold text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px]">{i + 1}</span>}
              </div>
              {!isLast && <div className={`w-0.5 h-8 ${lineColor}`} />}
            </div>
            <div className="pb-4 min-w-0">
              <p className={`text-sm font-medium ${isDone ? 'text-emerald-700' : isCurrent ? 'text-gov-gold-dark' : 'text-gray-400'}`}>
                {step.name}
              </p>
              {step.date && <p className="text-xs text-gray-400 mt-0.5">{step.date}</p>}
              {step.note && (
                <p className={`text-xs mt-0.5 ${isCurrent ? 'text-gov-gold' : 'text-gray-500'}`}>{step.note}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ApplicationForm() {
  const { logAction } = useAuditLog()
  const [transferType, setTransferType] = useState('pension')
  const [fromProvince, setFromProvince] = useState('')
  const [toProvince, setToProvince] = useState('')
  const [uploaded, setUploaded] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<'idle' | 'success' | 'fail'>('idle')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validate = () => {
    const errors: string[] = []
    if (!fromProvince) errors.push('请选择转出省份')
    if (!toProvince) errors.push('请选择转入省份')
    if (fromProvince && toProvince && fromProvince === toProvince) errors.push('转出地与转入地不能相同')
    if (!uploaded || uploadedFiles.length === 0) errors.push('请上传转移材料')
    return errors
  }

  const handleUpload = () => {
    setUploaded(true)
    setUploadedFiles(['社保关系转移申请表.pdf', '身份证正反面.jpg'])
  }

  const handleSubmit = () => {
    const errors = validate()
    setValidationErrors(errors)
    if (errors.length > 0) return
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitResult(Math.random() > 0.2 ? 'success' : 'fail')
      logAction('提交社保关系转移申请', 'transfer', `${fromProvince}→${toProvince}`)
    }, 1500)
  }

  return (
    <div className="gov-card p-6 space-y-5 animate-fade-in-up">
      {submitResult === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">申请已提交成功</p>
            <p className="text-xs text-green-600 mt-0.5">您的转移申请已进入审核流程，预计45个工作日内完成，请在进度查询中关注办理状态。</p>
          </div>
        </div>
      )}
      {submitResult === 'fail' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">提交失败</p>
            <p className="text-xs text-red-600 mt-0.5">系统处理异常，请稍后重试或前往社保经办窗口办理。</p>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gov-blue-dark mb-1.5">转移类型</label>
          <select
            value={transferType}
            onChange={(e) => setTransferType(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20"
          >
            {TRANSFER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gov-blue-dark mb-1.5">转出省份</label>
          <select
            value={fromProvince}
            onChange={(e) => { setFromProvince(e.target.value); setValidationErrors([]) }}
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20"
          >
            <option value="">请选择转出省份</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gov-blue-dark mb-1.5">转入省份</label>
          <select
            value={toProvince}
            onChange={(e) => { setToProvince(e.target.value); setValidationErrors([]) }}
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20"
          >
            <option value="">请选择转入省份</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
          {validationErrors.map((err) => (
            <p key={err} className="text-xs text-red-700 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />{err}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          温馨提示：部分省市可能需要补充属地化材料（如居住证、劳动合同等），提交后将自动校验，如需补正会通过站内消息通知
        </p>
      </div>

      <div>
        <button
          onClick={handleUpload}
          className="flex items-center gap-2 text-sm text-gov-blue hover:text-gov-blue-light transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploaded ? '材料已上传' : '上传转移材料'}
        </button>
        {uploadedFiles.length > 0 && (
          <div className="mt-2 space-y-1">
            {uploadedFiles.map((f) => (
              <p key={f} className="text-xs text-gray-500 flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-green-500" />{f}
              </p>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || submitResult === 'success'}
        className="gov-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <ArrowRightLeft className="w-4 h-4" />
        {submitting ? '提交中...' : '提交转移申请'}
      </button>
    </div>
  )
}

function ProgressList() {
  const { logAction } = useAuditLog()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<'steps' | 'review' | 'materials'>('steps')

  return (
    <div className="space-y-4 animate-fade-in-up">
      {mockTransferApplications.map((app) => {
        const st = statusConfig[app.status]
        const isExpanded = expandedId === app.id
        const timeLimit = mockTimeLimits[app.id]
        const materials = mockMaterials[app.id] ?? []
        const reviews = mockReviewRecords[app.id] ?? []
        const hasSupplement = materials.some((m) => m.status === '需补正' || m.status === '已补正')

        return (
          <div key={app.id} className="gov-card overflow-hidden">
            <button
              onClick={() => { setExpandedId(isExpanded ? null : app.id); logAction('查询转移进度', 'query', app.id) }}
              className="w-full p-5 flex items-center justify-between hover:bg-surface-hover transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-semibold text-gov-blue-dark">{app.id}</span>
                  <span className={`gov-badge ${st.cls}`}>{st.label}</span>
                  {hasSupplement && (
                    <span className="gov-badge bg-amber-100 text-amber-700">含补正</span>
                  )}
                </div>
                <p className="text-sm text-gray-700">
                  {typeLabel[app.transferType]} · {app.fromProvince} → {app.toProvince}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-gray-400">申请时间：{app.createdAt}</p>
                  {timeLimit && timeLimit.daysLeft > 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />剩余 {timeLimit.daysLeft} 天
                    </p>
                  )}
                  {timeLimit && timeLimit.daysLeft === 0 && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />已办结
                    </p>
                  )}
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
              )}
            </button>
            {isExpanded && (
              <div className="border-t border-gray-100">
                {timeLimit && (
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">办理时限：法定 {timeLimit.totalDays} 个工作日</span>
                      <span className={timeLimit.daysLeft > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                        截止日期：{timeLimit.deadline}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${timeLimit.daysLeft === 0 ? 'bg-emerald-500' : timeLimit.daysLeft <= 10 ? 'bg-amber-500' : 'bg-gov-blue'}`}
                        style={{ width: `${Math.min(100, ((timeLimit.totalDays - timeLimit.daysLeft) / timeLimit.totalDays) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex border-b border-gray-100">
                  {(['steps', 'review', 'materials'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDetailTab(tab)}
                      className={`px-5 py-2.5 text-xs font-medium transition-colors relative ${
                        detailTab === tab ? 'text-gov-blue' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {tab === 'steps' ? '经办节点' : tab === 'review' ? '复查留痕' : '属地材料'}
                      {detailTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-gold" />}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {detailTab === 'steps' && <StepTimeline steps={app.steps} />}
                  {detailTab === 'review' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Eye className="w-3.5 h-3.5" />
                        <span>跨省经办节点与操作留痕</span>
                      </div>
                      {reviews.map((r, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              r.result === '通过' ? 'bg-emerald-100 text-emerald-600' :
                              r.result === '退回' ? 'bg-red-100 text-red-600' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                              {r.result === '通过' ? <Check className="w-3 h-3" /> :
                               r.result === '退回' ? <AlertTriangle className="w-3 h-3" /> :
                               <Clock className="w-3 h-3" />}
                            </div>
                            {i < reviews.length - 1 && <div className="w-0.5 h-full bg-gray-100 mt-1" />}
                          </div>
                          <div className="pb-3 min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-800">{r.action}</span>
                              <span className={`gov-badge text-[10px] ${
                                r.result === '通过' ? 'bg-green-100 text-green-700' :
                                r.result === '退回' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>{r.result}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{r.operator}</span>
                              <span>{r.region}</span>
                              <span>{r.time}</span>
                            </div>
                            {r.note && <p className="text-xs text-gray-400 mt-0.5">{r.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {detailTab === 'materials' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>属地化材料清单与状态</span>
                      </div>
                      {materials.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{m.name}</span>
                          <span className={`gov-badge text-[10px] ${
                            m.status === '已提交' ? 'bg-green-100 text-green-700' :
                            m.status === '需补正' ? 'bg-red-100 text-red-700' :
                            m.status === '已补正' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{m.status}</span>
                        </div>
                      ))}
                      {hasSupplement && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800">属地化材料已补正完成，转入地已重新审核。补正记录可在复查留痕中查看。</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Transfer() {
  const [activeTab, setActiveTab] = useState<'apply' | 'progress'>('apply')

  return (
    <div className="min-h-screen bg-surface-primary p-6 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark flex items-center gap-3">
          <ArrowRightLeft className="w-6 h-6 text-gov-gold" />
          社保关系转移
        </h1>
        <p className="text-sm text-gray-500 mt-1">跨省通办 · 一网通办</p>
      </div>

      <div className="flex border-b border-gray-200">
        {(['apply', 'progress'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-gov-blue'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab === 'apply' ? '转移申请' : '进度查询'}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-gold" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'apply' ? <ApplicationForm /> : <ProgressList />}
    </div>
  )
}
