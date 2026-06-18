import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanLine, UserCheck, Wallet, ChevronRight, X, Check, AlertCircle,
  Loader2, ArrowRight, Sparkles, Store, ScrollText, Edit3
} from 'lucide-react'
import { api } from '@/api/client'
import { useToast } from '@/components/Toast'
import type { MerchantAuditStatus, Merchant, SettlementConfig } from '@/types'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const STEPS = [
  { key: 'ocr', label: '营业执照OCR', icon: ScanLine },
  { key: 'review', label: '人工复核', icon: UserCheck },
  { key: 'deposit', label: '保证金缴纳', icon: Wallet },
] as const

function getStepIndex(status: MerchantAuditStatus): number {
  if (status === 'pending_ocr') return 0
  if (status === 'pending_review') return 1
  if (status === 'pending_deposit') return 2
  return 3
}

function getStatusBadge(status: MerchantAuditStatus) {
  const map: Record<MerchantAuditStatus, { label: string; cls: string }> = {
    pending_ocr: { label: '待OCR', cls: 'bg-wudu-500/30 text-wudu-400' },
    pending_review: { label: '待复核', cls: 'bg-jinguan-400/20 text-jinguan-400' },
    pending_deposit: { label: '待缴保证金', cls: 'bg-shujin-600/20 text-shujin-600' },
    active: { label: '已激活', cls: 'bg-green-500/20 text-green-400' },
    rejected: { label: '已拒绝', cls: 'bg-shujin-600 text-white' },
  }
  const { label, cls } = map[status]
  return <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{label}</span>
}

function Drawer({
  open, onClose, title, subtitle, children, footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            key="drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, duration: 0.3 }}
            className="absolute right-0 top-0 bottom-0 w-[440px] max-w-full bg-wudu-900 border-l border-wudu-700/50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-wudu-700/50 shrink-0">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-lg text-white truncate">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-wudu-500 mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-wudu-700 text-wudu-400 hover:text-white transition-colors ml-3 shrink-0"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="border-t border-wudu-700/50 p-4 bg-wudu-800/70 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function SuccessBanner({ title, hint, actionLabel, onAction }: {
  title: string
  hint?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 mb-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-green-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {title}
          </div>
          {hint && <div className="text-xs text-green-400/70 mt-0.5">{hint}</div>}
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-2 text-xs text-green-400 underline underline-offset-2 hover:text-green-300 font-medium"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function NextSteps({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-lg bg-wudu-950/70 p-4 border border-wudu-800 mt-4">
      <div className="text-xs font-medium text-wudu-400 mb-2.5 flex items-center gap-1.5">
        <ArrowRight className="w-3.5 h-3.5 text-jinguan-400" />
        下一步指引
      </div>
      <ul className="text-xs text-wudu-400 space-y-1.5">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-wudu-800 text-wudu-500 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AuditWorkflow({ merchants }: { merchants: Merchant[] }) {
  const toast = useToast()
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [list, setList] = useState(merchants)

  useEffect(() => {
    setList(merchants)
  }, [merchants])

  const inAudit = list.filter(
    (m) => m.auditStatus !== 'active' && m.auditStatus !== 'rejected'
  )
  const currentMerchant = list.find(m => m.id === actionId)

  function getStatusLabel(status: MerchantAuditStatus) {
    return status === 'pending_ocr' ? '营业执照OCR'
      : status === 'pending_review' ? '人工复核'
      : status === 'pending_deposit' ? '保证金缴纳'
      : status === 'active' ? '已激活' : '已拒绝'
  }

  function openAction(id: string, type: 'approve' | 'reject') {
    setActionId(id)
    setActionType(type)
    setNote('')
    setSavedOk(false)
    setSubmitting(false)
  }

  async function handleSubmit() {
    if (!actionId) return
    if (actionType === 'reject' && !note.trim()) {
      toast.error('请填写驳回原因', '驳回操作需要填写具体原因以便商户改进')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.merchant.auditAction(actionId, actionType, note || undefined)
      setList(prev => prev.map(m => m.id === actionId ? res.merchant : m))

      const nextLabel =
        actionType === 'reject'
          ? '已拒绝该商户，可联系商户补充材料后重新申请'
          : res.merchant.auditStatus === 'active'
          ? '商户已激活，可在商户列表中查看'
          : `已推进到「${getStatusLabel(res.merchant.auditStatus)}」阶段`

      toast.success(
        actionType === 'approve' ? '审核通过' : '已驳回申请',
        nextLabel
      )

      setSavedOk(true)
    } catch (err) {
      toast.error(
        actionType === 'approve' ? '审核失败' : '驳回失败',
        err instanceof Error ? err.message : '请稍后重试'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setActionId(null)
    setNote('')
    setSavedOk(false)
    setSubmitting(false)
  }

  const nextSteps = actionType === 'approve'
    ? [
        '系统自动推送审核结果通知商户',
        '推进到下一阶段后自动出现在对应审核队列',
        '全部通过后商户自动激活，可上架商品'
      ]
    : [
        '驳回后商户会收到短信/站内信通知',
        '商户可根据原因补充材料后重新提交申请',
        '重新提交的申请会从 OCR 阶段重新开始'
      ]

  return (
    <motion.section {...fadeUp} className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-serif text-white">入驻审核流</h3>
        <span className="text-xs text-wudu-500">
          待处理 <span className="text-jinguan-400 font-bold text-sm">{inAudit.length}</span> 家
        </span>
      </div>

      <div className="flex items-center justify-between mb-8 px-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center w-full">
                {index > 0 && <div className="flex-1 h-px bg-wudu-600" />}
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-wudu-600 bg-wudu-900">
                  <Icon className="w-4 h-4 text-wudu-600" />
                </div>
                {index < STEPS.length - 1 && <div className="flex-1 h-px bg-wudu-600" />}
              </div>
              <span className="text-xs text-wudu-500 text-center">{step.label}</span>
            </div>
          )
        })}
      </div>

      <div className="space-y-3">
        {inAudit.length === 0 && (
          <div className="text-center py-12 text-wudu-500 text-sm">
            <Store className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <div>暂无待审核商户</div>
          </div>
        )}
        {inAudit.map((merchant, index) => {
          const currentStep = getStepIndex(merchant.auditStatus)
          return (
            <motion.div
              key={merchant.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              layout
              className="rounded-xl bg-wudu-900 p-4 border border-wudu-700/40 hover:border-wudu-600/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-white truncate">{merchant.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-wudu-700 text-wudu-300 shrink-0">
                    {merchant.category}
                  </span>
                </div>
                {getStatusBadge(merchant.auditStatus)}
              </div>
              <div className="flex items-center gap-1 mb-4">
                {STEPS.map((step, si) => {
                  const isCompleted = si < currentStep
                  const isActive = si === currentStep
                  const Icon = step.icon
                  return (
                    <div key={step.key} className="flex items-center gap-1 flex-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted
                            ? 'bg-jinguan-400 text-wudu-900'
                            : isActive
                            ? 'bg-shujin-600 text-white'
                            : 'bg-wudu-700 text-wudu-500'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      {si < STEPS.length - 1 && (
                        <div className={`flex-1 h-px ${isCompleted ? 'bg-jinguan-400' : 'bg-wudu-700'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAction(merchant.id, 'approve')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors font-medium"
                >
                  <Check className="w-3.5 h-3.5" />
                  通过
                </button>
                <button
                  onClick={() => openAction(merchant.id, 'reject')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs bg-shujin-600/20 text-shujin-500 hover:bg-shujin-600/30 transition-colors font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  驳回
                </button>
                <button
                  onClick={() => openAction(merchant.id, 'approve')}
                  className="ml-auto flex items-center gap-1.5 text-xs text-wudu-500 hover:text-jinguan-400 transition-colors"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  查看资质
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      <Drawer
        open={actionId !== null}
        onClose={handleClose}
        title={actionType === 'approve' ? '审核通过' : '驳回申请'}
        subtitle={currentMerchant ? `${currentMerchant.name} · ${currentMerchant.category}` : undefined}
        footer={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSubmit}
              disabled={submitting || savedOk}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
                  : 'bg-shujin-600 hover:bg-shujin-700 text-white shadow-lg shadow-shujin-600/20'
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {savedOk ? '已保存 ✓' : actionType === 'approve' ? '确认通过并下一步' : '确认驳回'}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-sm text-wudu-400 hover:text-white hover:bg-wudu-700/50 transition-colors"
            >
              取消
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {savedOk && (
            <SuccessBanner
              title={actionType === 'approve' ? '审核已通过' : '已完成驳回'}
              hint={actionType === 'approve'
                ? currentMerchant?.auditStatus === 'pending_deposit'
                  ? '商户已激活，可在商户列表中查看'
                  : '已推进到下一审核阶段'
                : '商户将收到驳回通知，可补充材料后重新申请'
              }
            />
          )}

          {currentMerchant && (
            <div className="rounded-lg bg-wudu-800 p-4 border border-wudu-700/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">{currentMerchant.name}</span>
                {getStatusBadge(currentMerchant.auditStatus)}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-wudu-500">所在城市</span>
                  <p className="text-wudu-300 mt-0.5">{currentMerchant.city}</p>
                </div>
                <div>
                  <span className="text-wudu-500">商户类别</span>
                  <p className="text-wudu-300 mt-0.5">{currentMerchant.category}</p>
                </div>
                <div>
                  <span className="text-wudu-500">保证金</span>
                  <p className="text-wudu-300 mt-0.5">¥{currentMerchant.deposit?.toLocaleString() ?? '-'}</p>
                </div>
                <div>
                  <span className="text-wudu-500">结算周期</span>
                  <p className="text-wudu-300 mt-0.5">{currentMerchant.settlementCycle}</p>
                </div>
              </div>
            </div>
          )}

          {!savedOk && (
            <>
              <div className="rounded-lg bg-wudu-800/50 p-3 border border-wudu-700/30">
                <div className="text-xs text-wudu-500 mb-1.5">状态流转</div>
                <div className="text-sm text-white flex items-center gap-2">
                  {currentMerchant && getStatusBadge(currentMerchant.auditStatus)}
                  <ArrowRight className="w-4 h-4 text-wudu-500" />
                  <span className="text-jinguan-400 font-medium">
                    {actionType === 'approve'
                      ? currentMerchant?.auditStatus === 'pending_ocr' ? '待复核'
                      : currentMerchant?.auditStatus === 'pending_review' ? '待缴保证金'
                      : '已激活'
                      : '已拒绝'
                    }
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-wudu-300 mb-2 font-medium">
                  {actionType === 'approve' ? '审核备注' : '驳回原因'}
                  <span className={`ml-1 ${actionType === 'reject' ? 'text-shujin-500' : 'text-wudu-600'}`}>
                    {actionType === 'reject' ? '（必填）' : '（选填）'}
                  </span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    actionType === 'approve'
                      ? '填写备注信息，方便后续追溯和审计'
                      : '请详细填写驳回原因，便于商户了解问题并补充材料'
                  }
                  rows={5}
                  className={`w-full rounded-lg bg-wudu-800 border px-3.5 py-2.5 text-sm text-white placeholder-wudu-600 focus:outline-none resize-none transition-colors ${
                    actionType === 'reject' && !note.trim()
                      ? 'border-shujin-600 focus:border-shujin-500'
                      : 'border-wudu-700/50 focus:border-jinguan-400/50'
                  }`}
                />
                {actionType === 'reject' && !note.trim() && (
                  <p className="mt-1.5 text-xs text-shujin-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    驳回原因不能为空，请填写具体原因
                  </p>
                )}
              </div>
            </>
          )}

          <NextSteps steps={nextSteps} />
        </div>
      </Drawer>
    </motion.section>
  )
}

function CrossCityRulesEngine({ rules, onUpdate }: {
  rules: { from: string; to: string; ratio: number; enabled: boolean }[]
  onUpdate: (index: number, data: { ratio?: number; enabled?: boolean }) => Promise<void>
}) {
  const toast = useToast()
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [formRatio, setFormRatio] = useState(1.0)
  const [formEnabled, setFormEnabled] = useState(true)
  const [ratioError, setRatioError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  function openEdit(index: number) {
    const rule = rules[index]
    if (!rule) return
    setFormRatio(rule.ratio)
    setFormEnabled(rule.enabled)
    setRatioError('')
    setSavedOk(false)
    setSubmitting(false)
    setEditIndex(index)
  }

  function validateRatio(v: number): boolean {
    if (isNaN(v) || v < 0.5 || v > 2.0) {
      setRatioError('比例必须在 0.5 ~ 2.0 之间')
      return false
    }
    setRatioError('')
    return true
  }

  async function handleSave() {
    if (editIndex === null) return
    if (!validateRatio(formRatio)) return
    setSubmitting(true)
    try {
      await onUpdate(editIndex, { ratio: formRatio, enabled: formEnabled })
      toast.success(
        '规则已更新',
        `积分兑换比例 1:${formRatio.toFixed(2)}，权益互认${formEnabled ? '已开启' : '已关闭'}`
      )
      setSavedOk(true)
    } catch (err) {
      toast.error(
        '保存失败',
        err instanceof Error ? err.message : '请稍后重试'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setEditIndex(null)
    setSavedOk(false)
    setSubmitting(false)
  }

  function handleNext() {
    if (editIndex != null && editIndex < rules.length - 1) {
      openEdit(editIndex + 1)
    }
  }

  const nextSteps = [
    '保存后规则立即生效，无需额外审批',
    '会员跨城消费将按新比例自动结算',
    '可在会员权益页查看互认效果'
  ]

  return (
    <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-serif text-white">跨城权益互认规则引擎</h3>
        <span className="text-xs text-wudu-500">
          共 <span className="text-jinguan-400 font-bold text-sm">{rules.length}</span> 条规则
        </span>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-wudu-700">
              <th className="text-left py-3 px-3 text-wudu-400 font-normal text-xs">源城市</th>
              <th className="text-left py-3 px-3 text-wudu-400 font-normal text-xs">目的城市</th>
              <th className="text-left py-3 px-3 text-wudu-400 font-normal text-xs">积分兑换比例</th>
              <th className="text-left py-3 px-3 text-wudu-400 font-normal text-xs">权益互认</th>
              <th className="text-right py-3 px-3 text-wudu-400 font-normal text-xs">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((pair, index) => (
              <motion.tr
                key={`${pair.from}-${pair.to}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="border-b border-wudu-700/50 hover:bg-wudu-700/20 transition-colors"
              >
                <td className="py-3 px-3 text-wudu-300">{pair.from}</td>
                <td className="py-3 px-3 text-wudu-300">{pair.to}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-wudu-700 relative max-w-[120px]">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-jinguan-400"
                        style={{ width: `${Math.min((pair.ratio / 1.5) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-wudu-300 text-xs tabular-nums font-medium">1:{pair.ratio}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${pair.enabled ? 'text-green-400 bg-green-500/10' : 'text-wudu-500 bg-wudu-700/50'}`}>
                    {pair.enabled ? '已开启' : '已关闭'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => openEdit(index)}
                    className="inline-flex items-center gap-1 text-jinguan-400 text-xs hover:underline font-medium"
                  >
                    <Edit3 className="w-3 h-3" />
                    编辑
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={editIndex !== null}
        onClose={handleClose}
        title={editIndex !== null ? `编辑规则: ${rules[editIndex]?.from} → ${rules[editIndex]?.to}` : '编辑规则'}
        subtitle="调整跨城积分兑换比例与权益互认开关"
        footer={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSave}
              disabled={submitting || !!ratioError || savedOk}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-shujin-600 hover:bg-shujin-700 text-white shadow-lg shadow-shujin-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {savedOk ? '已保存 ✓' : '保存修改'}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-sm text-wudu-400 hover:text-white hover:bg-wudu-700/50 transition-colors"
            >
              取消
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {savedOk && (
            <SuccessBanner
              title="规则保存成功"
              hint="修改已即时生效，会员跨城消费将按新比例结算"
              actionLabel={editIndex != null && editIndex < rules.length - 1 ? '继续编辑下一条 →' : undefined}
              onAction={handleNext}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-wudu-500 mb-1.5">源城市</label>
              <div className="rounded-lg bg-wudu-800 border border-wudu-700/50 px-3 py-2.5 text-sm text-wudu-300">
                {editIndex !== null ? rules[editIndex]?.from : '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs text-wudu-500 mb-1.5">目的城市</label>
              <div className="rounded-lg bg-wudu-800 border border-wudu-700/50 px-3 py-2.5 text-sm text-wudu-300">
                {editIndex !== null ? rules[editIndex]?.to : '-'}
              </div>
            </div>
          </div>

          {!savedOk && (
            <>
              <div>
                <label className="block text-sm text-wudu-300 mb-2.5 font-medium">
                  积分兑换比例
                  <span className="text-wudu-600 text-xs font-normal ml-1">(0.5 ~ 2.0)</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={formRatio}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      setFormRatio(v)
                      validateRatio(v)
                    }}
                    className="flex-1 h-1.5 bg-wudu-700 rounded-lg appearance-none cursor-pointer accent-jinguan-400"
                  />
                  <div className="relative">
                    <span className="text-xs text-wudu-500 absolute -left-4 top-1/2 -translate-y-1/2">1:</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="2.0"
                      value={formRatio}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        setFormRatio(isNaN(v) ? 0.5 : v)
                        if (!isNaN(v)) validateRatio(v)
                      }}
                      className={`w-20 rounded-lg bg-wudu-800 border px-3 py-2 text-sm text-white text-center focus:outline-none tabular-nums ${
                        ratioError ? 'border-shujin-600 focus:border-shujin-500' : 'border-wudu-700/50 focus:border-jinguan-400/50'
                      }`}
                    />
                  </div>
                </div>
                {ratioError && (
                  <p className="mt-1.5 text-xs text-shujin-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {ratioError}
                  </p>
                )}
                <p className="mt-2 text-xs text-wudu-500">
                  {editIndex !== null && rules[editIndex]?.from} 1 积分 ={' '}
                  <span className="text-jinguan-400 font-medium">{editIndex !== null ? rules[editIndex]?.to : '-'}</span>{' '}
                  <span className="text-jinguan-400 font-medium">{formRatio.toFixed(2)}</span> 积分
                </p>
              </div>

              <div className="rounded-lg bg-wudu-800/60 p-4 border border-wudu-700/40">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm text-white font-medium">权益互认开关</div>
                    <div className="text-xs text-wudu-500 mt-0.5">
                      {formEnabled ? '会员可跨城使用权益和兑换积分' : '该城市对的权益将不可跨城互认'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormEnabled(!formEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${formEnabled ? 'bg-jinguan-400' : 'bg-wudu-600'}`}
                    aria-label={formEnabled ? '关闭权益互认' : '开启权益互认'}
                  >
                    <div
                      className={`absolute top-[2px] w-5 h-5 rounded-full bg-white shadow transition-transform ${formEnabled ? 'translate-x-[26px]' : 'translate-x-[2px]'}`}
                    />
                  </button>
                </label>
              </div>
            </>
          )}

          {savedOk && (
            <div className="rounded-lg bg-wudu-800/50 p-4 border border-wudu-700/30">
              <div className="text-xs text-wudu-500 mb-2">当前配置</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-wudu-400">兑换比例</span>
                <span className="text-jinguan-400 font-medium">1:{formRatio.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-wudu-400">权益互认</span>
                <span className={formEnabled ? 'text-green-400' : 'text-wudu-500'}>
                  {formEnabled ? '已开启' : '已关闭'}
                </span>
              </div>
            </div>
          )}

          <NextSteps steps={nextSteps} />
        </div>
      </Drawer>
    </motion.section>
  )
}

function SettlementConfiguration({ settlements, onUpdate }: {
  settlements: (SettlementConfig & { merchantName: string })[]
  onUpdate: (id: string, data: { cycle?: string; minAmount?: number }) => Promise<void>
}) {
  const toast = useToast()
  const [editId, setEditId] = useState<string | null>(null)
  const [formCycle, setFormCycle] = useState<string>('T+1')
  const [formMinAmount, setFormMinAmount] = useState(100)
  const [amountError, setAmountError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  function openEdit(config: SettlementConfig & { merchantName: string }) {
    setFormCycle(config.cycle)
    setFormMinAmount(config.minAmount)
    setAmountError('')
    setSavedOk(false)
    setSubmitting(false)
    setEditId(config.id)
  }

  function validateAmount(v: number): boolean {
    if (isNaN(v) || v < 0) {
      setAmountError('最低结算金额不能为负数')
      return false
    }
    setAmountError('')
    return true
  }

  async function handleSave() {
    if (!editId) return
    if (!validateAmount(formMinAmount)) return
    setSubmitting(true)
    try {
      await onUpdate(editId, { cycle: formCycle, minAmount: formMinAmount })
      toast.success(
        '结算配置已更新',
        `${formCycle} 结算，最低 ¥${formMinAmount}，将于下次结算生效`
      )
      setSavedOk(true)
    } catch (err) {
      toast.error(
        '保存失败',
        err instanceof Error ? err.message : '请稍后重试'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setEditId(null)
    setSavedOk(false)
    setSubmitting(false)
  }

  const editConfig = settlements.find(s => s.id === editId)

  const nextSteps = [
    '保存后配置立即生效，下个结算日按新规则执行',
    '商户端结算中心将同步显示新的周期配置',
    '调低结算周期建议提前通知商户'
  ]

  const cycleOptions = [
    { value: 'T+1', desc: '次日结算，资金周转快' },
    { value: 'T+3', desc: '3日结算，平衡安全与体验' },
    { value: 'T+7', desc: '7日结算，风险控制强' },
  ]

  return (
    <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-serif text-white">结算周期配置</h3>
        <span className="text-xs text-wudu-500">
          共 <span className="text-jinguan-400 font-bold text-sm">{settlements.length}</span> 家
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {settlements.map((config, index) => {
          const cycleColor =
            config.cycle === 'T+1'
              ? 'bg-jinguan-400/20 text-jinguan-400 border-jinguan-400/30'
              : config.cycle === 'T+3'
              ? 'bg-wudu-600/30 text-wudu-300 border-wudu-600/50'
              : 'bg-wudu-700/40 text-wudu-500 border-wudu-700/60'

          return (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              whileHover={{ y: -2 }}
              className="rounded-xl bg-wudu-900 p-4 border border-wudu-700/40 hover:border-jinguan-400/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">
                    {config.merchantName ?? config.merchantId}
                  </div>
                  <div className="text-xs text-wudu-500 mt-0.5">上次结算: {config.lastSettlement}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs border ${cycleColor} shrink-0 ml-2`}>
                  {config.cycle}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-wudu-500">最低结算金额</span>
                <span className="text-sm text-white font-medium">¥{config.minAmount.toLocaleString()}</span>
              </div>
              <button
                onClick={() => openEdit(config)}
                className="w-full flex items-center justify-center gap-1.5 text-jinguan-400 text-xs hover:underline py-2 border border-jinguan-400/30 rounded-lg hover:bg-jinguan-400/5 transition-colors font-medium"
              >
                <Edit3 className="w-3 h-3" />
                编辑配置
              </button>
            </motion.div>
          )
        })}
      </div>

      <Drawer
        open={editId !== null}
        onClose={handleClose}
        title={editConfig ? `结算配置: ${editConfig.merchantName}` : '结算配置'}
        subtitle="调整结算周期与最低结算金额"
        footer={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSave}
              disabled={submitting || !!amountError || savedOk}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-shujin-600 hover:bg-shujin-700 text-white shadow-lg shadow-shujin-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {savedOk ? '已保存 ✓' : '保存修改'}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-sm text-wudu-400 hover:text-white hover:bg-wudu-700/50 transition-colors"
            >
              取消
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {savedOk && (
            <SuccessBanner
              title="配置保存成功"
              hint="将于下一个结算周期生效，可在结算记录中查看"
            />
          )}

          <div className="rounded-lg bg-wudu-800 p-4 border border-wudu-700/40">
            <div className="text-xs text-wudu-500 mb-1">商户名称</div>
            <div className="text-sm font-medium text-white">{editConfig?.merchantName ?? '-'}</div>
            <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
              <div>
                <span className="text-wudu-500">当前周期</span>
                <p className="text-jinguan-400 mt-0.5 font-medium">{editConfig?.cycle}</p>
              </div>
              <div>
                <span className="text-wudu-500">上次结算</span>
                <p className="text-wudu-300 mt-0.5">{editConfig?.lastSettlement}</p>
              </div>
            </div>
          </div>

          {!savedOk && (
            <>
              <div>
                <label className="block text-sm text-wudu-300 mb-3 font-medium">结算周期</label>
                <div className="space-y-2">
                  {cycleOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormCycle(c.value)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all ${
                        formCycle === c.value
                          ? 'bg-shujin-600/20 border-2 border-shujin-600 text-white'
                          : 'bg-wudu-800 border-2 border-wudu-700/50 text-wudu-400 hover:border-wudu-600 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-base">{c.value}</span>
                        {formCycle === c.value && (
                          <Check className="w-5 h-5 text-shujin-500" />
                        )}
                      </div>
                      <p className="text-xs mt-1 opacity-70">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-wudu-300 mb-2.5 font-medium">
                  最低结算金额
                  <span className="text-wudu-600 text-xs font-normal ml-1">(元)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-wudu-500 text-sm">¥</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formMinAmount}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      setFormMinAmount(isNaN(v) ? 0 : v)
                      if (!isNaN(v)) validateAmount(v)
                    }}
                    className={`w-full rounded-lg bg-wudu-800 border pl-8 pr-3 py-2.5 text-sm text-white focus:outline-none tabular-nums ${
                      amountError ? 'border-shujin-600 focus:border-shujin-500' : 'border-wudu-700/50 focus:border-jinguan-400/50'
                    }`}
                  />
                </div>
                {amountError && (
                  <p className="mt-1.5 text-xs text-shujin-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {amountError}
                  </p>
                )}
                <p className="mt-2 text-xs text-wudu-500">
                  低于此金额的收益将累积至下一结算周期，减少小额转账手续费
                </p>
              </div>
            </>
          )}

          {savedOk && (
            <div className="rounded-lg bg-wudu-800/50 p-4 border border-wudu-700/30">
              <div className="text-xs text-wudu-500 mb-2">新配置</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-wudu-400">结算周期</span>
                <span className="text-jinguan-400 font-medium">{formCycle}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-wudu-400">最低金额</span>
                <span className="text-white font-medium">¥{formMinAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <NextSteps steps={nextSteps} />
        </div>
      </Drawer>
    </motion.section>
  )
}

export default function Merchant() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [rules, setRules] = useState<{ from: string; to: string; ratio: number; enabled: boolean }[]>([])
  const [settlements, setSettlements] = useState<(SettlementConfig & { merchantName: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [auditData, rulesData, settlementsData] = await Promise.all([
        api.merchant.audit(),
        api.merchant.rules(),
        api.merchant.settlements(),
      ])
      setMerchants(auditData)
      setRules(rulesData)
      setSettlements(settlementsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateRule = useCallback(async (index: number, data: { ratio?: number; enabled?: boolean }) => {
    const res = await api.merchant.updateRule(index, data)
    if (res.success && res.rule) {
      setRules(prev => {
        const next = [...prev]
        next[index] = res.rule
        return next
      })
    }
  }, [])

  const handleUpdateSettlement = useCallback(async (id: string, data: { cycle?: string; minAmount?: number }) => {
    const res = await api.merchant.updateSettlement(id, data)
    if (res.success && res.config) {
      setSettlements(prev => prev.map(s => s.id === id ? res.config as (SettlementConfig & { merchantName: string }) : s))
    }
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-jinguan-400 border-top-transparent rounded-full animate-spin" />
          <span className="ml-3 text-wudu-400 text-sm">加载中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-shujin-500" />
          <p className="text-white font-medium mb-2">加载失败</p>
          <p className="text-wudu-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-shujin-600 text-white rounded-lg text-sm hover:bg-shujin-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-white">商户治理</h1>
        <span className="text-xs text-wudu-500">管理商户入驻、跨城规则与结算配置</span>
      </div>
      <AuditWorkflow merchants={merchants} />
      <CrossCityRulesEngine rules={rules} onUpdate={handleUpdateRule} />
      <SettlementConfiguration settlements={settlements} onUpdate={handleUpdateSettlement} />
    </div>
  )
}
