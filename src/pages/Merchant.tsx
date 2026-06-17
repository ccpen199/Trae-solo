import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScanLine, UserCheck, Wallet, ChevronRight } from 'lucide-react'
import { mockMerchants, mockSettlementConfigs } from '@/mocks'
import type { MerchantAuditStatus } from '@/types'

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

function AuditWorkflow() {
  const inAudit = mockMerchants.filter(
    (m) => m.auditStatus !== 'active' && m.auditStatus !== 'rejected'
  )

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
              <div className="flex items-center gap-1">
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
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

const CITY_PAIRS = [
  { from: '成都', to: '宜宾', ratio: 1.2, enabled: true },
  { from: '成都', to: '绵阳', ratio: 1.1, enabled: true },
  { from: '成都', to: '乐山', ratio: 1.15, enabled: false },
  { from: '宜宾', to: '成都', ratio: 1.0, enabled: true },
  { from: '绵阳', to: '德阳', ratio: 1.05, enabled: true },
  { from: '泸州', to: '宜宾', ratio: 1.1, enabled: false },
]

function CrossCityRulesEngine() {
  const [pairs] = useState(CITY_PAIRS)

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
            {pairs.map((pair, index) => (
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
                  <button className="text-jinguan-400 text-xs hover:underline">编辑</button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

function SettlementConfiguration() {
  const merchantMap = new Map(mockMerchants.map((m) => [m.id, m]))

  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50">
      <h3 className="text-lg font-serif text-white mb-5">结算周期配置</h3>
      <div className="grid grid-cols-2 gap-3">
        {mockSettlementConfigs.map((config, index) => {
          const merchant = merchantMap.get(config.merchantId)
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
                {merchant?.name ?? config.merchantId}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs ${cycleColor}`}>{config.cycle}</span>
                <span className="text-xs text-wudu-400">最低 ¥{config.minAmount}</span>
              </div>
              <div className="text-xs text-wudu-500 mb-2">上次结算: {config.lastSettlement}</div>
              <button className="flex items-center gap-1 text-jinguan-400 text-xs hover:underline">
                查看详情
                <ChevronRight className="w-3 h-3" />
              </button>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function Merchant() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <AuditWorkflow />
      <CrossCityRulesEngine />
      <SettlementConfiguration />
    </div>
  )
}
