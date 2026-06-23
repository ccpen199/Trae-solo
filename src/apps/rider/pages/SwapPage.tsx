import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  UserCheck,
  DoorOpen,
  BatteryCharging,
  CheckCircle2,
  Zap,
  Battery,
  Award,
} from 'lucide-react'
import { SwapFlow } from '@shared/components/SwapFlow'
import { useCabinetStore } from '@shared/stores/cabinetStore'
import { useUserStore } from '@shared/stores/userStore'
import { useOrderStore } from '@shared/stores/orderStore'
import { BatteryGauge } from '@shared/components/BatteryGauge'
import { cn, formatDate, generateId } from '@shared/utils'
import { SWAP_PRICE } from '@shared/constants'
import type { SwapOrder } from '@shared/types'

const swapSteps = [
  { id: 1, title: '身份验证', description: '正在验证用户身份信息', icon: UserCheck },
  { id: 2, title: '弹开空仓', description: '检测到空仓，正在弹开仓门', icon: DoorOpen },
  { id: 3, title: '放入电池', description: '请将亏电电池放入空仓', icon: Battery },
  { id: 4, title: '电池检测', description: '正在检测电池状态和电量', icon: BatteryCharging },
  { id: 5, title: '开启满电仓', description: '正在为您开启满电电池仓', icon: Zap },
  { id: 6, title: '取出电池', description: '请取出满电电池并关闭仓门', icon: Award },
  { id: 7, title: '换电完成', description: '换电成功，祝您出行愉快', icon: CheckCircle2 },
]

export default function SwapPage() {
  const navigate = useNavigate()
  const { cabinetId } = useParams<{ cabinetId: string }>()
  const { getCabinetById } = useCabinetStore()
  const { currentRider } = useUserStore()
  const { addOrder } = useOrderStore()

  const cabinet = cabinetId ? getCabinetById(cabinetId) : null

  const [currentStep, setCurrentStep] = useState(1)
  const [isComplete, setIsComplete] = useState(false)
  const [oldSoc, setOldSoc] = useState(currentRider?.current_soc || 35)
  const [newSoc, setNewSoc] = useState(98)
  const [orderId, setOrderId] = useState<string>('')

  useEffect(() => {
    if (currentStep <= swapSteps.length && !isComplete) {
      const timer = setTimeout(() => {
        if (currentStep === 3) {
          setTimeout(() => {
            setCurrentStep((prev) => prev + 1)
          }, 500)
        } else if (currentStep === 6) {
          setTimeout(() => {
            setCurrentStep((prev) => prev + 1)
          }, 500)
        } else {
          setCurrentStep((prev) => prev + 1)
        }
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [currentStep, isComplete])

  useEffect(() => {
    if (currentStep > swapSteps.length && !isComplete) {
      setIsComplete(true)

      const order: SwapOrder = {
        order_id: generateId('ORD-'),
        rider_id: currentRider?.rider_id || '',
        rider_name: currentRider?.real_name || '',
        cabinet_id: cabinet?.cabinet_id || '',
        cabinet_name: cabinet?.name || '',
        old_battery_id: currentRider?.current_battery_id || 'BAT-OLD-0001',
        new_battery_id: 'BAT-NEW-0001',
        old_soc: oldSoc,
        new_soc: newSoc,
        amount: SWAP_PRICE,
        pay_method: 'package',
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }

      addOrder(order)
      setOrderId(order.order_id)
    }
  }, [currentStep, isComplete, cabinet, currentRider, oldSoc, newSoc, addOrder])

  useEffect(() => {
    if (isComplete && orderId) {
      const timer = setTimeout(() => {
        navigate(`/rider/payment/${orderId}`)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [isComplete, orderId, navigate])

  const getStepsStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'pending'
  }

  const handleBack = () => {
    navigate(-1)
  }

  const stepsWithStatus = swapSteps.map((step) => ({
    ...step,
    status: getStepsStatus(step.id) as 'completed' | 'current' | 'pending',
  }))

  const showBatteryAnimation = currentStep >= 3 && currentStep <= 6

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
          {cabinet?.name || '换电中'}
        </h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          <AnimatePresence mode="wait">
            {!isComplete ? (
              <motion.div
                key="swapping"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {showBatteryAnimation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center py-6"
                  >
                    <div className="flex items-center gap-6">
                      <motion.div
                        animate={
                          currentStep >= 3 && currentStep <= 4
                            ? { y: [0, -10, 0], opacity: [1, 0.8, 1] }
                            : {}
                        }
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-center"
                      >
                        <BatteryGauge soc={oldSoc} size="lg" showLabel={false} />
                        <p className="mt-2 text-sm text-cyber-muted">换出电池</p>
                      </motion.div>

                      <motion.div
                        animate={
                          currentStep >= 4 && currentStep <= 5
                            ? { opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }
                            : {}
                        }
                        transition={{ duration: 1, repeat: Infinity }}
                        className="flex flex-col items-center gap-1"
                      >
                        <Zap className="w-6 h-6 text-cyber-accent" />
                        <span className="text-xs text-cyber-accent font-rajdhani">
                          SWAP
                        </span>
                      </motion.div>

                      <motion.div
                        animate={
                          currentStep >= 5 && currentStep <= 6
                            ? { y: [0, -10, 0], opacity: [0.8, 1, 0.8] }
                            : { opacity: 0.5 }
                        }
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-center"
                      >
                        <BatteryGauge soc={newSoc} size="lg" showLabel={false} />
                        <p className="mt-2 text-sm text-cyber-muted">换入电池</p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {!showBatteryAnimation && (
                  <div className="flex items-center justify-center py-8">
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-cyber-accent/30"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="w-20 h-20 rounded-full bg-cyber-accent/10 border-2 border-cyber-accent flex items-center justify-center">
                        {(() => {
                          const Icon = swapSteps[currentStep - 1]?.icon || Zap
                          return <Icon className="w-10 h-10 text-cyber-accent" />
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center mb-4">
                  <motion.h2
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-rajdhani font-bold text-xl text-cyber-accent"
                  >
                    {swapSteps[currentStep - 1]?.title}
                  </motion.h2>
                  <motion.p
                    key={`desc-${currentStep}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-cyber-muted mt-1"
                  >
                    {swapSteps[currentStep - 1]?.description}
                  </motion.p>
                </div>

                <div className="bg-cyber-dark/50 rounded-xl border border-cyber-border p-4">
                  <SwapFlow steps={stepsWithStatus} />
                </div>

                {cabinet && (
                  <div className="bg-cyber-dark/30 rounded-lg border border-cyber-border/50 p-3">
                    <div className="flex items-center gap-2 text-sm text-cyber-muted">
                      <span>柜体编号：</span>
                      <span className="font-mono text-cyber-accent">{cabinet.cabinet_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-cyber-muted mt-1">
                      <span>位置：</span>
                      <span className="text-cyber-text">{cabinet.location}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="text-center py-8"
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
                  <div className="relative w-24 h-24 rounded-full bg-cyber-success/20 border-3 border-cyber-success flex items-center justify-center">
                    <CheckCircle2 className="w-14 h-14 text-cyber-success" />
                  </div>
                </div>

                <h2 className="font-rajdhani font-bold text-2xl text-cyber-success mb-2">
                  换电成功
                </h2>
                <p className="text-cyber-muted mb-6">
                  正在跳转到支付页面...
                </p>

                <div className="bg-cyber-dark/50 rounded-xl border border-cyber-border p-4 text-left">
                  <h3 className="font-rajdhani font-semibold text-cyber-text mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyber-accent" />
                    本次换电详情
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">换出电池</span>
                      <span className="text-cyber-text font-mono">
                        {currentRider?.current_battery_id} ({oldSoc}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">换入电池</span>
                      <span className="text-cyber-success font-mono">
                        BAT-NEW-0001 ({newSoc}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">换电柜</span>
                      <span className="text-cyber-text">{cabinet?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">费用</span>
                      <span className="text-cyber-accent font-rajdhani font-bold">
                        ¥{SWAP_PRICE.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">时间</span>
                      <span className="text-cyber-text text-xs">
                        {formatDate(new Date().toISOString(), 'YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
