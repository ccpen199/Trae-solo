import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, BadgeCheck } from 'lucide-react'
import IdentityTypeTabs from './IdentityTypeTabs'
import StatusTab from './StatusTab'
import RecordsTab from './RecordsTab'
import CertificateTab from './CertificateTab'
import BenefitsTab from './BenefitsTab'
import type { IdentityType } from './types'
import { identityLabels } from './types'

type TabKey = 'status' | 'records' | 'certificate' | 'benefits'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'status', label: '参保状态' },
  { key: 'records', label: '缴费记录' },
  { key: 'certificate', label: '电子凭证' },
  { key: 'benefits', label: '待遇享受' },
]

export default function ResultStep() {
  const [activeTab, setActiveTab] = useState<TabKey>('status')
  const [identityType, setIdentityType] = useState<IdentityType>('employee')

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User size={24} className="text-primary" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">张三</div>
          <div className="text-sm text-gray-400 mt-0.5">110101********1234</div>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            <BadgeCheck size={12} />
            {identityLabels[identityType]}
          </span>
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">
            <BadgeCheck size={12} />
            正常参保
          </span>
        </div>
      </div>

      <IdentityTypeTabs activeType={identityType} onChange={setIdentityType} />

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + identityType}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'status' && <StatusTab identityType={identityType} />}
          {activeTab === 'records' && <RecordsTab />}
          {activeTab === 'certificate' && <CertificateTab />}
          {activeTab === 'benefits' && <BenefitsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
