import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import {
  Battery,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  Calendar,
  Gauge,
  Cpu,
} from 'lucide-react'
import { StatusBadge } from '@shared/components/StatusBadge'
import { BatteryGauge } from '@shared/components/BatteryGauge'
import { useBatteryStore } from '@shared/stores/batteryStore'
import { cn, formatDate, formatNumber } from '@shared/utils'
import { BATTERY_STATUS, GBT_36276_STANDARD } from '@shared/constants'
import type { Battery as BatteryType, ChargeRecord } from '@shared/types'
import type { EChartsOption } from 'echarts'

const statusFilters = [
  { value: 'all', label: '全部状态' },
  { value: 'charging', label: '充电中' },
  { value: 'standby', label: '待使用' },
  { value: 'in_use', label: '使用中' },
  { value: 'maintenance', label: '维护中' },
]

const healthFilters = [
  { value: 'all', label: '全部健康度' },
  { value: 'excellent', label: '优秀 (≥90)' },
  { value: 'good', label: '良好 (75-89)' },
  { value: 'fair', label: '一般 (60-74)' },
  { value: 'poor', label: '较差 (<60)' },
]

export default function BatteriesPage() {
  const { batteries, selectedBattery, setSelectedBattery, getChargeRecords, getHealthDetail } =
    useBatteryStore()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [healthFilter, setHealthFilter] = useState('all')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showHealthDropdown, setShowHealthDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const filteredBatteries = useMemo(() => {
    return batteries.filter((battery) => {
      const matchesSearch =
        battery.battery_id.toLowerCase().includes(searchText.toLowerCase()) ||
        battery.model.toLowerCase().includes(searchText.toLowerCase())
      const matchesStatus = statusFilter === 'all' || battery.status === statusFilter

      let matchesHealth = true
      if (healthFilter === 'excellent') matchesHealth = battery.health_score >= 90
      else if (healthFilter === 'good')
        matchesHealth = battery.health_score >= 75 && battery.health_score < 90
      else if (healthFilter === 'fair')
        matchesHealth = battery.health_score >= 60 && battery.health_score < 75
      else if (healthFilter === 'poor') matchesHealth = battery.health_score < 60

      return matchesSearch && matchesStatus && matchesHealth
    })
  }, [batteries, searchText, statusFilter, healthFilter])

  const paginatedBatteries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredBatteries.slice(start, start + pageSize)
  }, [filteredBatteries, currentPage])

  const totalPages = Math.ceil(filteredBatteries.length / pageSize)

  const handleViewDetail = (battery: BatteryType) => {
    setSelectedBattery(battery)
  }

  const handleCloseDetail = () => {
    setSelectedBattery(null)
  }

  const healthDetail = useMemo(() => {
    if (!selectedBattery) return null
    return getHealthDetail(selectedBattery.battery_id)
  }, [selectedBattery, getHealthDetail])

  const chargeRecords = useMemo(() => {
    if (!selectedBattery) return []
    return getChargeRecords(selectedBattery.battery_id)
  }, [selectedBattery, getChargeRecords])

  const radarOption: EChartsOption | null = useMemo(() => {
    if (!healthDetail) return null

    const indicators = [
      { name: '容量保持率', max: 100 },
      { name: '循环寿命', max: 100 },
      { name: '内阻稳定性', max: 100 },
      { name: '电压稳定性', max: 100 },
      { name: '温度适应性', max: 100 },
      { name: '充放电效率', max: 100 },
    ]

    const values = [
      healthDetail.capacity_retention,
      100 - (healthDetail.total_cycles / 1000) * 20,
      100 - healthDetail.resistance_increase_rate * 2,
      100 - healthDetail.voltage_decay_rate * 3,
      85,
      92,
    ]

    return {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(10, 22, 40, 0.9)',
        borderColor: '#1A3656',
        textStyle: { color: '#E6F4FF' },
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: '#4A6484',
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: '#1A3656' },
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(0, 229, 255, 0.02)', 'rgba(0, 229, 255, 0.05)'],
          },
        },
        axisLine: {
          lineStyle: { color: '#1A3656' },
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: values,
              name: '健康评分',
              areaStyle: {
                color: 'rgba(0, 229, 255, 0.2)',
              },
              lineStyle: {
                color: '#00E5FF',
                width: 2,
              },
              itemStyle: {
                color: '#00E5FF',
              },
            },
          ],
        },
      ],
    }
  }, [healthDetail])

  const voltageDecayOption: EChartsOption | null = useMemo(() => {
    if (!chargeRecords || chargeRecords.length === 0) return null

    const records = [...chargeRecords].reverse()
    const dates = records.map((r) => formatDate(r.start_time, 'MM-DD'))
    const voltages = records.map((r) => Number(r.end_voltage.toFixed(2)))

    const predictCount = 5
    const lastVoltage = voltages[voltages.length - 1]
    const decayRate = healthDetail ? healthDetail.voltage_decay_rate / 100 : 0.01
    const predictedVoltages = []
    for (let i = 1; i <= predictCount; i++) {
      predictedVoltages.push(Number((lastVoltage - decayRate * i).toFixed(2)))
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 22, 40, 0.9)',
        borderColor: '#1A3656',
        textStyle: { color: '#E6F4FF' },
      },
      legend: {
        data: ['实际电压', '预测电压'],
        textStyle: { color: '#4A6484', fontSize: 11 },
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: [...dates, ...Array(predictCount).fill('')],
        axisLine: { lineStyle: { color: '#1A3656' } },
        axisLabel: { color: '#4A6484', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        min: 55,
        max: 70,
        axisLine: { show: false },
        axisLabel: { color: '#4A6484', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1A3656', type: 'dashed' } },
      },
      series: [
        {
          name: '实际电压',
          type: 'line',
          smooth: true,
          data: voltages,
          lineStyle: { color: '#00E5FF', width: 2 },
          itemStyle: { color: '#00E5FF' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 229, 255, 0.3)' },
                { offset: 1, color: 'rgba(0, 229, 255, 0.02)' },
              ],
            },
          },
        },
        {
          name: '预测电压',
          type: 'line',
          smooth: true,
          data: [...Array(voltages.length - 1).fill(null), lastVoltage, ...predictedVoltages],
          lineStyle: { color: '#FFAA00', width: 2, type: 'dashed' },
          itemStyle: { color: '#FFAA00' },
        },
      ],
    }
  }, [chargeRecords, healthDetail])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-rajdhani text-white">电池管理</h1>
          <p className="text-cyber-muted text-sm mt-1">
            共 {batteries.length} 块电池，{filteredBatteries.length} 块符合筛选条件
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-cyber-accent/10 border border-cyber-accent/50 text-cyber-accent rounded-lg hover:bg-cyber-accent/20 transition-colors font-medium text-sm">
            导出数据
          </button>
          <button className="px-4 py-2 bg-cyber-accent text-cyber-darker rounded-lg hover:bg-cyber-accent/90 transition-colors font-medium text-sm">
            录入电池
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
            <input
              type="text"
              placeholder="搜索电池编号、型号..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-10 pl-10 pr-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/30 transition-all"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown)
                setShowHealthDropdown(false)
              }}
              className="h-10 px-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white flex items-center gap-2 hover:border-cyber-accent/50 transition-colors"
            >
              <Filter className="w-4 h-4 text-cyber-muted" />
              <span>{statusFilters.find((f) => f.value === statusFilter)?.label}</span>
              {showStatusDropdown ? (
                <ChevronUp className="w-4 h-4 text-cyber-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-cyber-muted" />
              )}
            </button>
            <AnimatePresence>
              {showStatusDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 w-36 bg-cyber-dark border border-cyber-border rounded-lg shadow-xl z-10 overflow-hidden"
                >
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setStatusFilter(filter.value)
                        setCurrentPage(1)
                        setShowStatusDropdown(false)
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-cyber-light/30 transition-colors',
                        statusFilter === filter.value
                          ? 'text-cyber-accent bg-cyber-accent/10'
                          : 'text-gray-300'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowHealthDropdown(!showHealthDropdown)
                setShowStatusDropdown(false)
              }}
              className="h-10 px-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white flex items-center gap-2 hover:border-cyber-accent/50 transition-colors"
            >
              <Activity className="w-4 h-4 text-cyber-muted" />
              <span>{healthFilters.find((f) => f.value === healthFilter)?.label}</span>
              {showHealthDropdown ? (
                <ChevronUp className="w-4 h-4 text-cyber-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-cyber-muted" />
              )}
            </button>
            <AnimatePresence>
              {showHealthDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 w-40 bg-cyber-dark border border-cyber-border rounded-lg shadow-xl z-10 overflow-hidden"
                >
                  {healthFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setHealthFilter(filter.value)
                        setCurrentPage(1)
                        setShowHealthDropdown(false)
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-cyber-light/30 transition-colors',
                        healthFilter === filter.value
                          ? 'text-cyber-accent bg-cyber-accent/10'
                          : 'text-gray-300'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 电池列表 */}
      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border">
                <th className="px-5 py-3 text-left text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  电池信息
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  电量
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  健康度
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  循环次数
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  电压
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  温度
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  状态
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50">
              {paginatedBatteries.map((battery, index) => (
                <motion.tr
                  key={battery.battery_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-cyber-light/20 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          battery.status === 'standby'
                            ? 'bg-cyber-success/20 text-cyber-success'
                            : battery.status === 'charging'
                            ? 'bg-cyber-accent/20 text-cyber-accent'
                            : battery.status === 'in_use'
                            ? 'bg-cyber-warning/20 text-cyber-warning'
                            : 'bg-cyber-danger/20 text-cyber-danger'
                        )}
                      >
                        <Battery className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-white font-mono">
                          {battery.battery_id}
                        </p>
                        <p className="text-xs text-cyber-muted">{battery.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <BatteryGauge soc={battery.current_soc} size="sm" />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'text-lg font-bold font-rajdhani',
                          battery.health_score >= 90
                            ? 'text-cyber-success'
                            : battery.health_score >= 75
                            ? 'text-cyber-accent'
                            : battery.health_score >= 60
                            ? 'text-cyber-warning'
                            : 'text-cyber-danger'
                        )}
                      >
                        {battery.health_score}
                      </div>
                      <div className="w-16 h-1.5 bg-cyber-border rounded-full mt-1 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            battery.health_score >= 90
                              ? 'bg-cyber-success'
                              : battery.health_score >= 75
                              ? 'bg-cyber-accent'
                              : battery.health_score >= 60
                              ? 'bg-cyber-warning'
                              : 'bg-cyber-danger'
                          )}
                          style={{ width: `${battery.health_score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-mono text-white">{battery.cycle_count}</span>
                    <span className="text-xs text-cyber-muted ml-1">次</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-mono text-white">
                      {formatNumber(battery.current_voltage, 1)}
                    </span>
                    <span className="text-xs text-cyber-muted ml-1">V</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={cn(
                        'font-mono',
                        battery.current_temp > 30 ? 'text-cyber-warning' : 'text-white'
                      )}
                    >
                      {battery.current_temp}
                    </span>
                    <span className="text-xs text-cyber-muted ml-1">°C</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <StatusBadge
                        status={BATTERY_STATUS[battery.status].label}
                        color={
                          battery.status === 'standby'
                            ? 'success'
                            : battery.status === 'charging'
                            ? 'info'
                            : battery.status === 'in_use'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        pulse={battery.status === 'charging'}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleViewDetail(battery)}
                        className="px-3 py-1.5 text-sm text-cyber-accent hover:bg-cyber-accent/10 rounded transition-colors"
                      >
                        详情
                      </button>
                      <button className="px-3 py-1.5 text-sm text-cyber-muted hover:text-white hover:bg-cyber-light/30 rounded transition-colors">
                        维护
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-cyber-border flex items-center justify-between">
            <span className="text-sm text-cyber-muted">
              共 {filteredBatteries.length} 条记录，第 {currentPage} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-cyber-border rounded hover:border-cyber-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-8 h-8 text-sm rounded transition-colors',
                    currentPage === page
                      ? 'bg-cyber-accent text-cyber-darker font-medium'
                      : 'text-gray-300 hover:bg-cyber-light/30'
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-cyber-border rounded hover:border-cyber-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情抽屉 */}
      <AnimatePresence>
        {selectedBattery && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleCloseDetail}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-cyber-dark border-l border-cyber-border z-50 overflow-hidden flex flex-col"
            >
              {/* 头部 */}
              <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
                    <Battery className="w-6 h-6 text-cyber-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-rajdhani text-white">
                      电池详情
                    </h2>
                    <p className="text-sm text-cyber-muted font-mono">
                      {selectedBattery.battery_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="p-2 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-light/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 内容 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 基本信息 + 国标标识 */}
                <div className="bg-cyber-darker/50 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      基本信息
                    </h3>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyber-success/10 border border-cyber-success/30 rounded">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyber-success" />
                      <span className="text-xs text-cyber-success font-medium">
                        {GBT_36276_STANDARD.name}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-cyber-muted">电池型号</span>
                      <p className="text-white mt-0.5">{selectedBattery.model}</p>
                    </div>
                    <div>
                      <span className="text-cyber-muted">额定容量</span>
                      <p className="text-white mt-0.5">
                        {selectedBattery.capacity} Ah
                      </p>
                    </div>
                    <div>
                      <span className="text-cyber-muted">额定电压</span>
                      <p className="text-white mt-0.5">
                        {selectedBattery.nominal_voltage} V
                      </p>
                    </div>
                    <div>
                      <span className="text-cyber-muted">生产日期</span>
                      <p className="text-white mt-0.5">
                        {formatDate(selectedBattery.manufacture_date, 'YYYY-MM-DD')}
                      </p>
                    </div>
                    <div>
                      <span className="text-cyber-muted">首次使用</span>
                      <p className="text-white mt-0.5">
                        {formatDate(selectedBattery.first_use_date, 'YYYY-MM-DD')}
                      </p>
                    </div>
                    <div>
                      <span className="text-cyber-muted">预计报废</span>
                      <p className="text-cyber-warning mt-0.5">
                        {formatDate(selectedBattery.estimated_scrap_date, 'YYYY-MM-DD')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 实时状态 */}
                <div>
                  <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    实时状态
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-cyber-darker/50 rounded-lg p-4 text-center">
                      <div className="text-xs text-cyber-muted mb-1">当前电量</div>
                      <div className="flex justify-center">
                        <BatteryGauge
                          soc={selectedBattery.current_soc}
                          size="sm"
                          showLabel={false}
                        />
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {selectedBattery.current_soc}%
                      </div>
                    </div>
                    <div className="bg-cyber-darker/50 rounded-lg p-4 text-center">
                      <Gauge className="w-5 h-5 text-cyber-accent mx-auto mb-1" />
                      <div className="text-xs text-cyber-muted mb-1">电压</div>
                      <div className="text-sm font-bold text-white">
                        {formatNumber(selectedBattery.current_voltage, 1)}V
                      </div>
                    </div>
                    <div className="bg-cyber-darker/50 rounded-lg p-4 text-center">
                      <Activity className="w-5 h-5 text-cyber-warning mx-auto mb-1" />
                      <div className="text-xs text-cyber-muted mb-1">温度</div>
                      <div className="text-sm font-bold text-white">
                        {selectedBattery.current_temp}°C
                      </div>
                    </div>
                    <div className="bg-cyber-darker/50 rounded-lg p-4 text-center">
                      <Clock className="w-5 h-5 text-cyber-success mx-auto mb-1" />
                      <div className="text-xs text-cyber-muted mb-1">循环</div>
                      <div className="text-sm font-bold text-white">
                        {selectedBattery.cycle_count}次
                      </div>
                    </div>
                  </div>
                </div>

                {/* 健康度雷达图 */}
                {radarOption && (
                  <div>
                    <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      健康度评分
                    </h3>
                    <div className="bg-cyber-darker/50 rounded-lg p-4">
                      <ReactECharts
                        option={radarOption}
                        style={{ height: 250 }}
                        opts={{ renderer: 'canvas' }}
                      />
                    </div>
                  </div>
                )}

                {/* 电压衰减曲线 */}
                {voltageDecayOption && (
                  <div>
                    <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent mb-3 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      电压衰减曲线
                    </h3>
                    <div className="bg-cyber-darker/50 rounded-lg p-4">
                      <ReactECharts
                        option={voltageDecayOption}
                        style={{ height: 220 }}
                        opts={{ renderer: 'canvas' }}
                      />
                    </div>
                  </div>
                )}

                {/* 充放电循环记录 */}
                <div>
                  <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    近期充放电记录
                  </h3>
                  <div className="bg-cyber-darker/50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-cyber-border/50">
                          <th className="px-3 py-2 text-left text-xs text-cyber-muted font-medium">
                            时间
                          </th>
                          <th className="px-3 py-2 text-center text-xs text-cyber-muted font-medium">
                            起始SOC
                          </th>
                          <th className="px-3 py-2 text-center text-xs text-cyber-muted font-medium">
                            结束SOC
                          </th>
                          <th className="px-3 py-2 text-center text-xs text-cyber-muted font-medium">
                            充电量
                          </th>
                          <th className="px-3 py-2 text-center text-xs text-cyber-muted font-medium">
                            平均温度
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/30">
                        {chargeRecords.slice(0, 5).map((record: ChargeRecord) => (
                          <tr
                            key={record.id}
                            className="hover:bg-cyber-light/20 transition-colors"
                          >
                            <td className="px-3 py-2 text-xs text-white">
                              {formatDate(record.start_time, 'MM-DD HH:mm')}
                            </td>
                            <td className="px-3 py-2 text-center text-xs text-cyber-warning">
                              {record.start_soc}%
                            </td>
                            <td className="px-3 py-2 text-center text-xs text-cyber-success">
                              {record.end_soc}%
                            </td>
                            <td className="px-3 py-2 text-center text-xs text-white font-mono">
                              {formatNumber(record.charge_capacity, 1)}Ah
                            </td>
                            <td className="px-3 py-2 text-center text-xs text-white">
                              {formatNumber(record.avg_temp, 1)}°C
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 国标标准说明 */}
                <div className="bg-cyber-success/5 border border-cyber-success/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyber-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-cyber-success mb-1">
                        符合 {GBT_36276_STANDARD.name} 标准
                      </p>
                      <p className="text-xs text-cyber-muted">
                        {GBT_36276_STANDARD.fullName}
                      </p>
                      <p className="text-xs text-cyber-muted mt-2">
                        循环寿命要求: ≥{GBT_36276_STANDARD.minCycleLife}次 · 
                        容量保持率阈值: {GBT_36276_STANDARD.capacityRetentionThreshold}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部 */}
              <div className="px-6 py-4 border-t border-cyber-border flex gap-3">
                <button className="flex-1 py-2.5 bg-cyber-warning/10 border border-cyber-warning/50 text-cyber-warning rounded-lg hover:bg-cyber-warning/20 transition-colors font-medium text-sm">
                  标记维护
                </button>
                <button className="flex-1 py-2.5 bg-cyber-accent text-cyber-darker rounded-lg hover:bg-cyber-accent/90 transition-colors font-medium text-sm">
                  查看完整报告
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
