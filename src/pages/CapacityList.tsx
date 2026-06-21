import { useState } from 'react'
import { useAppStore } from '@/store'
import {
  Search,
  Filter,
  Star,
  Shield,
  Award,
  ArrowUpDown,
  Truck,
  User,
  Phone,
  FileCheck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  ArrowRight,
  Zap,
  TrendingUp,
  Eye,
  MessageSquare,
} from 'lucide-react'
import type { Capacity } from '@/types'

const levelInfo = {
  gold: { label: '金牌', desc: '最优推荐', className: 'from-amber-400 to-amber-500 text-white', badge: 'bg-gradient-to-r from-amber-400 to-amber-500 text-white', ring: 'ring-amber-200' },
  silver: { label: '银牌', desc: '优质合作', className: 'from-slate2-400 to-slate2-500 text-white', badge: 'bg-gradient-to-r from-slate2-400 to-slate2-500 text-white', ring: 'ring-slate2-200' },
  normal: { label: '普通', desc: '合格运力', className: 'from-slate2-300 to-slate2-400 text-white', badge: 'bg-slate2-200 text-slate2-600', ring: 'ring-slate2-100' },
}

export default function CapacityList() {
  const { capacities } = useAppStore()
  const [tab, setTab] = useState<'all' | 'gold' | 'silver' | 'normal'>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'credit' | 'fulfillment' | 'orders'>('credit')

  const filtered = capacities
    .filter((c) => {
      if (tab !== 'all' && c.level !== tab) return false
      if (search && !c.name.includes(search) && !c.contactPerson.includes(search)) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'credit') return b.creditScore - a.creditScore
      if (sortBy === 'fulfillment') return b.fulfillmentRate - a.fulfillmentRate
      return b.totalOrders - a.totalOrders
    })

  const stats = [
    { k: 'all', label: '全部运力', count: capacities.length, icon: Truck },
    { k: 'gold', label: '金牌认证', count: capacities.filter(c => c.level === 'gold').length, icon: Award },
    { k: 'silver', label: '银牌认证', count: capacities.filter(c => c.level === 'silver').length, icon: Shield },
    { k: 'normal', label: '普通运力', count: capacities.filter(c => c.level === 'normal').length, icon: User },
  ]

  return (
    <div className="space-y-6">
      {/* 分级筛选统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          const active = tab === s.k
          return (
            <button
              key={s.k}
              onClick={() => setTab(s.k as any)}
              className={`p-5 rounded-2xl border text-left transition-all-smooth relative overflow-hidden group ${
                active
                  ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white border-transparent shadow-xl shadow-primary-500/20 scale-[1.02]'
                  : 'bg-white border-slate2-100 hover:border-primary-200 hover:shadow-md card-hover'
              }`}
            >
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className={`text-xs font-medium mb-1 ${active ? 'text-white/80' : 'text-slate2-400'}`}>{s.label}</div>
                  <div className={`text-4xl font-extrabold font-mono tracking-tight ${active ? 'text-white' : 'text-slate2-800'}`}>
                    {s.count}
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  active ? 'bg-white/15 text-white' : 'bg-primary-50 text-primary-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className={`mt-3 flex items-center gap-1 text-[11px] ${active ? 'text-white/70' : 'text-slate2-400'}`}>
                <TrendingUp className="w-3 h-3" />
                {active ? '当前筛选视图' : '点击查看筛选'}
              </div>
            </button>
          )
        })}
      </div>

      {/* 工具栏 */}
      <div className="card-base p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate2-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索运力名称、联系人、车牌号..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate2-50 border border-transparent text-sm focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all-smooth"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate2-50 border border-slate2-100 text-xs text-slate2-600">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent focus:outline-none cursor-pointer">
              <option value="credit">按信用分排序</option>
              <option value="fulfillment">按履约率排序</option>
              <option value="orders">按完成单量排序</option>
            </select>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate2-100 text-xs text-slate2-600 hover:bg-slate2-50 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            高级筛选
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-50 border border-primary-200 text-primary-600 text-xs font-medium hover:bg-primary-100 transition-colors">
            <FileCheck className="w-3.5 h-3.5" />
            资质审核 ({capacities.filter(c => c.certifications.some(ct => ct.status === 'pending')).length})
          </button>
        </div>
      </div>

      {/* 运力卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {filtered.map((cap) => (
          <CapacityCard key={cap.id} capacity={cap} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card-base py-20 text-center text-slate2-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">暂无匹配的运力数据</p>
        </div>
      )}
    </div>
  )
}

function CapacityCard({ capacity }: { capacity: Capacity }) {
  const info = levelInfo[capacity.level]
  const creditPercent = (capacity.creditScore / 1000) * 100
  const circumference = 2 * Math.PI * 28
  const strokeDashoffset = circumference - (circumference * creditPercent) / 100

  return (
    <div className="card-base overflow-hidden card-hover group">
      {/* 顶部渐变色带 */}
      <div className={`h-2 bg-gradient-to-r ${info.className}`} />

      <div className="p-5">
        {/* 头部信息 */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${info.className} flex items-center justify-center text-2xl font-bold ring-4 ${info.ring} flex-shrink-0 shadow-md`}>
            {capacity.name.charAt(0)}
            {capacity.level === 'gold' && (
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-bold text-slate2-800 truncate">{capacity.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${info.badge} flex-shrink-0`}>
                {info.label}
              </span>
              <span className={`text-[9px] px-1 py-0.5 rounded ${
                capacity.type === 'fleet'
                  ? 'bg-primary-50 text-primary-600'
                  : 'bg-blue-50 text-blue-600'
              }`}>
                {capacity.type === 'fleet' ? '车队' : '司机'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate2-400 mb-1">
              {capacity.type === 'driver' ? (
                <span className="font-mono">{capacity.licensePlate} · {capacity.vehicleType}</span>
              ) : (
                <span>{capacity.vehicleType} · 最大{capacity.maxWeight}吨</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(capacity.rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate2-200'
                  }`}
                />
              ))}
              <span className="ml-1 text-slate2-600 font-bold font-mono">{capacity.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* 信用分环形图 */}
        <div className="bg-gradient-to-br from-slate2-50 to-white rounded-xl p-4 mb-4 border border-slate2-100">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#ECEEF1" strokeWidth="5" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={capacity.level === 'gold' ? 'url(#goldGrad)' : capacity.level === 'silver' ? '#808C9C' : '#16C79A'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#FBBF24" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-slate2-800 font-mono leading-none">{capacity.creditScore}</span>
                <span className="text-[9px] text-slate2-400 mt-0.5">信用分</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate2-500">履约率</span>
                <span className="font-bold text-success-600 font-mono">{capacity.fulfillmentRate}%</span>
              </div>
              <div className="h-1.5 bg-slate2-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full"
                  style={{ width: `${capacity.fulfillmentRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate2-500">历史完成</span>
                <span className="font-bold text-primary-600 font-mono">{capacity.totalOrders} 单</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate2-500">入驻时间</span>
                <span className="font-mono text-slate2-600">{capacity.joinedDate.slice(0, 7)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 资质信息 */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-slate2-500 uppercase tracking-wider mb-2">资质认证</div>
          <div className="flex flex-wrap gap-1.5">
            {capacity.certifications.slice(0, 4).map((cert, i) => (
              <span
                key={i}
                className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  cert.status === 'valid'
                    ? 'bg-success-50 text-success-600'
                    : cert.status === 'pending'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-accent-50 text-accent-600'
                }`}
              >
                {cert.status === 'valid' && <CheckCircle2 className="w-2.5 h-2.5" />}
                {cert.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                {cert.status === 'expired' && <AlertTriangle className="w-2.5 h-2.5" />}
                {cert.type.length > 6 ? cert.type.slice(0, 6) + '...' : cert.type}
              </span>
            ))}
            {capacity.certifications.length > 4 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate2-50 text-slate2-500">
                +{capacity.certifications.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* 返程车源标识 */}
        {capacity.isReturnSource && capacity.returnRoute && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-primary-50 border border-violet-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs font-semibold text-violet-700">近期返程车源</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="px-1.5 py-0.5 rounded bg-white text-slate2-700 border border-slate2-200">
                {capacity.returnRoute.from}
              </span>
              <ArrowRight className="w-3 h-3 text-violet-400" />
              <span className="px-1.5 py-0.5 rounded bg-white text-slate2-700 border border-slate2-200">
                {capacity.returnRoute.to}
              </span>
              {capacity.returnRoute.pricePerTon && (
                <span className="ml-auto font-bold text-violet-600 font-mono">¥{capacity.returnRoute.pricePerTon}/吨</span>
              )}
            </div>
            <div className="text-[10px] text-slate2-400 mt-1">
              可预约装货日: {capacity.returnRoute.availableDate}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate2-50">
          <button className="flex-1 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-semibold hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all-smooth flex items-center justify-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            联系派单
          </button>
          <button className="w-9 h-9 rounded-lg bg-slate2-50 text-slate2-500 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-lg bg-slate2-50 text-slate2-500 hover:bg-slate2-100 hover:text-slate2-600 transition-colors flex items-center justify-center flex-shrink-0">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
