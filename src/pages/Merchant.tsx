import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanLine, UserCheck, Wallet, ChevronRight, X, Check, AlertCircle, Loader2 } from 'lucide-react'
import { api } from '@/api/client'
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

function Drawer({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-wudu-900 border-l border-wudu-700/50 z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-wudu-700/50">
              <h3 className="font-serif text-lg text-white">{title}</h3>
              <button onClick={onClose} className="p-1 rounded hover:bg-wudu-700 text-wudu-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function AuditWorkflow({ merchants, onAction }: {
  merchants: Merchant[]
  onAction: (id: string, action: 'approve' | 'reject', note?: string) => Promise<void>
}) {
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const inAudit = merchants.filter(
    (m) => m.auditStatus !== 'active' && m.auditStatus !== 'rejected'
  )

  async function handleSubmit() {
    if (!actionId) return
    setSubmitting(true)
    try {
      await onAction(actionId, actionType, note || undefined)
      setActionId(null)
      setNote('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div {...fadeUp} className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50">
      <h3 className="text-lg font-serif text-white mb-5">入驻审核流</h3>

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
        {inAudit.map((merchant, index) => {
          const currentStep = getStepIndex(merchant.auditStatus)
          return (
            <motion.div
              key={merchant.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="rounded-xl bg-wudu-900 p-4 border border-wudu-700/40"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{merchant.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-wudu-700 text-wudu-300">
                    {merchant.category}
                  </span>
                </div>
                {getStatusBadge(merchant.auditStatus)}
              </div>
              <div className="flex items-center gap-1 mb-3">
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
                  onClick={() => { setActionId(merchant.id); setActionType('approve') }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  通过
                </button>
                <button
                  onClick={() => { setActionId(merchant.id); setActionType('reject') }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-shujin-600/20 text-shujin-500 hover:bg-shujin-600/30 transition-colors"
                >
                  <AlertCircle className="w-3 h-3" />
                  驳回
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      <Drawer
        open={actionId !== null}
        onClose={() => { setActionId(null); setNote('') }}
        title={actionType === 'approve' ? '审核通过' : '驳回申请'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-wudu-400 mb-1.5">审核备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={actionType === 'approve' ? '填写通过备注（可选）' : '填写驳回原因（建议填写）'}
              rows={4}
              className="w-full rounded-lg bg-wudu-800 border border-wudu-700/50 px-3 py-2 text-sm text-white placeholder-wudu-600 focus:outline-none focus:border-jinguan-400/50 resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-shujin-600 hover:bg-shujin-700 text-white'
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {actionType === 'approve' ? '确认通过' : '确认驳回'}
            </button>
            <button
              onClick={() => { setActionId(null); setNote('') }}
              className="px-4 py-2 rounded-lg text-sm text-wudu-400 hover:text-white transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </Drawer>
    </motion.div>
  )
}

function CrossCityRulesEngine({ rules, onUpdate }: {
  rules: { from: string; to: string; ratio: number; enabled: boolean }[]
  onUpdate: (index: number, data: { ratio?: number; enabled?: boolean }) => Promise<void>
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [formRatio, setFormRatio] = useState(1.0)
  const [formEnabled, setFormEnabled] = useState(true)
  const [ratioError, setRatioError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function openEdit(index: number) {
    const rule = rules[index]
    setFormRatio(rule.ratio)
    setFormEnabled(rule.enabled)
    setRatioError('')
    setEditIndex(index)
  }

  function validateRatio(v: number): boolean {
    if (v < 0.5 || v > 2.0) {
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
      setEditIndex(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50">
      <h3 className="text-lg font-serif text-white mb-5">跨城权益互认规则引擎</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-wudu-700">
              <th className="text-left py-2.5 px-3 text-wudu-400 font-normal">源城市</th>
              <th className="text-left py-2.5 px-3 text-wudu-400 font-normal">目的城市</th>
              <th className="text-left py-2.5 px-3 text-wudu-400 font-normal">积分兑换比例</th>
              <th className="text-left py-2.5 px-3 text-wudu-400 font-normal">权益互认</th>
              <th className="text-left py-2.5 px-3 text-wudu-400 font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((pair, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="border-b border-wudu-700/50"
              >
                <td className="py-2.5 px-3 text-wudu-300">{pair.from}</td>
                <td className="py-2.5 px-3 text-wudu-300">{pair.to}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-wudu-700 relative">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-jinguan-400"
                        style={{ width: `${(pair.ratio / 1.5) * 100}%` }}
                      />
                    </div>
                    <span className="text-wudu-300 text-xs">1:{pair.ratio}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={pair.enabled} className="sr-only peer" readOnly />
                    <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${pair.enabled ? 'bg-jinguan-400' : 'bg-wudu-600'}`} />
                  </label>
                </td>
                <td className="py-2.5 px-3">
                  <button
                    onClick={() => openEdit(index)}
                    className="text-jinguan-400 text-xs hover:underline"
                  >
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
        onClose={() => setEditIndex(null)}
        title={editIndex !== null ? `编辑规则: ${rules[editIndex]?.from} → ${rules[editIndex]?.to}` : '编辑规则'}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-wudu-400 mb-1.5">源城市</label>
            <input
              type="text"
              value={editIndex !== null ? rules[editIndex]?.from : ''}
              disabled
              className="w-full rounded-lg bg-wudu-800 border border-wudu-700/50 px-3 py-2 text-sm text-wudu-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-wudu-400 mb-1.5">目的城市</label>
            <input
              type="text"
              value={editIndex !== null ? rules[editIndex]?.to : ''}
              disabled
              className="w-full rounded-lg bg-wudu-800 border border-wudu-700/50 px-3 py-2 text-sm text-wudu-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-wudu-400 mb-1.5">
              积分兑换比例 <span className="text-wudu-600">(0.5 ~ 2.0)</span>
            </label>
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
              className={`w-full rounded-lg bg-wudu-800 border px-3 py-2 text-sm text-white focus:outline-none ${
                ratioError ? 'border-shujin-600' : 'border-wudu-700/50 focus:border-jinguan-400/50'
              }`}
            />
            {ratioError && (
              <p className="mt-1 text-xs text-shujin-600">{ratioError}</p>
            )}
            <p className="mt-1 text-xs text-wudu-600">
              当前设置: A市1积分 = B市{formRatio}积分
            </p>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setFormEnabled(!formEnabled)}
                className={`w-11 h-6 rounded-full relative transition-colors ${formEnabled ? 'bg-jinguan-400' : 'bg-wudu-600'}`}
              >
                <div
                  className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-transform ${formEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
                />
              </div>
              <span className="text-sm text-white">
                权益互认 {formEnabled ? '已开启' : '已关闭'}
              </span>
            </label>
            <p className="mt-1 text-xs text-wudu-600">
              {formEnabled ? '关闭后该城市对的权益将不可跨城使用' : '开启后该城市对的权益可跨城互认'}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={submitting || !!ratioError}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-shujin-600 hover:bg-shujin-700 text-white transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              保存修改
            </button>
            <button
              onClick={() => setEditIndex(null)}
              className="px-4 py-2 rounded-lg text-sm text-wudu-400 hover:text-white transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </Drawer>
    </motion.div>
  )
}

function SettlementConfiguration({ settlements, onUpdate }: {
  settlements: (SettlementConfig & { merchantName: string })[]
  onUpdate: (id: string, data: { cycle?: string; minAmount?: number }) => Promise<void>
}) {
  const [editId, setEditId] = useState<string | null>(null)
  const [formCycle, setFormCycle] = useState<string>('T+1')
  const [formMinAmount, setFormMinAmount] = useState(100)
  const [amountError, setAmountError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function openEdit(config: SettlementConfig & { merchantName: string }) {
    setFormCycle(config.cycle)
    setFormMinAmount(config.minAmount)
    setAmountError('')
    setEditId(config.id)
  }

  function validateAmount(v: number): boolean {
    if (v < 0) {
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
      setEditId(null)
    } finally {
      setSubmitting(false)
    }
  }

  const editConfig = settlements.find(s => s.id === editId)

  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50">
      <h3 className="text-lg font-serif text-white mb-5">结算周期配置</h3>
      <div className="grid grid-cols-2 gap-3">
        {settlements.map((config, index) => {
          const cycleColor =
            config.cycle === 'T+1'
              ? 'bg-jinguan-400/20 text-jinguan-400'
              : config.cycle === 'T+3'
              ? 'bg-wudu-600/30 text-wudu-300'
              : 'bg-wudu-700/40 text-wudu-500'

          return (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="rounded-xl bg-wudu-900 p-4 border border-wudu-700/40"
            >
              <div className="text-sm font-medium text-white mb-2 truncate">
                {config.merchantName ?? config.merchantId}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs ${cycleColor}`}>{config.cycle}</span>
                <span className="text-xs text-wudu-400">最低 ¥{config.minAmount}</span>
              </div>
              <div className="text-xs text-wudu-500 mb-2">上次结算: {config.lastSettlement}</div>
              <button
                onClick={() => openEdit(config)}
                className="flex items-center gap-1 text-jinguan-400 text-xs hover:underline"
              >
                查看详情
                <ChevronRight className="w-3 h-3" />
              </button>
            </motion.div>
          )
        })}
      </div>

      <Drawer
        open={editId !== null}
        onClose={() => setEditId(null)}
        title={editConfig ? `结算配置: ${editConfig.merchantName}` : '结算配置'}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-wudu-400 mb-1.5">商户名称</label>
            <input
              type="text"
              value={editConfig?.merchantName ?? ''}
              disabled
              className="w-full rounded-lg bg-wudu-800 border border-wudu-700/50 px-3 py-2 text-sm text-wudu-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-wudu-400 mb-1.5">结算周期</label>
            <div className="flex gap-2">
              {(['T+1', 'T+3', 'T+7'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setFormCycle(c)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formCycle === c
                      ? 'bg-shujin-600 text-white'
                      : 'bg-wudu-800 border border-wudu-700/50 text-wudu-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-wudu-600">
              {formCycle === 'T+1' ? '次日结算，适合高频交易商户' : formCycle === 'T+3' ? '3日结算，平衡风险与体验' : '7日结算，适合大额低频交易'}
            </p>
          </div>
          <div>
            <label className="block text-sm text-wudu-400 mb-1.5">
              最低结算金额 <span className="text-wudu-600">(元)</span>
            </label>
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
              className={`w-full rounded-lg bg-wudu-800 border px-3 py-2 text-sm text-white focus:outline-none ${
                amountError ? 'border-shujin-600' : 'border-wudu-700/50 focus:border-jinguan-400/50'
              }`}
            />
            {amountError && (
              <p className="mt-1 text-xs text-shujin-600">{amountError}</p>
            )}
            <p className="mt-1 text-xs text-wudu-600">
              低于此金额的收益将累积至下一结算周期
            </p>
          </div>
          <div>
            <label className="block text-sm text-wudu-400 mb-1.5">上次结算日期</label>
            <input
              type="text"
              value={editConfig?.lastSettlement ?? ''}
              disabled
              className="w-full rounded-lg bg-wudu-800 border border-wudu-700/50 px-3 py-2 text-sm text-wudu-500 cursor-not-allowed"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={submitting || !!amountError}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-shujin-600 hover:bg-shujin-700 text-white transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              保存修改
            </button>
            <button
              onClick={() => setEditId(null)}
              className="px-4 py-2 rounded-lg text-sm text-wudu-400 hover:text-white transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </Drawer>
    </motion.div>
  )
}

export default function Merchant() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [rules, setRules] = useState<{ from: string; to: string; ratio: number; enabled: boolean }[]>([])
  const [settlements, setSettlements] = useState<(SettlementConfig & { merchantName: string })[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [auditData, rulesData, settlementsData] = await Promise.all([
        api.merchant.audit(),
        api.merchant.rules(),
        api.merchant.settlements(),
      ])
      setMerchants(auditData)
      setRules(rulesData)
      setSettlements(settlementsData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAuditAction = useCallback(async (id: string, action: 'approve' | 'reject', note?: string) => {
    await api.merchant.auditAction(id, action, note)
    await fetchData()
  }, [fetchData])

  const handleUpdateRule = useCallback(async (index: number, data: { ratio?: number; enabled?: boolean }) => {
    await api.merchant.updateRule(index, data)
    setRules(prev => {
      const next = [...prev]
      if (data.ratio != null) next[index] = { ...next[index], ratio: data.ratio! }
      if (data.enabled != null) next[index] = { ...next[index], enabled: data.enabled! }
      return next
    })
  }, [])

  const handleUpdateSettlement = useCallback(async (id: string, data: { cycle?: string; minAmount?: number }) => {
    const res = await api.merchant.updateSettlement(id, data)
    if (res.success && res.config) {
      setSettlements(prev => prev.map(s => s.id === id ? res.config : s))
    }
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-jinguan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <AuditWorkflow merchants={merchants} onAction={handleAuditAction} />
      <CrossCityRulesEngine rules={rules} onUpdate={handleUpdateRule} />
      <SettlementConfiguration settlements={settlements} onUpdate={handleUpdateSettlement} />
    </div>
  )
}
