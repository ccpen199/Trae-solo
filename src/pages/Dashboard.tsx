import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  FileCheck,
  Clock,
  Truck,
  Plus,
  Zap,
  TrendingUp,
  MapPin,
  Package,
  Thermometer,
  FileText,
  Wallet,
  Shield,
  AlertTriangle,
  BarChart3,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  RefreshCw,
  Target,
  Layers,
  CreditCard,
  Eye,
  Bell,
  Gauge,
  X,
  ChevronRight,
  CheckCircle,
  Phone,
  Filter,
  AlertCircle,
  TrendingDown,
  History,
  User
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import HeatMap from '@/components/HeatMap'
import StatusBadge from '@/components/StatusBadge'
import { api } from '@/utils/api'

interface CapacityDetail {
  total: number
  idle: number
  busy: number
  offline: number
  byVehicle: Record<string, number>
  byCapacity: { range: string; count: number }[]
}

interface PriceIndex {
  from: string
  to: string
  price: number
  change: number
  trend: 'up' | 'down' | 'stable'
  volume: number
}

interface BusinessEvent {
  id: string
  type: 'match' | 'price' | 'waybill' | 'settlement'
  title: string
  desc: string
  time: string
  status: 'success' | 'warning' | 'info'
  orderNo?: string
  waybillNo?: string
  settlementNo?: string
  fromCity?: string
  toCity?: string
  cargoType?: string
  weight?: number
  mode?: string
  price?: number
  driver?: {
    id: string
    name: string
    phone: string
    plateNo: string
    vehicleType: string
    capacity: number
    creditScore: number
    onTimeRate: number
    violationCount: number
    complaintRate: number
    level: 'excellent' | 'good' | 'fair' | 'poor'
  }
  shipper?: {
    id: string
    company: string
    contact: string
    creditLimit: number
    usedAmount: number
    rating: 'A' | 'B' | 'C' | 'D'
  }
  matchDetail?: {
    matchScore: number
    matchTime: string
    candidates: Array<{
      id: string
      name: string
      score: number
      price: number
      status: 'selected' | 'rejected' | 'pending'
      rejectReason?: string
    }>
    bargainingHistory: Array<{
      side: 'shipper' | 'driver'
      price: number
      time: string
      message?: string
    }>
    coldChain?: {
      tempMin: number
      tempMax: number
      humidMin: number
      humidMax: number
      needRecorder: boolean
    }
    riskFilter?: {
      minCreditScore: number
      minOnTimeRate: number
      excludeViolation: boolean
      rejectedCount: number
      rejectReasons: string[]
    }
  }
  handler?: {
    name: string
    role: string
    time: string
    opinion?: string
  }
}

interface DriverCredit {
  id: number
  name: string
  plateNo: string
  vehicleType: string
  score: number
  onTimeRate: number
  violationCount: number
  complaintRate: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [matchMode, setMatchMode] = useState<'ftl' | 'ltl' | 'partial'>('ftl')
  const [cargoFilter, setCargoFilter] = useState('all')
  const [capacityDetail, setCapacityDetail] = useState<CapacityDetail | null>(null)
  const [priceIndices, setPriceIndices] = useState<PriceIndex[]>([])
  const [events, setEvents] = useState<BusinessEvent[]>([])
  const [topDrivers, setTopDrivers] = useState<DriverCredit[]>([])
  const [warnings, setWarnings] = useState<any[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<BusinessEvent | null>(null)
  const [detailTab, setDetailTab] = useState<'overview' | 'match' | 'bargain' | 'document'>('overview')

  const heatMapPoints = [
    { x: 0.55, y: 0.35, intensity: 0.95, label: '上海' },
    { x: 0.50, y: 0.40, intensity: 0.88, label: '南京' },
    { x: 0.45, y: 0.50, intensity: 0.82, label: '武汉' },
    { x: 0.60, y: 0.50, intensity: 0.75, label: '杭州' },
    { x: 0.40, y: 0.35, intensity: 0.68, label: '郑州' },
    { x: 0.35, y: 0.40, intensity: 0.62, label: '西安' },
    { x: 0.65, y: 0.55, intensity: 0.58, label: '福州' },
    { x: 0.48, y: 0.60, intensity: 0.55, label: '长沙' },
    { x: 0.58, y: 0.65, intensity: 0.92, label: '广州' },
    { x: 0.57, y: 0.68, intensity: 0.88, label: '深圳' },
    { x: 0.42, y: 0.30, intensity: 0.48, label: '太原' },
    { x: 0.52, y: 0.28, intensity: 0.52, label: '济南' },
    { x: 0.62, y: 0.38, intensity: 0.78, label: '苏州' },
    { x: 0.38, y: 0.55, intensity: 0.65, label: '重庆' },
    { x: 0.36, y: 0.58, intensity: 0.72, label: '成都' },
    { x: 0.55, y: 0.25, intensity: 0.35, label: '北京' },
  ]

  const matchModes = [
    { value: 'ftl', label: '整车', desc: '整车载货，直达运输', icon: Truck },
    { value: 'ltl', label: '零担', desc: '零散货物，凑整发运', icon: Layers },
    { value: 'partial', label: '拼车', desc: '多货同车，成本分摊', icon: Package },
  ]

  const cargoTags = [
    { value: 'all', label: '全部', color: 'bg-gray-100 text-gray-600' },
    { value: '建材', label: '建材', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { value: '生鲜', label: '生鲜', color: 'bg-green-50 text-green-600 border-green-200' },
    { value: '冷链', label: '冷链', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { value: '大件', label: '大件', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { value: '电子', label: '电子', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  ]

  const businessEntries = [
    { icon: Thermometer, label: '冷链温湿度', desc: '实时监控冷链货物', path: '/monitoring', color: 'bg-blue-500', badge: '12条告警' },
    { icon: FileText, label: '电子运单', desc: '离线接单+电子签收', path: '/driver', color: 'bg-indigo-500', badge: '38待处理' },
    { icon: Wallet, label: '分账结算', desc: 'T+1自动到账', path: '/settlement', color: 'bg-emerald-500', badge: '¥128万待结' },
    { icon: Shield, label: '授信风控', desc: '货主额度+司机准入', path: '/admin/risk', color: 'bg-orange-500', badge: '5待审核' },
  ]

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setRefreshing(true)
    try {
      const [capRes, priceRes, warnRes] = await Promise.all([
        api.get<any>('/capacity/statistics'),
        api.get<any>('/pricing/routes?pageSize=5'),
        api.get<any>('/admin/warnings?pageSize=3'),
      ])
      setCapacityDetail({
        total: capRes.totalDrivers || 3500000,
        idle: capRes.idleDrivers || 1280000,
        busy: capRes.busyDrivers || 1820000,
        offline: capRes.offlineDrivers || 400000,
        byVehicle: capRes.byVehicleType || {
          '重型平板': 1050000, '中型厢式': 980000, '轻型冷藏': 420000,
          '大型集装箱': 680000, '危险品罐车': 370000
        },
        byCapacity: [
          { range: '0-5吨', count: 520000 },
          { range: '5-15吨', count: 1180000 },
          { range: '15-30吨', count: 1050000 },
          { range: '30吨以上', count: 750000 },
        ]
      })
      setPriceIndices(priceRes.routes?.map((r: any) => ({
        from: r.from_city,
        to: r.to_city,
        price: r.current_price,
        change: Math.round((r.current_price - r.base_price) / r.base_price * 100),
        trend: r.current_price > r.base_price ? 'up' : r.current_price < r.base_price ? 'down' : 'stable',
        volume: Math.round(200 + Math.random() * 300)
      })) || [
        { from: '北京', to: '上海', price: 420, change: 8, trend: 'up', volume: 356 },
        { from: '上海', to: '广州', price: 385, change: -3, trend: 'down', volume: 412 },
        { from: '广州', to: '成都', price: 365, change: 5, trend: 'up', volume: 289 },
        { from: '上海', to: '武汉', price: 298, change: 0, trend: 'stable', volume: 267 },
        { from: '杭州', to: '南京', price: 135, change: 12, trend: 'up', volume: 198 },
      ])
      setWarnings(warnRes.warnings || [
        { from_city: '广州', to_city: '长沙', warning_level: 'critical', description: '端午旺季运力严重不足' },
        { from_city: '上海', to_city: '杭州', warning_level: 'high', description: '梅雨季道路运输受阻' },
        { from_city: '北京', to_city: '成都', warning_level: 'medium', description: '西向货源激增35%' },
      ])
      setForecast([
        { date: '今日', volume: 5230, trend: 'peak' },
        { date: '明日', volume: 4890, trend: 'normal' },
        { date: '后日', volume: 5680, trend: 'peak' },
        { date: '3天后', volume: 4120, trend: 'valley' },
        { date: '4天后', volume: 3890, trend: 'valley' },
      ])
      setEvents([
        {
          id: '1', type: 'match', title: '智能撮合成功',
          desc: '沪A·D8521 匹配 上海→苏州 建材 28吨',
          time: '刚刚', status: 'success',
          orderNo: 'HD202606020001',
          waybillNo: 'WB202606020001',
          fromCity: '上海', toCity: '苏州',
          cargoType: '建材', weight: 28, mode: '整车', price: 3200,
          driver: {
            id: 'D001', name: '张伟', phone: '138****5678', plateNo: '沪A·D8521',
            vehicleType: '重型平板', capacity: 35, creditScore: 95,
            onTimeRate: 99.2, violationCount: 0, complaintRate: 0.02, level: 'excellent'
          },
          shipper: {
            id: 'S001', company: '上海鑫达物流', contact: '陈经理',
            creditLimit: 500000, usedAmount: 320000, rating: 'A'
          },
          matchDetail: {
            matchScore: 96, matchTime: '3.2秒',
            candidates: [
              { id: 'D001', name: '张伟', score: 96, price: 3200, status: 'selected' },
              { id: 'D002', name: '李强', score: 88, price: 3400, status: 'rejected', rejectReason: '报价偏高' },
              { id: 'D003', name: '王刚', score: 82, price: 3100, status: 'rejected', rejectReason: '信用分不足' },
              { id: 'D004', name: '赵军', score: 75, price: 3000, status: 'rejected', rejectReason: '车型不匹配' },
              { id: 'D005', name: '刘洋', score: 70, price: 3150, status: 'pending' },
            ],
            bargainingHistory: [
              { side: 'shipper', price: 3000, time: '10:02:15', message: '发货方出价' },
              { side: 'driver', price: 3400, time: '10:02:30', message: '司机报价' },
              { side: 'shipper', price: 3200, time: '10:02:45', message: '发货方还价' },
              { side: 'driver', price: 3200, time: '10:02:50', message: '司机同意成交' },
            ],
            riskFilter: {
              minCreditScore: 80, minOnTimeRate: 90, excludeViolation: true,
              rejectedCount: 12, rejectReasons: ['信用分低于80', '有违章记录', '车型不匹配', '报价超出范围']
            }
          },
          handler: { name: 'AI撮合引擎', role: '系统自动', time: '10:02:51', opinion: '撮合成功' }
        },
        {
          id: '2', type: 'price', title: '运价指数更新',
          desc: '北京→上海线路 上涨 ¥35/吨',
          time: '2分钟前', status: 'info',
          fromCity: '北京', toCity: '上海',
          price: 487,
          shipper: {
            id: 'S002', company: '北京中运达', contact: '王总',
            creditLimit: 800000, usedAmount: 150000, rating: 'A'
          },
          handler: { name: '运价引擎', role: '系统自动', time: '10:00:00', opinion: '供需比变化触发调价' }
        },
        {
          id: '3', type: 'waybill', title: '电子运单签收',
          desc: 'WB202606000123 广州→深圳 冷链 已签收',
          time: '5分钟前', status: 'success',
          waybillNo: 'WB202606000123', orderNo: 'HD202606010089',
          fromCity: '广州', toCity: '深圳',
          cargoType: '冷链', weight: 12, mode: '整车', price: 2800,
          driver: {
            id: 'D003', name: '王刚', phone: '137****9876', plateNo: '粤C·11111',
            vehicleType: '轻型冷藏', capacity: 8, creditScore: 98,
            onTimeRate: 99.8, violationCount: 0, complaintRate: 0.0, level: 'excellent'
          },
          shipper: {
            id: 'S003', company: '广州兴盛供应链', contact: '黄经理',
            creditLimit: 200000, usedAmount: 195000, rating: 'C'
          },
          matchDetail: {
            matchScore: 98, matchTime: '2.5秒',
            candidates: [
              { id: 'D003', name: '王刚', score: 98, price: 2800, status: 'selected' },
              { id: 'D008', name: '黄明', score: 94, price: 2900, status: 'rejected', rejectReason: '报价偏高' },
            ],
            bargainingHistory: [
              { side: 'shipper', price: 2800, time: '08:30:00', message: '发货方出价' },
              { side: 'driver', price: 2800, time: '08:30:15', message: '司机秒接' },
            ],
            coldChain: {
              tempMin: -18, tempMax: -12, humidMin: 60, humidMax: 80, needRecorder: true
            },
            riskFilter: {
              minCreditScore: 90, minOnTimeRate: 95, excludeViolation: true,
              rejectedCount: 5, rejectReasons: ['无温控车', '信用分不足', '准点率不够']
            }
          },
          handler: { name: '李经理', role: '运营专员', time: '09:58:23', opinion: '确认签收，货物完好' }
        },
        {
          id: '4', type: 'settlement', title: '分账完成',
          desc: '¥12,850 已打款至司机账户',
          time: '8分钟前', status: 'success',
          settlementNo: 'ST202606020001', waybillNo: 'WB202606010078',
          price: 12850,
          driver: {
            id: 'D002', name: '李强', phone: '139****1234', plateNo: '沪B·67890',
            vehicleType: '中型厢式', capacity: 18, creditScore: 88,
            onTimeRate: 96.8, violationCount: 2, complaintRate: 0.05, level: 'good'
          },
          shipper: {
            id: 'S001', company: '上海鑫达物流', contact: '陈经理',
            creditLimit: 500000, usedAmount: 320000, rating: 'A'
          },
          handler: { name: '分账系统', role: '系统自动', time: '10:01:30', opinion: 'T+1结算完成，司机实得¥11,822，平台服务费¥1,028' }
        },
        {
          id: '5', type: 'match', title: '撮合博弈中',
          desc: '浙B·K3372 议价 上海→杭州 生鲜',
          time: '12分钟前', status: 'warning',
          orderNo: 'HD202606020005',
          fromCity: '上海', toCity: '杭州',
          cargoType: '生鲜', weight: 15, mode: '零担', price: 2600,
          driver: {
            id: 'D005', name: '刘洋', phone: '135****8765', plateNo: '浙E·33333',
            vehicleType: '危险品罐车', capacity: 30, creditScore: 92,
            onTimeRate: 98.1, violationCount: 1, complaintRate: 0.03, level: 'good'
          },
          shipper: {
            id: 'S002', company: '杭州远航贸易', contact: '林总',
            creditLimit: 300000, usedAmount: 280000, rating: 'B'
          },
          matchDetail: {
            matchScore: 92, matchTime: '5.8秒',
            candidates: [
              { id: 'D005', name: '刘洋', score: 92, price: 2800, status: 'pending' },
              { id: 'D007', name: '杨帆', score: 80, price: 2500, status: 'rejected', rejectReason: '车型不匹配' },
              { id: 'D009', name: '周涛', score: 90, price: 2700, status: 'pending' },
            ],
            bargainingHistory: [
              { side: 'shipper', price: 2500, time: '09:50:00', message: '发货方出价' },
              { side: 'driver', price: 2800, time: '09:50:20', message: '司机报价，要求加价' },
              { side: 'shipper', price: 2600, time: '09:51:00', message: '发货方还价' },
            ],
            riskFilter: {
              minCreditScore: 80, minOnTimeRate: 90, excludeViolation: false,
              rejectedCount: 3, rejectReasons: ['车型不匹配', '信用分不足', '有违章记录']
            }
          },
          handler: { name: '张主管', role: '运营主管', time: '09:52:30', opinion: '议价中，建议加价至¥2700' }
        },
        {
          id: '6', type: 'waybill', title: '温湿度告警',
          desc: 'WB202606000089 温度超标 -8℃→-3℃',
          time: '15分钟前', status: 'warning',
          waybillNo: 'WB202606000089', orderNo: 'HD202606010056',
          fromCity: '广州', toCity: '长沙',
          cargoType: '冷链', weight: 10, mode: '整车', price: 4500,
          driver: {
            id: 'D008', name: '黄明', phone: '132****6789', plateNo: '湘H·66666',
            vehicleType: '轻型冷藏', capacity: 10, creditScore: 94,
            onTimeRate: 98.9, violationCount: 0, complaintRate: 0.01, level: 'excellent'
          },
          shipper: {
            id: 'S004', company: '武汉通惠物流', contact: '张经理',
            creditLimit: 100000, usedAmount: 98000, rating: 'D'
          },
          matchDetail: {
            coldChain: {
              tempMin: -18, tempMax: -12, humidMin: 60, humidMax: 80, needRecorder: true
            }
          },
          handler: { name: '王监控', role: '监控专员', time: '10:05:00', opinion: '已通知司机检查制冷机组，温度正在恢复中' }
        },
      ])
      setTopDrivers([
        { id: 1, name: '张师傅', plateNo: '沪A·D8521', vehicleType: '重型平板', score: 98.5, onTimeRate: 99.2, violationCount: 0, complaintRate: 0.1, status: 'excellent' },
        { id: 2, name: '李师傅', plateNo: '粤B·K3372', vehicleType: '轻型冷藏', score: 96.2, onTimeRate: 97.8, violationCount: 1, complaintRate: 0.3, status: 'excellent' },
        { id: 3, name: '王师傅', plateNo: '京E·T2891', vehicleType: '大型集装箱', score: 92.8, onTimeRate: 95.5, violationCount: 2, complaintRate: 0.8, status: 'good' },
        { id: 4, name: '赵师傅', plateNo: '苏F·M7733', vehicleType: '中型厢式', score: 88.5, onTimeRate: 91.2, violationCount: 3, complaintRate: 1.5, status: 'fair' },
      ])
    } finally {
      setRefreshing(false)
    }
  }

  const coreStats = [
    { icon: Users, value: '128.5万', label: '在线司机', sublabel: '总运力池 350万', trend: 12.5, color: 'gradient-primary' },
    { icon: FileCheck, value: '3,526', label: '今日成交单', sublabel: '撮合成功率 98.5%', trend: 8.3, color: 'gradient-accent' },
    { icon: Clock, value: '8秒', label: '平均匹配耗时', sublabel: '秒级智能撮合', trend: -5.2, color: 'gradient-mint' },
    { icon: BarChart3, value: '156万', label: '今日运价指数', sublabel: '10万条线路', trend: 3.8, color: 'gradient-coral' },
  ]

  const formatNumber = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toLocaleString()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <Gauge className="text-accent" size={24} />
            运营指挥中心
          </h1>
          <p className="text-sm text-muted mt-0.5">350万运力实时调度 · 10万条运价指数 · 全链路业务可追溯</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted font-mono bg-gray-50 px-3 py-1.5 rounded">
            {new Date().toLocaleString('zh-CN')}
          </span>
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="text-xs">刷新</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {coreStats.map((stat, i) => (
          <StatCard
            key={i}
            icon={<stat.icon size={20} />}
            value={stat.value}
            label={stat.label}
            sublabel={stat.sublabel}
            trend={{ value: stat.trend, positive: stat.trend > 0 }}
            gradient={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="card p-0 overflow-hidden">
            <div className="relative">
              <HeatMap
                points={heatMapPoints}
                height={320}
                title="全国运力热力图 · 供需预警叠加"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {warnings.slice(0, 3).map((w, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-lg text-xs backdrop-blur-sm border ${
                      w.warning_level === 'critical' ? 'bg-red-50/90 border-red-200 text-red-700' :
                      w.warning_level === 'high' ? 'bg-orange-50/90 border-orange-200 text-orange-700' :
                      'bg-yellow-50/90 border-yellow-200 text-yellow-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle size={12} />
                      {w.from_city}→{w.to_city}
                    </div>
                    <div className="opacity-80 mt-0.5">{w.description}</div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border">
                <div className="text-xs text-muted mb-1">区域波峰波谷预测</div>
                <div className="flex gap-2">
                  {forecast.map((f, i) => (
                    <div key={i} className="text-center">
                      <div className={`w-10 h-6 rounded ${
                        f.trend === 'peak' ? 'bg-red-400' : f.trend === 'valley' ? 'bg-green-400' : 'bg-gray-300'
                      }`} style={{ height: `${Math.min(f.volume / 100, 24)}px` }} />
                      <div className="text-[10px] text-muted mt-1">{f.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Truck size={16} className="text-primary" />
                运力池明细
              </h3>
              <button onClick={() => navigate('/capacity')} className="text-xs text-primary/60 hover:text-primary flex items-center gap-1">
                查看全部 <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">{capacityDetail ? formatNumber(capacityDetail.idle) : '128万'}</div>
                <div className="text-[10px] text-green-600/70">空闲</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-600">{capacityDetail ? formatNumber(capacityDetail.busy) : '182万'}</div>
                <div className="text-[10px] text-orange-600/70">运输中</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-500">{capacityDetail ? formatNumber(capacityDetail.offline) : '40万'}</div>
                <div className="text-[10px] text-gray-500/70">离线</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted mb-2">车型分布</div>
                <div className="space-y-2">
                  {capacityDetail?.byVehicle && Object.entries(capacityDetail.byVehicle).map(([type, count]: [string, any]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-[10px] w-16 truncate text-secondary">{type}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${count / 11000}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-muted w-12 text-right">{formatNumber(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted mb-2">载重分布</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {capacityDetail?.byCapacity?.map((c, i) => (
                    <div key={i} className="bg-gray-50 rounded p-1.5 text-center">
                      <div className="text-[10px] font-medium text-primary">{c.range}</div>
                      <div className="text-[9px] text-muted">{formatNumber(c.count)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Target size={16} className="text-accent" />
                智能撮合引擎
              </h3>
              <button onClick={() => navigate('/matching')} className="text-xs bg-primary text-white px-2.5 py-1 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1">
                <Plus size={12} /> 发布货源
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {matchModes.map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.value}
                    onClick={() => setMatchMode(mode.value as any)}
                    className={`flex-1 p-2.5 rounded-lg border-2 transition-all ${
                      matchMode === mode.value
                        ? 'border-accent bg-accent/5'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <Icon size={16} className={matchMode === mode.value ? 'text-accent' : 'text-muted'} />
                    <div className={`text-xs font-medium mt-1 ${matchMode === mode.value ? 'text-accent' : 'text-secondary'}`}>{mode.label}</div>
                    <div className="text-[10px] text-muted">{mode.desc}</div>
                  </button>
                )
              })}
            </div>

            <div className="mb-4">
              <div className="text-xs text-muted mb-2">货源分级标签</div>
              <div className="flex flex-wrap gap-1.5">
                {cargoTags.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() => setCargoFilter(tag.value)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${tag.color} ${
                      cargoFilter === tag.value ? 'ring-2 ring-offset-1 ring-primary/30' : ''
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-muted mb-2">实时撮合状态</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-bold text-primary">125</div>
                  <div className="text-[10px] text-muted">待撮合</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-accent">89</div>
                  <div className="text-[10px] text-muted">博弈中</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-green-600">1,526</div>
                  <div className="text-[10px] text-muted">今日成交</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <TrendingUp size={16} className="text-mint" />
                10万线路运价指数
              </h3>
              <button onClick={() => navigate('/pricing')} className="text-xs text-primary/60 hover:text-primary flex items-center gap-1">
                查看全部 <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {priceIndices.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">{p.from}</span>
                    <ArrowUpRight size={12} className="text-muted rotate-45" />
                    <span className="text-sm font-medium text-primary">{p.to}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-primary">¥{p.price}</span>
                    <span className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                      p.trend === 'up' ? 'bg-red-50 text-red-600' :
                      p.trend === 'down' ? 'bg-green-50 text-green-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {p.trend === 'up' ? <ArrowUpRight size={10} /> : p.trend === 'down' ? <ArrowDownRight size={10} /> : '—'}
                      {p.change !== 0 ? `${Math.abs(p.change)}%` : '平'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-muted">
              <span>月单量指数</span>
              <div className="flex gap-1">
                {priceIndices.map((p, i) => (
                  <div key={i} className="w-3 bg-primary/20 rounded-t" style={{ height: `${p.volume / 15}px` }} title={`${p.from}→${p.to}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <CreditCard size={16} className="text-purple-500" />
                司机信用档案
              </h3>
              <button onClick={() => navigate('/admin/risk')} className="text-xs text-primary/60 hover:text-primary flex items-center gap-1">
                管理 <Eye size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {topDrivers.map((d) => (
                <div key={d.id} className="p-2 rounded-lg border border-gray-100 hover:border-primary/20 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary">{d.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      d.status === 'excellent' ? 'bg-green-100 text-green-700' :
                      d.status === 'good' ? 'bg-blue-100 text-blue-700' :
                      d.status === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {d.status === 'excellent' ? '优秀' : d.status === 'good' ? '良好' : d.status === 'fair' ? '一般' : '较差'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted">
                    <span>{d.plateNo}</span>
                    <span>·</span>
                    <span>{d.vehicleType}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] font-mono text-yellow-600">{d.score}</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${d.score}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-1.5 text-[9px] text-muted">
                    <span>准点率 {d.onTimeRate}%</span>
                    <span>违章 {d.violationCount}</span>
                    <span>投诉 {d.complaintRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <Package size={16} className="text-blue-500" />
              核心业务入口
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {businessEntries.map((entry) => {
                const Icon = entry.icon
                return (
                  <button
                    key={entry.label}
                    onClick={() => navigate(entry.path)}
                    className="p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-9 h-9 rounded-lg ${entry.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{entry.badge}</span>
                    </div>
                    <div className="text-xs font-medium text-primary">{entry.label}</div>
                    <div className="text-[10px] text-muted mt-0.5">{entry.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="col-span-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" />
                实时业务动态流
              </h3>
              <button className="text-xs text-primary/60 hover:text-primary flex items-center gap-1">
                <Bell size={12} /> 全部
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {events.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setSelectedEvent(e)}
                  className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-primary/20"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    e.type === 'match' ? 'bg-blue-100 text-blue-600' :
                    e.type === 'price' ? 'bg-purple-100 text-purple-600' :
                    e.type === 'waybill' ? 'bg-green-100 text-green-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {e.type === 'match' ? <Zap size={14} /> :
                     e.type === 'price' ? <TrendingUp size={14} /> :
                     e.type === 'waybill' ? <FileText size={14} /> :
                     <Wallet size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">{e.title}</span>
                      {e.status === 'success' ? <CheckCircle2 size={12} className="text-green-500" /> :
                       e.status === 'warning' ? <AlertTriangle size={12} className="text-orange-500" /> : null}
                    </div>
                    <p className="text-[11px] text-muted mt-0.5 truncate">{e.desc}</p>
                    {e.orderNo && <p className="text-[10px] text-primary/50 mt-0.5 font-mono">单号: {e.orderNo || e.waybillNo || e.settlementNo}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-muted">{e.time}</span>
                    <ChevronRight size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedEvent.type === 'match' ? 'bg-blue-100 text-blue-600' :
                  selectedEvent.type === 'price' ? 'bg-purple-100 text-purple-600' :
                  selectedEvent.type === 'waybill' ? 'bg-green-100 text-green-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {selectedEvent.type === 'match' ? <Zap size={18} /> :
                   selectedEvent.type === 'price' ? <TrendingUp size={18} /> :
                   selectedEvent.type === 'waybill' ? <FileText size={18} /> :
                   <Wallet size={18} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary">{selectedEvent.title}</h2>
                  <p className="text-xs text-muted">
                    {selectedEvent.time} · {selectedEvent.desc}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={18} className="text-muted" />
              </button>
            </div>

            {selectedEvent.matchDetail && (
              <div className="flex gap-1 px-6 pt-4 border-b border-gray-100">
                <button
                  onClick={() => setDetailTab('overview')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary'
                  }`}
                >
                  业务概览
                </button>
                <button
                  onClick={() => setDetailTab('match')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === 'match' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary'
                  }`}
                >
                  秒级撮合候选
                </button>
                <button
                  onClick={() => setDetailTab('bargain')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === 'bargain' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary'
                  }`}
                >
                  议价过程
                </button>
                <button
                  onClick={() => setDetailTab('document')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === 'document' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary'
                  }`}
                >
                  风控筛选链
                </button>
              </div>
            )}

            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {detailTab === 'overview' && (
                <div className="space-y-6">
                  {selectedEvent.fromCity && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                        <div className="text-xs text-muted mb-1">出发城市</div>
                        <div className="text-lg font-bold text-primary">{selectedEvent.fromCity}</div>
                        <MapPin size={14} className="text-blue-500 mt-1" />
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center">
                        <div className="text-xs text-muted mb-2">运输信息</div>
                        <div className="flex items-center gap-2">
                          <Truck size={16} className="text-indigo-500" />
                          <span className="text-sm font-medium text-secondary">{selectedEvent.cargoType} {selectedEvent.weight}吨</span>
                        </div>
                        <div className="text-[10px] text-muted mt-1">{selectedEvent.mode}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                        <div className="text-xs text-muted mb-1">目的城市</div>
                        <div className="text-lg font-bold text-primary">{selectedEvent.toCity}</div>
                        <MapPin size={14} className="text-green-500 mt-1" />
                      </div>
                    </div>
                  )}

                  {selectedEvent.price && (
                    <div className="p-5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted">成交运费</div>
                        <div className="text-3xl font-bold text-primary">¥{selectedEvent.price.toLocaleString()}</div>
                      </div>
                      {selectedEvent.matchDetail && (
                        <div className="text-right">
                          <div className="text-sm text-muted">撮合匹配度</div>
                          <div className="text-2xl font-bold text-accent">{selectedEvent.matchDetail.matchScore}分</div>
                          <div className="text-[10px] text-muted mt-1">耗时 {selectedEvent.matchDetail.matchTime}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedEvent.orderNo && (
                    <div className="grid grid-cols-3 gap-4">
                      {selectedEvent.orderNo && (
                        <div className="p-4 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-muted mb-1">订单号</div>
                          <div className="text-sm font-mono font-bold text-primary">{selectedEvent.orderNo}</div>
                          <button onClick={() => navigate('/matching')} className="text-[10px] text-primary hover:underline mt-1">查看详情</button>
                        </div>
                      )}
                      {selectedEvent.waybillNo && (
                        <div className="p-4 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-muted mb-1">运单号</div>
                          <div className="text-sm font-mono font-bold text-primary">{selectedEvent.waybillNo}</div>
                          <button onClick={() => navigate('/driver')} className="text-[10px] text-primary hover:underline mt-1">查看运单</button>
                        </div>
                      )}
                      {selectedEvent.settlementNo && (
                        <div className="p-4 rounded-xl border border-gray-100">
                          <div className="text-[10px] text-muted mb-1">结算单号</div>
                          <div className="text-sm font-mono font-bold text-primary">{selectedEvent.settlementNo}</div>
                          <button onClick={() => navigate('/settlement')} className="text-[10px] text-primary hover:underline mt-1">查看分账</button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedEvent.driver && (
                    <div className="p-5 rounded-xl border border-gray-100">
                      <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                        <User size={14} /> 司机信用档案
                      </h3>
                      <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-2 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold">
                            {selectedEvent.driver.name[0]}
                          </div>
                          <div>
                            <div className="text-lg font-bold text-primary">{selectedEvent.driver.name}</div>
                            <div className="text-xs text-muted flex items-center gap-1 mt-1">
                              <Phone size={12} /> {selectedEvent.driver.phone}
                            </div>
                            <div className="text-xs text-muted mt-1">
                              {selectedEvent.driver.vehicleType} · {selectedEvent.driver.capacity}吨
                            </div>
                          </div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50">
                          <div className="text-[10px] text-muted mb-1">信用分</div>
                          <div className="text-2xl font-bold text-emerald-600">{selectedEvent.driver.creditScore}</div>
                          <div className="text-[9px] text-muted">
                            {selectedEvent.driver.level === 'excellent' ? '优秀' : selectedEvent.driver.level === 'good' ? '良好' : selectedEvent.driver.level === 'fair' ? '一般' : '较差'}
                          </div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                          <div className="text-[10px] text-muted mb-1">准点率</div>
                          <div className="text-2xl font-bold text-blue-600">{selectedEvent.driver.onTimeRate}%</div>
                          <div className="text-[9px] text-muted">{selectedEvent.driver.plateNo}</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50">
                          <div className="text-[10px] text-muted mb-1">违章/投诉</div>
                          <div className="text-2xl font-bold text-amber-600">{selectedEvent.driver.violationCount}次</div>
                          <div className="text-[9px] text-muted">投诉 {(selectedEvent.driver.complaintRate * 100).toFixed(2)}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedEvent.shipper && (
                    <div className="p-5 rounded-xl border border-gray-100">
                      <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                        <Shield size={14} /> 货主授信额度
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-[10px] text-muted mb-1">货主企业</div>
                          <div className="text-sm font-bold text-primary">{selectedEvent.shipper.company}</div>
                          <div className="text-xs text-muted mt-0.5">联系人：{selectedEvent.shipper.contact}</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-gray-50">
                          <div className="text-[10px] text-muted mb-1">授信额度</div>
                          <div className="text-xl font-bold text-primary">¥{(selectedEvent.shipper.creditLimit / 10000).toFixed(1)}万</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-amber-50">
                          <div className="text-[10px] text-muted mb-1">已用额度</div>
                          <div className="text-xl font-bold text-amber-600">¥{(selectedEvent.shipper.usedAmount / 10000).toFixed(1)}万</div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${(selectedEvent.shipper.usedAmount / selectedEvent.shipper.creditLimit) * 100}%` }} />
                          </div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                          <div className="text-[10px] text-muted mb-1">信用评级</div>
                          <div className="text-3xl font-bold text-indigo-600">{selectedEvent.shipper.rating}</div>
                          <div className="text-[9px] text-muted mt-0.5">
                            {selectedEvent.shipper.rating === 'A' ? '优质客户' : selectedEvent.shipper.rating === 'B' ? '良好客户' : selectedEvent.shipper.rating === 'C' ? '关注客户' : '高风险客户'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedEvent.handler && (
                    <div className="p-5 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50">
                      <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" /> 处理结果
                      </h3>
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <div>
                          <div className="text-[10px] text-muted mb-1">处理人</div>
                          <div className="text-sm font-bold text-primary">{selectedEvent.handler.name}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted mb-1">角色</div>
                          <div className="text-sm text-secondary">{selectedEvent.handler.role}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted mb-1">处理时间</div>
                          <div className="text-sm font-mono text-primary">{selectedEvent.handler.time}</div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-[10px] text-muted mb-1">处理意见</div>
                          <div className="text-sm text-secondary">{selectedEvent.handler.opinion}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'match' && selectedEvent.matchDetail && (
                <div className="space-y-6">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-1 flex items-center gap-2">
                          <Zap size={16} className="text-blue-500" /> 秒级撮合候选列表
                        </h3>
                        <p className="text-xs text-muted">共检索 {selectedEvent.matchDetail.candidates.length + selectedEvent.matchDetail.riskFilter.rejectedCount} 名司机，{selectedEvent.matchDetail.riskFilter.rejectedCount}名被风控规则过滤</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{selectedEvent.matchDetail.matchScore}分</div>
                        <div className="text-[10px] text-muted">匹配度 · 耗时 {selectedEvent.matchDetail.matchTime}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedEvent.matchDetail.candidates.map((c, i) => (
                      <div key={c.id} className={`p-4 rounded-xl border-2 transition-all ${
                        c.status === 'selected' ? 'border-green-300 bg-green-50' :
                        c.status === 'rejected' ? 'border-red-200 bg-red-50/50 opacity-70' :
                        'border-amber-200 bg-amber-50/50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              c.status === 'selected' ? 'bg-green-500' :
                              c.status === 'rejected' ? 'bg-red-400' : 'bg-amber-500'
                            }`}>
                              {i + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">{c.name}</span>
                                {c.status === 'selected' && <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full">✓ 已选中</span>}
                                {c.status === 'rejected' && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">✗ 未选中</span>}
                                {c.status === 'pending' && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">⚡ 待议价</span>}
                              </div>
                              {c.rejectReason && <div className="text-[10px] text-red-500 mt-0.5">原因：{c.rejectReason}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="text-[10px] text-muted mb-1">匹配度</div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${c.score >= 90 ? 'bg-green-500' : c.score >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${c.score}%` }} />
                                </div>
                                <span className="text-sm font-bold text-primary">{c.score}分</span>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] text-muted mb-1">报价</div>
                              <div className="text-lg font-bold text-accent">¥{c.price.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedEvent.matchDetail.coldChain && (
                    <div className="p-5 rounded-xl border border-blue-200 bg-gradient-to-br from-cyan-50 to-blue-50">
                      <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                        <Thermometer size={16} className="text-cyan-500" /> 冷链运输条件（筛选掉不符合温控要求的车辆）
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-white">
                          <div className="text-[10px] text-muted mb-1">温度下限</div>
                          <div className="text-xl font-bold text-cyan-600">{selectedEvent.matchDetail.coldChain.tempMin}°C</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white">
                          <div className="text-[10px] text-muted mb-1">温度上限</div>
                          <div className="text-xl font-bold text-cyan-600">{selectedEvent.matchDetail.coldChain.tempMax}°C</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white">
                          <div className="text-[10px] text-muted mb-1">湿度要求</div>
                          <div className="text-xl font-bold text-blue-600">{selectedEvent.matchDetail.coldChain.humidMin}% - {selectedEvent.matchDetail.coldChain.humidMax}%</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white">
                          <div className="text-[10px] text-muted mb-1">温控记录仪</div>
                          <div className="text-xl font-bold">{selectedEvent.matchDetail.coldChain.needRecorder ? '✓ 需要' : '✗ 不需要'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'bargain' && selectedEvent.matchDetail && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {selectedEvent.matchDetail.bargainingHistory.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-50">
                        <div className="text-xs text-muted mb-1">发货方底价</div>
                        <div className="text-2xl font-bold text-amber-600">
                          ¥{selectedEvent.matchDetail.bargainingHistory[0].price.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {selectedEvent.price && (
                      <div className="p-4 rounded-xl bg-green-50">
                        <div className="text-xs text-muted mb-1">最终成交价</div>
                        <div className="text-2xl font-bold text-green-600">¥{selectedEvent.price.toLocaleString()}</div>
                      </div>
                    )}
                    {selectedEvent.matchDetail.bargainingHistory.length >= 2 && (
                      <div className="p-4 rounded-xl bg-blue-50">
                        <div className="text-xs text-muted mb-1">司机最高报价</div>
                        <div className="text-2xl font-bold text-blue-600">
                          ¥{Math.max(...selectedEvent.matchDetail.bargainingHistory.filter(b => b.side === 'driver').map(b => b.price)).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-semibold text-primary mb-6 flex items-center gap-2">
                      <History size={16} className="text-indigo-500" /> 议价过程时间线
                    </h3>
                    <div className="relative pl-8 space-y-6">
                      {selectedEvent.matchDetail.bargainingHistory.map((b, i) => (
                        <div key={i} className="relative">
                          <div className={`absolute -left-8 top-0 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center ${
                            b.side === 'shipper' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                          <div className="flex items-start gap-4">
                            <div className={`flex-1 p-4 rounded-xl ${
                              b.side === 'shipper' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-medium ${b.side === 'shipper' ? 'text-amber-700' : 'text-blue-700'}`}>
                                  {b.side === 'shipper' ? '📦 发货方' : '🚚 司机'}
                                </span>
                                <span className="text-xs text-muted">{b.time}</span>
                              </div>
                              <div className="flex items-end justify-between">
                                <div className="text-sm text-secondary">{b.message}</div>
                                <div className="text-2xl font-bold text-primary">¥{b.price.toLocaleString()}</div>
                              </div>
                            </div>
                            {i < selectedEvent.matchDetail.bargainingHistory.length - 1 && (
                              <div className="absolute -right-12 top-1/2 -translate-y-1/2">
                                <TrendingDown size={20} className={selectedEvent.matchDetail.bargainingHistory[i + 1].price < b.price ? 'text-green-500' : selectedEvent.matchDetail.bargainingHistory[i + 1].price > b.price ? 'text-red-500' : 'text-gray-400'} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'document' && selectedEvent.matchDetail && (
                <div className="space-y-6">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-red-50 to-orange-50">
                    <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                      <Filter size={16} className="text-red-500" /> 司机准入风控筛选规则
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-white">
                        <div className="text-[10px] text-muted mb-1">最低信用分</div>
                        <div className="text-2xl font-bold text-primary">{selectedEvent.matchDetail.riskFilter.minCreditScore}分</div>
                        <div className="text-[9px] text-emerald-600 mt-1">筛选通过</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-white">
                        <div className="text-[10px] text-muted mb-1">最低准点率</div>
                        <div className="text-2xl font-bold text-primary">{selectedEvent.matchDetail.riskFilter.minOnTimeRate}%</div>
                        <div className="text-[9px] text-emerald-600 mt-1">筛选通过</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-white">
                        <div className="text-[10px] text-muted mb-1">排除违章司机</div>
                        <div className="text-2xl font-bold text-primary">{selectedEvent.matchDetail.riskFilter.excludeViolation ? '是' : '否'}</div>
                        <div className="text-[9px] text-emerald-600 mt-1">筛选通过</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-red-50">
                        <div className="text-[10px] text-muted mb-1">过滤司机数</div>
                        <div className="text-2xl font-bold text-red-600">{selectedEvent.matchDetail.riskFilter.rejectedCount}人</div>
                        <div className="text-[9px] text-red-500 mt-1">未通过风控</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-500" /> 筛选原因分布（被风控过滤）
                    </h3>
                    <div className="space-y-3">
                      {selectedEvent.matchDetail.riskFilter.rejectReasons.map((reason, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-40 text-sm text-secondary">{reason}</div>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${100 - i * 15}%` }} />
                          </div>
                          <div className="w-10 text-xs font-mono text-muted">{Math.floor(12 / (i + 1))}人</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                    <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                      <Shield size={16} className="text-emerald-500" /> 最终成交影响链
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                      {[
                        { label: '货源发布', desc: `${selectedEvent.cargoType} ${selectedEvent.weight}吨 ${selectedEvent.mode}`, icon: Package },
                        { label: '冷链条件', desc: selectedEvent.matchDetail.coldChain ? `${selectedEvent.matchDetail.coldChain.tempMin}~${selectedEvent.matchDetail.coldChain.tempMax}°C` : '无特殊要求', icon: Thermometer },
                        { label: '风控筛选', desc: `≥${selectedEvent.matchDetail.riskFilter.minCreditScore}分`, icon: Shield },
                        { label: '智能撮合', desc: `5候选 · ${selectedEvent.matchDetail.matchTime}`, icon: Zap },
                        { label: '议价博弈', desc: `${selectedEvent.matchDetail.bargainingHistory.length}轮`, icon: History },
                        { label: '最终成交', desc: `¥${selectedEvent.price?.toLocaleString()}`, icon: CheckCircle },
                      ].map((step, i, arr) => (
                        <div key={i} className="flex items-center">
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                              <step.icon size={20} className={i === arr.length - 1 ? 'text-green-500' : 'text-primary'} />
                            </div>
                            <div className="text-xs font-medium text-primary">{step.label}</div>
                            <div className="text-[9px] text-muted">{step.desc}</div>
                          </div>
                          {i < arr.length - 1 && <ChevronRight size={20} className="text-muted mx-2" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
