import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Zap,
  MapPin,
  Package,
  Weight,
  Ruler,
  DollarSign,
  Thermometer,
  Shield,
  Clock,
  User,
  Car,
  Star,
  CheckCircle,
  Loader2,
  ArrowRightLeft,
  MessageSquare,
  History,
  Target,
  Filter,
  Snowflake,
  AlertTriangle,
  TrendingUp,
  Users,
  FilterX,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import DataTable from '@/components/DataTable'
import Chart from '@/components/Chart'
import { api } from '@/utils/api'
import { cn } from '@/lib/utils'

interface CargoForm {
  fromCity: string
  toCity: string
  cargoType: string
  weight: number
  volume: number
  mode: string
  price: number
  minCreditScore: number
  minOnTimeRate: number
  excludeViolation: boolean
  temperature: number
  humidity: number
  needTempControl: boolean
}

interface MatchResult {
  id: string
  driverId?: number
  driverName: string
  avatar: string
  vehicleType: string
  capacity: number
  currentLocation: string
  creditScore: number
  onTimeRate: number
  hasViolation: boolean
  matchScore: number
  price: number
  eta: string
  status: 'idle' | 'busy' | 'offline'
}

interface BargainingRecord {
  id: string
  time: string
  from: 'shipper' | 'driver'
  price: number
  type: 'offer' | 'counter' | 'accept' | 'reject'
  message?: string
}

interface RiskFilterStep {
  label: string
  icon: React.ReactNode
  count: number
  color: string
  bgColor: string
}

const cargoTypeConfig: Record<string, { color: string; bg: string }> = {
  '建材': { color: 'text-amber-700', bg: 'bg-amber-100' },
  '生鲜': { color: 'text-green-700', bg: 'bg-green-100' },
  '冷链': { color: 'text-cyan-700', bg: 'bg-cyan-100' },
  '大件': { color: 'text-orange-700', bg: 'bg-orange-100' },
  '电子': { color: 'text-blue-700', bg: 'bg-blue-100' },
  '化工': { color: 'text-purple-700', bg: 'bg-purple-100' },
  '日用品': { color: 'text-pink-700', bg: 'bg-pink-100' },
}

const cargoTypes = Object.keys(cargoTypeConfig)

const modes = [
  { key: 'ftl', label: '整车', desc: '整车载货直达，无中转，时效最快' },
  { key: 'ltl', label: '零担', desc: '零散凑整发运，适合小批量货物' },
  { key: 'partial', label: '拼车', desc: '多货同车分摊成本，性价比最高' },
]

const referencePrices: Record<string, number> = {
  '建材': 3.2,
  '生鲜': 4.5,
  '冷链': 5.8,
  '大件': 6.2,
  '电子': 4.0,
  '化工': 5.0,
  '日用品': 3.8,
}

const modeMatchConfig: Record<string, { time: string; candidates: number; desc: string; extraInfo: string }> = {
  ftl: { time: '3.2秒', candidates: 5, desc: '1名司机1车直达', extraInfo: '整车直达无需拼载' },
  ltl: { time: '5.8秒', candidates: 8, desc: '多票拼载', extraInfo: '需凑3票，已凑2票' },
  partial: { time: '4.1秒', candidates: 6, desc: '多货同车', extraInfo: '需2票，已凑1票' },
}

const defaultMatches: MatchResult[] = [
  { id: '1', driverId: 101, driverName: '张伟', avatar: '张', vehicleType: '冷藏车', capacity: 20, currentLocation: '上海浦东', creditScore: 96, onTimeRate: 98, hasViolation: false, matchScore: 96, price: 2800, eta: '2小时', status: 'idle' },
  { id: '2', driverId: 102, driverName: '李强', avatar: '李', vehicleType: '冷藏车', capacity: 25, currentLocation: '上海松江', creditScore: 92, onTimeRate: 95, hasViolation: false, matchScore: 91, price: 2950, eta: '2.5小时', status: 'idle' },
  { id: '3', driverId: 103, driverName: '陈明', avatar: '陈', vehicleType: '冷藏车', capacity: 18, currentLocation: '上海闵行', creditScore: 88, onTimeRate: 92, hasViolation: false, matchScore: 88, price: 3100, eta: '3小时', status: 'idle' },
  { id: '4', driverId: 104, driverName: '赵军', avatar: '赵', vehicleType: '冷藏车', capacity: 22, currentLocation: '上海嘉定', creditScore: 85, onTimeRate: 88, hasViolation: false, matchScore: 85, price: 3050, eta: '3.5小时', status: 'idle' },
  { id: '5', driverId: 105, driverName: '周杰', avatar: '周', vehicleType: '冷藏车', capacity: 15, currentLocation: '上海奉贤', creditScore: 82, onTimeRate: 85, hasViolation: false, matchScore: 82, price: 3200, eta: '4小时', status: 'idle' },
  { id: '6', driverId: 106, driverName: '杨勇', avatar: '杨', vehicleType: '平板车', capacity: 30, currentLocation: '上海宝山', creditScore: 90, onTimeRate: 94, hasViolation: false, matchScore: 78, price: 2700, eta: '2.5小时', status: 'idle' },
  { id: '7', driverId: 107, driverName: '刘洋', avatar: '刘', vehicleType: '厢式车', capacity: 28, currentLocation: '上海青浦', creditScore: 78, onTimeRate: 80, hasViolation: true, matchScore: 75, price: 2600, eta: '5小时', status: 'busy' },
  { id: '8', driverId: 108, driverName: '王刚', avatar: '王', vehicleType: '平板车', capacity: 35, currentLocation: '上海徐汇', creditScore: 70, onTimeRate: 72, hasViolation: true, matchScore: 70, price: 2500, eta: '6小时', status: 'offline' },
]

const defaultBargainingRecords: BargainingRecord[] = [
  { id: '1', time: '10:30', from: 'shipper', price: 2800, type: 'offer', message: '初始报价' },
  { id: '2', time: '10:35', from: 'driver', price: 3000, type: 'counter', message: '价格太低，需要3000' },
  { id: '3', time: '10:40', from: 'shipper', price: 2900, type: 'counter', message: '最多2900，长期合作' },
]

export default function Matching() {
  const navigate = useNavigate()
  const [form, setForm] = useState<CargoForm>({
    fromCity: '上海',
    toCity: '杭州',
    cargoType: '冷链',
    weight: 15,
    volume: 30,
    mode: 'ftl',
    price: 2800,
    minCreditScore: 60,
    minOnTimeRate: 70,
    excludeViolation: false,
    temperature: -15,
    humidity: 70,
    needTempControl: true,
  })
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [publishedOrderId, setPublishedOrderId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [matchStatus, setMatchStatus] = useState<'idle' | 'matching' | 'matched'>('idle')
  const [selectedDriver, setSelectedDriver] = useState<MatchResult | null>(null)
  const [bargainingRecords, setBargainingRecords] = useState<BargainingRecord[]>([])
  const [counterOffer, setCounterOffer] = useState<number>(0)
  const [bargainingLoading, setBargainingLoading] = useState(false)

  const referencePrice = form.cargoType && form.weight > 0
    ? Math.round(referencePrices[form.cargoType] * form.weight * 100)
    : 0

  const isColdChain = form.cargoType === '冷链'

  const currentModeConfig = modeMatchConfig[form.mode] || modeMatchConfig.ftl

  const riskFilterSteps: RiskFilterStep[] = [
    { label: '总检索司机', icon: <Users size={14} />, count: 35, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: '信用分过滤(≥60分)', icon: <Shield size={14} />, count: 12, color: 'text-red-600', bgColor: 'bg-red-100' },
    { label: '准点率过滤(≥70%)', icon: <Clock size={14} />, count: 5, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { label: '违章排除', icon: <AlertTriangle size={14} />, count: 3, color: 'text-amber-600', bgColor: 'bg-amber-100' },
    { label: '无温控车过滤', icon: <Snowflake size={14} />, count: 8, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    { label: '最终候选', icon: <CheckCircle size={14} />, count: 8, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  ]

  const handlePublish = async () => {
    if (!form.fromCity || !form.toCity || !form.cargoType || form.weight <= 0 || form.price <= 0) return
    setLoading(true)
    setMatchStatus('matching')
    setMatches([])
    setSelectedDriver(null)
    setBargainingRecords([])
    setPublishedOrderId(Date.now())

    setTimeout(() => {
      setMatches(defaultMatches)
      setMatchStatus('matched')
      setLoading(false)
    }, 2000)
  }

  const handleAccept = async (match: MatchResult) => {
    try {
      const result = await api.post<{ bargainingId?: number }>('/matching/accept', {
        orderId: publishedOrderId,
        driverId: match.driverId,
      })
      navigate('/bargaining', { state: { matchId: result.bargainingId ?? match.id } })
    } catch {
      navigate('/bargaining', { state: { matchId: match.id } })
    }
  }

  const handleSelectDriver = (driver: MatchResult) => {
    setSelectedDriver(driver)
    setBargainingRecords(defaultBargainingRecords)
    setCounterOffer(driver.price)
  }

  const handleBargain = async () => {
    if (counterOffer <= 0 || !selectedDriver) return
    setBargainingLoading(true)

    try {
      await api.post('/bargaining/offer', {
        orderId: publishedOrderId,
        driverId: selectedDriver.driverId,
        price: counterOffer,
        type: 'counter',
      })

      const newRecord: BargainingRecord = {
        id: String(Date.now()),
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        from: 'shipper',
        price: counterOffer,
        type: 'counter',
        message: '还价',
      }
      setBargainingRecords([...bargainingRecords, newRecord])

      setTimeout(() => {
        const driverResponse: BargainingRecord = {
          id: String(Date.now() + 1),
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          from: 'driver',
          price: Math.round(counterOffer * 1.03),
          type: 'counter',
          message: '价格可以商量，这是我的底价',
        }
        setBargainingRecords(prev => [...prev, driverResponse])
        setBargainingLoading(false)
      }, 1500)
    } catch {
      setBargainingLoading(false)
    }
  }

  const handleAcceptBargain = async () => {
    if (!selectedDriver) return
    try {
      await api.post('/bargaining/offer', {
        orderId: publishedOrderId,
        driverId: selectedDriver.driverId,
        price: counterOffer,
        type: 'accept',
      })
      navigate('/bargaining', { state: { matchId: selectedDriver.id, price: counterOffer } })
    } catch {
      navigate('/bargaining', { state: { matchId: selectedDriver.id, price: counterOffer } })
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 90) return 'bg-mint'
    if (score >= 75) return 'bg-accent'
    return 'bg-coral'
  }

  const scoreTextColor = (score: number) => {
    if (score >= 90) return 'text-mint'
    if (score >= 75) return 'text-accent'
    return 'text-coral'
  }

  const driverColumns = [
    {
      key: 'driver',
      title: '司机信息',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-medium shrink-0">
            {row.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-primary">{row.driverName}</span>
              <div className="flex items-center gap-0.5">
                <Star size={12} className="text-accent fill-accent" />
                <span className="text-xs font-mono text-secondary">{row.creditScore}</span>
              </div>
            </div>
            <div className="text-xs text-secondary">{row.vehicleType} · {row.capacity}吨</div>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      title: '当前位置',
      render: (row: any) => (
        <div className="flex items-center gap-1 text-xs text-secondary">
          <MapPin size={12} />
          {row.currentLocation}
        </div>
      ),
    },
    {
      key: 'matchScore',
      title: '匹配度',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', scoreColor(row.matchScore))}
              style={{ width: `${row.matchScore}%` }}
            />
          </div>
          <span className={cn('text-xs font-bold font-mono', scoreTextColor(row.matchScore))}>{row.matchScore}%</span>
        </div>
      ),
    },
    {
      key: 'price',
      title: '报价',
      sortable: true,
      render: (row: any) => (
        <span className="font-bold text-accent font-mono">¥{row.price.toLocaleString()}</span>
      ),
    },
    {
      key: 'eta',
      title: '预计到达',
      render: (row: any) => (
        <div className="flex items-center gap-1 text-xs text-secondary">
          <Clock size={12} />
          {row.eta}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (row: any) => (
        <StatusBadge
          status={row.status === 'idle' ? 'active' : row.status === 'busy' ? 'warning' : 'cancelled'}
          label={row.status === 'idle' ? '空闲' : row.status === 'busy' ? '运输中' : '离线'}
        />
      ),
    },
    {
      key: 'action',
      title: '操作',
      render: (row: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleAccept(row) }}
            className="px-3 py-1 rounded-md bg-primary text-white text-xs hover:opacity-90 transition-opacity"
          >
            接受
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleSelectDriver(row) }}
            className={cn(
              'px-3 py-1 rounded-md text-xs transition-colors',
              selectedDriver?.id === row.id
                ? 'bg-accent text-white'
                : 'border border-gray-200 text-secondary hover:bg-gray-50'
            )}
          >
            议价
          </button>
        </div>
      ),
    },
  ]

  const priceChartData = selectedDriver ? {
    labels: bargainingRecords.map(r => r.time),
    values: bargainingRecords.map(r => r.price),
    colors: bargainingRecords.map(r => r.from === 'shipper' ? '#1B2A4A' : '#F59E0B'),
  } : { labels: [], values: [] }

  const lowestPrice = matches.length > 0 ? Math.min(...matches.map(m => m.price)) : 0
  const avgPrice = matches.length > 0 ? Math.round(matches.reduce((a, b) => a + b.price, 0) / matches.length) : 0

  const finalPrice = form.price
    ? Math.round(form.price * 1.15 * 0.98)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">智能撮合引擎</h1>
        <p className="text-sm text-secondary mt-0.5">AI 智能匹配最优运力，支持实时议价博弈</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧货源发布表单 */}
        <div className="col-span-4">
          <div className="card space-y-5">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Package size={16} /> 货源发布
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">出发城市</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      value={form.fromCity}
                      onChange={(e) => setForm({ ...form, fromCity: e.target.value })}
                      placeholder="如：上海"
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1.5 block">目的城市</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      value={form.toCity}
                      onChange={(e) => setForm({ ...form, toCity: e.target.value })}
                      placeholder="如：杭州"
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block">货物类型</label>
                <div className="flex flex-wrap gap-1.5">
                  {cargoTypes.map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setForm({ ...form, cargoType: ct })}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-colors border',
                        form.cargoType === ct
                          ? cn(cargoTypeConfig[ct].bg, cargoTypeConfig[ct].color, 'border-transparent')
                          : 'bg-gray-50 text-secondary border-gray-200 hover:bg-gray-100'
                      )}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-secondary mb-1.5 block flex items-center gap-1">
                    <Weight size={12} /> 重量(吨)
                  </label>
                  <input
                    type="number"
                    value={form.weight || ''}
                    onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1.5 block flex items-center gap-1">
                    <Ruler size={12} /> 体积(m³)
                  </label>
                  <input
                    type="number"
                    value={form.volume || ''}
                    onChange={(e) => setForm({ ...form, volume: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block">运输模式</label>
                <div className="space-y-2">
                  {modes.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setForm({ ...form, mode: m.key })}
                      className={cn(
                        'w-full p-3 rounded-lg text-left transition-all border',
                        form.mode === m.key
                          ? 'bg-primary/5 border-primary text-primary'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <div className="font-medium text-sm">{m.label}</div>
                      <div className="text-xs text-secondary mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {isColdChain && (
                <div className="space-y-4 p-4 bg-cyan-50 rounded-lg border border-cyan-100">
                  <h4 className="text-xs font-semibold text-cyan-700 flex items-center gap-1.5">
                    <Thermometer size={14} /> 冷链温湿度条件
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-secondary">温度范围</span>
                        <span className="font-mono font-medium text-cyan-700">{form.temperature}°C</span>
                      </div>
                      <input
                        type="range"
                        min="-25"
                        max="25"
                        value={form.temperature}
                        onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                        className="w-full h-2 bg-cyan-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                      />
                      <div className="flex justify-between text-xs text-muted mt-1">
                        <span>-25°C</span>
                        <span>25°C</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-secondary">湿度范围</span>
                        <span className="font-mono font-medium text-cyan-700">{form.humidity}%</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="100"
                        value={form.humidity}
                        onChange={(e) => setForm({ ...form, humidity: Number(e.target.value) })}
                        className="w-full h-2 bg-cyan-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                      />
                      <div className="flex justify-between text-xs text-muted mt-1">
                        <span>30%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.needTempControl}
                        onChange={(e) => setForm({ ...form, needTempControl: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-xs text-secondary">需要温控车辆</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs text-secondary flex items-center gap-1">
                    <DollarSign size={12} /> 期望运价(元)
                  </label>
                  {referencePrice > 0 && (
                    <span className="text-xs text-muted">
                      参考均价: <span className="font-mono font-medium text-accent">¥{referencePrice.toLocaleString()}</span>
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={form.price || ''}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
                {referencePrice > 0 && form.price > 0 && (
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        form.price < referencePrice * 0.9 ? 'bg-coral' :
                        form.price > referencePrice * 1.1 ? 'bg-mint' : 'bg-accent'
                      )}
                      style={{ width: `${Math.min(100, (form.price / referencePrice) * 50)}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Shield size={14} /> 司机信用筛选
                </h4>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary">最低信用分</span>
                    <span className="font-mono font-medium text-primary">{form.minCreditScore}分</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.minCreditScore}
                    onChange={(e) => setForm({ ...form, minCreditScore: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary">最低准点率</span>
                    <span className="font-mono font-medium text-primary">{form.minOnTimeRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.minOnTimeRate}
                    onChange={(e) => setForm({ ...form, minOnTimeRate: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.excludeViolation}
                    onChange={(e) => setForm({ ...form, excludeViolation: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-secondary">排除有违章记录司机</span>
                </label>
              </div>

              <button
                onClick={handlePublish}
                disabled={loading || !form.fromCity || !form.toCity || !form.cargoType || form.weight <= 0 || form.price <= 0}
                className="w-full btn-accent flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {loading ? 'AI 匹配中...' : '发布并智能匹配'}
              </button>
            </div>
          </div>
        </div>

        {/* 中间撮合结果区 */}
        <div className={cn('space-y-4', selectedDriver ? 'col-span-5' : 'col-span-8')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-primary">撮合结果</h3>
              <StatusBadge
                status={matchStatus === 'matched' ? 'active' : matchStatus === 'matching' ? 'warning' : 'info'}
                label={
                  matchStatus === 'matched' ? `已匹配 ${matches.length} 个司机` :
                  matchStatus === 'matching' ? 'AI 匹配中...' : '待发布'
                }
              />
            </div>
            {matchStatus !== 'idle' && (
              <button
                onClick={() => {
                  setMatchStatus('idle')
                  setMatches([])
                  setSelectedDriver(null)
                  setBargainingRecords([])
                }}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                <Filter size={12} /> 重新发布
              </button>
            )}
          </div>

          {matchStatus === 'idle' ? (
            <div className="card flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center text-white mb-4">
                <Zap size={28} />
              </div>
              <h3 className="text-lg font-semibold text-primary">发布货源开始智能匹配</h3>
              <p className="text-sm text-secondary mt-1">AI 将根据货源信息自动匹配最优运力</p>
            </div>
          ) : matchStatus === 'matching' ? (
            <div className="card flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white mb-4">
                <Loader2 size={28} className="animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-primary">AI 撮合引擎正在工作</h3>
              <p className="text-sm text-secondary mt-1">正在匹配最优运力，请稍候...</p>
            </div>
          ) : (
            <>
              {/* 匹配信息栏 */}
              <div className="grid grid-cols-4 gap-3">
                <div className="card !p-4">
                  <div className="text-xs text-secondary mb-1">匹配耗时</div>
                  <div className="text-lg font-bold font-mono text-primary">{currentModeConfig.time}</div>
                  <div className="text-[10px] text-muted mt-0.5">{modes.find(m => m.key === form.mode)?.label}模式</div>
                </div>
                <div className="card !p-4">
                  <div className="text-xs text-secondary mb-1">检索司机数</div>
                  <div className="text-lg font-bold font-mono text-blue-600">35</div>
                  <div className="text-[10px] text-muted mt-0.5">全量候选池</div>
                </div>
                <div className="card !p-4">
                  <div className="text-xs text-secondary mb-1">风控过滤数</div>
                  <div className="text-lg font-bold font-mono text-coral">27</div>
                  <div className="text-[10px] text-muted mt-0.5">信用+准点+违章+温控</div>
                </div>
                <div className="card !p-4">
                  <div className="text-xs text-secondary mb-1">最终候选数</div>
                  <div className="text-lg font-bold font-mono text-mint">8</div>
                  <div className="text-[10px] text-muted mt-0.5">可议价司机</div>
                </div>
              </div>

              {/* 冷链条件影响链 */}
              {isColdChain && (
                <div className="card !p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-cyan-700 flex items-center gap-1.5">
                    <Snowflake size={14} /> 冷链条件影响链
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Thermometer size={12} className="text-cyan-600" />
                        <span className="text-xs font-medium text-cyan-700">温度要求</span>
                      </div>
                      <div className="text-sm font-bold font-mono text-cyan-800">-18 ~ -12°C</div>
                      <div className="text-[10px] text-cyan-600 mt-1">→ 过滤掉8名无温控车司机</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Thermometer size={12} className="text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">湿度要求</span>
                      </div>
                      <div className="text-sm font-bold font-mono text-blue-800">60~80%</div>
                      <div className="text-[10px] text-blue-600 mt-1">→ 需要温湿度记录仪</div>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Snowflake size={12} className="text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-700">温控车辆</span>
                      </div>
                      <div className="text-sm font-bold font-mono text-indigo-800">仅冷藏车型</div>
                      <div className="text-[10px] text-indigo-600 mt-1">→ 仅匹配冷藏车司机</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 整车/零担/拼车差异展示 */}
              <div className="card !p-4 space-y-3">
                <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Zap size={14} className="text-accent" /> 运输模式匹配差异
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    form.mode === 'ftl' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary">整车</span>
                      {form.mode === 'ftl' && (
                        <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded">当前</span>
                      )}
                    </div>
                    <div className="text-[11px] text-secondary mb-1">1名司机1车直达</div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted">匹配耗时</span>
                      <span className="font-mono font-bold text-primary">3.2秒</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted">候选人数</span>
                      <span className="font-mono font-bold text-mint">5人</span>
                    </div>
                  </div>
                  <div className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    form.mode === 'ltl' ? 'border-accent bg-accent/5' : 'border-gray-100 bg-white'
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary">零担</span>
                      {form.mode === 'ltl' && (
                        <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded">当前</span>
                      )}
                    </div>
                    <div className="text-[11px] text-secondary mb-1">多票拼载</div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted">匹配耗时</span>
                      <span className="font-mono font-bold text-primary">5.8秒</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted">拼载进度</span>
                      <span className="font-mono font-bold text-accent">需凑3票/已凑2票</span>
                    </div>
                  </div>
                  <div className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    form.mode === 'partial' ? 'border-mint bg-mint/5' : 'border-gray-100 bg-white'
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary">拼车</span>
                      {form.mode === 'partial' && (
                        <span className="text-[10px] bg-mint text-white px-1.5 py-0.5 rounded">当前</span>
                      )}
                    </div>
                    <div className="text-[11px] text-secondary mb-1">多货同车</div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted">匹配耗时</span>
                      <span className="font-mono font-bold text-primary">4.1秒</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted">拼载进度</span>
                      <span className="font-mono font-bold text-mint">需2票/已凑1票</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 风控筛选过程 */}
              <div className="card !p-4 space-y-3">
                <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <FilterX size={14} className="text-coral" /> 风控筛选过程
                </h4>
                <div className="space-y-2.5">
                  {riskFilterSteps.map((step, index) => {
                    const isLast = index === riskFilterSteps.length - 1
                    const remaining = riskFilterSteps.slice(0, index + 1).reduce((acc, s) => {
                      if (s.label === '总检索司机') return s.count
                      if (s.label === '最终候选') return acc
                      return acc - s.count
                    }, 0)
                    const currentCount = isLast ? 8 : (step.label === '总检索司机' ? step.count : remaining)

                    return (
                      <div key={step.label} className="flex items-center gap-3">
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', step.bgColor, step.color)}>
                          {step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-secondary">{step.label}</span>
                            <span className={cn(
                              'text-xs font-mono font-bold',
                              isLast ? 'text-emerald-600' : step.count > 0 ? 'text-coral' : 'text-secondary'
                            )}>
                              {isLast ? `剩余 ${step.count} 名` : step.count > 0 ? `过滤 ${step.count} 名` : `${step.count} 名`}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                isLast ? 'bg-emerald-500' : step.count > 8 ? 'bg-red-400' : step.count > 3 ? 'bg-orange-400' : 'bg-amber-400'
                              )}
                              style={{ width: `${isLast ? (8 / 35) * 100 : (step.count / 35) * 100}%` }}
                            />
                          </div>
                        </div>
                        {!isLast && (
                          <div className="text-[10px] text-muted shrink-0 w-14 text-right">
                            剩 {isLast ? 8 : currentCount} 名
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Users size={12} className="text-blue-500" />
                    <span className="text-[10px] text-secondary">35名检索</span>
                  </div>
                  <ArrowRightLeft size={10} className="text-muted" />
                  <div className="flex items-center gap-1">
                    <Shield size={12} className="text-red-500" />
                    <span className="text-[10px] text-secondary">过滤12名</span>
                  </div>
                  <ArrowRightLeft size={10} className="text-muted" />
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-orange-500" />
                    <span className="text-[10px] text-secondary">过滤5名</span>
                  </div>
                  <ArrowRightLeft size={10} className="text-muted" />
                  <div className="flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500" />
                    <span className="text-[10px] text-secondary">排除3名</span>
                  </div>
                  <ArrowRightLeft size={10} className="text-muted" />
                  <div className="flex items-center gap-1">
                    <Snowflake size={12} className="text-cyan-500" />
                    <span className="text-[10px] text-secondary">过滤8名</span>
                  </div>
                  <ArrowRightLeft size={10} className="text-muted" />
                  <div className="flex items-center gap-1">
                    <CheckCircle size={12} className="text-emerald-500" />
                    <span className="text-[10px] text-secondary font-bold">8名候选</span>
                  </div>
                </div>
              </div>

              {/* 报价统计 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card !p-4">
                  <div className="text-xs text-secondary mb-1">最低报价</div>
                  <div className="text-lg font-bold font-mono text-mint">¥{lowestPrice.toLocaleString()}</div>
                </div>
                <div className="card !p-4">
                  <div className="text-xs text-secondary mb-1">平均报价</div>
                  <div className="text-lg font-bold font-mono text-accent">¥{avgPrice.toLocaleString()}</div>
                </div>
                <div className="card !p-4">
                  <div className="text-xs text-secondary mb-1">您的报价</div>
                  <div className="text-lg font-bold font-mono text-primary">¥{form.price.toLocaleString()}</div>
                </div>
              </div>

              {/* 候选司机列表 */}
              <div className="card !p-0 overflow-hidden">
                <DataTable
                  columns={driverColumns}
                  data={matches}
                  pageSize={8}
                  onRowClick={handleSelectDriver}
                />
              </div>
            </>
          )}
        </div>

        {/* 右侧议价博弈面板 */}
        {selectedDriver && (
          <div className="col-span-3 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <ArrowRightLeft size={16} /> 议价博弈
                </h3>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={16} className="text-muted" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-medium text-lg">
                  {selectedDriver.avatar}
                </div>
                <div>
                  <div className="font-medium text-primary">{selectedDriver.driverName}</div>
                  <div className="text-xs text-secondary">{selectedDriver.vehicleType} · {selectedDriver.capacity}吨</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="text-accent fill-accent" />
                      <span className="text-xs font-mono text-secondary">{selectedDriver.creditScore}分</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <CheckCircle size={10} className="text-mint" />
                      <span className="text-xs text-secondary">准点率 {selectedDriver.onTimeRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-secondary">您的底价</div>
                  <div className="text-sm font-bold font-mono text-coral">¥{form.price.toLocaleString()}</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded">
                  <div className="text-xs text-secondary">当前出价</div>
                  <div className="text-sm font-bold font-mono text-accent">¥{counterOffer.toLocaleString()}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-secondary">司机报价</div>
                  <div className="text-sm font-bold font-mono text-primary">¥{selectedDriver.price.toLocaleString()}</div>
                </div>
              </div>

              {/* 成交影响因子 */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2.5">
                <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-accent" /> 成交影响因子
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Snowflake size={11} className="text-cyan-500" />
                      <span className="text-[11px] text-secondary">冷链条件</span>
                    </div>
                    <span className="text-[11px] font-mono text-coral">过滤8人</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield size={11} className="text-red-500" />
                      <span className="text-[11px] text-secondary">信用筛选(≥60分)</span>
                    </div>
                    <span className="text-[11px] font-mono text-coral">过滤12人</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-orange-500" />
                      <span className="text-[11px] text-secondary">准点率(≥70%)</span>
                    </div>
                    <span className="text-[11px] font-mono text-orange-500">过滤5人</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={11} className="text-amber-500" />
                      <span className="text-[11px] text-secondary">违章排除</span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-500">过滤3人</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200 space-y-1.5">
                  <div className="text-[10px] text-muted">最终成交价确定方式：</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-secondary">参考均价</span>
                      <span className="font-mono font-medium text-primary">¥{referencePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-secondary">+ 冷链加成</span>
                      <span className="font-mono font-medium text-cyan-600">+15%</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-secondary">+ 信用优秀优惠</span>
                      <span className="font-mono font-medium text-mint">-2%</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200">
                      <span className="text-primary font-medium">预计成交价</span>
                      <span className="font-mono font-bold text-accent">¥{finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {bargainingRecords.length > 0 && (
                <Chart
                  type="line"
                  data={priceChartData}
                  height={120}
                  title="议价趋势"
                />
              )}

              <div className="mb-4">
                <h4 className="text-xs font-semibold text-secondary mb-2 flex items-center gap-1.5">
                  <History size={12} /> 议价记录
                </h4>
                <div className="relative space-y-3 max-h-40 overflow-y-auto pr-2">
                  {bargainingRecords.map((record, index) => (
                    <div key={record.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                          record.from === 'shipper' ? 'bg-primary text-white' : 'bg-accent text-white'
                        )}>
                          {record.from === 'shipper' ? <User size={12} /> : <Car size={12} />}
                        </div>
                        {index < bargainingRecords.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary">
                            {record.from === 'shipper' ? '我' : selectedDriver.driverName}
                          </span>
                          <span className="text-xs text-muted">{record.time}</span>
                        </div>
                        <div className="text-sm font-bold font-mono text-accent mt-0.5">
                          ¥{record.price.toLocaleString()}
                        </div>
                        {record.message && (
                          <div className="text-xs text-secondary mt-0.5">{record.message}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-secondary mb-1.5 block flex items-center gap-1">
                    <Target size={12} /> 还价金额(元)
                  </label>
                  <input
                    type="number"
                    value={counterOffer || ''}
                    onChange={(e) => setCounterOffer(Number(e.target.value))}
                    placeholder="输入还价金额"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleBargain}
                    disabled={bargainingLoading || counterOffer <= 0}
                    className="btn-secondary flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {bargainingLoading ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                    议价
                  </button>
                  <button
                    onClick={handleAcceptBargain}
                    className="btn-accent flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={14} />
                    接受
                  </button>
                </div>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="w-full py-2 text-xs text-secondary hover:text-primary border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消议价
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
