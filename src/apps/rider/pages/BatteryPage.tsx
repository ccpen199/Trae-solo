import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Battery,
  Thermometer,
  Zap,
  Gauge,
  Clock,
  TrendingUp,
  Activity,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { useUserStore } from '@shared/stores/userStore'
import { useBatteryStore } from '@shared/stores/batteryStore'
import { BatteryGauge } from '@shared/components/BatteryGauge'
import { StatusBadge } from '@shared/components/StatusBadge'
import { DataCard } from '@shared/components/DataCard'
import { cn, formatDate, formatNumber, getSocColor } from '@shared/utils'
import { BATTERY_STATUS } from '@shared/constants'
import type { BatteryHealthDetail, ChargeRecord } from '@shared/types'

export default function BatteryPage() {
  const navigate = useNavigate()
  const { currentRider } = useUserStore()
  const { getBatteryById, getChargeRecords, getHealthDetail } = useBatteryStore()

  const [battery, setBattery] = useState<ReturnType<typeof getBatteryById>>(undefined)
  const [chargeRecords, setChargeRecords] = useState<ChargeRecord[]>([])
  const [healthDetail, setHealthDetail] = useState<BatteryHealthDetail | null>(null)

  useEffect(() => {
    if (currentRider?.current_battery_id) {
      const bat = getBatteryById(currentRider.current_battery_id)
      setBattery(bat)

      if (bat) {
        const records = getChargeRecords(bat.battery_id)
        setChargeRecords(records.slice(0, 10))

        const health = getHealthDetail(bat.battery_id)
        setHealthDetail(health)
      }
    }
  }, [currentRider, getBatteryById, getChargeRecords, getHealthDetail])

  const handleBack = () => {
    navigate(-1)
  }

  const getHealthLevelColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-cyber-success'
      case 'good':
        return 'text-cyber-accent'
      case 'fair':
        return 'text-cyber-warning'
      case 'poor':
        return 'text-cyber-danger'
      default:
        return 'text-cyber-muted'
    }
  }

  const getHealthLevelLabel = (level: string) => {
    switch (level) {
      case 'excellent':
        return '优秀'
      case 'good':
        return '良好'
      case 'fair':
        return '一般'
      case 'poor':
        return '较差'
      default:
        return '未知'
    }
  }

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

  const healthScore = battery?.health_score || 0
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (healthScore / 100) * circumference

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
          我的电池
        </h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {battery ? (
          <div className="px-4 py-4 space-y-4">
            <motion.div variants={itemVariants}>
              <div className="relative overflow-hidden rounded-2xl border border-cyber-border bg-gradient-to-br from-cyber-accent/10 via-cyber-dark to-cyber-darker p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-cyber-muted text-sm">电池编号</p>
                      <h2 className="font-mono font-bold text-xl text-cyber-accent">
                        {battery.battery_id}
                      </h2>
                    </div>
                    <StatusBadge
                      status={BATTERY_STATUS[battery.status as keyof typeof BATTERY_STATUS]?.label || '未知'}
                      color={
                        battery.status === 'in_use'
                          ? 'warning'
                          : battery.status === 'charging'
                          ? 'info'
                          : battery.status === 'standby'
                          ? 'success'
                          : 'danger'
                      }
                      size="sm"
                      pulse={battery.status === 'charging'}
                    />
                  </div>

                  <div className="flex items-center justify-center py-4">
                    <div className="relative">
                      <BatteryGauge soc={battery.current_soc} size="lg" showLabel={false} />
                    </div>
                  </div>

                  <div className="text-center mt-2">
                    <span
                      className={cn(
                        'text-3xl font-bold font-rajdhani',
                        getSocColor(battery.current_soc)
                      )}
                    >
                      {battery.current_soc}%
                    </span>
                    <p className="text-sm text-cyber-muted mt-1">当前电量</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-3 gap-2">
                <DataCard
                  title="电压"
                  value={formatNumber(battery.current_voltage, 1)}
                  unit="V"
                  icon={<Zap className="w-4 h-4" />}
                  color="cyan"
                  className="!p-3"
                />
                <DataCard
                  title="温度"
                  value={formatNumber(battery.current_temp, 1)}
                  unit="°C"
                  icon={<Thermometer className="w-4 h-4" />}
                  color={battery.current_temp > 30 ? 'orange' : 'green'}
                  className="!p-3"
                />
                <DataCard
                  title="容量"
                  value={battery.capacity}
                  unit="Ah"
                  icon={<Gauge className="w-4 h-4" />}
                  color="green"
                  className="!p-3"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-cyber-dark/50 rounded-xl border border-cyber-border p-4">
                <h3 className="font-rajdhani font-semibold text-cyber-text mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyber-accent" />
                  电池健康度
                </h3>

                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-cyber-border"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className={cn(
                          healthScore >= 80
                            ? 'text-cyber-success'
                            : healthScore >= 60
                            ? 'text-cyber-accent'
                            : healthScore >= 40
                            ? 'text-cyber-warning'
                            : 'text-cyber-danger'
                        )}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        style={{ strokeDasharray: circumference }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className={cn(
                          'text-2xl font-bold font-rajdhani',
                          healthScore >= 80
                            ? 'text-cyber-success'
                            : healthScore >= 60
                            ? 'text-cyber-accent'
                            : healthScore >= 40
                            ? 'text-cyber-warning'
                            : 'text-cyber-danger'
                        )}
                      >
                        {healthScore}%
                      </span>
                      <span className="text-xs text-cyber-muted">健康度</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-cyber-muted">健康等级</span>
                      <span
                        className={cn(
                          'font-medium',
                          healthDetail && getHealthLevelColor(healthDetail.health_level)
                        )}
                      >
                        {healthDetail && getHealthLevelLabel(healthDetail.health_level)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cyber-muted">循环次数</span>
                      <span className="text-cyber-text font-mono">
                        {battery.cycle_count} 次
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cyber-muted">容量保持率</span>
                      <span className="text-cyber-text">
                        {healthDetail?.capacity_retention || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cyber-muted">预计剩余循环</span>
                      <span className="text-cyber-text font-mono">
                        {healthDetail?.estimated_remaining_cycles || 0} 次
                      </span>
                    </div>
                  </div>
                </div>

                {healthDetail && healthDetail.health_level === 'poor' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-3 rounded-lg bg-cyber-danger/10 border border-cyber-danger/30"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-cyber-danger flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-cyber-danger font-medium">电池健康度较低</p>
                        <p className="text-xs text-cyber-muted mt-1">
                          建议尽快更换电池，以确保出行安全
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-cyber-dark/50 rounded-xl border border-cyber-border p-4">
                <h3 className="font-rajdhani font-semibold text-cyber-text mb-3 flex items-center gap-2">
                  <Battery className="w-5 h-5 text-cyber-accent" />
                  基本信息
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-muted">电池型号</span>
                    <span className="text-cyber-text font-mono">{battery.model}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-muted">标称电压</span>
                    <span className="text-cyber-text">{battery.nominal_voltage} V</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-muted">国标标准</span>
                    <span className="text-cyber-text">{battery.gbt_standard}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-muted">生产日期</span>
                    <span className="text-cyber-text">
                      {formatDate(battery.manufacture_date, 'YYYY-MM-DD')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-muted">首次使用</span>
                    <span className="text-cyber-text">
                      {formatDate(battery.first_use_date, 'YYYY-MM-DD')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-muted">预计报废日期</span>
                    <span className="text-cyber-warning">
                      {formatDate(battery.estimated_scrap_date, 'YYYY-MM-DD')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-cyber-dark/50 rounded-xl border border-cyber-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-rajdhani font-semibold text-cyber-text flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyber-accent" />
                    充放电记录
                  </h3>
                  <button className="text-xs text-cyber-accent">查看全部</button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {chargeRecords.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-lg bg-cyber-darker/50 border border-cyber-border/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-cyber-muted font-mono">
                          {formatDate(record.start_time, 'MM-DD HH:mm')}
                        </span>
                        <span
                          className={cn(
                            'text-xs font-medium',
                            record.is_full_cycle
                              ? 'text-cyber-success'
                              : 'text-cyber-muted'
                          )}
                        >
                          {record.is_full_cycle ? '满循环' : '部分充电'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Battery className="w-4 h-4 text-cyber-warning" />
                          <span className="text-sm text-cyber-text">
                            {record.start_soc}%
                          </span>
                        </div>
                        <TrendingUp className="w-4 h-4 text-cyber-success" />
                        <div className="flex items-center gap-1">
                          <Battery className="w-4 h-4 text-cyber-success" />
                          <span className="text-sm text-cyber-success">
                            {record.end_soc}%
                          </span>
                        </div>
                        <div className="flex-1 text-right">
                          <span className="text-xs text-cyber-muted">
                            +{formatNumber(record.charge_capacity, 1)} Ah
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-cyber-border/30">
                        <div className="flex items-center gap-1 text-xs text-cyber-muted">
                          <Thermometer className="w-3 h-3" />
                          <span>均温 {formatNumber(record.avg_temp, 1)}°C</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-cyber-muted">
                          <Zap className="w-3 h-3" />
                          <span>
                            {formatNumber(record.end_voltage, 1)}V
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-cyber-muted/10 flex items-center justify-center mx-auto mb-4">
                <Battery className="w-10 h-10 text-cyber-muted" />
              </div>
              <p className="text-cyber-muted">暂无使用中的电池</p>
              <p className="text-sm text-cyber-muted/60 mt-1">
                扫码换电后即可查看电池信息
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
