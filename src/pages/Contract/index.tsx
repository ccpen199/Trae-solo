import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FileText, Clock, CheckCircle } from 'lucide-react'
import type { Contract } from '@/types'
import { contracts } from '@/mocks'

const STATUS_TABS: { label: string; value: Contract['status'] | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '签署中', value: 'signing' },
  { label: '已签署', value: 'signed' },
  { label: '履约中', value: 'fulfilling' },
  { label: '已完成', value: 'completed' },
  { label: '争议', value: 'disputed' },
]

const STATUS_CONFIG: Record<Contract['status'], { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: 'text-gray-600', bg: 'bg-gray-100' },
  signing: { label: '签署中', color: 'text-blue-600', bg: 'bg-blue-50' },
  signed: { label: '已签署', color: 'text-gold-700', bg: 'bg-gold-50' },
  fulfilling: { label: '履约中', color: 'text-orange-600', bg: 'bg-orange-50' },
  completed: { label: '已完成', color: 'text-primary-600', bg: 'bg-primary-50' },
  disputed: { label: '争议', color: 'text-red-600', bg: 'bg-red-50' },
}

const LIFECYCLE_STAGES = ['draft', 'signing', 'signed', 'fulfilling', 'completed'] as const

function getStageIndex(status: Contract['status']): number {
  if (status === 'disputed') return 2
  return LIFECYCLE_STAGES.indexOf(status as typeof LIFECYCLE_STAGES[number])
}

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`
}

function ProgressIndicator({ status }: { status: Contract['status'] }) {
  const currentIndex = getStageIndex(status)
  const stageLabels = ['草稿', '签署', '已签', '履约', '完成']

  return (
    <div className="flex items-center gap-1">
      {LIFECYCLE_STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i <= currentIndex
                  ? 'bg-primary-500'
                  : 'bg-gray-200'
              } ${status === 'disputed' && i === 2 ? 'bg-red-500' : ''}`}
            />
            <span className={`text-[10px] mt-0.5 ${
              i <= currentIndex ? 'text-primary-600' : 'text-gray-400'
            } ${status === 'disputed' && i === 2 ? 'text-red-500' : ''}`}>
              {stageLabels[i]}
            </span>
          </div>
          {i < LIFECYCLE_STAGES.length - 1 && (
            <div className={`w-4 h-0.5 mx-0.5 ${
              i < currentIndex ? 'bg-primary-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function ContractPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Contract['status'] | 'all'>('all')

  const filtered = activeTab === 'all'
    ? contracts
    : contracts.filter((c) => c.status === activeTab)

  const totalAmount = contracts.reduce((sum, c) => sum + c.amount, 0)
  const pendingCount = contracts.filter((c) => c.status === 'signing').length

  return (
    <div className="min-h-screen bg-[#fafaf8] p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-3xl font-bold text-earth-500">电子合同</h1>
          <p className="text-gray-500 mt-1">在线签署 · 履约跟踪 · 信用保障</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">合同总数</p>
                <p className="text-2xl font-bold text-earth-500">{contracts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-gold-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">合同总额</p>
                <p className="text-2xl font-bold text-earth-500">{formatAmount(totalAmount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">待签署</p>
                <p className="text-2xl font-bold text-earth-500">{pendingCount}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-100">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            创建合同
          </button>
        </motion.div>

        <div className="space-y-4">
          {filtered.map((contract, i) => {
            const cfg = STATUS_CONFIG[contract.status]
            return (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => navigate(`/contract/${contract.id}`)}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-semibold text-earth-500">{contract.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {contract.parties.join(' ↔ ')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>金额：<span className="font-semibold text-earth-500">{formatAmount(contract.amount)}</span></span>
                    <span>创建日期：{contract.createDate}</span>
                  </div>
                  <ProgressIndicator status={contract.status} />
                </div>
              </motion.div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">暂无该状态下的合同</div>
        )}
      </div>
    </div>
  )
}
