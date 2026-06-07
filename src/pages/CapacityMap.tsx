import { useState } from 'react'
import { Filter, X, Truck, Phone, Star, MapPin, Gauge, Clock, AlertTriangle, Shield, CheckCircle, FileText, Zap, Search, RefreshCw } from 'lucide-react'
import HeatMap from '@/components/HeatMap'
import StatusBadge from '@/components/StatusBadge'
import StatCard from '@/components/StatCard'
import DataTable from '@/components/DataTable'
import { api } from '@/utils/api'
import { useNavigate } from 'react-router-dom'

interface DriverDetail {
  id: string
  name: string
  phone: string
  vehicleNo: string
  vehicleType: string
  capacity: number
  rating: number
  status: 'idle' | 'busy' | 'offline'
  location: { x: number; y: number; lat: number; lng: number; city: string }
  creditScore: number
  violationCount: number
  complaintRate: number
  onTimeRate: number
  currentCity: string
  loadStatus: string
  lastUpdate: string
  licensePlate: string
  monthlyOrders: number
  monthlyOnTime: number
  monthlyComplaints: number
  currentWaybill: string | null
}

const vehicleTypes = ['重型平板', '中型厢式', '轻型冷藏', '大型集装箱', '危险品罐车']
const cities = [
  { city: '北京', lat: 39.9042, lng: 116.4074, x: 0.55, y: 0.25 },
  { city: '上海', lat: 31.2304, lng: 121.4737, x: 0.72, y: 0.48 },
  { city: '广州', lat: 23.1291, lng: 113.2644, x: 0.58, y: 0.68 },
  { city: '深圳', lat: 22.5431, lng: 114.0579, x: 0.57, y: 0.70 },
  { city: '杭州', lat: 30.2741, lng: 120.1551, x: 0.68, y: 0.50 },
  { city: '南京', lat: 32.0603, lng: 118.7969, x: 0.65, y: 0.44 },
  { city: '武汉', lat: 30.5928, lng: 114.3055, x: 0.52, y: 0.50 },
  { city: '成都', lat: 30.5728, lng: 104.0668, x: 0.30, y: 0.52 },
  { city: '长沙', lat: 28.2282, lng: 112.9388, x: 0.52, y: 0.60 },
  { city: '济南', lat: 36.6700, lng: 117.0200, x: 0.58, y: 0.34 },
  { city: '西安', lat: 34.3416, lng: 108.9398, x: 0.40, y: 0.40 },
  { city: '合肥', lat: 31.8639, lng: 117.2808, x: 0.63, y: 0.45 },
  { city: '郑州', lat: 34.7466, lng: 113.6253, x: 0.50, y: 0.38 },
  { city: '重庆', lat: 29.5630, lng: 106.5516, x: 0.33, y: 0.55 },
  { city: '苏州', lat: 31.2990, lng: 120.5853, x: 0.70, y: 0.47 },
]

const surnames = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '林', '何', '高', '梁', '郑', '罗', '宋', '谢', '唐', '韩', '曹', '许', '邓', '萧', '冯', '曾', '程', '蔡', '彭', '潘', '袁', '于', '董', '余', '苏', '叶', '吕', '魏', '蒋', '田', '杜', '丁', '沈', '姜']
const givenNames = ['伟', '强', '刚', '军', '洋', '磊', '帆', '明', '涛', '勇', '杰', '超', '波', '辉', '斌', '峰', '鹏', '飞', '鑫', '浩', '文', '平', '东', '亮', '华', '建', '志', '国', '海', '龙']

const platePrefixes: Record<string, string> = {
  '北京': '京A', '上海': '沪B', '广州': '粤A', '深圳': '粤B', '杭州': '浙A',
  '南京': '苏A', '武汉': '鄂A', '成都': '川A', '长沙': '湘A', '济南': '鲁A',
  '西安': '陕A', '合肥': '皖A', '郑州': '豫A', '重庆': '渝A', '苏州': '苏E',
}

const statusPool: Array<'idle' | 'busy' | 'offline'> = [
  ...Array(20).fill('idle'),
  ...Array(18).fill('busy'),
  ...Array(12).fill('offline'),
]

const creditDistribution = [
  ...Array(15).fill(null).map(() => ({ min: 95, max: 99 })),
  ...Array(15).fill(null).map(() => ({ min: 85, max: 94 })),
  ...Array(10).fill(null).map(() => ({ min: 75, max: 84 })),
  ...Array(10).fill(null).map(() => ({ min: 60, max: 74 })),
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateDrivers(): DriverDetail[] {
  const rand = seededRandom(42)
  const drivers: DriverDetail[] = []

  for (let i = 0; i < 50; i++) {
    const cityInfo = cities[i % cities.length]
    const vehicleType = vehicleTypes[Math.floor(i / 10)]
    const creditRange = creditDistribution[i]
    const creditScore = creditRange.min + Math.floor(rand() * (creditRange.max - creditRange.min + 1))
    const onTimeRate = +(70 + rand() * 29.9).toFixed(1)
    const violationCount = Math.floor(rand() * 7)
    const status = statusPool[i]
    const capacityByType: Record<string, [number, number]> = {
      '重型平板': [30, 50],
      '中型厢式': [15, 25],
      '轻型冷藏': [5, 12],
      '大型集装箱': [35, 55],
      '危险品罐车': [20, 35],
    }
    const [capMin, capMax] = capacityByType[vehicleType]
    const capacity = capMin + Math.floor(rand() * (capMax - capMin + 1))
    const surname = surnames[i % surnames.length]
    const givenName = givenNames[Math.floor(rand() * givenNames.length)]
    const name = surname + givenName
    const prefix = platePrefixes[cityInfo.city] || '京A'
    const plateNum = String(Math.floor(10000 + rand() * 90000))
    const phoneMiddle = String(Math.floor(1000 + rand() * 9000))
    const phoneEnd = String(Math.floor(1000 + rand() * 9000))
    const rating = +(4.0 + rand() * 0.95).toFixed(2)
    const complaintRate = +(rand() * 0.15).toFixed(3)
    const monthlyOrders = 8 + Math.floor(rand() * 25)
    const monthlyOnTime = Math.floor(monthlyOrders * onTimeRate / 100)
    const monthlyComplaints = Math.floor(rand() * 3)

    const loadStatus = status === 'idle' ? '空载' : status === 'busy' ? '重车' : '未知'
    const lastUpdate = status === 'offline'
      ? `${Math.floor(1 + rand() * 11)}小时前`
      : status === 'busy'
        ? `${Math.floor(rand() * 60)}秒前`
        : `${Math.floor(1 + rand() * 10)}分钟前`

    const currentWaybill = status === 'busy'
      ? `WB2026${String(Math.floor(100000 + rand() * 900000))}`
      : null

    drivers.push({
      id: `D${String(i + 1).padStart(3, '0')}`,
      name,
      phone: `1${Math.floor(30 + rand() * 9)}${phoneMiddle}****${phoneEnd}`,
      vehicleNo: `${prefix}${plateNum}`,
      vehicleType,
      capacity,
      rating,
      status,
      location: {
        x: cityInfo.x + (rand() - 0.5) * 0.04,
        y: cityInfo.y + (rand() - 0.5) * 0.04,
        lat: +(cityInfo.lat + (rand() - 0.5) * 0.3).toFixed(4),
        lng: +(cityInfo.lng + (rand() - 0.5) * 0.3).toFixed(4),
        city: cityInfo.city,
      },
      creditScore,
      violationCount,
      complaintRate,
      onTimeRate,
      currentCity: cityInfo.city,
      loadStatus,
      lastUpdate,
      licensePlate: `${prefix}·${plateNum.slice(0, 2)}${plateNum.slice(2)}`,
      monthlyOrders,
      monthlyOnTime,
      monthlyComplaints,
      currentWaybill,
    })
  }

  return drivers
}

const defaultDrivers = generateDrivers()

const vehicleFilterOptions = ['全部', ...vehicleTypes]
const loadRanges = [
  { key: 'all', label: '全部', range: [0, 100] },
  { key: 'light', label: '0-5吨', range: [0, 5] },
  { key: 'medium', label: '5-15吨', range: [5, 15] },
  { key: 'heavy', label: '15-30吨', range: [15, 30] },
  { key: 'super', label: '30吨以上', range: [30, 100] },
]
const statusMap: Record<string, { status: 'pending' | 'active' | 'cancelled'; label: string }> = {
  idle: { status: 'active', label: '空闲' },
  busy: { status: 'pending', label: '运输中' },
  offline: { status: 'cancelled', label: '离线' },
}
const vehicleTypeColors: Record<string, string> = {
  '重型平板': 'bg-red-100 text-red-700',
  '中型厢式': 'bg-blue-100 text-blue-700',
  '轻型冷藏': 'bg-cyan-100 text-cyan-700',
  '大型集装箱': 'bg-purple-100 text-purple-700',
  '危险品罐车': 'bg-orange-100 text-orange-700',
}

const formatNumber = (n: number): string => {
  if (n >= 10000) return (n / 10000).toFixed(0) + '万'
  return n.toString()
}

const getCreditLevel = (score: number): { level: string; color: string; bgColor: string } => {
  if (score >= 95) return { level: '优秀', color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
  if (score >= 85) return { level: '良好', color: 'text-blue-600', bgColor: 'bg-blue-100' }
  if (score >= 75) return { level: '一般', color: 'text-amber-600', bgColor: 'bg-amber-100' }
  return { level: '较差', color: 'text-red-600', bgColor: 'bg-red-100' }
}

const isAdmissionPassed = (d: DriverDetail): boolean =>
  d.creditScore >= 80 && d.onTimeRate >= 90 && d.violationCount <= 2

const getAdmissionReasons = (d: DriverDetail): { passed: boolean; reason: string }[] => [
  { passed: d.creditScore >= 80, reason: `信用分 ${d.creditScore}分 ${d.creditScore >= 80 ? '≥' : '<'} 80` },
  { passed: d.onTimeRate >= 90, reason: `准点率 ${d.onTimeRate}% ${d.onTimeRate >= 90 ? '≥' : '<'} 90%` },
  { passed: d.violationCount <= 2, reason: `违章 ${d.violationCount}次 ${d.violationCount <= 2 ? '≤' : '>'} 2` },
]

export default function CapacityMap() {
  const navigate = useNavigate()
  const [drivers] = useState<DriverDetail[]>(defaultDrivers)
  const [selectedDriver, setSelectedDriver] = useState<DriverDetail | null>(null)
  const [vehicleFilter, setVehicleFilter] = useState('全部')
  const [loadFilter, setLoadFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [creditFilter, setCreditFilter] = useState<number>(0)
  const [onTimeFilter, setOnTimeFilter] = useState<number>(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')
  const [loading, setLoading] = useState(false)
  const [excludeViolation, setExcludeViolation] = useState(false)
  const [admissionOnly, setAdmissionOnly] = useState(false)

  const loadRange = loadRanges.find(r => r.key === loadFilter)?.range || [0, 100]

  const filtered = drivers.filter((d) => {
    if (vehicleFilter !== '全部' && d.vehicleType !== vehicleFilter) return false
    if (d.capacity < loadRange[0] || d.capacity > loadRange[1]) return false
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (creditFilter > 0 && d.creditScore < creditFilter) return false
    if (onTimeFilter > 0 && d.onTimeRate < onTimeFilter) return false
    if (excludeViolation && d.violationCount > 0) return false
    if (admissionOnly && !isAdmissionPassed(d)) return false
    if (searchKeyword && !d.name.includes(searchKeyword) && !d.vehicleNo.includes(searchKeyword) && !d.currentCity.includes(searchKeyword)) return false
    return true
  })

  const filterStats = {
    count: filtered.length,
    excellent: filtered.filter(d => d.creditScore >= 95).length,
    good: filtered.filter(d => d.creditScore >= 85 && d.creditScore < 95).length,
    fair: filtered.filter(d => d.creditScore >= 75 && d.creditScore < 85).length,
    poor: filtered.filter(d => d.creditScore < 75).length,
    admissionPassed: filtered.filter(d => isAdmissionPassed(d)).length,
    admissionFailed: filtered.filter(d => !isAdmissionPassed(d)).length,
  }

  const heatPoints = filtered.map((d) => ({
    x: d.location.x,
    y: d.location.y,
    intensity: d.status === 'idle' ? 0.9 : d.status === 'busy' ? 0.5 : 0.2,
    label: d.name,
  }))

  const stats = {
    total: drivers.length,
    online: drivers.filter(d => d.status !== 'offline').length,
    idle: drivers.filter(d => d.status === 'idle').length,
    busy: drivers.filter(d => d.status === 'busy').length,
    avgCapacity: +(drivers.reduce((s, d) => s + d.capacity, 0) / drivers.length).toFixed(1),
  }

  const refreshData = () => {
    setLoading(true)
    setTimeout(() => {
      api.get<DriverDetail[]>('/capacity/drivers').catch(() => {})
      setLoading(false)
    }, 500)
  }

  const formatGps = (d: DriverDetail) => {
    const latDir = d.location.lat >= 0 ? 'N' : 'S'
    const lngDir = d.location.lng >= 0 ? 'E' : 'W'
    return `${Math.abs(d.location.lat).toFixed(2)}°${latDir}, ${Math.abs(d.location.lng).toFixed(2)}°${lngDir}`
  }

  const getWaybillDisplay = (d: DriverDetail) => {
    if (d.status === 'idle') return '可接单'
    if (d.status === 'busy') return `执行中 ${d.currentWaybill || ''}`
    return '--'
  }

  const columns = [
    { key: 'name', title: '司机姓名', render: (row: any) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-medium">{row.name[0]}</div>
        <div>
          <div className="font-medium text-primary">{row.name}</div>
          <div className="text-xs text-muted">{row.phone}</div>
        </div>
      </div>
    )},
    { key: 'vehicleType', title: '车型', render: (row: any) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vehicleTypeColors[row.vehicleType] || 'bg-gray-100 text-gray-700'}`}>{row.vehicleType}</span>
    )},
    { key: 'capacity', title: '载重', render: (row: any) => <span className="text-sm font-medium">{row.capacity}吨</span> },
    { key: 'licensePlate', title: '车牌号' },
    { key: 'currentCity', title: '当前位置', render: (row: any) => <span className="flex items-center gap-1 text-sm"><MapPin size={12} className="text-primary" />{row.currentCity}</span> },
    { key: 'gps', title: 'GPS坐标', render: (row: any) => {
      const latDir = row.location.lat >= 0 ? 'N' : 'S'
      const lngDir = row.location.lng >= 0 ? 'E' : 'W'
      return <span className="text-xs font-mono text-secondary">{Math.abs(row.location.lat).toFixed(2)}°{latDir}, {Math.abs(row.location.lng).toFixed(2)}°{lngDir}</span>
    }},
    { key: 'status', title: '状态', render: (row: any) => <StatusBadge {...statusMap[row.status]} /> },
    { key: 'waybillStatus', title: '运单状态', render: (row: any) => {
      if (row.status === 'idle') return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">可接单</span>
      if (row.status === 'busy') return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">执行中 {row.currentWaybill || ''}</span>
      return <span className="text-xs text-muted">--</span>
    }},
    { key: 'loadStatus', title: '载重状态', render: (row: any) => (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.loadStatus === '空载' ? 'bg-green-100 text-green-700' : row.loadStatus === '重车' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{row.loadStatus}</span>
    )},
    { key: 'creditScore', title: '信用分', render: (row: any) => {
      const lvl = getCreditLevel(row.creditScore)
      return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${lvl.bgColor} ${lvl.color}`}>{row.creditScore}分 · {lvl.level}</span>
    }},
    { key: 'onTimeRate', title: '准点率', render: (row: any) => <span className="text-sm font-medium">{row.onTimeRate}%</span> },
    { key: 'admission', title: '准入判定', render: (row: any) => {
      const passed = row.creditScore >= 80 && row.onTimeRate >= 90 && row.violationCount <= 2
      return passed
        ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">通过</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">未通过</span>
    }},
    { key: 'action', title: '操作', render: (row: any) => (
      <div className="flex gap-2">
        <button onClick={() => setSelectedDriver(row)} className="text-xs text-primary hover:underline">详情</button>
        <button onClick={() => navigate(`/matching?driverId=${row.id}`)} className="text-xs text-accent hover:underline">撮合</button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">运力池 · 50名运力明细</h1>
          <p className="text-sm text-secondary mt-0.5">实时GPS位置 · 车型/载重/空闲状态 · 信用档案 · 准入判定</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshData} className="btn-secondary text-sm flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
          <button onClick={() => navigate('/matching')} className="btn-primary text-sm flex items-center gap-2">
            <Zap size={14} /> 发布货源
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard label="总运力规模" value={stats.total} sublabel="注册司机" icon={<Truck size={20} />} gradient="gradient-primary" />
        <StatCard label="在线司机" value={stats.online} sublabel="GPS实时在线" icon={<CheckCircle size={20} />} gradient="gradient-mint" />
        <StatCard label="空闲可接单" value={stats.idle} sublabel="随时可抢单" icon={<Clock size={20} />} gradient="gradient-mint" />
        <StatCard label="运输中" value={stats.busy} sublabel="正在执行运单" icon={<Gauge size={20} />} gradient="gradient-accent" />
        <StatCard label="平均运力" value={`${stats.avgCapacity}吨`} sublabel="单车载重均值" icon={<Truck size={20} />} gradient="gradient-primary" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <Filter size={14} /> 精准筛选
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-secondary mb-1.5 block">关键词搜索</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="司机姓名/车牌/城市"
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block">车辆类型</label>
                <div className="flex flex-wrap gap-1.5">
                  {vehicleFilterOptions.map((vt) => (
                    <button
                      key={vt}
                      onClick={() => setVehicleFilter(vt)}
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                        vehicleFilter === vt
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-secondary hover:bg-gray-200'
                      }`}
                    >
                      {vt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block">载重区间</label>
                <div className="flex flex-wrap gap-1.5">
                  {loadRanges.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setLoadFilter(r.key)}
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                        loadFilter === r.key
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-secondary hover:bg-gray-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block">运营状态</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'idle', label: '空闲' },
                    { key: 'busy', label: '运输中' },
                    { key: 'offline', label: '离线' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setStatusFilter(s.key)}
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                        statusFilter === s.key
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-secondary hover:bg-gray-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block flex items-center gap-1">
                  <Shield size={12} /> 最低信用分: <span className="text-primary font-medium">{creditFilter}分</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={creditFilter}
                  onChange={(e) => setCreditFilter(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block flex items-center gap-1">
                  <CheckCircle size={12} /> 最低准点率: <span className="text-primary font-medium">{onTimeFilter}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={onTimeFilter}
                  onChange={(e) => setOnTimeFilter(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeViolation}
                    onChange={(e) => setExcludeViolation(e.target.checked)}
                    className="accent-primary"
                  />
                  排除有违章
                </label>
                <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={admissionOnly}
                    onChange={(e) => setAdmissionOnly(e.target.checked)}
                    className="accent-primary"
                  />
                  只看准入通过
                </label>
              </div>

              <button
                onClick={() => {
                  setVehicleFilter('全部')
                  setLoadFilter('all')
                  setStatusFilter('all')
                  setCreditFilter(0)
                  setOnTimeFilter(0)
                  setSearchKeyword('')
                  setExcludeViolation(false)
                  setAdmissionOnly(false)
                }}
                className="w-full btn-secondary text-sm text-muted hover:text-secondary"
              >
                重置筛选
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <FileText size={14} /> 筛选结果统计
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">筛选结果</span>
                <span className="text-sm font-bold text-primary">{filterStats.count}/50 名司机</span>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <div className="text-xs text-secondary mb-2">信用分分布</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 rounded px-2 py-1.5 text-center">
                    <div className="text-xs font-bold text-emerald-700">{filterStats.excellent}人</div>
                    <div className="text-[10px] text-emerald-600">优秀(≥95)</div>
                  </div>
                  <div className="bg-blue-50 rounded px-2 py-1.5 text-center">
                    <div className="text-xs font-bold text-blue-700">{filterStats.good}人</div>
                    <div className="text-[10px] text-blue-600">良好(85-94)</div>
                  </div>
                  <div className="bg-amber-50 rounded px-2 py-1.5 text-center">
                    <div className="text-xs font-bold text-amber-700">{filterStats.fair}人</div>
                    <div className="text-[10px] text-amber-600">一般(75-84)</div>
                  </div>
                  <div className="bg-red-50 rounded px-2 py-1.5 text-center">
                    <div className="text-xs font-bold text-red-700">{filterStats.poor}人</div>
                    <div className="text-[10px] text-red-600">较差(&lt;75)</div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <div className="text-xs text-secondary mb-2">准入判定 (信用分≥80 + 准点率≥90% + 违章≤2)</div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-emerald-50 rounded px-2 py-1.5 text-center">
                    <div className="text-xs font-bold text-emerald-700">{filterStats.admissionPassed}人</div>
                    <div className="text-[10px] text-emerald-600">通过</div>
                  </div>
                  <div className="flex-1 bg-red-50 rounded px-2 py-1.5 text-center">
                    <div className="text-xs font-bold text-red-700">{filterStats.admissionFailed}人</div>
                    <div className="text-[10px] text-red-600">未通过</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-primary mb-3">车型分布</h3>
            <div className="space-y-2">
              {vehicleTypes.map((type) => {
                const count = filtered.filter(d => d.vehicleType === type).length
                const pct = filtered.length > 0 ? Math.round(count / filtered.length * 100) : 0
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-secondary">{type}</span>
                      <span className="font-medium">{count}人 ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        type === '重型平板' ? 'bg-red-500' :
                        type === '中型厢式' ? 'bg-blue-500' :
                        type === '轻型冷藏' ? 'bg-cyan-500' :
                        type === '大型集装箱' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedDriver && (
            <div className="card relative">
              <button
                onClick={() => setSelectedDriver(null)}
                className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100"
              >
                <X size={14} className="text-muted" />
              </button>
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <FileText size={14} /> 司机信用档案
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white text-lg font-bold">
                  {selectedDriver.name[0]}
                </div>
                <div>
                  <div className="font-medium text-primary">{selectedDriver.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge {...statusMap[selectedDriver.status]} />
                    <span className="text-xs text-muted">{selectedDriver.lastUpdate}更新</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-secondary flex items-center gap-1.5"><Truck size={12} /> 车型</span>
                  <span className="font-medium">{selectedDriver.vehicleType} · {selectedDriver.capacity}吨</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary flex items-center gap-1.5"><MapPin size={12} /> 车牌号</span>
                  <span className="font-medium">{selectedDriver.licensePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary flex items-center gap-1.5"><Phone size={12} /> 联系电话</span>
                  <span className="font-medium">{selectedDriver.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary flex items-center gap-1.5"><MapPin size={12} /> 当前位置</span>
                  <span className="font-medium">{selectedDriver.currentCity} (GPS在线)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary flex items-center gap-1.5"><MapPin size={12} /> GPS坐标</span>
                  <span className="font-medium text-xs font-mono">{formatGps(selectedDriver)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary flex items-center gap-1.5"><Shield size={12} /> 信用评分</span>
                  <span className={`font-bold ${getCreditLevel(selectedDriver.creditScore).color}`}>
                    {selectedDriver.creditScore}分 · {getCreditLevel(selectedDriver.creditScore).level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary flex items-center gap-1.5"><CheckCircle size={12} /> 准点率</span>
                  <span className="font-medium">{selectedDriver.onTimeRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary flex items-center gap-1.5"><AlertTriangle size={12} /> 违章次数</span>
                  <span className={`font-medium ${selectedDriver.violationCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedDriver.violationCount > 0 ? selectedDriver.violationCount + '次' : '无违章'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary flex items-center gap-1.5"><Star size={12} /> 投诉率</span>
                  <span className="font-medium">{(selectedDriver.complaintRate * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary flex items-center gap-1.5"><Star size={12} className="text-accent" /> 综合评分</span>
                  <span className="font-medium">{selectedDriver.rating}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3">
                <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                  <Shield size={12} /> 准入判定
                </h4>
                {(() => {
                  const passed = isAdmissionPassed(selectedDriver)
                  const reasons = getAdmissionReasons(selectedDriver)
                  return (
                    <div className={`rounded-lg p-3 ${passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className={`text-sm font-bold mb-2 ${passed ? 'text-emerald-700' : 'text-red-700'}`}>
                        {passed ? '准入通过' : '准入未通过'}
                      </div>
                      <div className="space-y-1">
                        {reasons.map((r, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            {r.passed
                              ? <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                              : <X size={12} className="text-red-500 shrink-0" />
                            }
                            <span className={r.passed ? 'text-emerald-700' : 'text-red-700'}>{r.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3">
                <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                  <Clock size={12} /> 历史运单摘要
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 rounded px-2 py-1.5 text-center">
                    <div className="text-sm font-bold text-blue-700">{selectedDriver.monthlyOrders}</div>
                    <div className="text-[10px] text-blue-600">本月完成</div>
                  </div>
                  <div className="bg-emerald-50 rounded px-2 py-1.5 text-center">
                    <div className="text-sm font-bold text-emerald-700">{selectedDriver.monthlyOnTime}</div>
                    <div className="text-[10px] text-emerald-600">准时单数</div>
                  </div>
                  <div className="bg-amber-50 rounded px-2 py-1.5 text-center">
                    <div className="text-sm font-bold text-amber-700">{selectedDriver.monthlyComplaints}</div>
                    <div className="text-[10px] text-amber-600">投诉次数</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => navigate(`/matching?driverId=${selectedDriver.id}`)} className="btn-primary text-xs">
                  <Zap size={12} className="inline mr-1" /> 直接撮合
                </button>
                <button className="btn-secondary text-xs">
                  <Phone size={12} className="inline mr-1" /> 联系司机
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-9 space-y-4">
          <div className="flex gap-2 border-b border-gray-100">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'map' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary'
              }`}
            >
              <MapPin size={14} className="inline mr-1.5" /> 全国运力热力图
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary'
              }`}
            >
              <Truck size={14} className="inline mr-1.5" /> 运力明细表
            </button>
          </div>

          {activeTab === 'map' ? (
            <div className="space-y-4">
              <HeatMap
                points={heatPoints}
                height={500}
                title={`全国运力实时分布 · 筛选结果 ${filtered.length} 名司机`}
              />
              <div className="card">
                <h3 className="text-sm font-semibold text-primary mb-3">地图说明</h3>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-secondary">空闲司机 <span className="font-medium text-primary">{filtered.filter(d => d.status === 'idle').length}人</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-secondary">运输中 <span className="font-medium text-primary">{filtered.filter(d => d.status === 'busy').length}人</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-secondary">离线 <span className="font-medium text-primary">{filtered.filter(d => d.status === 'offline').length}人</span></span>
                  </div>
                  <div className="text-xs text-muted">* 点击地图上的司机可查看详细信用档案</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-primary">运力明细列表</h3>
                <span className="text-xs text-muted">筛选结果: {filtered.length} 名司机</span>
              </div>
              <DataTable
                columns={columns}
                data={filtered}
                onRowClick={(row) => setSelectedDriver(row)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
