import { useLocation, useNavigate } from 'react-router-dom'
import {
  Shield,
  Heart,
  GraduationCap,
  CreditCard,
  Users,
  FileText,
  FileCheck,
  AlertTriangle,
  Tag,
  Fingerprint,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MenuItem {
  label: string
  icon: LucideIcon
  path: string
}

const menuConfig: Record<string, MenuItem[]> = {
  personal: [
    { label: '五险一金查询', icon: Shield, path: '/personal/social-insurance' },
    { label: '医保就医记录', icon: Heart, path: '/personal/medical' },
    { label: '人事考试报名', icon: GraduationCap, path: '/personal/exam' },
    { label: '电子社保卡', icon: CreditCard, path: '/personal/essc' },
  ],
  enterprise: [
    { label: '参保增减员申报', icon: Users, path: '/enterprise/insurance-declaration' },
    { label: '失业金申领预审', icon: FileText, path: '/enterprise/unemployment' },
    { label: '电子合同存证', icon: FileCheck, path: '/enterprise/e-contract' },
  ],
  admin: [
    { label: '超时预警督办', icon: AlertTriangle, path: '/admin/timeout-warning' },
    { label: '政策智能标签', icon: Tag, path: '/admin/policy-tags' },
    { label: '实名认证审核', icon: Fingerprint, path: '/admin/identity-audit' },
  ],
}

export default function Sidebar() {
  const { currentRole, sidebarCollapsed, toggleSidebar } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()

  const items = menuConfig[currentRole] || []

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-16 bottom-0 bg-white border-r border-gov-border z-40 flex flex-col"
    >
      <div className="flex items-center justify-end px-2 h-12 border-b border-gov-border/50">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-gov-text-secondary hover:bg-gov-bg-light hover:text-gov-blue transition-colors duration-200"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 relative',
                isActive
                  ? 'text-gov-blue bg-gov-blue/5 font-medium border-l-[3px] border-gov-gold'
                  : 'text-gov-text-secondary hover:text-gov-text hover:bg-gov-bg-light border-l-[3px] border-transparent'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 shrink-0',
                  isActive ? 'text-gov-blue' : 'text-gov-text-secondary'
                )}
              />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </nav>
    </motion.aside>
  )
}
