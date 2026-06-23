import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  User,
  ShieldCheck,
  CreditCard,
  Battery,
  FileText,
  Settings,
  HelpCircle,
  ChevronRight,
  BadgeCheck,
  Car,
  Zap,
  Calendar,
  Package,
} from 'lucide-react'
import { useUserStore } from '@shared/stores/userStore'
import { useOrderStore } from '@shared/stores/orderStore'
import { StatusBadge } from '@shared/components/StatusBadge'
import { DataCard } from '@shared/components/DataCard'
import { BatteryGauge } from '@shared/components/BatteryGauge'
import { cn, formatDate, getSocColor } from '@shared/utils'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { currentRider } = useUserStore()
  const { orders } = useOrderStore()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const menuItems = [
    {
      icon: FileText,
      label: '我的订单',
      path: '/rider/orders',
      color: 'cyan' as const,
    },
    {
      icon: Battery,
      label: '我的电池',
      path: '/rider/battery',
      color: 'green' as const,
    },
    {
      icon: Package,
      label: '套餐管理',
      path: '/rider/package',
      color: 'cyan' as const,
    },
    {
      icon: HelpCircle,
      label: '帮助中心',
      path: '/rider/help',
      color: 'orange' as const,
    },
    {
      icon: Settings,
      label: '设置',
      path: '/rider/settings',
      color: 'muted' as const,
    },
  ]

  const getVerifyStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return { label: '已认证', color: 'success' as const }
      case 'pending':
        return { label: '认证中', color: 'warning' as const }
      case 'rejected':
        return { label: '未通过', color: 'danger' as const }
      default:
        return { label: '未认证', color: 'muted' as const }
    }
  }

  const verifyStatus = currentRider
    ? getVerifyStatusColor(currentRider.verify_status)
    : { label: '未认证', color: 'muted' as const }

  const monthlySwaps = Math.floor((currentRider?.total_swaps || 0) / 12)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col bg-cyber-darker"
    >
      <motion.div variants={itemVariants} className="px-4 pt-6 pb-4">
        <div className="relative overflow-hidden rounded-2xl border border-cyber-border bg-gradient-to-br from-cyber-accent/10 via-cyber-dark to-cyber-darker p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyber-success/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex items-start gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyber-accent to-cyber-success flex items-center justify-center">
                <User className="w-8 h-8 text-cyber-darker" />
              </div>
              {currentRider?.verify_status === 'verified' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyber-success flex items-center justify-center border-2 border-cyber-darker">
                  <BadgeCheck className="w-4 h-4 text-cyber-darker" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
              <h2 className="font-rajdhani font-bold text-xl text-cyber-text">
                {currentRider?.real_name || '骑手用户'}
              </h2>
              <StatusBadge
                status={verifyStatus.label}
                color={verifyStatus.color}
                size="sm"
                pulse={currentRider?.verify_status === 'verified'}
              />
            </div>
              <p className="text-sm text-cyber-muted mt-1 font-mono">
                {currentRider?.rider_id}
              </p>
              <p className="text-sm text-cyber-muted mt-0.5">
                {currentRider?.phone}
              </p>
            </div>
          </div>

          {currentRider?.verify_status === 'verified' && (
            <div className="relative mt-4 pt-4 border-t border-cyber-border/50">
              <div className="flex items-center gap-2 mb-2">
              <Car className="w-4 h-4 text-cyber-accent" />
              <span className="text-sm text-cyber-muted">驾驶证信息</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cyber-darker/50 rounded-lg px-3 py-2">
                <p className="text-xs text-cyber-muted">驾照号</p>
                <p className="text-sm text-cyber-text font-mono">
                  {currentRider.driver_license_no}
                </p>
              </div>
              <div className="bg-cyber-darker/50 rounded-lg px-3 py-2">
                <p className="text-xs text-cyber-muted">准驾车型</p>
                <p className="text-sm text-cyber-accent font-bold">
                  {currentRider.driver_license_type}
                </p>
              </div>
            </div>
          </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <DataCard
            title="总换电次数"
            value={currentRider?.total_swaps || 0}
            unit="次"
            icon={<Zap className="w-5 h-5" />}
            color="cyan"
            trend={12}
          />
          <DataCard
            title="本月换电"
            value={Math.floor(monthlySwaps)}
            unit="次"
            icon={<Calendar className="w-5 h-5" />}
            color="green"
            trend={8}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="px-4 mb-4">
        <div className="bg-cyber-dark/50 rounded-xl border border-cyber-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Battery className="w-5 h-5 text-cyber-accent" />
              <span className="font-rajdhani font-semibold text-cyber-text">
                当前电池
              </span>
            </div>
            <button
              onClick={() => navigate('/rider/battery')}
              className="text-xs text-cyber-accent flex items-center gap-0.5"
            >
              查看详情
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {currentRider?.current_battery_id ? (
            <div className="flex items-center gap-4">
              <BatteryGauge
                soc={currentRider.current_soc || 0}
                size="lg"
                showLabel={false}
              />
              <div className="flex-1">
                <p className="font-mono text-cyber-accent text-sm">
                  {currentRider.current_battery_id}
                </p>
                <p
                  className={cn(
                    'text-lg font-bold font-rajdhani',
                    getSocColor(currentRider.current_soc || 0)
                  )}
                >
                  {currentRider.current_soc}% SOC
                </p>
              </div>
            </div>
          ) : (
            <p className="text-cyber-muted text-sm">暂无使用中</p>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="px-4 flex-1">
        <h3 className="font-rajdhani font-semibold text-cyber-text mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyber-accent" />
          功能菜单
        </h3>
        <div className="bg-cyber-dark/50 rounded-xl border border-cyber-border overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.button
                key={item.label}
                whileHover={{ backgroundColor: 'rgba(0, 229, 255, 0.05)' }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full p-1 px-4 py-3.5 flex items-center justify-between transition-colors',
                  index < menuItems.length - 1 && 'border-b border-cyber-border/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      item.color === 'cyan' && 'bg-cyber-accent/20 text-cyber-accent',
                      item.color === 'green' && 'bg-cyber-success/20 text-cyber-success',
                      item.color === 'orange' && 'bg-cyber-warning/20 text-cyber-warning',
                      item.color === 'muted' && 'bg-cyber-muted/20 text-cyber-muted'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-cyber-text">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-cyber-muted" />
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="px-4 pb-6 pt-2"
      >
        <div className="text-center text-xs text-cyber-muted/60">
          <p>换电侠 v1.0.0</p>
          <p className="mt-1">© 2024 Battery Swap Network</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
