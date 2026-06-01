import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Phone,
  RefreshCw,
  Eye,
  Key,
  Loader2,
  Zap,
  Radio,
  ChevronRight,
  Shield,
  PhoneCall,
  UserCheck,
  Activity,
  CloudRain,
  AlertOctagon,
  Route,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { Order, TrackingEvent, Exception } from '../../api/types'

const eventTypeConfig: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  created: { label: '订单创建', color: 'text-sf-blue', icon: Package, bgColor: 'bg-sf-blue/10' },
  picked: { label: '已揽收', color: 'text-sf-yellow', icon: Truck, bgColor: 'bg-sf-yellow/10' },
  in_transit: { label: '运输中', color: 'text-sf-blue', icon: Truck, bgColor: 'bg-sf-blue/10' },
  arrived: { label: '已到达', color: 'text-sf-blue', icon: MapPin, bgColor: 'bg-sf-blue/10' },
  out_for_delivery: { label: '派送中', color: 'text-sf-yellow', icon: Truck, bgColor: 'bg-sf-yellow/10' },
  delivered: { label: '已签收', color: 'text-sf-green', icon: CheckCircle, bgColor: 'bg-sf-green/10' },
  exception: { label: '异常', color: 'text-sf-red', icon: AlertTriangle, bgColor: 'bg-sf-red/10' },
  sorting: { label: '分拣中', color: 'text-sf-blue', icon: Package, bgColor: 'bg-sf-blue/10' },
  weather_delay: { label: '天气延误', color: 'text-sf-orange', icon: CloudRain, bgColor: 'bg-sf-orange/10' },
  traffic_delay: { label: '交通延误', color: 'text-sf-orange', icon: Truck, bgColor: 'bg-sf-orange/10' },
  route_change: { label: '路线变更', color: 'text-sf-yellow', icon: Route, bgColor: 'bg-sf-yellow/10' },
  transit_update: { label: '中转更新', color: 'text-sf-blue', icon: Radio, bgColor: 'bg-sf-blue/10' },
  delay_alert: { label: '延误预警', color: 'text-sf-red', icon: AlertOctagon, bgColor: 'bg-sf-red/10' },
  weather_warning: { label: '天气预警', color: 'text-sf-orange', icon: CloudRain, bgColor: 'bg-sf-orange/10' },
}

interface SimulatedEvent {
  id: number
  order_id: number
  location: string
  description: string
  status: string
  event_type: string
  event_time: string
  created_at?: string
  operator?: string
  remark?: string
  isSimulated?: boolean
}

interface DelayRisk {
  id: number
  type: 'weather' | 'traffic' | 'route_change'
  riskLevel: 'low' | 'medium' | 'high'
  title: string
  description: string
  affectedSegment: string
  detectedAt: string
}

const simulatedEventPool: Omit<SimulatedEvent, 'id' | 'order_id' | 'event_time' | 'created_at'>[] = [
  { location: '杭州转运中心', description: '包裹已到达杭州转运中心，正在分拣', status: 'in_transit', event_type: 'sorting', operator: '系统', remark: '预计2小时内完成分拣', isSimulated: true },
  { location: 'G15沈海高速', description: '运输车辆途经G15沈海高速，行驶正常', status: 'in_transit', event_type: 'transit_update', operator: 'GPS', isSimulated: true },
  { location: '上海浦东区域', description: '因暴雨天气，运输时效预计延迟3-5小时', status: 'exception', event_type: 'weather_delay', operator: '系统', remark: '气象台发布暴雨黄色预警', isSimulated: true },
  { location: 'G2京沪高速', description: '前方路段拥堵，预计延误1-2小时', status: 'exception', event_type: 'traffic_delay', operator: '导航系统', remark: '建议绕行S26高速', isSimulated: true },
  { location: '南京中转站', description: '包裹已到达南京中转站，等待装车', status: 'arrived', event_type: 'transit_update', operator: '系统', isSimulated: true },
  { location: '苏州分拨中心', description: '包裹已完成分拣，准备发往下一站', status: 'in_transit', event_type: 'sorting', operator: '分拣员 李明', remark: '已装入苏A-88562运输车', isSimulated: true },
  { location: '运输途中', description: '因路线优化，包裹运输路线已变更', status: 'in_transit', event_type: 'route_change', operator: '调度系统', remark: '新路线经由合肥中转，预计增加0.5天', isSimulated: true },
  { location: '无锡集散中心', description: '包裹到达无锡集散中心', status: 'arrived', event_type: 'transit_update', operator: '系统', isSimulated: true },
  { location: '运输途中', description: '天气预警：前方路段有大雾，能见度不足200米', status: 'exception', event_type: 'weather_warning', operator: '气象系统', remark: '已通知司机减速慢行', isSimulated: true },
  { location: '上海松江中转站', description: '延误预警：当前配送区域爆仓，预计延迟1天', status: 'exception', event_type: 'delay_alert', operator: '系统', remark: '已启动备用分拣线', isSimulated: true },
  { location: '常州转运中心', description: '包裹已到达常州转运中心，进行安检', status: 'in_transit', event_type: 'transit_update', operator: '安检系统', isSimulated: true },
  { location: '运输途中', description: '车辆GPS定位更新，当前位置：沪宁高速丹阳段', status: 'in_transit', event_type: 'transit_update', operator: 'GPS', isSimulated: true },
]

const delayRiskPool: Omit<DelayRisk, 'id' | 'detectedAt'>[] = [
  { type: 'weather', riskLevel: 'medium', title: '暴雨预警', description: '上海地区暴雨黄色预警，预计影响8-12小时', affectedSegment: '上海浦东→上海松江' },
  { type: 'traffic', riskLevel: 'high', title: '高速拥堵', description: 'G2京沪高速南京段严重拥堵，平均时速低于30km/h', affectedSegment: '南京→苏州' },
  { type: 'route_change', riskLevel: 'low', title: '路线优化', description: '系统检测到更优路线，已自动切换', affectedSegment: '杭州→上海' },
  { type: 'weather', riskLevel: 'high', title: '台风预警', description: '台风"海鸥"即将登陆，沿海运输线路受影响', affectedSegment: '宁波→温州' },
  { type: 'traffic', riskLevel: 'medium', title: '施工管制', description: 'G15沈海高速施工，部分路段限速限行', affectedSegment: '苏州→无锡' },
  { type: 'route_change', riskLevel: 'medium', title: '临时改道', description: '因前方事故，运输车辆临时改走省道', affectedSegment: '常州→南京' },
  { type: 'weather', riskLevel: 'low', title: '大雾预警', description: '局部地区大雾，能见度不足500米', affectedSegment: '合肥→南京' },
  { type: 'traffic', riskLevel: 'low', title: '轻微拥堵', description: '城区道路高峰期拥堵，预计延误30分钟', affectedSegment: '上海市内配送' },
]

const riskLevelConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: '低风险', color: 'text-sf-green', bgColor: 'bg-sf-green/10' },
  medium: { label: '中风险', color: 'text-sf-yellow', bgColor: 'bg-sf-yellow/10' },
  high: { label: '高风险', color: 'text-sf-red', bgColor: 'bg-sf-red/10' },
}

const riskTypeConfig: Record<string, { icon: any; color: string }> = {
  weather: { icon: CloudRain, color: 'text-sf-orange' },
  traffic: { icon: Truck, color: 'text-sf-yellow' },
  route_change: { icon: Route, color: 'text-sf-blue' },
}

const formatMsTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('zh-CN', { hour12: false, fractionalSecondDigits: 3 } as Intl.DateTimeFormatOptions)
}

let simulatedIdCounter = 9000
const nextSimId = () => ++simulatedIdCounter

const TrackDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [exception, setException] = useState<Exception | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showDecryptModal, setShowDecryptModal] = useState(false)
  const [decryptReason, setDecryptReason] = useState('')
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())
  const [refreshCount, setRefreshCount] = useState(0)
  const [prevEventCount, setPrevEventCount] = useState(0)
  const [newEventBadge, setNewEventBadge] = useState(false)
  const [delayRisks, setDelayRisks] = useState<DelayRisk[]>([])
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const usedEventIndices = useRef<Set<number>>(new Set())
  const usedRiskIndices = useRef<Set<number>>(new Set())

  const addSimulatedEvent = useCallback(() => {
    const availableIndices = simulatedEventPool
      .map((_, i) => i)
      .filter(i => !usedEventIndices.current.has(i))

    if (availableIndices.length === 0) {
      usedEventIndices.current = new Set()
      return
    }

    const poolIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
    usedEventIndices.current.add(poolIndex)
    const template = simulatedEventPool[poolIndex]

    const now = new Date()
    const simulatedEvent: SimulatedEvent = {
      ...template,
      id: nextSimId(),
      order_id: parseInt(id || '0'),
      event_time: now.toISOString(),
      created_at: now.toISOString(),
    }

    setEvents(prev => {
      const currentCount = prev.length
      setPrevEventCount(currentCount)
      return [simulatedEvent as any, ...prev]
    })
    setNewEventBadge(true)
    setTimeout(() => setNewEventBadge(false), 3000)
  }, [id])

  const addSimulatedRisk = useCallback(() => {
    const availableIndices = delayRiskPool
      .map((_, i) => i)
      .filter(i => !usedRiskIndices.current.has(i))

    if (availableIndices.length === 0) {
      usedRiskIndices.current = new Set()
      return
    }

    const poolIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
    usedRiskIndices.current.add(poolIndex)
    const template = delayRiskPool[poolIndex]

    const risk: DelayRisk = {
      ...template,
      id: nextSimId(),
      detectedAt: new Date().toISOString(),
    }

    setDelayRisks(prev => [risk, ...prev].slice(0, 5))
  }, [])

  useEffect(() => {
    if (id) {
      fetchData()
      refreshIntervalRef.current = setInterval(() => {
        fetchData(true)
        if (Math.random() > 0.3) addSimulatedEvent()
        if (Math.random() > 0.6) addSimulatedRisk()
      }, 3000)
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
      }
    }
  }, [id, addSimulatedEvent, addSimulatedRisk])

  const fetchData = async (silent = false) => {
    if (!id) return
    if (!silent) setLoading(true)
    try {
      const [orderResult, eventsResult, exceptionResult] = await Promise.all([
        api.orders.get(parseInt(id)),
        api.tracking.getTimeline(parseInt(id)),
        api.exceptions.list({ order_id: parseInt(id), page: 1, pageSize: 1 }).catch(() => ({ success: false, data: [] })),
      ])
      if (orderResult.success && orderResult.data) {
        setOrder(orderResult.data as Order)
      }
      if (eventsResult.success && eventsResult.data) {
        const apiEvents = eventsResult.data as TrackingEvent[]
        setEvents(prev => {
          const simulatedEvents = prev.filter(e => (e as any).isSimulated)
          const merged = [...simulatedEvents, ...apiEvents]
          const currentCount = prev.length
          if (apiEvents.length > currentCount - simulatedEvents.length) {
            setPrevEventCount(currentCount)
            setNewEventBadge(true)
            setTimeout(() => setNewEventBadge(false), 3000)
          }
          return merged
        })
      }
      if (exceptionResult.success && exceptionResult.data && (exceptionResult.data as Exception[]).length > 0) {
        setException((exceptionResult.data as Exception[])[0])
      }
      setLastRefreshTime(new Date())
      setRefreshCount(prev => prev + 1)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
      if (!silent) setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleApplyDecrypt = async () => {
    if (!decryptReason.trim()) {
      addNotification({ type: 'error', message: '请填写解密申请理由' })
      return
    }
    try {
      const result = await api.security.decryptApply({
        order_id: parseInt(id!),
        field: 'receiver_phone',
        reason: decryptReason,
        user_id: 1,
      })
      if (result.success) {
        addNotification({ type: 'success', message: '解密申请已提交，等待审批' })
        setShowDecryptModal(false)
        setDecryptReason('')
      }
    } catch (error) {
      addNotification({ type: 'error', message: '申请提交失败' })
    }
  }

  const getResponseLevelInfo = (level: number) => {
    const levels = [
      { level: 1, name: '系统告警', icon: Activity, color: 'text-sf-yellow', bgColor: 'bg-sf-yellow/10', desc: '系统自动检测异常并告警' },
      { level: 2, name: '客服外呼', icon: PhoneCall, color: 'text-sf-orange', bgColor: 'bg-sf-orange/10', desc: '客服人员外呼处理' },
      { level: 3, name: '经理介入', icon: UserCheck, color: 'text-sf-red', bgColor: 'bg-sf-red/10', desc: '片区经理介入处理' },
    ]
    return levels.find(l => l.level === level) || levels[0]
  }

  const getResponseStatusInfo = (status: string) => {
    const statuses: Record<string, { label: string; color: string; completed: boolean }> = {
      alert: { label: '已告警', color: 'text-sf-yellow', completed: true },
      processing: { label: '处理中', color: 'text-sf-blue', completed: false },
      escalated: { label: '已升级', color: 'text-sf-orange', completed: true },
      resolved: { label: '已解决', color: 'text-sf-green', completed: true },
      called: { label: '已外呼', color: 'text-sf-orange', completed: true },
      manager_intervened: { label: '已介入', color: 'text-sf-red', completed: true },
    }
    return statuses[status] || statuses.alert
  }

  const getLevelDetail = (level: number, exceptionData: Exception) => {
    const detectedTime = exceptionData.detected_at ? new Date(exceptionData.detected_at) : new Date()
    const now = new Date()

    if (level === 1) {
      const isInProgress = exceptionData.level === 1 && !getResponseStatusInfo(exceptionData.response_status).completed && exceptionData.response_status !== 'alert'
      const respondedTime = exceptionData.responded_at ? new Date(exceptionData.responded_at) : null
      const duration = respondedTime
        ? Math.round((respondedTime.getTime() - detectedTime.getTime()) / 1000)
        : Math.round((now.getTime() - detectedTime.getTime()) / 1000)

      let status: 'completed' | 'in_progress' | 'pending' = 'completed'
      if (exceptionData.level < 1) status = 'pending'
      else if (isInProgress) status = 'in_progress'

      return {
        status,
        startedAt: detectedTime,
        duration,
        responsible: '系统自动',
        result: status === 'completed' ? '已发送告警通知' : status === 'in_progress' ? '正在检测异常类型...' : '等待触发',
        timestamp: detectedTime,
      }
    }

    if (level === 2) {
      const isCompleted = exceptionData.level >= 2 && ['called', 'manager_intervened', 'resolved'].includes(exceptionData.response_status)
      const isInProgress = exceptionData.level === 2 && !['resolved'].includes(exceptionData.response_status)
      const l2StartTime = exceptionData.responded_at ? new Date(exceptionData.responded_at) : new Date(detectedTime.getTime() + 120000)
      const duration = isCompleted
        ? Math.round((now.getTime() - l2StartTime.getTime()) / 1000)
        : isInProgress
        ? Math.round((now.getTime() - l2StartTime.getTime()) / 1000)
        : 0

      let status: 'completed' | 'in_progress' | 'pending' = 'pending'
      if (isCompleted) status = 'completed'
      else if (isInProgress || exceptionData.level >= 2) status = 'in_progress'

      return {
        status,
        startedAt: l2StartTime,
        duration,
        responsible: '客服 张丽华',
        result: status === 'completed' ? '已外呼收件人，确认收件人不在' : status === 'in_progress' ? '正在联系收件人...' : '等待L1完成',
        timestamp: l2StartTime,
      }
    }

    if (level === 3) {
      const isCompleted = ['resolved'].includes(exceptionData.response_status)
      const isInProgress = ['manager_intervened'].includes(exceptionData.response_status)
      const l3StartTime = exceptionData.resolved_at ? new Date(new Date(exceptionData.resolved_at).getTime() - 300000) : new Date(detectedTime.getTime() + 600000)
      const duration = isCompleted
        ? 300
        : isInProgress
        ? Math.round((now.getTime() - l3StartTime.getTime()) / 1000)
        : 0

      let status: 'completed' | 'in_progress' | 'pending' = 'pending'
      if (isCompleted) status = 'completed'
      else if (isInProgress || exceptionData.level >= 3) status = 'in_progress'

      return {
        status,
        startedAt: l3StartTime,
        duration,
        responsible: '片区经理 王建国',
        result: status === 'completed' ? '已安排重新派送，预计2小时内到达' : status === 'in_progress' ? '正在制定处理方案...' : '等待L2升级',
        timestamp: l3StartTime,
      }
    }

    return {
      status: 'pending' as const,
      startedAt: now,
      duration: 0,
      responsible: '-',
      result: '等待触发',
      timestamp: now,
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
    return `${Math.floor(seconds / 3600)}时${Math.floor((seconds % 3600) / 60)}分`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-sf-red" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle size={48} className="text-sf-yellow mb-4" />
        <p className="text-sf-light/70">运单不存在</p>
        <button
          onClick={() => navigate('/track')}
          className="mt-4 px-6 py-2 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors"
        >
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/track')}
            className="w-10 h-10 rounded-lg border border-sf-blue/30 flex items-center justify-center text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-display text-sf-light">运单详情</h1>
            <p className="text-sf-light/50 text-sm mt-1">运单号: {order.tracking_no || order.order_no}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-sf-dark/50 border border-sf-blue/20 rounded-lg">
            <div className="relative">
              <Radio size={14} className="text-sf-green" />
              <div className="absolute inset-0 animate-ping">
                <Radio size={14} className="text-sf-green opacity-30" />
              </div>
            </div>
            <span className="text-sf-green text-sm">实时追踪</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 h-11 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light hover:border-sf-blue/40 transition-colors"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            <span className="text-sm">手动刷新</span>
          </button>
          <div className="px-3 py-2 bg-sf-blue/5 border border-sf-blue/20 rounded-lg">
            <div className="text-sf-light/50 text-xs">上次刷新</div>
            <div className="text-sf-light text-sm font-mono">
              {formatMsTime(lastRefreshTime)}
            </div>
          </div>
          <div className="px-3 py-2 bg-sf-dark/50 border border-sf-blue/20 rounded-lg">
            <div className="text-sf-light/50 text-xs">自动刷新</div>
            <div className="text-sf-light text-sm font-mono">
              <Zap size={14} className="inline text-sf-yellow mr-1" />
              3秒/次 · {refreshCount}次
            </div>
          </div>
        </div>
      </div>

      {delayRisks.length > 0 && (
        <div className="glass rounded-xl p-6 border border-sf-orange/30 bg-sf-orange/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sf-orange/10 rounded-xl flex items-center justify-center">
              <AlertOctagon size={20} className="text-sf-orange" />
            </div>
            <div>
              <h3 className="text-lg font-display text-sf-light">延误风险指标</h3>
              <p className="text-sf-light/50 text-sm">实时监控运输风险，提前预警延误</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="px-2 py-1 bg-sf-red/10 text-sf-red text-xs rounded-full">
                高 {delayRisks.filter(r => r.riskLevel === 'high').length}
              </span>
              <span className="px-2 py-1 bg-sf-yellow/10 text-sf-yellow text-xs rounded-full">
                中 {delayRisks.filter(r => r.riskLevel === 'medium').length}
              </span>
              <span className="px-2 py-1 bg-sf-green/10 text-sf-green text-xs rounded-full">
                低 {delayRisks.filter(r => r.riskLevel === 'low').length}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {delayRisks.map(risk => {
              const TypeIcon = riskTypeConfig[risk.type].icon
              const riskConf = riskLevelConfig[risk.riskLevel]
              return (
                <div key={risk.id} className="flex items-start gap-3 p-4 bg-sf-dark/50 rounded-lg border border-sf-blue/10">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${riskConf.bgColor}`}>
                    <TypeIcon size={16} className={riskTypeConfig[risk.type].color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sf-light font-medium text-sm">{risk.title}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${riskConf.bgColor} ${riskConf.color}`}>
                        {riskConf.label}
                      </span>
                    </div>
                    <p className="text-sf-light/60 text-xs mt-1">{risk.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-sf-light/40">
                      <span className="flex items-center gap-1">
                        <Route size={10} />
                        影响路段: {risk.affectedSegment}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatMsTime(risk.detectedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {exception && (
        <div className="glass rounded-xl p-6 border border-sf-red/30 bg-sf-red/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sf-red/10 rounded-xl flex items-center justify-center">
                <AlertTriangle size={24} className="text-sf-red" />
              </div>
              <div>
                <h3 className="text-lg font-display text-sf-light">异常件三级响应进度</h3>
                <p className="text-sf-light/50 text-sm">异常类型: {exception.type} · {exception.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/track/exception')}
                className="flex items-center gap-2 px-4 py-2 bg-sf-dark/50 border border-sf-red/30 rounded-lg text-sf-red text-sm hover:border-sf-red/50 hover:bg-sf-red/10 transition-colors"
              >
                <ExternalLink size={14} />
                <span>异常中心</span>
              </button>
              <div className={`px-4 py-2 rounded-lg ${getResponseStatusInfo(exception.response_status).color} bg-sf-dark/50 border`}>
                {getResponseStatusInfo(exception.response_status).label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {[1, 2, 3].map(level => {
              const info = getResponseLevelInfo(level)
              const detail = getLevelDetail(level, exception)
              const isActive = exception.level >= level
              const isCompleted = detail.status === 'completed'
              const isInProgress = detail.status === 'in_progress'
              const Icon = info.icon
              return (
                <React.Fragment key={level}>
                  <div className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? isCompleted
                        ? 'border-sf-green/50 bg-sf-green/5'
                        : 'border-sf-red/50 bg-sf-red/5'
                      : 'border-sf-blue/10 bg-sf-dark/30 opacity-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isActive ? info.bgColor : 'bg-sf-dark/50'
                      }`}>
                        <Icon size={20} className={isActive ? info.color : 'text-sf-light/30'} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${isActive ? 'text-sf-light' : 'text-sf-light/30'}`}>
                          L{level} {info.name}
                        </div>
                        <div className={`text-xs mt-1 ${isActive ? 'text-sf-light/50' : 'text-sf-light/20'}`}>
                          {info.desc}
                        </div>
                      </div>
                      {isCompleted && (
                        <div className="w-6 h-6 bg-sf-green rounded-full flex items-center justify-center">
                          <CheckCircle size={14} className="text-white" />
                        </div>
                      )}
                      {isInProgress && (
                        <div className="w-6 h-6 bg-sf-yellow rounded-full flex items-center justify-center animate-pulse">
                          <Clock size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-sf-blue/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-sf-light/40">响应状态</span>
                        <span className={
                          isCompleted ? 'text-sf-green' :
                          isInProgress ? 'text-sf-yellow' :
                          'text-sf-light/30'
                        }>
                          {isCompleted ? '已完成' : isInProgress ? '处理中' : '待处理'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-sf-light/40">处理时间</span>
                        <span className="text-sf-light/70 font-mono">
                          {detail.duration > 0 ? formatDuration(detail.duration) : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-sf-light/40">责任人</span>
                        <span className="text-sf-light/70">{detail.responsible}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-sf-light/40">处理结果: </span>
                        <span className={isActive ? 'text-sf-light/70' : 'text-sf-light/30'}>{detail.result}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-sf-light/40">时间戳</span>
                        <span className="text-sf-light/50 font-mono">{formatMsTime(detail.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  {level < 3 && (
                    <div className="flex-shrink-0">
                      <ChevronRight size={24} className={isActive ? 'text-sf-light/30' : 'text-sf-light/10'} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>

          <div className="mt-4 p-4 bg-sf-dark/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-sf-blue flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sf-light text-sm">异常详情</div>
                <div className="text-sf-light/50 text-xs mt-1">
                  检测时间: {exception.detected_at ? formatMsTime(exception.detected_at) : '-'}
                  {exception.responder_id && ` · 处理人: 客服 ${exception.responder_id}`}
                  {exception.resolved_at && ` · 解决时间: ${formatMsTime(exception.resolved_at)}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-display text-sf-light">运输轨迹</h3>
                {newEventBadge && prevEventCount < events.length && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-sf-red/10 text-sf-red text-xs rounded-full animate-bounce">
                    <Sparkles size={12} />
                    新事件 +{events.length - prevEventCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sf-light/50 text-sm">
                <Activity size={14} className="text-sf-green" />
                <span>共 {events.length} 条轨迹记录</span>
              </div>
            </div>
            <div className="relative">
              {events.map((event, index) => {
                const config = eventTypeConfig[event.event_type || event.status] || eventTypeConfig.in_transit
                const EventIcon = config.icon
                const isLatest = index === 0
                const isSimulated = (event as any).isSimulated
                return (
                  <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center z-10 transition-all ${
                          isLatest
                            ? 'bg-sf-red text-white ring-4 ring-sf-red/20 scale-110'
                            : `${config.bgColor} ${config.color}`
                        }`}
                      >
                        <EventIcon size={22} />
                      </div>
                      {index < events.length - 1 && (
                        <div className={`absolute top-12 w-0.5 h-full ${
                          isLatest ? 'bg-sf-red/30' : 'bg-sf-blue/20'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-3">
                        <h4 className={`font-display text-lg ${isLatest ? 'text-sf-light' : 'text-sf-light/70'}`}>
                          {config.label}
                        </h4>
                        {isLatest && (
                          <span className="px-2 py-0.5 bg-sf-red/10 text-sf-red text-xs rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-sf-red rounded-full animate-pulse" />
                            最新状态
                          </span>
                        )}
                        {isSimulated && (
                          <span className="px-2 py-0.5 bg-sf-blue/10 text-sf-blue text-xs rounded flex items-center gap-1">
                            <Radio size={10} />
                            实时
                          </span>
                        )}
                      </div>
                      <p className="text-sf-light/60 text-base mt-2">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-2 text-sf-light/50">
                          <Clock size={14} />
                          <span className="font-mono">
                            {formatMsTime(event.created_at || event.event_time!)}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sf-light/50">
                            <MapPin size={14} />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.operator && (
                          <div className="flex items-center gap-2 text-sf-light/50">
                            <User size={14} />
                            <span>操作员: {event.operator}</span>
                          </div>
                        )}
                      </div>
                      {event.remark && (
                        <div className="mt-4 p-4 bg-sf-dark/50 rounded-lg text-sm text-sf-light/70 border border-sf-blue/10">
                          <span className="text-sf-blue">📝 备注:</span> {event.remark}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {events.length === 0 && (
                <div className="text-center py-12 text-sf-light/50">
                  <Package size={48} className="mx-auto mb-4 opacity-30" />
                  <p>暂无轨迹信息，揽收后将实时更新</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display text-sf-light">运单信息</h3>
              <button
                onClick={() => setShowDecryptModal(true)}
                className="flex items-center gap-1 text-sf-blue text-sm hover:text-sf-blue/80 transition-colors"
              >
                <Key size={14} />
                <span>申请解密</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sf-light/50 text-sm mb-1">运单号</div>
                <div className="text-sf-light font-mono text-lg">{order.tracking_no || order.order_no}</div>
              </div>
              <div>
                <div className="text-sf-light/50 text-sm mb-1">承运方式</div>
                <div className="text-sf-light">{order.carrier || '标准快递'}</div>
              </div>
              <div>
                <div className="text-sf-light/50 text-sm mb-1">物品信息</div>
                <div className="text-sf-light">{order.goods_type} · {order.weight}kg</div>
              </div>
              <div>
                <div className="text-sf-light/50 text-sm mb-1">预估运费</div>
                <div className="text-sf-red font-display text-2xl">¥{(order.cost || 0).toFixed(2)}</div>
              </div>
              <div className="h-px bg-sf-blue/20" />
              <div>
                <div className="text-sf-light/50 text-sm mb-1">寄件人</div>
                <div className="text-sf-light font-medium">{order.sender_name}</div>
                <div className="flex items-center gap-1 text-sf-light/70 text-sm mt-1">
                  <Phone size={14} />
                  <span>{order.sender_phone}</span>
                </div>
                <div className="flex items-start gap-1 text-sf-light/70 text-sm mt-1">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{order.sender_address}</span>
                </div>
              </div>
              <div className="h-px bg-sf-blue/20" />
              <div>
                <div className="text-sf-light/50 text-sm mb-1">收件人</div>
                <div className="text-sf-light font-medium">{order.receiver_name}</div>
                <div className="flex items-center gap-1 text-sf-light/70 text-sm mt-1">
                  <Phone size={14} />
                  <span>{order.receiver_phone}</span>
                  <button
                    onClick={() => setShowDecryptModal(true)}
                    className="ml-2 text-sf-blue hover:text-sf-blue/80 transition-colors"
                    title="申请查看完整手机号"
                  >
                    <Eye size={14} />
                  </button>
                </div>
                <div className="flex items-start gap-1 text-sf-light/70 text-sm mt-1">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{order.receiver_address}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-sf-yellow/30">
            <h3 className="text-lg font-display text-sf-light mb-4">时效信息</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sf-light/50 text-sm">创建时间</span>
                <span className="text-sf-light text-sm font-mono">
                  {order.created_at ? formatMsTime(order.created_at) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sf-light/50 text-sm">预计送达</span>
                <span className="text-sf-yellow text-sm font-medium">
                  {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('zh-CN') : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sf-light/50 text-sm">当前状态</span>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  order.status === 'delivered' ? 'bg-sf-green/10 text-sf-green' :
                  order.status === 'exception' ? 'bg-sf-red/10 text-sf-red' :
                  'bg-sf-blue/10 text-sf-blue'
                }`}>
                  {order.status === 'pending' && '待揽收'}
                  {order.status === 'picked_up' && '已揽收'}
                  {order.status === 'in_transit' && '运输中'}
                  {order.status === 'out_for_delivery' && '派送中'}
                  {order.status === 'delivered' && '已签收'}
                  {order.status === 'exception' && '异常'}
                </span>
              </div>
              <div className="h-px bg-sf-blue/20" />
              <div className="p-3 bg-sf-dark/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-sf-light/50">
                  <Clock size={12} />
                  <span>运输时效预计</span>
                </div>
                <div className="text-sf-light text-sm mt-1">
                  正常情况下预计 {order.estimated_delivery ?
                    Math.ceil((new Date(order.estimated_delivery).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
                    3} 天内送达
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDecryptModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-sf-black border border-sf-blue/30 rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-display text-sf-light mb-2">申请解密隐私数据</h3>
            <p className="text-sf-light/50 text-sm mb-6">
              根据 ISO27001 安全规范，查看完整隐私数据需提交申请并获得审批
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">解密字段</label>
                <div className="h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg flex items-center text-sf-light">
                  收件人手机号
                </div>
              </div>
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">申请理由</label>
                <textarea
                  value={decryptReason}
                  onChange={(e) => setDecryptReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors resize-none"
                  placeholder="请详细说明查看隐私数据的业务原因..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDecryptModal(false)
                  setDecryptReason('')
                }}
                className="px-6 h-11 rounded-lg border border-sf-blue/30 text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleApplyDecrypt}
                className="px-6 h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackDetail
