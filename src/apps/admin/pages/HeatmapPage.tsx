import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import {
  MapPin,
  Route,
  Lightbulb,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  Box,
  Users,
  Zap,
} from 'lucide-react'
import { useCabinetStore } from '@shared/stores/cabinetStore'
import { mockHeatmapData, mockRiderTrajectories } from '@mock/data'
import { cn } from '@shared/utils'
import { CABINET_STATUS } from '@shared/constants'
import type { EChartsOption } from 'echarts'

export default function HeatmapPage() {
  const { cabinets } = useCabinetStore()
  const [showCabinets, setShowCabinets] = useState(true)
  const [showRiderTrajectory, setShowRiderTrajectory] = useState(false)
  const [selectedCabinet, setSelectedCabinet] = useState<string | null>(null)

  const heatmapOption: EChartsOption = useMemo(() => {
    const minLng = Math.min(...mockHeatmapData.map((d) => d.lng)) - 0.02
    const maxLng = Math.max(...mockHeatmapData.map((d) => d.lng)) + 0.02
    const minLat = Math.min(...mockHeatmapData.map((d) => d.lat)) - 0.02
    const maxLat = Math.max(...mockHeatmapData.map((d) => d.lat)) + 0.02

    const heatData = mockHeatmapData.map((d) => [d.lng, d.lat, d.value])

    const cabinetData = cabinets.map((cabinet) => ({
      name: cabinet.name,
      value: [cabinet.lng, cabinet.lat, cabinet.full_batteries],
      status: cabinet.status,
      cabinet_id: cabinet.cabinet_id,
    }))

    const series: any[] = [
      {
        name: '热力分布',
        type: 'heatmap',
        coordinateSystem: 'geo',
        data: heatData,
        pointSize: 30,
        blurSize: 40,
        minOpacity: 0.2,
        maxOpacity: 0.8,
      },
    ]

    if (showCabinets) {
      series.push({
        name: '换电柜',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: cabinetData,
        symbolSize: 18,
        itemStyle: {
          color: function (params: any) {
            const status = params.data.status
            if (status === 'running') return '#00E676'
            if (status === 'warning') return '#FFAA00'
            return '#FF4D4F'
          },
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 229, 255, 0.5)',
        },
        label: {
          show: false,
          formatter: '{b}',
          position: 'top',
          color: '#fff',
          fontSize: 11,
        },
        emphasis: {
          scale: 1.3,
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 229, 255, 0.8)',
          },
          label: {
            show: true,
          },
        },
      })
    }

    if (showRiderTrajectory && mockRiderTrajectories.length > 0) {
      const trajectory = mockRiderTrajectories[0]
      const lineData = trajectory.points.map((p) => [p.lng, p.lat])
      series.push({
        name: '骑手轨迹',
        type: 'lines',
        coordinateSystem: 'geo',
        data: [
          {
            coords: lineData,
            lineStyle: {
              color: '#00E5FF',
              width: 2,
              opacity: 0.8,
              curveness: 0.2,
            },
          },
        ],
        effect: {
          show: true,
          period: 6,
          trailLength: 0.4,
          symbol: 'arrow',
          symbolSize: 8,
          color: '#00E5FF',
        },
      })

      series.push({
        name: '骑手位置',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: trajectory.points.slice(-1).map((p) => ({
          value: [p.lng, p.lat],
          name: '骑手位置',
        })),
        symbolSize: 14,
        itemStyle: {
          color: '#00E5FF',
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 229, 255, 0.8)',
        },
      })
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 22, 40, 0.95)',
        borderColor: '#1A3656',
        textStyle: { color: '#E6F4FF' },
        formatter: function (params: any) {
          if (params.seriesName === '换电柜') {
            const cabinet = cabinets.find(
              (c) => c.cabinet_id === params.data.cabinet_id
            )
            if (cabinet) {
              return `
                <div style="font-weight: bold; margin-bottom: 4px;">${cabinet.name}</div>
                <div style="font-size: 12px; color: #4A6484;">${cabinet.location}</div>
                <div style="margin-top: 6px; font-size: 12px;">
                  <div>状态: <span style="color: ${CABINET_STATUS[cabinet.status].color}">${CABINET_STATUS[cabinet.status].label}</span></div>
                  <div>满电电池: ${cabinet.full_batteries} 块</div>
                  <div>可用仓位: ${cabinet.available_slots} / ${cabinet.total_slots}</div>
                </div>
              `
            }
          }
          return params.name || '热力点'
        },
      },
      geo: {
        map: 'china',
        roam: true,
        center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
        zoom: 12,
        itemStyle: {
          areaColor: '#0A1628',
          borderColor: '#1A3656',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#0F2847',
          },
          label: {
            show: false,
          },
        },
        regions: [
          {
            name: '北京',
            itemStyle: {
              areaColor: '#060D18',
              borderColor: '#00E5FF',
              borderWidth: 1.5,
            },
          },
        ],
      },
      visualMap: {
        min: 0,
        max: 100,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        textStyle: {
          color: '#4A6484',
        },
        calculable: true,
        inRange: {
          color: ['#0A1628', '#00E5FF', '#00E676', '#FFAA00', '#FF4D4F'],
        },
        seriesIndex: 0,
      },
      series: series,
    }
  }, [cabinets, showCabinets, showRiderTrajectory])

  const optimizationSuggestions = [
    {
      id: 1,
      title: '国贸CBD区域增设柜体',
      description: '该区域换电需求旺盛，现有柜体经常满负荷运行，建议新增1台20仓位柜体。',
      priority: 'high',
      benefit: '预计提升该区域换电能力40%',
    },
    {
      id: 2,
      title: '西二旗站优化调度',
      description: '早晚高峰时段换电需求激增，建议增加电池调度频次。',
      priority: 'medium',
      benefit: '预计减少用户等待时间30%',
    },
    {
      id: 3,
      title: '天通苑区域新增布点',
      description: '天通苑及周边居民区骑士数量增长快，建议提前布局。',
      priority: 'medium',
      benefit: '预计覆盖新增骑士200+',
    },
    {
      id: 4,
      title: '上地站设备升级',
      description: '上地站设备老旧故障率上升，建议进行硬件升级改造。',
      priority: 'low',
      benefit: '预计降低故障率50%',
    },
  ]

  const stats = useMemo(() => {
    const totalValue = mockHeatmapData.reduce((sum, d) => sum + d.value, 0)
    const avgValue = Math.round(totalValue / mockHeatmapData.length)
    const hotSpots = mockHeatmapData.filter((d) => d.value >= 70).length
    return {
      totalPoints: mockHeatmapData.length,
      avgValue,
      hotSpots,
      totalCabinets: cabinets.length,
    }
  }, [cabinets])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-rajdhani text-white">热力分析</h1>
          <p className="text-cyber-muted text-sm mt-1">
            基于换电数据的区域热力分布与布点优化
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-cyber-accent/10 border border-cyber-accent/50 text-cyber-accent rounded-lg hover:bg-cyber-accent/20 transition-colors font-medium text-sm">
            导出热力图
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-cyber-accent" />
            <span className="text-xs text-cyber-muted">热力点数量</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.totalPoints}
          </div>
        </div>
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-cyber-success" />
            <span className="text-xs text-cyber-muted">平均热度</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.avgValue}
          </div>
        </div>
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-cyber-warning" />
            <span className="text-xs text-cyber-muted">热点区域</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.hotSpots}
          </div>
        </div>
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Box className="w-4 h-4 text-cyber-accent" />
            <span className="text-xs text-cyber-muted">已布柜体</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.totalCabinets}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* 地图区域 */}
        <div className="xl:col-span-3 bg-cyber-dark/50 border border-cyber-border rounded-lg overflow-hidden backdrop-blur">
          {/* 地图控制栏 */}
          <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between">
            <h3 className="font-rajdhani font-semibold text-white">热力分布地图</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCabinets(!showCabinets)}
                className="flex items-center gap-2 text-sm"
              >
                {showCabinets ? (
                  <ToggleRight className="w-5 h-5 text-cyber-accent" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-cyber-muted" />
                )}
                <span className={showCabinets ? 'text-white' : 'text-cyber-muted'}>
                  柜体标记
                </span>
              </button>
              <button
                onClick={() => setShowRiderTrajectory(!showRiderTrajectory)}
                className="flex items-center gap-2 text-sm"
              >
                {showRiderTrajectory ? (
                  <ToggleRight className="w-5 h-5 text-cyber-accent" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-cyber-muted" />
                )}
                <span
                  className={
                    showRiderTrajectory ? 'text-white' : 'text-cyber-muted'
                  }
                >
                  骑手轨迹
                </span>
              </button>
            </div>
          </div>

          {/* 地图 */}
          <div className="relative" style={{ height: 500 }}>
            <div className="absolute inset-0 bg-cyber-darker/50">
              <div className="absolute inset-0 hexagon-pattern opacity-50" />
              <ReactECharts
                option={heatmapOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
                className="w-full h-full"
              />
            </div>

            {/* 图例 */}
            <div className="absolute bottom-4 left-4 bg-cyber-dark/90 border border-cyber-border rounded-lg p-3 backdrop-blur">
              <div className="text-xs text-cyber-muted mb-2">柜体状态</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyber-success" />
                  <span className="text-xs text-gray-300">运行中</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyber-warning" />
                  <span className="text-xs text-gray-300">告警</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyber-danger" />
                  <span className="text-xs text-gray-300">故障</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 布点优化建议 */}
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg overflow-hidden backdrop-blur">
          <div className="px-4 py-3 border-b border-cyber-border flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyber-accent" />
            <h3 className="font-rajdhani font-semibold text-white">
              布点优化建议
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-[460px] overflow-y-auto">
            {optimizationSuggestions.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-cyber-darker/50 rounded-lg p-3 border border-cyber-border/50 hover:border-cyber-accent/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-white">{item.title}</h4>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      item.priority === 'high'
                        ? 'bg-cyber-danger/20 text-cyber-danger'
                        : item.priority === 'medium'
                        ? 'bg-cyber-warning/20 text-cyber-warning'
                        : 'bg-cyber-accent/20 text-cyber-accent'
                    )}
                  >
                    {item.priority === 'high'
                      ? '高优先'
                      : item.priority === 'medium'
                      ? '中优先'
                      : '低优先'}
                  </span>
                </div>
                <p className="text-xs text-cyber-muted mb-2">{item.description}</p>
                <div className="flex items-center gap-1 text-xs text-cyber-success">
                  <TrendingUp className="w-3 h-3" />
                  <span>{item.benefit}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 柜体列表 */}
      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg overflow-hidden backdrop-blur">
        <div className="px-5 py-4 border-b border-cyber-border">
          <h3 className="font-rajdhani font-semibold text-white">柜体热力排行</h3>
        </div>
        <div className="divide-y divide-cyber-border/50">
          {mockHeatmapData.slice(0, 5).map((point, index) => {
            const cabinet = cabinets.find(
              (c) =>
                Math.abs(c.lat - point.lat) < 0.01 &&
                Math.abs(c.lng - point.lng) < 0.01
            )
            return (
              <div
                key={index}
                className="px-5 py-3 flex items-center gap-4 hover:bg-cyber-light/20 transition-colors"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-rajdhani font-bold',
                    index === 0
                      ? 'bg-cyber-danger/20 text-cyber-danger'
                      : index === 1
                      ? 'bg-cyber-warning/20 text-cyber-warning'
                      : index === 2
                      ? 'bg-cyber-accent/20 text-cyber-accent'
                      : 'bg-cyber-light/20 text-cyber-muted'
                  )}
                >
                  {index + 1}
                </div>
                <MapPin className="w-4 h-4 text-cyber-muted" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {cabinet?.name || `热点区域 ${index + 1}`}
                  </p>
                  <p className="text-xs text-cyber-muted">
                    热度值: {point.value}
                  </p>
                </div>
                <div className="w-24 h-2 bg-cyber-border rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      point.value >= 80
                        ? 'bg-cyber-danger'
                        : point.value >= 60
                        ? 'bg-cyber-warning'
                        : 'bg-cyber-accent'
                    )}
                    style={{ width: `${point.value}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
