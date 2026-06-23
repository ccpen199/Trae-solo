import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Zap,
  Battery,
  MapPin,
  Clock,
  Wallet,
} from 'lucide-react'
import { useOrderStore } from '@shared/stores/orderStore'
import { useUserStore } from '@shared/stores/userStore'
import { BatteryGauge } from '@shared/components/BatteryGauge'
import { StatusBadge } from '@shared/components/StatusBadge'
import { cn, formatDate, getSocColor } from '@shared/utils'
import { SWAP_PRICE } from '@shared/constants'

type PayMethod = 'package' | 'wechat' | 'alipay' | 'mixed'

export default function PaymentPage() {
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const { orders, completeOrder } = useOrderStore()
  const { currentRider, updatePackageBalance } = useUserStore()

  const [payMethod, setPayMethod] = useState<PayMethod>('package')
  const [isPaying, setIsPaying] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const order = orders.find((o) => o.order_id === orderId)

  useEffect(() => {
    if (currentRider && currentRider.package_balance <= 0) {
      setPayMethod('wechat')
    }
  }, [currentRider])

  const handleBack = () => {
    if (!isSuccess) {
      navigate(-1)
    }
  }

  const handlePay = () => {
    if (isPaying || isSuccess) return

    setIsPaying(true)

    setTimeout(() => {
      if (payMethod === 'package' || payMethod === 'mixed') {
        updatePackageBalance(-1)
      }

      if (orderId) {
        completeOrder(orderId)
      }

      setIsPaying(false)
      setIsSuccess(true)
    }, 2000)
  }

  const handleBackToHome = () => {
    navigate('/rider/home')
  }

  const getPackageDeduction = () => {
    if (payMethod === 'package') return 1
    if (payMethod === 'mixed') return 1
    return 0
  }

  const getWechatAmount = () => {
    if (payMethod === 'wechat') return SWAP_PRICE
    if (payMethod === 'alipay') return 0
    if (payMethod === 'mixed') return 0
    return 0
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
          订单支付
        </h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="px-4 py-8 text-center"
            >
              <div className="relative inline-flex mb-6">
                <motion.div
                  className="absolute inset-0 rounded-full bg-cyber-success/30"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <div className="relative w-24 h-24 rounded-full bg-cyber-success/20 border-2 border-cyber-success flex items-center justify-center">
                  <CheckCircle2 className="w-14 h-14 text-cyber-success" />
                </div>
              </div>

              <h2 className="font-rajdhani font-bold text-2xl text-cyber-success mb-2">
                支付成功
              </h2>
              <p className="text-cyber-muted mb-6">
                换电已完成，祝您出行愉快
              </p>

              <div className="bg-cyber-dark/50 rounded-xl border border-cyber-border p-4 text-left mb-6">
                <h3 className="font-rajdhani font-semibold text-cyber-text mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyber-accent" />
                  订单详情
                </h3>
                {order && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">订单编号</span>
                      <span className="text-cyber-text font-mono">{order.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">换电柜</span>
                      <span className="text-cyber-text">{order.cabinet_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">换出电池</span>
                      <span className={cn('font-mono', getSocColor(order.old_soc))}>
                        {order.old_battery_id} ({order.old_soc}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">换入电池</span>
                      <span className="text-cyber-success font-mono">
                        {order.new_battery_id} ({order.new_soc}%)
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-cyber-border/50">
                      <span className="text-cyber-muted">支付金额</span>
                      <span className="text-cyber-accent font-rajdhani font-bold text-lg">
                        ¥{order.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">支付方式</span>
                      <span className="text-cyber-text">
                        {payMethod === 'package'
                          ? '套餐余额'
                          : payMethod === 'wechat'
                          ? '微信支付'
                          : payMethod === 'alipay'
                          ? '支付宝'
                          : '混合支付'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">完成时间</span>
                      <span className="text-cyber-text text-xs">
                        {order.completed_at
                          ? formatDate(order.completed_at, 'YYYY-MM-DD HH:mm:ss')
                          : '-'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBackToHome}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyber-accent to-cyber-success text-cyber-darker font-rajdhani font-bold text-base shadow-neon-cyan"
              >
                返回首页
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-4 py-4"
            >
              <div className="text-center mb-6">
                <p className="text-cyber-muted text-sm mb-1">支付金额</p>
                <motion.span
                  key="amount"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="font-rajdhani font-bold text-4xl text-cyber-accent"
                >
                  ¥{SWAP_PRICE.toFixed(2)}
                </motion.span>
              </div>

              {order && (
                <div className="bg-cyber-dark/50 rounded-xl border border-cyber-border p-4 mb-4">
                  <h3 className="font-rajdhani font-semibold text-cyber-text mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyber-accent" />
                    换电信息
                  </h3>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1 text-center">
                      <BatteryGauge soc={order.old_soc} size="md" showLabel={false} />
                      <p className="text-xs text-cyber-muted mt-1">换出电池</p>
                      <p className="text-xs font-mono text-cyber-muted">
                        {order.old_battery_id}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <Zap className="w-5 h-5 text-cyber-accent" />
                    </div>
                    <div className="flex-1 text-center">
                      <BatteryGauge soc={order.new_soc} size="md" showLabel={false} />
                      <p className="text-xs text-cyber-muted mt-1">换入电池</p>
                      <p className="text-xs font-mono text-cyber-success">
                        {order.new_battery_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-cyber-muted">
                    <MapPin className="w-4 h-4" />
                    <span>{order.cabinet_name}</span>
                  </div>
                </div>
              )}

              <div className="bg-cyber-dark/50 rounded-xl border border-cyber-border p-4 mb-6">
                <h3 className="font-rajdhani font-semibold text-cyber-text mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyber-accent" />
                  支付方式
                </h3>

                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => currentRider && currentRider.package_balance > 0 && setPayMethod('package')}
                    className={cn(
                      'w-full p-3 rounded-lg border flex items-center justify-between transition-all',
                      payMethod === 'package'
                        ? 'border-cyber-accent bg-cyber-accent/10'
                        : currentRider && currentRider.package_balance > 0
                        ? 'border-cyber-border bg-cyber-dark/30 hover:border-cyber-accent/50'
                        : 'border-cyber-border bg-cyber-dark/30 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-accent to-cyber-success flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-cyber-darker" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-cyber-text">套餐余额</p>
                        <p className="text-xs text-cyber-muted">
                          剩余 {currentRider?.package_balance || 0} 次
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                        payMethod === 'package'
                          ? 'border-cyber-accent bg-cyber-accent'
                          : 'border-cyber-muted'
                      )}
                    >
                      {payMethod === 'package' && (
                        <CheckCircle2 className="w-4 h-4 text-cyber-darker" />
                      )}
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setPayMethod('wechat')}
                    className={cn(
                      'w-full p-3 rounded-lg border flex items-center justify-between transition-all',
                      payMethod === 'wechat'
                        ? 'border-cyber-accent bg-cyber-accent/10'
                        : 'border-cyber-border bg-cyber-dark/30 hover:border-cyber-accent/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-500 font-bold text-sm">微</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-cyber-text">微信支付</p>
                        <p className="text-xs text-cyber-muted">推荐使用</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                        payMethod === 'wechat'
                          ? 'border-cyber-accent bg-cyber-accent'
                          : 'border-cyber-muted'
                      )}
                    >
                      {payMethod === 'wechat' && (
                        <CheckCircle2 className="w-4 h-4 text-cyber-darker" />
                      )}
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setPayMethod('alipay')}
                    className={cn(
                      'w-full p-3 rounded-lg border flex items-center justify-between transition-all',
                      payMethod === 'alipay'
                        ? 'border-cyber-accent bg-cyber-accent/10'
                        : 'border-cyber-border bg-cyber-dark/30 hover:border-cyber-accent/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-500 font-bold text-sm">支</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-cyber-text">支付宝</p>
                        <p className="text-xs text-cyber-muted">快捷支付</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                        payMethod === 'alipay'
                          ? 'border-cyber-accent bg-cyber-accent'
                          : 'border-cyber-muted'
                      )}
                    >
                      {payMethod === 'alipay' && (
                        <CheckCircle2 className="w-4 h-4 text-cyber-darker" />
                      )}
                    </div>
                  </motion.button>
                </div>
              </div>

              {(payMethod === 'package' || payMethod === 'mixed') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-cyber-accent/5 rounded-lg border border-cyber-accent/30 p-3 mb-6"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cyber-muted">套餐抵扣</span>
                    <span className="text-cyber-success font-medium">
                      - {getPackageDeduction()} 次
                    </span>
                  </div>
                  {payMethod === 'mixed' && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-cyber-muted">微信支付</span>
                      <span className="text-cyber-accent font-medium">
                        ¥{getWechatAmount().toFixed(2)}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isSuccess && (
        <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-cyber-border bg-cyber-dark/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-cyber-muted text-sm">应付金额</span>
            <span className="font-rajdhani font-bold text-2xl text-cyber-accent">
              ¥{SWAP_PRICE.toFixed(2)}
            </span>
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
                确认支付
              </>
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
