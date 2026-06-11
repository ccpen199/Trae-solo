import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload, CheckCircle2, Clock, XCircle, ArrowUpCircle,
  FileText, Building2, Landmark, RotateCcw, Eye, ShieldCheck, AlertTriangle
} from 'lucide-react'
import { currentEmployer } from '@/data/users'
import { formatPrice, formatDate } from '@/utils'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  approved: { icon: CheckCircle2, label: '已认证', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  pending: { icon: Clock, label: '审核中', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  rejected: { icon: XCircle, label: '未通过', color: 'text-danger-500', bg: 'bg-danger-50', border: 'border-danger-200' },
}

const CERT_STEPS = [
  { key: 'submit', label: '提交材料', icon: Upload },
  { key: 'review', label: '平台初审', icon: FileText },
  { key: 'bank', label: '银行核实', icon: Landmark },
  { key: 'done', label: '认证完成', icon: ShieldCheck },
]

type CertStatus = 'approved' | 'pending' | 'rejected'

function getStepActive(idx: number, status: CertStatus): 'done' | 'active' | 'pending' | 'rejected' {
  if (status === 'approved') return 'done'
  if (status === 'pending') {
    if (idx <= 1) return 'done'
    if (idx === 2) return 'active'
    return 'pending'
  }
  if (status === 'rejected') {
    if (idx === 0) return 'done'
    if (idx === 1) return 'rejected'
    return 'pending'
  }
  return 'pending'
}

const REJECTION_MOCK = {
  reasonType: '营业执照模糊',
  reviewerNote: '上传的营业执照图片分辨率过低，关键信息（统一社会信用代码、经营范围）无法清晰辨认，请重新扫描或拍摄高清图片后提交。',
  lastSubmitTime: '2026-06-08T14:30:00Z',
  errorFields: ['businessLicense', 'creditCode'] as ('bankName' | 'bankAccount' | 'accountName' | 'creditCode' | 'businessLicense')[],
}

const submittedMaterials = [
  { id: 'm1', name: '营业执照副本.jpg', icon: Building2, uploadedAt: '2026-06-08T14:25:00Z', status: 'rejected' as const, reason: '图片模糊，关键信息无法辨认' },
  { id: 'm2', name: '银行开户许可证.pdf', icon: Landmark, uploadedAt: '2026-06-08T14:26:00Z', status: 'approved' as const },
  { id: 'm3', name: '法人身份证正面.jpg', icon: FileText, uploadedAt: '2026-06-08T14:27:00Z', status: 'approved' as const },
  { id: 'm4', name: '法人身份证反面.jpg', icon: FileText, uploadedAt: '2026-06-08T14:28:00Z', status: 'pending' as const },
]

const depositHistory = [
  { id: 1, amount: 20000, date: '2026-06-01T10:00:00Z', method: '银行转账' },
  { id: 2, amount: 15000, date: '2026-05-15T14:00:00Z', method: '银行转账' },
  { id: 3, amount: 15000, date: '2026-05-01T09:00:00Z', method: '银行转账' },
]

export default function EmployerCertify() {
  const status = currentEmployer.certificationStatus as CertStatus
  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon
  const isApproved = status === 'approved'
  const isRejected = status === 'rejected'

  const [bankName, setBankName] = useState('中国工商银行北京中关村支行')
  const [bankAccount, setBankAccount] = useState('6222****8901')
  const [accountName, setAccountName] = useState('')
  const [companyName] = useState(currentEmployer.name)
  const [creditCode, setCreditCode] = useState('91110108MA01ABCDEF')

  const [highlightErrors, setHighlightErrors] = useState(false)

  const handleResubmit = () => {
    setHighlightErrors(true)
    setAccountName('慧研科技有限公司')
    setTimeout(() => setHighlightErrors(false), 4000)
  }

  const hasError = (field: string) => {
    if (!highlightErrors) return false
    return REJECTION_MOCK.errorFields.includes(field as any)
  }

  const inputClass = (field: string) => cn(
    'w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors',
    hasError(field)
      ? 'border-danger-400 bg-danger-50 focus:border-danger-500 focus:ring-danger-400'
      : 'border-zinc-200 focus:border-primary-400 focus:ring-primary-400'
  )

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 font-serif text-2xl font-bold text-zinc-900">企业认证</h1>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={cn('mb-6 flex items-center gap-3 rounded-xl border p-5', config.bg, config.border)}>
          <StatusIcon size={24} className={config.color} />
          <div className="flex-1">
            <div className={cn('text-lg font-semibold', config.color)}>{config.label}</div>
            {isApproved && (
              <p className="mt-0.5 text-sm text-zinc-600">
                {currentEmployer.name} · 统一社会信用代码：91110********** · 已完成企业实名认证
              </p>
            )}
            {status === 'pending' && <p className="mt-0.5 text-sm text-zinc-600">您的认证资料正在审核中，预计1-3个工作日完成</p>}
            {status === 'rejected' && <p className="mt-0.5 text-sm text-zinc-600">认证未通过，请修改后重新提交</p>}
          </div>
          {isApproved && (
            <div className="text-right shrink-0">
              <div className="text-xs text-zinc-500">认证有效期至</div>
              <div className="text-sm font-bold text-emerald-700">2027-06-11</div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-serif text-lg font-bold text-zinc-900">审核进度</h2>
          <div className="relative">
            <div className="absolute left-0 right-0 top-5 h-1 bg-zinc-200" style={{ marginLeft: '6%', marginRight: '6%' }} />
            <motion.div
              className="absolute left-0 top-5 h-1"
              style={{ marginLeft: '6%' }}
              initial={{ width: 0 }}
              animate={{
                width: isApproved ? '88%' : status === 'pending' ? '44%' : isRejected ? '22%' : '0%'
              }}
              transition={{ duration: 0.8 }}
            >
              <div className={cn(
                'h-full',
                isApproved ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                'bg-gradient-to-r from-danger-400 to-danger-500'
              )} />
            </motion.div>

            <div className="relative flex justify-between">
              {CERT_STEPS.map((s, i) => {
                const state = getStepActive(i, status)
                const StepIcon = s.icon
                return (
                  <div key={s.key} className="flex w-1/4 flex-col items-center">
                    <div className="relative">
                      <div
                        className={cn(
                          'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-all',
                          state === 'done' ? 'border-emerald-400 bg-emerald-400 text-white shadow-md shadow-emerald-100' :
                          state === 'active' ? 'border-amber-400 bg-white text-amber-500' :
                          state === 'rejected' ? 'border-danger-400 bg-danger-50 text-danger-500' :
                          'border-zinc-300 bg-white text-zinc-400'
                        )}
                      >
                        {state === 'done' ? <CheckCircle2 size={20} /> :
                         state === 'rejected' ? <XCircle size={20} /> :
                         <StepIcon size={18} />}
                      </div>
                      {state === 'active' && (
                        <motion.div
                          animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-amber-400"
                        />
                      )}
                    </div>
                    <div className={cn(
                      'mt-3 text-sm font-semibold',
                      state === 'done' ? 'text-emerald-700' :
                      state === 'active' ? 'text-amber-600' :
                      state === 'rejected' ? 'text-danger-600' :
                      'text-zinc-400'
                    )}>
                      {s.label}
                    </div>
                    {state === 'active' && (
                      <div className="mt-0.5 text-xs text-amber-500">进行中…</div>
                    )}
                    {state === 'rejected' && (
                      <div className="mt-0.5 text-xs text-danger-500">未通过</div>
                    )}
                    {state === 'done' && i === CERT_STEPS.length - 1 && (
                      <div className="mt-0.5 text-xs text-emerald-500">已完成</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {isRejected && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="mb-6 overflow-hidden rounded-xl border border-danger-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 bg-danger-50 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-100">
                <AlertTriangle size={22} className="text-danger-600" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-danger-700">认证未通过，请修正后重新提交</div>
                <div className="mt-0.5 text-xs text-danger-500">
                  上次提交时间：{formatDate(REJECTION_MOCK.lastSubmitTime)}
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">不合格原因类型</div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-danger-100 px-3 py-1.5 text-sm font-bold text-danger-700">
                  <XCircle size={14} />
                  {REJECTION_MOCK.reasonType}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">审核员备注</div>
                <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 leading-relaxed">
                  {REJECTION_MOCK.reviewerNote}
                </div>
              </div>
              <button
                onClick={handleResubmit}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
              >
                <RotateCcw size={16} />
                修正后重新提交
              </button>
            </div>
          </motion.div>
        )}

        {!isApproved && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-serif text-lg font-bold text-zinc-900">提交材料列表</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {submittedMaterials.map((m) => {
                const rejected = m.status === 'rejected'
                const approved = m.status === 'approved'
                const pending = m.status === 'pending'
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4 transition-colors',
                      rejected ? 'border-danger-300 bg-danger-50/50' :
                      approved ? 'border-emerald-200 bg-emerald-50/30' :
                      'border-zinc-200 bg-white'
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      rejected ? 'bg-danger-100 text-danger-600' :
                      approved ? 'bg-emerald-100 text-emerald-600' :
                      'bg-zinc-100 text-zinc-500'
                    )}>
                      <m.icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate text-sm font-medium text-zinc-900">{m.name}</div>
                        <button className="shrink-0 text-zinc-400 hover:text-primary-500">
                          <Eye size={14} />
                        </button>
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-400">{formatDate(m.uploadedAt)}</div>
                      <div className="mt-2">
                        {approved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 size={11} /> 审核通过
                          </span>
                        )}
                        {pending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            <Clock size={11} /> 审核中
                          </span>
                        )}
                        {rejected && (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-danger-100 px-2 py-0.5 text-[11px] font-medium text-danger-700">
                              <XCircle size={11} /> 不合格
                            </span>
                            <div className="mt-1 text-[11px] text-danger-600">{m.reason}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {!isApproved && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-serif text-lg font-bold text-zinc-900">认证资料</h2>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                营业执照上传
                {hasError('businessLicense') && <span className="ml-2 text-xs text-danger-500">· 请重新上传清晰的营业执照</span>}
              </label>
              <div className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-zinc-50 py-10 transition-colors hover:border-primary-400 hover:bg-primary-50/30',
                hasError('businessLicense') ? 'border-danger-400 bg-danger-50/50' : 'border-zinc-300'
              )}>
                <Upload size={32} className={cn('mb-2', hasError('businessLicense') ? 'text-danger-400' : 'text-zinc-400')} />
                <span className="text-sm font-medium text-zinc-600">点击或拖拽上传</span>
                <span className="mt-1 text-xs text-zinc-400">支持 JPG、PNG、PDF，不超过 10MB</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-zinc-800">银行账户实名</h3>
              <div className="space-y-3">
                <div>
                  {hasError('bankName') && <div className="mb-1 text-xs text-danger-500">请核对银行名称</div>}
                  <input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass('bankName')} placeholder="银行名称" />
                </div>
                <div>
                  {hasError('bankAccount') && <div className="mb-1 text-xs text-danger-500">请核对银行账号</div>}
                  <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className={inputClass('bankAccount')} placeholder="银行账号" />
                </div>
                <div>
                  {hasError('accountName') && <div className="mb-1 text-xs text-danger-500">请核对开户名（需与企业一致）</div>}
                  <input value={accountName} onChange={(e) => setAccountName(e.target.value)} className={inputClass('accountName')} placeholder="开户名（企业对公账户名）" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-zinc-800">企业信息</h3>
              <div className="space-y-3">
                <input value={companyName} readOnly className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-500" placeholder="企业名称" />
                <div>
                  {hasError('creditCode') && <div className="mb-1 text-xs text-danger-500">请核对统一社会信用代码</div>}
                  <input value={creditCode} onChange={(e) => setCreditCode(e.target.value)} className={inputClass('creditCode')} placeholder="统一社会信用代码" />
                </div>
              </div>
            </div>

            <button className="w-full rounded-lg bg-primary-400 py-3 text-sm font-semibold text-white hover:bg-primary-500">
              {isRejected ? '重新提交认证' : '提交认证'}
            </button>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">保证金管理</h2>

          <div className="mb-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-teal-50 to-primary-50 p-5">
            <div>
              <div className="text-sm text-zinc-500">当前保证金余额</div>
              <div className="mt-1 text-3xl font-bold text-teal-700">{formatPrice(currentEmployer.depositBalance)}</div>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-primary-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500">
              <ArrowUpCircle size={18} />
              充值
            </button>
          </div>

          <h3 className="mb-3 text-sm font-semibold text-zinc-700">充值记录</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                <th className="pb-2 font-medium">日期</th>
                <th className="pb-2 font-medium">方式</th>
                <th className="pb-2 font-medium text-right">金额</th>
              </tr>
            </thead>
            <tbody>
              {depositHistory.map((h) => (
                <tr key={h.id} className="border-b border-zinc-50">
                  <td className="py-2.5 text-zinc-600">{formatDate(h.date)}</td>
                  <td className="py-2.5 text-zinc-500">{h.method}</td>
                  <td className="py-2.5 text-right font-medium text-emerald-600">+{formatPrice(h.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  )
}
