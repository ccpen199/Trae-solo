import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  Zap,
  Clock,
  CheckCircle2,
  Crown,
  Sparkles,
  Calendar,
  Package,
} from 'lucide-react'
import { useUserStore } from '@shared/stores/userStore'
import { useOrderStore } from '@shared/stores/orderStore'
import { StatusBadge } from '@shared/components/StatusBadge'
import { cn } from '@shared/utils'
import type { Package as PackageType } from '@shared/types'

export default function PackagePage() {
  const navigate = useNavigate()
  const { currentRider } = useUserStore()
  const { packages } = useOrderStore()

  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)

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

  const handleBack = () => {
    navigate(-1)
  }

  const handleSelectPackage = (pkg: PackageType) => {
    setSelectedPackage(pkg)
    setShowPayModal(true)
    setPaySuccess(false)
  }

  const handlePay = () => {
    if (isPaying) return

    setIsPaying(true)

    setTimeout(() => {
      setIsPaying(false)
      setPaySuccess(true)

      setTimeout(() => {
        setShowPayModal(false)
        setPaySuccess(false)
      }, 2000)
    }, 2000)
  }

  const getPackageIcon = (type: string) => {
    switch (type) {
      case 'unlimited':
        return <Crown className="w-6 h-6" />
      case 'times':
        return <Zap className="w-6 h-6" />
      default:
        return <Package className="w-6 h-6" />
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col bg-cyber-darker"
    >
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-cyber-border bg-cyber-dark/50 backdrop-blur z-20">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-cyber-muted hover:text-cyber-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-rajdhani font-semibold text-lg text-cyber-text">
          套餐中心
        </h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-4">
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-2xl border border-cyber-accent/30 bg-gradient-to-br from-cyber-accent/20 via-cyber-dark to-cyber-darker p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyber-success/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-cyber-accent" />
                  <span className="text-sm text-cyber-muted">当前套餐余额</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-rajdhani text-cyber-accent">
                    {currentRider?.package_balance || 0}
                  </span>
                  <span className="text-cyber-muted">次</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <StatusBadge
                    status="可用"
                    color="success"
                    size="sm"
                    pulse
                  />
                  <span className="text-xs text-cyber-muted">
                    本月已使用 {Math.floor((currentRider?.total_swaps || 0) / 12)} 次
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h3 className="font-rajdhani font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyber-accent" />
              热门套餐
            </h3>

            <div className="space-y-3">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.package_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectPackage(pkg)}
                  className={cn(
                    'relative overflow-hidden rounded-xl border p-4 cursor-pointer transition-all',
                    pkg.popular
                      ? 'border-cyber-accent/50 bg-gradient-to-br from-cyber-accent/10 to-transparent'
                      : 'border-cyber-border bg-cyber-dark/50 hover:border-cyber-accent/30'
                  )}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-cyber-accent to-cyber-success text-cyber-darker text-xs font-bold px-3 py-1 rounded-bl-lg">
                        热门推荐
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                        pkg.popular
                          ? 'bg-gradient-to-br from-cyber-accent to-cyber-success text-cyber-darker'
                          : 'bg-cyber-accent/20 text-cyber-accent'
                      )}
                    >
                      {getPackageIcon(pkg.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-cyber-text">{pkg.name}</h4>
                        {pkg.type === 'unlimited' && (
                          <StatusBadge status="不限次" color="success" size="sm" />
                        )}
                      </div>
                      <p className="text-xs text-cyber-muted mt-1">{pkg.description}</p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {pkg.features.slice(0, 3).map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 text-xs text-cyber-muted"
                          >
                            <CheckCircle2 className="w-3 h-3 text-cyber-success" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="flex items-baseline justify-end">
                        <span className="text-lg font-bold font-rajdhani text-cyber-accent">
                          ¥{pkg.price}
                        </span>
                      </div>
                      <div className="text-xs text-cyber-muted/60 line-through mt-0.5">
                        ¥{pkg.original_price}
                      </div>
                      {pkg.swap_times && (
                        <div className="text-xs text-cyber-success mt-1">
                          约 ¥{(pkg.price / pkg.swap_times).toFixed(1)}/次
                        </div>
                      )}
                      {pkg.duration_days && (
                        <div className="flex items-center gap-1 text-xs text-cyber-muted mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{pkg.duration_days}天</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-cyber-dark/30 rounded-xl border border-cyber-border/50 p-4">
              <h4 className="font-medium text-cyber-text mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyber-accent" />
                套餐说明
              </h4>
              <div className="space-y-2 text-sm text-cyber-muted">
                <div className="flex gap-2">
                  <span className="text-cyber-accent flex-shrink-0">·</span>
                  <span>套餐自购买之日起生效，有效期根据套餐类型而定</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyber-accent flex-shrink-0">·</span>
                  <span>次数卡可在有效期内多次使用，不限频率</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyber-accent flex-shrink-0">·</span>
                  <span>畅换卡在有效期内不限换电次数</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyber-accent flex-shrink-0">·</span>
                  <span>套餐一经购买，不支持退款，请按需选择</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyber-accent flex-shrink-0">·</span>
                  <span>如有疑问，请联系客服：400-XXX-XXXX</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {showPayModal && selectedPackage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-cyber-darker/90 backdrop-blur z-30 flex items-end justify-center"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-cyber-dark rounded-t-2xl border-t border-x border-cyber-border p-6 pb-8"
          >
            <div className="w-12 h-1 bg-cyber-border rounded-full mx-auto mb-6" />

            {paySuccess ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="relative inline-flex mb-4">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-cyber-success/30"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <div className="relative w-16 h-16 rounded-full bg-cyber-success/20 border-2 border-cyber-success flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-cyber-success" />
                  </div>
                </div>
                <h3 className="font-rajdhani font-bold text-xl text-cyber-success mb-1">
                  购买成功
                </h3>
                <p className="text-cyber-muted text-sm">
                  套餐已到账，快去换电吧！
                </p>
              </motion.div>
            ) : (
              <>
                <h3 className="font-rajdhani font-bold text-xl text-cyber-text mb-4 text-center">
                  确认购买
                </h3>

                <div className="bg-cyber-darker/50 rounded-xl border border-cyber-border p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-cyber-muted">套餐名称</span>
                    <span className="text-cyber-text font-medium">
                      {selectedPackage.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-cyber-muted">套餐类型</span>
                    <span className="text-cyber-accent">
                      {selectedPackage.type === 'unlimited'
                        ? '畅换卡'
                        : selectedPackage.type === 'times'
                        ? '次数卡'
                        : '时长卡'}
                    </span>
                  </div>
                  {selectedPackage.swap_times && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cyber-muted">换电次数</span>
                      <span className="text-cyber-text">
                        {selectedPackage.swap_times} 次
                      </span>
                    </div>
                  )}
                  {selectedPackage.duration_days && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cyber-muted">有效期</span>
                      <span className="text-cyber-text">
                        {selectedPackage.duration_days} 天
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-cyber-border/50">
                    <span className="text-cyber-muted">应付金额</span>
                    <span className="text-2xl font-bold font-rajdhani text-cyber-accent">
                      ¥{selectedPackage.price}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-sm text-cyber-muted mb-2">支付方式</p>
                  <div className="p-3 rounded-lg border border-cyber-accent bg-cyber-accent/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-500 font-bold text-sm">微</span>
                      </div>
                      <span className="text-cyber-text">微信支付</span>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-cyber-accent bg-cyber-accent flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-cyber-darker" />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={!isPaying ? { scale: 1.02 } : {}}
                  whileTap={!isPaying ? { scale: 0.98 } : {}}
                  onClick={handlePay}
                  disabled={isPaying}
                  className={cn(
                    'w-full py-3.5 px-4 rounded-xl font-rajdhani font-bold text-base flex items-center justify-center gap-2 transition-all',
                    isPaying
                      ? 'bg-cyber-border text-cyber-muted cursor-wait'
                      : 'bg-gradient-to-r from-cyber-accent to-cyber-success text-cyber-darker shadow-neon-cyan'
                  )}
                >
                  {isPaying ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      支付中...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      立即支付 ¥{selectedPackage.price}
                    </>
                  )}
                </motion.button>

                <button
                  onClick={() => setShowPayModal(false)}
                  className="w-full py-3 text-cyber-muted text-sm hover:text-cyber-accent transition-colors mt-2"
                >
                  取消
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
