import { useState } from 'react'
import { Wallet, Clock, Target } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge'
import { subsidyRecords } from '../../data/mockData'
import type { SubsidyRecord } from '../../types'

const tabs = [
  { key: 'pension', label: '高龄津贴' },
  { key: 'disability', label: '失能补贴' },
  { key: 'nursing', label: '护理补贴' },
  { key: 'medical', label: '医疗救助' },
] as const

function getProgress(status: SubsidyRecord['status'], trailLength: number) {
  if (status === 'disbursed') return 100
  if (status === 'approved') return 75
  if (status === 'pending') return Math.min(trailLength * 25, 50)
  if (status === 'rejected') return trailLength * 20
  return 0
}

function getProgressColor(progress: number) {
  if (progress >= 100) return 'bg-blue-500'
  if (progress >= 75) return 'bg-green-500'
  if (progress >= 50) return 'bg-yellow-500'
  return 'bg-orange-500'
}

export default function SubsidyTracking() {
  const [activeTab, setActiveTab] = useState<string>('pension')

  const filtered = subsidyRecords.filter((r: SubsidyRecord) => r.type === activeTab)

  const totalDisbursed = subsidyRecords
    .filter((r) => r.status === 'disbursed')
    .reduce((sum, r) => sum + r.amount, 0)
  const pendingCount = subsidyRecords.filter((r) => r.status === 'pending').length
  const precisionRate = 96.5

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">补贴发放精准追踪</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-slate-500 font-medium">本月发放总额</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">¥{totalDisbursed.toLocaleString()}</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-slate-500 font-medium">待审批数</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{pendingCount}</span>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-sm text-slate-500 font-medium">发放精准率</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{precisionRate}%</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">暂无记录</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {filtered.map((r: SubsidyRecord) => {
              const progress = getProgress(r.status, r.auditTrail.length)
              return (
                <div key={r.id} className="border border-slate-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                        {r.elderName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{r.elderName}</div>
                        <div className="text-xs text-slate-400">{r.id}</div>
                      </div>
                    </div>
                    <StatusBadge status={r.status} type="subsidy" />
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-slate-800">¥{r.amount.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">申请日期: {r.appliedDate}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>审计进度</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
