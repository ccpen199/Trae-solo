import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  RefreshCw,
  Bus,
  Palmtree,
  HeartPulse,
  Dumbbell,
  TrainFront,
  Landmark,
  Stethoscope,
  BookOpen,
  Wallet,
  Grid3X3,
  User,
  CreditCard,
  Clock,
} from 'lucide-react'
import { citizenCodes } from '../data/mockData'

const codeTabs = [
  { key: 'bus', name: '市民乘车码', icon: Bus, prefix: 'HZ-BUS' },
  { key: 'tour', name: '文旅体验码', icon: Palmtree, prefix: 'HZ-TOUR' },
  { key: 'med', name: '医保电子码', icon: HeartPulse, prefix: 'HZ-MED' },
  { key: 'campus', name: '校园健身码', icon: Dumbbell, prefix: 'HZ-CAM' },
]

const serviceEntries = [
  { name: '公交出行', icon: Bus, color: 'bg-blue-500' },
  { name: '地铁乘车', icon: TrainFront, color: 'bg-green-500' },
  { name: '景区入园', icon: Landmark, color: 'bg-amber-500' },
  { name: '医保结算', icon: Stethoscope, color: 'bg-red-500' },
  { name: '校园健身', icon: Dumbbell, color: 'bg-purple-500' },
  { name: '图书借阅', icon: BookOpen, color: 'bg-teal-500' },
  { name: '市民充值', icon: Wallet, color: 'bg-orange-500' },
  { name: '更多服务', icon: Grid3X3, color: 'bg-gray-500' },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '正常', className: 'bg-green-100 text-green-700' },
  inactive: { label: '未激活', className: 'bg-gray-100 text-gray-600' },
  expired: { label: '已过期', className: 'bg-red-100 text-red-600' },
}

const typeBorderColors: Record<string, string> = {
  '市民乘车码': 'border-l-blue-500',
  '文旅体验码': 'border-l-amber-500',
  '医保电子码': 'border-l-red-500',
  '校园健身码': 'border-l-purple-500',
}

export default function CitizenCode() {
  const [activeTab, setActiveTab] = useState('bus')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeCodeId, setActiveCodeId] = useState('cc001')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const activePrefix = codeTabs.find((t) => t.key === activeTab)?.prefix ?? 'HZ-BUS'
  const qrValue = `${activePrefix}-2026-ZHANGSAN-001`

  const formatTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      {/* QR Code Card */}
      <div className="overflow-hidden rounded-2xl bg-bg-card shadow-lg">
        <div className="bg-gradient-to-r from-hangzhou-lake to-hangzhou-blue px-6 py-5 text-white">
          <h2 className="text-xl font-bold">杭州市民码</h2>
          <p className="mt-1 text-sm text-white/80">多码融合 · 一码通城</p>
        </div>

        <div className="flex flex-col items-center px-6 py-6">
          <div className="rounded-xl border-2 border-gray-100 bg-white p-4">
            <QRCodeSVG value={qrValue} size={200} />
          </div>

          <p className="mt-4 text-sm text-text-secondary">扫码即用 · 一码通行</p>

          <div className="mt-4 flex items-center gap-6 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              姓名：张三
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard size={14} />
              身份证：3301****1234
            </span>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary">
            <Clock size={12} />
            {formatTime(currentTime)}
          </div>

          <button
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-dark"
            onClick={() => setCurrentTime(new Date())}
          >
            <RefreshCw size={14} />
            刷新二维码
          </button>
        </div>
      </div>

      {/* Code Switcher Tabs */}
      <div className="grid grid-cols-4 gap-3">
        {codeTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'bg-bg-card text-text-secondary hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{tab.name}</span>
            </button>
          )
        })}
      </div>

      {/* Code Detail Cards */}
      <div className="grid grid-cols-2 gap-4">
        {citizenCodes.map((code) => {
          const status = statusConfig[code.status]
          const border = typeBorderColors[code.name] ?? 'border-l-gray-400'
          const isActive = activeCodeId === code.id
          return (
            <button
              key={code.id}
              onClick={() => setActiveCodeId(code.id)}
              className={`rounded-xl border-l-4 bg-bg-card p-4 text-left shadow-sm transition-all hover:shadow-md ${border} ${
                isActive ? 'ring-2 ring-primary/40' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">{code.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-text-secondary">{code.code}</p>
              {code.balance > 0 && (
                <p className="mt-1 text-xs text-hangzhou-gold">
                  余额：¥{code.balance.toFixed(2)}
                </p>
              )}
              <p className="mt-1 text-xs text-text-secondary">有效期至 {code.expiryDate}</p>
            </button>
          )
        })}
      </div>

      {/* Service Entrance Grid */}
      <div className="rounded-2xl bg-bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-text-primary">便捷服务</h3>
        <div className="grid grid-cols-4 gap-4">
          {serviceEntries.map((svc) => {
            const Icon = svc.icon
            return (
              <button
                key={svc.name}
                className="flex flex-col items-center gap-2 rounded-xl py-3 transition-all hover:bg-gray-50 hover:shadow-sm"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${svc.color}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs text-text-secondary">{svc.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
