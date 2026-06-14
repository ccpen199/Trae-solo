import { useState, useEffect, useMemo } from 'react'
import {
  ShieldCheck,
  ClipboardCheck,
  BookOpen,
  FileText,
  Plus,
  Loader2,
  X,
  Truck,
  Clock,
  Check,
  XCircle,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  CloudLightning,
  Download,
  MapPin,
  Route,
  CalendarDays,
  FileSpreadsheet,
  AlertTriangle,
  CircleCheck,
  CircleDot,
  Eye,
  Archive,
  Weight,
  User,
  Phone,
  Gauge,
  Thermometer,
  CloudSun,
  Building,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { requestRaw } from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'

interface SafetyCheck {
  id: string
  order_id: string
  driver_id: string
  check_items: string
  photos?: string
  status: string
  checked_at: string
  waybill_no?: string
  driver_name?: string
}

interface CheckItem {
  name: string
  pass: boolean
}

interface DrivingLog {
  id: string
  driver_id: string
  order_id?: string
  start_time: string
  end_time?: string
  mileage: number
  weather: string
  road_condition: string
  remarks?: string
  waybill_no?: string
  driver_name?: string
}

interface Waybill {
  id: string
  order_id: string
  waybill_no: string
  electronic_data?: string
  archived_at: string
  order_waybill_no?: string
  origin?: string
  destination?: string
  total_fee?: number
  driver_name?: string
  shipper_name?: string
}

type TabKey = 'checks' | 'logs' | 'waybills'

const checkStatusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  pass: { variant: 'success', label: '检查通过' },
  fail: { variant: 'error', label: '未通过' },
  pending: { variant: 'warning', label: '待检查' },
}

const weatherOptions = [
  { value: '晴', label: '晴', icon: Sun },
  { value: '多云', label: '多云', icon: CloudSun },
  { value: '阴', label: '阴', icon: Cloud },
  { value: '小雨', label: '小雨', icon: CloudRain },
  { value: '中雨', label: '中雨', icon: CloudRain },
  { value: '大雨', label: '大雨', icon: CloudLightning },
  { value: '雪', label: '雪', icon: CloudSnow },
  { value: '雾', label: '雾', icon: Wind },
]

const roadConditionOptions = [
  { value: '高速畅通', label: '高速畅通' },
  { value: '国道顺畅', label: '国道顺畅' },
  { value: '市区拥堵', label: '市区拥堵' },
  { value: '施工缓行', label: '施工缓行' },
  { value: '山路崎岖', label: '山路崎岖' },
  { value: '路面湿滑', label: '路面湿滑' },
  { value: '冰雪路面', label: '冰雪路面' },
]

const defaultCheckItems: CheckItem[] = [
  { name: '轮胎气压', pass: true },
  { name: '刹车系统', pass: true },
  { name: '灯光信号', pass: true },
  { name: '雨刮器', pass: true },
  { name: '灭火器', pass: true },
  { name: '三角警示牌', pass: true },
  { name: '行驶证', pass: true },
  { name: '驾驶证', pass: true },
  { name: '道路运输证', pass: true },
  { name: '从业资格证', pass: true },
  { name: '燃油/电量', pass: true },
  { name: '货物捆绑', pass: true },
]

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

const WeatherIcon = ({ weather, className = 'h-4 w-4' }: { weather: string; className?: string }) => {
  const item = weatherOptions.find((w) => w.value === weather)
  if (!item) return <Sun className={className} />
  const Icon = item.icon
  return <Icon className={className} />
}

const formatDuration = (start: string, end?: string) => {
  if (!end) return '进行中'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const mins = Math.round(ms / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}分钟`
  return `${h}小时${m}分钟`
}

export default function Safety() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabKey>('checks')
  const [checks, setChecks] = useState<SafetyCheck[]>([])
  const [logs, setLogs] = useState<DrivingLog[]>([])
  const [waybills, setWaybills] = useState<Waybill[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showCheckForm, setShowCheckForm] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)
  const [showWaybillDetail, setShowWaybillDetail] = useState<Waybill | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [checkForm, setCheckForm] = useState<{
    order_id: string
    check_items: CheckItem[]
    status: string
  }>({
    order_id: '',
    check_items: defaultCheckItems.map((i) => ({ ...i })),
    status: 'pass',
  })

  const [logForm, setLogForm] = useState({
    order_id: '',
    start_time: '',
    end_time: '',
    mileage: '',
    weather: '晴',
    road_condition: '高速畅通',
    remarks: '',
  })

  const isDriver = user?.role === 'driver'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const headers = getAuthHeaders()
      const [checksRes, logsRes, waybillsRes] = await Promise.all([
        requestRaw<{ success: boolean; list: SafetyCheck[] }>('/api/safety/checks?pageSize=100', { method: 'GET', headers }),
        requestRaw<{ success: boolean; list: DrivingLog[] }>('/api/safety/logs?pageSize=100', { method: 'GET', headers }),
        requestRaw<{ success: boolean; list: Waybill[] }>('/api/safety/waybills?pageSize=100', { method: 'GET', headers }),
      ])
      setChecks(checksRes.list || [])
      setLogs(logsRes.list || [])
      setWaybills(waybillsRes.list || [])
    } catch (err) {
      console.error('Load data failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkForm.order_id.trim()) {
      alert('请填写关联运单ID')
      return
    }
    const allPass = checkForm.check_items.every((i) => i.pass)
    setSubmitting(true)
    try {
      const headers = getAuthHeaders()
      await requestRaw<{ success: boolean }>('/api/safety/checks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: checkForm.order_id.trim(),
          check_items: checkForm.check_items,
          photos: [],
          status: allPass ? 'pass' : 'fail',
        }),
      })
      setShowCheckForm(false)
      setCheckForm({
        order_id: '',
        check_items: defaultCheckItems.map((i) => ({ ...i })),
        status: 'pass',
      })
      await loadData()
    } catch (err: any) {
      alert(err.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logForm.start_time) {
      alert('请填写出车时间')
      return
    }
    setSubmitting(true)
    try {
      const headers = getAuthHeaders()
      const payload: any = {
        order_id: logForm.order_id.trim() || null,
        start_time: logForm.start_time,
        mileage: Number(logForm.mileage) || 0,
        weather: logForm.weather,
        road_condition: logForm.road_condition,
        remarks: logForm.remarks,
      }
      if (logForm.end_time) payload.end_time = logForm.end_time
      await requestRaw<{ success: boolean }>('/api/safety/logs', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      setShowLogForm(false)
      setLogForm({
        order_id: '',
        start_time: '',
        end_time: '',
        mileage: '',
        weather: '晴',
        road_condition: '高速畅通',
        remarks: '',
      })
      await loadData()
    } catch (err: any) {
      alert(err.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const headers = getAuthHeaders()
      const res = await requestRaw<any>('/api/safety/export', { method: 'GET', headers })
      const records = res.data || []
      if (records.length === 0) {
        alert('暂无可导出的记录')
        return
      }

      const headersLine = [
        '检查编号',
        '运单号',
        '司机',
        '检查时间',
        '检查结果',
        '检查项',
      ]
      const rows = records.map((r: any) => {
        const items = (() => {
          try {
            return JSON.parse(r.check_items)
          } catch {
            return []
          }
        })()
        const itemSummary = items.map((i: CheckItem) => `${i.name}:${i.pass ? '✓' : '✗'}`).join(' | ')
        return [
          r.id,
          r.waybill_no || r.order_id,
          r.driver_name || '-',
          r.checked_at?.replace('T', ' ').substring(0, 16) || '-',
          checkStatusMap[r.status]?.label || r.status,
          itemSummary,
        ]
      })

      const csvContent =
        '\uFEFF' +
        [headersLine, ...rows]
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `安全检查台账_${new Date().toISOString().substring(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const toggleCheckItem = (index: number) => {
    setCheckForm((p) => ({
      ...p,
      check_items: p.check_items.map((item, i) =>
        i === index ? { ...item, pass: !item.pass } : item
      ),
    }))
  }

  const allCheckPass = useMemo(() => checkForm.check_items.every((i) => i.pass), [checkForm.check_items])
  const passCount = checkForm.check_items.filter((i) => i.pass).length
  const totalCount = checkForm.check_items.length

  const tabs: { key: TabKey; label: string; icon: typeof ShieldCheck }[] = [
    { key: 'checks', label: '出车前检查', icon: ClipboardCheck },
    { key: 'logs', label: '行车日志', icon: BookOpen },
    { key: 'waybills', label: '电子路单', icon: FileText },
  ]

  return (
    <div>
      <PageHeader
        title="安全台账"
        action={
          activeTab === 'checks' && isDriver
            ? { label: '新建检查', icon: Plus, onClick: () => setShowCheckForm(true) }
            : activeTab === 'logs' && isDriver
            ? { label: '新建日志', icon: Plus, onClick: () => setShowLogForm(true) }
            : activeTab === 'waybills'
            ? { label: '导出', icon: Download, onClick: handleExport }
            : undefined
        }
      />

      <div className="flex gap-2 mb-4 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab.key ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {showCheckForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-navy-500" />
              出车前安全检查
            </h2>
            <button
              onClick={() => setShowCheckForm(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreateCheck} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">关联运单ID</label>
              <input
                type="text"
                value={checkForm.order_id}
                onChange={(e) => setCheckForm((p) => ({ ...p, order_id: e.target.value }))}
                required
                placeholder="请输入运单ID，如 o_001"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">检查项勾选</label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    allCheckPass ? 'bg-mint-100 text-mint-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {passCount}/{totalCount} 通过
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                {checkForm.check_items.map((item, idx) => (
                  <label
                    key={item.name}
                    className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border-2 ${
                      item.pass
                        ? 'bg-mint-50 border-mint-200 hover:bg-mint-100'
                        : 'bg-coral-50 border-coral-200 hover:bg-coral-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.pass}
                      onChange={() => toggleCheckItem(idx)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors flex-shrink-0 ${
                        item.pass ? 'bg-mint-500' : 'bg-coral-500'
                      }`}
                    >
                      {item.pass ? (
                        <Check className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${
                      item.pass ? 'text-mint-800' : 'text-coral-800'
                    }`}>
                      {item.name}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                点击检查项可切换状态，未勾选的项目标记为异常
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckForm(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-navy-500 text-white font-medium rounded-lg hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {allCheckPass ? '提交检查' : '提交（含异常项）'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showLogForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              新建行车日志
            </h2>
            <button
              onClick={() => setShowLogForm(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreateLog} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">关联运单ID（选填）</label>
              <input
                type="text"
                value={logForm.order_id}
                onChange={(e) => setLogForm((p) => ({ ...p, order_id: e.target.value }))}
                placeholder="请输入运单ID"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  出车时间
                </label>
                <input
                  type="datetime-local"
                  value={logForm.start_time}
                  onChange={(e) => setLogForm((p) => ({ ...p, start_time: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  收车时间（选填）
                </label>
                <input
                  type="datetime-local"
                  value={logForm.end_time}
                  onChange={(e) => setLogForm((p) => ({ ...p, end_time: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" />
                行驶里程（公里）
              </label>
              <input
                type="number"
                value={logForm.mileage}
                onChange={(e) => setLogForm((p) => ({ ...p, mileage: e.target.value }))}
                placeholder="请输入行驶里程"
                min="0"
                step="0.1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5" />
                天气情况
              </label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {weatherOptions.map((w) => {
                  const Icon = w.icon
                  return (
                    <label
                      key={w.value}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-all border-2 ${
                        logForm.weather === w.value
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="weather"
                        checked={logForm.weather === w.value}
                        onChange={() => setLogForm((p) => ({ ...p, weather: w.value }))}
                        className="sr-only"
                      />
                      <Icon className={`h-5 w-5 ${
                        logForm.weather === w.value ? 'text-amber-500' : 'text-gray-400'
                      }`} />
                      <span className={`text-xs ${
                        logForm.weather === w.value ? 'text-amber-700 font-medium' : 'text-gray-500'
                      }`}>
                        {w.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Route className="h-3.5 w-3.5" />
                路况信息
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {roadConditionOptions.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border-2 ${
                      logForm.road_condition === r.value
                        ? 'bg-navy-50 border-navy-400'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="road"
                      checked={logForm.road_condition === r.value}
                      onChange={() => setLogForm((p) => ({ ...p, road_condition: r.value }))}
                      className="sr-only"
                    />
                    <CircleDot className={`h-3.5 w-3.5 ${
                      logForm.road_condition === r.value ? 'text-navy-500' : 'text-gray-300'
                    }`} />
                    <span className={`text-xs ${
                      logForm.road_condition === r.value ? 'text-navy-700 font-medium' : 'text-gray-600'
                    }`}>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">备注信息（选填）</label>
              <textarea
                value={logForm.remarks}
                onChange={(e) => setLogForm((p) => ({ ...p, remarks: e.target.value }))}
                rows={2}
                placeholder="记录途中异常、装卸情况等..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                保存日志
              </button>
            </div>
          </form>
        </div>
      )}

      {showWaybillDetail && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-navy-500" />
              电子路单详情
            </h2>
            <button
              onClick={() => setShowWaybillDetail(null)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-navy-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-navy-400">路单编号</span>
                <span className="text-sm font-bold text-navy-600 font-mono">
                  {showWaybillDetail.waybill_no}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-navy-700">
                <MapPin className="h-4 w-4 text-mint-500" />
                <span>{showWaybillDetail.origin}</span>
                <Route className="h-3 w-3 text-gray-400" />
                <span>{showWaybillDetail.destination}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  司机
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {showWaybillDetail.driver_name || '-'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  货主
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {showWaybillDetail.shipper_name || '-'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Weight className="h-3 w-3" />
                  运费
                </p>
                <p className="text-sm font-bold text-amber-600">
                  ¥{showWaybillDetail.total_fee?.toFixed(2) || '-'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  归档时间
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {showWaybillDetail.archived_at?.substring(0, 16)}
                </p>
              </div>
            </div>

            {showWaybillDetail.electronic_data && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  电子存根数据
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                    {JSON.stringify(
                      (() => {
                        try {
                          return JSON.parse(showWaybillDetail.electronic_data!)
                        } catch {
                          return showWaybillDetail.electronic_data
                        }
                      })(),
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'checks' && (
            checks.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                message="暂无出车前检查记录"
                description={isDriver ? "点击右上角新建检查" : undefined}
              />
            ) : (
              <div className="space-y-3">
                {checks.map((check) => {
                  const s = checkStatusMap[check.status]
                  const items: CheckItem[] = (() => {
                    try {
                      return JSON.parse(check.check_items)
                    } catch {
                      return []
                    }
                  })()
                  const passCnt = items.filter((i) => i.pass).length
                  const totalCnt = items.length
                  return (
                    <div
                      key={check.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            check.status === 'pass' ? 'bg-mint-50' : 'bg-coral-50'
                          }`}>
                            {check.status === 'pass' ? (
                              <CircleCheck className="h-5 w-5 text-mint-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-coral-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {check.waybill_no ? `运单 ${check.waybill_no}` : check.order_id}
                            </p>
                            {check.driver_name && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {check.driver_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {s && <StatusBadge variant={s.variant}>{s.label}</StatusBadge>}
                          <span className="text-xs text-gray-400">
                            {passCnt}/{totalCnt} 项通过
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {items.slice(0, 8).map((item, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                              item.pass
                                ? 'bg-mint-50 text-mint-700'
                                : 'bg-coral-50 text-coral-700'
                            }`}
                          >
                            {item.pass ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {item.name}
                          </span>
                        ))}
                        {items.length > 8 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                            +{items.length - 8} 项
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {check.checked_at?.substring(0, 16)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {activeTab === 'logs' && (
            logs.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                message="暂无行车日志"
                description={isDriver ? "点击右上角新建日志" : undefined}
              />
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          log.end_time ? 'bg-navy-50' : 'bg-amber-50'
                        }`}>
                          <Truck className={`h-5 w-5 ${
                            log.end_time ? 'text-navy-500' : 'text-amber-500 animate-pulse'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {log.end_time ? '行程已完成' : '运输中'}
                            </p>
                            {!log.end_time && (
                              <StatusBadge variant="warning">进行中</StatusBadge>
                            )}
                          </div>
                          {log.waybill_no && (
                            <p className="text-xs text-gray-500 font-mono">
                              运单: {log.waybill_no}
                            </p>
                          )}
                          {log.driver_name && !isDriver && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.driver_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">行驶时长</p>
                        <p className="text-sm font-bold text-navy-500">
                          {formatDuration(log.start_time, log.end_time)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="p-2.5 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          行驶里程
                        </p>
                        <p className="text-sm font-semibold text-gray-800">{log.mileage} km</p>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <Sun className="h-3 w-3" />
                          天气 / 路况
                        </p>
                        <div className="flex items-center gap-2">
                          <WeatherIcon weather={log.weather} className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs text-gray-700">
                            {log.weather} · {log.road_condition}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                      <div>
                        <span className="text-gray-400">出车：</span>
                        <span className="text-gray-700">{log.start_time?.replace('T', ' ').substring(0, 16)}</span>
                      </div>
                      {log.end_time && (
                        <div>
                          <span className="text-gray-400">收车：</span>
                          <span className="text-gray-700">{log.end_time?.replace('T', ' ').substring(0, 16)}</span>
                        </div>
                      )}
                    </div>

                    {log.remarks && (
                      <div className="mt-2 pt-2 border-t border-gray-50">
                        <p className="text-xs text-gray-500 italic">💬 {log.remarks}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'waybills' && (
            waybills.length === 0 ? (
              <EmptyState icon={FileText} message="暂无电子路单归档" />
            ) : (
              <div className="space-y-3">
                {waybills.map((wb) => (
                  <div
                    key={wb.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-navy-50 flex items-center justify-center">
                          <Archive className="h-5 w-5 text-navy-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy-600 font-mono">{wb.waybill_no}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-mint-500" />
                            <span className="text-xs text-gray-600">
                              {wb.origin} → {wb.destination}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowWaybillDetail(wb)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-navy-50 text-navy-600 rounded-lg hover:bg-navy-100 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        详情
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-400">司机</p>
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {wb.driver_name || '-'}
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-400">运费</p>
                        <p className="text-xs font-bold text-amber-600">
                          ¥{wb.total_fee?.toFixed(2) || '-'}
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-400">归档</p>
                        <p className="text-xs font-medium text-gray-800">
                          {wb.archived_at?.substring(5, 10)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-300" />
                        <span className="text-xs text-gray-400">货主: {wb.shipper_name || '-'}</span>
                      </div>
                      <StatusBadge variant="success">已归档</StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {exporting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 shadow-xl flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
            <span className="text-sm text-gray-700">正在导出...</span>
          </div>
        </div>
      )}
    </div>
  )
}
