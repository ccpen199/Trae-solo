import { useState } from 'react'
import { Factory, ChevronDown, CheckCircle2, Circle, Loader2, ShieldCheck, XCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { processRecords } from '@/mocks'
import type { ProcessRecord } from '@/types'

const statusConfig: Record<ProcessRecord['status'], { label: string; color: string }> = {
  receiving: { label: '原料接收', color: 'bg-blue-100 text-blue-700' },
  processing: { label: '加工中', color: 'bg-yellow-100 text-yellow-700' },
  quality_check: { label: '质检中', color: 'bg-orange-100 text-orange-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
}

function getActiveStepIndex(record: ProcessRecord): number {
  const idx = record.steps.findIndex(s => !s.completed)
  return idx === -1 ? record.steps.length : idx
}

function StepIndicator({ record }: { record: ProcessRecord }) {
  const activeIdx = getActiveStepIndex(record)
  const total = record.steps.length

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {record.steps.map((step, i) => {
        const isCompleted = step.completed
        const isCurrent = i === activeIdx && !isCompleted
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center min-w-[72px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : isCurrent
                    ? 'border-gold-500 text-gold-500 bg-gold-50'
                    : 'border-gray-200 text-gray-300 bg-white'
                } ${isCurrent ? 'animate-pulse' : ''}`}
              >
                {isCompleted ? <CheckCircle2 size={16} /> : isCurrent ? <Loader2 size={14} /> : <Circle size={14} />}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap ${
                isCompleted ? 'text-primary-600 font-medium' : isCurrent ? 'text-gold-600 font-medium' : 'text-gray-300'
              }`}>
                {step.name}
              </span>
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 w-6 -mt-4 ${
                i < activeIdx ? 'bg-primary-400' : 'bg-gray-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

const qcResultConfig = {
  passed: { icon: ShieldCheck, color: 'text-green-600 bg-green-50', label: '合格' },
  failed: { icon: XCircle, color: 'text-red-600 bg-red-50', label: '不合格' },
  pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50', label: '待检' },
}

function QualitySummary({ record }: { record: ProcessRecord }) {
  const passed = record.qualityChecks.filter(q => q.result === 'passed').length
  const failed = record.qualityChecks.filter(q => q.result === 'failed').length
  const pending = record.qualityChecks.filter(q => q.result === 'pending').length

  return (
    <div className="flex items-center gap-3 text-xs">
      {passed > 0 && (
        <span className="flex items-center gap-1 text-green-600">
          <ShieldCheck size={12} /> 合格 {passed}
        </span>
      )}
      {failed > 0 && (
        <span className="flex items-center gap-1 text-red-600">
          <XCircle size={12} /> 不合格 {failed}
        </span>
      )}
      {pending > 0 && (
        <span className="flex items-center gap-1 text-yellow-600">
          <Clock size={12} /> 待检 {pending}
        </span>
      )}
    </div>
  )
}

export default function ProcessPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
          <Factory size={20} className="text-primary-500" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold text-earth-500">加工流转管理</h1>
          <p className="text-gray-500 text-sm">加工批次追踪与质检管理</p>
        </div>
      </div>

      <div className="space-y-4">
        {processRecords.map((record) => {
          const isExpanded = expandedId === record.id
          const statusCfg = statusConfig[record.status]

          return (
            <motion.div
              key={record.id}
              layout
              className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                className="w-full text-left p-5 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-serif text-lg font-semibold text-earth-500">{record.productName}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                      <span>批次 {record.batchNo}</span>
                      <span className="text-gray-200">|</span>
                      <span>来源 {record.sourceBatch}</span>
                    </div>
                    <StepIndicator record={record} />
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <QualitySummary record={record} />
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} className="text-gray-300" />
                    </motion.div>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-earth-500 mb-3">加工步骤详情</h4>
                        <div className="space-y-2">
                          {record.steps.map((step) => {
                            const isActive = !step.completed && step === record.steps[getActiveStepIndex(record)]
                            return (
                              <div
                                key={step.id}
                                className={`p-3 rounded-lg border ${
                                  step.completed
                                    ? 'bg-green-50/50 border-green-100'
                                    : isActive
                                    ? 'bg-gold-50/50 border-gold-100'
                                    : 'bg-gray-50/50 border-gray-100'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-sm font-medium ${
                                    step.completed ? 'text-green-700' : isActive ? 'text-gold-700' : 'text-gray-400'
                                  }`}>
                                    {step.name}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {step.completed ? step.operator : '待执行'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">{step.description}</p>
                                {step.timestamp && (
                                  <p className="text-xs text-gray-400 mt-1">{step.timestamp}</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-earth-500 mb-3">质量检测</h4>
                        <div className="space-y-2">
                          {record.qualityChecks.map((qc) => {
                            const cfg = qcResultConfig[qc.result]
                            const QcIcon = cfg.icon
                            return (
                              <div key={qc.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                                  <QcIcon size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">{qc.type}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">{qc.notes}</p>
                                  <p className="text-xs text-gray-400 mt-1">{qc.inspector} · {qc.date}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {record.outputBatch && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm">
                          <span className="text-gray-400">产出批次</span>
                          <span className="text-primary-600 font-medium">{record.outputBatch}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
