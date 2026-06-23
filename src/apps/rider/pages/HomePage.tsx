import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Battery,
  MapPin,
  QrCode,
  Clock,
  Zap,
  Navigation,
  ChevronRight,
  Lock,
} from 'lucide-react'
import { useUserStore } from '@shared/stores/userStore'
import { useCabinetStore } from '@shared/stores/cabinetStore'
import { BatteryGauge } from '@shared/components/BatteryGauge'
import { StatusBadge } from '@shared/components/StatusBadge'
import { cn, calculateDistance, getSocColor } from '@shared/utils'
import { CABINET_STATUS } from '@shared/constants'
import type { Cabinet } from '@shared/types'

export default function HomePage() {
  const navigate = useNavigate()
  const { currentRider } = useUserStore()
  const { cabinets } = useCabinetStore()

  const userLat = 39.9892
  const userLng = 116.3172

  const cabinetsWithDistance = cabinets
    .map((cabinet) => ({
      ...cabinet,
      distance: calculateDistance(userLat, userLng, cabinet.lat, cabinet.lng),
    }))
    .sort((a, b) => a.distance - b.distance)

  const nearCabinets = cabinetsWithDistance.slice(0, 5)

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

  const handleCabinetClick = (cabinet: Cabinet) => {
    navigate(`/rider/swap/${cabinet.cabinet_id}`)
  }

  const handleScan = () => {
    navigate('/rider/scan')
  }

  const handleReserve = () => {
    navigate('/rider/reserve')
  }

  const getStatusColor = (status: string) => {
    const statusInfo = CABINET_STATUS[status as keyof typeof CABINET_STATUS]
    return statusInfo?.color || '#00E5FF'
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success'
      case 'warning':
        return 'warning'
      case 'fault':
        return 'danger'
      default:
        return 'info'
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col bg-cyber-darker"
    >
      <motion.div variants={itemVariants} className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden rounded-xl border border-cyber-border bg-gradient-to-br from-cyber-accent/10 to-transparent p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyber-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="w-5 h-5 text-cyber-accent" />
                <span className="text-sm text-cyber-muted">当前电量</span>
              </div>
              <BatteryGauge
                soc={currentRider?.current_soc || 0}
                size="md"
                showLabel={false}
              />
              <span
                className={cn(
                  'text-2xl font-bold font-rajdhani mt-2 block',
                  getSocColor(currentRider?.current_soc || 0)
                )}
              >
                {currentRider?.current_soc}%
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-cyber-border bg-gradient-to-br from-cyber-success/10 to-transparent p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyber-success/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-cyber-success" />
                <span className="text-sm text-cyber-muted">套餐余额</span>
              </div>
              <span className="text-3xl font-bold font-rajdhani text-cyber-success">
                {currentRider?.package_balance}
              </span>
              <span className="text-sm text-cyber-muted ml-1">次</span>
              <div className="mt-2 text-xs text-cyber-muted/70">
                本月已换 {Math.floor((currentRider?.total_swaps || 0) / 12)} 次
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex-1 relative px-4 py-2 min-h-0">
        <div className="relative h-full min-h-[200px] rounded-xl border border-cyber-border overflow-hidden bg-cyber-dark">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 229, 255, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 229, 255, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-cyber-darker/50 via-transparent to-cyber-darker/80" />

          {nearCabinets.map((cabinet, index) => {
            const x = 20 + (index * 60) % 70
            const y = 25 + (index * 35) % 50

            return (
              <motion.div
                key={cabinet.cabinet_id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{ left: `${x}%`, top: `${y}%` }}
                whileHover={{ scale: 1.2 }}
                onClick={() => handleCabinetClick(cabinet)}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: getStatusColor(cabinet.status),
                    width: 20,
                    height: 20,
                    left: -10,
                    top: -10,
                  }}
                  animate={{
                    scale: [1, 2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <div
                  className="relative w-5 h-5 rounded-full border-2 border-white/80 shadow-lg"
                  style={{ backgroundColor: getStatusColor(cabinet.status) }}
                />
                {index === 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-cyber-accent text-cyber-darker text-xs font-bold">
                    最近
                  </div>
                )}
              </motion.div>
            )
          })}

          <motion.div
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-cyber-accent border-2 border-white shadow-neon-cyan" />
              <div className="absolute -inset-2 rounded-full border border-cyber-accent/30" />
              <div className="absolute -inset-4 rounded-full border border-cyber-accent/20" />
            </div>
          </motion.div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-darker/80 backdrop-blur border border-cyber-border">
            <Navigation className="w-4 h-4 text-cyber-accent" />
            <span className="text-xs text-cyber-muted">附近 {nearCabinets.length} 个换电站</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyber-accent" />
            <h3 className="font-rajdhani font-semibold text-cyber-text">附近换电柜</h3>
          </div>
          <button className="text-xs text-cyber-accent flex items-center gap-0.5">
            查看全部
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {nearCabinets.map((cabinet) => (
            <motion.div
              key={cabinet.cabinet_id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleCabinetClick(cabinet)}
              className="p-3 rounded-lg border border-cyber-border bg-cyber-dark/50 cursor-pointer hover:border-cyber-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-cyber-text text-sm">
                      {cabinet.name}
                    </span>
                    <StatusBadge
                      status={CABINET_STATUS[cabinet.status as keyof typeof CABINET_STATUS]?.label || '未知'}
                      color={getStatusBadgeColor(cabinet.status) as any}
                      size="sm"
                      pulse={cabinet.status === 'running'}
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-cyber-muted">
                    <MapPin className="w-3 h-3" />
                    <span>{cabinet.distance.toFixed(2)} km</span>
                    <span className="mx-1">·</span>
                    <span>{cabinet.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-cyber-success" />
                    <span className="font-rajdhani font-bold text-cyber-success">
                      {cabinet.full_batteries}
                    </span>
                  </div>
                  <span className="text-xs text-cyber-muted">满电电池</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-cyber-border/50">
                <div className="flex items-center gap-1 text-xs text-cyber-muted">
                  <Clock className="w-3 h-3" />
                  <span>{cabinet.total_slots} 仓位</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-cyber-muted">
                  <Battery className="w-3 h-3" />
                  <span>{cabinet.charging_batteries} 充电中</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="px-4 pb-4 pt-2 flex gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleScan}
          className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyber-accent to-cyber-success text-cyber-darker font-rajdhani font-bold text-base shadow-neon-cyan flex items-center justify-center gap-2"
        >
          <QrCode className="w-5 h-5" />
          扫码换电
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReserve}
          className="flex-1 py-3.5 px-4 rounded-xl border border-cyber-accent/50 bg-cyber-accent/10 text-cyber-accent font-rajdhani font-bold text-base flex items-center justify-center gap-2 hover:bg-cyber-accent/20 transition-colors"
        >
          <Lock className="w-5 h-5" />
          预约锁电
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
