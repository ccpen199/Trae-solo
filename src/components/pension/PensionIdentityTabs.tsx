import { motion } from 'framer-motion'
import { Briefcase, UserCircle, Home } from 'lucide-react'
import type { PensionIdentity } from './types'
import { identityLabels } from './types'

interface PensionIdentityTabsProps {
  activeIdentity: PensionIdentity
  onChange: (identity: PensionIdentity) => void
}

const icons = {
  employee: Briefcase,
  flexible: UserCircle,
  resident: Home,
}

export default function PensionIdentityTabs({ activeIdentity, onChange }: PensionIdentityTabsProps) {
  const identities: PensionIdentity[] = ['employee', 'flexible', 'resident']

  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1.5">
      {identities.map((identity) => {
        const Icon = icons[identity]
        const isActive = activeIdentity === identity
        return (
          <button
            key={identity}
            onClick={() => onChange(identity)}
            className="relative flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors z-10"
          >
            {isActive && (
              <motion.span
                layoutId="pensionTabBg"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-500'} />
            </span>
            <span className={`relative z-10 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
              {identityLabels[identity]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
