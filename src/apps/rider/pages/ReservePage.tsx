import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Lock,
  MapPin,
  Battery,
  Zap,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
} from 'lucide-react'
import { useCabinetStore } from '@shared/stores/cabinetStore'
import { useOrderStore } from '@shared/stores/orderStore'
import { useUserStore } from '@shared/stores/userStore'
import { BatteryGauge } from '@shared/components/BatteryGauge'
import { StatusBadge } from '@shared/components/StatusBadge'
import { cn, formatDate, calculateDistance, generateId, getSocColor } from '@shared/utils'
import { RESERVATION_DURATION, CABINET_STATUS } from '@shared/constants'
import type { Cabinet, CabinetSlot, Reservation } from '@shared/types'

export default function ReservePage() {
  const navigate = useNavigate()
  const { cabinets } = useCabinetStore()
  const { getActiveReservation, addReservation, cancelReservation, reservations } = useOrderStore()
  const { currentRider } = useUserStore()

  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<CabinetSlot | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [activeReservation, setActiveReservation] = useState<Reservation | undefined>()

  const userLat = 39.9892
  const userLng = 116.3172

  const availableCabinets = cabinets
    .filter((c) => c.status === 'running' && c.full_batteries > 0)
    .map((cabinet) => ({
      ...cabinet,
      distance: calculateDistance(userLat, userLng, cabinet.lat, cabinet.lng),
    }))
    .sort((a, b) => a.distance - b.distance)

  useEffect(() => {
    const reservation = getActiveReservation()
    setActiveReservation(reservation)

    if (reservation) {
      const expireTime = new Date(reservation.expire_time).getTime()
      const now = Date.now()
      setTimeLeft(Math.max(0, Math.floor((expireTime - now) / 1000)))
    }
  }, [getActiveReservation, reservations])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft])

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleBack = () => {
    if (selectedCabinet && !activeReservation) {
      setSelectedCabinet(null)
      setSelectedSlot(null)
    } else {
      navigate(-1)
    }
  }

  const handleCabinetSelect = (cabinet: Cabinet) => {
    setSelectedCabinet(cabinet)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (slot: CabinetSlot) => {
    if (slot.status === 'occupied' && slot.soc && slot.soc >= 90) {
      setSelectedSlot(slot)
    }
  }

  const handleConfirmReservation = () => {
    if (!selectedCabinet || !selectedSlot || !currentRider) return

    const reservation: Reservation = {
      reservation_id: generateId('RES-'),
      rider_id: currentRider.rider_id,
      cabinet_id: selectedCabinet.cabinet_id,
      cabinet_name: selectedCabinet.name,
      battery_id: selectedSlot.battery_id || '',
      expire_time: new Date(Date.now() + RESERVATION_DURATION * 60 * 1000).toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
    }

    addReservation(reservation)
    setActiveReservation(reservation)
    setTimeLeft(RESERVATION_DURATION * 60)
  }

  const handleCancelReservation = () => {
    if (activeReservation) {
      cancelReservation(activeReservation.reservation_id)
      setActiveReservation(undefined)
      setTimeLeft(0)
      setSelectedCabinet(null)
      setSelectedSlot(null)
    }
  }

  const getFullBatterySlots = (cabinet: Cabinet) => {
    return cabinet.slots.filter((slot) => slot.status === 'occupied' && slot.soc && slot.soc >= 90)
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
          预约锁电
        </h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeReservation ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-4 py-6"
            >
              <div className="text-center mb-6">
                <div className="relative inline-flex mb-4">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-cyber-accent/30"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <div className="relative w-20 h-20 rounded-full bg-cyber-accent/20 border-2 border-cyber-accent flex items-center justify-center">
                    <Lock className="w-10 h-10 text-cyber-accent" />
                  </div>
                </div>
                <h2 className="font-rajdhani font-bold text-xl text-cyber-accent mb-1">
                  已预约锁定
                </h2>
                <p className="text-cyber-muted text-sm">电池已为您保留，请尽快取电</p>
              </div>

              <div className="bg-cyber-dark/50 rounded-xl border border-cyber-accent/30 p-4 mb-4">
                <div className="flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-cyber-accent mr-2" />
                  <span className="text-cyber-muted">剩余时间</span>
                </div>
                <motion.div
                  key={timeLeft}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <span
                    className={cn(
                      'font-mono text-4xl font-bold',
                      timeLeft < 300 ? 'text-cyber-danger' : 'text-cyber-accent'
                    )}
                  >
                    {formatTimeLeft(timeLeft)}
                  </span>
                </motion.div>
                <div className="mt-3 h-2 bg-cyber-border rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      timeLeft < 300 ? 'bg-cyber-danger' : 'bg-cyber-accent'
                    )}
                    initial={false}
                    animate={{ width: `${(timeLeft / (RESERVATION_DURATION * 60)) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              <div className="bg-cyber-dark/30 rounded-xl border border-cyber-border p-4 mb-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-cyber-text">{activeReservation.cabinet_name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-cyber-muted">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {cabinets.find((c) => c.cabinet_id === activeReservation.cabinet_id)?.location}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status="已锁定" color="info" size="sm" pulse />
                </div>
                <div className="flex items-center gap-3 p-3 bg-cyber-darker/50 rounded-lg">
                  <BatteryGauge soc={95} size="md" showLabel={false} />
                  <div>
                    <p className="text-sm text-cyber-text font-mono">
                      {activeReservation.battery_id}
                    </p>
                    <p className="text-xs text-cyber-muted">满电电池 · 约95%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/rider/swap/${activeReservation.cabinet_id}`)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyber-accent to-cyber-success text-cyber-darker font-rajdhani font-bold text-base shadow-neon-cyan flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  立即去换电
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancelReservation}
                  className="w-full py-3.5 px-4 rounded-xl border border-cyber-danger/50 bg-cyber-danger/10 text-cyber-danger font-rajdhani font-bold text-base flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  取消预约
                </motion.button>
              </div>
            </motion.div>
          ) : selectedCabinet ? (
            <motion.div
              key="slots"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 py-4"
            >
              <div className="mb-4 p-3 bg-cyber-dark/50 rounded-lg border border-cyber-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-cyber-text">{selectedCabinet.name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-cyber-muted">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedCabinet.location}</span>
                    </div>
                  </div>
                  <StatusBadge
                    status={CABINET_STATUS[selectedCabinet.status as keyof typeof CABINET_STATUS]?.label || '运行中'}
                    color={selectedCabinet.status === 'running' ? 'success' : 'warning'}
                    size="sm"
                    pulse={selectedCabinet.status === 'running'}
                  />
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-cyber-border/50">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-cyber-success" />
                    <span className="text-sm text-cyber-text">
                      <span className="font-bold text-cyber-success">{selectedCabinet.full_batteries}</span>
                      <span className="text-cyber-muted"> / {selectedCabinet.total_slots} 满电</span>
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="font-rajdhani font-semibold text-cyber-text mb-3 flex items-center gap-2">
                <Battery className="w-5 h-5 text-cyber-accent" />
                选择满电电池
              </h3>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {selectedCabinet.slots.map((slot) => {
                  const isFull = slot.status === 'occupied' && slot.soc && slot.soc >= 90
                  const isSelected = selectedSlot?.slot_number === slot.slot_number

                  return (
                    <motion.button
                      key={slot.slot_number}
                      whileHover={isFull ? { scale: 1.05 } : {}}
                      whileTap={isFull ? { scale: 0.95 } : {}}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={!isFull}
                      className={cn(
                        'aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-all',
                        isSelected
                          ? 'border-cyber-accent bg-cyber-accent/20 shadow-neon-cyan'
                          : isFull
                          ? 'border-cyber-success/50 bg-cyber-success/10 hover:border-cyber-success cursor-pointer'
                          : 'border-cyber-border bg-cyber-dark/30 opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className="text-xs text-cyber-muted font-mono">
                        {slot.slot_number}号
                      </span>
                      {slot.soc !== undefined && slot.status !== 'empty' && (
                        <span className={cn('text-sm font-bold font-rajdhani', getSocColor(slot.soc))}>
                          {slot.soc}%
                        </span>
                      )}
                      {slot.status === 'empty' && (
                        <span className="text-xs text-cyber-muted">空</span>
                      )}
                      {slot.status === 'charging' && (
                        <span className="text-xs text-cyber-accent">充</span>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {selectedSlot && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-cyber-dark/50 rounded-xl border border-cyber-border p-4 mb-4"
                >
                  <h4 className="font-medium text-cyber-text mb-3">已选电池</h4>
                  <div className="flex items-center gap-4">
                    <BatteryGauge soc={selectedSlot.soc || 0} size="lg" showLabel={false} />
                    <div className="flex-1">
                      <p className="font-mono text-cyber-accent text-sm">
                        {selectedSlot.battery_id}
                      </p>
                      <p className="text-xs text-cyber-muted mt-1">
                        {selectedSlot.slot_number}号仓位 · SOC {selectedSlot.soc}%
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-cyber-success" />
                  </div>
                </motion.div>
              )}

              <motion.button
                whileHover={selectedSlot ? { scale: 1.02 } : {}}
                whileTap={selectedSlot ? { scale: 0.98 } : {}}
                onClick={handleConfirmReservation}
                disabled={!selectedSlot}
                className={cn(
                  'w-full py-3.5 px-4 rounded-xl font-rajdhani font-bold text-base flex items-center justify-center gap-2 transition-all',
                  selectedSlot
                    ? 'bg-gradient-to-r from-cyber-accent to-cyber-success text-cyber-darker shadow-neon-cyan'
                    : 'bg-cyber-border text-cyber-muted cursor-not-allowed'
                )}
              >
                <Lock className="w-5 h-5" />
                确认预约锁电
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="cabinets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-4 py-4"
            >
              <div className="bg-cyber-accent/10 border border-cyber-accent/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-cyber-accent">
                  <Lock className="w-4 h-4 inline mr-1 -mt-0.5" />
                  预约后电池将为您保留 {RESERVATION_DURATION} 分钟，请尽快取电
                </p>
              </div>

              <h3 className="font-rajdhani font-semibold text-cyber-text mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyber-accent" />
                选择换电柜
              </h3>

              <div className="space-y-2">
                {availableCabinets.map((cabinet) => (
                  <motion.button
                    key={cabinet.cabinet_id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleCabinetSelect(cabinet)}
                    className="w-full p-4 rounded-xl border border-cyber-border bg-cyber-dark/50 text-left hover:border-cyber-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-cyber-text">{cabinet.name}</span>
                          <StatusBadge
                            status={CABINET_STATUS[cabinet.status as keyof typeof CABINET_STATUS]?.label || '运行中'}
                            color="success"
                            size="sm"
                            pulse
                          />
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-cyber-muted">
                          <MapPin className="w-3 h-3" />
                          <span>{cabinet.distance.toFixed(2)} km</span>
                          <span className="mx-1">·</span>
                          <span className="truncate max-w-[180px]">{cabinet.location}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-cyber-muted flex-shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-cyber-border/50">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-cyber-success" />
                        <span className="text-sm">
                          <span className="font-bold text-cyber-success">{cabinet.full_batteries}</span>
                          <span className="text-cyber-muted"> 满电</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Battery className="w-4 h-4 text-cyber-accent" />
                        <span className="text-sm text-cyber-muted">
                          {cabinet.charging_batteries} 充电中
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-cyber-muted" />
                        <span className="text-sm text-cyber-muted">
                          {cabinet.total_slots} 仓位
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
