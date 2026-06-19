import { useState } from 'react'
import { ShieldCheck, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { eContracts } from '@/mocks/data'
import type { EContract } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

const statusBadgeClass: Record<EContract['status'], string> = {
  draft: 'gov-badge-gray',
  signed: 'gov-badge-blue',
  notarized: 'gov-badge-green',
  expired: 'gov-badge-red',
}

const statusLabel: Record<EContract['status'], string> = {
  draft: '草稿',
  signed: '已签署',
  notarized: '已公证',
  expired: '已过期',
}

export default function EContractPage() {
  const [selectedId, setSelectedId] = useState<string>(
    eContracts[0]?.contractId ?? ''
  )
  const selected = eContracts.find((c) => c.contractId === selectedId)
  const userInfo = useAppStore((s) => s.userInfo)
  const isLoggedIn = useAppStore((s) => s.isLoggedIn)
  const currentRole = useAppStore((s) => s.currentRole)
  const isEnterpriseAuth = isLoggedIn && currentRole === 'enterprise' && userInfo

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">电子合同存证</h1>

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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {eContracts.map((contract, index) => (
            <motion.div
              key={contract.contractId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`gov-card p-4 cursor-pointer transition-shadow ${
                selectedId === contract.contractId
                  ? 'ring-2 ring-gov-blue shadow-gov-md'
                  : 'hover:shadow-gov-md'
              }`}
              onClick={() => setSelectedId(contract.contractId)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gov-text text-sm truncate">
                  {contract.title}
                </span>
                <span className={statusBadgeClass[contract.status]}>
                  {statusLabel[contract.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gov-text-secondary">
                <span>{contract.templateName}</span>
                <span>·</span>
                <span>{contract.signDate || '未签署'}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <motion.div
              key={selected.contractId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="gov-card p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gov-text">
                  {selected.title}
                </h2>
                <StatusBadge status={selected.status} type="contract" />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gov-text-secondary mb-1">
                    合同编号
                  </p>
                  <p className="font-mono text-gov-text">
                    {selected.contractId}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gov-text-secondary mb-1">
                    签署方
                  </p>
                  <div className="flex items-center gap-2">
                    {selected.parties.map((party, i) => (
                      <span key={i} className="text-gov-text">
                        {party}
                        {i < selected.parties.length - 1 && (
                          <span className="text-gov-text-secondary mx-2">
                            ←→
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gov-text-secondary mb-1">
                      签署日期
                    </p>
                    <p className="text-gov-text">
                      {selected.signDate || '未签署'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gov-text-secondary mb-1">
                      合同模板
                    </p>
                    <p className="text-gov-text">{selected.templateName}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gov-text-secondary mb-1">
                    区块链存证哈希
                  </p>
                  <p className="font-mono text-sm text-gov-text-secondary truncate">
                    {selected.blockchainHash || '暂无'}
                  </p>
                </div>
              </div>

              {(selected.status === 'signed' ||
                selected.status === 'notarized') && (
                <div className="pt-3 border-t border-gov-border">
                  <button className="gov-btn-primary flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    验真查询
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="gov-card p-12 text-center text-gov-text-secondary">
              请选择左侧合同查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
