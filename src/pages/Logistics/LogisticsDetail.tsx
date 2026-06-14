import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import { ArrowLeft, Truck, Package, Clock, MapPin, Thermometer, Droplets, AlertTriangle, CheckCircle2, XCircle, ClipboardCheck, Route, Wrench } from 'lucide-react'
import { logisticsOrders } from '@/mocks'
import type { LogisticsOrder, LogisticsAlert } from '@/types'

const statusConfig: Record<LogisticsOrder['status'], { label: string; color: string; bg: string }> = {
  pending: { label: '待发运', color: 'text-gray-600', bg: 'bg-gray-100' },
  in_transit: { label: '运输中', color: 'text-blue-600', bg: 'bg-blue-50' },
  delivered: { label: '已送达', color: 'text-green-600', bg: 'bg-green-50' },
  exception: { label: '异常', color: 'text-red-600', bg: 'bg-red-50' },
}

const alertTypeIcon: Record<LogisticsAlert['type'], string> = {
  temp_high: '温度过高',
  temp_low: '温度过低',
  humidity_high: '湿度过高',
  delay: '运输延误',
}

const alertResolutionMap: Record<LogisticsAlert['type'], string> = {
  temp_high: '已通知司机调整制冷功率，温度已恢复正常',
  temp_low: '已通知司机关闭制冷设备，温度已恢复正常',
  humidity_high: '已开启除湿模式，湿度已降至正常范围',
  delay: '已调整路线，预计延迟2小时到达',
}

function RouteMapPlaceholder({ order }: { order: LogisticsOrder }) {
  const currentIdx = Math.floor(order.route.length * 0.6)

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle, #0D7C3E 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
      </div>

      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-primary-700 shadow-sm">
        实时轨迹
      </div>

      <svg viewBox="0 0 400 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {(() => {
          const points = order.route.map((_, idx) => {
            const x = 40 + (idx / (order.route.length - 1)) * 320
            const y = 260 - (idx / (order.route.length - 1)) * 200 + Math.sin(idx * 1.5) * 30
            return { x, y }
          })

          return (
            <>
              <path
                d={points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#0D7C3E"
                strokeWidth="3"
                strokeDasharray="8,4"
                opacity="0.5"
              />

              {points.map((p, idx) => (
                <g key={idx}>
                  {idx === currentIdx && (
                    <>
                      <circle cx={p.x} cy={p.y} r="14" fill="#D4A017" opacity="0.2">
                        <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={p.x} cy={p.y} r="6" fill="#D4A017" stroke="white" strokeWidth="2" />
                    </>
                  )}
                  <circle
                    cx={p.x} cy={p.y} r={idx === currentIdx ? 0 : idx === 0 ? 6 : 4}
                    fill={idx === 0 ? '#0D7C3E' : '#74c194'}
                    stroke="white"
                    strokeWidth={idx === 0 ? 2 : 1}
                  />
                  {idx === 0 && (
                    <text x={p.x} y={p.y + 20} textAnchor="middle" fill="#3E2723" fontSize="11" fontWeight="600">
                      始发地
                    </text>
                  )}
                  {idx === points.length - 1 && (
                    <text x={p.x} y={p.y + 20} textAnchor="middle" fill="#3E2723" fontSize="11" fontWeight="600">
                      目的地
                    </text>
                  )}
                  {idx === currentIdx && (
                    <text x={p.x} y={p.y - 16} textAnchor="middle" fill="#D4A017" fontSize="10" fontWeight="600">
                      当前位置
                    </text>
                  )}
                </g>
              ))}
            </>
          )
        })()}
      </svg>
    </div>
  )
}

function TempHumidityChart({ tempData }: { tempData: LogisticsOrder['tempData'] }) {
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#1a1a1a', fontSize: 12 },
    },
    legend: {
      data: ['温度', '湿度'],
      top: 0,
      textStyle: { fontSize: 12, color: '#666' },
    },
    grid: {
      left: 50,
      right: 50,
      bottom: 30,
      top: 40,
    },
    xAxis: {
      type: 'category',
      data: tempData.map(d => d.time.split(' ')[1] || d.time),
      axisLabel: { fontSize: 10, color: '#999', rotate: 30 },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '温度(°C)',
        nameTextStyle: { fontSize: 11, color: '#ef4444' },
        axisLabel: { fontSize: 10, color: '#ef4444', formatter: '{value}°C' },
        splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } },
      },
      {
        type: 'value',
        name: '湿度(%)',
        nameTextStyle: { fontSize: 11, color: '#3b82f6' },
        axisLabel: { fontSize: 10, color: '#3b82f6', formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '温度',
        type: 'line',
        data: tempData.map(d => d.temp),
        yAxisIndex: 0,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#ef4444', width: 2 },
        itemStyle: { color: '#ef4444' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239,68,68,0.15)' },
              { offset: 1, color: 'rgba(239,68,68,0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: 1 },
          data: [
            { yAxis: 0, lineStyle: { color: '#0D7C3E' }, label: { formatter: '下限0°C', fontSize: 9, color: '#0D7C3E' } },
            { yAxis: 8, lineStyle: { color: '#D4A017' }, label: { formatter: '上限8°C', fontSize: 9, color: '#D4A017' } },
          ],
        },
      },
      {
        name: '湿度',
        type: 'line',
        data: tempData.map(d => d.humidity),
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59,130,246,0.1)' },
              { offset: 1, color: 'rgba(59,130,246,0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: 1 },
          data: [
            { yAxis: 60, lineStyle: { color: '#0D7C3E' }, label: { formatter: '下限60%', fontSize: 9, color: '#0D7C3E' } },
            { yAxis: 85, lineStyle: { color: '#D4A017' }, label: { formatter: '上限85%', fontSize: 9, color: '#D4A017' } },
          ],
        },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: '100%', minHeight: 280 }} />
}

function SignOffSection({ order }: { order: LogisticsOrder }) {
  const lastTemp = order.tempData[order.tempData.length - 1]

  if (order.status === 'pending') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5"
      >
        <h3 className="font-serif text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardCheck size={18} className="text-gray-500" />
          签收复查记录
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">待发运</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">待发运</span>
        </div>
      </motion.div>
    )
  }

  if (order.status === 'in_transit') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5"
      >
        <h3 className="font-serif text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardCheck size={18} className="text-gray-500" />
          签收复查记录
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">运输中，待签收</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">运输中，待签收</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5"
    >
      <h3 className="font-serif text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <ClipboardCheck size={18} className="text-gray-500" />
        签收复查记录
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">签收人:</span>
            <span className="text-gray-800 font-medium">张伟（新发地市场W-218摊位）</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">签收时间:</span>
            <span className="text-gray-800">{order.estimatedArrival}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">签收状态:</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">已签收确认</span>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">复查结果</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Thermometer size={14} className="text-red-400" />
              <span className="text-gray-500">复查温度:</span>
              <span className="text-gray-800">{lastTemp?.temp}°C ✓ 符合标准</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Droplets size={14} className="text-blue-400" />
              <span className="text-gray-500">复查湿度:</span>
              <span className="text-gray-800">{lastTemp?.humidity}% ✓ 符合标准</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">复查人:</span>
              <span className="text-gray-800">李明（品控部）</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">复查结论:</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">合格 - 准予入库</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-gray-500 shrink-0">备注:</span>
            <span className="text-gray-600">全程温湿度均在标准范围内，未发现异常</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function TrajectorySection({ order }: { order: LogisticsOrder }) {
  const currentIdx = Math.floor(order.route.length * 0.6)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5"
    >
      <h3 className="font-serif text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Route size={18} className="text-gray-500" />
        全程轨迹明细
      </h3>
      <div className="relative">
        {order.route.map((point, idx) => {
          const isFirst = idx === 0
          const isLast = idx === order.route.length - 1
          const isCurrent = idx === currentIdx
          const distance = !isLast ? 50 + Math.floor(Math.abs(order.route[idx + 1].lat - point.lat) * 200 + Math.abs(order.route[idx + 1].lng - point.lng) * 150) : 0

          return (
            <div key={idx} className="relative flex items-start">
              <div className="flex flex-col items-center mr-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isFirst
                    ? 'bg-green-500 text-white'
                    : isLast
                      ? 'bg-yellow-500 text-white'
                      : isCurrent
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-300 text-white'
                }`}>
                  {idx + 1}
                </div>
                {isCurrent && (
                  <div className="w-3 h-3 rounded-full bg-primary-400 mt-1">
                    <div className="w-3 h-3 rounded-full bg-primary-400 animate-ping" />
                  </div>
                )}
                {!isLast && (
                  <div className="w-0.5 flex-1 min-h-[40px] bg-gray-200 my-1" />
                )}
              </div>
              <div className={`pb-6 flex-1 ${!isLast ? '' : 'pb-0'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    {isFirst ? '始发仓' : isLast ? '目的仓' : '途经点'}
                  </span>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">当前位置</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                </p>
                {!isLast && (
                  <p className="text-xs text-gray-300 mt-1">约{distance}km</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function AlertResolutionSection({ order }: { order: LogisticsOrder }) {
  const [localAlerts, setLocalAlerts] = useState(order.alerts)
  const resolvedAlerts = localAlerts.filter(a => a.resolved)
  const unresolvedAlerts = localAlerts.filter(a => !a.resolved)

  if (localAlerts.length === 0) return null

  function getProcessingTime(timestamp: string): string {
    const d = new Date(timestamp.replace(/-/g, '/'))
    d.setHours(d.getHours() + 1 + Math.floor(Math.random() * 2))
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleResolve = (alertId: string) => {
    setLocalAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5"
    >
      <h3 className="font-serif text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Wrench size={18} className="text-gray-500" />
        异常处理结果
      </h3>
      <div className="space-y-4">
        {resolvedAlerts.map(alert => (
          <div key={alert.id} className="p-4 rounded-lg bg-green-50 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
                {alertTypeIcon[alert.type]}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">已解决</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">处理人:</span>
                <span className="text-gray-800">调度中心 - 王刚</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">处理时间:</span>
                <span className="text-gray-800">{getProcessingTime(alert.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <span className="text-gray-500">处理措施:</span>
                <span className="text-gray-800">{alertResolutionMap[alert.type]}</span>
              </div>
            </div>
          </div>
        ))}
        {unresolvedAlerts.map(alert => (
          <div key={alert.id} className="p-4 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700">
                  {alertTypeIcon[alert.type]}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">待处理</span>
              </div>
              <button
                onClick={() => handleResolve(alert.id)}
                className="text-xs px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                标记处理
              </button>
            </div>
            <p className="text-sm text-gray-700">{alert.message}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function LogisticsDetail() {
  const { id } = useParams<{ id: string }>()
  const order = logisticsOrders.find(o => o.id === id)

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg">未找到该物流订单</p>
          <Link to="/logistics" className="text-primary-500 hover:text-primary-700 mt-2 inline-block text-sm">
            返回物流追踪列表
          </Link>
        </div>
      </div>
    )
  }

  const config = statusConfig[order.status]
  const unresolvedAlerts = order.alerts.filter(a => !a.resolved)

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/logistics" className="inline-flex items-center gap-1 text-primary-100 hover:text-white text-sm mb-3 transition-colors">
              <ArrowLeft size={16} />
              返回物流列表
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-2xl lg:text-3xl font-bold">{order.productName}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              {unresolvedAlerts.length > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-100">
                  <AlertTriangle size={12} />
                  {unresolvedAlerts.length}个未处理预警
                </span>
              )}
            </div>
            <p className="mt-1 text-primary-100 text-sm">批次号: {order.batchNo}</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="h-80 lg:h-[420px]">
              <RouteMapPlaceholder order={order} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-serif text-base font-semibold text-gray-800 mb-3">订单信息</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Package size={14} className="text-gray-400" />
                  <span>{order.productName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck size={14} className="text-gray-400" />
                  <span>{order.carrier}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Package size={14} className="text-gray-400" />
                  <span>{order.vehicleNo}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={14} className="text-gray-400" />
                  <span>发车: {order.startTime}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-gray-600">
                  <Clock size={14} className="text-gray-400" />
                  <span>预计到达: {order.estimatedArrival}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-serif text-base font-semibold text-gray-800 mb-2">当前位置</h3>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-primary-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{order.currentLocation.address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.currentLocation.lat.toFixed(4)}, {order.currentLocation.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-base font-semibold text-gray-800">温湿度监控</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Thermometer size={12} className="text-red-500" />
                    {order.tempData[order.tempData.length - 1]?.temp}°C
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets size={12} className="text-blue-500" />
                    {order.tempData[order.tempData.length - 1]?.humidity}%
                  </span>
                </div>
              </div>
              <TempHumidityChart tempData={order.tempData} />
            </div>
          </motion.div>
        </div>

        {order.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            <h3 className="font-serif text-base font-semibold text-gray-800 mb-4">预警记录</h3>
            <div className="space-y-3">
              {order.alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.resolved ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {alert.resolved ? (
                    <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        alert.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {alertTypeIcon[alert.type]}
                      </span>
                      <span className={`text-xs ${alert.resolved ? 'text-green-600' : 'text-red-600'}`}>
                        {alert.resolved ? '已处理' : '未处理'}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${alert.resolved ? 'text-green-800' : 'text-red-800'}`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <SignOffSection order={order} />
        <TrajectorySection order={order} />
        <AlertResolutionSection order={order} />
      </div>
    </div>
  )
}
