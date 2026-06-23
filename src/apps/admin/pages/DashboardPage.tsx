import { useMemo } from 'react'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import {
  Zap,
  Box,
  Users,
  Bell,
  TrendingUp,
  ArrowRight,
  MapPin,
} from 'lucide-react'
import { DataCard } from '@shared/components/DataCard'
import { StatusBadge } from '@shared/components/StatusBadge'
import { useCabinetStore } from '@shared/stores/cabinetStore'
import { useBatteryStore } from '@shared/stores/batteryStore'
import { useAlertStore } from '@shared/stores/alertStore'
import { useOrderStore } from '@shared/stores/orderStore'
import { formatDate, getAlertLevelColor } from '@shared/utils'
import { ALERT_LEVELS, CABINET_STATUS } from '@shared/constants'
import type { EChartsOption } from 'echarts'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const { cabinets } = useCabinetStore()
  const { batteries } = useBatteryStore()
  const { alerts, getPendingCount } = useAlertStore()
  const { orders } = useOrderStore()

  const pendingAlertCount = getPendingCount()
  const todayOrders = orders.filter((o) => {
    const orderDate = new Date(o.created_at).toDateString()
    const today = new Date().toDateString()
    return orderDate === today
  })

  const activeRiders = useMemo(() => {
    const riderIds = new Set(orders.map((o) => o.rider_id))
    return riderIds.size
  }, [orders])

  const swapTrendOption: EChartsOption = useMemo(() => {
    const days = []
    const data = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(`${date.getMonth() + 1}/${date.getDate()}`)
      data.push(Math.floor(80 + Math.random() * 60))
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 22, 40, 0.9)',
        borderColor: '#1A3656',
        textStyle: { color: '#E6F4FF' },
        axisPointer: {
          type: 'line',
          lineStyle: { color: '#00E5FF' },
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { lineStyle: { color: '#1A3656' } },
        axisLabel: { color: '#4A6484', fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#4A6484', fontSize: 12 },
        splitLine: { lineStyle: { color: '#1A3656', type: 'dashed' } },
      },
      series: [
        {
          name: '换电量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: data,
          lineStyle: { color: '#00E5FF', width: 3 },
          itemStyle: {
            color: '#00E5FF',
            borderColor: '#00E5FF',
            borderWidth: 2,
          },
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
      ],
    }
  }, [])

  const batteryStatusOption: EChartsOption = useMemo(() => {
    const charging = batteries.filter((b) => b.status === 'charging').length
    const standby = batteries.filter((b) => b.status === 'standby').length
    const inUse = batteries.filter((b) => b.status === 'in_use').length
    const maintenance = batteries.filter((b) => b.status === 'maintenance').length

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 22, 40, 0.9)',
        borderColor: '#1A3656',
        textStyle: { color: '#E6F4FF' },
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: '#4A6484', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
      },
      series: [
        {
          name: '电池状态',
          type: 'pie',
          radius: ['55%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#0A1628',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: '#E6F4FF',
            },
          },
          labelLine: { show: false },
          data: [
            { value: charging, name: '充电中', itemStyle: { color: '#00E5FF' } },
            { value: standby, name: '待使用', itemStyle: { color: '#00E676' } },
            { value: inUse, name: '使用中', itemStyle: { color: '#FFAA00' } },
            { value: maintenance, name: '维护中', itemStyle: { color: '#FF4D4F' } },
          ],
        },
      ],
    }
  }, [batteries])

  const latestAlerts = alerts.slice(0, 5)

  const cabinetStats = useMemo(() => {
    const running = cabinets.filter((c) => c.status === 'running').length
    const warning = cabinets.filter((c) => c.status === 'warning').length
    const fault = cabinets.filter((c) => c.status === 'fault').length
    return { running, warning, fault, total: cabinets.length }
  }, [cabinets])

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* 页面标题 */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-rajdhani text-white">
            数据总览
          </h1>
          <p className="text-cyber-muted text-sm mt-1">
            {formatDate(new Date(), 'YYYY年MM月DD日')} · 实时监控数据
          </p>
        </div>
        <div className="flex items-center gap-2 text-cyber-accent">
          <TrendingUp className="w-5 h-5" />
          <span className="font-rajdhani font-semibold">今日运行正常</span>
        </div>
      </motion.div>

      {/* 核心指标卡片 */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <DataCard
          title="今日换电量"
          value={todayOrders.length}
          unit="次"
          trend={12.5}
          icon={<Zap className="w-5 h-5" />}
          color="cyan"
        />
        <DataCard
          title="在网柜体数"
          value={cabinetStats.total}
          unit="台"
          icon={<Box className="w-5 h-5" />}
          color="green"
        />
        <DataCard
          title="活跃骑士数"
          value={activeRiders}
          unit="人"
          trend={8.3}
          icon={<Users className="w-5 h-5" />}
          color="orange"
        />
        <DataCard
          title="待处理告警"
          value={pendingAlertCount}
          unit="条"
          icon={<Bell className="w-5 h-5" />}
          color="red"
        />
      </motion.div>

      {/* 图表区域 */}
      <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* 换电量趋势图 */}
        <div className="xl:col-span-2 bg-cyber-dark/50 border border-cyber-border rounded-lg p-5 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-rajdhani font-semibold text-lg text-white">
              换电量趋势
            </h3>
            <span className="text-xs text-cyber-muted">近7天</span>
          </div>
          <ReactECharts
            option={swapTrendOption}
            style={{ height: 280 }}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        {/* 电池状态分布 */}
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-5 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-rajdhani font-semibold text-lg text-white">
              电池状态分布
            </h3>
            <span className="text-xs text-cyber-muted">共 {batteries.length} 块</span>
          </div>
          <ReactECharts
            option={batteryStatusOption}
            style={{ height: 280 }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </motion.div>

      {/* 下部区域 */}
      <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* 最新告警列表 */}
        <div className="xl:col-span-2 bg-cyber-dark/50 border border-cyber-border rounded-lg overflow-hidden backdrop-blur">
          <div className="px-5 py-4 border-b border-cyber-border flex items-center justify-between">
            <h3 className="font-rajdhani font-semibold text-lg text-white">
              最新告警
            </h3>
            <button className="text-sm text-cyber-accent hover:underline flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-cyber-border/50">
            {latestAlerts.map((alert, index) => (
              <motion.div
                key={alert.alert_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="px-5 py-3 hover:bg-cyber-light/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      alert.level === 'critical'
                        ? 'bg-cyber-danger animate-pulse'
                        : alert.level === 'warning'
                        ? 'bg-cyber-warning'
                        : 'bg-cyber-accent'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {alert.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          alert.level === 'critical'
                            ? 'bg-cyber-danger/20 text-cyber-danger'
                            : alert.level === 'warning'
                            ? 'bg-cyber-warning/20 text-cyber-warning'
                            : 'bg-cyber-accent/20 text-cyber-accent'
                        }`}
                      >
                        {ALERT_LEVELS[alert.level].label}
                      </span>
                    </div>
                    <p className="text-sm text-cyber-muted mt-1 truncate">
                      {alert.description}
                    </p>
                  </div>
                  <span className="text-xs text-cyber-muted flex-shrink-0">
                    {formatDate(alert.created_at, 'MM-DD HH:mm')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 柜体状态概览 */}
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg overflow-hidden backdrop-blur">
          <div className="px-5 py-4 border-b border-cyber-border">
            <h3 className="font-rajdhani font-semibold text-lg text-white">
              柜体状态概览
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-cyber-success/10 rounded-lg border border-cyber-success/30">
                <div className="text-2xl font-bold font-rajdhani text-cyber-success">
                  {cabinetStats.running}
                </div>
                <div className="text-xs text-cyber-muted mt-1">运行中</div>
              </div>
              <div className="text-center p-3 bg-cyber-warning/10 rounded-lg border border-cyber-warning/30">
                <div className="text-2xl font-bold font-rajdhani text-cyber-warning">
                  {cabinetStats.warning}
                </div>
                <div className="text-xs text-cyber-muted mt-1">告警</div>
              </div>
              <div className="text-center p-3 bg-cyber-danger/10 rounded-lg border border-cyber-danger/30">
                <div className="text-2xl font-bold font-rajdhani text-cyber-danger">
                  {cabinetStats.fault}
                </div>
                <div className="text-xs text-cyber-muted mt-1">故障</div>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cabinets.slice(0, 4).map((cabinet) => (
                <div
                  key={cabinet.cabinet_id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-cyber-light/20 transition-colors cursor-pointer"
                >
                  <MapPin
                    className={`w-4 h-4 flex-shrink-0 ${
                      cabinet.status === 'running'
                        ? 'text-cyber-success'
                        : cabinet.status === 'warning'
                        ? 'text-cyber-warning'
                        : 'text-cyber-danger'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {cabinet.name}
                    </p>
                    <p className="text-xs text-cyber-muted truncate">
                      {cabinet.location}
                    </p>
                  </div>
                  <StatusBadge
                    status={CABINET_STATUS[cabinet.status].label}
                    color={
                      cabinet.status === 'running'
                        ? 'success'
                        : cabinet.status === 'warning'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                    pulse={cabinet.status === 'running'}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
