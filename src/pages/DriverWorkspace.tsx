import { useEffect, useState, useCallback } from 'react'
import {
  Package,
  DollarSign,
  TrendingUp,
  Star,
  Clock,
  Navigation,
  MapPin,
  Weight,
  Ruler,
  Truck,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Upload,
  Eye,
  FileText,
  Camera,
  AlertTriangle,
  Thermometer,
  Droplets,
  Signature,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'
import DataTable from '@/components/DataTable'
import Chart from '@/components/Chart'
import { api } from '@/utils/api'

type MainTab = 'available' | 'waybills' | 'offline'
type WaybillSubTab = 'pickup' | 'in_transit' | 'delivered' | 'completed'

interface Order {
  id: string
  orderNo: string
  fromCity: string
  toCity: string
  distance: number
  cargoType: string
  weight: number
  volume: number
  transportMode: string
  price: number
  estimatedMileage: number
  estimatedTime: string
  expireAt: string
  createdAt: string
}

interface Waybill {
  id: string
  waybillNo: string
  orderId: string
  fromCity: string
  toCity: string
  status: WaybillSubTab
  cargoType: string
  weight: number
  volume: number
  pickupTime: string
  estimatedDeliveryTime: string
  actualDeliveryTime?: string
  fee: number
  photos: string[]
  temperatureLogs?: { time: string; temp: number; humidity: number }[]
  shipperSignature?: string
  receiverSignature?: string
  exception?: string
  routeNodes?: { x: number; y: number; label: string }[]
}

interface OfflineRecord {
  id: string
  type: 'accept' | 'update' | 'sign'
  waybillNo: string
  data: unknown
  createdAt: string
  synced: boolean
}

interface Filters {
  cargoType: string
  weight: string
  distance: string
  transportMode: string
}

const cargoTypes = ['全部', '生鲜', '电子', '建材', '冷链', '化工', '日用', '服装', '机械']
const weightRanges = ['全部', '0-5吨', '5-15吨', '15-30吨', '30吨以上']
const distanceRanges = ['全部', '0-100km', '100-300km', '300-500km', '500km以上']
const transportModes = ['全部', '整车', '零担', '冷链', '危险品', '大件']

const orderStatusMap: Record<string, { status: 'pending' | 'active' | 'completed' | 'info' | 'warning' | 'danger'; label: string }> = {
  available: { status: 'pending', label: '待接单' },
  accepted: { status: 'active', label: '已接单' },
}

const waybillStatusMap: Record<WaybillSubTab, { status: 'pending' | 'active' | 'completed' | 'info'; label: string }> = {
  pickup: { status: 'pending', label: '待取货' },
  in_transit: { status: 'active', label: '运输中' },
  delivered: { status: 'completed', label: '已送达' },
  completed: { status: 'info', label: '已完成' },
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNo: 'ORD202606020001',
    fromCity: '上海',
    toCity: '杭州',
    distance: 176,
    cargoType: '生鲜',
    weight: 12,
    volume: 28,
    transportMode: '冷链',
    price: 2850,
    estimatedMileage: 180,
    estimatedTime: '3小时',
    expireAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    createdAt: '2026-06-02 08:30',
  },
  {
    id: '2',
    orderNo: 'ORD202606020002',
    fromCity: '广州',
    toCity: '深圳',
    distance: 138,
    cargoType: '电子',
    weight: 5,
    volume: 12,
    transportMode: '整车',
    price: 1200,
    estimatedMileage: 140,
    estimatedTime: '2.5小时',
    expireAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    createdAt: '2026-06-02 09:00',
  },
  {
    id: '3',
    orderNo: 'ORD202606020003',
    fromCity: '北京',
    toCity: '天津',
    distance: 120,
    cargoType: '建材',
    weight: 28,
    volume: 45,
    transportMode: '整车',
    price: 1800,
    estimatedMileage: 125,
    estimatedTime: '2小时',
    expireAt: new Date(Date.now() + 1.5 * 60 * 1000).toISOString(),
    createdAt: '2026-06-02 09:45',
  },
  {
    id: '4',
    orderNo: 'ORD202606020004',
    fromCity: '武汉',
    toCity: '长沙',
    distance: 330,
    cargoType: '冷链',
    weight: 15,
    volume: 32,
    transportMode: '冷链',
    price: 4200,
    estimatedMileage: 340,
    estimatedTime: '4.5小时',
    expireAt: new Date(Date.now() + 2.5 * 60 * 1000).toISOString(),
    createdAt: '2026-06-02 10:15',
  },
]

const mockWaybills: Waybill[] = [
  {
    id: 'W1',
    waybillNo: 'HDT202606020001',
    orderId: 'O1',
    fromCity: '南京',
    toCity: '上海',
    status: 'in_transit',
    cargoType: '日用',
    weight: 8,
    volume: 20,
    pickupTime: '2026-06-02 06:00',
    estimatedDeliveryTime: '2026-06-02 11:00',
    fee: 3200,
    photos: ['photo1.jpg', 'photo2.jpg'],
    temperatureLogs: [
      { time: '06:00', temp: 4.2, humidity: 65 },
      { time: '08:00', temp: 4.5, humidity: 63 },
      { time: '10:00', temp: 4.8, humidity: 61 },
    ],
    routeNodes: [
      { x: 0.2, y: 0.5, label: '南京' },
      { x: 0.5, y: 0.5, label: '镇江' },
      { x: 0.8, y: 0.5, label: '上海' },
    ],
  },
  {
    id: 'W2',
    waybillNo: 'HDT202606020002',
    orderId: 'O2',
    fromCity: '成都',
    toCity: '重庆',
    status: 'pickup',
    cargoType: '机械',
    weight: 25,
    volume: 35,
    pickupTime: '2026-06-02 14:00',
    estimatedDeliveryTime: '2026-06-02 18:00',
    fee: 2800,
    photos: [],
    routeNodes: [
      { x: 0.3, y: 0.5, label: '成都' },
      { x: 0.7, y: 0.5, label: '重庆' },
    ],
  },
  {
    id: 'W3',
    waybillNo: 'HDT202606020003',
    orderId: 'O3',
    fromCity: '西安',
    toCity: '郑州',
    status: 'delivered',
    cargoType: '服装',
    weight: 6,
    volume: 18,
    pickupTime: '2026-06-01 08:00',
    estimatedDeliveryTime: '2026-06-01 16:00',
    actualDeliveryTime: '2026-06-01 15:30',
    fee: 4500,
    photos: ['photo3.jpg'],
    shipperSignature: 'shipper_sign.png',
    routeNodes: [
      { x: 0.25, y: 0.5, label: '西安' },
      { x: 0.5, y: 0.5, label: '三门峡' },
      { x: 0.75, y: 0.5, label: '郑州' },
    ],
  },
  {
    id: 'W4',
    waybillNo: 'HDT202606020004',
    orderId: 'O4',
    fromCity: '杭州',
    toCity: '宁波',
    status: 'completed',
    cargoType: '化工',
    weight: 18,
    volume: 25,
    pickupTime: '2026-05-31 10:00',
    estimatedDeliveryTime: '2026-05-31 13:00',
    actualDeliveryTime: '2026-05-31 12:45',
    fee: 1800,
    photos: ['photo4.jpg', 'photo5.jpg'],
    shipperSignature: 'shipper_sign2.png',
    receiverSignature: 'receiver_sign2.png',
    routeNodes: [
      { x: 0.3, y: 0.5, label: '杭州' },
      { x: 0.7, y: 0.5, label: '宁波' },
    ],
  },
]

const mockOfflineRecords: OfflineRecord[] = [
  {
    id: 'off1',
    type: 'accept',
    waybillNo: 'HDT202606020005',
    data: { orderId: 'O5' },
    createdAt: '2026-06-02 07:30',
    synced: false,
  },
  {
    id: 'off2',
    type: 'update',
    waybillNo: 'HDT202606020001',
    data: { status: 'in_transit' },
    createdAt: '2026-06-02 08:00',
    synced: true,
  },
]

const STORAGE_KEY = 'driver_offline_data'

export default function DriverWorkspace() {
  const navigate = useNavigate()
  const [mainTab, setMainTab] = useState<MainTab>('available')
  const [waybillSubTab, setWaybillSubTab] = useState<WaybillSubTab>('pickup')
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [waybills, setWaybills] = useState<Waybill[]>(mockWaybills)
  const [offlineRecords, setOfflineRecords] = useState<OfflineRecord[]>(mockOfflineRecords)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [selectedWaybill, setSelectedWaybill] = useState<Waybill | null>(null)
  const [showWaybillModal, setShowWaybillModal] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    cargoType: '全部',
    weight: '全部',
    distance: '全部',
    transportMode: '全部',
  })
  const [countdowns, setCountdowns] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    api.get<Order[]>('/driver/orders').then(setOrders).catch(() => {})
    api.get<Waybill[]>('/driver/waybills').then(setWaybills).catch(() => {})
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setOfflineRecords(data.records || [])
        setIsOfflineMode(data.offlineMode || false)
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      records: offlineRecords,
      offlineMode: isOfflineMode,
    }))
  }, [offlineRecords, isOfflineMode])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      const newCountdowns: Record<string, number> = {}
      orders.forEach((order) => {
        const expireTime = new Date(order.expireAt).getTime()
        const remaining = Math.max(0, expireTime - now)
        newCountdowns[order.id] = remaining
      })
      setCountdowns(newCountdowns)
    }, 1000)

    return () => clearInterval(timer)
  }, [orders])

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const filteredOrders = orders.filter((order) => {
    if (filters.cargoType !== '全部' && order.cargoType !== filters.cargoType) return false
    if (filters.transportMode !== '全部' && order.transportMode !== filters.transportMode) return false

    if (filters.weight !== '全部') {
      const [min, max] = filters.weight.replace('吨以上', '').split('-').map(Number)
      if (max === undefined) {
        if (order.weight < min) return false
      } else {
        if (order.weight < min || order.weight >= max) return false
      }
    }

    if (filters.distance !== '全部') {
      const range = filters.distance
      if (range === '0-100km' && order.distance >= 100) return false
      if (range === '100-300km' && (order.distance < 100 || order.distance >= 300)) return false
      if (range === '300-500km' && (order.distance < 300 || order.distance >= 500)) return false
      if (range === '500km以上' && order.distance < 500) return false
    }

    return true
  })

  const filteredWaybills = waybills.filter((wb) => wb.status === waybillSubTab)

  const handleAcceptOrder = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      if (isOfflineMode || !isOnline) {
        const order = orders.find((o) => o.id === orderId)
        if (order) {
          const newRecord: OfflineRecord = {
            id: `off${Date.now()}`,
            type: 'accept',
            waybillNo: `HDT${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            data: { orderId },
            createdAt: new Date().toISOString(),
            synced: false,
          }
          setOfflineRecords((prev) => [...prev, newRecord])
          setOrders((prev) => prev.filter((o) => o.id !== orderId))
        }
      } else {
        await api.post(`/driver/accept/${orderId}`)
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
      }
    } catch {
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
    } finally {
      setLoading(false)
    }
  }, [isOfflineMode, isOnline, orders])

  const handleRejectOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
  }, [])

  const handleUpdateWaybill = useCallback(async (waybillId: string, newStatus: WaybillSubTab) => {
    setLoading(true)
    try {
      if (isOfflineMode || !isOnline) {
        const waybill = waybills.find((w) => w.id === waybillId)
        if (waybill) {
          const newRecord: OfflineRecord = {
            id: `off${Date.now()}`,
            type: 'update',
            waybillNo: waybill.waybillNo,
            data: { waybillId, status: newStatus },
            createdAt: new Date().toISOString(),
            synced: false,
          }
          setOfflineRecords((prev) => [...prev, newRecord])
          setWaybills((prev) =>
            prev.map((w) => (w.id === waybillId ? { ...w, status: newStatus } : w))
          )
        }
      } else {
        await api.put('/waybill/update', { waybillId, status: newStatus })
        setWaybills((prev) =>
          prev.map((w) => (w.id === waybillId ? { ...w, status: newStatus } : w))
        )
      }
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setLoading(false)
    }
  }, [isOfflineMode, isOnline, waybills])

  const handleSignWaybill = useCallback(async (waybillId: string, type: 'shipper' | 'receiver') => {
    setLoading(true)
    try {
      const signature = `${type}_sign_${Date.now()}.png`
      if (isOfflineMode || !isOnline) {
        const waybill = waybills.find((w) => w.id === waybillId)
        if (waybill) {
          const newRecord: OfflineRecord = {
            id: `off${Date.now()}`,
            type: 'sign',
            waybillNo: waybill.waybillNo,
            data: { waybillId, type, signature },
            createdAt: new Date().toISOString(),
            synced: false,
          }
          setOfflineRecords((prev) => [...prev, newRecord])
          setWaybills((prev) =>
            prev.map((w) =>
              w.id === waybillId
                ? {
                    ...w,
                    ...(type === 'shipper' ? { shipperSignature: signature } : { receiverSignature: signature }),
                  }
                : w
            )
          )
        }
      } else {
        await api.post('/waybill/sign', { waybillId, type, signature })
        setWaybills((prev) =>
          prev.map((w) =>
            w.id === waybillId
              ? {
                  ...w,
                  ...(type === 'shipper' ? { shipperSignature: signature } : { receiverSignature: signature }),
                }
              : w
          )
        )
      }
    } catch (error) {
      console.error('Sign failed:', error)
    } finally {
      setLoading(false)
    }
  }, [isOfflineMode, isOnline, waybills])

  const handleSync = useCallback(async () => {
    if (!isOnline) return
    setSyncing(true)
    try {
      const unsynced = offlineRecords.filter((r) => !r.synced)
      for (const record of unsynced) {
        try {
          if (record.type === 'accept') {
            const data = record.data as { orderId: string }
            await api.post(`/driver/accept/${data.orderId}`)
          } else if (record.type === 'update') {
            const data = record.data as { waybillId: string; status: WaybillSubTab }
            await api.put('/waybill/update', data)
          } else if (record.type === 'sign') {
            const data = record.data as { waybillId: string; type: string; signature: string }
            await api.post('/waybill/sign', data)
          }
          setOfflineRecords((prev) =>
            prev.map((r) => (r.id === record.id ? { ...r, synced: true } : r))
          )
        } catch {
          // continue with next record
        }
      }
    } finally {
      setSyncing(false)
    }
  }, [isOnline, offlineRecords])

  const openWaybillDetail = (waybill: Waybill) => {
    setSelectedWaybill(waybill)
    setShowWaybillModal(true)
  }

  const todayOrders = waybills.filter((w) =>
    w.pickupTime.startsWith('2026-06-02')
  ).length
  const todayIncome = waybills
    .filter((w) => w.status === 'completed' || w.status === 'delivered')
    .filter((w) => w.pickupTime.startsWith('2026-06-02'))
    .reduce((s, w) => s + w.fee, 0)
  const monthIncome = waybills
    .filter((w) => w.status === 'completed')
    .reduce((s, w) => s + w.fee, 0)
  const serviceRating = 4.92

  const unsyncedCount = offlineRecords.filter((r) => !r.synced).length

  const incomeChartData = {
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    values: [3200, 2850, 4100, 3500, 2900, 5200, 2850],
  }

  const renderStatusAction = (waybill: Waybill) => {
    switch (waybill.status) {
      case 'pickup':
        return (
          <button
            onClick={() => handleUpdateWaybill(waybill.id, 'in_transit')}
            disabled={loading}
            className="btn-primary text-xs flex items-center gap-1"
          >
            <CheckCircle size={14} />
            确认取货
          </button>
        )
      case 'in_transit':
        return (
          <button
            onClick={() => handleUpdateWaybill(waybill.id, 'delivered')}
            disabled={loading}
            className="btn-primary text-xs flex items-center gap-1"
          >
            <Navigation size={14} />
            确认送达
          </button>
        )
      case 'delivered':
        return (
          <button
            onClick={() => handleUpdateWaybill(waybill.id, 'completed')}
            disabled={loading || !waybill.receiverSignature}
            className="btn-primary text-xs flex items-center gap-1"
          >
            <CheckCircle size={14} />
            {waybill.receiverSignature ? '完成运单' : '待签收'}
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">司机工作台</h1>
          <p className="text-sm text-secondary mt-0.5">管理订单、运单和离线操作</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? '网络正常' : '已离线'}
          </div>
          {isOfflineMode && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
              <WifiOff size={14} />
              离线模式
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Package size={20} />}
          value={todayOrders}
          label="今日接单"
          sublabel="单"
          gradient="gradient-primary"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          icon={<DollarSign size={20} />}
          value={`¥${todayIncome.toLocaleString()}`}
          label="今日收入"
          gradient="gradient-accent"
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          value={`¥${monthIncome.toLocaleString()}`}
          label="本月收入"
          gradient="gradient-mint"
          trend={{ value: 15, positive: true }}
        />
        <StatCard
          icon={<Star size={20} />}
          value={serviceRating}
          label="服务评分"
          sublabel="共 128 单评价"
          gradient="gradient-coral"
        />
      </div>

      <div className="flex gap-2 border-b border-border pb-0">
        {[
          { key: 'available', label: '可接订单', count: filteredOrders.length },
          { key: 'waybills', label: '我的运单', count: waybills.length },
          { key: 'offline', label: '离线管理', count: unsyncedCount },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setMainTab(t.key as MainTab)}
            className={`px-5 py-2.5 text-sm font-medium relative transition-colors ${
              mainTab === t.key
                ? 'text-primary'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                mainTab === t.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-secondary'
              }`}>
                {t.count}
              </span>
            )}
            {mainTab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
            )}
          </button>
        ))}
      </div>

      {mainTab === 'available' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-secondary hover:bg-gray-50 transition-colors"
              >
                <Filter size={16} />
                筛选
                <ChevronDown size={14} className={showFilter ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              <button
                onClick={() => {
                  api.get<Order[]>('/driver/orders').then(setOrders).catch(() => {})
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-secondary hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={16} />
                刷新
              </button>
            </div>
            <span className="text-sm text-muted">共 {filteredOrders.length} 条可接订单</span>
          </div>

          {showFilter && (
            <div className="card !p-4 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">货类</label>
                <select
                  value={filters.cargoType}
                  onChange={(e) => setFilters({ ...filters, cargoType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {cargoTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">重量</label>
                <select
                  value={filters.weight}
                  onChange={(e) => setFilters({ ...filters, weight: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {weightRanges.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">距离</label>
                <select
                  value={filters.distance}
                  onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {distanceRanges.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">运输模式</label>
                <select
                  value={filters.transportMode}
                  onChange={(e) => setFilters({ ...filters, transportMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {transportModes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {filteredOrders.map((order) => {
              const remaining = countdowns[order.id] || 0
              const isUrgent = remaining < 60000
              return (
                <div key={order.id} className="card !p-4 relative overflow-hidden">
                  {isUrgent && (
                    <div className="absolute top-0 right-0 bg-coral text-white text-xs px-2 py-1 rounded-bl-lg flex items-center gap-1 animate-pulse">
                      <Clock size={12} />
                      即将到期
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-muted">{order.orderNo}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="pending" label="待接单" />
                      <div className={`flex items-center gap-1 text-xs font-mono ${
                        isUrgent ? 'text-coral' : 'text-secondary'
                      }`}>
                        <Clock size={12} />
                        {formatCountdown(remaining)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex flex-col items-center">
                      <MapPin size={14} className="text-mint" />
                      <div className="w-px h-6 bg-border" />
                      <MapPin size={14} className="text-coral" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-primary">{order.fromCity}</div>
                      <div className="text-xs text-muted my-1.5">{order.distance}km</div>
                      <div className="text-sm font-medium text-primary">{order.toCity}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/5 text-primary">
                      {order.cargoType}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent">
                      <Weight size={10} className="inline mr-0.5" />
                      {order.weight}吨
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-mint/10 text-mint">
                      <Ruler size={10} className="inline mr-0.5" />
                      {order.volume}m³
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-coral/10 text-coral">
                      <Truck size={10} className="inline mr-0.5" />
                      {order.transportMode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div>
                      <span className="text-2xl font-bold font-mono text-accent">¥{order.price.toLocaleString()}</span>
                      <div className="text-xs text-muted mt-0.5">
                        预计里程 {order.estimatedMileage}km · 预计时效 {order.estimatedTime}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectOrder(order.id)}
                        className="btn-secondary text-xs !px-3 !py-1.5 flex items-center gap-1"
                      >
                        <XCircle size={14} />
                        拒单
                      </button>
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={loading || remaining === 0}
                        className="btn-primary text-xs !px-3 !py-1.5 flex items-center gap-1"
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        接单
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredOrders.length === 0 && (
              <div className="col-span-2 card text-center py-16 text-muted">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                暂无可接订单
              </div>
            )}
          </div>
        </div>
      )}

      {mainTab === 'waybills' && (
        <div className="space-y-4">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {Object.entries(waybillStatusMap).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setWaybillSubTab(key as WaybillSubTab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  waybillSubTab === key
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {val.label}
                <span className="ml-1 text-xs">
                  ({waybills.filter((w) => w.status === key).length})
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredWaybills.map((waybill) => (
              <div key={waybill.id} className="card !p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted">{waybill.waybillNo}</span>
                    <StatusBadge {...waybillStatusMap[waybill.status]} />
                  </div>
                  <span className="font-bold font-mono text-accent">¥{waybill.fee.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    {waybill.routeNodes && (
                      <div className="bg-gray-50 rounded-lg overflow-hidden" style={{ height: '100px' }}>
                        <svg viewBox="0 0 100 50" className="w-full h-full">
                          {waybill.routeNodes.map((node, i) => {
                            if (i < waybill.routeNodes!.length - 1) {
                              const next = waybill.routeNodes![i + 1]
                              return (
                                <line
                                  key={`line-${i}`}
                                  x1={node.x * 100}
                                  y1={node.y * 50}
                                  x2={next.x * 100}
                                  y2={next.y * 50}
                                  stroke="#F59E0B"
                                  strokeWidth="1.5"
                                  strokeDasharray={waybill.status === 'in_transit' && i === 0 ? '4,2' : 'none'}
                                />
                              )
                            }
                            return null
                          })}
                          {waybill.routeNodes.map((node, i) => (
                            <g key={`node-${i}`}>
                              <circle
                                cx={node.x * 100}
                                cy={node.y * 50}
                                r="4"
                                fill={i === 0 ? '#10B981' : i === waybill.routeNodes!.length - 1 ? '#EF4444' : '#F59E0B'}
                              />
                              <text
                                x={node.x * 100}
                                y={node.y * 50 - 6}
                                textAnchor="middle"
                                fontSize="6"
                                fill="#1B2A4A"
                              >
                                {node.label}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={14} className="text-mint" />
                      <span className="text-sm font-medium text-primary">{waybill.fromCity}</span>
                      <ChevronRight size={14} className="text-muted" />
                      <MapPin size={14} className="text-coral" />
                      <span className="text-sm font-medium text-primary">{waybill.toCity}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-primary/5 text-primary">
                        {waybill.cargoType}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent">
                        {waybill.weight}吨
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-mint/10 text-mint">
                        {waybill.volume}m³
                      </span>
                    </div>

                    <div className="text-xs text-secondary mb-3">
                      <span>取货: {waybill.pickupTime}</span>
                      <span className="mx-2">|</span>
                      <span>预计送达: {waybill.estimatedDeliveryTime}</span>
                      {waybill.actualDeliveryTime && (
                        <>
                          <span className="mx-2">|</span>
                          <span className="text-mint">实际送达: {waybill.actualDeliveryTime}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => openWaybillDetail(waybill)}
                        className="text-xs text-primary hover:text-accent flex items-center gap-1"
                      >
                        <FileText size={14} />
                        电子运单详情
                      </button>
                      <div className="flex items-center gap-2">
                        {waybill.status === 'pickup' && !waybill.shipperSignature && (
                          <button
                            onClick={() => handleSignWaybill(waybill.id, 'shipper')}
                            disabled={loading}
                            className="btn-secondary text-xs !px-3 !py-1.5 flex items-center gap-1"
                          >
                            <Signature size={14} />
                            发货方签章
                          </button>
                        )}
                        {waybill.status === 'delivered' && !waybill.receiverSignature && (
                          <button
                            onClick={() => handleSignWaybill(waybill.id, 'receiver')}
                            disabled={loading}
                            className="btn-secondary text-xs !px-3 !py-1.5 flex items-center gap-1"
                          >
                            <Signature size={14} />
                            收货方签章
                          </button>
                        )}
                        {renderStatusAction(waybill)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredWaybills.length === 0 && (
              <div className="card text-center py-16 text-muted">
                <FileText size={48} className="mx-auto mb-3 opacity-30" />
                暂无{waybillStatusMap[waybillSubTab].label}运单
              </div>
            )}
          </div>
        </div>
      )}

      {mainTab === 'offline' && (
        <div className="space-y-4">
          <div className="card !p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  isOfflineMode ? 'gradient-accent' : 'gradient-primary'
                }`}>
                  {isOfflineMode ? <WifiOff size={24} className="text-white" /> : <Wifi size={24} className="text-white" />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-primary">离线模式</h3>
                  <p className="text-sm text-secondary mt-0.5">
                    {isOfflineMode
                      ? '当前处于离线模式，所有操作将在本地缓存，联网后自动同步'
                      : '开启后支持无网络环境接单，数据将在联网后自动同步'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOfflineMode(!isOfflineMode)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  isOfflineMode ? 'bg-accent' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  isOfflineMode ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card !p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <RefreshCw size={16} className="text-accent" />
                  待同步运单
                  {unsyncedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs bg-accent/10 text-accent">
                      {unsyncedCount}条
                    </span>
                  )}
                </h3>
                <button
                  onClick={handleSync}
                  disabled={!isOnline || syncing || unsyncedCount === 0}
                  className="text-xs text-primary hover:text-accent flex items-center gap-1 disabled:opacity-50"
                >
                  {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {syncing ? '同步中...' : '立即同步'}
                </button>
              </div>

              <DataTable
                columns={[
                  { key: 'waybillNo', title: '运单号' },
                  {
                    key: 'type',
                    title: '操作类型',
                    render: (row) => (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        row.type === 'accept'
                          ? 'bg-mint/10 text-mint'
                          : row.type === 'update'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent/10 text-accent'
                      }`}>
                        {row.type === 'accept' ? '接单' : row.type === 'update' ? '状态更新' : '电子签收'}
                      </span>
                    ),
                  },
                  { key: 'createdAt', title: '操作时间' },
                  {
                    key: 'synced',
                    title: '状态',
                    render: (row) => (
                      row.synced
                        ? <StatusBadge status="completed" label="已同步" />
                        : <StatusBadge status="pending" label="待同步" />
                    ),
                  },
                ]}
                data={offlineRecords}
                pageSize={5}
              />
            </div>

            <div className="space-y-4">
              <div className="card !p-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-primary" />
                  离线接单记录
                </h3>
                <DataTable
                  columns={[
                    { key: 'waybillNo', title: '运单号' },
                    {
                      key: 'type',
                      title: '操作类型',
                      render: (row) => (
                        <span className="text-xs text-secondary">
                          {row.type === 'accept' ? '离线接单' : row.type === 'update' ? '状态更新' : '电子签收'}
                        </span>
                      ),
                    },
                    { key: 'createdAt', title: '时间' },
                  ]}
                  data={offlineRecords.filter((r) => r.type === 'accept')}
                  pageSize={5}
                />
              </div>

              <div className="card !p-4">
                <h3 className="text-sm font-semibold text-primary mb-4">本周收入趋势</h3>
                <Chart
                  type="line"
                  data={incomeChartData}
                  height={180}
                  lineColor="#F59E0B"
                />
              </div>
            </div>
          </div>

          <div className="card !p-4">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
              <Wifi size={16} className={isOnline ? 'text-mint' : 'text-coral'} />
              同步状态指示
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  isOnline ? 'bg-mint/10' : 'bg-coral/10'
                }`}>
                  <Wifi size={20} className={isOnline ? 'text-mint' : 'text-coral'} />
                </div>
                <div className="text-xs font-medium text-primary">网络连接</div>
                <div className={`text-xs mt-0.5 ${isOnline ? 'text-mint' : 'text-coral'}`}>
                  {isOnline ? '已连接' : '已断开'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  isOfflineMode ? 'bg-accent/10' : 'bg-primary/10'
                }`}>
                  <WifiOff size={20} className={isOfflineMode ? 'text-accent' : 'text-primary'} />
                </div>
                <div className="text-xs font-medium text-primary">离线模式</div>
                <div className={`text-xs mt-0.5 ${isOfflineMode ? 'text-accent' : 'text-primary'}`}>
                  {isOfflineMode ? '已开启' : '已关闭'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-accent/10">
                  <RefreshCw size={20} className="text-accent" />
                </div>
                <div className="text-xs font-medium text-primary">待同步</div>
                <div className="text-xs text-accent mt-0.5">{unsyncedCount} 条</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-mint/10">
                  <CheckCircle size={20} className="text-mint" />
                </div>
                <div className="text-xs font-medium text-primary">已同步</div>
                <div className="text-xs text-mint mt-0.5">
                  {offlineRecords.filter((r) => r.synced).length} 条
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWaybillModal && selectedWaybill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-primary" />
                <h2 className="text-lg font-semibold text-primary">电子运单详情</h2>
                <span className="text-xs font-mono text-muted">{selectedWaybill.waybillNo}</span>
                <StatusBadge {...waybillStatusMap[selectedWaybill.status]} />
              </div>
              <button
                onClick={() => setShowWaybillModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-secondary" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="card !p-4">
                  <h3 className="text-sm font-semibold text-primary mb-3">运输路线</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-mint/10 flex items-center justify-center">
                        <MapPin size={14} className="text-mint" />
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center">
                        <MapPin size={14} className="text-coral" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-primary">{selectedWaybill.fromCity}</div>
                      <div className="text-xs text-muted my-2">发货地</div>
                      <div className="font-medium text-primary">{selectedWaybill.toCity}</div>
                      <div className="text-xs text-muted mt-2">收货地</div>
                    </div>
                  </div>
                </div>

                <div className="card !p-4">
                  <h3 className="text-sm font-semibold text-primary mb-3">货物信息</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">货类</span>
                      <span className="text-primary font-medium">{selectedWaybill.cargoType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">重量</span>
                      <span className="text-primary font-medium">{selectedWaybill.weight} 吨</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">体积</span>
                      <span className="text-primary font-medium">{selectedWaybill.volume} m³</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">运费</span>
                      <span className="text-accent font-bold">¥{selectedWaybill.fee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card !p-4">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <Camera size={16} className="text-accent" />
                  货物照片
                </h3>
                <div className="flex gap-3">
                  {selectedWaybill.photos.map((photo, i) => (
                    <div
                      key={i}
                      className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center relative group cursor-pointer"
                    >
                      <Eye size={24} className="text-muted group-hover:text-accent transition-colors" />
                      <span className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1.5 rounded">
                        照片 {i + 1}
                      </span>
                    </div>
                  ))}
                  <button className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-accent hover:bg-accent/5 transition-colors">
                    <Upload size={20} className="text-muted" />
                    <span className="text-xs text-muted">上传</span>
                  </button>
                </div>
              </div>

              {selectedWaybill.temperatureLogs && (
                <div className="card !p-4">
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <Thermometer size={16} className="text-coral" />
                    温湿度记录（冷链）
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Chart
                        type="line"
                        data={{
                          labels: selectedWaybill.temperatureLogs.map((l) => l.time),
                          values: selectedWaybill.temperatureLogs.map((l) => l.temp),
                        }}
                        height={120}
                        lineColor="#EF4444"
                        threshold={{ min: 2, max: 8 }}
                      />
                      <p className="text-xs text-center text-secondary mt-2">温度 (°C)</p>
                    </div>
                    <div>
                      <Chart
                        type="line"
                        data={{
                          labels: selectedWaybill.temperatureLogs.map((l) => l.time),
                          values: selectedWaybill.temperatureLogs.map((l) => l.humidity),
                        }}
                        height={120}
                        lineColor="#3B82F6"
                        threshold={{ min: 50, max: 70 }}
                      />
                      <p className="text-xs text-center text-secondary mt-2">湿度 (%)</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="card !p-4">
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <Signature size={16} className="text-mint" />
                    发货方电子签章
                  </h3>
                  {selectedWaybill.shipperSignature ? (
                    <div className="h-20 bg-gray-50 rounded-lg flex items-center justify-center border border-mint/30">
                      <div className="text-center">
                        <CheckCircle size={20} className="text-mint mx-auto mb-1" />
                        <span className="text-xs text-mint">已签章</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSignWaybill(selectedWaybill.id, 'shipper')}
                      disabled={loading || selectedWaybill.status !== 'pickup'}
                      className="w-full h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-mint hover:bg-mint/5 transition-colors disabled:opacity-50"
                    >
                      <Signature size={20} className="text-muted" />
                      <span className="text-xs text-muted">点击签章</span>
                    </button>
                  )}
                </div>

                <div className="card !p-4">
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <Signature size={16} className="text-accent" />
                    收货方电子签章
                  </h3>
                  {selectedWaybill.receiverSignature ? (
                    <div className="h-20 bg-gray-50 rounded-lg flex items-center justify-center border border-accent/30">
                      <div className="text-center">
                        <CheckCircle size={20} className="text-accent mx-auto mb-1" />
                        <span className="text-xs text-accent">已签收</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSignWaybill(selectedWaybill.id, 'receiver')}
                      disabled={loading || (selectedWaybill.status !== 'delivered' && selectedWaybill.status !== 'in_transit')}
                      className="w-full h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-accent hover:bg-accent/5 transition-colors disabled:opacity-50"
                    >
                      <Signature size={20} className="text-muted" />
                      <span className="text-xs text-muted">点击签收</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="card !p-4">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-coral" />
                  异常报备
                </h3>
                {selectedWaybill.exception ? (
                  <div className="p-3 bg-coral/5 rounded-lg border border-coral/20">
                    <p className="text-sm text-coral">{selectedWaybill.exception}</p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <textarea
                      placeholder="请描述异常情况..."
                      className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 resize-none"
                      rows={2}
                    />
                    <button className="btn-secondary !px-4 text-sm self-end">
                      提交报备
                    </button>
                  </div>
                )}
              </div>

              <div className="card !p-4">
                <h3 className="text-sm font-semibold text-primary mb-3">时间节点</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-mint mt-1.5" />
                    <div>
                      <div className="text-sm font-medium text-primary">取货完成</div>
                      <div className="text-xs text-muted">{selectedWaybill.pickupTime}</div>
                    </div>
                  </div>
                  {selectedWaybill.status !== 'pickup' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-accent mt-1.5" />
                      <div>
                        <div className="text-sm font-medium text-primary">开始运输</div>
                        <div className="text-xs text-muted">{selectedWaybill.pickupTime}</div>
                      </div>
                    </div>
                  )}
                  {selectedWaybill.actualDeliveryTime && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-coral mt-1.5" />
                      <div>
                        <div className="text-sm font-medium text-primary">送达完成</div>
                        <div className="text-xs text-muted">{selectedWaybill.actualDeliveryTime}</div>
                      </div>
                    </div>
                  )}
                  {selectedWaybill.status === 'completed' && selectedWaybill.receiverSignature && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
                      <div>
                        <div className="text-sm font-medium text-primary">运单完成</div>
                        <div className="text-xs text-muted">收货方已签收</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-gray-50">
              <button
                onClick={() => setShowWaybillModal(false)}
                className="btn-secondary text-sm"
              >
                关闭
              </button>
              <button
                onClick={() => navigate('/settlement')}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <DollarSign size={16} />
                查看结算
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
