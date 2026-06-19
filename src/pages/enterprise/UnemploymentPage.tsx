import { useState } from 'react'
import { Check, X, ChevronRight, Building2, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { unemploymentApplications } from '@/mocks/data'
import type { UnemploymentApplication } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

const flowSteps = [
  { key: 'draft', label: '草稿' },
  { key: 'submitted', label: '已提交' },
  { key: 'pre-reviewing', label: '预审中' },
  { key: 'approved', label: '已通过' },
]

function getFlowStepIndex(status: UnemploymentApplication['status']): number {
  const map: Record<string, number> = {
    draft: 0,
    submitted: 1,
    'pre-reviewing': 2,
    approved: 3,
    rejected: 3,
  }
  return map[status] ?? 0
}

function maskIdNumber(id: string): string {
  if (id.length <= 10) return id
  return id.slice(0, 6) + '****' + id.slice(-4)
}

export default function UnemploymentPage() {
  const [selectedId, setSelectedId] = useState<string>(
    unemploymentApplications[0]?.applicationId ?? ''
  )
  const selected = unemploymentApplications.find(
    (a) => a.applicationId === selectedId
  )
  const userInfo = useAppStore((s) => s.userInfo)
  const isLoggedIn = useAppStore((s) => s.isLoggedIn)
  const currentRole = useAppStore((s) => s.currentRole)
  const isEnterpriseAuth = isLoggedIn && currentRole === 'enterprise' && userInfo

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">失业金申领预审</h1>

      {isEnterpriseAuth ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={cn(
            'rounded-lg border border-gov-blue/20 py-3 px-4',
            'bg-gradient-to-r from-emerald-50/80 via-gov-blue/5 to-gov-blue/10',
            'flex items-center justify-between text-sm'
          )}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gov-blue" />
                <span className="font-medium text-gov-text">江苏信达科技有限公司</span>
              </div>
              <span className="text-gov-text-secondary">●</span>
              <span className="font-mono text-gov-text-secondary">9132**********3X</span>
              <span className="text-gov-text-secondary">●</span>
              <span className="gov-badge-green">已授权</span>
              <span className="text-gov-text-secondary">●</span>
              <span className="text-gov-text-secondary">
                经办人: <span className="text-gov-text font-medium">{userInfo?.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-medium">法人授权有效</span>
              </div>
              <span className="text-gov-text-secondary">|</span>
              <span className="text-gov-text-secondary">有效期至 2026-12-31</span>
              <span className="text-gov-text-secondary">|</span>
              <button className="text-gov-blue hover:text-gov-blue/80 text-sm">
                查看授权范围
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={cn(
            'rounded-lg border border-amber-200 py-3 px-4',
            'bg-gradient-to-r from-amber-50/80 to-amber-50',
            'flex items-center gap-3 text-sm'
          )}>
            <Building2 className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700">请先企业认证后再办理业务</span>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {unemploymentApplications.map((app, index) => (
            <motion.div
              key={app.applicationId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`gov-card p-5 cursor-pointer transition-shadow ${
                selectedId === app.applicationId
                  ? 'ring-2 ring-gov-blue shadow-gov-md'
                  : 'hover:shadow-gov-md'
              }`}
              onClick={() => setSelectedId(app.applicationId)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gov-text">
                    {app.employeeName}
                  </span>
                  <span className="font-mono text-sm text-gov-text-secondary">
                    {maskIdNumber(app.idNumber)}
                  </span>
                </div>
                <StatusBadge status={app.status} type="declaration" />
              </div>
              <div className="flex items-center gap-4 text-sm text-gov-text-secondary">
                <span>原因：{app.reason}</span>
                <span>申请日期：{app.applicationDate}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {selected && (
          <motion.div
            key={selected.applicationId}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="gov-card p-5">
              <h3 className="font-semibold text-gov-text mb-4">办理进度</h3>
              <div className="flex items-center">
                {flowSteps.map((step, i) => {
                  const currentIndex = getFlowStepIndex(selected.status)
                  const isCompleted = i < currentIndex
                  const isCurrent = i === currentIndex
                  const isRejected = selected.status === 'rejected' && i === 3

                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isRejected
                              ? 'bg-gov-red text-white'
                              : isCompleted
                              ? 'bg-green-600 text-white'
                              : isCurrent
                              ? 'bg-gov-blue text-white'
                              : 'bg-gray-200 text-gov-text-secondary'
                          }`}
                        >
                          {isRejected ? '✕' : isCompleted ? '✓' : i + 1}
                        </div>
                        <span
                          className={`text-xs mt-1.5 ${
                            isRejected
                              ? 'text-gov-red font-medium'
                              : isCompleted || isCurrent
                              ? 'text-gov-text font-medium'
                              : 'text-gov-text-secondary'
                          }`}
                        >
                          {isRejected ? '已驳回' : step.label}
                        </span>
                      </div>
                      {i < flowSteps.length - 1 && (
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 ${
                            i < currentIndex
                              ? 'text-green-600'
                              : 'text-gray-300'
                          }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="gov-card p-5">
              <h3 className="font-semibold text-gov-text mb-4">材料核对</h3>
              <div className="space-y-3">
                {selected.requiredDocs.map((doc) => {
                  const isSubmitted = selected.submittedDocs.includes(doc)
                  return (
                    <div
                      key={doc}
                      className="flex items-center justify-between py-2 border-b border-gov-border last:border-b-0"
                    >
                      <span className="text-sm text-gov-text">{doc}</span>
                      {isSubmitted ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-gov-red" />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 text-sm text-gov-text-secondary">
                已提交 {selected.submittedDocs.length} / {selected.requiredDocs.length} 项
              </div>
            </div>

            {selected.status === 'pre-reviewing' && (
              <div className="gov-card p-5 border-l-4 border-[#D4A843]">
                <h3 className="font-semibold text-gov-text mb-2">预审结果</h3>
                <p className="text-sm text-gov-text-secondary">
                  材料预审进行中，请耐心等待审核结果。
                  {selected.submittedDocs.length < selected.requiredDocs.length &&
                    ' 当前材料不完整，建议尽快补齐缺失材料。'}
                </p>
              </div>
            )}

            {selected.status === 'approved' && (
              <div className="gov-card p-5 border-l-4 border-green-600">
                <h3 className="font-semibold text-green-600 mb-2">预审通过</h3>
                <p className="text-sm text-gov-text-secondary">
                  您的失业金申领材料已通过预审，请前往社保窗口办理后续手续。
                </p>
              </div>
            )}

            {selected.status === 'rejected' && (
              <div className="gov-card p-5 border-l-4 border-gov-red">
                <h3 className="font-semibold text-gov-red mb-2">预审驳回</h3>
                <p className="text-sm text-gov-text-secondary">
                  材料审核未通过，请核实申报信息后重新提交。
                </p>
              </div>
            )}

            {selected.status === 'submitted' && (
              <div className="gov-card p-5 border-l-4 border-[#2E86AB]">
                <h3 className="font-semibold text-[#2E86AB] mb-2">等待预审</h3>
                <p className="text-sm text-gov-text-secondary">
                  申领材料已提交，正在排队等待预审。
                  {selected.submittedDocs.length < selected.requiredDocs.length &&
                    ' 注意：材料尚未齐全，可能影响审核进度。'}
                </p>
              </div>
            )}

            {selected.status === 'draft' && (
              <div className="gov-card p-5 border-l-4 border-gray-400">
                <h3 className="font-semibold text-gov-text-secondary mb-2">草稿状态</h3>
                <p className="text-sm text-gov-text-secondary">
                  申领信息尚未提交，请完善材料后提交预审。
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
