import { useState } from 'react'
import { AlertTriangle, CheckCircle2, XCircle, Upload, Briefcase, Check, Clock, UserCheck, FileCheck } from 'lucide-react'
import { mockUnemploymentRegistration } from '@/mock/data'
import { useAuditLog } from '@/hooks/useAuditLog'

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-gray-100 text-gray-600' },
  submitted: { label: '已提交', cls: 'bg-blue-100 text-blue-700' },
  reviewing: { label: '审核中', cls: 'bg-purple-100 text-purple-700' },
  approved: { label: '已通过', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700' },
}

const reasons = ['企业裁员', '合同到期', '个人原因', '其他']

const paymentSchedule = [
  { month: '2025-04', amount: 2034, status: '已发放' },
  { month: '2025-05', amount: 2034, status: '已发放' },
  { month: '2025-06', amount: 2034, status: '已发放' },
  { month: '2025-07', amount: 2034, status: '待发放' },
  { month: '2025-08', amount: 2034, status: '待发放' },
  { month: '2025-09', amount: 2034, status: '待发放' },
]

interface MaterialItem {
  name: string
  required: boolean
  uploaded: boolean
  format: string
}

const requiredMaterials: MaterialItem[] = [
  { name: '解除劳动关系证明', required: true, uploaded: false, format: 'PDF/JPG' },
  { name: '身份证正反面', required: true, uploaded: false, format: 'JPG/PNG' },
  { name: '社保卡照片面', required: true, uploaded: false, format: 'JPG/PNG' },
  { name: '离职前12个月工资流水', required: true, uploaded: false, format: 'PDF' },
  { name: '失业登记表', required: false, uploaded: false, format: 'PDF' },
]

interface ReviewStep {
  step: string
  status: 'done' | 'current' | 'pending'
  operator?: string
  time?: string
  note?: string
}

const progressSteps: ReviewStep[] = [
  { step: '提交登记申请', status: 'done', operator: '张明（本人）', time: '2025-03-16 09:30', note: '材料已提交' },
  { step: '材料初审', status: 'done', operator: '刘审核员', time: '2025-03-18 14:20', note: '材料齐全，通过初审' },
  { step: '失业状态核实', status: 'done', operator: '刘审核员', time: '2025-03-20 10:00', note: '已与原单位核实，确认非本人意愿离职' },
  { step: '经办复审', status: 'current', operator: '王主管', note: '复审中' },
  { step: '登记完成', status: 'pending' },
]

const agentReviewLogs = [
  { time: '2025-03-16 09:30', operator: '系统', action: '申请受理', result: '通过', note: '线上提交，系统自动受理' },
  { time: '2025-03-18 14:20', operator: '刘审核员', action: '材料初审', result: '通过', note: '解除劳动关系证明、身份证、社保卡、工资流水均已核验' },
  { time: '2025-03-19 09:00', operator: '刘审核员', action: '失业状态核实', result: '通过', note: '致电北京某科技有限公司HR确认，离职原因为企业裁员，非本人意愿' },
  { time: '2025-03-20 10:00', operator: '刘审核员', action: '转交复审', result: '通过', note: '初审通过，转交主管复审' },
  { time: '2025-03-21 09:00', operator: '王主管', action: '经办复审', result: '待处理', note: '复审中，预计1-2个工作日完成' },
]

export default function Unemployment() {
  const { logAction } = useAuditLog()
  const [tab, setTab] = useState<'registration' | 'claim'>('registration')
  const [reason, setReason] = useState(mockUnemploymentRegistration.reason)
  const [employer, setEmployer] = useState(mockUnemploymentRegistration.lastEmployer)
  const [severanceDate, setSeveranceDate] = useState(mockUnemploymentRegistration.severanceDate)
  const [materials, setMaterials] = useState<MaterialItem[]>(requiredMaterials)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<'idle' | 'success' | 'fail'>('idle')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [claimResult, setClaimResult] = useState<'idle' | 'success' | 'fail'>('idle')

  const totalClaim = (mockUnemploymentRegistration.claimAmount ?? 0) * (mockUnemploymentRegistration.claimMonths ?? 0)

  const validateMaterials = () => {
    const errors: string[] = []
    if (!reason) errors.push('请选择失业原因')
    if (!employer.trim()) errors.push('请填写最后工作单位')
    if (!severanceDate) errors.push('请选择离职日期')
    const missingRequired = materials.filter((m) => m.required && !m.uploaded)
    if (missingRequired.length > 0) {
      errors.push(`缺少必要材料：${missingRequired.map((m) => m.name).join('、')}`)
    }
    return errors
  }

  const handleUploadMaterial = (idx: number) => {
    setMaterials((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, uploaded: true } : m))
    )
  }

  const handleSubmitRegistration = () => {
    const errors = validateMaterials()
    setValidationErrors(errors)
    if (errors.length > 0) return
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      const ok = Math.random() > 0.2
      setSubmitResult(ok ? 'success' : 'fail')
      logAction(ok ? '提交失业登记' : '失业登记提交失败', 'claim', '个人失业登记')
    }, 1500)
  }

  const handleSubmitClaim = () => {
    setClaimSubmitting(true)
    setTimeout(() => {
      setClaimSubmitting(false)
      const ok = Math.random() > 0.15
      setClaimResult(ok ? 'success' : 'fail')
      logAction(ok ? '申请失业金' : '失业金申请失败', 'claim', '失业金申领')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-surface-primary p-6 space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gov-blue flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">失业登记/申领</h1>
          <p className="text-sm text-gray-500 mt-0.5">失业保险金线上办理</p>
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-100 w-fit">
        {([
          ['registration', '失业登记'],
          ['claim', '失业金申领'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-gov-blue text-white shadow-sm'
                : 'text-gray-500 hover:text-gov-blue'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'registration' && (
        <div className="space-y-5">
          {submitResult === 'fail' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">提交失败</p>
                <p className="text-xs text-red-600 mt-0.5">系统处理异常，请检查材料后重新提交，或前往社保经办窗口办理。</p>
              </div>
            </div>
          )}

          <div className="gov-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="gov-section-title">登记信息</h2>
              <span className={`gov-badge ${statusMap[submitResult === 'success' ? 'reviewing' : mockUnemploymentRegistration.status].cls}`}>
                {submitResult === 'success' ? '审核中' : statusMap[mockUnemploymentRegistration.status].label}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">失业原因</label>
                <select
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setValidationErrors([]) }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最后工作单位</label>
                <input
                  type="text"
                  value={employer}
                  onChange={(e) => { setEmployer(e.target.value); setValidationErrors([]) }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">离职日期</label>
                <input
                  type="date"
                  value={severanceDate}
                  onChange={(e) => { setSeveranceDate(e.target.value); setValidationErrors([]) }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
                />
              </div>
            </div>
          </div>

          <div className="gov-card p-5">
            <h2 className="gov-section-title mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-gov-blue" />
              证明材料上传
            </h2>
            <div className="space-y-2">
              {materials.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {m.required && <span className="text-red-500 text-xs">*</span>}
                    <span className="text-sm text-gray-700">{m.name}</span>
                    <span className="text-[10px] text-gray-400">({m.format})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.uploaded ? (
                      <span className="gov-badge bg-green-100 text-green-700">
                        <Check className="w-3 h-3 mr-0.5" />已上传
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUploadMaterial(i)}
                        className="flex items-center gap-1 text-xs text-gov-blue hover:text-gov-blue-light"
                      >
                        <Upload className="w-3 h-3" />上传
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {validationErrors.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
                {validationErrors.map((err) => (
                  <p key={err} className="text-xs text-red-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />{err}
                  </p>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmitRegistration}
            disabled={submitting || submitResult === 'success'}
            className="gov-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交登记'}
          </button>

          {submitResult === 'success' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">失业登记已提交，进入审核流程</p>
                  <p className="text-xs text-green-600 mt-0.5">您的申请正在经办人员审核中，预计3-5个工作日完成审核。</p>
                </div>
              </div>

              <div className="gov-card p-5">
                <h2 className="gov-section-title mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gov-blue" />
                  申领进度
                </h2>
                <div className="space-y-0">
                  {progressSteps.map((s, i) => {
                    const isDone = s.status === 'done'
                    const isCurrent = s.status === 'current'
                    const isLast = i === progressSteps.length - 1
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            isDone ? 'bg-emerald-500 text-white' :
                            isCurrent ? 'bg-gov-gold text-white animate-pulse' :
                            'bg-gray-200 text-gray-400'
                          }`}>
                            {isDone ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px]">{i + 1}</span>}
                          </div>
                          {!isLast && <div className={`w-0.5 h-8 ${isDone ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                        </div>
                        <div className="pb-4">
                          <p className={`text-sm font-medium ${isDone ? 'text-emerald-700' : isCurrent ? 'text-gov-gold-dark' : 'text-gray-400'}`}>
                            {s.step}
                          </p>
                          {s.operator && <p className="text-xs text-gray-500 flex items-center gap-1"><UserCheck className="w-3 h-3" />{s.operator}</p>}
                          {s.time && <p className="text-xs text-gray-400">{s.time}</p>}
                          {s.note && <p className="text-xs text-gray-400 mt-0.5">{s.note}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="gov-card p-5">
                <h2 className="gov-section-title mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-gov-blue" />
                  经办审核记录
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">时间</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">操作人</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">操作</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">结果</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentReviewLogs.map((r, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-surface-hover transition-colors">
                          <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{r.time}</td>
                          <td className="py-2.5 px-3 text-gray-800 font-medium">{r.operator}</td>
                          <td className="py-2.5 px-3 text-gray-700">{r.action}</td>
                          <td className="py-2.5 px-3">
                            <span className={`gov-badge text-[10px] ${
                              r.result === '通过' ? 'bg-green-100 text-green-700' :
                              r.result === '退回' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>{r.result}</span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 text-xs max-w-[200px]">{r.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'claim' && (
        <div className="space-y-5">
          {claimResult === 'fail' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">申领失败</p>
                <p className="text-xs text-red-600 mt-0.5">您的申领条件核验未通过，可能原因：失业登记未审核通过、缴费年限不足等，请核实后重新申请。</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <span className="text-sm font-medium text-green-800">经系统核验，您符合失业金申领条件</span>
          </div>

          <div className="gov-card p-5">
            <h2 className="gov-section-title mb-4">预估金额</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gov-blue/5 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">月发放金额</p>
                <p className="text-xl font-bold text-gov-blue">¥{mockUnemploymentRegistration.claimAmount?.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-gov-gold/5 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">可领取月数</p>
                <p className="text-xl font-bold text-gov-gold-dark">{mockUnemploymentRegistration.claimMonths}个月</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">累计金额</p>
                <p className="text-xl font-bold text-green-700">¥{totalClaim.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="gov-card p-5">
            <h2 className="gov-section-title mb-3">重要提示</h2>
            <ul className="space-y-2.5">
              {[
                '失业登记有效期为一年，逾期需重新登记',
                '每月需按时进行失业状态确认，否则将暂停发放',
                '重新就业后需主动申报，停止领取失业金',
              ].map((note) => (
                <li key={note} className="flex items-start gap-2 text-sm text-gray-600">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleSubmitClaim}
              disabled={claimSubmitting || claimResult === 'success'}
              className="gov-btn-primary mt-5 w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {claimSubmitting ? '申请中...' : '申请失业金'}
            </button>
            {claimResult === 'success' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">申领成功，失业金将于次月起按月发放至您的社保卡金融账户</p>
              </div>
            )}
          </div>

          <div className="gov-card p-5">
            <h2 className="gov-section-title mb-3">发放记录</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium">月份</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium">金额（元）</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentSchedule.map((row) => (
                    <tr key={row.month} className="border-b border-gray-50 hover:bg-surface-hover transition-colors">
                      <td className="py-2.5 px-3 text-gray-800">{row.month}</td>
                      <td className="py-2.5 px-3 text-right text-gray-800">¥{row.amount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`gov-badge ${
                          row.status === '已发放'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
