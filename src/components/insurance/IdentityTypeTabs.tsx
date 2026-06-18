import { motion } from 'framer-motion'
import { Briefcase, UserCircle, Home } from 'lucide-react'
import type { IdentityType } from './types'
import { identityLabels } from './types'

interface IdentityTypeTabsProps {
  activeType: IdentityType
  onChange: (type: IdentityType) => void
}

const icons = {
  employee: Briefcase,
  flexible: UserCircle,
  resident: Home,
}

export default function IdentityTypeTabs({ activeType, onChange }: IdentityTypeTabsProps) {
  const types: IdentityType[] = ['employee', 'flexible', 'resident']

  return (
    <div className="flex gap-2 bg-gray-100 rounded-xl p-1.5">
      {types.map((type) => {
        const Icon = icons[type]
        const isActive = activeType === type
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className="relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors z-10"
          >
            {isActive && (
              <motion.span
                layoutId="identityTabBg"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-500'} />
            </span>
            <span className={`relative z-10 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
              {identityLabels[type]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
